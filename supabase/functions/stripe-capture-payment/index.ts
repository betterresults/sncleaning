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

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    const { bookingId } = await req.json()

    if (!bookingId) {
      throw new Error('Booking ID is required')
    }

    // Get booking with payment intent ID
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking || !booking.invoice_id) {
      throw new Error('Booking or payment authorization not found')
    }

    // Capture the payment
    const captureResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${booking.invoice_id}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const paymentIntent = await captureResponse.json()
    if (!captureResponse.ok) {
      throw new Error(`Stripe capture error: ${paymentIntent.error?.message}`)
    }

    // Update booking status to paid
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        payment_status: 'paid',
      })
      .eq('id', bookingId)

    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`)
    }

    console.log('Payment captured for booking:', bookingId, 'Payment Intent:', paymentIntent.id)

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount_received,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error capturing payment:', error)
    
    // If capture fails, update booking status
    if (req.body) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )
        const { bookingId } = await req.json()
        if (bookingId) {
          await supabaseClient
            .from('bookings')
            .update({ payment_status: 'capture_failed' })
            .eq('id', bookingId)
        }
      } catch (updateError) {
        console.error('Failed to update booking status:', updateError)
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})