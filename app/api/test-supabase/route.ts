import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const results: Record<string, { success: boolean; error?: string; message?: string }> = {}

  try {
    const supabase = supabaseAdmin()
    results.client = { success: true, message: 'Supabase client initialized' }

    // Test 1: shared_itineraries
    try {
      const { error } = await supabase.from('shared_itineraries').select('id').limit(1)
      results.shared_itineraries = error
        ? { success: false, error: error.message }
        : { success: true, message: 'Table accessible' }
    } catch (e) {
      results.shared_itineraries = { success: false, error: String(e) }
    }

    // Test 2: trips
    try {
      const { error } = await supabase.from('trips').select('id').limit(1)
      results.trips = error
        ? { success: false, error: error.message }
        : { success: true, message: 'Table accessible' }
    } catch (e) {
      results.trips = { success: false, error: String(e) }
    }

    // Test 3: groups
    try {
      const { error } = await supabase.from('groups').select('id').limit(1)
      results.groups = error
        ? { success: false, error: error.message }
        : { success: true, message: 'Table accessible' }
    } catch (e) {
      results.groups = { success: false, error: String(e) }
    }

    // Test 4: top_location_results
    try {
      const { error } = await supabase.from('top_location_results').select('id').limit(1)
      results.top_location_results = error
        ? { success: false, error: error.message }
        : { success: true, message: 'Table accessible' }
    } catch (e) {
      results.top_location_results = { success: false, error: String(e) }
    }

    const allPassed = Object.values(results).every((r) => r.success)
    return NextResponse.json(
      {
        success: allPassed,
        results,
        message: allPassed
          ? '✅ All Supabase tables are accessible!'
          : '❌ Some tables are not accessible. Check errors above.',
      },
      { status: allPassed ? 200 : 500 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Failed to initialize Supabase client. Check environment variables.',
      },
      { status: 500 }
    )
  }
}
