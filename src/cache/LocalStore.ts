// db.js
import Dexie, {type EntityTable} from 'dexie';

interface Cache {
    url: string;
    value: Blob | ArrayBuffer | null;
}

interface Config {
    dbName: string;
}

// 格式化使用的内存大小
export const formatMemorySize = (size: number) => {
    if (size < 1024) {
        return `${size} B`
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(2)} KB`
    }
    if (size < 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(2)} MB`
    }
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
}


export default (config: Config = {dbName: 'LocalStore'}) => {
    const {dbName = 'LocalStore'} = config;

    const db = new Dexie(dbName) as Dexie & {
        cache: EntityTable<Cache, 'url'>
    };
    db.version(1).stores({
        cache: '++id, &url, value', // id 自动生成主键，url 唯一索引
    });

    // 通过 url 获取数据
    const getCacheByUrl = async (url: string) => {
        const {value} = await db.cache.where({url}).first() || {value: null}
        return value
    }

    // 将数据 存储到数据库中
    const setCacheToLocal = async (url: string, value: Blob | ArrayBuffer) => {
        await db.cache.put({value, url})
    }

    // 清除所有 缓存
    const clearCache = async () => {
        await db.cache.clear()
    }

    // 获取已经使用的缓存大小
    const getCacheSize = async () => {
        const cache = await db.cache.toArray()
        const size = cache.reduce((total, item) => {
            if (item.value instanceof Blob) {
                return total + item.value.size
            }
            if (item.value instanceof ArrayBuffer) {
                return total + item.value.byteLength
            }
            return total
        }, 0)
        return formatMemorySize(size)
    }

    // 暴露接口
    return {
        getCacheByUrl,
        setCacheToLocal,
        clearCache,
        getCacheSize
    }
}

