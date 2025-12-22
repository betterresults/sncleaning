import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    const { customer_id, email, name } = await req.json();

    console.log("Creating SetupIntent for customer:", { customer_id, email, name });

    // For guest bookings (no customer_id), we still need email
    if (!customer_id && !email) {
      throw new Error("customer_id or email is required");
    }

    let customerEmail = email;
    let customerName = name;
    let internalCustomerId = customer_id;

    // If we have a customer_id, get their details
    if (customer_id && customer_id > 0) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('email, first_name, last_name')
        .eq('id', customer_id)
        .maybeSingle();

      if (customerData) {
        customerEmail = customerData.email || email;
        customerName = customerName || `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim();
      }
    }

    if (!customerEmail) {
      throw new Error("Customer email is required");
    }

    let stripeCustomerId: string | undefined;

    // Check if customer already has a Stripe customer ID (only if we have an internal customer)
    if (internalCustomerId && internalCustomerId > 0) {
      const { data: existingPaymentMethod } = await supabase
        .from('customer_payment_methods')
        .select('stripe_customer_id')
        .eq('customer_id', internalCustomerId)
        .limit(1)
        .maybeSingle();

      stripeCustomerId = existingPaymentMethod?.stripe_customer_id;
      
      // If no existing Stripe customer ID in our DB, try to find by metadata
      if (!stripeCustomerId) {
        const existingCustomers = await stripe.customers.search({
          query: `metadata['internal_customer_id']:'${internalCustomerId}'`,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          stripeCustomerId = existingCustomers.data[0].id;
          console.log("Found existing Stripe customer by metadata:", stripeCustomerId);
        }
      }
    }

    // IMPORTANT: Do NOT create a new Stripe customer here just for showing the PaymentElement
    // Stripe customers should only be created when the booking is actually completed
    // If we don't have an existing customer, create SetupIntent without customer attachment
    // The customer will be created/attached when the payment is confirmed via webhook
    
    // Create a SetupIntent - with or without customer
    const setupIntentParams: any = {
      automatic_payment_methods: { 
        enabled: true,
        allow_redirects: 'always' // Allow redirect-based payment methods like Revolut Pay
      },
      metadata: {
        guest_email: customerEmail,
        guest_name: customerName || '',
        ...(internalCustomerId && internalCustomerId > 0 ? { internal_customer_id: internalCustomerId.toString() } : {}),
      },
    };

    // Only attach customer if we found an existing one
    if (stripeCustomerId) {
      setupIntentParams.customer = stripeCustomerId;
      console.log("Attaching existing Stripe customer:", stripeCustomerId);
    } else {
      console.log("Creating SetupIntent without customer - customer will be created on booking completion");
    }

    const setupIntent = await stripe.setupIntents.create(setupIntentParams);

    console.log("Created SetupIntent:", setupIntent.id, stripeCustomerId ? `for Stripe customer: ${stripeCustomerId}` : "without customer");

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: setupIntent.client_secret,
        stripeCustomerId: stripeCustomerId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating SetupIntent:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
