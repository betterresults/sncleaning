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

    const { bookingId } = await req.json()

    if (!bookingId) {
      throw new Error('Booking ID is required')
    }

    console.log(`Manual authorization request for booking ${bookingId}`)

    // Reset payment status to Unpaid first
    const { error: resetError } = await supabaseClient
      .from('bookings')
      .update({ payment_status: 'Unpaid' })
      .eq('id', bookingId)

    if (resetError) {
      console.error('Error resetting payment status:', resetError)
    } else {
      console.log(`Reset payment status to Unpaid for booking ${bookingId}`)
    }

    // Call the stripe-authorize-payment function
    const { data: authResult, error: authError } = await supabaseClient.functions.invoke('stripe-authorize-payment', {
      body: { bookingId: bookingId }
    })

    if (authError) {
      console.error(`Authorization failed for booking ${bookingId}:`, authError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authError.message,
          bookingId: bookingId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`Authorization successful for booking ${bookingId}:`, authResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: authResult,
        bookingId: bookingId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in manual authorization:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})