import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// Cesium configuration
const cesiumBaseUrl = 'cesium'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from both .env and .env.development
  const env = {
    ...loadEnv('development', process.cwd(), ''),
    ...loadEnv(mode, process.cwd(), ''),
  }

  // Only validate environment variables in production mode
  if (mode === 'production') {
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_API_URL',
      'VITE_FRONTEND_URL',
      'VITE_CESIUM_TOKEN',
    ]
    const missingVars = requiredEnvVars.filter((envVar) => !env[envVar])

    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars)
    }
  }

  return {
    define: {
      CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
      // Define environment variables for client-side access
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_FRONTEND_URL': JSON.stringify(env.VITE_FRONTEND_URL),
      'import.meta.env.VITE_CESIUM_TOKEN': JSON.stringify(env.VITE_CESIUM_TOKEN),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
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
