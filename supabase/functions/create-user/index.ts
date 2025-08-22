
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the request body
    const { email, password, firstName, lastName, role } = await req.json()

    console.log('Creating user with role:', role)

    // Create the user using admin client
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role
      },
      email_confirm: true // Auto-confirm email for admin-created users
    })

    if (userError) {
      console.error('Error creating user:', userError)
      return new Response(
        JSON.stringify({ error: userError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User created successfully:', userData.user?.id)

    let customerId = null;
    let cleanerId = null;

    // If creating a customer (guest role), handle customer record
    if (role === 'guest') {
      // Check if customer already exists
      const { data: existingCustomer } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('email', email)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        console.log('Found existing customer:', customerId);
      } else {
        // Create new customer record
        const { data: newCustomer, error: customerError } = await supabaseAdmin
          .from('customers')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: email,
            client_status: 'New'
          })
          .select('id')
          .single();

        if (customerError) {
          console.error('Error creating customer:', customerError);
        } else {
          customerId = newCustomer.id;
          console.log('Created new customer:', customerId);
        }
      }
    }

    // If creating a cleaner (user role), handle cleaner record
    if (role === 'user') {
      // Check if cleaner already exists
      const { data: existingCleaner } = await supabaseAdmin
        .from('cleaners')
        .select('id')
        .eq('email', email)
        .single();

      if (existingCleaner) {
        cleanerId = existingCleaner.id;
        console.log('Found existing cleaner:', cleanerId);
      }
    }

    // Now create the profile entry with proper linking
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userData.user!.id,
        user_id: userData.user!.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        role: role,
        customer_id: customerId,
        cleaner_id: cleanerId
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Continue anyway, as the user was created successfully
    }

    // Create the user role entry
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userData.user!.id,
        role: role
      })

    if (roleError) {
      console.error('Error creating user role:', roleError)
      // Continue anyway, as the user was created successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData.user,
        message: 'User created successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
