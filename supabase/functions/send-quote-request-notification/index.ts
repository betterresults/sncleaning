import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  postcode: string;
  street?: string;
  service: string;
  description?: string;
  photo_urls: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: Payload = await req.json();
    if (!body?.id || !body?.postcode || !body?.service) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const photosHtml = (body.photo_urls || [])
      .map((u) => `<a href="${u}" style="display:inline-block;margin:4px;"><img src="${u}" alt="photo" style="max-width:180px;max-height:180px;border-radius:6px;border:1px solid #ddd;"/></a>`)
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#f9f9f9;padding:24px;">
        <div style="background:#fff;border-radius:10px;padding:24px;box-shadow:0 2px 10px rgba(0,0,0,.06);">
          <h1 style="color:#18A5A5;margin:0 0 4px 0;">New Quote Request</h1>
          <p style="color:#185166;margin:0 0 20px 0;">A customer just submitted a quote request.</p>

          <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse;">
            <tr><td style="padding:6px 0;width:120px;color:#666;">Name</td><td>${body.name || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Email</td><td>${body.email || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Phone</td><td>${body.phone || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Postcode</td><td><strong>${body.postcode}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Street / Nickname</td><td>${body.street || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Service</td><td><strong>${body.service}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;vertical-align:top;">Description</td><td style="white-space:pre-wrap;">${body.description || "—"}</td></tr>
          </table>

          ${photosHtml ? `<h3 style="color:#185166;margin-top:24px;">Photos</h3><div>${photosHtml}</div>` : ""}

          <div style="margin-top:24px;padding:12px;background:#f0f9f9;border-left:4px solid #18A5A5;border-radius:4px;font-size:13px;color:#555;">
            View & manage this request in the admin dashboard under <strong>Quote Requests</strong>.
          </div>
        </div>
      </div>`;

    const result = await resend.emails.send({
      from: "SN Cleaning <noreply@notifications.sncleaningservices.co.uk>",
      to: ["info@sncleaningservices.co.uk", "sales@sncleaningservices.co.uk"],
      reply_to: body.email || "sales@sncleaningservices.co.uk",
      subject: `New Quote Request — ${body.service} (${body.postcode})`,
      html,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.data?.id }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("send-quote-request-notification error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);