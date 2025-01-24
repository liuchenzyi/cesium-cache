// global.d.ts
declare global {
    interface Window {
        Cesium: typeof import('cesium');
    }
}

// 防止将此文件作为模块处理
export {};