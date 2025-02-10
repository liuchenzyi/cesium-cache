import { defineConfig } from 'vite'
import VitePluginCesium from 'vite-plugin-cesium'


export default defineConfig({
    plugins: [
        VitePluginCesium()
    ],

    server: {
        host: '0.0.0.0',
        // port: 3000,
        proxy: {
            '/gateway-service': {
                target: 'http://192.168.1.101:8221',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
})
