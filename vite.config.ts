import {defineConfig} from 'vite'
import cesium from 'vite-plugin-cesium'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        cesium()
    ],
    // build: {
    //     lib: {
    //         entry: './src/core/cache', // TS库入口文件
    //         name: 'cache', // 挂载到全局的变量名，CDN导入的时候可以直接使用Counter变量
    //         fileName: 'cache', // 输出的文件名
    //     },
	// 	rollupOptions:{
	// 		output:{
	// 			manualChunks(id){
	// 				if (id.includes('node_modules/dexie')) {
	// 					return 'dexie-chunk';
	// 				}
	// 			}
	// 		}
	// 	}
    // }
})
