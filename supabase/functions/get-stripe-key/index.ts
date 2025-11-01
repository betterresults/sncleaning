import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe publishable key from environment (support multiple common names)
    const publishableKey =
      Deno.env.get('STRIPE_PUBLISHABLE_KEY') ||
      Deno.env.get('STRIPE_PUBLIC_KEY') ||
      Deno.env.get('STRIPE_PUBLISHABLE') ||
      Deno.env.get('STRIPE_PK');
    
    if (!publishableKey) {
      throw new Error('Stripe publishable key not configured. Expected one of: STRIPE_PUBLISHABLE_KEY, STRIPE_PUBLIC_KEY, STRIPE_PUBLISHABLE, STRIPE_PK');
    }

    return new Response(
      JSON.stringify({ 
        publishableKey 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error getting Stripe key:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
