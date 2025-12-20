import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { customer_id, card_number, exp_month, exp_year, cvc, customer_email, customer_name } = await req.json();

    console.log("Adding card manually for customer:", customer_id);

    if (!customer_id || !card_number || !exp_month || !exp_year || !cvc) {
      throw new Error("Missing required fields: customer_id, card_number, exp_month, exp_year, cvc");
    }

    // Get customer details from database if not provided
    let email = customer_email;
    let name = customer_name;
    
    if (!email || !name) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('email, first_name, last_name')
        .eq('id', customer_id)
        .maybeSingle();
      
      if (customerData) {
        email = email || customerData.email;
        name = name || `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim();
      }
    }

    if (!email) {
      throw new Error("Customer email is required");
    }

    // Check if customer already has a Stripe customer ID
    const { data: existingPaymentMethod } = await supabase
      .from('customer_payment_methods')
      .select('stripe_customer_id')
      .eq('customer_id', customer_id)
      .limit(1)
      .maybeSingle();

    let stripeCustomerId = existingPaymentMethod?.stripe_customer_id;

    // If no existing Stripe customer, search or create one
    if (!stripeCustomerId) {
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
        console.log("Found existing Stripe customer:", stripeCustomerId);
      } else {
        const newCustomer = await stripe.customers.create({
          email: email,
          name: name || undefined,
          metadata: {
            internal_customer_id: customer_id.toString(),
          },
        });
        stripeCustomerId = newCustomer.id;
        console.log("Created new Stripe customer:", stripeCustomerId);
      }
    }

    // Create a payment method using the card details
    // Note: In production, you should use Stripe.js on the frontend for PCI compliance
    // This approach should only be used if you have SAQ-D PCI compliance
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: card_number.replace(/\s/g, ''), // Remove spaces
        exp_month: parseInt(exp_month),
        exp_year: parseInt(exp_year),
        cvc: cvc,
      },
    });

    console.log("Created payment method:", paymentMethod.id);

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: stripeCustomerId,
    });

    console.log("Attached payment method to customer");

    // Set as default payment method
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    // Check how many payment methods this customer has
    const { count } = await supabase
      .from('customer_payment_methods')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer_id);

    const isFirstPaymentMethod = (count || 0) === 0;

    // If this is the first payment method, unset any existing defaults first
    if (isFirstPaymentMethod) {
      // No need to update others, this will be the default
    } else {
      // Unset other defaults for this customer
      await supabase
        .from('customer_payment_methods')
        .update({ is_default: false })
        .eq('customer_id', customer_id);
    }

    // Save to database
    const { data: savedMethod, error: saveError } = await supabase
      .from('customer_payment_methods')
      .insert({
        customer_id: customer_id,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_method_id: paymentMethod.id,
        card_brand: paymentMethod.card?.brand || 'unknown',
        card_last4: paymentMethod.card?.last4 || '****',
        card_exp_month: paymentMethod.card?.exp_month,
        card_exp_year: paymentMethod.card?.exp_year,
        is_default: true, // New card is always set as default
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving payment method:", saveError);
      throw new Error("Failed to save payment method to database");
    }

    console.log("Saved payment method to database:", savedMethod.id);

    return new Response(
      JSON.stringify({
        success: true,
        payment_method: {
          id: savedMethod.id,
          card_brand: savedMethod.card_brand,
          card_last4: savedMethod.card_last4,
          card_exp_month: savedMethod.card_exp_month,
          card_exp_year: savedMethod.card_exp_year,
          is_default: savedMethod.is_default,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error adding card manually:", error);
    
    // Handle Stripe-specific errors
    let errorMessage = error.message;
    if (error.type === 'StripeCardError') {
      errorMessage = error.message; // Card was declined
    } else if (error.type === 'StripeInvalidRequestError') {
      errorMessage = 'Invalid card details provided';
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
