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

  let bookingId = null // Store bookingId in outer scope

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    // Parse request body once and store it
    const requestData = await req.json()
    bookingId = requestData.bookingId // Store in outer scope

    if (!bookingId) {
      throw new Error('Booking ID is required')
    }

    // Get booking details with customer info
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, customer:customers(*)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    // Safety guard: avoid creating duplicate authorizations for the same booking
    if (booking.invoice_id && ['authorized', 'Authorized', 'collecting', 'processing', 'requires_action'].includes(booking.payment_status || '')) {
      console.log('Booking already has active Stripe intent, skipping new authorization', {
        bookingId,
        payment_status: booking.payment_status,
        invoice_id: booking.invoice_id,
      });

      return new Response(
        JSON.stringify({
          success: true,
          alreadyAuthorized: true,
          paymentIntentId: booking.invoice_id,
          status: booking.payment_status,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    }

    // Get customer's payment methods (try default first, then any available)
    const { data: defaultPaymentMethods } = await supabaseClient
      .from('customer_payment_methods')
      .select('*')
      .eq('customer_id', booking.customer)
      .eq('is_default', true)

    let paymentMethod = defaultPaymentMethods?.[0]

    // If no default payment method, get any available payment method
    if (!paymentMethod) {
      const { data: anyPaymentMethods } = await supabaseClient
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', booking.customer)
        .limit(1)

      paymentMethod = anyPaymentMethods?.[0]
    }

    if (!paymentMethod) {
      throw new Error('No payment method found for customer')
    }

    // Create Payment Intent (authorization)
    const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: Math.round((booking.total_cost || 0) * 100).toString(), // Convert to cents
        currency: 'gbp',
        customer: paymentMethod.stripe_customer_id,
        payment_method: paymentMethod.stripe_payment_method_id,
        confirmation_method: 'manual',
        confirm: 'true',
        off_session: 'true',
        capture_method: 'manual', // This creates an authorization, not a charge
        description: `Cleaning service booking #${booking.id}`,
        metadata: JSON.stringify({
          booking_id: booking.id.toString(),
          customer_id: booking.customer.toString(),
        }),
      }),
    })

    const paymentIntent = await paymentIntentResponse.json()
    if (!paymentIntentResponse.ok) {
      throw new Error(`Stripe error: ${paymentIntent.error?.message}`)
    }

    // Update booking with payment authorization details
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        invoice_id: paymentIntent.id,
        payment_status: 'collecting', // Your preferred status term
        payment_method: 'stripe_card',
      })
      .eq('id', bookingId)

    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`)
    }

    // Log activity for payment authorization
    await supabaseClient.rpc('log_activity', {
      p_user_id: null,
      p_action_type: 'payment_authorized',
      p_entity_type: 'payment',
      p_entity_id: paymentIntent.id,
      p_details: {
        booking_id: bookingId,
        customer_name: booking.customer?.first_name && booking.customer?.last_name 
          ? `${booking.customer.first_name} ${booking.customer.last_name}`
          : undefined,
        customer_email: booking.customer?.email,
        amount: (booking.total_cost || 0).toFixed(2),
        payment_intent_id: paymentIntent.id,
        booking_date: booking.date_only
      }
    })

    console.log('Payment authorized for booking:', bookingId, 'Payment Intent:', paymentIntent.id)

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error authorizing payment:', error)
    
    // If authorization fails, update booking status and send notification
    if (bookingId) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )
        
        // Update booking status to failed
        await supabaseClient
          .from('bookings')
          .update({ payment_status: 'failed' })
          .eq('id', bookingId)
        
        // Log payment authorization failure
        await supabaseClient.rpc('log_activity', {
          p_user_id: null,
          p_action_type: 'payment_authorization_failed',
          p_entity_type: 'payment',
          p_entity_id: bookingId.toString(),
          p_details: {
            booking_id: bookingId,
            error_message: error.message
          }
        })
        
        // Get booking details for email notification
        const { data: booking } = await supabaseClient
          .from('bookings')
          .select('*, customer:customers(*)')
          .eq('id', bookingId)
          .single()
        
        if (booking && booking.customer) {
          // Get notification trigger
          const { data: trigger } = await supabaseClient
            .from('notification_triggers')
            .select('*, template:email_notification_templates(*)')
            .eq('trigger_event', 'authorization_failed')
            .eq('is_enabled', true)
            .single()
          
          if (trigger && trigger.template) {
            // Prepare notification variables with payment link
            const paymentLink = `https://dkomihipebixlegygnoy.supabase.co/functions/v1/redirect-to-payment-collection?customer_id=${booking.customer}`;
            
            const notificationVariables = {
              customer_name: `${booking.customer.first_name || ''} ${booking.customer.last_name || ''}`.trim() || 'Valued Customer',
              booking_date: booking.date_only ? new Date(booking.date_only).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'TBC',
              booking_time: booking.time_only || 'TBC',
              service_type: booking.service_type || 'Cleaning Service',
              address: booking.address || 'Address not specified',
              total_cost: booking.total_cost?.toString() || '0',
              booking_id: bookingId.toString(),
              error_message: error.message || 'Authorization failed',
              payment_link: paymentLink
            }
            
            // Send notification to each recipient type
            const recipientTypes = trigger.recipient_types || []
            for (const recipientType of recipientTypes) {
              let recipientEmail = ''
              
              if (recipientType === 'customer' && booking.customer.email) {
                recipientEmail = booking.customer.email
              } else if (recipientType === 'admin') {
                recipientEmail = 'sales@sncleaningservices.co.uk'
              }
              
              if (recipientEmail) {
                // Call send-notification-email edge function
                await fetch('https://dkomihipebixlegygnoy.supabase.co/functions/v1/send-notification-email', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                  },
                  body: JSON.stringify({
                    template_id: trigger.template.id,
                    recipient_email: recipientEmail,
                    variables: notificationVariables
                  })
                })
              }
            }
          }
        }
      } catch (updateError) {
        console.error('Failed to update booking status or send notification:', updateError)
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})