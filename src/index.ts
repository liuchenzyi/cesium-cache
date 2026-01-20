import { BinaryCache } from './utils/BinaryCache.ts'


type ResponseType = 'arraybuffer' | 'blob'

interface CacheConfig {
    dbName?: string
    maxCacheSize?: number
    key?: (
        url: string,
        responseType: string,
        method: 'GET' | 'POST',
        data: object | undefined,
        headers: object | undefined
    ) => string // 回调，生成缓存的 key
    types?: Array<ResponseType> // 需要缓存的类型 数据类型
}

type Resource = typeof window.Cesium.Resource


// 类型定义,覆盖 Cesium.Resource._Implementations.loadWithXhr 方法  cesium 的请求基本上都是走这个方法


interface CesiumResource extends Resource {
    _Implementations: {
        loadWithXhr: (
            url: string,
            responseType: ResponseType,
            method: 'GET' | 'POST',
            data: object | undefined,
            headers: object | undefined,
            deferred: {
                promise: Promise<any>
                reject: (reason?: any) => void
                resolve: (value?: any) => void
            },
            overrideMimeType: string | undefined
        ) => any
    }
}

export const useCesiumCache = (
    config: CacheConfig = {
        types: ['blob', 'arraybuffer']
    },
    Resource?: Resource
) => {


    if (!Resource) {
        if (typeof window !== 'undefined' && window.Cesium && window.Cesium.Resource) {
            // 从 window 对象中获取 Resource
            Resource = window.Cesium.Resource as CesiumResource
        } else {
            // throw new Error('Resource is not defined')
            console.error('Resource is not defined Failed to enable caching')
            return
        }
    }

    const cache = new BinaryCache({
        dbName: config.dbName || 'CesiumCache',
        storeName: 'files',
        maxCacheSize:  config.maxCacheSize || 500 * 1024 * 1024, // 500 MB
        enableStorageEstimate: true
    })


    const _Resource = Resource as CesiumResource

    const types = config.types || ['blob', 'arraybuffer']


    const loadWithXhr = _Resource._Implementations.loadWithXhr
    _Resource._Implementations.loadWithXhr = (
        url,
        responseType,
        method,
        data,
        headers,
        deferred,
        overrideMimeType
    ) => {
        const key = config.key ? config.key(url, responseType, method, data, headers) : url // 默认以 url 作为 key 若 key 为 空字符串 不缓存
        if (key !== '' && types.includes(responseType)) {
            cache.get(key).then((value) => {
                if (value) {
                    deferred.resolve(value)
                } else {
                    // 缓存
                    const { promise } = deferred

                    promise.then(async (data: any) => {
                        if (data) {
                            console.log('cache', 'put', key, data)
                            await cache.put(key, data)
                        }
                    }, async (error) => {
                        console.error('cache', 'put', key, error)
                        await cache.put(key, null)
                    })
                    loadWithXhr(url, responseType, method, data, headers, deferred, overrideMimeType)
                }
            })

            return
        }

        return loadWithXhr(url, responseType, method, data, headers, deferred, overrideMimeType)
    }

    return {
        clear() {
            cache.clear()
        },
        stats() {
            return cache.stats()
        }
    }
}
