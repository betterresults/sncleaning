import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to get role display name
function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'user': return 'Cleaner';
    case 'sales_agent': return 'Sales Agent';
    case 'guest': return 'Customer';
    default: return role;
  }
}

// Helper function to generate a secure temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specialChars = '!@#$%&*';
  let password = '';
  
  // Generate 10 random characters
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add a special character and number to ensure password meets requirements
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  password += Math.floor(Math.random() * 10);
  
  return password;
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

    // SECURITY LAYER 1: Verify the request is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authentication provided' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create client with the user's auth token to verify their identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Get the request body - password is now optional
    const { email, password: providedPassword, firstName, lastName, role, phone } = await req.json()

    // Generate temporary password if not provided
    const password = providedPassword || generateTempPassword();
    console.log('Password will be auto-generated:', !providedPassword);

    // SECURITY LAYER 2: If trying to create an admin, verify the requesting user is an admin
    if (role === 'admin') {
      console.log('Admin role requested, verifying requesting user...')
      
      // Get the current user from the auth token
      const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
      
      if (userError || !user) {
        console.error('Failed to get requesting user:', userError)
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Invalid authentication' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Check if the requesting user has admin role
      const { data: userRole, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (roleError || !userRole || userRole.role !== 'admin') {
        console.error('Requesting user is not an admin:', { userId: user.id, userRole: userRole?.role })
        return new Response(
          JSON.stringify({ 
            error: 'Forbidden - Only existing administrators can create admin accounts',
            details: 'Admin accounts can only be created by verified administrators for security purposes.'
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Admin role verification successful for user:', user.id)
    }

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
      } else {
        // Create new cleaner record
        const { data: newCleaner, error: cleanerError } = await supabaseAdmin
          .from('cleaners')
          .insert({
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            email: email,
            phone: phone ? parseInt(phone.replace(/\D/g, '')) : null,
            hourly_rate: 15,
            presentage_rate: 70
          })
          .select('id')
          .single();

        if (cleanerError) {
          console.error('Error creating cleaner:', cleanerError);
        } else {
          cleanerId = newCleaner.id;
          console.log('Created new cleaner:', cleanerId);
        }
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

    // Send invitation email for non-customer roles (staff members)
    if (role !== 'guest') {
      console.log('Sending staff invitation email to:', email);
      
      // Get the staff_invitation template
      const { data: template, error: templateError } = await supabaseAdmin
        .from('email_notification_templates')
        .select('id')
        .eq('name', 'staff_invitation')
        .eq('is_active', true)
        .single();

      if (templateError) {
        console.error('Error fetching invitation template:', templateError);
      } else if (template) {
        // Determine the login URL based on role
        const baseUrl = 'https://account.sncleaningservices.co.uk';
        const loginUrl = `${baseUrl}/auth`;
        
        // Call send-notification-email function
        const emailResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              template_id: template.id,
              recipient_email: email,
              variables: {
                first_name: firstName,
                last_name: lastName,
                email: email,
                temp_password: password,
                role_display: getRoleDisplayName(role),
                login_url: loginUrl
              }
            })
          }
        );

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('Error sending invitation email:', errorText);
        } else {
          console.log('Invitation email sent successfully to:', email);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData.user,
        message: 'User created successfully',
        emailSent: role !== 'guest'
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
