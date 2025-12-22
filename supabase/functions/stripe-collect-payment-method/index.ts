import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Handlebars from "https://esm.sh/handlebars@4.7.8";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CollectPaymentMethodRequest {
  customer_id: number;
  email: string;
  name: string;
  return_url?: string;
  booking_details?: {
    address?: string;
    total_cost?: number;
    cleaning_type?: string;
    date_time?: string;
  };
  collect_only?: boolean; // Flag to indicate collect-only mode (no booking)
  send_email?: boolean;
}

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

    const { customer_id, email, name, return_url, booking_details, collect_only, send_email }: CollectPaymentMethodRequest = await req.json();

    console.log('Collecting payment method for customer:', { customer_id, email, name, collect_only, send_email });

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

    // Create Setup Intent for collecting payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomer.id,
      automatic_payment_methods: { enabled: true },
      usage: 'off_session', // For future payments
      metadata: {
        customer_id: customer_id.toString()
      }
    });

    console.log('Created Setup Intent:', setupIntent.id);

    // Create Checkout Session for payment method collection
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://dkomihipebixlegygnoy.supabase.co';
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      mode: 'setup',
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic'
        }
      },
      success_url: return_url || `${origin}/customer-settings?payment_method_added=true`,
      cancel_url: return_url || `${origin}/customer-settings?payment_method_cancelled=true`,
      metadata: {
        customer_id: customer_id.toString(),
        setup_intent_id: setupIntent.id
      }
    });

    console.log('Created Checkout Session:', checkoutSession.id);

    // Send email if requested
    if (send_email && checkoutSession.url) {
      try {
        // Get the email template
        const { data: template, error: templateError } = await supabaseAdmin
          .from('email_notification_templates')
          .select('*')
          .eq('name', 'payment_method_collection')
          .eq('is_active', true)
          .single();

        if (!templateError && template) {
          // Prepare template variables
          const isCollectOnly = collect_only === true;
          const hasBookingData = !isCollectOnly && booking_details;
          
          const bookingDate = hasBookingData && booking_details?.date_time ? 
            new Date(booking_details.date_time).toLocaleDateString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : '';

          // Compile template with Handlebars
          const compiledTemplate = Handlebars.compile(template.html_content);
          
          // Render template with data
          const processedHtml = compiledTemplate({
            customer_name: name,
            has_booking_data: hasBookingData,
            booking_date: bookingDate || null,
            address: booking_details?.address || null,
            total_cost: booking_details?.total_cost || null,
            payment_link: checkoutSession.url
          });

          // Send the email using the send-notification-email function
          // Don't send variables when using custom_content to avoid double processing
          const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              template_id: template.id,
              recipient_email: email,
              variables: {}, // Empty variables to avoid double processing
              custom_content: processedHtml
            })
          });

          if (emailResponse.ok) {
            console.log('Payment method collection email sent successfully');
          } else {
            console.error('Failed to send payment method collection email');
          }
        } else {
          console.error('Payment method collection template not found:', templateError);
        }
      } catch (emailError) {
        console.error('Error sending payment method collection email:', emailError);
        // Don't fail the entire request if email fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      checkout_url: checkoutSession.url,
      setup_intent_id: setupIntent.id,
      stripe_customer_id: stripeCustomer.id,
      session_id: checkoutSession.id,
      email_sent: send_email || false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in collect-payment-method:', error);
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