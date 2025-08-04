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

    // Send password reset email using Supabase's built-in system (much more reliable)
    if (send_email) {
      try {
        console.log(`Sending password reset email to ${customer.email}`);
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(customer.email, {
          redirectTo: `${req.headers.get('origin') || 'http://localhost:3000'}/auth`
        });
        
        if (resetError) {
          console.error('Error sending reset email:', resetError);
        } else {
          console.log('Reset email sent successfully');
        }
      } catch (emailError) {
        console.error('Error with built-in email system:', emailError);
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