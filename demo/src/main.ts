import './style.css'
import * as Cesium from 'cesium'
import { Credit, WebMapTileServiceImageryProvider } from 'cesium'

import {useCesiumCache} from '../../src/cache/Cache.ts'


const TDT_YX = (token: string) => new WebMapTileServiceImageryProvider({
    url: `http://{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${ token }`,
    layer: 'img',
    style: 'default',
    format: 'tiles',
    tileMatrixSetID: 'w',
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    credit: new Credit('天地图影像'),
    maximumLevel: 18
})

const init = async () => {

    let viewer: Cesium.Viewer = new Cesium.Viewer('map', {
        // infoBox: true, // 禁用沙箱，解决控制台报错
        selectionIndicator: true, //选择指示器
        timeline: false, // 时间轴
        animation: false, // 动画小组件
        geocoder: false, // 地理编码（搜索）组件
        homeButton: true, // 首页，点击之后将视图跳转到默认视角
        sceneModePicker: true, // 投影方式，切换 2D、3D 和 Columbus View (CV) 模式。
        baseLayerPicker: false, // 底图组件，选择三维数字地球的底图（imagery and terrain）。
        navigationHelpButton: false, // 帮助按钮
        fullscreenButton: false, // 全屏按钮
        // scene3DOnly: true, // 每个几何实例将只能以 3D 渲染以节省 GPU 内存
        sceneMode: 3 // 初始场景模式 1 2D模式 2 2D循环模式 3 3D模式  Cesium.SceneMode
        // imageryProvider:

    })



    let logo = viewer.cesiumWidget.creditContainer as HTMLElement
    logo.style.display = 'none' // 隐藏 logo 版权
    viewer.scene.skyBox.show = false
    viewer.scene.backgroundColor = new Cesium.Color(0, 0, 0, 0)

    // viewer.imageryLayers.addImageryProvider(TDT_YX('012dcb4d2ede55a5e37bd5b34f6aca40'))

    const tileSet = await Cesium.Cesium3DTileset.fromUrl('http://10.126.126.3:5173/gateway-service/fileStatic/3dmap/yitai/tileset.json')

    viewer.scene.primitives.add(tileSet)

    console.log(tileSet)

    viewer.zoomTo(tileSet, new Cesium.HeadingPitchRange(-0.5, -0.5, 800))

    useCesiumCache({dbName:"demo-cache"},Cesium.Resource)

}


init()

