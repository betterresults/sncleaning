import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { table, data } = body;

    if (!table || !data) {
      return new Response(
        JSON.stringify({ error: "Missing table or data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only allow specific tables for security
    if (!["funnel_events", "quote_leads"].includes(table)) {
      return new Response(
        JSON.stringify({ error: "Invalid table" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    if (table === "quote_leads") {
      // Sanitize data - convert empty strings to null for time/date fields
      const sanitizedData = { ...data };
      const timeFields = ['selected_time'];
      for (const field of timeFields) {
        if (sanitizedData[field] === '' || sanitizedData[field] === undefined) {
          sanitizedData[field] = null;
        }
      }
      // Always bump activity timestamp on every save
      sanitizedData.last_activity_at = new Date().toISOString();

      // Capture client IP / UA from request headers if not supplied, so Meta
      // CAPI events can later be enriched with these identifiers.
      const xff = req.headers.get('x-forwarded-for') ?? '';
      const ip = xff.split(',')[0].trim();
      if (ip && !sanitizedData.client_ip) sanitizedData.client_ip = ip;
      if (!sanitizedData.user_agent) {
        const ua = req.headers.get('user-agent');
        if (ua) sanitizedData.user_agent = ua;
      }

      // Use upsert for quote_leads
      const { error } = await supabase
        .from(table)
        .upsert(sanitizedData, { onConflict: "session_id", ignoreDuplicates: false });
      
      if (error) throw error;
      result = { success: true };
    } else {
      // Use insert for funnel_events
      const { error } = await supabase.from(table).insert(data);
      if (error) throw error;
      result = { success: true };
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
