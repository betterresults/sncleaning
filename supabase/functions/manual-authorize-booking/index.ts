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
    )

    const { bookingId } = await req.json()

    if (!bookingId) {
      throw new Error('Booking ID is required')
    }

    console.log(`Manual authorization request for booking ${bookingId}`)

    // Call the stripe-authorize-payment function
    const { data: authResult, error: authError } = await supabaseClient.functions.invoke('stripe-authorize-payment', {
      body: { bookingId: bookingId }
    })

    if (authError) {
      console.error(`Authorization failed for booking ${bookingId}:`, authError)
      
      // Send email notification for failed authorization
      try {
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
            // Prepare notification variables
            const notificationVariables = {
              customer_name: `${booking.customer.first_name || ''} ${booking.customer.last_name || ''}`.trim() || 'Valued Customer',
              booking_date: booking.date_only ? new Date(booking.date_only).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'TBC',
              booking_time: booking.time_only || 'TBC',
              service_type: booking.service_type || 'Cleaning Service',
              address: booking.address || 'Address not specified',
              total_cost: booking.total_cost?.toString() || '0',
              booking_id: bookingId.toString(),
              error_message: authError.message || 'Authorization failed'
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
      } catch (emailError) {
        console.error('Failed to send authorization failure notification:', emailError)
        // Don't fail the main response if email fails
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authError.message,
          bookingId: bookingId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`Authorization successful for booking ${bookingId}:`, authResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: authResult,
        bookingId: bookingId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in manual authorization:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})