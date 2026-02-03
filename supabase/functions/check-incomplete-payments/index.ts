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

    console.log('Checking for incomplete payment bookings...')

    // Get the trigger configuration
    const { data: trigger, error: triggerError } = await supabaseClient
      .from('notification_triggers')
      .select('*, template:email_notification_templates(*), sms_template:sms_templates(*)')
      .eq('trigger_event', 'incomplete_payment')
      .eq('is_enabled', true)
      .single()

    if (triggerError || !trigger) {
      console.log('No active incomplete_payment trigger found')
      return new Response(
        JSON.stringify({ message: 'No active trigger found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const timingOffset = trigger.timing_offset || 30 // Default 30 minutes
    const cutoffTime = new Date(Date.now() - timingOffset * 60 * 1000).toISOString()

    // Find bookings that:
    // 1. Were created more than X minutes ago
    // 2. Have payment_method = 'Stripe'
    // 3. Have payment_status = 'Unpaid'
    // 4. Have no invoice_id (meaning payment was never completed)
    // 5. Haven't already received this notification
    const { data: incompleteBookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select(`
        id,
        customer,
        email,
        first_name,
        last_name,
        phone_number,
        service_type,
        date_only,
        time_only,
        total_cost,
        address,
        postcode,
        date_submited,
        customer:customers(id, first_name, last_name, email, phone, whatsapp)
      `)
      .eq('payment_method', 'Stripe')
      .eq('payment_status', 'Unpaid')
      .is('invoice_id', null)
      .lt('date_submited', cutoffTime)
      .eq('booking_status', 'active')

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      throw bookingsError
    }

    console.log(`Found ${incompleteBookings?.length || 0} incomplete payment bookings`)

    if (!incompleteBookings || incompleteBookings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No incomplete bookings found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const results = []

    for (const booking of incompleteBookings) {
      // Check if we already sent this notification for this booking
      const { data: existingLog } = await supabaseClient
        .from('notification_logs')
        .select('id')
        .eq('entity_type', 'booking')
        .eq('entity_id', booking.id.toString())
        .eq('trigger_id', trigger.id)
        .limit(1)

      if (existingLog && existingLog.length > 0) {
        console.log(`Already sent incomplete payment notification for booking ${booking.id}`)
        continue
      }

      const customer = booking.customer as any
      const customerName = customer?.first_name 
        ? `${customer.first_name}${customer.last_name ? ' ' + customer.last_name : ''}`
        : booking.first_name 
          ? `${booking.first_name}${booking.last_name ? ' ' + booking.last_name : ''}`
          : 'Valued Customer'
      
      const customerEmail = customer?.email || booking.email
      const customerPhone = customer?.phone || customer?.whatsapp || booking.phone_number

      // Generate payment link
      const paymentLink = `https://dkomihipebixlegygnoy.supabase.co/functions/v1/redirect-to-payment-collection?customer_id=${booking.customer}`

      // Format date and time
      const bookingDate = booking.date_only 
        ? new Date(booking.date_only).toLocaleDateString('en-GB', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })
        : 'TBC'
      const bookingTime = booking.time_only || 'TBC'

      const variables = {
        customer_name: customerName,
        service_type: booking.service_type || 'Cleaning',
        booking_date: bookingDate,
        booking_time: bookingTime,
        total_cost: booking.total_cost?.toFixed(2) || '0.00',
        payment_link: paymentLink,
        address: booking.address || '',
        postcode: booking.postcode || ''
      }

      // Send email if template exists and customer has email
      if (trigger.template && customerEmail && trigger.notification_channel !== 'sms') {
        try {
          const emailResponse = await fetch('https://dkomihipebixlegygnoy.supabase.co/functions/v1/send-notification-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              template_id: trigger.template.id,
              recipient_email: customerEmail,
              variables,
              entity_type: 'booking',
              entity_id: booking.id.toString(),
              trigger_id: trigger.id
            })
          })

          if (emailResponse.ok) {
            console.log(`Email sent for booking ${booking.id} to ${customerEmail}`)
            results.push({ booking_id: booking.id, email: 'sent' })
          } else {
            const errorText = await emailResponse.text()
            console.error(`Email failed for booking ${booking.id}:`, errorText)
            results.push({ booking_id: booking.id, email: 'failed', error: errorText })
          }
        } catch (emailError) {
          console.error(`Email error for booking ${booking.id}:`, emailError)
          results.push({ booking_id: booking.id, email: 'error', error: String(emailError) })
        }
      }

      // Send SMS if template exists and customer has phone
      if (trigger.sms_template && customerPhone && trigger.notification_channel !== 'email') {
        try {
          // Replace variables in SMS content
          let smsContent = trigger.sms_template.content
          for (const [key, value] of Object.entries(variables)) {
            smsContent = smsContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
          }

          const smsResponse = await fetch('https://dkomihipebixlegygnoy.supabase.co/functions/v1/send-sms-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              to: customerPhone,
              message: smsContent,
              entity_type: 'booking',
              entity_id: booking.id.toString(),
              trigger_id: trigger.id,
              template_name: trigger.sms_template.name
            })
          })

          if (smsResponse.ok) {
            console.log(`SMS sent for booking ${booking.id} to ${customerPhone}`)
            results.push({ booking_id: booking.id, sms: 'sent' })
          } else {
            const errorText = await smsResponse.text()
            console.error(`SMS failed for booking ${booking.id}:`, errorText)
            results.push({ booking_id: booking.id, sms: 'failed', error: errorText })
          }
        } catch (smsError) {
          console.error(`SMS error for booking ${booking.id}:`, smsError)
          results.push({ booking_id: booking.id, sms: 'error', error: String(smsError) })
        }
      }
    }

    console.log('Incomplete payment check completed:', results)

    return new Response(
      JSON.stringify({ 
        message: 'Incomplete payment check completed',
        processed: incompleteBookings.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in check-incomplete-payments:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
