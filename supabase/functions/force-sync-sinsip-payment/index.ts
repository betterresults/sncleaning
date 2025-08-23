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
    console.log('=== FORCE SYNC SINSIP PAYMENT METHOD ===');

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false 
        } 
      }
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const email = 'sinsip.2014@gmail.com';
    const customerId = 373;
    const stripeCustomerId = 'cus_QQMXWb8nYmHwmB';

    console.log('Step 1: Update Stripe customer metadata');
    
    // Update Stripe customer metadata
    const updatedStripeCustomer = await stripe.customers.update(stripeCustomerId, {
      metadata: {
        customer_id: customerId.toString()
      }
    });
    
    console.log('Stripe customer updated:', updatedStripeCustomer.id, updatedStripeCustomer.metadata);

    console.log('Step 2: Fetch payment methods from Stripe');
    
    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card'
    });

    console.log(`Found ${paymentMethods.data.length} payment methods in Stripe`);

    if (paymentMethods.data.length === 0) {
      throw new Error('No payment methods found in Stripe');
    }

    console.log('Step 3: Clear existing payment methods in database');
    
    // Clear any existing payment methods for this customer
    const { error: deleteError } = await supabaseAdmin
      .from('customer_payment_methods')
      .delete()
      .eq('customer_id', customerId);

    if (deleteError) {
      console.log('Delete error (might be expected if no records exist):', deleteError);
    }

    console.log('Step 4: Insert payment methods into database');

    const insertedMethods = [];

    for (let i = 0; i < paymentMethods.data.length; i++) {
      const pm = paymentMethods.data[i];
      console.log(`Processing payment method ${i + 1}/${paymentMethods.data.length}: ${pm.id}`);
      
      const pmData = {
        customer_id: customerId,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_method_id: pm.id,
        card_brand: pm.card?.brand || null,
        card_last4: pm.card?.last4 || null,
        card_exp_month: pm.card?.exp_month || null,
        card_exp_year: pm.card?.exp_year || null,
        is_default: i === 0 // Set first one as default
      };

      console.log('Inserting payment method data:', pmData);

      const { data: insertResult, error: insertError } = await supabaseAdmin
        .from('customer_payment_methods')
        .insert(pmData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Successfully inserted:', insertResult);
      insertedMethods.push(insertResult);
    }

    console.log('Step 5: Verify final result');

    const { data: finalCheck, error: checkError } = await supabaseAdmin
      .from('customer_payment_methods')
      .select('*')
      .eq('customer_id', customerId);

    if (checkError) {
      throw checkError;
    }

    console.log('Final verification - payment methods in database:', finalCheck);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully synced ${insertedMethods.length} payment methods for ${email}`,
      customerId,
      stripeCustomerId,
      paymentMethods: finalCheck,
      insertedMethods
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in force sync:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});