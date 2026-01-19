import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env'

let _client: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (_client) return _client

  _client = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return _client
}

