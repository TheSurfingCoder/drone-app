import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// Cesium configuration
const cesiumBaseUrl = 'cesium'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
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
    }
  }

  return {
    define: {
      CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
    },
    plugins: [
      react(),
      cesium(),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/cesium/Build/Cesium/Workers',
            dest: cesiumBaseUrl,
          },
          {
            src: 'node_modules/cesium/Build/Cesium/ThirdParty',
            dest: cesiumBaseUrl,
          },
          {
            src: 'node_modules/cesium/Build/Cesium/Assets',
            dest: cesiumBaseUrl,
          },
          {
            src: 'node_modules/cesium/Build/Cesium/Widgets',
            dest: cesiumBaseUrl,
          },
        ],
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      css: true,
    },
  }
})
