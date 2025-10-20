import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { billTo } = await req.json();
    
    if (!billTo) {
      return new Response(
        JSON.stringify({ error: 'billTo parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate that either (firstName AND lastName) OR company is provided
    if (!billTo.company && (!billTo.firstName || !billTo.lastName)) {
      return new Response(
        JSON.stringify({ error: 'Either company OR (firstName AND lastName) must be provided in billTo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('INVOILESS_API_KEY');
    if (!apiKey) {
      console.error('INVOILESS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating customer in Invoiless:', billTo);

    const response = await fetch('https://api.invoiless.com/v1/customers', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ billTo }),
    });

    const data = await response.json();
    
    console.log('Invoiless API response status:', response.status);

    if (!response.ok) {
      console.error('Invoiless API error:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Invoiless API error',
          status: response.status,
          details: data 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in invoiless-create-customer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
