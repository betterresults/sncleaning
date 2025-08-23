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
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000) // Changed: 2 hours AGO instead of from now
    
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

    // 2. Find bookings that need payment capture (2 hours AFTER completion)
    // We need to find bookings where: booking_end_time + 2 hours <= current_time
    const { data: bookingsToCapture, error: captureError } = await supabaseClient
      .from('bookings')
      .select('id, date_time, invoice_id, total_hours')
      .eq('payment_status', 'collecting')
      .not('invoice_id', 'is', null)
      .not('total_hours', 'is', null)

    if (captureError) {
      console.error('Error fetching bookings to capture:', captureError)
    } else if (bookingsToCapture && bookingsToCapture.length > 0) {
      // Filter bookings where service ended + 2 hours ago
      readyToCapture = bookingsToCapture.filter(booking => {
        const bookingStart = new Date(booking.date_time)
        const bookingEnd = new Date(bookingStart.getTime() + (booking.total_hours || 0) * 60 * 60 * 1000)
        const captureTime = new Date(bookingEnd.getTime() + 2 * 60 * 60 * 1000) // 2 hours after service ends
        return now >= captureTime
      })
      
      console.log(`Found ${readyToCapture.length} bookings ready for capture (${bookingsToCapture.length} total with collecting status)`)
      
      for (const booking of readyToCapture) {
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