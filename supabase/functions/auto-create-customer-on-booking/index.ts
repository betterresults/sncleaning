import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoCreateCustomerRequest {
  booking_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    address?: string;
    postcode?: string;
  };
  send_welcome_email?: boolean;
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

    const { booking_data, send_welcome_email = true }: AutoCreateCustomerRequest = await req.json();

    // Check if customer already exists
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id, email')
      .eq('email', booking_data.email)
      .single();

    let customer_id: number;
    let isNewCustomer = false;

    if (existingCustomer) {
      customer_id = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          first_name: booking_data.first_name,
          last_name: booking_data.last_name,
          email: booking_data.email,
          phone: booking_data.phone_number,
          client_status: 'New'
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        return new Response(JSON.stringify({ error: customerError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      customer_id = newCustomer.id;
      isNewCustomer = true;
    }

    // Check if user account already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('customer_id', customer_id)
      .single();

    let user_id: string | null = null;
    let tempPassword: string | null = null;

    if (!existingProfile) {
      // Generate a temporary password
      tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

      // Create user account
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: booking_data.email,
        password: tempPassword,
        user_metadata: {
          first_name: booking_data.first_name,
          last_name: booking_data.last_name,
          role: 'guest'
        },
        email_confirm: false
      });

      if (authError) {
        console.error('Error creating user account:', authError);
        // Don't fail the booking if account creation fails
      } else {
        user_id = authUser.user.id;

        // Update profile with customer_id
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ customer_id })
          .eq('user_id', user_id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

        // Send welcome email for new customers with accounts
        if (send_welcome_email && isNewCustomer) {
          try {
            await resend.emails.send({
              from: "SN Cleaning Services <admin@sncleaningservices.co.uk>",
              to: [booking_data.email],
              subject: "Welcome! Your Booking Confirmation & Account Details",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Thank You for Choosing SN Cleaning Services!</h2>
                  <p>Hi ${booking_data.first_name || 'there'},</p>
                  <p>Thank you for booking with us! We've received your cleaning request and we're excited to serve you.</p>
                  
                  <h3>We've Also Created Your Customer Account</h3>
                  <p>You now have access to our customer portal where you can:</p>
                  <ul>
                    <li>View your booking details and history</li>
                    <li>See before/after cleaning photos</li>
                    <li>Manage your profile and addresses</li>
                    <li>Book additional services</li>
                    <li>Download invoices and receipts</li>
                  </ul>

                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
                    <h3 style="margin-top: 0;">Your Login Details:</h3>
                    <p><strong>Email:</strong> ${booking_data.email}</p>
                    <p><strong>Temporary Password:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${tempPassword}</code></p>
                  </div>

                  <p><strong>Important:</strong> Please change your password after your first login for security.</p>
                  
                  <p style="text-align: center;">
                    <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://your-domain.com'}/auth" 
                       style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                      Access Your Account
                    </a>
                  </p>

                  <div style="background-color: #d4edda; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h4 style="margin-top: 0; color: #155724;">What's Next?</h4>
                    <p style="margin-bottom: 0; color: #155724;">We'll contact you soon to confirm your booking details and schedule. You'll receive cleaning photos after each service through your customer portal.</p>
                  </div>

                  <p>If you have any questions about your booking or account, please don't hesitate to contact us.</p>
                  <p>We look forward to providing you with exceptional cleaning services!</p>
                  
                  <p>Best regards,<br>The SN Cleaning Services Team</p>
                  
                  <div style="border-top: 1px solid #dee2e6; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #6c757d;">
                    <p>SN Cleaning Services - Professional Cleaning Solutions</p>
                  </div>
                </div>
              `,
            });
          } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
          }
        }
      }
    } else {
      user_id = existingProfile.user_id;
    }

    return new Response(JSON.stringify({
      success: true,
      customer_id,
      user_id,
      is_new_customer: isNewCustomer,
      account_created: !existingProfile,
      temp_password: tempPassword
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in auto-create-customer-on-booking function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);