import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendPaymentLinkRequest {
  customer_id: number;
  email: string;
  name: string;
  amount: number;
  description?: string;
  booking_id?: number;
  collect_payment_method?: boolean; // If true, also collect payment method for future use
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const { 
      customer_id, 
      email, 
      name, 
      amount, 
      description = 'Cleaning Service Payment',
      booking_id,
      collect_payment_method = false
    }: SendPaymentLinkRequest = await req.json();

    console.log('Sending payment link for:', { customer_id, email, amount, description });

    // Check if Stripe customer exists
    let stripeCustomer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomer = existingCustomers.data[0];
      console.log('Found existing Stripe customer:', stripeCustomer.id);
    } else {
      // Create new Stripe customer
      stripeCustomer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          customer_id: customer_id.toString()
        }
      });
      console.log('Created new Stripe customer:', stripeCustomer.id);
    }

    // Create payment link with payment method collection
    const paymentLinkConfig: any = {
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: description,
              metadata: {
                customer_id: customer_id.toString(),
                booking_id: booking_id?.toString() || ''
              }
            },
            unit_amount: Math.round(amount * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://dkomihipebixlegygnoy.supabase.co'}/auth?payment_success=true`
        }
      },
      automatic_tax: { enabled: false },
      billing_address_collection: 'auto',
      customer_creation: 'if_required',
      metadata: {
        customer_id: customer_id.toString(),
        booking_id: booking_id?.toString() || '',
        collect_payment_method: collect_payment_method.toString()
      }
    };

    // If we want to collect payment method, configure the link to save the card
    if (collect_payment_method) {
      paymentLinkConfig.customer = stripeCustomer.id;
      paymentLinkConfig.payment_method_collection = 'always';
      paymentLinkConfig.payment_method_types = ['card'];
    }

    const paymentLink = await stripe.paymentLinks.create(paymentLinkConfig);

    console.log('Created payment link:', paymentLink.id);

    return new Response(JSON.stringify({
      success: true,
      payment_link_url: paymentLink.url,
      stripe_customer_id: stripeCustomer.id,
      payment_link_id: paymentLink.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-payment-link:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);