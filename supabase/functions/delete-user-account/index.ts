import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  customer_id?: number;
  email?: string;
  user_id?: string;
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

    const { customer_id, email, user_id }: DeleteUserRequest = await req.json();

    console.log('Delete request received:', { customer_id, email, user_id });

    let userIdToDelete = user_id;

    // If user_id looks like a numeric string, it might be a business customer ID
    if (user_id && !user_id.includes('-') && /^\d+$/.test(user_id)) {
      console.log('Detected business customer ID:', user_id);
      // This is likely a business customer, not an auth user
      // Delete the customer record directly
      const { error: customerDeleteError } = await supabaseAdmin
        .from('customers')
        .delete()
        .eq('id', parseInt(user_id));

      if (customerDeleteError) {
        console.error('Error deleting customer:', customerDeleteError);
        return new Response(JSON.stringify({ error: customerDeleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Customer deleted successfully',
        deleted_customer_id: user_id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If we have customer_id, find the linked user
    if (customer_id && !userIdToDelete) {
      console.log('Looking up user by customer_id:', customer_id);
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('customer_id', customer_id)
        .maybeSingle();
      
      if (profile) {
        userIdToDelete = profile.user_id;
        console.log('Found user_id for customer:', userIdToDelete);
      }
    }

    // If we have email, find the user by email
    if (email && !userIdToDelete) {
      console.log('Looking up user by email:', email);
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();
      
      if (profile) {
        userIdToDelete = profile.user_id;
        console.log('Found user_id for email:', userIdToDelete);
      }
    }

    if (!userIdToDelete) {
      console.log('No user found to delete');
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Deleting auth user:', userIdToDelete);
    // Delete the user from auth (this should cascade to profiles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Clean up any remaining profile entries (just in case)
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userIdToDelete);

    console.log('Auth user deleted successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'User account deleted successfully',
      deleted_user_id: userIdToDelete
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in delete-user-account function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);