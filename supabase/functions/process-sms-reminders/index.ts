import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing SMS reminders queue...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending reminders that are due to be sent
    const now = new Date().toISOString();
    const { data: pendingReminders, error: fetchError } = await supabase
      .from('sms_reminders_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('send_at', now)
      .limit(50); // Process max 50 at a time

    if (fetchError) {
      throw new Error(`Failed to fetch reminders: ${fetchError.message}`);
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      console.log('No pending reminders to process');
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: 0,
          message: 'No pending reminders'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${pendingReminders.length} reminders to process`);

    let successCount = 0;
    let failCount = 0;

    // Process each reminder
    for (const reminder of pendingReminders) {
      try {
        console.log(`Processing reminder ${reminder.id} for booking ${reminder.booking_id}`);

        // Check if payment has been made since reminder was queued
        const { data: booking } = await supabase
          .from('bookings')
          .select('payment_status')
          .eq('id', reminder.booking_id)
          .single();

        if (booking && booking.payment_status === 'Paid') {
          console.log(`Booking ${reminder.booking_id} already paid, cancelling reminder`);
          await supabase
            .from('sms_reminders_queue')
            .update({ status: 'cancelled' })
            .eq('id', reminder.id);
          continue;
        }

        // Send SMS via send-payment-sms function
        const smsResponse = await fetch(`${supabaseUrl}/functions/v1/send-payment-sms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: reminder.booking_id,
            phoneNumber: reminder.phone_number,
            customerName: reminder.customer_name,
            amount: reminder.amount,
            paymentLink: reminder.payment_link,
            messageType: reminder.message_type || 'invoice',
          }),
        });

        if (smsResponse.ok) {
          // Mark as sent
          await supabase
            .from('sms_reminders_queue')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', reminder.id);

          successCount++;
          console.log(`Reminder ${reminder.id} sent successfully`);
        } else {
          const errorText = await smsResponse.text();
          console.error(`Failed to send reminder ${reminder.id}:`, errorText);

          // Mark as failed
          await supabase
            .from('sms_reminders_queue')
            .update({ 
              status: 'failed',
              error_message: errorText
            })
            .eq('id', reminder.id);

          failCount++;
        }
      } catch (reminderError: any) {
        console.error(`Error processing reminder ${reminder.id}:`, reminderError);
        
        // Mark as failed
        await supabase
          .from('sms_reminders_queue')
          .update({ 
            status: 'failed',
            error_message: reminderError.message
          })
          .eq('id', reminder.id);

        failCount++;
      }
    }

    console.log(`Processed ${successCount} reminders successfully, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: successCount + failCount,
        successful: successCount,
        failed: failCount,
        message: `Processed ${successCount + failCount} reminders`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in process-sms-reminders:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
