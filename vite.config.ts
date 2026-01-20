import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'


export default defineConfig({
    plugins: [
        // cesium(),
        dts({
            entryRoot: 'src/', // 类型文件的入口目录
            outDir: 'dist/types' // 类型文件的输出目录
            // tsConfigFilePath: 'tsconfig.json', // TypeScript 配置文件路径
        })
    ],
    build: {
        lib: {
            entry: './src/index', // TS库入口文件
            name: 'cesium-cache', // 挂载到全局的变量名，CDN导入的时候可以直接使用Counter变量
            fileName: 'index', // 输出的文件名
            formats: ['es', 'cjs', 'umd'] // 输出格式
        },
        rollupOptions: {
            external: ['cesium', 'idb'], // 将 Cesium 排除在外
            output: {
                globals: {
                    cesium: 'Cesium', // 定义全局变量名
                    dexie: 'idb' // 定义全局变量名
                }
            },
            input: './src/index.ts' // 指定入口文件
        }
    }
})
