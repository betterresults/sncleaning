import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * create-checkout-session
 *
 * Stashes the booking payload on a quote_leads row, creates a Stripe Checkout
 * Session in **setup mode** (no money is taken — the card is just saved), and
 * returns the Stripe URL. The actual `bookings` row is created by
 * `stripe-webhook` on `checkout.session.completed` / `setup_intent.succeeded`
 * so unfinished card collections never produce ghost bookings. Capture of the
 * actual cleaning charge happens later (after the clean is completed).
 *
 * Customer-facing only. Admin and saved-card paths continue to use
 * `create-public-booking` directly.
 */
const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      bookingPayload,
      metaEventId,
      quoteSessionId,
      successUrl,
      cancelUrl,
    } = body || {};

    if (!bookingPayload || typeof bookingPayload !== 'object') {
      return new Response(JSON.stringify({ error: 'bookingPayload is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const email = String(bookingPayload.email || '').trim().toLowerCase();
    const totalCost = Number(bookingPayload.totalCost || 0);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!(totalCost > 0)) {
      return new Response(JSON.stringify({ error: 'totalCost must be greater than 0' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: 'successUrl and cancelUrl are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Snapshot the booking payload on quote_leads so the webhook can rebuild it.
    // We never trust the client-side total — it's stored, but the webhook also
    // re-uses it as-is here because the existing create-public-booking endpoint
    // already accepts it. Pricing tampering protection lives upstream.
    const sessionIdForLead =
      quoteSessionId || `pending-${crypto.randomUUID()}`;

    const leadRow: Record<string, any> = {
      session_id: sessionIdForLead,
      first_name: bookingPayload.firstName || null,
      last_name: bookingPayload.lastName || null,
      email: bookingPayload.email || null,
      phone: bookingPayload.phone || null,
      postcode: bookingPayload.postcode || null,
      calculated_quote: totalCost,
      status: 'pending_payment',
      furthest_step: 'pending_payment',
      booking_payload: bookingPayload,
      meta_event_id: metaEventId || null,
    };

    // Upsert by session_id so retries from the same browser don't create dupes.
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('quote_leads')
      .upsert(leadRow, { onConflict: 'session_id' })
      .select('id')
      .single();

    if (leadError || !lead) {
      console.error('[create-checkout-session] quote_leads upsert failed', leadError);
      return new Response(JSON.stringify({ error: 'Failed to stash booking payload' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find/create a Stripe customer so the SetupIntent can attach the card.
    let customerId: string;
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data[0]) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        name: [bookingPayload.firstName, bookingPayload.lastName].filter(Boolean).join(' ') || undefined,
        phone: bookingPayload.phone || undefined,
        metadata: { quote_lead_id: String(lead.id) },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      payment_method_types: ['card'],
      customer: customerId,
      // Stripe replaces {CHECKOUT_SESSION_ID} server-side.
      success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        quote_lead_id: String(lead.id),
        meta_event_id: metaEventId || '',
        total_cost_pence: String(Math.round(totalCost * 100)),
      },
      setup_intent_data: {
        metadata: {
          quote_lead_id: String(lead.id),
          meta_event_id: metaEventId || '',
          total_cost_pence: String(Math.round(totalCost * 100)),
        },
      },
    });

    // Persist the session id so we can correlate on the webhook side and on
    // the confirmation page (polling).
    await supabaseAdmin
      .from('quote_leads')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', lead.id);

    return new Response(JSON.stringify({
      success: true,
      url: session.url,
      sessionId: session.id,
      quoteLeadId: lead.id,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error('[create-checkout-session] Error', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);