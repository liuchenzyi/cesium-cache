# ⚡ cesium-cache

[![npm](https://img.shields.io/npm/v/cesium-cache.svg)](https://www.npmjs.com/package/cesium-cache)
[![npm](https://img.shields.io/npm/dt/cesium-cache)](https://www.npmjs.com/package/cesium-cache)

Cesium 缓存

重写 `Cesium.Resource` 中的 `fetchBlob` 与 `fetchArrayBuffer` 方法来来覆盖原来的方法，在发送请求前 先从数据库中查找，若没有找到则发送请求，并把请求结果缓存到数据库中

依赖库

- `dexie`
- `cesium`

## 安装

在使用前需要 安装 `dexie`

```bash
npm i cesium cesium-cache
# yarn add cesium cesium-cache
# pnpm add cesium cesium-cache
```

## 使用

cesium 各个项目引入方法不同，有些使用 html,有些使用 npm, 此插件默认 重写 window 下的 Cesium.Resource ，若需要修改 npm
包方式引用 cesium 可以使用第二个参数 将 Resource 传递进去

### 使用 html 方式引入 cesium

在 main.js 或者 app.vue 添加如下代码

```js
import {useCesiumCache} from 'cesium-cache'

useCesiumCache()
```

### 使用 npm 方式引入 cesium

在 main.js 或者 app.vue 添加如下代码

```js
import * as Cesium from 'cesium'
import {useCesiumCache} from 'cesium-cache'

useCesiumCache({}, Cesium.Resource)
```

## 配置

`useCesiumCache` 方法接收两个参数 一个为缓存配置，第二个为 Resource 对象，均可不传
**config**

- dbName?: string, indexDb 数据库名称 默认为 `LocalStore`
- extensions?: string[], // 需要缓存的扩展名
- callback?: (_Resource: CesiumResource) => boolean // 自定义缓存规则,参数为 Resource 对象，返回 true 表示缓存，false
  表示不缓存

`callback` 的优先级更高 配置了 `callback` 后 `extensions` 的扩展名将失效

**Resource**

- Resource?: Cesium.Resource 默认为 window 下的 Cesium.Resource 对象 可以不传

**example**

```js
import {useCesiumCache} from 'cesium-cache'

useCesiumCache({
	dbName: 'cesium-cache',
	extensions: ['.jpg', '.png'],
})
```

## License

MIT


## 待完成

- 单例化
- 自定义 key
- 缓存过期时间
- 完善测试demo