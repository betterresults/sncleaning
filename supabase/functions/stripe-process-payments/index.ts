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
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    console.log('Processing payments at:', now.toISOString())

    // 1. Find bookings that need payment authorization (24 hours before)
    const { data: bookingsToAuthorize, error: authorizeError } = await supabaseClient
      .from('bookings')
      .select('id, date_time, total_cost, customer')
      .gte('date_time', now.toISOString())
      .lte('date_time', twentyFourHoursFromNow.toISOString())
      .in('payment_status', ['Unpaid', 'pending'])
      .not('customer', 'is', null)

    if (authorizeError) {
      console.error('Error fetching bookings to authorize:', authorizeError)
    } else if (bookingsToAuthorize && bookingsToAuthorize.length > 0) {
      console.log(`Found ${bookingsToAuthorize.length} bookings needing authorization`)
      
      for (const booking of bookingsToAuthorize) {
        try {
          // Call authorize payment function
          const { error: authError } = await supabaseClient.functions.invoke('stripe-authorize-payment', {
            body: { bookingId: booking.id }
          })
          
          if (authError) {
            console.error(`Failed to authorize payment for booking ${booking.id}:`, authError)
          } else {
            console.log(`Successfully authorized payment for booking ${booking.id}`)
          }
        } catch (error) {
          console.error(`Error authorizing booking ${booking.id}:`, error)
        }
      }
    }

    // 2. Find bookings that need payment capture (2 hours before)
    const { data: bookingsToCapture, error: captureError } = await supabaseClient
      .from('bookings')
      .select('id, date_time, invoice_id')
      .gte('date_time', now.toISOString())
      .lte('date_time', twoHoursFromNow.toISOString())
      .eq('payment_status', 'collecting')
      .not('invoice_id', 'is', null)

    if (captureError) {
      console.error('Error fetching bookings to capture:', captureError)
    } else if (bookingsToCapture && bookingsToCapture.length > 0) {
      console.log(`Found ${bookingsToCapture.length} bookings needing capture`)
      
      for (const booking of bookingsToCapture) {
        try {
          // Call capture payment function
          const { error: captureErr } = await supabaseClient.functions.invoke('stripe-capture-payment', {
            body: { bookingId: booking.id }
          })
          
          if (captureErr) {
            console.error(`Failed to capture payment for booking ${booking.id}:`, captureErr)
          } else {
            console.log(`Successfully captured payment for booking ${booking.id}`)
          }
        } catch (error) {
          console.error(`Error capturing booking ${booking.id}:`, error)
        }
      }
    }

    const summary = {
      processed_at: now.toISOString(),
      bookings_authorized: bookingsToAuthorize?.length || 0,
      bookings_captured: bookingsToCapture?.length || 0,
    }

    console.log('Payment processing summary:', summary)

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in payment processing:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})