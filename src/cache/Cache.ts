import useLocalStore from './LocalStore.ts'

export interface CacheConfig {
    dbName?: string,
    extensions?: string[],  // 需要缓存的扩展名
    key?: (Resource: typeof window.Cesium.Resource.prototype) => string,  // 返回空字符串 或 null 表示不缓存
}

export interface CesiumResource {
    url: string
    extension: string
    hasHeaders: boolean
    isBlobUri: boolean
    isCrossOriginUrl: boolean
    isDataUri: boolean
}

class CesiumCache {
    LocalStore

    getKey


    constructor(config: CacheConfig = {}, Resource: typeof window.Cesium.Resource) {


        const dbName = config.dbName || 'LocalStore'
        this.LocalStore = useLocalStore({ dbName })

        this.getKey = config.key || (Resource => Resource.url)  // 默认使用 url 作为 key

        // fetchBlob, fetchArrayBuffer,fetchImage

        // 根据配置来确定是否使用缓存

        this.overrideFetchBlob(Resource)
        this.overrideFetchImage(Resource)
        this.overrideFetchArrayBuffer(Resource)
    }

    overrideFetchBlob(Resource: typeof window.Cesium.Resource) {

        const { fetchBlob } = Resource.prototype
        const { getKey, LocalStore } = this
        Resource.prototype.fetchBlob = async function(...options) {

            const key = getKey(this)

            if (!key) {
                // @ts-ignore
                return fetchBlob.call(this, ...options) as Blob
            }

            const cachedValue = await LocalStore.getCacheByKey(key) as Blob

            if (cachedValue) {
                return cachedValue
            }

            // @ts-ignore
            const result = await fetchBlob.call(this, ...options) as Blob

            if (result) {
                LocalStore.setCacheToLocal(this.url, result)
            }

            return result
        }
    }

    // 重写
    overrideFetchImage(Resource: typeof window.Cesium.Resource) {

        const { fetchImage } = Resource.prototype
        const { getKey, LocalStore } = this
        Resource.prototype.fetchImage = async function(...options) {

            const key = getKey(this)

            if (!key) {
                // @ts-ignore
                return fetchImage.call(this, ...options) as ImageBitmap
            }

            const cachedValue = await LocalStore.getCacheByKey(key) as ImageBitmap

            if (cachedValue) {
                return cachedValue
            }


            const result = await fetchImage.call(this, ...options) as ImageBitmap | HTMLImageElement


            if (result && !(result instanceof HTMLImageElement)) {
                LocalStore.setCacheToLocal(this.url, result)
            }

            return result
        }
    }

    // 重写
    overrideFetchArrayBuffer(Resource: typeof window.Cesium.Resource) {

        const { fetchArrayBuffer } = Resource.prototype
        const { getKey, LocalStore } = this
        Resource.prototype.fetchArrayBuffer = async function(...options) {
            const key = getKey(this)

            if (!key) {
                // @ts-ignore
                return fetchArrayBuffer.call(this, ...options) as ArrayBuffer
            }

            const cachedValue = await LocalStore.getCacheByKey(key) as ArrayBuffer

            if (cachedValue) {
                return cachedValue
            }


            const result = await fetchArrayBuffer.call(this, ...options) as ArrayBuffer


            if (result && !(result instanceof HTMLImageElement)) {
                LocalStore.setCacheToLocal(this.url, result)
            }

            return result
        }

    }
}

let cache: CesiumCache
export const useCesiumCache = (config: CacheConfig = {},Resource?: typeof window.Cesium.Resource) => {
    if (!cache) {
        //  若没有传递 则从 window 对象中获取 Resource
        if (!Resource) {
            if (typeof window !== 'undefined' && window.Cesium && window.Cesium.Resource) {
                Resource = window.Cesium.Resource
            }
        }
        cache = new CesiumCache(config, Resource as typeof window.Cesium.Resource)
    }
    return cache
}