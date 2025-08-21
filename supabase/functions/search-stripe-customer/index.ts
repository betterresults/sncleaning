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

    // Strategy 4: Debug - List recent customers to help identify the issue
    let debugCustomers = []
    if (stripeCustomers.data.length === 0) {
      try {
        console.log(`Strategy 4: Comprehensive customer listing for debugging`)
        const allCustomers = await stripe.customers.list({ limit: 100 }) // Increase limit to see more customers
        debugCustomers = allCustomers.data.map(c => ({
          id: c.id,
          email: c.email,
          name: c.name,
          created: c.created
        }))
        console.log(`Strategy 4: Found ${debugCustomers.length} total customers in Stripe`)
        
        // Log ALL customer emails for debugging
        console.log('ALL STRIPE CUSTOMER EMAILS:')
        allCustomers.data.forEach((c, index) => {
          console.log(`${index + 1}. "${c.email}" (Name: ${c.name || 'No name'}) - ID: ${c.id}`)
        })
        
        // Try exact match ignoring case and whitespace
        console.log(`\nSearching for exact match of: "${searchEmail}"`)
        const exactMatch = allCustomers.data.find(c => 
          c.email && c.email.trim().toLowerCase() === searchEmail.trim().toLowerCase()
        )
        
        if (exactMatch) {
          console.log(`FOUND EXACT MATCH: ${exactMatch.email} - ID: ${exactMatch.id}`)
          stripeCustomers.data = [exactMatch]
        } else {
          // Try partial matches with detailed logging
          console.log(`No exact match found, trying partial matches...`)
          const partialMatches = allCustomers.data.filter(c => {
            if (!c.email) return false
            
            const customerEmail = c.email.trim().toLowerCase()
            const searchLower = searchEmail.trim().toLowerCase()
            
            const contains = customerEmail.includes(searchLower) || searchLower.includes(customerEmail)
            
            if (contains) {
              console.log(`PARTIAL MATCH FOUND: "${c.email}" vs "${searchEmail}"`)
            }
            
            return contains
          })
          
          if (partialMatches.length > 0) {
            console.log(`Found ${partialMatches.length} partial matches`)
            stripeCustomers.data = partialMatches
          } else {
            console.log(`NO MATCHES FOUND AT ALL for "${searchEmail}"`)
            // Show similar emails for debugging
            const similarEmails = allCustomers.data
              .filter(c => c.email)
              .map(c => c.email)
              .filter(email => {
                const emailParts = email.split('@')
                const searchParts = searchEmail.split('@')
                return emailParts[0] && searchParts[0] && 
                       (emailParts[0].toLowerCase().includes(searchParts[0].toLowerCase()) ||
                        searchParts[0].toLowerCase().includes(emailParts[0].toLowerCase()))
              })
            
            console.log(`Similar email addresses found: ${similarEmails.join(', ')}`)
          }
        }
      } catch (debugError) {
        console.log(`Strategy 4 debug listing failed: ${debugError.message}`)
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
      customers: results,
      debug_recent_customers: debugCustomers // Include recent customers for debugging
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