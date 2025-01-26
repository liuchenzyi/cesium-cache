import useLocalStore from "./LocalStore.ts";

export interface CacheConfig {
    dbName?: string,
    extensions?: string[],  // 需要缓存的扩展名
    callback?: (_Resource: CesiumResource) => boolean  // 自定义缓存规则
}

export interface CesiumResource {
    url: string
    extension: string
    hasHeaders: boolean
    isBlobUri: boolean
    isCrossOriginUrl: boolean
    isDataUri: boolean
}

export const useCesiumCache = (config: CacheConfig = {}, Resource?: typeof window.Cesium.Resource) => {


    const {dbName = 'LocalStore'} = config

    // 创建本地存储实例 (indexDb)
    const LocalStore = useLocalStore({dbName})

    if (!Resource) {
        if (typeof window !== 'undefined' && window.Cesium && window.Cesium.Resource) {
            // 从 window 对象中获取 Resource
            Resource = window.Cesium.Resource;
        }else{
            // throw new Error('Resource is not defined')
            console.error('Resource is not defined Failed to enable caching')
            return {
                LocalStore
            }
        }
    }



    const {fetchBlob, fetchArrayBuffer} = Resource.prototype
    const shouldCache = (_Resource: CesiumResource) => {
        if (extensions) {
            return extensions.includes(_Resource.extension)
        }
        return true
    };
    const {extensions, callback} = config || {}

    // 使用 Blob 缓存
    // @ts-ignore
    Resource.prototype.fetchBlob = async function (...options) {
        const flag = callback ? callback(this) : shouldCache(this)

        if (!flag) {
            // @ts-ignore
            return fetchBlob.call(this, ...options) as Blob;
        }

        const cachedValue = await LocalStore.getCacheByUrl(this.url) as Blob;

        if (cachedValue) {
            return cachedValue
        }

        // @ts-ignore
        const result = await fetchBlob.call(this, ...options) as Blob;

        if (result) {
            LocalStore.setCacheToLocal(this.url, result)
        }

        return result
    }
    // 使用 ArrayBuffer 缓存
    Resource.prototype.fetchArrayBuffer = async function () {


        const flag = callback ? callback(this) : shouldCache(this)

        if (!flag) {
            // @ts-ignore
            return fetchArrayBuffer.call(this, ...options) as ArrayBuffer;
        }

        const cachedValue = await LocalStore.getCacheByUrl(this.url) as ArrayBuffer
        if (cachedValue) {
            return cachedValue

        }

        const result = await fetchArrayBuffer.call(this) as ArrayBuffer

        if (result) {
            LocalStore.setCacheToLocal(this.url, result)
        }

        return result
    }

    return {
        LocalStore
    }

}