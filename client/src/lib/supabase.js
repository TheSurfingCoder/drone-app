import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL is not set in environment variables')
  throw new Error('VITE_SUPABASE_URL is required')
}

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY is not set in environment variables')
  throw new Error('VITE_SUPABASE_ANON_KEY is required')
}

console.log('Initializing Supabase client with URL:', supabaseUrl)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
