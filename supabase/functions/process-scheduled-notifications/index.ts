import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledNotification {
  id: string;
  trigger_id: string;
  entity_id: string;
  entity_type: string;
  recipient_email: string;
  recipient_type: string;
  scheduled_for: string;
  status: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing scheduled notifications at:', new Date().toISOString());

    // Get pending scheduled notifications that are due
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notification_schedules')
      .select(`
        *,
        notification_triggers (
          id,
          name,
          template_id,
          sms_template_id,
          notification_channel,
          recipient_types
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50);

    if (fetchError) {
      console.error('Error fetching scheduled notifications:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingNotifications?.length || 0} pending notifications to process`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const notification of pendingNotifications || []) {
      processed++;
      
      try {
        const trigger = notification.notification_triggers;
        if (!trigger) {
          console.warn(`No trigger found for notification ${notification.id}`);
          await markNotificationFailed(supabase, notification.id, 'Trigger not found');
          failed++;
          continue;
        }

        // Get booking details for variables
        let bookingData = null;
        let customerData = null;
        let cleanerData = null;

        if (notification.entity_type === 'booking') {
          const { data: booking } = await supabase
            .from('bookings')
            .select(`
              *,
              customers!bookings_customer_fkey (
                id, first_name, last_name, email, phone
              ),
              cleaners!bookings_cleaner_fkey (
                id, first_name, last_name, email, phone
              )
            `)
            .eq('id', parseInt(notification.entity_id))
            .single();

          if (booking) {
            bookingData = booking;
            customerData = booking.customers;
            cleanerData = booking.cleaners;
          }
        }

        if (!bookingData) {
          console.warn(`Booking not found for notification ${notification.id}`);
          await markNotificationFailed(supabase, notification.id, 'Booking not found');
          failed++;
          continue;
        }

        // Check if booking is still active (not cancelled)
        if (bookingData.booking_status === 'cancelled') {
          console.log(`Booking ${bookingData.id} is cancelled, skipping notification`);
          await markNotificationCancelled(supabase, notification.id, 'Booking cancelled');
          continue;
        }

        // Prepare notification variables
        const variables = {
          customer_name: customerData ? `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() : bookingData.first_name || 'Customer',
          booking_date: bookingData.date_time ? new Date(bookingData.date_time).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'TBC',
          booking_time: bookingData.time_only || 'TBC',
          service_type: bookingData.service_type || 'Cleaning Service',
          address: bookingData.address || 'Address not specified',
          cleaner_name: cleanerData ? `${cleanerData.first_name || ''} ${cleanerData.last_name || ''}`.trim() : 'To be assigned',
          total_cost: bookingData.total_cost?.toString() || '0',
          booking_id: bookingData.id?.toString() || '',
        };

        const channel = trigger.notification_channel || 'email';

        // Send email if channel is email or both
        if ((channel === 'email' || channel === 'both') && trigger.template_id) {
          console.log(`Sending email notification to ${notification.recipient_email}`);
          
          const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
            body: {
              template_id: trigger.template_id,
              recipient_email: notification.recipient_email,
              variables,
              entity_type: notification.entity_type,
              entity_id: notification.entity_id,
              trigger_id: trigger.id,
            }
          });

          if (emailError) {
            console.error('Error sending email:', emailError);
          } else {
            console.log(`Email sent successfully to ${notification.recipient_email}`);
          }
        }

        // Send SMS if channel is sms or both
        if ((channel === 'sms' || channel === 'both') && trigger.sms_template_id) {
          // Get SMS template
          const { data: smsTemplate } = await supabase
            .from('sms_templates')
            .select('content')
            .eq('id', trigger.sms_template_id)
            .single();

          if (smsTemplate) {
            // Get phone number based on recipient type
            let phoneNumber = null;
            if (notification.recipient_type === 'customer' && customerData?.phone) {
              phoneNumber = customerData.phone;
            } else if (notification.recipient_type === 'cleaner' && cleanerData?.phone) {
              phoneNumber = cleanerData.phone?.toString();
            } else if (bookingData.phone_number) {
              phoneNumber = bookingData.phone_number;
            }

            if (phoneNumber) {
              // Replace variables in SMS content
              let smsContent = smsTemplate.content;
              Object.entries(variables).forEach(([key, value]) => {
                smsContent = smsContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
              });

              console.log(`Sending SMS to ${phoneNumber}`);
              
              const { error: smsError } = await supabase.functions.invoke('send-sms-notification', {
                body: {
                  phone_number: phoneNumber,
                  message: smsContent,
                }
              });

              if (smsError) {
                console.error('Error sending SMS:', smsError);
              } else {
                console.log(`SMS sent successfully to ${phoneNumber}`);
              }
            } else {
              console.warn(`No phone number available for ${notification.recipient_type}`);
            }
          }
        }

        // Mark notification as sent
        await supabase
          .from('notification_schedules')
          .update({ status: 'sent', updated_at: new Date().toISOString() })
          .eq('id', notification.id);

        succeeded++;

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        await markNotificationFailed(supabase, notification.id, error.message);
        failed++;
      }
    }

    console.log(`Processing complete: ${processed} processed, ${succeeded} succeeded, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        succeeded,
        failed,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-scheduled-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function markNotificationFailed(supabase: any, id: string, errorMessage: string) {
  await supabase
    .from('notification_schedules')
    .update({ 
      status: 'failed', 
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
}

async function markNotificationCancelled(supabase: any, id: string, reason: string) {
  await supabase
    .from('notification_schedules')
    .update({ 
      status: 'cancelled', 
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
}
