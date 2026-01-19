/**
 * Supabase Integration Verification Script
 * Run with: npx tsx scripts/verify-supabase.ts
 */

import { supabaseAdmin } from '../lib/supabase/admin'

async function verifySupabase() {
  console.log('🔍 Verifying Supabase integration...\n')

  try {
    const supabase = supabaseAdmin()
    console.log('✅ Supabase client initialized\n')

    // Test 1: Check if we can query shared_itineraries table
    console.log('📋 Test 1: Checking shared_itineraries table...')
    const { data: shared, error: sharedErr } = await supabase
      .from('shared_itineraries')
      .select('id')
      .limit(1)

    if (sharedErr) {
      console.error('❌ Error querying shared_itineraries:', sharedErr.message)
      if (sharedErr.message.includes('relation') || sharedErr.message.includes('does not exist')) {
        console.error('   → Table does not exist. Run supabase/schema.sql in Supabase SQL Editor!')
      }
      return false
    }
    console.log('✅ shared_itineraries table accessible\n')

    // Test 2: Check trips table
    console.log('📋 Test 2: Checking trips table...')
    const { data: trips, error: tripsErr } = await supabase
      .from('trips')
      .select('id')
      .limit(1)

    if (tripsErr) {
      console.error('❌ Error querying trips:', tripsErr.message)
      if (tripsErr.message.includes('relation') || tripsErr.message.includes('does not exist')) {
        console.error('   → Table does not exist. Run supabase/schema.sql in Supabase SQL Editor!')
      }
      return false
    }
    console.log('✅ trips table accessible\n')

    // Test 3: Check groups table
    console.log('📋 Test 3: Checking groups table...')
    const { data: groups, error: groupsErr } = await supabase
      .from('groups')
      .select('id')
      .limit(1)

    if (groupsErr) {
      console.error('❌ Error querying groups:', groupsErr.message)
      if (groupsErr.message.includes('relation') || groupsErr.message.includes('does not exist')) {
        console.error('   → Table does not exist. Run supabase/schema.sql in Supabase SQL Editor!')
      }
      return false
    }
    console.log('✅ groups table accessible\n')

    // Test 4: Check top_location_results table
    console.log('📋 Test 4: Checking top_location_results table...')
    const { data: locations, error: locationsErr } = await supabase
      .from('top_location_results')
      .select('id')
      .limit(1)

    if (locationsErr) {
      console.error('❌ Error querying top_location_results:', locationsErr.message)
      if (locationsErr.message.includes('relation') || locationsErr.message.includes('does not exist')) {
        console.error('   → Table does not exist. Run supabase/schema.sql in Supabase SQL Editor!')
      }
      return false
    }
    console.log('✅ top_location_results table accessible\n')

    console.log('🎉 All Supabase tables are accessible! Integration verified.\n')
    console.log('📝 Next steps:')
    console.log('   1. Test creating a trip via the app')
    console.log('   2. Test sharing an itinerary')
    console.log('   3. Test creating a group')
    console.log('   4. Test "Top Locations" caching (search "around me" twice)')

    return true
  } catch (error) {
    console.error('❌ Fatal error:', error)
    if (error instanceof Error) {
      if (error.message.includes('Missing Supabase URL')) {
        console.error('\n   → Set SUPABASE_URL in .env.local')
      } else if (error.message.includes('Missing SUPABASE_SERVICE_ROLE_KEY')) {
        console.error('\n   → Set SUPABASE_SERVICE_ROLE_KEY in .env.local')
      }
    }
    return false
  }
}

verifySupabase()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
