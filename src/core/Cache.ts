import { Resource } from 'cesium'
import {LocalStore} from "./LocalStore.ts";

interface CesiumResource {
    url: string
    extension: string
}

export const useBlobCache = (config?: {
    extensions?: string[],
    callback?: (_Resource: CesiumResource) => boolean
},) => {

    // const Resource = window.Cesium.Resource

    const {fetchBlob,fetchArrayBuffer} = Resource.prototype
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

		Resource.prototype.fetchArrayBuffer = async function () {




			const flag = callback ? callback(this) : shouldCache(this)

			if (!flag) {
				// @ts-ignore
				return fetchArrayBuffer.call(this, ...options) as ArrayBuffer ;
			}

			const cachedValue = await LocalStore.getCacheByUrl(this.url) as ArrayBuffer
			if (cachedValue) {
				return cachedValue

			}

			const result = await fetchArrayBuffer.call(this)  as ArrayBuffer

			if (result) {
				 LocalStore.setCacheToLocal(this.url, result)
				// console.info('fetchArrayBuffer', this.url,result)
			}

			return result
		}
    }

}

