import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Testing Gabrielle booking authorization directly...')

    // Reset payment status first
    const { error: resetError } = await supabaseClient
      .from('bookings')
      .update({ payment_status: 'Unpaid' })
      .eq('id', 108252)

    if (resetError) {
      console.error('Error resetting payment status:', resetError)
    } else {
      console.log('Reset Gabrielle payment status to Unpaid')
    }

    // Try authorization
    const { data: authResult, error: authError } = await supabaseClient.functions.invoke('stripe-authorize-payment', {
      body: { bookingId: 108252 }
    })

    console.log('Authorization result:', { authResult, authError })

    if (authError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authError,
          details: 'Authorization failed for Gabrielle booking 108252'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: authResult,
        message: 'Gabrielle authorization test completed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in test authorization:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})