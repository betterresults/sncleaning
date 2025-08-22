import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response('Webhook signature missing', { status: 400 });
    }

    // For now, we'll verify this is a valid request by checking the signature exists
    // In production, you should set up a webhook endpoint secret in Stripe
    let event;
    try {
      // Parse the event (for now without signature verification)
      event = JSON.parse(body);
      console.log('Received Stripe webhook event:', event.type);
    } catch (err) {
      console.error('Error parsing webhook body:', err);
      return new Response('Invalid JSON', { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'setup_intent.succeeded': {
        console.log('Processing setup_intent.succeeded event');
        const setupIntent = event.data.object;
        
        if (setupIntent.payment_method && setupIntent.customer) {
          await syncPaymentMethodToDatabase(stripe, supabaseAdmin, setupIntent.customer, setupIntent.payment_method);
        }
        break;
      }
      
      case 'payment_method.attached': {
        console.log('Processing payment_method.attached event');
        const paymentMethod = event.data.object;
        
        if (paymentMethod.customer) {
          await syncPaymentMethodToDatabase(stripe, supabaseAdmin, paymentMethod.customer, paymentMethod.id);
        }
        break;
      }

      case 'checkout.session.completed': {
        console.log('Processing checkout.session.completed event');
        const session = event.data.object;
        
        // Sync payment method if one was collected during checkout
        if (session.payment_method && session.customer) {
          await syncPaymentMethodToDatabase(stripe, supabaseAdmin, session.customer, session.payment_method);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        console.log('Processing payment_intent.succeeded event');
        const paymentIntent = event.data.object;
        
        // Sync payment method if one was used for the payment
        if (paymentIntent.payment_method && paymentIntent.customer) {
          await syncPaymentMethodToDatabase(stripe, supabaseAdmin, paymentIntent.customer, paymentIntent.payment_method);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

async function syncPaymentMethodToDatabase(
  stripe: Stripe, 
  supabaseAdmin: any, 
  stripeCustomerId: string, 
  paymentMethodId: string
) {
  try {
    console.log('Syncing payment method to database:', { stripeCustomerId, paymentMethodId });

    // Get the payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    console.log('Retrieved payment method from Stripe:', paymentMethod.id);

    // Get customer from Stripe metadata first (this is more reliable)
    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
    const customerIdFromMetadata = stripeCustomer.metadata?.customer_id;
    
    if (!customerIdFromMetadata) {
      console.error('No customer_id in Stripe customer metadata for customer:', stripeCustomerId);
      return;
    }

    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('id', parseInt(customerIdFromMetadata))
      .single();

    if (customerError) {
      console.error('Customer not found in database with ID:', customerIdFromMetadata, customerError);
      return;
    }

    if (!customerData) {
      console.error('Customer not found in database');
      return;
    }

    console.log('Found customer in database:', customerData.id);

    // Check if payment method already exists
    const { data: existingPaymentMethod } = await supabaseAdmin
      .from('customer_payment_methods')
      .select('id')
      .eq('customer_id', customerData.id)
      .eq('stripe_payment_method_id', paymentMethod.id)
      .single();

    if (existingPaymentMethod) {
      console.log('Payment method already exists in database');
      return;
    }

    // Check if this is the first payment method for this customer
    const { data: existingMethods } = await supabaseAdmin
      .from('customer_payment_methods')
      .select('id')
      .eq('customer_id', customerData.id);

    const isFirstPaymentMethod = !existingMethods || existingMethods.length === 0;

    // Insert the payment method into our database
    const { error: insertError } = await supabaseAdmin
      .from('customer_payment_methods')
      .insert({
        customer_id: customerData.id,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_method_id: paymentMethod.id,
        card_brand: paymentMethod.card?.brand || null,
        card_last4: paymentMethod.card?.last4 || null,
        card_exp_month: paymentMethod.card?.exp_month || null,
        card_exp_year: paymentMethod.card?.exp_year || null,
        is_default: isFirstPaymentMethod // First payment method becomes default
      });

    if (insertError) {
      console.error('Error inserting payment method:', insertError);
      return;
    }

    console.log('Successfully synced payment method to database');

  } catch (error) {
    console.error('Error syncing payment method:', error);
  }
}

serve(handler);