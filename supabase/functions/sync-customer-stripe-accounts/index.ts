import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    console.log('Starting customer-Stripe account sync...')

    // Get all customers with payment_method = 'Stripe'
    const { data: stripeCustomers, error: customerError } = await supabaseClient
      .from('customers')
      .select('id, email, first_name, last_name')
      .not('email', 'is', null)
      .neq('email', '')

    if (customerError) {
      throw new Error(`Database error: ${customerError.message}`)
    }

    console.log('Found customers to sync:', stripeCustomers?.length || 0)

    let syncedCount = 0
    let newPaymentMethodsCount = 0

    for (const customer of stripeCustomers || []) {
      try {
        // Search for Stripe customer by email
        const stripeResponse = await fetch(`https://api.stripe.com/v1/customers/search?query=email:'${customer.email}'`, {
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })

        if (!stripeResponse.ok) {
          console.log(`Stripe API error for customer ${customer.email}:`, stripeResponse.status)
          continue
        }

        const searchResult = await stripeResponse.json()

        if (searchResult.data && searchResult.data.length > 0) {
          const stripeCustomer = searchResult.data[0]
          console.log(`Found Stripe customer for ${customer.email}:`, stripeCustomer.id)

          // Get payment methods for this Stripe customer
          const paymentMethodsResponse = await fetch(`https://api.stripe.com/v1/payment_methods?customer=${stripeCustomer.id}&type=card`, {
            headers: {
              'Authorization': `Bearer ${stripeKey}`,
            },
          })

          if (paymentMethodsResponse.ok) {
            const paymentMethods = await paymentMethodsResponse.json()

            for (const pm of paymentMethods.data) {
              // Check if payment method already exists in our database
              const { data: existingPM } = await supabaseClient
                .from('customer_payment_methods')
                .select('id')
                .eq('stripe_payment_method_id', pm.id)
                .single()

              if (!existingPM) {
                // Insert new payment method
                const { error: insertError } = await supabaseClient
                  .from('customer_payment_methods')
                  .insert({
                    customer_id: customer.id,
                    stripe_customer_id: stripeCustomer.id,
                    stripe_payment_method_id: pm.id,
                    card_brand: pm.card.brand,
                    card_last4: pm.card.last4,
                    card_exp_month: pm.card.exp_month,
                    card_exp_year: pm.card.exp_year,
                    is_default: stripeCustomer.invoice_settings?.default_payment_method === pm.id
                  })

                if (!insertError) {
                  newPaymentMethodsCount++
                  console.log(`Added payment method for customer ${customer.email}`)
                }
              }
            }
          }

          syncedCount++
        }
      } catch (error) {
        console.error(`Error syncing customer ${customer.email}:`, error)
      }
    }

    console.log(`Sync completed: ${syncedCount} customers synced, ${newPaymentMethodsCount} payment methods added`)

    return new Response(
      JSON.stringify({
        success: true,
        customersProcessed: stripeCustomers?.length || 0,
        customersSynced: syncedCount,
        newPaymentMethods: newPaymentMethodsCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

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