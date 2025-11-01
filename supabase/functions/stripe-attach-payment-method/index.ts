import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    const { payment_method_id, customer_id } = await req.json()

    if (!payment_method_id || !customer_id) {
      throw new Error('Missing required parameters')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get customer's Stripe customer ID
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', customer_id)
      .single()

    if (!customer?.stripe_customer_id) {
      throw new Error('Customer not found or Stripe ID missing')
    }

    // Attach payment method to Stripe customer
    await stripe.paymentMethods.attach(payment_method_id, {
      customer: customer.stripe_customer_id,
    })

    // Set as default payment method
    await stripe.customers.update(customer.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    })

    // Sync to database - get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id)

    await supabase
      .from('customer_payment_methods')
      .insert({
        customer_id: customer_id,
        stripe_payment_method_id: payment_method_id,
        card_brand: paymentMethod.card?.brand || 'unknown',
        card_last4: paymentMethod.card?.last4 || '0000',
        card_exp_month: paymentMethod.card?.exp_month || 1,
        card_exp_year: paymentMethod.card?.exp_year || 2099,
        is_default: true,
      })

    // Unset other payment methods as default
    await supabase
      .from('customer_payment_methods')
      .update({ is_default: false })
      .eq('customer_id', customer_id)
      .neq('stripe_payment_method_id', payment_method_id)

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error attaching payment method:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
