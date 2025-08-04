import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateCleanerAccountRequest {
  cleaner_id: number;
  send_email?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { cleaner_id, send_email = true }: CreateCleanerAccountRequest = await req.json();

    // Get cleaner details
    const { data: cleaner, error: cleanerError } = await supabaseAdmin
      .from('cleaners')
      .select('*')
      .eq('id', cleaner_id)
      .single();

    if (cleanerError || !cleaner) {
      return new Response(JSON.stringify({ error: 'Cleaner not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if account already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('cleaner_id', cleaner_id)
      .single();

    if (existingProfile) {
      return new Response(JSON.stringify({ 
        error: 'Account already exists for this cleaner',
        user_id: existingProfile.user_id 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

    // Create user account
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleaner.email,
      password: tempPassword,
      user_metadata: {
        first_name: cleaner.first_name,
        last_name: cleaner.last_name,
        role: 'user'
      },
      email_confirm: false
    });

    if (authError) {
      console.error('Error creating user for cleaner:', authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update profile with cleaner_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ cleaner_id: cleaner_id })
      .eq('user_id', authUser.user.id);

    if (profileError) {
      console.error('Error updating profile for cleaner:', profileError);
    }

    // Send welcome email if requested
    if (send_email) {
      try {
        await resend.emails.send({
          from: "SN Cleaning Services <admin@sncleaningservices.co.uk>",
          to: [cleaner.email],
          subject: "Welcome to SN Cleaning Services - Your Account Details",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to the SN Cleaning Services Team!</h2>
              <p>Hi ${cleaner.first_name || 'there'},</p>
              <p>Welcome to our team! We've created your cleaner account where you can:</p>
              <ul>
                <li>View your upcoming bookings</li>
                <li>Upload cleaning photos</li>
                <li>Track your earnings</li>
                <li>Update your profile</li>
                <li>Communicate with customers and office</li>
              </ul>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Your Login Details:</h3>
                <p><strong>Email:</strong> ${cleaner.email}</p>
                <p><strong>Temporary Password:</strong> <code style="background-color: #e0e0e0; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
              </div>
              <p><strong>Important:</strong> Please change your password after your first login for security.</p>
              <p>
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://your-domain.com'}/auth" 
                   style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Login to Your Account
                </a>
              </p>
              <p>We're excited to have you on our team!</p>
              <p>Best regards,<br>SN Cleaning Services Management</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Error sending email to cleaner:', emailError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      cleaner_id,
      user_id: authUser.user.id,
      email: cleaner.email,
      temp_password: send_email ? tempPassword : null
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in auto-create-cleaner-account function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);