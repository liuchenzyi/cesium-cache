// import type {Resource as CesiumResource} from 'cesium';
import {LocalStore} from "./LocalStore.ts";

interface CesiumResource {
    url: string
    extension: string
}

export const useBlobCache = (config?: {
    extensions?: string[],
    callback?: (_Resource: CesiumResource) => boolean
},) => {

    const Resource = window.Cesium.Resource

    const {fetchBlob} = Resource
    const shouldCache = (_Resource: CesiumResource) => {
        if (extensions) {
            return extensions.includes(_Resource.extension)
        }
        return true
    };
    const {extensions, callback} = config || {}
    if (!config) {
        Resource.prototype.fetchBlob = async function (...options) {

            const flag = callback ? callback(this) : shouldCache(this)

            if (!flag) {
                // @ts-ignore
                return fetchBlob.call(this, ...options);
            }

            const cachedValue = await LocalStore.getCacheByUrl(this.url)

            if (cachedValue) {
                return cachedValue
            }

            // @ts-ignore

            const result = await fetchBlob.call(this, ...options)

            if (result) {
                await LocalStore.setCacheToLocal(this.url, result)
            }
            return result
        }
    }

}

