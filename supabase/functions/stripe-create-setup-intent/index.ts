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

    const { customer_id } = await req.json();

    console.log("Creating SetupIntent for customer:", customer_id);

    if (!customer_id) {
      throw new Error("customer_id is required");
    }

    // Get customer details
    const { data: customerData } = await supabase
      .from('customers')
      .select('email, first_name, last_name')
      .eq('id', customer_id)
      .maybeSingle();

    if (!customerData?.email) {
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
        email: customerData.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
        console.log("Found existing Stripe customer:", stripeCustomerId);
      } else {
        const name = `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim();
        const newCustomer = await stripe.customers.create({
          email: customerData.email,
          name: name || undefined,
          metadata: {
            internal_customer_id: customer_id.toString(),
          },
        });
        stripeCustomerId = newCustomer.id;
        console.log("Created new Stripe customer:", stripeCustomerId);
      }
    }

    // Create a SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      metadata: {
        internal_customer_id: customer_id.toString(),
      },
    });

    console.log("Created SetupIntent:", setupIntent.id);

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
