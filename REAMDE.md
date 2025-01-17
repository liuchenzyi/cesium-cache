# cesium 缓存

## 技术栈

`indexDB`
`Dexie.js`

## 思路

重写 Cesium 请求 `Cesium.Resource._Implementations.loadWithXhr` 方法 ，若有缓存，则直接返回缓存数据，若没有缓存，则请求数据，并将数据缓存

区分哪些内容需要缓存，哪些不需要 默认缓存哪些 
## api 设计

- 清除缓存方法
- 查看缓存统计数据
- 启用/禁用缓存

## 待考虑
- 修改源代码与覆盖方法
- index-db 内存溢出处理
- index-db 内存回收策略
- 是否需要过期时间 是否自动清除缓存
- 数据统计
- 分表 数据与统计信息放在不同位置


