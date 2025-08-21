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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data } = await supabaseClient.auth.getUser(token)
    const user = data.user
    if (!user) throw new Error('User not authenticated')

    // Parse request body
    const body = await req.json()
    const { customerId, email } = body

    console.log(`Searching Stripe for customer ID: ${customerId}, email: ${email}`)

    // Get customer email from database if not provided
    let searchEmail = email
    if (!searchEmail && customerId) {
      const { data: customerData } = await supabaseClient
        .from('customers')
        .select('email')
        .eq('id', customerId)
        .single()
      
      searchEmail = customerData?.email
    }

    if (!searchEmail) {
      throw new Error('No email provided for search')
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" })

    console.log(`Starting comprehensive Stripe customer search for: ${searchEmail}`)
    let stripeCustomers = { data: [] }
    
    // Strategy 1: Exact email match
    console.log(`Strategy 1: Exact email search`)
    stripeCustomers = await stripe.customers.list({
      email: searchEmail,
      limit: 10
    })
    console.log(`Strategy 1 found ${stripeCustomers.data.length} customers`)

    // Strategy 2: Case-insensitive search
    if (stripeCustomers.data.length === 0) {
      console.log(`Strategy 2: Case-insensitive email search`)
      stripeCustomers = await stripe.customers.list({
        email: searchEmail.toLowerCase(),
        limit: 10
      })
      console.log(`Strategy 2 found ${stripeCustomers.data.length} customers`)
    }

    // Strategy 3: Search query approach
    if (stripeCustomers.data.length === 0) {
      try {
        console.log(`Strategy 3: Search API with query`)
        stripeCustomers = await stripe.customers.search({
          query: `email:"${searchEmail}"`,
          limit: 10
        })
        console.log(`Strategy 3 found ${stripeCustomers.data.length} customers`)
      } catch (searchError) {
        console.log(`Strategy 3 failed: ${searchError.message}`)
      }
    }

    const results = []

    // Process each found customer
    for (const stripeCustomer of stripeCustomers.data) {
      console.log(`Processing Stripe customer: ${stripeCustomer.id}`)
      
      // Get payment methods for this customer
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomer.id,
        type: 'card'
      })

      // Check which payment methods already exist in our system
      const { data: existingPaymentMethods } = await supabaseClient
        .from('customer_payment_methods')
        .select('stripe_payment_method_id')
        .eq('customer_id', customerId)

      const existingIds = new Set(existingPaymentMethods?.map(pm => pm.stripe_payment_method_id) || [])

      const availablePaymentMethods = paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand || 'unknown',
        last4: pm.card?.last4 || '0000',
        exp_month: pm.card?.exp_month || 1,
        exp_year: pm.card?.exp_year || 2025,
        already_imported: existingIds.has(pm.id)
      }))

      results.push({
        stripe_customer_id: stripeCustomer.id,
        name: stripeCustomer.name,
        email: stripeCustomer.email,
        created: stripeCustomer.created,
        payment_methods: availablePaymentMethods,
        total_payment_methods: paymentMethods.data.length,
        new_payment_methods: availablePaymentMethods.filter(pm => !pm.already_imported).length
      })
    }

    console.log(`Search completed. Found ${results.length} Stripe customers`)

    return new Response(JSON.stringify({
      success: true,
      search_email: searchEmail,
      customers_found: results.length,
      customers: results
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