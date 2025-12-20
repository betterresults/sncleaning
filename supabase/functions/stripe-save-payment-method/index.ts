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

    const { customer_id, payment_method_id, stripe_customer_id } = await req.json();

    console.log("Saving payment method:", payment_method_id, "for customer:", customer_id);

    if (!customer_id || !payment_method_id || !stripe_customer_id) {
      throw new Error("customer_id, payment_method_id, and stripe_customer_id are required");
    }

    // Get payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);

    console.log("Retrieved payment method details:", paymentMethod.id);

    // Set as default payment method
    await stripe.customers.update(stripe_customer_id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });

    // Unset other defaults for this customer
    await supabase
      .from('customer_payment_methods')
      .update({ is_default: false })
      .eq('customer_id', customer_id);

    // Save to database
    const { data: savedMethod, error: saveError } = await supabase
      .from('customer_payment_methods')
      .insert({
        customer_id: customer_id,
        stripe_customer_id: stripe_customer_id,
        stripe_payment_method_id: payment_method_id,
        card_brand: paymentMethod.card?.brand || 'unknown',
        card_last4: paymentMethod.card?.last4 || '****',
        card_exp_month: paymentMethod.card?.exp_month,
        card_exp_year: paymentMethod.card?.exp_year,
        is_default: true,
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
    console.error("Error saving payment method:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
