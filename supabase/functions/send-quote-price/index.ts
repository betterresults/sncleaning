import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  quote_request_id: string;
  price: number;
  message?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: Payload = await req.json();
    if (!body?.quote_request_id || typeof body.price !== "number" || !(body.price > 0)) {
      return new Response(JSON.stringify({ error: "Missing quote_request_id or valid price" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: qr, error: fetchErr } = await supabase
      .from("quote_requests")
      .select("*")
      .eq("id", body.quote_request_id)
      .single();
    if (fetchErr || !qr) {
      return new Response(JSON.stringify({ error: "Quote request not found" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!qr.email) {
      return new Response(JSON.stringify({ error: "No email on quote request" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const price = Math.round(body.price * 100) / 100;
    const formattedPrice = `£${price.toFixed(2)}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#f9f9f9;padding:24px;">
        <div style="background:#fff;border-radius:10px;padding:28px;box-shadow:0 2px 10px rgba(0,0,0,.06);">
          <h1 style="color:#185166;margin:0 0 6px 0;">Your cleaning quote${qr.name ? `, ${qr.name}` : ""}</h1>
          <p style="color:#555;margin:0 0 18px 0;">Based on the details you sent us, here is your estimate:</p>

          <div style="text-align:center;background:linear-gradient(135deg,#185166,#18A5A5);color:#fff;padding:24px;border-radius:10px;margin:18px 0;">
            <div style="font-size:13px;opacity:.85;letter-spacing:1px;text-transform:uppercase;">Estimated price</div>
            <div style="font-size:38px;font-weight:bold;margin-top:6px;">${formattedPrice}</div>
          </div>

          ${body.message ? `<div style="background:#f0f9f9;border-left:4px solid #18A5A5;padding:14px;border-radius:4px;font-size:14px;color:#333;white-space:pre-wrap;margin:14px 0;">${body.message}</div>` : ""}

          <h3 style="color:#185166;margin:24px 0 8px 0;font-size:15px;">Your request</h3>
          <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse;">
            <tr><td style="padding:6px 0;width:140px;color:#666;">Service</td><td><strong>${qr.service}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Postcode</td><td>${qr.postcode}</td></tr>
            ${qr.street ? `<tr><td style="padding:6px 0;color:#666;">Street / Nickname</td><td>${qr.street}</td></tr>` : ""}
          </table>

          ${(() => {
            const waText =
              `Hi, please book my ${qr.service} clean.` +
              `\nAddress / Postcode: ${qr.postcode}${qr.street ? ` — ${qr.street}` : ""}` +
              `\nQuoted price: ${formattedPrice}` +
              `\nQuote ref: ${qr.id}`;
            const waUrl = `https://wa.me/442038355033?text=${encodeURIComponent(waText)}`;
            return `<div style="margin-top:24px;text-align:center;">
              <a href="${waUrl}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:bold;">Book this clean on WhatsApp</a>
            </div>`;
          })()}

          <div style="margin-top:24px;padding:14px;background:#f7f7f7;border-radius:4px;font-size:13px;color:#555;">
            Questions? Reply to this email, call <a href="tel:+442038355033" style="color:#18A5A5;">0203 835 5033</a>, or WhatsApp <a href="https://wa.me/+442038355033" style="color:#18A5A5;">+44 20 3835 5033</a>.
          </div>

          <p style="margin-top:24px;color:#888;font-size:12px;">— The SN Cleaning Team</p>
        </div>
      </div>`;

    const result = await resend.emails.send({
      from: "SN Cleaning <noreply@notifications.sncleaningservices.co.uk>",
      to: [qr.email],
      reply_to: "info@sncleaningservices.co.uk",
      subject: `Your SN Cleaning quote — ${formattedPrice}`,
      html,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await supabase
      .from("quote_requests")
      .update({
        quoted_price: price,
        quote_message: body.message || null,
        quoted_at: new Date().toISOString(),
        status: "quoted",
      })
      .eq("id", body.quote_request_id);

    return new Response(JSON.stringify({ success: true, id: result.data?.id }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("send-quote-price error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});