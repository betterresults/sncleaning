import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { limit = 100, startingAfter, endingBefore } = await req.json().catch(() => ({}));

    // Get all payment intents from Stripe
    const paymentIntents = await stripe.paymentIntents.list({
      limit: limit,
      ...(startingAfter && { starting_after: startingAfter }),
      ...(endingBefore && { ending_before: endingBefore }),
    });

    // Get all charges
    const charges = await stripe.charges.list({
      limit: limit,
    });

    // Get bookings from database with customer info
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id,
        invoice_id,
        payment_status,
        payment_method,
        total_cost,
        first_name,
        last_name,
        email,
        customer,
        date_time,
        customers (
          id,
          first_name,
          last_name,
          email,
          full_name
        )
      `)
      .order('id', { ascending: false })
      .limit(500);

    // Match Stripe data with our database
    const enrichedPayments = paymentIntents.data.map((pi) => {
      // Find matching booking by invoice_id or payment_intent id
      const matchingBooking = bookings?.find(
        (b) => b.invoice_id === pi.id || b.invoice_id?.includes(pi.id)
      );

      // Find matching charge
      const matchingCharge = charges.data.find((c) => c.payment_intent === pi.id);

      return {
        // Stripe data
        stripe_payment_intent_id: pi.id,
        stripe_status: pi.status,
        stripe_amount: pi.amount / 100, // Convert from cents
        stripe_currency: pi.currency,
        stripe_created: new Date(pi.created * 1000).toISOString(),
        stripe_customer_id: pi.customer,
        stripe_payment_method: pi.payment_method,
        stripe_description: pi.description,
        stripe_receipt_email: pi.receipt_email,
        stripe_charge_id: matchingCharge?.id,
        stripe_paid: matchingCharge?.paid,
        stripe_refunded: matchingCharge?.refunded,
        stripe_amount_refunded: matchingCharge?.amount_refunded ? matchingCharge.amount_refunded / 100 : 0,
        
        // Database data
        booking_id: matchingBooking?.id,
        booking_payment_status: matchingBooking?.payment_status,
        booking_payment_method: matchingBooking?.payment_method,
        booking_total_cost: matchingBooking?.total_cost,
        booking_date_time: matchingBooking?.date_time,
        
        // Customer data
        customer_id: matchingBooking?.customer,
        customer_name: matchingBooking?.customers?.full_name || 
                       `${matchingBooking?.first_name || ''} ${matchingBooking?.last_name || ''}`.trim(),
        customer_email: matchingBooking?.customers?.email || matchingBooking?.email,
        
        // Status comparison
        status_match: matchingBooking ? 
          (pi.status === 'succeeded' && matchingBooking.payment_status?.toLowerCase() === 'paid') ||
          (pi.status === 'requires_capture' && matchingBooking.payment_status?.toLowerCase() === 'authorized') ||
          (pi.status === 'processing' && matchingBooking.payment_status?.toLowerCase() === 'pending')
          : null,
      };
    });

    // Also find bookings that might not be in Stripe
    const bookingsNotInStripe = bookings?.filter(
      (b) => b.invoice_id && !enrichedPayments.some((p) => p.booking_id === b.id)
    ).map((b) => ({
      booking_id: b.id,
      booking_payment_status: b.payment_status,
      booking_payment_method: b.payment_method,
      booking_total_cost: b.total_cost,
      booking_date_time: b.date_time,
      customer_id: b.customer,
      customer_name: b.customers?.full_name || `${b.first_name || ''} ${b.last_name || ''}`.trim(),
      customer_email: b.customers?.email || b.email,
      stripe_payment_intent_id: b.invoice_id,
      stripe_status: 'not_found_in_stripe',
      status_match: false,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        payments: enrichedPayments,
        bookingsNotInStripe: bookingsNotInStripe,
        hasMore: paymentIntents.has_more,
        totalCount: enrichedPayments.length + (bookingsNotInStripe?.length || 0),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching Stripe payments:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
