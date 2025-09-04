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
    console.log('Starting cleaner account creation process');
    
    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasResendKey: !!resendKey
    });
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { cleaner_id, send_email = true }: CreateCleanerAccountRequest = await req.json();
    console.log('Request data:', { cleaner_id, send_email });

    // Get cleaner details
    console.log('Fetching cleaner details for ID:', cleaner_id);
    const { data: cleaner, error: cleanerError } = await supabaseAdmin
      .from('cleaners')
      .select('*')
      .eq('id', cleaner_id)
      .single();

    if (cleanerError || !cleaner) {
      console.error('Cleaner not found:', cleanerError);
      return new Response(JSON.stringify({ error: 'Cleaner not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Found cleaner:', { id: cleaner.id, email: cleaner.email });

    // Check if account already exists
    console.log('Checking for existing profile');
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('cleaner_id', cleaner_id)
      .single();

    if (existingProfile) {
      console.log('Account already exists for cleaner');
      return new Response(JSON.stringify({ 
        error: 'Account already exists for this cleaner',
        user_id: existingProfile.user_id 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate a temporary password
    console.log('Generating temporary password');
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

    // Create user account
    console.log('Creating user account in Supabase Auth');
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
    
    console.log('User created successfully:', authUser.user.id);

    // Update profile with cleaner_id
    console.log('Updating profile with cleaner_id');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ cleaner_id: cleaner_id })
      .eq('user_id', authUser.user.id);

    if (profileError) {
      console.error('Error updating profile for cleaner:', profileError);
    }

    // Send welcome email if requested
    if (send_email) {
      console.log('Attempting to send welcome email');
      if (!resendKey) {
        console.warn('RESEND_API_KEY not configured, skipping email');
      } else {
        try {
        await resend.emails.send({
          from: "SN Cleaning Services <admin@sncleaningservices.co.uk>",
          to: [cleaner.email],
          subject: "🎉 Welcome to the SN Cleaning Team - You're Official!",
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">Welcome to Our Team!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">SN Cleaning Services Family</p>
              </div>
              
              <!-- Main Content -->
              <div style="padding: 40px 30px; background-color: white;">
                <h2 style="color: #4a5568; margin: 0 0 20px 0; font-size: 24px;">Hello ${cleaner.first_name || 'there'}! 🌟</h2>
                
                <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                  We're absolutely thrilled to welcome you to the SN Cleaning Services team! You're now part of a family that takes pride in making homes sparkle and customers smile.
                </p>

                <!-- Features Box -->
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 25px; border-radius: 12px; margin: 30px 0;">
                  <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">🚀 Your Cleaner Portal Features:</h3>
                  <ul style="color: rgba(255,255,255,0.95); margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li>📅 View all your upcoming assignments</li>
                    <li>📸 Upload before & after photos easily</li>
                    <li>💰 Track your earnings and payments</li>
                    <li>📱 Chat with customers and office</li>
                    <li>⏰ Clock in/out for jobs</li>
                    <li>📋 Update your profile and availability</li>
                  </ul>
                </div>

                <!-- Login Details -->
                <div style="background-color: #d4edda; padding: 25px; border-radius: 8px; border-left: 4px solid #28a745;">
                  <h3 style="color: #155724; margin: 0 0 15px 0; font-size: 18px;">🔐 Your Access Details</h3>
                  <p style="margin: 8px 0; color: #155724;"><strong>Email:</strong> ${cleaner.email}</p>
                  <p style="margin: 8px 0; color: #155724;"><strong>Temporary Password:</strong></p>
                  <div style="background-color: #155724; color: white; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 16px; letter-spacing: 1px; margin: 10px 0;">
                    ${tempPassword}
                  </div>
                  <p style="color: #721c24; font-size: 14px; margin: 15px 0 0 0;">
                    ⚠️ <strong>Important:</strong> Please change this password after your first login.
                  </p>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://your-domain.com'}/auth" 
                     style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);">
                    🎯 Start Your Journey
                  </a>
                </div>

                <!-- Welcome Message -->
                <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
                  <h4 style="color: #856404; margin: 0 0 10px 0;">💪 You're Part of Something Special!</h4>
                  <p style="color: #856404; margin: 0; line-height: 1.6;">
                    As a member of our team, you represent excellence in cleaning services. We believe in supporting each other and delivering amazing results together!
                  </p>
                </div>

                <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                  Our management team is here to support you every step of the way. Don't hesitate to reach out if you have any questions or need assistance.
                </p>
                
                <p style="color: #4a5568; font-size: 16px; margin-top: 25px;">
                  Welcome aboard! Let's make homes shine together! ✨<br>
                  <span style="color: #28a745; font-weight: 500;">The SN Cleaning Management Team</span>
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #4a5568; padding: 20px; text-align: center; color: #a0aec0; font-size: 14px;">
                <p style="margin: 0;">SN Cleaning Services - Excellence in Every Clean! 🏆</p>
                <p style="margin: 5px 0 0 0;">Professional • Reliable • Team-Focused</p>
              </div>
            </div>
          `,
        });
        } catch (emailError) {
          console.error('Error sending email to cleaner:', emailError);
          // Don't fail the entire operation if email fails
        }
      }
    }
    
    console.log('Cleaner account creation completed successfully');
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
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);