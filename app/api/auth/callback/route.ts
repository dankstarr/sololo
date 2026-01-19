import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/app/home'

  if (!code) {
    return NextResponse.redirect(new URL('/app/home?error=no_code', request.url))
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return NextResponse.redirect(new URL('/app/home?error=config', request.url))
  }

  try {
    const cookieStore = cookies()
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: {
          getItem: (key: string) => cookieStore.get(key)?.value || null,
          setItem: (key: string, value: string) => {
            try {
              cookieStore.set({ name: key, value, httpOnly: true, secure: true, sameSite: 'lax' })
            } catch (error) {
              console.warn('Failed to set cookie:', key)
            }
          },
          removeItem: (key: string) => {
            try {
              cookieStore.set({ name: key, value: '', maxAge: 0 })
            } catch (error) {
              console.warn('Failed to remove cookie:', key)
            }
          },
        },
      },
    } as any)
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL(`/app/home?error=${encodeURIComponent(error.message)}`, request.url))
    }

    // Redirect to home page after successful authentication
    return NextResponse.redirect(new URL(next, request.url))
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(new URL(`/app/home?error=unexpected`, request.url))
  }
}
