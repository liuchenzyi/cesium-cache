# ⚡ cesium-cache

[![npm](https://img.shields.io/npm/v/cesium-cache.svg)](https://www.npmjs.com/package/cesium-cache)
[![npm](https://img.shields.io/npm/dt/cesium-cache)](https://www.npmjs.com/package/cesium-cache)

Cesium 缓存

通过 重写 Cesium.Resource._Implementations.loadWithXhr 方法(此方法在 Cesium.Resource 的类型下未定义)

依赖库

- `dexie`
- `cesium`

## 安装

在使用前需要 安装 `dexie`

```bash
npm i dexie  cesium-cache
# yarn add dexie cesium-cache
# pnpm add dexie cesium-cache
```

## 使用

此插件会覆盖 Cesium.Resource._Implementations.loadWithXhr 方法，由于项目引入 cesium 的方式不同
为解决这个问题，提供了第二个参数，用于传递 Resource 对象

### 使用 script 方式引入 cesium

在 main.js 或者 app.vue 添加如下代码

```js
import { useCesiumCache } from 'cesium-cache'

useCesiumCache()
```

### 使用 npm 方式引入 cesium

在 main.js 或者 app.vue 添加如下代码

```js
import * as Cesium from 'cesium'
import { useCesiumCache } from 'cesium-cache'

useCesiumCache({}, Cesium.Resource)
```

## 配置

**类型定义如下：**

```ts
type ResponseType = 'arraybuffer' | 'blob';

interface CacheConfig {
    dbName?: string;
    key?: (
        url: string,
        responseType: string,
        method: 'GET' | 'POST',
        data: object | undefined,
        headers: object | undefined
    ) => string;
    types?: Array<ResponseType>;
}

type Resource = typeof window.Cesium.Resource;
export declare const useCesiumCache: (config?: CacheConfig, Resource?: Resource) => {
    clear(): void;
    getCacheSize(): Promise<string>;
};
```


**缓存配置**

- dbName: string, indexDb 数据库名称 默认为 `LocalStore`
- key: function 用于缓存的键，默认为请求的 url，若返回空字符串 则不缓存该请求
- types: 缓存的返回值 类型 默认为 ['arraybuffer','blob']

**注意** key 与 types 配置项，将同时起作用，及 key 的结果不为空字符串时，且该请求返回值类型在 types 中 才会对结果进行缓存

**Resource**

- Resource: `Cesium.Resource` 默认为 window 下的 Cesium.Resource 对象 ，若 使用 npm 方式引入 cesium 则需要传递

**example**

```js
import { useCesiumCache } from 'cesium-cache'

useCesiumCache({
    dbName: 'cesium-cache',
    types: ['arraybuffer', 'blob'],
})
```

## methods

**clear => Promise<void>**  清除所有缓存

**getCacheSize => Promise<string>** 获取已经占用的缓存大小

**example**

```js
import { useCesiumCache } from 'cesium-cache'

const cache = useCesiumCache({
    dbName: 'cesium-cache',
    types: ['arraybuffer', 'blob'],
})

cache.getCacheSize().then((size) => {
    console.log(size)
})
cache.clear()

```

## License

MIT

## 待完成

- 缓存过期时间
- 完善测试demo

