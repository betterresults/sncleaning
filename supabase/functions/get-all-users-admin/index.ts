import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Fetching all users and customers with admin privileges...')

    // Fetch all profiles (bypasses RLS)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    console.log('Profiles fetched:', profiles?.length || 0)

    // Fetch all user roles (bypasses RLS)
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*')

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      throw rolesError
    }

    console.log('User roles fetched:', userRoles?.length || 0)

    // Fetch all customers from business table (bypasses RLS)
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('*')

    if (customersError) {
      console.error('Error fetching customers:', customersError)
      throw customersError
    }

    console.log('Customers fetched:', customers?.length || 0)

    // Create role mapping
    const roleMap = new Map()
    if (userRoles) {
      userRoles.forEach(role => {
        roleMap.set(role.user_id, role.role)
      })
    }

    // Process auth users with role information
    const authUsers = profiles?.map(profile => {
      const userRole = roleMap.get(profile.user_id) || profile.role || 'guest'
      
      return {
        id: profile.user_id,
        email: profile.email || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        role: userRole,
        cleaner_id: profile.cleaner_id,
        customer_id: profile.customer_id,
        assigned_sources: profile.assigned_sources || [],
        type: 'auth_user'
      }
    }) || []

    // Process business customers
    const businessCustomers = customers?.map(customer => ({
      id: customer.id.toString(), // string id for UI keying
      business_id: customer.id,   // numeric id for DB updates
      email: customer.email || '',
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      role: 'guest', // considered customer in auth terms
      phone: customer.phone || '',
      address: customer.address || '',
      postcode: customer.postcode || '',
      client_status: customer.client_status || '',
      client_type: customer.clent_type || null,
      type: 'business_customer'
    })) || []

    console.log('Processed auth users:', authUsers.length)
    console.log('Processed business customers:', businessCustomers.length)

    return new Response(
      JSON.stringify({ 
        success: true, 
        authUsers: authUsers,
        businessCustomers: businessCustomers,
        total: authUsers.length + businessCustomers.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in get-all-users-admin:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        authUsers: [],
        businessCustomers: [],
        total: 0 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})