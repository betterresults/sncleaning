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

    // Get request body
    const { customerId: requestCustomerId } = await req.json()

    let targetCustomerId = requestCustomerId;

    // If no customerId provided in request, get it from user's profile
    if (!targetCustomerId) {
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile?.customer_id) {
        throw new Error('Customer profile not found')
      }
      
      targetCustomerId = profile.customer_id;
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    let stripeCustomerId = null;

    // Check if one exists for this customer
    const { data: existingPaymentMethod } = await supabaseClient
      .from('customer_payment_methods')
      .select('stripe_customer_id')
      .eq('customer_id', targetCustomerId)
      .limit(1)
      .maybeSingle()

    if (existingPaymentMethod) {
      stripeCustomerId = existingPaymentMethod.stripe_customer_id
    } else {
      // Create new Stripe customer
      const { data: customer } = await supabaseClient
        .from('customers')
        .select('email, first_name, last_name')
        .eq('id', targetCustomerId)
        .single()

      if (!customer) {
        throw new Error('Customer not found')
      }

      const stripeCustomerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: customer.email || '',
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          'metadata[customer_id]': targetCustomerId.toString(),
        }),
      })

      const stripeCustomer = await stripeCustomerResponse.json()
      if (!stripeCustomerResponse.ok) {
        throw new Error(`Stripe error: ${stripeCustomer.error?.message}`)
      }

      stripeCustomerId = stripeCustomer.id
    }

    // Create Setup Intent
    const setupIntentResponse = await fetch('https://api.stripe.com/v1/setup_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: stripeCustomerId,
        'payment_method_types[]': 'card',
        usage: 'off_session',
      }),
    })

    const setupIntent = await setupIntentResponse.json()
    if (!setupIntentResponse.ok) {
      throw new Error(`Stripe error: ${setupIntent.error?.message}`)
    }

    console.log('Setup Intent created:', setupIntent.id)

    return new Response(
      JSON.stringify({
        clientSecret: setupIntent.client_secret,
        customerId: stripeCustomerId,
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