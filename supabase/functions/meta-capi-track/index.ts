import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const PIXEL_ID = Deno.env.get('META_PIXEL_ID');
const ACCESS_TOKEN = Deno.env.get('META_ADS_ACCESS_TOKEN');
const GRAPH_VERSION = 'v21.0';

const STANDARD_EVENTS = [
  'Lead',
  'ViewContent',
  'Schedule',
  'InitiateCheckout',
  'AddPaymentInfo',
  'SubscribedButtonClick',
  'Purchase',
] as const;

const BodySchema = z.object({
  event_name: z.enum(STANDARD_EVENTS),
  event_id: z.string().min(1).max(128),
  event_source_url: z.string().url().max(2048),
  event_time: z.number().int().positive().optional(),
  test_event_code: z.string().max(64).optional(),
  user: z.object({
    email: z.string().email().max(255).optional().nullable(),
    phone: z.string().max(40).optional().nullable(),
    first_name: z.string().max(100).optional().nullable(),
    last_name: z.string().max(100).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    external_id: z.string().max(128).optional().nullable(),
    fbc: z.string().max(512).optional().nullable(),
    fbp: z.string().max(512).optional().nullable(),
    client_user_agent: z.string().max(512).optional().nullable(),
    client_ip: z.string().max(64).optional().nullable(),
  }),
  custom_data: z
    .object({
      currency: z.string().length(3).optional(),
      value: z.number().nonnegative().optional(),
      content_name: z.string().max(200).optional(),
      content_category: z.string().max(200).optional(),
    })
    .partial()
    .optional(),
});

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'META_PIXEL_ID or META_ADS_ACCESS_TOKEN is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const body = parsed.data;
    const u = body.user;

    const xff = req.headers.get('x-forwarded-for') ?? '';
    const ip = u.client_ip || xff.split(',')[0].trim() || undefined;
    const ua = u.client_user_agent || req.headers.get('user-agent') || undefined;

    const phoneNormalized = normPhone(u.phone);

    const user_data: Record<string, unknown> = {
      em: await hashOrUndef(u.email),
      ph: phoneNormalized ? await sha256(phoneNormalized) : undefined,
      fn: await hashOrUndef(u.first_name),
      ln: await hashOrUndef(u.last_name),
      ct: await hashOrUndef(u.city),
      external_id: await hashOrUndef(u.external_id),
      fbc: u.fbc || undefined,
      fbp: u.fbp || undefined,
      client_user_agent: ua,
      client_ip_address: ip,
    };
    Object.keys(user_data).forEach((k) => {
      if (user_data[k] === undefined) delete user_data[k];
    });

    const event = {
      event_name: body.event_name,
      event_time: body.event_time ?? Math.floor(Date.now() / 1000),
      event_id: body.event_id,
      event_source_url: body.event_source_url,
      action_source: 'website',
      user_data,
      custom_data: body.custom_data ?? {},
    };

    const payload: Record<string, unknown> = { data: [event] };
    if (body.test_event_code) payload.test_event_code = body.test_event_code;

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(
      ACCESS_TOKEN,
    )}`;

    const metaRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const metaBody = await metaRes.json().catch(() => ({}));

    if (!metaRes.ok) {
      console.error('[meta-capi-track] Meta error', metaRes.status, metaBody);
      return new Response(
        JSON.stringify({ ok: false, status: metaRes.status, meta: metaBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[meta-capi-track] sent', body.event_name, body.event_id, metaBody);
    return new Response(JSON.stringify({ ok: true, meta: metaBody }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[meta-capi-track] error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});