import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentActionRequest {
  bookingId: number
  action: 'authorize' | 'charge' | 'retry'
  amount?: number
  paymentMethodId?: string
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
      { auth: { persistSession: false } }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const { bookingId, action, amount, paymentMethodId }: PaymentActionRequest = await req.json()

    if (!bookingId || !action) {
      throw new Error('Booking ID and action are required')
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    console.log(`Manual payment action: ${action} for booking ${bookingId}`)

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        customers!bookings_customer_fkey (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    // Get customer's payment methods
    const { data: paymentMethods, error: pmError } = await supabaseClient
      .from('customer_payment_methods')
      .select('*')
      .eq('customer_id', booking.customer)
      .eq('is_default', true)

    let selectedPaymentMethod = paymentMethods?.[0]

    // If specific payment method provided, use that
    if (paymentMethodId) {
      const { data: specificPM } = await supabaseClient
        .from('customer_payment_methods')
        .select('*')
        .eq('stripe_payment_method_id', paymentMethodId)
        .eq('customer_id', booking.customer)
        .single()

      if (specificPM) {
        selectedPaymentMethod = specificPM
      }
    }

    if (!selectedPaymentMethod) {
      throw new Error('No payment method available for this customer')
    }

    const paymentAmount = amount || booking.total_cost
    const amountInCents = Math.round(paymentAmount * 100)

    let result: any = {}

    if (action === 'authorize') {
      // Create payment intent for authorization only
      const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: amountInCents.toString(),
          currency: 'gbp',
          customer: selectedPaymentMethod.stripe_customer_id,
          payment_method: selectedPaymentMethod.stripe_payment_method_id,
          capture_method: 'manual',
          confirm: 'true',
          description: `Authorization for booking ${bookingId}`,
        }),
      })

      const paymentIntent = await paymentIntentResponse.json()

      if (paymentIntent.error) {
        throw new Error(`Authorization failed: ${paymentIntent.error.message}`)
      }

      // Update booking with payment intent ID and status
      await supabaseClient
        .from('bookings')
        .update({
          payment_status: 'authorized',
          invoice_id: paymentIntent.id
        })
        .eq('id', bookingId)

      result = { 
        success: true, 
        action: 'authorized',
        paymentIntentId: paymentIntent.id,
        amount: paymentAmount
      }

    } else if (action === 'charge') {
      // Either capture existing authorized payment or create new immediate charge
      if (booking.invoice_id && booking.payment_status === 'authorized') {
        // Capture existing authorized payment
        const captureResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${booking.invoice_id}/capture`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount_to_capture: amountInCents.toString(),
          }),
        })

        const captureResult = await captureResponse.json()

        if (captureResult.error) {
          throw new Error(`Capture failed: ${captureResult.error.message}`)
        }

        await supabaseClient
          .from('bookings')
          .update({ payment_status: 'paid' })
          .eq('id', bookingId)

        result = { 
          success: true, 
          action: 'captured',
          paymentIntentId: booking.invoice_id,
          amount: paymentAmount
        }
      } else {
        // Create immediate charge
        const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount: amountInCents.toString(),
            currency: 'gbp',
            customer: selectedPaymentMethod.stripe_customer_id,
            payment_method: selectedPaymentMethod.stripe_payment_method_id,
            capture_method: 'automatic',
            confirm: 'true',
            description: `Payment for booking ${bookingId}`,
          }),
        })

        const paymentIntent = await paymentIntentResponse.json()

        if (paymentIntent.error) {
          throw new Error(`Payment failed: ${paymentIntent.error.message}`)
        }

        await supabaseClient
          .from('bookings')
          .update({
            payment_status: 'paid',
            invoice_id: paymentIntent.id
          })
          .eq('id', bookingId)

        result = { 
          success: true, 
          action: 'charged',
          paymentIntentId: paymentIntent.id,
          amount: paymentAmount
        }
      }

    } else if (action === 'retry') {
      // Retry failed payment
      const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: amountInCents.toString(),
          currency: 'gbp',
          customer: selectedPaymentMethod.stripe_customer_id,
          payment_method: selectedPaymentMethod.stripe_payment_method_id,
          capture_method: 'automatic',
          confirm: 'true',
          description: `Retry payment for booking ${bookingId}`,
        }),
      })

      const paymentIntent = await paymentIntentResponse.json()

      if (paymentIntent.error) {
        await supabaseClient
          .from('bookings')
          .update({ payment_status: 'failed' })
          .eq('id', bookingId)

        throw new Error(`Retry failed: ${paymentIntent.error.message}`)
      }

      await supabaseClient
        .from('bookings')
        .update({
          payment_status: 'paid',
          invoice_id: paymentIntent.id
        })
        .eq('id', bookingId)

      result = { 
        success: true, 
        action: 'retry_success',
        paymentIntentId: paymentIntent.id,
        amount: paymentAmount
      }
    }

    console.log(`Payment action completed:`, result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)

    // Update booking status on error
    try {
      const { bookingId } = await req.json()
      if (bookingId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          { auth: { persistSession: false } }
        )
        
        await supabaseClient
          .from('bookings')
          .update({ payment_status: 'failed' })
          .eq('id', bookingId)
      }
    } catch (updateError) {
      console.error('Error updating booking status:', updateError)
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