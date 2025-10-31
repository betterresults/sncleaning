import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { customerId, paymentMethodId, verifyAmountInPence = 0, totalAmountInPence = 0 } = await req.json();

    console.log('Verifying payment method:', { customerId, paymentMethodId, verifyAmountInPence });

    // Step 1: Get customer details from database
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('email, first_name, last_name, stripe_customer_id')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      throw new Error('Customer not found');
    }

    // Step 2: Get or create Stripe customer
    let stripeCustomerId = customer.stripe_customer_id;

    if (!stripeCustomerId) {
      // Search for existing Stripe customer by email
      const existingCustomers = await stripe.customers.list({
        email: customer.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
      } else {
        // Create new Stripe customer
        const newStripeCustomer = await stripe.customers.create({
          email: customer.email,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          metadata: {
            customer_id: customerId.toString(),
          },
        });
        stripeCustomerId = newStripeCustomer.id;
      }

      // Update customer with Stripe customer ID
      await supabase
        .from('customers')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', customerId);

      console.log('Created/found Stripe customer:', stripeCustomerId);
    }

    // Step 3: Attach payment method to Stripe customer
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });
      console.log('Payment method attached to customer');
    } catch (attachError: any) {
      // If already attached, continue
      if (attachError.code !== 'resource_already_attached') {
        throw attachError;
      }
      console.log('Payment method already attached');
    }

    // Step 4: Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Step 5: Save to customer_payment_methods table
    const { data: existingMethod } = await supabase
      .from('customer_payment_methods')
      .select('id, is_default')
      .eq('customer_id', customerId)
      .eq('stripe_payment_method_id', paymentMethodId)
      .single();

    if (!existingMethod) {
      // Check if customer has any payment methods
      const { data: existingMethods } = await supabase
        .from('customer_payment_methods')
        .select('id')
        .eq('customer_id', customerId)
        .limit(1);

      const isFirstMethod = !existingMethods || existingMethods.length === 0;

      await supabase.from('customer_payment_methods').insert({
        customer_id: customerId,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_method_id: paymentMethodId,
        card_brand: paymentMethod.card?.brand || 'unknown',
        card_last4: paymentMethod.card?.last4 || '0000',
        card_exp_month: paymentMethod.card?.exp_month || 1,
        card_exp_year: paymentMethod.card?.exp_year || 2030,
        is_default: isFirstMethod,
      });

      console.log('Payment method saved to database');
    }

    // Step 6: For non-urgent bookings, perform £1 verification
    if (verifyAmountInPence > 0) {
      console.log('Performing £1 verification...');

      const paymentIntent = await stripe.paymentIntents.create({
        amount: verifyAmountInPence,
        currency: 'gbp',
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        capture_method: 'manual',
        confirm: true,
        off_session: true,
        description: `Card verification for amount £${(totalAmountInPence / 100).toFixed(2)}`,
        metadata: {
          customer_id: customerId.toString(),
          verification_only: 'true',
        },
      });

      console.log('Verification PaymentIntent created:', paymentIntent.id);

      // Immediately cancel the authorization
      await stripe.paymentIntents.cancel(paymentIntent.id);
      console.log('Verification authorization cancelled');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in stripe-verify-payment-method:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Card verification failed',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
