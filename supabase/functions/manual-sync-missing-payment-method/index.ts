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

    console.log('Manual sync started for sinsip customer');

    // First, update Stripe customer metadata
    const stripeCustomerId = 'cus_QQMXWb8nYmHwmB';
    const internalCustomerId = 373;
    
    console.log(`Updating Stripe customer ${stripeCustomerId} metadata`);
    
    await stripe.customers.update(stripeCustomerId, {
      metadata: {
        customer_id: internalCustomerId.toString(),
        internal_customer_id: internalCustomerId.toString()
      }
    });

    console.log('Stripe customer metadata updated successfully');

    // Get all payment methods for this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card'
    });

    console.log(`Found ${paymentMethods.data.length} payment methods for customer`);

    const results = [];

    for (const pm of paymentMethods.data) {
      console.log(`Processing payment method: ${pm.id}`);
      console.log(`Card details: ${pm.card?.brand} ****${pm.card?.last4} ${pm.card?.exp_month}/${pm.card?.exp_year}`);

      // Check if already exists
      const { data: existing } = await supabaseClient
        .from('customer_payment_methods')
        .select('id')
        .eq('stripe_payment_method_id', pm.id)
        .maybeSingle();

      if (existing) {
        console.log(`Payment method ${pm.id} already exists in database`);
        results.push({
          paymentMethodId: pm.id,
          action: 'already_exists',
          success: true
        });
        continue;
      }

      // Insert the payment method
      const paymentMethodData = {
        customer_id: internalCustomerId,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_method_id: pm.id,
        card_brand: pm.card?.brand || null,
        card_last4: pm.card?.last4 || null,
        card_exp_month: pm.card?.exp_month || null,
        card_exp_year: pm.card?.exp_year || null,
        is_default: false
      };

      console.log('Inserting payment method data:', paymentMethodData);

      const { data, error } = await supabaseClient
        .from('customer_payment_methods')
        .insert(paymentMethodData)
        .select()
        .single();

      if (error) {
        console.error(`Error inserting payment method ${pm.id}:`, error);
        results.push({
          paymentMethodId: pm.id,
          action: 'insert_failed',
          success: false,
          error: error.message
        });
      } else {
        console.log(`Successfully inserted payment method ${pm.id}:`, data);
        results.push({
          paymentMethodId: pm.id,
          action: 'inserted',
          success: true,
          databaseId: data.id
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${results.length} payment methods`,
      stripeCustomerId,
      internalCustomerId,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in manual sync:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});