import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAccountRequest {
  customer_id: number;
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

    const { customer_id, send_email = true }: CreateAccountRequest = await req.json();

    // Get customer details
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, first_name, last_name, email')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if customer already has an account
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('customer_id', customer.id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Customer already has an account',
        user_id: existingProfile.user_id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

    // Create user account
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: customer.email,
      password: tempPassword,
      user_metadata: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        role: 'guest'
      },
      email_confirm: false
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Wait for triggers to complete, then link customer
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ customer_id: customer.id })
      .eq('user_id', authUser.user.id);

    if (profileError) {
      console.error('Error linking customer to profile:', profileError);
    }

    // Send welcome email if requested
    if (send_email) {
      try {
        await resend.emails.send({
          from: "SN Cleaning Services <admin@notifications.sncleaningservices.co.uk>",
          to: [customer.email],
          subject: "🏠 Welcome to SN Cleaning Services - Your Account is Ready!",
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">Welcome to SN Cleaning Services!</h1>
              </div>
              
              <div style="padding: 40px 30px; background-color: white;">
                <h2 style="color: #4a5568; margin: 0 0 20px 0; font-size: 24px;">Hello ${customer.first_name || 'there'}! 👋</h2>
                
                <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                  We've created your personal account so you can manage your bookings and access all our services.
                </p>

                <div style="background-color: #edf2f7; padding: 25px; border-radius: 8px; border-left: 4px solid #667eea;">
                  <h3 style="color: #4a5568; margin: 0 0 15px 0; font-size: 18px;">🔐 Your Login Details</h3>
                  <p style="margin: 8px 0; color: #4a5568;"><strong>Email:</strong> ${customer.email}</p>
                  <p style="margin: 8px 0; color: #4a5568;"><strong>Temporary Password:</strong></p>
                  <div style="background-color: #4a5568; color: white; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 16px; letter-spacing: 1px; margin: 10px 0;">
                    ${tempPassword}
                  </div>
                  <p style="color: #e53e3e; font-size: 14px; margin: 15px 0 0 0;">
                    ⚠️ <strong>Important:</strong> Please change this password after your first login.
                  </p>
                </div>

                <div style="text-align: center; margin: 35px 0;">
                  <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://your-domain.com'}/auth" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                    🚀 Access Your Account Now
                  </a>
                </div>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: authUser.user.id,
      customer_id: customer.id,
      temp_password: send_email ? tempPassword : null,
      message: 'Account created successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in create-customer-account function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);