import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const { email, forceSync } = await req.json();
    
    if (!email) {
      throw new Error('Email is required');
    }

    console.log(`Fixing Stripe customer metadata for: ${email}`);

    // Get customer from our database
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (customerError || !customer) {
      throw new Error(`Customer not found: ${email}`);
    }

    console.log(`Found internal customer:`, customer);

    // Find Stripe customer
    const stripeCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (stripeCustomers.data.length === 0) {
      throw new Error(`Stripe customer not found for email: ${email}`);
    }

    const stripeCustomer = stripeCustomers.data[0];
    console.log(`Found Stripe customer: ${stripeCustomer.id}`);

    // Update Stripe customer metadata
    const updatedCustomer = await stripe.customers.update(stripeCustomer.id, {
      metadata: {
        customer_id: customer.id.toString(),
        internal_customer_id: customer.id.toString()
      }
    });

    console.log(`Updated Stripe customer metadata:`, updatedCustomer.metadata);

    // Get all payment methods for this Stripe customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomer.id,
      type: 'card'
    });

    console.log(`Found ${paymentMethods.data.length} payment methods to sync`);

    const syncResults = [];

    for (const paymentMethod of paymentMethods.data) {
      console.log(`Syncing payment method: ${paymentMethod.id}`);
      
      // Check if already exists in our database
      const { data: existingPM } = await supabaseClient
        .from('customer_payment_methods')
        .select('id')
        .eq('stripe_payment_method_id', paymentMethod.id)
        .single();

      if (existingPM && !forceSync) {
        console.log(`Payment method ${paymentMethod.id} already exists, skipping`);
        continue;
      }

      // Sync payment method to database
      const paymentMethodData = {
        customer_id: customer.id,
        stripe_customer_id: stripeCustomer.id,
        stripe_payment_method_id: paymentMethod.id,
        card_brand: paymentMethod.card?.brand || null,
        card_last4: paymentMethod.card?.last4 || null,
        card_exp_month: paymentMethod.card?.exp_month || null,
        card_exp_year: paymentMethod.card?.exp_year || null,
        is_default: false // Will be set manually if needed
      };

      const { error: insertError } = await supabaseClient
        .from('customer_payment_methods')
        .upsert(paymentMethodData, {
          onConflict: 'stripe_payment_method_id',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error(`Error syncing payment method ${paymentMethod.id}:`, insertError);
        syncResults.push({
          paymentMethodId: paymentMethod.id,
          success: false,
          error: insertError.message
        });
      } else {
        console.log(`Successfully synced payment method: ${paymentMethod.id}`);
        syncResults.push({
          paymentMethodId: paymentMethod.id,
          success: true
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Fixed Stripe customer metadata and synced ${syncResults.filter(r => r.success).length} payment methods`,
      stripeCustomerId: stripeCustomer.id,
      customerInternalId: customer.id,
      syncResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error fixing Stripe customer metadata:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});