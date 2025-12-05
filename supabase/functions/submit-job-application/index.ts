import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobApplicationRequest {
  fullName: string;
  email: string;
  phone: string;
  hasExperience: boolean;
  experienceDetails?: string;
  cleaningTypes: string[];
  hasDrivingLicense: boolean;
  hasVehicle: boolean;
  vehicleType?: string;
  availableDays: number;
  availableHours: number;
  cvFilePath?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received job application request");
    const data: JobApplicationRequest = await req.json();
    console.log("Application data:", JSON.stringify(data, null, 2));

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build application details for email
    const cleaningTypesText = data.cleaningTypes.length > 0 
      ? data.cleaningTypes.join(', ') 
      : 'Not specified';

    const applicationDetails = `
      <h2>New Job Application</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Full Name:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.fullName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.phone}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Has Cleaning Experience:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.hasExperience ? 'Yes' : 'No'}</td>
        </tr>
        ${data.hasExperience && data.experienceDetails ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Experience Details:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.experienceDetails}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Cleaning Types:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${cleaningTypesText}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Has Driving License:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.hasDrivingLicense ? 'Yes' : 'No'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Has Vehicle for Work:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.hasVehicle ? 'Yes' : 'No'}</td>
        </tr>
        ${data.hasVehicle && data.vehicleType ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Vehicle Type:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.vehicleType}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Available Days per Week:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.availableDays} days</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Available Hours per Day:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.availableHours} hours</td>
        </tr>
        ${data.cvFilePath ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>CV Uploaded:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">Yes - <a href="${supabaseUrl}/storage/v1/object/public/job-applications/${data.cvFilePath}">Download CV</a></td>
        </tr>
        ` : ''}
      </table>
    `;

    // Send confirmation email to applicant
    console.log("Sending confirmation email to applicant:", data.email);
    const applicantEmailResult = await resend.emails.send({
      from: 'SN Cleaning <noreply@notifications.sncleaningservices.co.uk>',
      to: [data.email],
      subject: 'Thank you for your application - SN Cleaning Services',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Thank You for Your Application!</h1>
          <p>Dear ${data.fullName},</p>
          <p>We have received your application to join our cleaning team at SN Cleaning Services.</p>
          <p>Our team will review your application and get back to you as soon as possible. If your skills and availability match our current requirements, we will contact you to arrange an interview.</p>
          <p>In the meantime, if you have any questions, please don't hesitate to contact us.</p>
          <br>
          <p>Best regards,</p>
          <p><strong>SN Cleaning Services Team</strong></p>
          <p>Email: sales@sncleaningservices.co.uk</p>
        </div>
      `,
    });

    console.log("Applicant email result:", JSON.stringify(applicantEmailResult, null, 2));

    // Send notification email to staff
    console.log("Sending notification to staff");
    const staffEmailResult = await resend.emails.send({
      from: 'SN Cleaning <noreply@notifications.sncleaningservices.co.uk>',
      to: ['sales@sncleaningservices.co.uk'],
      subject: `New Job Application - ${data.fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${applicationDetails}
        </div>
      `,
    });

    console.log("Staff email result:", JSON.stringify(staffEmailResult, null, 2));

    if (applicantEmailResult.error || staffEmailResult.error) {
      const errorMsg = applicantEmailResult.error?.message || staffEmailResult.error?.message;
      console.error("Email error:", errorMsg);
      throw new Error(`Failed to send email: ${errorMsg}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Application submitted successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in submit-job-application function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
