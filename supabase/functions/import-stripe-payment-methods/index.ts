import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    // Get authenticated user for validation
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data } = await supabaseClient.auth.getUser(token)
    const user = data.user
    if (!user) throw new Error('User not authenticated')

    // Parse request body
    const body = await req.json()
    const { customerId, stripeCustomerId, paymentMethodIds, setFirstAsDefault = false } = body

    console.log(`Importing payment methods for customer ${customerId} from Stripe customer ${stripeCustomerId}`)
    console.log(`Payment method IDs to import:`, paymentMethodIds)

    if (!customerId || !stripeCustomerId || !Array.isArray(paymentMethodIds)) {
      throw new Error('Missing required parameters: customerId, stripeCustomerId, or paymentMethodIds')
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" })

    const importedMethods = []
    let importCount = 0

    for (const paymentMethodId of paymentMethodIds) {
      try {
        console.log(`Processing payment method: ${paymentMethodId}`)
        
        // Get payment method details from Stripe
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
        
        if (!paymentMethod.card) {
          console.log(`Skipping non-card payment method: ${paymentMethodId}`)
          continue
        }

        // Check if already exists
        const { data: existing } = await supabaseClient
          .from('customer_payment_methods')
          .select('id')
          .eq('customer_id', customerId)
          .eq('stripe_payment_method_id', paymentMethodId)
          .single()

        if (existing) {
          console.log(`Payment method ${paymentMethodId} already exists, skipping`)
          continue
        }

        // Import the payment method
        const { error: insertError } = await supabaseClient
          .from('customer_payment_methods')
          .insert({
            customer_id: customerId,
            stripe_payment_method_id: paymentMethodId,
            stripe_customer_id: stripeCustomerId,
            card_brand: paymentMethod.card.brand || 'unknown',
            card_last4: paymentMethod.card.last4 || '0000',
            card_exp_month: paymentMethod.card.exp_month || 1,
            card_exp_year: paymentMethod.card.exp_year || 2025,
            is_default: setFirstAsDefault && importCount === 0
          })

        if (insertError) {
          console.error(`Error importing payment method ${paymentMethodId}:`, insertError)
          throw insertError
        }

        importedMethods.push({
          id: paymentMethodId,
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year
        })

        importCount++
        console.log(`Successfully imported payment method ${paymentMethodId}`)

      } catch (error) {
        console.error(`Error processing payment method ${paymentMethodId}:`, error)
        // Continue with other payment methods instead of failing completely
      }
    }

    console.log(`Import completed: ${importCount} payment methods imported`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment methods imported successfully',
      imported_count: importCount,
      imported_methods: importedMethods
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})