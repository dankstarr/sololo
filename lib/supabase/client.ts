'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// Create a dummy client if env vars are missing to prevent crashes
// This allows the app to work without Supabase (with limited functionality)
let supabase: SupabaseClient

if (!supabaseUrl || !supabaseAnonKey || !isValidHttpUrl(supabaseUrl)) {
  // Only show warning in development to reduce console noise
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file. ' +
      'Google Sign-In and database features will not work until configured.'
    )
  }
  
  // Create a dummy client with placeholder values to prevent errors
  // This won't actually work, but prevents the app from crashing
  supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  ) as any
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export { supabase }
