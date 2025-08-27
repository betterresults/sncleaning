import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADJUST-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting payment amount adjustment");

    const { bookingId, newAmount, reason } = await req.json();
    
    if (!bookingId || !newAmount) {
      throw new Error('Missing required fields: bookingId and newAmount');
    }

    logStep("Request parameters", { bookingId, newAmount, reason });

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Fetch booking details
    logStep("Fetching booking details");
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${bookingError?.message}`);
    }

    logStep("Booking found", { 
      currentAmount: booking.total_cost, 
      paymentStatus: booking.payment_status,
      invoiceId: booking.invoice_id 
    });

    // Calculate the difference amount - only authorize the additional amount needed
    const currentAmount = booking.total_cost || 0;
    const differenceAmount = newAmount - currentAmount;
    
    if (differenceAmount <= 0) {
      throw new Error('New amount must be greater than current amount. Current: £' + currentAmount + ', New: £' + newAmount);
    }

    // Check if we already have an additional authorization for this booking
    const existingAdjustments = (booking.additional_details || '').includes('Additional payment authorized');
    if (existingAdjustments) {
      logStep("Additional authorization already exists", { bookingId, additionalDetails: booking.additional_details });
      throw new Error('This booking already has payment adjustments. Please contact support to modify further.');
    }
    
    logStep("Authorizing additional amount only", { 
      currentAmount, 
      newAmount, 
      differenceAmount,
      existingPaymentIntent: booking.invoice_id 
    });

    // Get customer's default payment method
    logStep("Fetching customer's default payment method");
    let { data: paymentMethods, error: pmError } = await supabase
      .from('customer_payment_methods')
      .select('*')
      .eq('customer_id', booking.customer)
      .eq('is_default', true)
      .single();

    if (pmError || !paymentMethods) {
      logStep("No default payment method found", { 
        customerId: booking.customer, 
        error: pmError?.message,
        searchQuery: `customer_id = ${booking.customer} AND is_default = true`
      });
      
      // Try to get any payment method for this customer
      const { data: anyPaymentMethod, error: anyPmError } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', booking.customer)
        .limit(1)
        .single();
        
      if (anyPmError || !anyPaymentMethod) {
        logStep("No payment methods found at all for customer", { 
          customerId: booking.customer,
          anyPmError: anyPmError?.message 
        });
        throw new Error(`No payment methods found for customer ID ${booking.customer}. Please add a payment method first.`);
      } else {
        logStep("Found non-default payment method, using it", { paymentMethodId: anyPaymentMethod.stripe_payment_method_id });
        // Use the non-default payment method
        paymentMethods = anyPaymentMethod;
      }
    }

    logStep("Default payment method found", { paymentMethodId: paymentMethods.stripe_payment_method_id });

    // Create payment intent for the difference amount only
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(differenceAmount * 100), // Convert to cents
      currency: 'gbp',
      customer: paymentMethods.stripe_customer_id,
      payment_method: paymentMethods.stripe_payment_method_id,
      capture_method: 'manual', // Authorize only, capture later
      confirmation_method: 'manual',
      confirm: true,
      return_url: 'https://your-return-url.com', // Required for some payment methods
      metadata: {
        booking_id: bookingId.toString(),
        adjustment_reason: reason || 'Additional amount authorization',
        original_amount: booking.total_cost?.toString() || '0',
        additional_amount: differenceAmount.toString(),
        new_total: newAmount.toString()
      }
    });

    logStep("Additional payment intent created", { 
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      differenceAmount
    });

    // Update booking with new total cost and additional payment info
    const updateData = {
      total_cost: newAmount,
      // Keep original invoice_id but add additional payment details
      additional_details: (booking.additional_details || '') + 
        `\n\nAdditional payment authorized: £${differenceAmount} (${booking.invoice_id ? 'Original: ' + booking.invoice_id + ', ' : ''}Additional: ${paymentIntent.id}). Total: £${currentAmount} → £${newAmount}${reason ? '. Reason: ' + reason : ''}`
    };

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (updateError) {
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    logStep("Booking updated successfully", updateData);

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment amount adjusted successfully',
      data: {
        bookingId,
        originalAmount: booking.total_cost,
        newAmount,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        reason
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    // Try to update booking status to indicate error
    try {
      const { bookingId } = await req.json();
      if (bookingId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          { auth: { persistSession: false } }
        );
        
        await supabase
          .from('bookings')
          .update({ 
            payment_status: 'adjustment_failed',
            additional_details: `Payment adjustment failed: ${errorMessage}`
          })
          .eq('id', bookingId);
      }
    } catch (updateError) {
      logStep("Failed to update booking with error status", updateError);
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});