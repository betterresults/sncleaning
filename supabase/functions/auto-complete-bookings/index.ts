import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const now = new Date()
    console.log('Auto-completing bookings at:', now.toISOString())

    // Find active bookings that finished more than 1 hour ago
    const { data: bookingsToComplete, error: fetchError } = await supabaseClient
      .from('bookings')
      .select('id, date_time, total_hours, first_name, last_name, booking_status')
      .neq('booking_status', 'completed')
      .neq('booking_status', 'cancelled')
      .not('total_hours', 'is', null)
      .not('date_time', 'is', null)

    if (fetchError) {
      console.error('Error fetching bookings to complete:', fetchError)
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    if (!bookingsToComplete || bookingsToComplete.length === 0) {
      console.log('No bookings found to complete')
      return new Response(
        JSON.stringify({ 
          processed_at: now.toISOString(),
          bookings_completed: 0,
          message: 'No bookings to complete'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Filter bookings that finished more than 1 hour ago
    const bookingsReadyToComplete = bookingsToComplete.filter(booking => {
      const bookingStart = new Date(booking.date_time)
      const bookingEnd = new Date(bookingStart.getTime() + (booking.total_hours || 0) * 60 * 60 * 1000)
      const completionTime = new Date(bookingEnd.getTime() + 1 * 60 * 60 * 1000) // 1 hour after service ends
      return now >= completionTime
    })

    console.log(`Found ${bookingsReadyToComplete.length} bookings ready to complete (${bookingsToComplete.length} total active bookings)`)

    let completedCount = 0

    // Mark each booking as completed
    for (const booking of bookingsReadyToComplete) {
      try {
        console.log(`Completing booking ${booking.id} for ${booking.first_name} ${booking.last_name}`)
        
        const { error: updateError } = await supabaseClient
          .from('bookings')
          .update({ booking_status: 'completed' })
          .eq('id', booking.id)

        if (updateError) {
          console.error(`Failed to complete booking ${booking.id}:`, updateError)
        } else {
          console.log(`Successfully completed booking ${booking.id}`)
          completedCount++
        }
      } catch (error) {
        console.error(`Error completing booking ${booking.id}:`, error)
      }
    }

    const summary = {
      processed_at: now.toISOString(),
      bookings_completed: completedCount,
      total_checked: bookingsToComplete.length,
      ready_to_complete: bookingsReadyToComplete.length
    }

    console.log('Auto-completion summary:', summary)

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in auto-complete-bookings:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})