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
        setLoading(false);
        return;
      }

      try {
        // Get customer profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('customer_id')
          .eq('user_id', user.id)
          .single();

        if (!profile?.customer_id) {
          setLoading(false);
          return;
        }

        // Check if customer has any linen inventory
        const { data: inventory } = await supabase
          .from('linen_inventory')
          .select('id')
          .eq('customer_id', profile.customer_id)
          .limit(1);

        // Check if customer has any linen orders
        const { data: orders } = await supabase
          .from('linen_orders')
          .select('id')
          .eq('customer_id', profile.customer_id)
          .limit(1);

        // Check if customer has any bookings with linen management enabled
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('customer', profile.customer_id)
          .eq('linen_management', true)
          .limit(1);

        // Check past bookings as well
        const { data: pastBookings } = await supabase
          .from('past_bookings')
          .select('id')
          .eq('customer', profile.customer_id)
          .not('linen_used', 'is', null)
          .limit(1);

        const hasAccess = 
          (inventory && inventory.length > 0) ||
          (orders && orders.length > 0) ||
          (bookings && bookings.length > 0) ||
          (pastBookings && pastBookings.length > 0);

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