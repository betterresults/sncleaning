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
  booking_ids?: number[]; // Optional: when creating a combined link for multiple bookings
  collect_payment_method?: boolean; // If true, also collect payment method for future use
  payment_method_type?: string; // 'card' | 'revolut_pay' | 'amazon_pay' | etc.
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      customer_id, 
      email, 
      name, 
      amount, 
      description = 'Cleaning Service Payment',
      booking_id,
      booking_ids,
      collect_payment_method = false,
      payment_method_type
    }: SendPaymentLinkRequest = await req.json();

    console.log('Sending payment link for:', { customer_id, email, amount, description, payment_method_type });

    // Check if Stripe customer already exists (for reference, but don't create yet)
    let existingStripeCustomerId: string | undefined;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      existingStripeCustomerId = existingCustomers.data[0].id;
      console.log('Found existing Stripe customer:', existingStripeCustomerId);
    } else {
      console.log('No existing Stripe customer - will be created when customer starts checkout');
    }

    const successUrl = `${req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://dkomihipebixlegygnoy.supabase.co'}/auth?payment_success=true`;
    const cancelUrl = `${req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://dkomihipebixlegygnoy.supabase.co'}/auth?payment_cancelled=true`;

    // If collect_payment_method is true, use Checkout Session (supports saving card)
    // Otherwise use Payment Link (simpler, doesn't save card)
    if (collect_payment_method) {
      // Use existing customer if found, otherwise let Stripe create one during checkout
      const sessionConfig: any = {
        mode: 'payment',
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
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          setup_future_usage: 'off_session', // Save payment method for future use
          metadata: {
            customer_id: customer_id.toString(),
            booking_id: booking_id?.toString() || ''
          }
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        billing_address_collection: 'auto',
        metadata: {
          customer_id: customer_id.toString(),
          booking_id: booking_id?.toString() || '',
          collect_payment_method: 'true',
          customer_email: email,
          customer_name: name
        }
      };

      // Configure payment methods based on type selected
      if (!payment_method_type || payment_method_type === 'card') {
        // Card only - use explicit type to avoid automatic_payment_methods conflicts
        sessionConfig.payment_method_types = ['card'];
      } else if (payment_method_type === 'revolut_pay') {
        sessionConfig.payment_method_types = ['revolut_pay'];
      } else if (payment_method_type === 'amazon_pay') {
        sessionConfig.payment_method_types = ['amazon_pay'];
      } else if (payment_method_type === 'link') {
        sessionConfig.payment_method_types = ['link', 'card'];
      } else {
        // For any other type, try to use it directly
        sessionConfig.payment_method_types = [payment_method_type];
      }

      // Only attach existing customer, otherwise let Stripe create during checkout
      if (existingStripeCustomerId) {
        sessionConfig.customer = existingStripeCustomerId;
      } else {
        sessionConfig.customer_creation = 'always';
        sessionConfig.customer_email = email;
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      console.log('Created checkout session with card saving:', session.id);

      // Persist link and session ID for webhook matching
      if (booking_id && session.url) {
        await supabase.from('bookings').update({ 
          invoice_link: session.url,
          invoice_id: session.id  // Store session ID for webhook matching
        }).eq('id', booking_id);
        await supabase.from('past_bookings').update({ 
          invoice_link: session.url,
          invoice_id: session.id  // Store session ID for webhook matching
        }).eq('id', booking_id);
      }
      if (Array.isArray(booking_ids) && booking_ids.length > 0 && session.url) {
        await supabase.from('bookings').update({ invoice_link: session.url }).in('id', booking_ids);
        await supabase.from('past_bookings').update({ invoice_link: session.url }).in('id', booking_ids);
      }

      return new Response(JSON.stringify({
        success: true,
        payment_link_url: session.url,
        stripe_customer_id: existingStripeCustomerId || null, // Will be set by webhook if newly created
        session_id: session.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Use Payment Link for simple one-time payments without saving card
      const paymentLink = await stripe.paymentLinks.create({
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
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        after_completion: {
          type: 'redirect',
          redirect: {
            url: successUrl
          }
        },
        automatic_tax: { enabled: false },
        billing_address_collection: 'auto',
        customer_creation: 'if_required',
        metadata: {
          customer_id: customer_id.toString(),
          booking_id: booking_id?.toString() || ''
        }
      });

      console.log('Created payment link:', paymentLink.id);

      // Persist link for the related booking(s)
      if (booking_id && paymentLink.url) {
        await supabase.from('bookings').update({ invoice_link: paymentLink.url }).eq('id', booking_id);
        await supabase.from('past_bookings').update({ invoice_link: paymentLink.url }).eq('id', booking_id);
      }
      if (Array.isArray(booking_ids) && booking_ids.length > 0 && paymentLink.url) {
        await supabase.from('bookings').update({ invoice_link: paymentLink.url }).in('id', booking_ids);
        await supabase.from('past_bookings').update({ invoice_link: paymentLink.url }).in('id', booking_ids);
      }

      return new Response(JSON.stringify({
        success: true,
        payment_link_url: paymentLink.url,
        stripe_customer_id: existingStripeCustomerId || null, // Will be set when customer completes payment
        payment_link_id: paymentLink.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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