import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PIXEL_ID = Deno.env.get('META_PIXEL_ID');
const ACCESS_TOKEN = Deno.env.get('META_ADS_ACCESS_TOKEN');
const GRAPH_VERSION = 'v21.0';

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
const norm = (v?: string | null) => (v ?? '').trim().toLowerCase();
const normPhone = (v?: string | null) => (v ?? '').replace(/[^\d]/g, '');
async function hashOrUndef(v?: string | null) {
  const n = norm(v);
  return n ? await sha256(n) : undefined;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: 'Meta credentials not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller is an admin
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const [{ data: isAdmin }, { data: isSalesAgent }] = await Promise.all([
      admin.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' }),
      admin.rpc('has_role', { _user_id: userData.user.id, _role: 'sales_agent' }),
    ]);
    if (!isAdmin && !isSalesAgent) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const bookingId = Number(body?.booking_id);
    const testEventCode = typeof body?.test_event_code === 'string' ? body.test_event_code : undefined;
    if (!bookingId || Number.isNaN(bookingId)) {
      return new Response(JSON.stringify({ error: 'booking_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('id, first_name, last_name, email, phone_number, postcode, address, total_cost, service_type, meta_capi_sent_at, meta_event_id, customer')
      .eq('id', bookingId)
      .maybeSingle();
    if (bErr || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to recover fbc/fbp/landing_url from a matching quote_leads row
    let fbc: string | undefined;
    let fbp: string | undefined;
    let landingUrl: string | undefined;
    let clientUserAgent: string | undefined;
    let clientIp: string | undefined;
    try {
      const email = booking.email?.trim().toLowerCase();
      const phoneDigits = (booking.phone_number ?? '').replace(/[^\d]/g, '');
      const orParts: string[] = [];
      if (email) orParts.push(`email.ilike.${email}`);
      if (phoneDigits) orParts.push(`phone.ilike.%${phoneDigits.slice(-9)}%`);
      if (orParts.length) {
        const { data: lead } = await admin
          .from('quote_leads')
          .select('fbc, fbp, landing_url, user_agent, client_ip')
          .or(orParts.join(','))
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lead) {
          fbc = lead.fbc ?? undefined;
          fbp = lead.fbp ?? undefined;
          landingUrl = lead.landing_url ?? undefined;
          clientUserAgent = lead.user_agent ?? undefined;
          clientIp = lead.client_ip ?? undefined;
        }
      }
    } catch (e) {
      console.warn('[meta-capi-offline-purchase] quote_leads lookup failed', e);
    }

    const eventId = booking.meta_event_id || `booking_${booking.id}`;
    const phoneNormalized = normPhone(booking.phone_number);

    const user_data: Record<string, unknown> = {
      em: await hashOrUndef(booking.email),
      ph: phoneNormalized ? await sha256(phoneNormalized) : undefined,
      fn: await hashOrUndef(booking.first_name),
      ln: await hashOrUndef(booking.last_name),
      ct: await hashOrUndef(booking.postcode?.split(' ')[0]),
      external_id: await hashOrUndef(String(booking.customer ?? booking.id)),
      fbc,
      fbp,
      client_user_agent: clientUserAgent,
      client_ip_address: clientIp,
    };
    Object.keys(user_data).forEach((k) => { if (user_data[k] === undefined) delete user_data[k]; });

    const event = {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      // Manual/offline conversions may come from WhatsApp or phone.
      // Meta requires page_id for business_messaging/whatsapp events, so use
      // the generic chat action source for manually reported CRM bookings.
      action_source: 'chat',
      user_data,
      custom_data: {
        currency: 'GBP',
        value: Number(booking.total_cost ?? 0),
        content_name: booking.service_type ?? 'Cleaning',
        content_category: 'cleaning',
        order_id: String(booking.id),
      },
    };

    const payload: Record<string, unknown> = { data: [event] };
    if (testEventCode) payload.test_event_code = testEventCode;

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`;
    const metaRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const metaBody = await metaRes.json().catch(() => ({}));

    if (!metaRes.ok) {
      console.error('[meta-capi-offline-purchase] Meta error', metaRes.status, metaBody);
      return new Response(JSON.stringify({ ok: false, status: metaRes.status, meta: metaBody }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark as sent
    await admin
      .from('bookings')
      .update({ meta_capi_sent_at: new Date().toISOString(), meta_event_id: eventId })
      .eq('id', booking.id);

    console.log('[meta-capi-offline-purchase] sent', eventId, metaBody);
    return new Response(JSON.stringify({ ok: true, event_id: eventId, meta: metaBody }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[meta-capi-offline-purchase] error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});