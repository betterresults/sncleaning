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

interface NotificationRequest {
  template_id: string;
  recipient_email: string;
  variables: Record<string, string>;
  is_test?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { template_id, recipient_email, variables, is_test = false }: NotificationRequest = await req.json();

    // Get the email template
    const { data: template, error: templateError } = await supabase
      .from('email_notification_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    // Replace variables in subject and content
    let subject = template.subject;
    let htmlContent = template.html_content;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      htmlContent = htmlContent.replace(regex, value);
    });

    // Check if RESEND_API_KEY is available
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    console.log("Sending email to:", recipient_email);
    console.log("Subject:", subject);

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: 'SN Cleaning <noreply@notifications.sncleaningservices.co.uk>',
      to: [recipient_email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email result:", emailResult);

    if (emailResult.error) {
      console.error("Resend error:", emailResult.error);
      throw new Error(`Failed to send email: ${emailResult.error.message}`);
    }

    if (!emailResult.data) {
      throw new Error("No data returned from Resend API");
    }

    // Log the email if not a test
    if (!is_test) {
      await supabase
        .from('notification_logs')
        .insert({
          template_id: template_id,
          recipient_email: recipient_email,
          recipient_type: 'customer', // Default, should be passed in real implementation
          subject: subject,
          content: htmlContent,
          status: 'sent',
          delivery_id: emailResult.data?.id,
          sent_at: new Date().toISOString(),
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message_id: emailResult.data?.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-notification-email function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);