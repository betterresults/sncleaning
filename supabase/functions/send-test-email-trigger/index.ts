import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Formats a genuine real-UTC "now" instant as a UK wall-clock date string
// (DST-aware via Europe/London), so test-data stamps show UK time regardless
// of the server's own clock/timezone.
function formatLondonDateStr(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(date);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Send test email to the specified address
    const { data, error } = await supabase.functions.invoke('send-test-email', {
      body: {
        email: 'sinsip.2014@gmail.com',
        customerName: 'Test Customer',
        bookingDetails: {
          service: 'Deep Cleaning Service',
          date: formatLondonDateStr(new Date()),
          address: '123 Test Street, Test City'
        }
      }
    });

    if (error) {
      console.error('Error sending test email:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Test email triggered successfully:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test email triggered successfully',
      result: data
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-test-email-trigger function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);