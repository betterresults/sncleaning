import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useCustomerLinenAccess = () => {
  const [hasLinenAccess, setHasLinenAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkLinenAccess = async () => {
      if (!user) {
        console.log('No user found for linen access check');
        setLoading(false);
        return;
      }

      try {
        console.log('Checking linen access for user:', user.id);
        
        // Get customer profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('customer_id')
          .eq('user_id', user.id)
          .single();

        console.log('Customer profile:', profile, 'Error:', profileError);

        if (!profile?.customer_id) {
          console.log('No customer_id found in profile');
          setLoading(false);
          return;
        }

        console.log('Checking linen access for customer_id:', profile.customer_id);

        // Check if customer has any linen inventory
        const { data: inventory, error: inventoryError } = await supabase
          .from('linen_inventory')
          .select('id')
          .eq('customer_id', profile.customer_id)
          .limit(1);

        console.log('Linen inventory check:', inventory, 'Error:', inventoryError);

        // Check if customer has any linen orders
        const { data: orders, error: ordersError } = await supabase
          .from('linen_orders')
          .select('id')
          .eq('customer_id', profile.customer_id)
          .limit(1);

        console.log('Linen orders check:', orders, 'Error:', ordersError);

        // Check if customer has any bookings with linen management enabled
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id')
          .eq('customer', profile.customer_id)
          .eq('linen_management', true)
          .limit(1);

        console.log('Bookings with linen management check:', bookings, 'Error:', bookingsError);

        // Check past bookings as well
        const { data: pastBookings, error: pastBookingsError } = await supabase
          .from('past_bookings')
          .select('id')
          .eq('customer', profile.customer_id)
          .not('linen_used', 'is', null)
          .limit(1);

        console.log('Past bookings with linen check:', pastBookings, 'Error:', pastBookingsError);

        // Also check for any bookings with non-null linen_used field  
        const { data: bookingsWithLinen, error: bookingsWithLinenError } = await supabase
          .from('bookings')
          .select('id')
          .eq('customer', profile.customer_id)
          .not('linen_used', 'is', null)
          .limit(1);

        console.log('Bookings with linen_used check:', bookingsWithLinen, 'Error:', bookingsWithLinenError);

        const hasAccess = 
          (inventory && inventory.length > 0) ||
          (orders && orders.length > 0) ||
          (bookings && bookings.length > 0) ||
          (pastBookings && pastBookings.length > 0) ||
          (bookingsWithLinen && bookingsWithLinen.length > 0);

        console.log('Final linen access decision:', hasAccess);
        setHasLinenAccess(hasAccess);
      } catch (error) {
        console.error('Error checking linen access:', error);
        setHasLinenAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkLinenAccess();
  }, [user]);

  return { hasLinenAccess, loading };
};