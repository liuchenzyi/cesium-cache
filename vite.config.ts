import {defineConfig} from 'vite'
// import cesium from 'vite-plugin-cesium'
import dts from "vite-plugin-dts";


// https://vite.dev/config/
export default defineConfig({
    plugins: [
        // cesium(),
        dts({
            entryRoot: 'src/cache', // 类型文件的入口目录
            outDir: 'dist/types', // 类型文件的输出目录
            // tsConfigFilePath: 'tsconfig.json', // TypeScript 配置文件路径
        }),
    ],
    build: {
        lib: {
            entry: './src/cache/Cache', // TS库入口文件
            name: 'cesium-cache', // 挂载到全局的变量名，CDN导入的时候可以直接使用Counter变量
            fileName: 'cache', // 输出的文件名
            formats: ['es', 'cjs','umd'], // 输出格式
        },
		rollupOptions:{
            external: ['cesium','dexie'], // 将 Cesium 排除在外
			output:{
                globals: {
                    cesium: 'Cesium', // 定义全局变量名
                    dexie: 'Dexie', // 定义全局变量名
                }
			},
            input: './src/cache/Cache.ts', // 指定入口文件
		}
    },
})
