import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetupAccountRequest {
  customer_id: number;
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

    const { customer_id }: SetupAccountRequest = await req.json();

    console.log(`Setting up account for customer_id: ${customer_id}`);

    // Get customer details
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, first_name, last_name, email')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      console.error('Customer not found:', customerError);
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found customer: ${customer.email}`);

    // Check if customer already has an account
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('customer_id', customer.id)
      .maybeSingle();

    if (existingProfile) {
      console.log(`Customer already has account: ${existingProfile.user_id}`);
      return new Response(JSON.stringify({ 
        alreadyHasAccount: true,
        email: customer.email
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
      email_confirm: true // Auto-confirm so they can set password immediately
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Created user: ${authUser.user.id}`);

    // Wait for triggers to complete, then link customer
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ customer_id: customer.id })
      .eq('user_id', authUser.user.id);

    if (profileError) {
      console.error('Error linking customer to profile:', profileError);
    }

    // Generate a session token for the user so they can set their password
    // We'll use generateLink to create a recovery token, then sign them in
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: customer.email,
    });

    if (signInError) {
      console.error('Error generating magic link:', signInError);
      // Fallback: just tell them to use forgot password
      return new Response(JSON.stringify({
        accountCreated: true,
        email: customer.email,
        needsPasswordReset: true
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract the token from the magic link properties
    const accessToken = signInData.properties?.hashed_token;
    
    // Actually sign them in with the temp password to get a valid session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: customer.email,
      password: tempPassword
    });

    if (sessionError) {
      console.error('Error signing in user:', sessionError);
      return new Response(JSON.stringify({
        accountCreated: true,
        email: customer.email,
        needsPasswordReset: true
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Generated session for user to set password`);

    return new Response(JSON.stringify({
      accountCreated: true,
      email: customer.email,
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in setup-customer-account function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
