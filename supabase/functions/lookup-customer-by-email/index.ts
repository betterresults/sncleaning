import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Look up customer by email
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, first_name, last_name, full_name, phone')
      .eq('email', email)
      .single();

    if (customerError || !customer) {
      console.log('[lookup-customer-by-email] No customer found for email:', email);
      return new Response(
        JSON.stringify({ 
          found: false,
          customer: null,
          paymentMethods: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[lookup-customer-by-email] Found customer:', customer.id, customer.first_name, customer.last_name);

    // Fetch their saved payment methods
    const { data: paymentMethods, error: pmError } = await supabaseAdmin
      .from('customer_payment_methods')
      .select('id, card_brand, card_last4, card_exp_month, card_exp_year, is_default, stripe_payment_method_id, stripe_customer_id')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (pmError) {
      console.error('[lookup-customer-by-email] Error fetching payment methods:', pmError);
    }

    console.log('[lookup-customer-by-email] Found payment methods:', paymentMethods?.length || 0);

    return new Response(
      JSON.stringify({
        found: true,
        customer: {
          id: customer.id,
          firstName: customer.first_name,
          lastName: customer.last_name,
          fullName: customer.full_name,
          phone: customer.phone
        },
        paymentMethods: paymentMethods || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[lookup-customer-by-email] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
