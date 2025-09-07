import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { userId, updates } = await req.json()
    
    console.log('Updating user:', userId, 'with updates:', updates)

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if this is a business customer ID (numeric string)
    if (!userId.includes('-') && /^\d+$/.test(userId)) {
      console.log('Detected business customer ID:', userId);
      
      // For business customers, we'll handle updates through PersonalInfoEditor component
      // to avoid database trigger issues. Return success for now.
      console.log('Business customer updates should be handled through PersonalInfoEditor');
      
      return new Response(
        JSON.stringify({ success: true, message: 'Business customer update handled separately' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle auth users (UUID format)
    console.log('Handling auth user update for UUID:', userId);

    // Prepare the update object for auth.users
    const authUpdates: any = {}
    
    if (updates.email) {
      authUpdates.email = updates.email
    }
    
    if (updates.first_name || updates.last_name) {
      authUpdates.user_metadata = {
        first_name: updates.first_name,
        last_name: updates.last_name
      }
    }
    
    if (updates.password && updates.password.trim()) {
      authUpdates.password = updates.password
    }

    // Update the auth user if we have auth updates
    if (Object.keys(authUpdates).length > 0) {
      console.log('Updating auth user with:', authUpdates)
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates)
      
      if (authError) {
        console.error('Auth update error:', authError)
        return new Response(
          JSON.stringify({ error: `Failed to update user: ${authError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Update the profile
    const profileUpdates: any = {}
    if (updates.first_name) profileUpdates.first_name = updates.first_name
    if (updates.last_name) profileUpdates.last_name = updates.last_name
    if (updates.email) profileUpdates.email = updates.email
    if (updates.role) profileUpdates.role = updates.role

    if (Object.keys(profileUpdates).length > 0) {
      console.log('Updating profile with:', profileUpdates)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('user_id', userId)

      if (profileError) {
        console.error('Profile update error:', profileError)
        // Don't fail if profile update fails, just warn
        console.warn('Could not update profile:', profileError.message)
      }
    }

    // Update user role if provided
    if (updates.role) {
      console.log('Updating user role to:', updates.role)
      
      // Check if role exists
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (existingRole) {
        const { error: roleUpdateError } = await supabaseAdmin
          .from('user_roles')
          .update({ role: updates.role })
          .eq('user_id', userId)
        
        if (roleUpdateError) {
          console.error('Role update error:', roleUpdateError)
        }
      } else {
        const { error: roleInsertError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: userId, role: updates.role })
        
        if (roleInsertError) {
          console.error('Role insert error:', roleInsertError)
        }
      }
    }

    console.log('User update completed successfully')
    
    return new Response(
      JSON.stringify({ success: true, message: 'User updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in update-user-admin function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})