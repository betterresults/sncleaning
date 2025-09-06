import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from "https://esm.sh/stripe@14.21.0"

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

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    const requestBody = await req.json()
    
    // Check if this is the old booking capture format or new direct payment format
    if (requestBody.bookingId && !requestBody.customer_id) {
      // Old format - single booking capture
      const { bookingId } = requestBody

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
    } else {
      // New format - direct payment for multiple bookings
      const { 
        customer_id, 
        payment_method_id, 
        amount, 
        description, 
        booking_ids = [], 
        linen_order_ids = [] 
      } = requestBody

      console.log('Processing direct payment:', {
        customer_id,
        payment_method_id,
        amount,
        description,
        booking_ids,
        linen_order_ids
      })

      if (!customer_id || !payment_method_id || !amount) {
        throw new Error('Missing required parameters')
      }

      // Get customer's Stripe customer ID
      const { data: paymentMethod, error: pmError } = await supabaseClient
        .from('customer_payment_methods')
        .select('stripe_customer_id, stripe_payment_method_id')
        .eq('customer_id', customer_id)
        .eq('stripe_payment_method_id', payment_method_id)
        .single()

      if (pmError || !paymentMethod) {
        throw new Error('Payment method not found')
      }

      console.log('Found payment method:', paymentMethod)

      // Create and confirm payment intent with automatic confirmation
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'gbp',
        customer: paymentMethod.stripe_customer_id,
        payment_method: payment_method_id,
        confirm: true,
        off_session: true, // This ensures no 3D Secure or SMS verification
        return_url: undefined, // No redirect needed
        description: description,
        metadata: {
          customer_id: customer_id.toString(),
          booking_ids: JSON.stringify(booking_ids),
          linen_order_ids: JSON.stringify(linen_order_ids)
        }
      })

      console.log('Payment intent created:', paymentIntent.id, 'Status:', paymentIntent.status)

      if (paymentIntent.status === 'succeeded') {
        // Update past_bookings payment status
        if (booking_ids.length > 0) {
          const { error: bookingError } = await supabaseClient
            .from('past_bookings')
            .update({ 
              payment_status: 'paid',
              invoice_id: paymentIntent.id
            })
            .in('id', booking_ids)

          if (bookingError) {
            console.error('Error updating booking payment status:', bookingError)
          } else {
            console.log('Updated payment status for bookings:', booking_ids)
          }
        }

        // Update linen_orders payment status
        if (linen_order_ids.length > 0) {
          const { error: linenError } = await supabaseClient
            .from('linen_orders')
            .update({ 
              payment_status: 'paid'
            })
            .in('id', linen_order_ids)

          if (linenError) {
            console.error('Error updating linen order payment status:', linenError)
          } else {
            console.log('Updated payment status for linen orders:', linen_order_ids)
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } else {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`)
      }
    }

  } catch (error) {
    console.error('Error processing payment:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})