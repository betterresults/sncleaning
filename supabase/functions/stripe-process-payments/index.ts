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
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago for capture timing
    
    // For authorization: look for bookings happening within the next 24 hours (including ones starting now)
    const authorizationWindowStart = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago to catch any we missed
    const authorizationWindowEnd = twentyFourHoursFromNow

    console.log('Processing payments at:', now.toISOString())

    let bookingsWithPaymentMethods = []
    let readyToCapture = [] // Initialize here for scope

    // 1. Find bookings that need payment authorization (within next 24 hours, including 2hrs buffer for missed ones)
    const { data: bookingsToAuthorize, error: authorizeError } = await supabaseClient
      .from('bookings')
      .select('id, date_time, total_cost, customer')
      .gte('date_time', authorizationWindowStart.toISOString())
      .lte('date_time', authorizationWindowEnd.toISOString())
      .in('payment_status', ['Unpaid', 'pending', 'failed']) // Include 'failed' to retry
      .not('customer', 'is', null)

    if (authorizeError) {
      console.error('Error fetching bookings to authorize:', authorizeError)
    } else if (bookingsToAuthorize && bookingsToAuthorize.length > 0) {
      console.log(`Found ${bookingsToAuthorize.length} potential bookings for authorization`)
      
      // Filter bookings to only include customers with payment methods
      for (const booking of bookingsToAuthorize) {
        const { data: paymentMethods, error: pmError } = await supabaseClient
          .from('customer_payment_methods')
          .select('id')
          .eq('customer_id', booking.customer)
          .limit(1)
        
        if (pmError) {
          console.error(`Error checking payment methods for customer ${booking.customer}:`, pmError)
          continue
        }
        
        if (paymentMethods && paymentMethods.length > 0) {
          bookingsWithPaymentMethods.push(booking)
        } else {
          console.log(`Skipping booking ${booking.id} - customer ${booking.customer} has no payment methods`)
        }
      }
      
      console.log(`Processing ${bookingsWithPaymentMethods.length} bookings with payment methods`)
      
      for (const booking of bookingsWithPaymentMethods) {
        try {
          console.log(`Attempting to authorize payment for booking ${booking.id} (£${booking.total_cost})`)
          
          // Call robust system payment action function
          const { data: authResult, error: authError } = await supabaseClient.functions.invoke('system-payment-action', {
            body: { 
              bookingId: booking.id,
              action: 'authorize'
            }
          })
          
          if (authError) {
            console.error(`Failed to authorize payment for booking ${booking.id}:`, authError)
          } else if (authResult?.success) {
            console.log(`Successfully authorized payment for booking ${booking.id}: ${authResult.paymentIntentId}`)
          } else {
            console.log(`Authorization incomplete for booking ${booking.id}: ${authResult?.error || 'Unknown error'}`)
          }
        } catch (error) {
          console.error(`Error authorizing booking ${booking.id}:`, error)
        }
      }
    }

    // 2. Find bookings that need payment capture (1 hour AFTER completion OR completed bookings)
    // Check both active bookings (1 hour after end) and past bookings (already completed)
    const { data: activeBookingsToCapture, error: activeCaptureError } = await supabaseClient
      .from('bookings')
      .select('id, date_time, invoice_id, total_hours')
      .eq('payment_status', 'collecting')
      .not('invoice_id', 'is', null)
      .not('total_hours', 'is', null)
    
    const { data: pastBookingsToCapture, error: pastCaptureError } = await supabaseClient
      .from('past_bookings')
      .select('id, date_time, invoice_id, total_hours')
      .eq('payment_status', 'collecting')
      .not('invoice_id', 'is', null)
      .not('total_hours', 'is', null)

    if (activeCaptureError) {
      console.error('Error fetching active bookings to capture:', activeCaptureError)
    }
    if (pastCaptureError) {
      console.error('Error fetching past bookings to capture:', pastCaptureError)
    }
    
    // Combine and process all bookings for capture
    const allBookingsToCapture = [
      ...(activeBookingsToCapture || []),
      ...(pastBookingsToCapture || [])
    ]
    
    if (allBookingsToCapture.length > 0) {
      // Filter active bookings where service ended + 1 hour ago, capture ALL past bookings immediately
      readyToCapture = allBookingsToCapture.filter(booking => {
        // If it's a past booking, capture immediately
        if (pastBookingsToCapture?.includes(booking)) {
          return true
        }
        
        // For active bookings, wait 1 hour after completion
        const bookingStart = new Date(booking.date_time)
        const bookingEnd = new Date(bookingStart.getTime() + (booking.total_hours || 0) * 60 * 60 * 1000)
        const captureTime = new Date(bookingEnd.getTime() + 1 * 60 * 60 * 1000) // 1 hour after service ends
        return now >= captureTime
      })
      
      console.log(`Found ${readyToCapture.length} bookings ready for capture (${allBookingsToCapture.length} total with collecting status)`)
      
      for (const booking of readyToCapture) {
        try {
          console.log(`Attempting to capture payment for booking ${booking.id} (${booking.invoice_id})`)
          
          // Call robust system payment action function
          const { data: captureResult, error: captureErr } = await supabaseClient.functions.invoke('system-payment-action', {
            body: { 
              bookingId: booking.id,
              action: 'charge'
            }
          })
          
          if (captureErr) {
            console.error(`Failed to capture payment for booking ${booking.id}:`, captureErr)
          } else if (captureResult?.success) {
            console.log(`Successfully captured payment for booking ${booking.id}: ${captureResult.paymentIntentId}`)
          } else {
            console.log(`Capture incomplete for booking ${booking.id}: ${captureResult?.error || 'Unknown error'}`)
          }
        } catch (error) {
          console.error(`Error capturing booking ${booking.id}:`, error)
        }
      }
    }

    const summary = {
      processed_at: now.toISOString(),
      bookings_authorized: bookingsWithPaymentMethods?.length || 0,
      bookings_captured: readyToCapture?.length || 0,
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