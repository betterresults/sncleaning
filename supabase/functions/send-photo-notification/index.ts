import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PhotoNotificationRequest {
  booking_id: number;
  customer_email?: string;
  customer_name?: string;
  service_type?: string;
  booking_date?: string;
  photo_count?: number;
  photo_folder_path?: string; // e.g., "SE164NF_2025-07-07_29"
  // Alternative format
  customer_id?: number;
  cleaner_id?: number;
  folder_name?: string;
  total_photos?: number;
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

    const requestData: PhotoNotificationRequest = await req.json();
    const { 
      booking_id, 
      customer_email, 
      customer_name, 
      service_type, 
      booking_date, 
      photo_count, 
      photo_folder_path,
      customer_id,
      cleaner_id,
      folder_name,
      total_photos
    } = requestData;

    console.log('Processing photo notification for booking:', booking_id);
    console.log('Request data:', requestData);

    // Get booking details if not provided
    let bookingDetails: any = {};
    let customerInfo: any = {};
    
    if (!customer_email || !customer_name) {
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          customers!customer (
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', booking_id)
        .single();
      
      if (!booking) {
        // Try past_bookings table
        const { data: pastBooking } = await supabase
          .from('past_bookings')
          .select(`
            *,
            customers!customer (
              first_name,
              last_name,
              email
            )
          `)
          .eq('id', booking_id)
          .single();
        
        if (pastBooking) {
          bookingDetails = pastBooking;
          customerInfo = pastBooking.customers || {
            first_name: pastBooking.first_name,
            last_name: pastBooking.last_name,
            email: pastBooking.email
          };
        }
      } else {
        bookingDetails = booking;
        customerInfo = booking.customers || {
          first_name: booking.first_name,
          last_name: booking.last_name,
          email: booking.email
        };
      }
    }

    // Get photos for this booking to determine the folder path and count
    const { data: photos } = await supabase
      .from('cleaning_photos')
      .select('file_path, postcode, booking_date')
      .eq('booking_id', booking_id);

    // Generate folder path from the first photo's path or use provided path
    let folderPath = photo_folder_path || folder_name;
    let photoCount = photo_count || total_photos || (photos ? photos.length : 0);
    
    if (!folderPath && photos && photos.length > 0) {
      const photoPath = photos[0].file_path;
      // Extract folder from path like "SE164NF_2025-07-07_29/photo1.jpg" 
      const folderMatch = photoPath.match(/^([^\/]+)\//);
      folderPath = folderMatch ? folderMatch[1] : null;
    }

    // Use provided data or fallback to booking data
    const finalCustomerEmail = customer_email || customerInfo.email;
    const finalCustomerName = customer_name || `${customerInfo.first_name || ''} ${customerInfo.last_name || ''}`.trim();
    const finalServiceType = service_type || bookingDetails.service_type || 'Cleaning Service';
    const finalBookingDate = booking_date || bookingDetails.date_time || bookingDetails.booking_date;

    // Check if notification already sent for this booking
    const { data: existingNotification } = await supabase
      .from('photo_completion_notifications')
      .select('*')
      .eq('booking_id', booking_id)
      .eq('email_sent', true)
      .single();

    if (existingNotification) {
      console.log('Email already sent for booking:', booking_id);
      return new Response(JSON.stringify({ message: 'Email already sent' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Prepare email recipients
    const recipients = [];
    if (finalCustomerEmail) {
      recipients.push(finalCustomerEmail);
    }
    recipients.push("sales@sncleaningservices.co.uk");

    console.log('Sending email to:', recipients);
    console.log('Customer:', finalCustomerName);
    console.log('Service:', finalServiceType);
    console.log('Photos:', photoCount);
    console.log('Folder:', folderPath);

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "SN Cleaning <noreply@notifications.sncleaningservices.co.uk>",
      to: recipients,
      reply_to: "sales@sncleaningservices.co.uk",
      subject: `Your Cleaning Photos Are Ready! 📸`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
          <div style="background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 30px 30px 0 30px;">
              <h1 style="color: #18A5A5; margin: 0; font-size: 28px;">SN Cleaning</h1>
              <p style="color: #185166; margin: 5px 0 0 0; font-size: 14px;">Professional Cleaning Services</p>
            </div>

            <div style="padding: 0 30px 30px 30px;">
              <h2 style="color: #18A5A5; margin-bottom: 20px;">Your Cleaning Photos Are Ready!</h2>
              
              <p>Dear ${finalCustomerName || 'Valued Customer'},</p>
              
              <p>Great news! Your cleaner has completed the ${finalServiceType} service and uploaded ${photoCount} photos showing the excellent work completed at your property.</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #18A5A5;">
                <h3 style="margin-top: 0; color: #185166;">Service Details:</h3>
                <p style="margin: 5px 0;"><strong>Service:</strong> ${finalServiceType}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${finalBookingDate ? new Date(finalBookingDate).toLocaleDateString() : 'Recent service'}</p>
                <p style="margin: 5px 0;"><strong>Photos:</strong> ${photoCount} uploaded</p>
                <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking_id}</p>
              </div>
              
              ${folderPath ? `
              <div style="background-color: #18A5A5; color: white; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 15px 0;">View Your Cleaning Photos</h3>
                <p style="margin: 0 0 20px 0;">Click the button below to access your before and after photos:</p>
                <a href="https://ffa08752-d853-4e87-8f4f-92b4f1e65779.sandbox.lovable.dev/photos/${folderPath}" 
                   style="display: inline-block; background-color: white; color: #18A5A5; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px;">
                  📸 View Photos
                </a>
                <p style="margin: 20px 0 0 0; font-size: 14px; opacity: 0.9;">
                  Note: Photos are publicly accessible - no login required
                </p>
              </div>
              ` : ''}
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  <strong>Note:</strong> These photos showcase the quality of work performed and serve as verification of service completion. 
                  You can access these photos anytime through the provided link.
                </p>
              </div>
              
              <p>We take pride in our thorough cleaning service and transparency. If you have any questions about the service or would like to schedule your next cleaning, please don't hesitate to contact us.</p>
              
              <p style="margin-top: 30px;">Thank you for choosing SN Cleaning!</p>
              
              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #18A5A5; font-weight: bold; margin: 0;">SN Cleaning Services</p>
                <p style="color: #666; font-size: 12px; margin: 5px 0;">Professional • Reliable • Trusted</p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #666; font-size: 12px; text-align: center;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Record the notification
    await supabase
      .from('photo_completion_notifications')
      .insert({
        booking_id,
        email_sent: true,
        notification_sent_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email notification sent successfully',
      email_id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-photo-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);