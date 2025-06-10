import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const cesiumSource = 'node_modules/cesium/Build/Cesium'
// This is the base url for static files that CesiumJS needs to load.
// Set to an empty string to place the files at the site's root path
const cesiumBaseUrl = 'cesiumStatic'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    // Define relative base path in cesium for loading assets
    // https://vitejs.dev/config/shared-options.html#define
    CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
  },
  plugins: [
    react(),
    cesium(),
    // Copy Cesium Assets, Widgets, and Workers to a static directory.
    // If you need to add your own static files to your project, use the `public` directory
    // and other options listed here: https://vitejs.dev/guide/assets.html#the-public-directory
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/cesium/Build/Cesium/Workers',
          dest: 'cesium'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/ThirdParty',
          dest: 'cesium'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Assets',
          dest: 'cesium'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Widgets',
          dest: 'cesium'
        }
      ]
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
  }
})
