import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

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
          const success = await syncPaymentMethodToDatabase(stripe, supabaseAdmin, setupIntent.customer, setupIntent.payment_method);
          if (success) {
            await sendPaymentMethodSuccessEmail(stripe, supabaseAdmin, setupIntent.customer, setupIntent.payment_method);
          }
        }
        break;
      }
      
      case 'setup_intent.setup_failed': {
        console.log('Processing setup_intent.setup_failed event');
        const setupIntent = event.data.object;
        
        if (setupIntent.customer) {
          await sendPaymentMethodFailureEmail(stripe, supabaseAdmin, setupIntent.customer, setupIntent.last_setup_error?.message || 'Payment method setup failed');
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

        // 1) Sync payment method if one was used for the payment
        if (paymentIntent.payment_method && paymentIntent.customer) {
          await syncPaymentMethodToDatabase(stripe, supabaseAdmin, paymentIntent.customer, paymentIntent.payment_method);
        }

        // 2) Mark booking as paid when the successful PI matches invoice_id
        try {
          const piId: string = paymentIntent.id;
          const amountCaptured = (paymentIntent.amount_received || paymentIntent.amount || 0) / 100;

          // Try upcoming bookings
          const { data: upcoming, error: upErr } = await supabaseAdmin
            .from('bookings')
            .select('id, total_cost, payment_status')
            .eq('invoice_id', piId)
            .single();

          if (!upErr && upcoming?.id) {
            console.log(`[stripe-webhook] Found upcoming booking ${upcoming.id} for PI ${piId}. Marking as paid.`);
            await supabaseAdmin
              .from('bookings')
              .update({ 
                payment_status: 'paid',
                additional_details: `Payment captured via Stripe webhook: £${amountCaptured} (PI: ${piId})` 
              })
              .eq('id', upcoming.id);
            break;
          }

          // Try past bookings
          const { data: past, error: pastErr } = await supabaseAdmin
            .from('past_bookings')
            .select('id, total_cost, payment_status')
            .eq('invoice_id', piId)
            .single();

          if (!pastErr && past?.id) {
            console.log(`[stripe-webhook] Found past booking ${past.id} for PI ${piId}. Marking as paid.`);
            await supabaseAdmin
              .from('past_bookings')
              .update({ 
                payment_status: 'paid',
                additional_details: `Payment captured via Stripe webhook: £${amountCaptured} (PI: ${piId})` 
              })
              .eq('id', past.id);
            break;
          }

          // Optional: If not matched by invoice_id, try to find bookings where additional_details include the PI id
          const { data: maybeBookings } = await supabaseAdmin
            .from('bookings')
            .select('id, additional_details')
            .ilike('additional_details', `%${piId}%`);

          if (maybeBookings && maybeBookings.length > 0) {
            console.log(`[stripe-webhook] Found booking(s) by additional_details for PI ${piId}. Updating first match.`);
            await supabaseAdmin
              .from('bookings')
              .update({ 
                additional_details: (maybeBookings[0].additional_details || '') + `\nPayment captured (secondary PI): £${amountCaptured} (PI: ${piId})` 
              })
              .eq('id', maybeBookings[0].id);
          } else {
            console.log(`[stripe-webhook] No booking found matching PI ${piId}`);
          }
        } catch (updateErr) {
          console.error('[stripe-webhook] Failed updating booking on payment_intent.succeeded:', updateErr);
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
): Promise<boolean> {
  try {
    console.log('Syncing payment method to database:', { stripeCustomerId, paymentMethodId });

    // Get the payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    console.log('Retrieved payment method from Stripe:', paymentMethod.id);

    // Get customer from Stripe metadata first (this is more reliable)
    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
    let customerIdFromMetadata = stripeCustomer.metadata?.customer_id;
    let customerData;

    if (customerIdFromMetadata) {
      // Try to find customer using metadata
      const { data: metadataCustomer, error: metadataError } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('id', parseInt(customerIdFromMetadata))
        .single();
      
      if (!metadataError && metadataCustomer) {
        customerData = metadataCustomer;
        console.log('Found customer using metadata:', customerData.id);
      }
    }

    // Fallback: If no customer found via metadata, try finding by email
    if (!customerData) {
      console.log('No customer found via metadata, trying email fallback for:', stripeCustomer.email);
      
      if (!stripeCustomer.email) {
        console.error('No email available for Stripe customer:', stripeCustomerId);
        return;
      }

      const { data: emailCustomer, error: emailError } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('email', stripeCustomer.email)
        .single();

      if (emailError || !emailCustomer) {
        console.error('Customer not found by email:', stripeCustomer.email, emailError);
        return;
      }

      customerData = emailCustomer;
      console.log('Found customer by email:', customerData.id);

      // Update Stripe customer metadata for future use
      try {
        await stripe.customers.update(stripeCustomerId, {
          metadata: {
            customer_id: customerData.id.toString(),
            internal_customer_id: customerData.id.toString()
          }
        });
        console.log('Updated Stripe customer metadata with customer_id:', customerData.id);
      } catch (updateError) {
        console.error('Failed to update Stripe customer metadata:', updateError);
        // Continue anyway - we found the customer
      }
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
      return false;
    }

    console.log('Successfully synced payment method to database');
    return true;

  } catch (error) {
    console.error('Error syncing payment method:', error);
    return false;
  }
}

async function sendPaymentMethodSuccessEmail(
  stripe: Stripe,
  supabaseAdmin: any,
  stripeCustomerId: string,
  paymentMethodId: string
) {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping success email');
      return;
    }

    // Get customer and payment method details
    const [stripeCustomer, paymentMethod] = await Promise.all([
      stripe.customers.retrieve(stripeCustomerId),
      stripe.paymentMethods.retrieve(paymentMethodId)
    ]);

    if (!stripeCustomer.email) {
      console.log('No email for customer, skipping success email');
      return;
    }

    const resend = new Resend(resendApiKey);
    
    const cardBrand = paymentMethod.card?.brand || 'card';
    const cardLast4 = paymentMethod.card?.last4 || '****';
    const cardExpMonth = paymentMethod.card?.exp_month || '';
    const cardExpYear = paymentMethod.card?.exp_year || '';
    const customerName = stripeCustomer.name || 'Customer';

    await resend.emails.send({
      from: "SN Cleaning <noreply@notifications.sncleaningservices.co.uk>",
      to: [stripeCustomer.email],
      subject: "Payment Method Added Successfully - SN Cleaning",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">SN Cleaning</h1>
            <h2 style="color: #374151; font-size: 24px; margin-bottom: 20px;">Payment Method Added Successfully</h2>
          </div>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #22c55e;">
            <p style="margin: 0; color: #166534; font-size: 16px; font-weight: bold;">✓ Success!</p>
            <p style="color: #166534; font-size: 16px; line-height: 1.5; margin-top: 10px;">
              Your payment method has been securely added to your account.
            </p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <p style="margin: 0; color: #374151; font-size: 16px;">Hello ${customerName},</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-top: 15px;">
              We've successfully added your payment method to your account. Here are the details:
            </p>
            
            <div style="background-color: white; padding: 15px; border-radius: 6px; margin-top: 20px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Card Type:</strong> ${cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1)}</p>
              <p style="margin: 10px 0 0 0; color: #374151; font-size: 14px;"><strong>Card Number:</strong> •••• •••• •••• ${cardLast4}</p>
              <p style="margin: 10px 0 0 0; color: #374151; font-size: 14px;"><strong>Expires:</strong> ${cardExpMonth.toString().padStart(2, '0')}/${cardExpYear}</p>
              <p style="margin: 10px 0 0 0; color: #374151; font-size: 14px;"><strong>Date Added:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://dkomihipebixlegygnoy.supabase.co/customer-settings" 
               style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
              View My Payment Methods
            </a>
          </div>
          
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>What's next?</strong> Your payment method is now ready for future bookings. We'll use this card to process payments for your cleaning services.
            </p>
          </div>
          
          <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            <p style="margin-top: 20px;">
              If you have any questions or concerns, please don't hesitate to contact us.
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

    console.log('Payment method success email sent to:', stripeCustomer.email);
  } catch (error) {
    console.error('Error sending payment method success email:', error);
  }
}

async function sendPaymentMethodFailureEmail(
  stripe: Stripe,
  supabaseAdmin: any,
  stripeCustomerId: string,
  errorMessage: string
) {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping failure email');
      return;
    }

    // Get customer details
    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);

    if (!stripeCustomer.email) {
      console.log('No email for customer, skipping failure email');
      return;
    }

    const resend = new Resend(resendApiKey);
    const customerName = stripeCustomer.name || 'Customer';

    // Find the customer ID in our database to create the retry link
    let customerData;
    if (stripeCustomer.metadata?.customer_id) {
      const { data } = await supabaseAdmin
        .from('customers')
        .select('id, first_name, last_name')
        .eq('id', parseInt(stripeCustomer.metadata.customer_id))
        .single();
      customerData = data;
    }

    // Fallback to email lookup
    if (!customerData) {
      const { data } = await supabaseAdmin
        .from('customers')
        .select('id, first_name, last_name')
        .eq('email', stripeCustomer.email)
        .single();
      customerData = data;
    }

    // Create retry URL - this will redirect to customer settings with a flag to retry adding payment method
    const retryUrl = customerData 
      ? `https://dkomihipebixlegygnoy.supabase.co/customer-settings?retry_payment_method=true`
      : `https://dkomihipebixlegygnoy.supabase.co/auth?payment_setup=true`;

    await resend.emails.send({
      from: "SN Cleaning <noreply@notifications.sncleaningservices.co.uk>",
      to: [stripeCustomer.email],
      subject: "Payment Method Setup Failed - SN Cleaning",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">SN Cleaning</h1>
            <h2 style="color: #374151; font-size: 24px; margin-bottom: 20px;">Payment Method Setup Failed</h2>
          </div>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ef4444;">
            <p style="margin: 0; color: #dc2626; font-size: 16px; font-weight: bold;">⚠️ Setup Failed</p>
            <p style="color: #dc2626; font-size: 16px; line-height: 1.5; margin-top: 10px;">
              We were unable to set up your payment method.
            </p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <p style="margin: 0; color: #374151; font-size: 16px;">Hello ${customerName},</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-top: 15px;">
              Unfortunately, we encountered an issue while setting up your payment method. This could be due to:
            </p>
            
            <ul style="color: #374151; font-size: 14px; line-height: 1.5; margin: 15px 0; padding-left: 20px;">
              <li>Incorrect card details entered</li>
              <li>Card declined by your bank</li>
              <li>Network connection timeout</li>
              <li>Card not supported for online payments</li>
            </ul>
            
            ${errorMessage && errorMessage !== 'Payment method setup failed' ? 
              `<div style="background-color: white; padding: 15px; border-radius: 6px; margin-top: 20px; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Error Details:</strong> ${errorMessage}</p>
              </div>` : ''
            }
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${retryUrl}" 
               style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
              Try Again
            </a>
          </div>
          
          <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Need Help?</strong> If you continue to experience issues, please contact us and we'll be happy to assist you with setting up your payment method.
            </p>
          </div>
          
          <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            <p style="margin-top: 20px;">
              If you didn't attempt to add a payment method or have any questions, please contact us immediately.
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

    console.log('Payment method failure email sent to:', stripeCustomer.email);
  } catch (error) {
    console.error('Error sending payment method failure email:', error);
  }
}

serve(handler);