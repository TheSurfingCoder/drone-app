import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const cesiumSource = 'node_modules/cesium/Build/Cesium'
// This is the base url for static files that CesiumJS needs to load.
// Set to an empty string to place the files at the site's root path
const cesiumBaseUrl = 'cesiumStatic'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  // Log environment variables for debugging (without sensitive values)
  console.log('Environment mode:', mode)
  console.log(
    'Available environment variables:',
    Object.keys(env).filter((key) => key.startsWith('VITE_')),
  )

  // Only validate environment variables in production mode
  if (mode === 'production') {
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_API_URL']
    const missingVars = requiredEnvVars.filter((envVar) => !env[envVar])

    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars)
      // Instead of throwing, we'll log the error and continue
      // This allows the build to proceed even if variables are missing
      // The runtime checks in supabase.js will catch any issues
    }
  }

  return {
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
            dest: 'cesium',
          },
          {
            src: 'node_modules/cesium/Build/Cesium/ThirdParty',
            dest: 'cesium',
          },
          {
            src: 'node_modules/cesium/Build/Cesium/Assets',
            dest: 'cesium',
          },
          {
            src: 'node_modules/cesium/Build/Cesium/Widgets',
            dest: 'cesium',
          },
        ],
      }),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      css: true,
    },
  }
})
