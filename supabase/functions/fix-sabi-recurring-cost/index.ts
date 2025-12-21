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

    console.log('Fixing Sabi recurring service pricing...')
    
    // Correct pricing from quote:
    // - 2 hours weekly
    // - £23/hour base rate with 10% discount = £20.70/hour
    // - Weekly cost: 2 × £20.70 = £41.40
    const { data, error } = await supabase
      .from('recurring_services')
      .update({
        total_cost: 41.40,
        cost_per_hour: 20.70
      })
      .eq('recurring_group_id', 'e0eef595-9781-4152-8d4d-e6913a36f9be')
      .select()

    if (error) {
      console.error('Error updating recurring service:', error)
      throw error
    }

    console.log('Successfully updated:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Updated Sabi recurring service: 2 hours × £20.70/hr (£23 - 10%) = £41.40/week',
        updated: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
