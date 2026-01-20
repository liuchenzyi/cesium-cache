// 二进制数据缓存类，基于 IndexedDB 实现，用于高效缓存 ArrayBuffer 和 Blob 类型的数据
// 使用 LRU（最近最少使用）算法管理缓存空间，并支持自适应存储空间估算
import { type IDBPDatabase, openDB } from 'idb'

// 定义缓存数据类型：ArrayBuffer、Blob 或 null（表示删除操作）
type CacheData = ArrayBuffer | Blob | null;
type DataType = 'arraybuffer' | 'blob' | 'null';

// 缓存条目接口定义
interface CacheEntry {
    key: string;          // 缓存键值
    data: ArrayBuffer | Blob;  // 实际缓存的数据
    size: number;         // 数据大小（字节）
    accessedAt: number;   // 最后访问时间戳，用于 LRU 算法
    dataType: DataType;   // 数据类型标识
}

// 缓存选项接口定义
interface BinaryCacheOptions {
    /** 数据库名称 */
    dbName?: string;
    /** 存储表名 */
    storeName?: string;
    /** 用户期望的最大缓存大小（字节） */
    maxCacheSize: number;
    /** 是否启用存储空间自适应（默认 true） */
    enableStorageEstimate?: boolean;
}

// 默认选项配置
const DEFAULT_OPTIONS: Required<Omit<BinaryCacheOptions, 'maxCacheSize'>> = {
    dbName: 'BinaryFileCache',
    storeName: 'files',
    enableStorageEstimate: true
}

export class BinaryCache {
    private options: Required<BinaryCacheOptions>
    private dbPromise: Promise<IDBPDatabase> | null = null

    constructor(options: BinaryCacheOptions) {
        if (options.maxCacheSize <= 0) {
            throw new Error('maxCacheSize must be greater than 0')
        }
        this.options = { ...DEFAULT_OPTIONS, ...options }
    }

    // --- 初始化数据库 ---
    // 打开或创建 IndexedDB 数据库，并设置对象存储结构
    private async getDB(): Promise<IDBPDatabase> {
        if (!this.dbPromise) {
            this.dbPromise = openDB(this.options.dbName, 1, {
                upgrade(db) {
                    const storeName = DEFAULT_OPTIONS.storeName
                    if (!db.objectStoreNames.contains(storeName)) {
                        // 创建对象存储，以 key 作为主键
                        const store = db.createObjectStore(storeName, { keyPath: 'key' })
                        // 创建按访问时间排序的索引，用于 LRU 淘汰算法
                        store.createIndex('by_accessed', 'accessedAt', { unique: false })
                    }
                }
            })
        }
        return this.dbPromise
    }

    // --- 工具：计算数据大小 ---
    // 计算给定数据的实际大小（字节），用于缓存空间管理
    private getDataSize(data: CacheData): number {
        if (data instanceof ArrayBuffer) return data.byteLength
        if (data instanceof Blob) return data.size
        return 0 // null
    }

    // --- 工具：获取实际允许的最大缓存大小 ---
    // 根据用户配置和浏览器可用存储空间计算实际最大缓存大小
    private async getEffectiveMaxSize(): Promise<number> {
        const userMax = this.options.maxCacheSize

        if (!this.options.enableStorageEstimate || typeof navigator.storage?.estimate !== 'function') {
            return userMax
        }

        try {
            // 获取浏览器存储使用情况估计
            const estimate = await navigator.storage.estimate()
            const quota = estimate.quota
            const usage = estimate.usage

            if (quota == null || usage == null) return userMax

            // 计算可用空间
            const available = quota - usage
            // 实际允许缓存大小 = min(用户配置, 可用空间 * 0.8)，保留20%空间避免占满
            const adaptiveMax = Math.min(userMax, Math.floor(available * 0.8))
            return Math.max(0, adaptiveMax)
        } catch (err) {
            console.warn('Failed to get storage estimate, fallback to user config:', err)
            return userMax
        }
    }

    // --- 工具：获取总已用大小 ---
    // 统计当前缓存中所有条目的总大小
    private async getTotalSize(db: IDBPDatabase): Promise<number> {
        const store = db.transaction(this.options.storeName, 'readonly').objectStore(this.options.storeName)

        // 使用游标遍历所有条目，避免一次性加载全部数据到内存
        let totalSize = 0
        const cursor = await store.openCursor()

        if (cursor) {
            do {
                totalSize += cursor.value.size
            } while (await cursor.continue())
        }

        return totalSize
    }

    // --- 工具：获取最旧条目 ---
    // 通过按访问时间排序的索引获取最早访问的条目（即最久未使用的条目）
    private async getOldestEntry(db: IDBPDatabase): Promise<CacheEntry | null> {
        const tx = db.transaction(this.options.storeName, 'readonly')
        const index = tx.objectStore(this.options.storeName).index('by_accessed')
        // 打开游标获取索引中的第一个条目（访问时间最早的）
        const cursor = await index.openCursor()
        return cursor?.value ?? null
    }

    // --- 核心：淘汰直到有足够空间 ---
    // 当缓存空间不足时，根据 LRU 算法删除最旧的条目，直到有足够的空间容纳新数据
    private async evictUntilFree(db: IDBPDatabase, neededSize: number): Promise<void> {
        const effectiveMax = await this.getEffectiveMaxSize()
        if (neededSize > effectiveMax) {
            console.warn(`Item too large (${neededSize} bytes) for effective cache limit (${effectiveMax})`)
            return
        }

        // 获取当前已用缓存大小
        let totalSize = await this.getTotalSize(db)
        // 循环删除最旧条目直到有足够空间
        while (totalSize + neededSize > effectiveMax) {
            const oldest = await this.getOldestEntry(db)
            if (!oldest) break

            // 从数据库中删除最旧条目
            await db.delete(this.options.storeName, oldest.key)
            // 更新总大小
            totalSize -= oldest.size
        }
    }

    // --- 公共 API：写入缓存 ---
    // 将数据写入缓存，如果缓存空间不足则自动执行 LRU 淘汰
    async put(key: string, data: CacheData): Promise<void> {
        if (typeof key !== 'string' || key.length === 0) {
            throw new Error('Key must be a non-empty string')
        }

        const db = await this.getDB()

        // 处理 null 值：直接删除对应键的缓存项
        if (data === null) {
            await db.delete(this.options.storeName, key)
            return
        }

        // 计算数据大小和类型
        const size = this.getDataSize(data)
        const dataType: DataType = data instanceof ArrayBuffer ? 'arraybuffer' : 'blob'

        // 删除旧值（避免重复计算大小）
        await db.delete(this.options.storeName, key)

        // 在插入新数据前，确保有足够的缓存空间
        await this.evictUntilFree(db, size)

        // 将新数据写入缓存，记录当前时间为最后访问时间
        await db.put(this.options.storeName, {
            key,
            data,
            size,
            accessedAt: Date.now(),  // 设置当前时间为访问时间
            dataType
        })
    }

    // --- 公共 API：读取缓存 ---
    // 从缓存中读取指定键的数据，并更新其访问时间以维持 LRU 算法准确性
    async get(key: string): Promise<CacheData> {
        const db = await this.getDB()
        const entry = await db.get(this.options.storeName, key)
        if (!entry) return null

        // 更新访问时间（提升该条目优先级，避免被 LRU 淘汰）
        entry.accessedAt = Date.now()
        await db.put(this.options.storeName, entry)

        return entry.data
    }

    // --- 公共 API：删除单个条目 ---
    // 从缓存中删除指定键的条目
    async delete(key: string): Promise<void> {
        const db = await this.getDB()
        await db.delete(this.options.storeName, key)
    }

    // --- 公共 API：清空缓存 ---
    // 清空整个缓存存储
    async clear(): Promise<void> {
        const db = await this.getDB()
        await db.clear(this.options.storeName)
    }

    // --- 公共 API：获取当前缓存统计 ---
    // 返回缓存使用情况统计信息
    async stats() {
        const db = await this.getDB()
        const totalSize = await this.getTotalSize(db)
        const effectiveMax = await this.getEffectiveMaxSize()
        return {
            usedBytes: totalSize,              // 已使用字节数
            maxBytes: effectiveMax,            // 最大允许字节数
            usagePercent: Math.round((totalSize / effectiveMax) * 100)  // 使用百分比
        }
    }
}
