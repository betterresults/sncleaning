import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UnpaidBooking {
  id: string;
  date_time: string;
  address: string;
  postcode: string;
  total_cost: number;
  cleaning_type: string;
  payment_status: string;
  source?: string;
}

export const useCustomerUnpaidBookings = () => {
  const [unpaidBookings, setUnpaidBookings] = useState<UnpaidBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUnpaidBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get customer profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.customer_id) return;

      // Fetch BOTH unpaid completed bookings AND unpaid linen orders
      const [pastBookingsResponse, linenOrdersResponse] = await Promise.all([
        // Past bookings (completed cleanings that haven't been paid)
        supabase
          .from('past_bookings')
          .select('id, date_time, address, postcode, total_cost, cleaning_type, payment_status')
          .eq('customer', profile.customer_id)
          .in('payment_status', ['Unpaid', 'unpaid', 'Not Paid', 'not paid', 'Pending', 'pending', null])
          .order('date_time', { ascending: false }),
        
        // Unpaid linen orders  
        supabase
          .from('linen_orders')
          .select('id, order_date, total_cost, payment_status, address_id')
          .eq('customer_id', profile.customer_id)
          .in('payment_status', ['unpaid', 'pending', null])
          .order('order_date', { ascending: false })
      ]);

      const pastBookings = pastBookingsResponse.data || [];
      const linenOrders = linenOrdersResponse.data || [];

      // Get addresses for linen orders
      const addressIds = linenOrders.map(order => order.address_id).filter(Boolean);
      const { data: addresses } = addressIds.length > 0 ? await supabase
        .from('addresses')
        .select('id, address, postcode')
        .in('id', addressIds) : { data: [] };

      // Create address lookup
      const addressLookup = (addresses || []).reduce((acc, addr) => {
        acc[addr.id] = addr;
        return acc;
      }, {} as Record<string, any>);

      // Combine BOTH past bookings AND linen orders into one array
      const allUnpaidItems = [
        // Include ALL past bookings (completed cleanings that are unpaid)
        ...pastBookings.map(booking => ({
          id: `booking_${booking.id}`,
          date_time: booking.date_time,
          address: booking.address || '',
          postcode: booking.postcode || '',
          total_cost: parseFloat(booking.total_cost?.toString() || '0'),
          cleaning_type: booking.cleaning_type || 'Cleaning Service',
          payment_status: booking.payment_status,
          source: 'past_booking'
        })),
        // Include ALL unpaid linen orders
        ...linenOrders.map(order => {
          const orderAddress = addressLookup[order.address_id];
          return {
            id: `linen_${order.id}`,
            date_time: order.order_date,
            address: orderAddress?.address || 'Linen Order',
            postcode: orderAddress?.postcode || '',
            total_cost: parseFloat(order.total_cost?.toString() || '0'),
            cleaning_type: 'Linen Order',
            payment_status: order.payment_status,
            source: 'linen_order'
          };
        })
      ];

      console.log('Outstanding payments breakdown:', {
        pastBookingsCount: pastBookings.length,
        linenOrdersCount: linenOrders.length,
        totalUnpaidItems: allUnpaidItems.length,
        pastBookings: pastBookings.map(b => ({ id: b.id, cost: b.total_cost, status: b.payment_status })),
        linenOrders: linenOrders.map(o => ({ id: o.id, cost: o.total_cost, status: o.payment_status }))
      });

      setUnpaidBookings(allUnpaidItems);
    } catch (error) {
      console.error('Error fetching unpaid bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch outstanding payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaidBookings();
  }, [user]);

  return {
    unpaidBookings,
    loading,
    refetch: fetchUnpaidBookings
  };
};