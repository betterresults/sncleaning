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

      // Only fetch unpaid PAST bookings (completed cleanings) and unpaid linen orders
      // Do NOT include upcoming bookings as they are not charged until completed
      const [pastBookingsResponse, linenOrdersResponse] = await Promise.all([
        // Past bookings (completed cleanings that haven't been paid)
        supabase
          .from('past_bookings')
          .select('id, date_time, address, postcode, total_cost, cleaning_type, payment_status')
          .eq('customer', profile.customer_id)
          .in('payment_status', ['Unpaid', 'unpaid', 'Not Paid', 'not paid', 'Pending', 'pending'])
          .order('date_time', { ascending: false }),
        
        // Unpaid linen orders
        supabase
          .from('linen_orders')
          .select('id, order_date, total_cost, payment_status, address_id')
          .eq('customer_id', profile.customer_id)
          .in('payment_status', ['unpaid', 'pending'])
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

      // Combine past bookings and linen orders
      const allUnpaidItems = [
        // Past bookings (completed cleanings)
        ...pastBookings.map(booking => ({
          ...booking,
          id: booking.id.toString(),
          total_cost: parseFloat(booking.total_cost?.toString() || '0'),
          cleaning_type: booking.cleaning_type || 'Cleaning Service'
        })),
        // Linen orders
        ...linenOrders.map(order => {
          const orderAddress = addressLookup[order.address_id];
          return {
            id: order.id.toString(),
            date_time: order.order_date,
            address: orderAddress?.address || 'Linen Order',
            postcode: orderAddress?.postcode || '',
            total_cost: parseFloat(order.total_cost?.toString() || '0'),
            cleaning_type: 'Linen Order',
            payment_status: order.payment_status
          };
        })
      ];

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