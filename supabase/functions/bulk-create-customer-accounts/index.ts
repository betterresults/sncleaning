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
              subject: "Your Account Has Been Created - Set Your Password",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Welcome to SN Cleaning Services!</h2>
                  <p>Hi ${customer.first_name || 'there'},</p>
                  <p>We've created an account for you to access our customer portal where you can:</p>
                  <ul>
                    <li>View your booking history</li>
                    <li>See cleaning photos</li>
                    <li>Manage your profile</li>
                    <li>Book new services</li>
                  </ul>
                  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Your Login Details:</h3>
                    <p><strong>Email:</strong> ${customer.email}</p>
                    <p><strong>Temporary Password:</strong> <code style="background-color: #e0e0e0; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
                  </div>
                  <p><strong>Important:</strong> Please change your password after your first login for security.</p>
                  <p>
                    <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://your-domain.com'}/auth" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      Login to Your Account
                    </a>
                  </p>
                  <p>If you have any questions, please don't hesitate to contact us.</p>
                  <p>Best regards,<br>SN Cleaning Services Team</p>
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