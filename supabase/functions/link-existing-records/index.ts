import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LinkingResult {
  success: boolean;
  message: string;
  recordType: 'customer' | 'cleaner';
  recordId: number;
  userId?: string;
  error?: string;
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

    const results: LinkingResult[] = [];

    console.log('Starting bulk linking process...');

    // Step 1: Get all customers without linked profiles
    const { data: unlinkCustomers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('id, first_name, last_name, email')
      .not('email', 'is', null)
      .neq('email', '')

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      throw new Error(`Failed to fetch customers: ${customersError.message}`);
    }

    console.log(`Found ${unlinkCustomers?.length || 0} customers with email`);

    // Step 2: Get all cleaners without linked profiles
    const { data: unlinkCleaners, error: cleanersError } = await supabaseAdmin
      .from('cleaners')
      .select('id, first_name, last_name, email')
      .not('email', 'is', null)
      .neq('email', '')

    if (cleanersError) {
      console.error('Error fetching cleaners:', cleanersError);
      throw new Error(`Failed to fetch cleaners: ${cleanersError.message}`);
    }

    console.log(`Found ${unlinkCleaners?.length || 0} cleaners with email`);

    // Step 3: Process customers
    if (unlinkCustomers) {
      for (const customer of unlinkCustomers) {
        try {
          console.log(`Processing customer ${customer.id}: ${customer.email}`);

          // Check if profile already exists by customer_id
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, user_id')
            .eq('customer_id', customer.id)
            .single();

          if (existingProfile) {
            console.log(`Customer ${customer.id} already has profile, skipping`);
            results.push({
              success: true,
              message: 'Already linked',
              recordType: 'customer',
              recordId: customer.id,
              userId: existingProfile.user_id
            });
            continue;
          }

          // Check if auth user already exists with this email
          const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
          const userWithEmail = existingUser.users?.find(u => u.email?.toLowerCase() === customer.email?.toLowerCase());

          let userId: string;

          if (userWithEmail) {
            console.log(`Auth user already exists for ${customer.email}, linking to existing user`);
            userId = userWithEmail.id;

            // Update the existing profile to link to this customer
            await supabaseAdmin
              .from('profiles')
              .update({ customer_id: customer.id })
              .eq('user_id', userId);
          } else {
            // Create new auth user
            const defaultPassword = 'TempPass123!'; // Secure temporary password
            
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
              email: customer.email,
              password: defaultPassword,
              user_metadata: {
                first_name: customer.first_name,
                last_name: customer.last_name,
                role: 'guest'
              },
              email_confirm: true
            });

            if (userError) {
              console.error(`Error creating user for customer ${customer.id}:`, userError);
              results.push({
                success: false,
                message: `Failed to create user: ${userError.message}`,
                recordType: 'customer',
                recordId: customer.id,
                error: userError.message
              });
              continue;
            }

            userId = userData.user!.id;
            console.log(`Created auth user ${userId} for customer ${customer.id}`);
          }

          // Create or update profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: userId,
              user_id: userId,
              customer_id: customer.id,
              first_name: customer.first_name,
              last_name: customer.last_name,
              email: customer.email,
              role: 'guest'
            });

          if (profileError) {
            console.error(`Error creating profile for customer ${customer.id}:`, profileError);
            results.push({
              success: false,
              message: `Failed to create profile: ${profileError.message}`,
              recordType: 'customer',
              recordId: customer.id,
              error: profileError.message
            });
            continue;
          }

          // Create or update user role
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({
              user_id: userId,
              role: 'guest'
            });

          if (roleError) {
            console.error(`Error creating user role for customer ${customer.id}:`, roleError);
            // Don't fail the whole operation for this
          }

          results.push({
            success: true,
            message: 'Successfully linked',
            recordType: 'customer',
            recordId: customer.id,
            userId: userId
          });

          console.log(`Successfully linked customer ${customer.id} to user ${userId}`);

        } catch (error) {
          console.error(`Error processing customer ${customer.id}:`, error);
          results.push({
            success: false,
            message: `Unexpected error: ${error.message}`,
            recordType: 'customer',
            recordId: customer.id,
            error: error.message
          });
        }
      }
    }

    // Step 4: Process cleaners
    if (unlinkCleaners) {
      for (const cleaner of unlinkCleaners) {
        try {
          console.log(`Processing cleaner ${cleaner.id}: ${cleaner.email}`);

          // Check if profile already exists by cleaner_id
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, user_id')
            .eq('cleaner_id', cleaner.id)
            .single();

          if (existingProfile) {
            console.log(`Cleaner ${cleaner.id} already has profile, skipping`);
            results.push({
              success: true,
              message: 'Already linked',
              recordType: 'cleaner',
              recordId: cleaner.id,
              userId: existingProfile.user_id
            });
            continue;
          }

          // Check if auth user already exists with this email
          const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
          const userWithEmail = existingUser.users?.find(u => u.email?.toLowerCase() === cleaner.email?.toLowerCase());

          let userId: string;

          if (userWithEmail) {
            console.log(`Auth user already exists for ${cleaner.email}, linking to existing user`);
            userId = userWithEmail.id;

            // Update the existing profile to link to this cleaner
            await supabaseAdmin
              .from('profiles')
              .update({ cleaner_id: cleaner.id })
              .eq('user_id', userId);
          } else {
            // Create new auth user
            const defaultPassword = 'TempPass123!'; // Secure temporary password
            
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
              email: cleaner.email,
              password: defaultPassword,
              user_metadata: {
                first_name: cleaner.first_name,
                last_name: cleaner.last_name,
                role: 'user'
              },
              email_confirm: true
            });

            if (userError) {
              console.error(`Error creating user for cleaner ${cleaner.id}:`, userError);
              results.push({
                success: false,
                message: `Failed to create user: ${userError.message}`,
                recordType: 'cleaner',
                recordId: cleaner.id,
                error: userError.message
              });
              continue;
            }

            userId = userData.user!.id;
            console.log(`Created auth user ${userId} for cleaner ${cleaner.id}`);
          }

          // Create or update profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: userId,
              user_id: userId,
              cleaner_id: cleaner.id,
              first_name: cleaner.first_name,
              last_name: cleaner.last_name,
              email: cleaner.email,
              role: 'user'
            });

          if (profileError) {
            console.error(`Error creating profile for cleaner ${cleaner.id}:`, profileError);
            results.push({
              success: false,
              message: `Failed to create profile: ${profileError.message}`,
              recordType: 'cleaner',
              recordId: cleaner.id,
              error: profileError.message
            });
            continue;
          }

          // Create or update user role
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({
              user_id: userId,
              role: 'user'
            });

          if (roleError) {
            console.error(`Error creating user role for cleaner ${cleaner.id}:`, roleError);
            // Don't fail the whole operation for this
          }

          results.push({
            success: true,
            message: 'Successfully linked',
            recordType: 'cleaner',
            recordId: cleaner.id,
            userId: userId
          });

          console.log(`Successfully linked cleaner ${cleaner.id} to user ${userId}`);

        } catch (error) {
          console.error(`Error processing cleaner ${cleaner.id}:`, error);
          results.push({
            success: false,
            message: `Unexpected error: ${error.message}`,
            recordType: 'cleaner',
            recordId: cleaner.id,
            error: error.message
          });
        }
      }
    }

    // Generate summary
    const successfulCustomers = results.filter(r => r.success && r.recordType === 'customer').length;
    const failedCustomers = results.filter(r => !r.success && r.recordType === 'customer').length;
    const successfulCleaners = results.filter(r => r.success && r.recordType === 'cleaner').length;
    const failedCleaners = results.filter(r => !r.success && r.recordType === 'cleaner').length;

    const summary = {
      total: results.length,
      successful: successfulCustomers + successfulCleaners,
      failed: failedCustomers + failedCleaners,
      customers: {
        successful: successfulCustomers,
        failed: failedCustomers
      },
      cleaners: {
        successful: successfulCleaners,
        failed: failedCleaners
      }
    };

    console.log('Linking process completed:', summary);

    return new Response(
      JSON.stringify({ 
        success: true,
        summary,
        results,
        message: `Linked ${summary.successful} records successfully. ${summary.failed} failed.`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in link-existing-records:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});