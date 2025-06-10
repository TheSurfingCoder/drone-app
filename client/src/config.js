const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  frontendUrl: import.meta.env.VITE_FRONTEND_URL,
  cesiumToken: import.meta.env.VITE_CESIUM_TOKEN,
}

// Validate required environment variables
const requiredEnvVars = ['VITE_API_URL', 'VITE_FRONTEND_URL', 'VITE_CESIUM_TOKEN']
const missingEnvVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar])

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars)
  throw new Error('Missing required environment variables. Please check your .env file.')
}

export default config 