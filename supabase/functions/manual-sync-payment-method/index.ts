import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customer_email } = await req.json();
    
    if (!customer_email) {
      return new Response(JSON.stringify({ success: false, error: 'customer_email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Manual sync for customer email: ${customer_email}`);

    // Get customer from database
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, email, first_name, last_name')
      .eq('email', customer_email)
      .single();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      return new Response(JSON.stringify({ success: false, error: customerError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found customer: ${customer.first_name} ${customer.last_name} (ID: ${customer.id})`);

    // Find Stripe customer by email
    const stripeCustomers = await stripe.customers.list({
      email: customer.email,
      limit: 1
    });

    if (stripeCustomers.data.length === 0) {
      console.log(`No Stripe customer found for email: ${customer.email}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No Stripe customer found for this email' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripeCustomer = stripeCustomers.data[0];
    console.log(`Found Stripe customer: ${stripeCustomer.id}`);

    // Get payment methods for this Stripe customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomer.id,
      type: 'card'
    });

    console.log(`Found ${paymentMethods.data.length} payment methods for customer ${customer.id}`);

    let syncedCount = 0;

    for (const paymentMethod of paymentMethods.data) {
      // Check if this payment method already exists in our database
      const { data: existingPaymentMethod } = await supabaseAdmin
        .from('customer_payment_methods')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('stripe_payment_method_id', paymentMethod.id)
        .single();

      if (existingPaymentMethod) {
        console.log(`Payment method ${paymentMethod.id} already exists for customer ${customer.id}`);
        continue;
      }

      // Insert new payment method
      const { error: insertError } = await supabaseAdmin
        .from('customer_payment_methods')
        .insert({
          customer_id: customer.id,
          stripe_customer_id: stripeCustomer.id,
          stripe_payment_method_id: paymentMethod.id,
          card_brand: paymentMethod.card?.brand || null,
          card_last4: paymentMethod.card?.last4 || null,
          card_exp_month: paymentMethod.card?.exp_month || null,
          card_exp_year: paymentMethod.card?.exp_year || null,
          is_default: paymentMethods.data.length === 1 // Set as default if it's the only one
        });

      if (insertError) {
        console.error(`Error inserting payment method for customer ${customer.id}:`, insertError);
      } else {
        console.log(`Successfully synced payment method ${paymentMethod.id} for customer ${customer.id}`);
        syncedCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      customer_id: customer.id,
      stripe_customer_id: stripeCustomer.id,
      payment_methods_found: paymentMethods.data.length,
      synced_count: syncedCount,
      message: `Successfully synced ${syncedCount} payment methods for ${customer_email}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in manual-sync-payment-method:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);