import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PhotoUploadData {
  file_path: string;
  booking_id?: number;
  customer_id?: number;
  postcode?: string;
  booking_date?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { file_path, booking_id, customer_id, postcode, booking_date }: PhotoUploadData = await req.json();

    console.log('Auto photo notification triggered for:', file_path, 'booking_id:', booking_id);

    if (!booking_id) {
      console.log('No booking_id provided, skipping notification');
      return new Response(JSON.stringify({ message: 'No booking_id provided' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Try to create notification record (will fail if already exists due to unique constraint)
    const { data: existingNotification, error: insertError } = await supabase
      .from('photo_completion_notifications')
      .insert({
        booking_id,
        email_sent: false,
        notification_sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError && insertError.code === '23505') {
      // Unique constraint violation - notification already exists
      console.log('Notification already exists for booking:', booking_id, '- checking status');
      
      const { data: existing } = await supabase
        .from('photo_completion_notifications')
        .select('*')
        .eq('booking_id', booking_id)
        .single();

      if (existing?.email_sent) {
        console.log('Email already sent for booking:', booking_id);
        return new Response(JSON.stringify({ message: 'Email already sent for this booking' }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Check if 15 minutes have passed since first upload
      if (existing) {
        const firstUploadTime = new Date(existing.created_at);
        const now = new Date();
        const timeDiffMinutes = (now.getTime() - firstUploadTime.getTime()) / (1000 * 60);
        
        console.log('Time since first upload:', timeDiffMinutes, 'minutes');
        
        if (timeDiffMinutes >= 15) {
          // Send the consolidated notification
          await sendConsolidatedNotification(supabase, booking_id, postcode, booking_date);
          
          // Mark as sent
          await supabase
            .from('photo_completion_notifications')
            .update({
              email_sent: true,
              notification_sent_at: new Date().toISOString()
            })
            .eq('booking_id', booking_id);
            
          console.log('Consolidated notification sent for booking:', booking_id);
        } else {
          console.log('Timer already running. Time remaining:', 15 - timeDiffMinutes, 'minutes');
        }
      }
    } else if (!insertError) {
      // Successfully created notification record - this is the first photo upload
      console.log('First photo upload for booking:', booking_id, 'starting 15-minute timer');
      
      // Schedule the delayed notification using a background task
      EdgeRuntime.waitUntil(scheduleDelayedNotification(supabase, booking_id, postcode, booking_date));
    } else {
      console.error('Error creating notification record:', insertError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Photo upload processed',
      booking_id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in auto-photo-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function scheduleDelayedNotification(supabase: any, booking_id: number, postcode?: string, booking_date?: string) {
  try {
    console.log('Starting 15-minute delay for booking:', booking_id);
    
    // Wait 15 minutes
    await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000));
    
    console.log('15-minute delay completed for booking:', booking_id);
    
    // Check if notification still needs to be sent
    const { data: notification } = await supabase
      .from('photo_completion_notifications')
      .select('*')
      .eq('booking_id', booking_id)
      .eq('email_sent', false)
      .single();

    if (notification) {
      await sendConsolidatedNotification(supabase, booking_id, postcode, booking_date);
      
      // Mark as sent
      await supabase
        .from('photo_completion_notifications')
        .update({
          email_sent: true,
          notification_sent_at: new Date().toISOString()
        })
        .eq('booking_id', booking_id);
        
      console.log('Delayed notification sent for booking:', booking_id);
    } else {
      console.log('Notification already sent or cancelled for booking:', booking_id);
    }
  } catch (error) {
    console.error('Error in delayed notification for booking:', booking_id, error);
  }
}

async function sendConsolidatedNotification(supabase: any, booking_id: number, postcode?: string, booking_date?: string) {
  try {
    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('customer, first_name, last_name, email, address, postcode, date_time')
      .eq('id', booking_id)
      .single();

    if (!booking) {
      console.log('Booking not found:', booking_id);
      return;
    }

    // Get customer details if email not in booking
    let customerEmail = booking.email;
    if (!customerEmail && booking.customer) {
      const { data: customer } = await supabase
        .from('customers')
        .select('email, first_name, last_name')
        .eq('id', booking.customer)
        .single();
      
      if (customer) {
        customerEmail = customer.email;
      }
    }

    // Get all photos for this booking
    const { data: photos } = await supabase
      .from('cleaning_photos')
      .select('*')
      .eq('booking_id', booking_id);

    const photoCount = photos?.length || 0;
    const folderPath = `${booking.postcode || postcode}_${booking_date || new Date().toISOString().split('T')[0]}_${booking_id}`;

    console.log('Sending consolidated email for booking:', booking_id, 'to:', customerEmail, 'photos:', photoCount);

    // Send notification email
    const emailResponse = await resend.emails.send({
      from: "SN Cleaning <noreply@notifications.sncleaningservices.co.uk>",
      to: customerEmail ? [customerEmail] : ["sales@sncleaningservices.co.uk"],
      cc: ["sales@sncleaningservices.co.uk"],
      reply_to: "sales@sncleaningservices.co.uk",
      subject: `Your Cleaning Photos Are Ready! 📸 - ${booking.address || folderPath}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
          <div style="background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 30px 30px 0 30px;">
              <h1 style="color: #18A5A5; margin: 0; font-size: 28px;">SN Cleaning</h1>
              <p style="color: #185166; margin: 5px 0 0 0; font-size: 14px;">Professional Cleaning Services</p>
            </div>

            <div style="padding: 0 30px 30px 30px;">
              <h2 style="color: #18A5A5; margin-bottom: 20px;">📸 Your Cleaning Photos Are Ready!</h2>
              
              <p>Dear ${booking.first_name || 'Valued Customer'},</p>
              
              <p>Great news! Your cleaner has finished the job and uploaded ${photoCount} photo${photoCount !== 1 ? 's' : ''} showing the completed work.</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #18A5A5;">
                <h3 style="margin-top: 0; color: #185166;">Cleaning Summary:</h3>
                <p style="margin: 5px 0;"><strong>Address:</strong> ${booking.address}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${booking_date || new Date(booking.date_time).toLocaleDateString()}</p>
                <p style="margin: 5px 0;"><strong>Photos:</strong> ${photoCount} photo${photoCount !== 1 ? 's' : ''} uploaded</p>
                <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking_id}</p>
              </div>
              
              <div style="background-color: #18A5A5; color: white; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 15px 0;">View Your Photos</h3>
                <p style="margin: 0 0 20px 0;">Click the button below to view all photos of your completed cleaning:</p>
                <a href="https://account.sncleaningservices.co.uk/photos/${folderPath}" 
                   style="display: inline-block; background-color: white; color: #18A5A5; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px;">
                  📸 View Photos
                </a>
              </div>
              
              <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #bee5eb;">
                <p style="margin: 0; color: #0c5460; font-size: 14px;">
                  <strong>Thank you for choosing SN Cleaning!</strong><br>
                  We hope you're satisfied with our service. If you have any questions or feedback, please don't hesitate to contact us.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #18A5A5; font-weight: bold; margin: 0;">SN Cleaning Services</p>
                <p style="color: #666; font-size: 12px; margin: 5px 0;">Professional • Reliable • Trusted</p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Consolidated notification email sent successfully:", emailResponse);
    return emailResponse;
  } catch (error) {
    console.error("Error sending consolidated notification:", error);
    throw error;
  }
}

serve(handler);