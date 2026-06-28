import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const PIXEL_ID = Deno.env.get('META_PIXEL_ID');
const ACCESS_TOKEN = Deno.env.get('META_ADS_ACCESS_TOKEN');
const GRAPH_VERSION = 'v25.0';

/**
 * Sends Meta Conversions API "Lead" events sourced from our CRM (quote_leads
 * stage changes). Different from the website Lead pixel: uses
 * action_source = "system_generated" and custom_data.event_source = "crm",
 * matching Meta's Qualified Leads integration spec.
 *
 * Invoked by a Postgres trigger on quote_leads INSERT/status-change via
 * pg_net (see notify_meta_crm_lead_status). Idempotent: event_id is derived
 * from (lead_id, status) so retries dedupe at Meta.
 */

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

function isUuid(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'META_PIXEL_ID or META_ADS_ACCESS_TOKEN missing' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const leadId = body?.lead_id;
    const status = typeof body?.status === 'string' ? body.status : null;
    if (!isUuid(leadId) || !status) {
      return new Response(JSON.stringify({ error: 'lead_id (uuid) and status required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: lead, error } = await supabase
      .from('quote_leads')
      .select('id, first_name, last_name, email, phone, postcode, fbc, fbp, user_agent, client_ip, page_url, landing_url, created_at, crm_lead_status_sent')
      .eq('id', leadId)
      .maybeSingle();

    if (error || !lead) {
      return new Response(JSON.stringify({ error: 'lead not found', detail: error?.message }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Skip duplicate sends for the same status (idempotent extra guard).
    if (lead.crm_lead_status_sent === status) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_sent', status }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const phoneNormalized = normPhone(lead.phone);
    const user_data: Record<string, unknown> = {
      em: await hashOrUndef(lead.email),
      ph: phoneNormalized ? await sha256(phoneNormalized) : undefined,
      fn: await hashOrUndef(lead.first_name),
      ln: await hashOrUndef(lead.last_name),
      zp: await hashOrUndef((lead.postcode ?? '').replace(/\s+/g, '')),
      ct: await hashOrUndef('london'),
      country: await hashOrUndef('gb'),
      external_id: await hashOrUndef(lead.id),
      fbc: lead.fbc ?? undefined,
      fbp: lead.fbp ?? undefined,
      client_user_agent: lead.user_agent ?? undefined,
      client_ip_address: lead.client_ip ?? undefined,
      // Meta's CRM lead_id (recommended). Numeric in their docs but string is accepted.
      lead_id: lead.id,
    };
    Object.keys(user_data).forEach((k) => user_data[k] === undefined && delete user_data[k]);

    const event_id = `crm-lead-${lead.id}-${status}`;
    const event = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      action_source: 'system_generated',
      event_source_url: lead.page_url || lead.landing_url || undefined,
      user_data,
      custom_data: {
        event_source: 'crm',
        lead_event_source: 'SN Cleaning CRM',
        lead_status: status,
      },
    };

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [event] }),
    });
    const metaBody = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('[meta-capi-crm-lead] Meta error', res.status, metaBody);
      return new Response(JSON.stringify({ ok: false, status: res.status, meta: metaBody }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase
      .from('quote_leads')
      .update({
        crm_lead_status_sent: status,
        crm_lead_status_sent_at: new Date().toISOString(),
      })
      .eq('id', lead.id);

    console.log('[meta-capi-crm-lead] sent', { lead_id: lead.id, status, event_id });
    return new Response(JSON.stringify({ ok: true, event_id, meta: metaBody }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[meta-capi-crm-lead] error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});