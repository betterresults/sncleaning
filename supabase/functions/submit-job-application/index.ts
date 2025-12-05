import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobApplicationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hasExperience: string;
  experienceDetails: string;
  cleaningTypes: string[];
  hasDrivingLicense: string;
  hasVehicle: string;
  vehicleType: string;
  hoursPerWeek: string;
  daysPerWeek: string;
  additionalInfo: string;
  cvUrl: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const application: JobApplicationRequest = await req.json();
    console.log("Received job application from:", application.email);

    const cleaningTypeLabels: Record<string, string> = {
      domestic: "Domestic Cleaning",
      deep: "Deep Cleaning",
      regular: "Regular Cleaning",
      "one-off": "One-Off Cleaning",
      "end-of-tenancy": "End of Tenancy",
      airbnb: "Airbnb / Short-let Turnovers",
    };

    const cleaningTypesFormatted = application.cleaningTypes
      .map(t => cleaningTypeLabels[t] || t)
      .join(", ");

    // Send confirmation email to applicant
    const applicantEmailResponse = await resend.emails.send({
      from: "SN Cleaning Services <noreply@sncleaningservices.co.uk>",
      to: [application.email],
      subject: "We've Received Your Application - SN Cleaning Services",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Application Received!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Dear ${application.firstName},</p>
            
            <p>Thank you for your interest in joining the SN Cleaning Services team!</p>
            
            <p>We've received your application and our team will review it carefully. If your profile matches our current requirements, we'll be in touch to discuss the next steps.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #667eea;">What happens next?</h3>
              <ul style="padding-left: 20px;">
                <li>Our team will review your application</li>
                <li>If suitable, we'll contact you for an interview</li>
                <li>We'll discuss available opportunities in your area</li>
              </ul>
            </div>
            
            <p>If you have any questions in the meantime, please don't hesitate to contact us.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The SN Cleaning Services Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} SN Cleaning Services. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Applicant confirmation email sent:", applicantEmailResponse);

    // Send notification email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "SN Cleaning Services <noreply@sncleaningservices.co.uk>",
      to: ["sales@sncleaningservices.co.uk"],
      subject: `New Job Application: ${application.firstName} ${application.lastName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1a1a2e; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📋 New Job Application</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1a1a2e; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
              ${application.firstName} ${application.lastName}
            </h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Email:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  <a href="mailto:${application.email}">${application.email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  <a href="tel:${application.phone}">${application.phone}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Has Experience:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  ${application.hasExperience === 'yes' ? '✅ Yes' : '❌ No (eager to learn)'}
                </td>
              </tr>
              ${application.hasExperience === 'yes' && application.experienceDetails ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; vertical-align: top;">Experience Details:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${application.experienceDetails}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Cleaning Types:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${cleaningTypesFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Driving License:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  ${application.hasDrivingLicense === 'yes' ? '✅ Yes' : '❌ No'}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Has Vehicle:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  ${application.hasVehicle === 'yes' ? `✅ Yes (${application.vehicleType || 'Not specified'})` : '❌ No'}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Hours/Week:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${application.hoursPerWeek} hours</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Days/Week:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${application.daysPerWeek} day(s)</td>
              </tr>
              ${application.additionalInfo ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; vertical-align: top;">Additional Info:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${application.additionalInfo}</td>
              </tr>
              ` : ''}
              ${application.cvUrl ? `
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">CV:</td>
                <td style="padding: 10px 0;">
                  <a href="${application.cvUrl}" style="background: #667eea; color: white; padding: 8px 16px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    📄 Download CV
                  </a>
                </td>
              </tr>
              ` : ''}
            </table>
            
            <p style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-radius: 5px; font-size: 14px;">
              <strong>Submitted:</strong> ${new Date().toLocaleString('en-GB', { 
                dateStyle: 'full', 
                timeStyle: 'short',
                timeZone: 'Europe/London'
              })}
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Admin notification email sent:", adminEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Application submitted successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in submit-job-application function:", error);
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
