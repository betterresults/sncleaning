import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting delete user by email function...')
    
    // Create Supabase admin client
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

    // Get request body
    const { email } = await req.json()
    console.log('Looking for user with email:', email)

    if (!email) {
      throw new Error('Email is required')
    }

    // Search for users by email in auth.users
    const { data: users, error: getUsersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUsersError) {
      console.error('Error fetching users:', getUsersError)
      throw getUsersError
    }

    console.log(`Found ${users.users.length} total users, searching for email: ${email}`)
    
    // Find user with the specific email
    const userToDelete = users.users.find(user => user.email === email)
    
    if (!userToDelete) {
      console.log('No user found with that email')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No user found with that email',
          found: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log('Found user to delete:', userToDelete.id, userToDelete.email)

    // Delete the user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id)
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      throw deleteError
    }

    console.log('User deleted successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User with email ${email} has been deleted`,
        found: true,
        deletedUserId: userToDelete.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in delete-user-by-email function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})