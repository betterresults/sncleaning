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

    console.log('Auto photo notification triggered for:', file_path);

    // Extract folder name from file path (e.g., "SE164NF_2025-07-07_29/photo1.jpg" -> "SE164NF_2025-07-07_29")
    const folderMatch = file_path.match(/^([^\/]+)\//);
    const folderPath = folderMatch ? folderMatch[1] : 'unknown-folder';

    // Get photo count in this folder
    const { data: folderPhotos } = await supabase.storage
      .from('cleaning.photos')
      .list(folderPath, {
        limit: 100
      });

    const photoCount = folderPhotos?.filter(file => 
      file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    ).length || 0;

    // Check if notification already sent for this folder (prevent spam)
    const { data: existingNotification } = await supabase
      .from('photo_completion_notifications')
      .select('*')
      .eq('booking_id', booking_id || 0)
      .eq('email_sent', true)
      .single();

    if (existingNotification && photoCount <= 1) {
      console.log('Email already sent for this folder');
      return new Response(JSON.stringify({ message: 'Email already sent' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send notification email ONLY TO SALES for testing
    const emailResponse = await resend.emails.send({
      from: "SN Cleaning <noreply@notifications.sncleaningservices.co.uk>",
      to: ["sales@sncleaningservices.co.uk"], // Only to sales for testing
      reply_to: "sales@sncleaningservices.co.uk",
      subject: `[TEST] New Cleaning Photos Uploaded! 📸 - ${folderPath}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
          <div style="background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 30px 30px 0 30px;">
              <h1 style="color: #18A5A5; margin: 0; font-size: 28px;">SN Cleaning</h1>
              <p style="color: #185166; margin: 5px 0 0 0; font-size: 14px;">Professional Cleaning Services</p>
            </div>

            <div style="padding: 0 30px 30px 30px;">
              <h2 style="color: #18A5A5; margin-bottom: 20px;">🔧 TEST MODE - New Photos Uploaded!</h2>
              
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ This is a test notification sent only to sales team</p>
              </div>
              
              <p>A new photo has been uploaded to the system:</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #18A5A5;">
                <h3 style="margin-top: 0; color: #185166;">Upload Details:</h3>
                <p style="margin: 5px 0;"><strong>Folder:</strong> ${folderPath}</p>
                <p style="margin: 5px 0;"><strong>File:</strong> ${file_path}</p>
                <p style="margin: 5px 0;"><strong>Total Photos in Folder:</strong> ${photoCount}</p>
                ${booking_id ? `<p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking_id}</p>` : ''}
                ${postcode ? `<p style="margin: 5px 0;"><strong>Postcode:</strong> ${postcode}</p>` : ''}
                ${booking_date ? `<p style="margin: 5px 0;"><strong>Date:</strong> ${booking_date}</p>` : ''}
              </div>
              
              <div style="background-color: #18A5A5; color: white; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 15px 0;">View Photos</h3>
                <p style="margin: 0 0 20px 0;">Click the button below to view all photos in this folder:</p>
                <a href="https://account.sncleaningservices.co.uk/photos/${folderPath}" 
                   style="display: inline-block; background-color: white; color: #18A5A5; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px;">
                  📸 View Photos
                </a>
              </div>
              
              <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #bee5eb;">
                <p style="margin: 0; color: #0c5460; font-size: 14px;">
                  <strong>Testing Instructions:</strong><br>
                  • Upload more photos to test the system<br>
                  • Check that the photo gallery page works correctly<br>
                  • Once ready, we can enable customer notifications
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

    console.log("Test notification email sent successfully:", emailResponse);

    // Record the notification if booking_id exists
    if (booking_id) {
      await supabase
        .from('photo_completion_notifications')
        .insert({
          booking_id,
          email_sent: true,
          notification_sent_at: new Date().toISOString()
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test notification sent to sales team',
      email_id: emailResponse.data?.id,
      folder_path: folderPath,
      photo_count: photoCount
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

serve(handler);