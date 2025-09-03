import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CollectPaymentMethodRequest {
  customer_id: number;
  email: string;
  name: string;
  return_url?: string;
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

    const { customer_id, email, name, return_url }: CollectPaymentMethodRequest = await req.json();

    console.log('Collecting payment method for customer:', { customer_id, email, name });

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
      payment_method_types: ['card'],
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
      payment_method_types: ['card'],
      success_url: return_url || `${origin}/customer-settings?payment_method_added=true`,
      cancel_url: return_url || `${origin}/customer-settings?payment_method_cancelled=true`,
      metadata: {
        customer_id: customer_id.toString(),
        setup_intent_id: setupIntent.id
      }
    });

    console.log('Created Checkout Session:', checkoutSession.id);

    // Send email with payment method collection link
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log('RESEND_API_KEY exists:', !!resendApiKey);
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable is not set');
      return new Response(JSON.stringify({
        success: true,
        checkout_url: checkoutSession.url,
        setup_intent_id: setupIntent.id,
        stripe_customer_id: stripeCustomer.id,
        session_id: checkoutSession.id,
        email_sent: false,
        email_error: 'RESEND_API_KEY not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const resend = new Resend(resendApiKey);
    
    try {
      console.log('Attempting to send email to:', email);
      console.log('Using from address: SN Cleaning <noreply@notifications.sncleaningservices.co.uk>');
      
      const emailResult = await resend.emails.send({
        from: "SN Cleaning <noreply@notifications.sncleaningservices.co.uk>",
        to: [email],
        subject: "Set Up Your Payment Method - SN Cleaning",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin-bottom: 10px;">SN Cleaning</h1>
              <h2 style="color: #374151; font-size: 24px; margin-bottom: 20px;">Set Up Your Payment Method</h2>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <p style="margin: 0; color: #374151; font-size: 16px;">Hello ${name},</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-top: 15px;">
                We need to collect your payment method details to process future payments for your cleaning services.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${checkoutSession.url}" 
                 style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                Set Up Payment Method
              </a>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Secure Payment:</strong> Your payment details are processed securely by Stripe. We never store your card information.
              </p>
            </div>
            
            <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
              <p>This secure link will allow you to:</p>
              <ul style="margin: 10px 0;">
                <li>Safely enter your payment method details</li>
                <li>Authorize future payments for your cleaning services</li>
                <li>Manage your payment preferences</li>
              </ul>
              <p style="margin-top: 20px;">
                If you didn't request this or have any questions, please contact us immediately.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} SN Cleaning. All rights reserved.
              </p>
            </div>
          </div>
        `
      });
      
      console.log('Email send result:', JSON.stringify(emailResult, null, 2));
      
      if (emailResult.error) {
        console.error('Resend API returned an error:', emailResult.error);
        throw new Error(`Resend error: ${JSON.stringify(emailResult.error)}`);
      }
      
      if (!emailResult.data || !emailResult.data.id) {
        console.error('No email ID returned from Resend:', emailResult);
        throw new Error('No email ID returned from Resend API');
      }
      
      console.log('Payment method collection email sent successfully to:', email);
      console.log('Email ID:', emailResult.data.id);
      
    } catch (emailError) {
      console.error('Failed to send payment method collection email:', emailError);
      console.error('Email error details:', JSON.stringify(emailError, null, 2));
      console.error('Email error message:', emailError.message);
      console.error('Email error stack:', emailError.stack);
      
      return new Response(JSON.stringify({
        success: true,
        checkout_url: checkoutSession.url,
        setup_intent_id: setupIntent.id,
        stripe_customer_id: stripeCustomer.id,
        session_id: checkoutSession.id,
        email_sent: false,
        email_error: emailError.message || 'Unknown email error',
        email_error_details: emailError.toString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      checkout_url: checkoutSession.url,
      setup_intent_id: setupIntent.id,
      stripe_customer_id: stripeCustomer.id,
      session_id: checkoutSession.id,
      email_sent: true
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