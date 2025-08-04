import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkCreateRequest {
  customer_ids?: number[];
  send_emails?: boolean;
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

    const { customer_ids, send_emails = true }: BulkCreateRequest = await req.json();

    // Get customers without accounts
    let query = supabaseAdmin
      .from('customers')
      .select(`
        id, first_name, last_name, email,
        profiles!inner(customer_id)
      `)
      .is('profiles.customer_id', null);

    if (customer_ids && customer_ids.length > 0) {
      query = query.in('id', customer_ids);
    }

    const { data: customersWithoutAccounts, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching customers:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results = [];
    const errors = [];

    for (const customer of customersWithoutAccounts || []) {
      try {
        // Generate a temporary password
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
          console.error(`Error creating user for customer ${customer.id}:`, authError);
          errors.push({
            customer_id: customer.id,
            email: customer.email,
            error: authError.message
          });
          continue;
        }

        // Update profile with customer_id
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ customer_id: customer.id })
          .eq('user_id', authUser.user.id);

        if (profileError) {
          console.error(`Error updating profile for customer ${customer.id}:`, profileError);
        }

        // Send password setup email if requested
        if (send_emails) {
          try {
            await resend.emails.send({
              from: "SN Cleaning Services <admin@sncleaningservices.co.uk>",
              to: [customer.email],
              subject: "🏠 Welcome to SN Cleaning Services - Your Account is Ready!",
              html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                  <!-- Header -->
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">Welcome to SN Cleaning Services!</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your trusted cleaning partner</p>
                  </div>
                  
                  <!-- Main Content -->
                  <div style="padding: 40px 30px; background-color: white;">
                    <h2 style="color: #4a5568; margin: 0 0 20px 0; font-size: 24px;">Hello ${customer.first_name || 'there'}! 👋</h2>
                    
                    <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                      We're absolutely delighted to have you as part of our SN Cleaning Services family! We've created your personal account so you can enjoy all the amazing features we offer.
                    </p>

                    <!-- Features Box -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; margin: 30px 0;">
                      <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">✨ What you can do with your account:</h3>
                      <ul style="color: rgba(255,255,255,0.95); margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>📅 View and manage all your bookings</li>
                        <li>📸 Access before & after cleaning photos</li>
                        <li>📋 Update your profile and preferences</li>
                        <li>🏠 Manage multiple addresses</li>
                        <li>📄 Download invoices and receipts</li>
                        <li>⭐ Leave reviews and feedback</li>
                      </ul>
                    </div>

                    <!-- Login Details -->
                    <div style="background-color: #edf2f7; padding: 25px; border-radius: 8px; border-left: 4px solid #667eea;">
                      <h3 style="color: #4a5568; margin: 0 0 15px 0; font-size: 18px;">🔐 Your Login Details</h3>
                      <p style="margin: 8px 0; color: #4a5568;"><strong>Email:</strong> ${customer.email}</p>
                      <p style="margin: 8px 0; color: #4a5568;"><strong>Temporary Password:</strong></p>
                      <div style="background-color: #4a5568; color: white; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 16px; letter-spacing: 1px; margin: 10px 0;">
                        ${tempPassword}
                      </div>
                      <p style="color: #e53e3e; font-size: 14px; margin: 15px 0 0 0;">
                        ⚠️ <strong>Important:</strong> Please change this password after your first login for security.
                      </p>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 35px 0;">
                      <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://your-domain.com'}/auth" 
                         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                        🚀 Access Your Account Now
                      </a>
                    </div>

                    <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                      If you have any questions or need assistance, our friendly team is here to help! Just reply to this email or give us a call.
                    </p>
                    
                    <p style="color: #4a5568; font-size: 16px; margin-top: 25px;">
                      Thank you for choosing SN Cleaning Services! 🌟<br>
                      <span style="color: #667eea; font-weight: 500;">The SN Cleaning Team</span>
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <div style="background-color: #4a5568; padding: 20px; text-align: center; color: #a0aec0; font-size: 14px;">
                    <p style="margin: 0;">SN Cleaning Services - Making your home sparkle! ✨</p>
                    <p style="margin: 5px 0 0 0;">Professional • Reliable • Trusted</p>
                  </div>
                </div>
              `,
            });
          } catch (emailError) {
            console.error(`Error sending email to ${customer.email}:`, emailError);
          }
        }

        results.push({
          customer_id: customer.id,
          email: customer.email,
          user_id: authUser.user.id,
          status: 'success',
          temp_password: send_emails ? tempPassword : null
        });

      } catch (error) {
        console.error(`Unexpected error for customer ${customer.id}:`, error);
        errors.push({
          customer_id: customer.id,
          email: customer.email,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      created_accounts: results.length,
      results,
      errors,
      total_processed: (customersWithoutAccounts || []).length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in bulk-create-customer-accounts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);