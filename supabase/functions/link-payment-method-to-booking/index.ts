import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, stripeSetupIntentId, stripePaymentMethodId } = await req.json();

    console.log('[link-payment-method-to-booking] Request:', { bookingId, stripeSetupIntentId, stripePaymentMethodId });

    if (!bookingId) {
      throw new Error('bookingId is required');
    }

    if (!stripeSetupIntentId && !stripePaymentMethodId) {
      throw new Error('Either stripeSetupIntentId or stripePaymentMethodId is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // Get the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customer, email, payment_status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('[link-payment-method-to-booking] Booking not found:', bookingError);
      throw new Error('Booking not found');
    }

    console.log('[link-payment-method-to-booking] Found booking:', booking);

    let paymentMethodId = stripePaymentMethodId;
    let stripeCustomerId: string | null = null;

    // If we have a SetupIntent ID, retrieve it to get the payment method
    if (stripeSetupIntentId) {
      console.log('[link-payment-method-to-booking] Retrieving SetupIntent:', stripeSetupIntentId);
      const setupIntent = await stripe.setupIntents.retrieve(stripeSetupIntentId);
      paymentMethodId = setupIntent.payment_method as string;
      stripeCustomerId = setupIntent.customer as string | null;
      console.log('[link-payment-method-to-booking] SetupIntent payment_method:', paymentMethodId, 'customer:', stripeCustomerId);
    }

    if (!paymentMethodId) {
      throw new Error('Could not determine payment method');
    }

    // Get the payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    console.log('[link-payment-method-to-booking] Payment method:', paymentMethod.type, paymentMethod.card?.brand);

    // Get or create the Stripe customer ID from our database
    if (!stripeCustomerId && booking.customer) {
      const { data: existingPm } = await supabase
        .from('customer_payment_methods')
        .select('stripe_customer_id')
        .eq('customer_id', booking.customer)
        .limit(1)
        .single();

      stripeCustomerId = existingPm?.stripe_customer_id || null;
    }

    // If no Stripe customer exists, create one and attach the payment method
    if (!stripeCustomerId) {
      // Get customer email
      let customerEmail = booking.email;
      if (!customerEmail && booking.customer) {
        const { data: customer } = await supabase
          .from('customers')
          .select('email')
          .eq('id', booking.customer)
          .single();
        customerEmail = customer?.email;
      }

      console.log('[link-payment-method-to-booking] Creating new Stripe customer with email:', customerEmail);
      const stripeCustomer = await stripe.customers.create({
        email: customerEmail || undefined,
        metadata: {
          supabase_customer_id: booking.customer?.toString() || '',
          booking_id: bookingId.toString()
        }
      });
      stripeCustomerId = stripeCustomer.id;
      console.log('[link-payment-method-to-booking] Created Stripe customer:', stripeCustomerId);

      // Attach the payment method to the customer
      await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomerId });
    }

    // Set as default payment method
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    // Save the payment method to our database
    if (booking.customer) {
      const cardDetails = paymentMethod.card;
      
      // Check if this payment method already exists
      const { data: existingMethod } = await supabase
        .from('customer_payment_methods')
        .select('id')
        .eq('stripe_payment_method_id', paymentMethodId)
        .single();

      if (!existingMethod) {
        // Insert new payment method
        const { error: insertError } = await supabase
          .from('customer_payment_methods')
          .insert({
            customer_id: booking.customer,
            stripe_customer_id: stripeCustomerId,
            stripe_payment_method_id: paymentMethodId,
            card_brand: cardDetails?.brand || paymentMethod.type,
            card_last4: cardDetails?.last4 || '****',
            card_exp_month: cardDetails?.exp_month,
            card_exp_year: cardDetails?.exp_year,
            is_default: true
          });

        if (insertError) {
          console.error('[link-payment-method-to-booking] Error saving payment method:', insertError);
          // Don't throw - booking is still valid
        } else {
          console.log('[link-payment-method-to-booking] Payment method saved to database');
          
          // Set other payment methods as non-default
          await supabase
            .from('customer_payment_methods')
            .update({ is_default: false })
            .eq('customer_id', booking.customer)
            .neq('stripe_payment_method_id', paymentMethodId);
        }
      }
    }

    console.log('[link-payment-method-to-booking] Successfully linked payment method to booking');

    return new Response(
      JSON.stringify({
        success: true,
        stripeCustomerId,
        paymentMethodId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[link-payment-method-to-booking] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
