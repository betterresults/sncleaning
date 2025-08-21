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

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" })

    // Parse request body to check for specific customer ID
    const body = req.method === 'POST' ? await req.json() : {}
    const specificCustomerId = body.customerId

    console.log('Starting customer-Stripe account sync...')
    
    if (specificCustomerId) {
      console.log(`Syncing specific customer ID: ${specificCustomerId}`)
    }

    // Get customers - either specific customer or all customers
    let query = supabaseClient
      .from('customers')
      .select('id, email, first_name, last_name')
      .not('email', 'is', null)
      .neq('email', '')

    if (specificCustomerId) {
      query = query.eq('id', specificCustomerId)
    }

    const { data: customers, error: customerError } = await query

    if (customerError) {
      throw new Error(`Database error: ${customerError.message}`)
    }

    console.log(`Found ${customers?.length || 0} customers to sync`)

    let customersProcessed = 0
    let totalPaymentMethodsAdded = 0

    // Process each customer
    for (const customer of customers || []) {
      try {
        console.log(`Processing customer: ${customer.id} - ${customer.email}`)

        // Search for Stripe customer by email
        console.log(`Searching Stripe for customer with email: ${customer.email}`)
        const stripeCustomers = await stripe.customers.list({
          email: customer.email,
          limit: 1
        })

        if (stripeCustomers.data.length === 0) {
          console.log(`No Stripe customer found for ${customer.email}`)
          continue
        }

        const stripeCustomer = stripeCustomers.data[0]
        console.log(`Found Stripe customer: ${stripeCustomer.id} for ${customer.email}`)

        // Get payment methods for this Stripe customer
        const paymentMethods = await stripe.paymentMethods.list({
          customer: stripeCustomer.id,
          type: 'card'
        })

        console.log(`Found ${paymentMethods.data.length} payment methods for customer ${customer.email}`)

        // Check existing payment methods in our database
        const { data: existingPaymentMethods } = await supabaseClient
          .from('customer_payment_methods')
          .select('stripe_payment_method_id')
          .eq('customer_id', customer.id)

        const existingIds = new Set(existingPaymentMethods?.map(pm => pm.stripe_payment_method_id) || [])
        console.log(`Existing payment methods in database: ${existingIds.size}`)

        // Insert new payment methods
        let addedCount = 0
        for (const pm of paymentMethods.data) {
          if (!existingIds.has(pm.id)) {
            console.log(`Adding new payment method: ${pm.id} for customer ${customer.id}`)
            
            const { error: insertError } = await supabaseClient
              .from('customer_payment_methods')
              .insert({
                customer_id: customer.id,
                stripe_payment_method_id: pm.id,
                stripe_customer_id: stripeCustomer.id,
                card_brand: pm.card?.brand || 'unknown',
                card_last4: pm.card?.last4 || '0000',
                card_exp_month: pm.card?.exp_month || 1,
                card_exp_year: pm.card?.exp_year || 2025,
                is_default: addedCount === 0 // Set first payment method as default
              })

            if (insertError) {
              console.error(`Error inserting payment method ${pm.id}:`, insertError)
            } else {
              addedCount++
              totalPaymentMethodsAdded++
              console.log(`Successfully added payment method ${pm.id}`)
            }
          } else {
            console.log(`Payment method ${pm.id} already exists, skipping`)
          }
        }

        if (addedCount > 0) {
          console.log(`Added ${addedCount} payment methods for customer ${customer.email}`)
        } else if (paymentMethods.data.length > 0) {
          console.log(`All ${paymentMethods.data.length} payment methods already exist for customer ${customer.email}`)
        }

        customersProcessed++

      } catch (error) {
        console.error(`Error processing customer ${customer.id}:`, error)
      }
    }

    console.log(`Sync completed: ${customersProcessed} customers processed, ${totalPaymentMethodsAdded} payment methods added`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Sync completed successfully',
      customersProcessed: customersProcessed,
      paymentMethodsAdded: totalPaymentMethodsAdded
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})