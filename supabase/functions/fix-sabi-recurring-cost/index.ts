import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Update recurring service for Sabi to use correct weekly cost from quote
    // Quote shows: weekly_hours = 2, weekly_cost = £41.40
    // So cost_per_hour should be £20.70 (£41.40 / 2)
    const { data, error } = await supabase
      .from('recurring_services')
      .update({
        total_cost: 41.40,
        cost_per_hour: 20.70
      })
      .eq('recurring_group_id', 'e0eef595-9781-4152-8d4d-e6913a36f9be')
      .select()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Updated Sabi recurring service to correct weekly cost: £41.40 (2 hours × £20.70)',
        updated: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
