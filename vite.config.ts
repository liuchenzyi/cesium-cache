import { defineConfig } from 'vite'
import cesium from 'vite-plugin-cesium'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      cesium()
  ],
})
