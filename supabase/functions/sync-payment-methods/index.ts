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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { customerId } = await req.json()
    if (!customerId) {
      throw new Error('Customer ID is required')
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    console.log('Syncing payment methods for customer:', customerId)

    // Get all payment methods from our database for this customer
    const { data: localPaymentMethods, error: dbError } = await supabaseClient
      .from('customer_payment_methods')
      .select('*')
      .eq('customer_id', customerId)

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    console.log('Found local payment methods:', localPaymentMethods?.length || 0)

    const validPaymentMethods = []
    const invalidPaymentMethodIds = []

    // Check each payment method against Stripe
    for (const paymentMethod of localPaymentMethods || []) {
      try {
        const stripeResponse = await fetch(`https://api.stripe.com/v1/payment_methods/${paymentMethod.stripe_payment_method_id}`, {
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
          },
        })

        if (stripeResponse.ok) {
          const stripePaymentMethod = await stripeResponse.json()
          // Check if payment method is still attached to the customer
          if (stripePaymentMethod.customer === paymentMethod.stripe_customer_id) {
            validPaymentMethods.push(paymentMethod)
            console.log('Valid payment method:', paymentMethod.stripe_payment_method_id)
          } else {
            console.log('Payment method no longer attached to customer:', paymentMethod.stripe_payment_method_id)
            invalidPaymentMethodIds.push(paymentMethod.id)
          }
        } else {
          // Payment method doesn't exist in Stripe anymore
          console.log('Payment method not found in Stripe:', paymentMethod.stripe_payment_method_id)
          invalidPaymentMethodIds.push(paymentMethod.id)
        }
      } catch (error) {
        console.error('Error checking payment method:', paymentMethod.stripe_payment_method_id, error)
        // Assume invalid if we can't verify
        invalidPaymentMethodIds.push(paymentMethod.id)
      }
    }

    // Remove invalid payment methods from our database
    if (invalidPaymentMethodIds.length > 0) {
      console.log('Removing invalid payment methods:', invalidPaymentMethodIds)
      const { error: deleteError } = await supabaseClient
        .from('customer_payment_methods')
        .delete()
        .in('id', invalidPaymentMethodIds)

      if (deleteError) {
        console.error('Error deleting invalid payment methods:', deleteError)
      } else {
        console.log('Successfully removed', invalidPaymentMethodIds.length, 'invalid payment methods')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        validPaymentMethods: validPaymentMethods.length,
        removedPaymentMethods: invalidPaymentMethodIds.length,
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