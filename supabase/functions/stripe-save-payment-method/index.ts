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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user's customer_id from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('customer_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.customer_id) {
      throw new Error('Customer profile not found')
    }

    const { setupIntentId, customerId } = await req.json()

    if (!setupIntentId || !customerId) {
      throw new Error('Setup intent ID and customer ID are required')
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    // Get setup intent details from Stripe
    const setupIntentResponse = await fetch(`https://api.stripe.com/v1/setup_intents/${setupIntentId}`, {
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    })

    const setupIntent = await setupIntentResponse.json()
    if (!setupIntentResponse.ok) {
      throw new Error(`Stripe error: ${setupIntent.error?.message}`)
    }

    if (setupIntent.status !== 'succeeded') {
      throw new Error('Setup intent not succeeded')
    }

    if (!setupIntent.payment_method) {
      throw new Error('No payment method found')
    }

    // Get payment method details
    const paymentMethodResponse = await fetch(`https://api.stripe.com/v1/payment_methods/${setupIntent.payment_method}`, {
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    })

    const paymentMethod = await paymentMethodResponse.json()
    if (!paymentMethodResponse.ok) {
      throw new Error(`Stripe error: ${paymentMethod.error?.message}`)
    }

    // Check if this is the first payment method for this customer
    const { data: existingMethods } = await supabaseClient
      .from('customer_payment_methods')
      .select('id')
      .eq('customer_id', customerId)

    const isFirstPaymentMethod = !existingMethods || existingMethods.length === 0

    // Save payment method to database
    const { data, error } = await supabaseClient
      .from('customer_payment_methods')
      .insert({
        customer_id: customerId,
        stripe_customer_id: setupIntent.customer,
        stripe_payment_method_id: setupIntent.payment_method,
        card_brand: paymentMethod.card?.brand,
        card_last4: paymentMethod.card?.last4,
        card_exp_month: paymentMethod.card?.exp_month,
        card_exp_year: paymentMethod.card?.exp_year,
        is_default: isFirstPaymentMethod, // First payment method becomes default
      })
      .select()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    console.log('Payment method saved:', setupIntent.payment_method)

    return new Response(
      JSON.stringify({
        success: true,
        paymentMethod: data[0],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})