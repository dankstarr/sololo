import 'server-only'

function readEnv(name: string): string | undefined {
  const v = process.env[name]
  return v && v.trim().length > 0 ? v : undefined
}

export function getSupabaseUrl(): string {
  const url = readEnv('SUPABASE_URL') ?? readEnv('NEXT_PUBLIC_SUPABASE_URL')
  if (!url) {
    throw new Error(
      'Missing Supabase URL. Set SUPABASE_URL (preferred) or NEXT_PUBLIC_SUPABASE_URL.'
    )
  }
  return url
}

export function getSupabaseServiceRoleKey(): string {
  const key = readEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (server-only).')
  }
  return key
}

