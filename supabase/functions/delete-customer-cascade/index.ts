import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteCustomerRequest {
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

    const { customer_id }: DeleteCustomerRequest = await req.json();

    console.log(`Starting cascade delete for customer_id: ${customer_id}`);

    // 1. Get customer details first
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, email, first_name, last_name')
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

    // 2. Check if customer has a user account (profile)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('customer_id', customer_id)
      .maybeSingle();

    // 3. Delete all related data in order (respecting foreign key constraints)
    
    // Delete chat messages for chats involving this customer
    const { data: chats } = await supabaseAdmin
      .from('chats')
      .select('id')
      .eq('customer_id', customer_id);
    
    if (chats && chats.length > 0) {
      const chatIds = chats.map(c => c.id);
      await supabaseAdmin
        .from('chat_messages')
        .delete()
        .in('chat_id', chatIds);
      console.log(`Deleted chat messages for ${chatIds.length} chats`);
    }

    // Delete chats
    const { error: chatsError } = await supabaseAdmin
      .from('chats')
      .delete()
      .eq('customer_id', customer_id);
    if (chatsError) console.error('Error deleting chats:', chatsError);
    else console.log('Deleted chats');

    // Delete payment methods
    const { error: paymentMethodsError } = await supabaseAdmin
      .from('customer_payment_methods')
      .delete()
      .eq('customer_id', customer_id);
    if (paymentMethodsError) console.error('Error deleting payment methods:', paymentMethodsError);
    else console.log('Deleted payment methods');

    // Delete addresses
    const { error: addressesError } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('customer_id', customer_id);
    if (addressesError) console.error('Error deleting addresses:', addressesError);
    else console.log('Deleted addresses');

    // Delete linen inventory
    const { error: linenInventoryError } = await supabaseAdmin
      .from('linen_inventory')
      .delete()
      .eq('customer_id', customer_id);
    if (linenInventoryError) console.error('Error deleting linen inventory:', linenInventoryError);
    else console.log('Deleted linen inventory');

    // Delete linen order items (need to get order IDs first)
    const { data: linenOrders } = await supabaseAdmin
      .from('linen_orders')
      .select('id')
      .eq('customer_id', customer_id);
    
    if (linenOrders && linenOrders.length > 0) {
      const orderIds = linenOrders.map(o => o.id);
      await supabaseAdmin
        .from('linen_order_items')
        .delete()
        .in('order_id', orderIds);
      console.log(`Deleted linen order items for ${orderIds.length} orders`);
    }

    // Delete linen orders
    const { error: linenOrdersError } = await supabaseAdmin
      .from('linen_orders')
      .delete()
      .eq('customer_id', customer_id);
    if (linenOrdersError) console.error('Error deleting linen orders:', linenOrdersError);
    else console.log('Deleted linen orders');

    // Delete customer pricing overrides
    const { error: pricingOverridesError } = await supabaseAdmin
      .from('customer_pricing_overrides')
      .delete()
      .eq('customer_id', customer_id);
    if (pricingOverridesError) console.error('Error deleting pricing overrides:', pricingOverridesError);
    else console.log('Deleted pricing overrides');

    // Delete cleaning photos
    const { error: cleaningPhotosError } = await supabaseAdmin
      .from('cleaning_photos')
      .delete()
      .eq('customer_id', customer_id);
    if (cleaningPhotosError) console.error('Error deleting cleaning photos:', cleaningPhotosError);
    else console.log('Deleted cleaning photos');

    // Delete bookings (upcoming)
    const { error: bookingsError, count: bookingsCount } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('customer', customer_id);
    if (bookingsError) console.error('Error deleting bookings:', bookingsError);
    else console.log(`Deleted ${bookingsCount || 0} bookings`);

    // Delete past bookings
    const { error: pastBookingsError, count: pastBookingsCount } = await supabaseAdmin
      .from('past_bookings')
      .delete()
      .eq('customer', customer_id);
    if (pastBookingsError) console.error('Error deleting past bookings:', pastBookingsError);
    else console.log(`Deleted ${pastBookingsCount || 0} past bookings`);

    // Delete recurring services
    const { error: recurringServicesError } = await supabaseAdmin
      .from('recurring_services')
      .delete()
      .eq('customer', customer_id);
    if (recurringServicesError) console.error('Error deleting recurring services:', recurringServicesError);
    else console.log('Deleted recurring services');

    // 4. Delete the profile if exists (this won't delete the auth user)
    if (profile?.user_id) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('customer_id', customer_id);
      if (profileError) console.error('Error deleting profile:', profileError);
      else console.log('Deleted profile');

      // 5. Delete the auth user
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(profile.user_id);
      if (authError) console.error('Error deleting auth user:', authError);
      else console.log('Deleted auth user');
    }

    // 6. Finally delete the customer record
    const { error: deleteCustomerError } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', customer_id);

    if (deleteCustomerError) {
      console.error('Error deleting customer:', deleteCustomerError);
      return new Response(JSON.stringify({ error: deleteCustomerError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Successfully deleted customer ${customer_id} and all related data`);

    return new Response(JSON.stringify({
      success: true,
      message: `Customer ${customer.first_name} ${customer.last_name} and all related data deleted successfully`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in delete-customer-cascade function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
