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
    }

    // If no existing Stripe customer, find or create one
    if (!stripeCustomerId) {
      // First try to find by internal_customer_id in metadata (if we have one)
      if (internalCustomerId && internalCustomerId > 0) {
        const existingCustomers = await stripe.customers.search({
          query: `metadata['internal_customer_id']:'${internalCustomerId}'`,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          stripeCustomerId = existingCustomers.data[0].id;
          console.log("Found existing Stripe customer by metadata:", stripeCustomerId);
        }
      }
      
      // If still no customer, search by email as fallback for guests
      if (!stripeCustomerId) {
        const existingByEmail = await stripe.customers.list({
          email: customerEmail,
          limit: 1,
        });

        if (existingByEmail.data.length > 0) {
          stripeCustomerId = existingByEmail.data[0].id;
          console.log("Found existing Stripe customer by email:", stripeCustomerId);
        }
      }

      // Create new Stripe customer if none found
      if (!stripeCustomerId) {
        const newCustomer = await stripe.customers.create({
          email: customerEmail,
          name: customerName || undefined,
          metadata: internalCustomerId && internalCustomerId > 0 ? {
            internal_customer_id: internalCustomerId.toString(),
          } : {},
        });
        stripeCustomerId = newCustomer.id;
        console.log("Created new Stripe customer:", stripeCustomerId);
      }
    }

    // Create a SetupIntent with automatic payment methods enabled
    // This allows Stripe to show all enabled payment methods (Revolut Pay, Amazon Pay, etc.)
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      automatic_payment_methods: { 
        enabled: true,
        allow_redirects: 'always' // Allow redirect-based payment methods like Revolut Pay
      },
      metadata: internalCustomerId && internalCustomerId > 0 ? {
        internal_customer_id: internalCustomerId.toString(),
      } : {
        guest_email: customerEmail,
      },
    });

    console.log("Created SetupIntent:", setupIntent.id, "for Stripe customer:", stripeCustomerId);

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
