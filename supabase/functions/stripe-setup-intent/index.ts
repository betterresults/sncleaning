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

    // If no customerId provided in request, try to get it from user's profile
    if (!targetCustomerId) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profile?.customer_id) {
        targetCustomerId = profile.customer_id;
      }
      // If still no customer_id, we'll handle this as a new customer without a database record
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    let stripeCustomerId = null;

    // Check if one exists for this customer (only if we have a customer ID)
    if (targetCustomerId) {
      const { data: existingPaymentMethod } = await supabaseClient
        .from('customer_payment_methods')
        .select('stripe_customer_id')
        .eq('customer_id', targetCustomerId)
        .limit(1)
        .maybeSingle()

      if (existingPaymentMethod) {
        stripeCustomerId = existingPaymentMethod.stripe_customer_id
      }
    }

    if (!stripeCustomerId) {
      // Get customer details first
      let customerEmail = user.email;
      let customerName = '';
      let customerDbId = targetCustomerId;

      // Try to get customer details from customers table (only if we have a customer ID)
      const { data: customer } = targetCustomerId ? await supabaseClient
        .from('customers')
        .select('email, first_name, last_name')
        .eq('id', targetCustomerId)
        .maybeSingle() : { data: null }

      if (customer) {
        // Use customer data if available
        customerEmail = customer.email || user.email;
        customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
      } else {
        // For new customers without a customer record, use auth user info
        console.log('No customer record found, using auth user info for Stripe customer creation');
        customerName = user.user_metadata?.first_name || user.user_metadata?.name || '';
        if (user.user_metadata?.last_name) {
          customerName += ` ${user.user_metadata.last_name}`;
        }
        customerName = customerName.trim();
      }

      // FIRST: Check if a Stripe customer already exists for this email
      const existingCustomerResponse = await fetch(
        `https://api.stripe.com/v1/customers/search?query=email:"${encodeURIComponent(customerEmail || '')}"`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
          },
        }
      );

      const existingCustomerData = await existingCustomerResponse.json();
      
      if (existingCustomerResponse.ok && existingCustomerData.data && existingCustomerData.data.length > 0) {
        // Use existing Stripe customer
        stripeCustomerId = existingCustomerData.data[0].id;
        console.log('Found existing Stripe customer:', stripeCustomerId);
      } else {
        // Create new Stripe customer only if none exists
        console.log('Creating new Stripe customer for email:', customerEmail);
        const stripeCustomerResponse = await fetch('https://api.stripe.com/v1/customers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            email: customerEmail || '',
            name: customerName || 'Customer',
            'metadata[customer_id]': customerDbId ? customerDbId.toString() : '',
            'metadata[user_id]': user.id,
          }),
        })

        const stripeCustomer = await stripeCustomerResponse.json()
        if (!stripeCustomerResponse.ok) {
          throw new Error(`Stripe error: ${stripeCustomer.error?.message}`)
        }

        stripeCustomerId = stripeCustomer.id
      }
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