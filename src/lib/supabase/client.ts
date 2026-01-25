// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Retrieve and sanitize environment variables to prevent 'Failed to fetch' errors due to whitespace
const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const SUPABASE_URL = typeof envUrl === 'string' ? envUrl.trim() : ''
const SUPABASE_PUBLISHABLE_KEY = typeof envKey === 'string' ? envKey.trim() : ''

// Ensure the client is initialized with valid values
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Supabase environment variables are missing or invalid.')
}

// Import the supabase client like this:
// import { supabase } from "@/lib/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
