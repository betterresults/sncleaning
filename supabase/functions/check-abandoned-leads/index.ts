import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

function applyTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Load automation settings
    const { data: setting, error: settingErr } = await supabase
      .from("automation_settings")
      .select("enabled, config")
      .eq("key", "abandoned_lead_followup")
      .maybeSingle();

    if (settingErr) throw settingErr;
    if (!setting || !setting.enabled) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const cfg = (setting.config ?? {}) as Record<string, any>;
    const delayMin = Number(cfg.delay_minutes ?? 15);
    const maxAgeMin = Number(cfg.max_age_minutes ?? 180);
    const adminPhone = String(cfg.admin_phone ?? "");
    const smsTemplate = String(cfg.message_template ?? "Lead {first_name} ({phone}) - {wa_link}");
    const waTemplate = String(cfg.whatsapp_template ?? "Hi {first_name}");

    if (!adminPhone) throw new Error("admin_phone not configured");

    const now = Date.now();
    const upperBound = new Date(now - delayMin * 60_000).toISOString();
    const lowerBound = new Date(now - maxAgeMin * 60_000).toISOString();

    // 2. Candidates
    const { data: candidates, error: candErr } = await supabase
      .from("quote_leads")
      .select("id, session_id, first_name, phone, email")
      .is("abandoned_sms_sent_at", null)
      .not("first_name", "is", null)
      .not("phone", "is", null)
      .lte("last_activity_at", upperBound)
      .gte("last_activity_at", lowerBound)
      .limit(50);

    if (candErr) throw candErr;

    let sent = 0;
    const results: any[] = [];

    for (const lead of candidates ?? []) {
      const firstName: string = (lead.first_name || "").toString().trim();
      const phone: string = (lead.phone || "").toString();
      if (!firstName || !phone) continue;

      // Skip if a booking already exists for this session / phone / email
      let booked = false;
      if (lead.session_id) {
        const { count } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("quote_session_id", lead.session_id);
        if ((count ?? 0) > 0) booked = true;
      }
      if (!booked && phone) {
        const { count } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("phone", phone);
        if ((count ?? 0) > 0) booked = true;
      }
      if (!booked && lead.email) {
        const { count } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("email", lead.email);
        if ((count ?? 0) > 0) booked = true;
      }

      if (booked) {
        // Mark as sent so we don't re-check forever
        await supabase
          .from("quote_leads")
          .update({ abandoned_sms_sent_at: new Date().toISOString() })
          .eq("id", lead.id);
        results.push({ id: lead.id, skipped: "already_booked" });
        continue;
      }

      const waMessage = applyTemplate(waTemplate, { first_name: firstName });
      const waLink = `https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(waMessage)}`;
      const smsBody = applyTemplate(smsTemplate, {
        first_name: firstName,
        phone,
        wa_link: waLink,
      });

      // Atomically claim this lead before sending so concurrent runs don't double-send
      const { data: claimed, error: claimErr } = await supabase
        .from("quote_leads")
        .update({ abandoned_sms_sent_at: new Date().toISOString() })
        .eq("id", lead.id)
        .is("abandoned_sms_sent_at", null)
        .select("id");

      if (claimErr || !claimed || claimed.length === 0) {
        results.push({ id: lead.id, skipped: "claim_failed" });
        continue;
      }

      // Call existing SMS function
      const smsRes = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            to: adminPhone,
            message: smsBody,
            subject: "Abandoned Lead Alert",
            entity_type: "quote_lead",
            entity_id: lead.id,
            recipient_type: "admin",
            log_to_db: true,
          }),
        },
      );

      const smsJson = await smsRes.json().catch(() => ({}));
      if (!smsRes.ok) {
        console.error("SMS send failed", smsJson);
        // Revert the claim so we can retry next run
        await supabase
          .from("quote_leads")
          .update({ abandoned_sms_sent_at: null })
          .eq("id", lead.id);
        results.push({ id: lead.id, error: smsJson });
        continue;
      }

      sent++;
      results.push({ id: lead.id, sent: true });
    }

    return new Response(
      JSON.stringify({ checked: candidates?.length ?? 0, sent, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("check-abandoned-leads error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});