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

// Helper function to cascade delete customer data
async function cascadeDeleteCustomer(supabaseAdmin: any, customerId: number) {
  console.log(`Starting cascade delete for customer_id: ${customerId}`);

  // Delete chat messages for chats involving this customer
  const { data: chats } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('customer_id', customerId);
  
  if (chats && chats.length > 0) {
    const chatIds = chats.map((c: any) => c.id);
    await supabaseAdmin
      .from('chat_messages')
      .delete()
      .in('chat_id', chatIds);
    console.log(`Deleted chat messages for ${chatIds.length} chats`);
  }

  // Delete chats
  await supabaseAdmin.from('chats').delete().eq('customer_id', customerId);
  console.log('Deleted chats');

  // Delete payment methods
  await supabaseAdmin.from('customer_payment_methods').delete().eq('customer_id', customerId);
  console.log('Deleted payment methods');

  // Delete customer pricing overrides
  await supabaseAdmin.from('customer_pricing_overrides').delete().eq('customer_id', customerId);
  console.log('Deleted pricing overrides');

  // Delete addresses
  await supabaseAdmin.from('addresses').delete().eq('customer_id', customerId);
  console.log('Deleted addresses');

  // Delete linen inventory
  await supabaseAdmin.from('linen_inventory').delete().eq('customer_id', customerId);
  console.log('Deleted linen inventory');

  // Delete linen order items (need to get order IDs first)
  const { data: linenOrders } = await supabaseAdmin
    .from('linen_orders')
    .select('id')
    .eq('customer_id', customerId);
  
  if (linenOrders && linenOrders.length > 0) {
    const orderIds = linenOrders.map((o: any) => o.id);
    await supabaseAdmin.from('linen_order_items').delete().in('order_id', orderIds);
    console.log(`Deleted linen order items for ${orderIds.length} orders`);
  }

  // Delete linen orders
  await supabaseAdmin.from('linen_orders').delete().eq('customer_id', customerId);
  console.log('Deleted linen orders');

  // Delete cleaning photos
  await supabaseAdmin.from('cleaning_photos').delete().eq('customer_id', customerId);
  console.log('Deleted cleaning photos');

  // Delete bookings (upcoming)
  await supabaseAdmin.from('bookings').delete().eq('customer', customerId);
  console.log('Deleted bookings');

  // Delete past bookings
  await supabaseAdmin.from('past_bookings').delete().eq('customer', customerId);
  console.log('Deleted past bookings');

  // Delete recurring services
  await supabaseAdmin.from('recurring_services').delete().eq('customer', customerId);
  console.log('Deleted recurring services');

  // Delete the customer record
  const { error: deleteCustomerError } = await supabaseAdmin
    .from('customers')
    .delete()
    .eq('id', customerId);

  if (deleteCustomerError) {
    throw deleteCustomerError;
  }

  console.log(`Successfully deleted customer ${customerId} and all related data`);
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
      const businessCustomerId = parseInt(user_id);

      // Check if this customer has a linked user account
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('customer_id', businessCustomerId)
        .maybeSingle();

      // Cascade delete all customer data
      await cascadeDeleteCustomer(supabaseAdmin, businessCustomerId);

      // If there was a linked auth user, delete that too
      if (profile?.user_id) {
        console.log('Deleting linked auth user:', profile.user_id);
        await supabaseAdmin.from('profiles').delete().eq('user_id', profile.user_id);
        await supabaseAdmin.auth.admin.deleteUser(profile.user_id);
        console.log('Auth user deleted');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Customer and all related data deleted successfully',
        deleted_customer_id: user_id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If we have customer_id, find the linked user and cascade delete
    if (customer_id) {
      console.log('Processing customer_id:', customer_id);
      
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('customer_id', customer_id)
        .maybeSingle();
      
      // Cascade delete all customer data
      await cascadeDeleteCustomer(supabaseAdmin, customer_id);

      // If there was a linked auth user, delete that too
      if (profile?.user_id) {
        console.log('Deleting linked auth user:', profile.user_id);
        await supabaseAdmin.from('profiles').delete().eq('user_id', profile.user_id);
        await supabaseAdmin.auth.admin.deleteUser(profile.user_id);
        console.log('Auth user deleted');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Customer and all related data deleted successfully',
        deleted_customer_id: customer_id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle auth user deletion by email
    if (email && !userIdToDelete) {
      console.log('Looking up user by email:', email);
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_id, customer_id')
        .eq('email', email)
        .maybeSingle();
      
      if (profile) {
        userIdToDelete = profile.user_id;
        
        // If this auth user is linked to a customer, cascade delete that too
        if (profile.customer_id) {
          await cascadeDeleteCustomer(supabaseAdmin, profile.customer_id);
        }
      }
    }

    // Handle pure auth user deletion
    if (userIdToDelete && userIdToDelete.includes('-')) {
      console.log('Deleting auth user:', userIdToDelete);
      
      // Check if this user has a linked customer
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('customer_id')
        .eq('user_id', userIdToDelete)
        .maybeSingle();
      
      if (profile?.customer_id) {
        await cascadeDeleteCustomer(supabaseAdmin, profile.customer_id);
      }

      // Delete the profile
      await supabaseAdmin.from('profiles').delete().eq('user_id', userIdToDelete);
      
      // Delete the auth user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

      if (deleteError) {
        console.error('Error deleting auth user:', deleteError);
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('Auth user deleted successfully');

      return new Response(JSON.stringify({
        success: true,
        message: 'User account deleted successfully',
        deleted_user_id: userIdToDelete
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('No user found to delete');
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
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
