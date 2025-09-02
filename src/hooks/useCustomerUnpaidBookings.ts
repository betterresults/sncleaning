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
    if (!user) {
      console.log('No user found, skipping unpaid bookings fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching unpaid bookings for user:', user.id);

      // Get customer profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      console.log('Customer profile result:', { profile, profileError });

      if (profileError || !profile?.customer_id) {
        console.log('No customer_id found in profile, user might be admin or cleaner');
        setUnpaidBookings([]);
        setLoading(false);
        return;
      }

      console.log('Fetching data for customer_id:', profile.customer_id);

      // Fetch BOTH unpaid completed bookings AND unpaid linen orders
      const [pastBookingsResponse, linenOrdersResponse] = await Promise.all([
        // Past bookings (completed cleanings that haven't been paid)
        supabase
          .from('past_bookings')
          .select('id, date_time, address, postcode, total_cost, cleaning_type, payment_status')
          .eq('customer', profile.customer_id)
          .or('payment_status.ilike.%unpaid%,payment_status.ilike.%collecting%,payment_status.ilike.%outstanding%,payment_status.ilike.%pending%,payment_status.is.null')
          .order('date_time', { ascending: false }),
        
        // Unpaid linen orders  
        supabase
          .from('linen_orders')
          .select('id, order_date, total_cost, payment_status, address_id')
          .eq('customer_id', profile.customer_id)
          .neq('payment_status', 'paid')
          .order('order_date', { ascending: false })
      ]);

      console.log('Database responses:', {
        pastBookings: { data: pastBookingsResponse.data, error: pastBookingsResponse.error },
        linenOrders: { data: linenOrdersResponse.data, error: linenOrdersResponse.error }
      });

      if (pastBookingsResponse.error) {
        console.error('Past bookings error:', pastBookingsResponse.error);
      }
      
      if (linenOrdersResponse.error) {
        console.error('Linen orders error:', linenOrdersResponse.error);
      }

      const pastBookings = pastBookingsResponse.data || [];
      const linenOrders = linenOrdersResponse.data || [];

      console.log('Raw data:', {
        pastBookingsCount: pastBookings.length,
        linenOrdersCount: linenOrders.length,
        pastBookings: pastBookings,
        linenOrders: linenOrders
      });

      // Get addresses for linen orders
      const addressIds = linenOrders.map(order => order.address_id).filter(Boolean);
      let addresses = [];
      let addressesError = null;
      
      if (addressIds.length > 0) {
        const { data: addressesData, error: addressesFetchError } = await supabase
          .from('addresses')
          .select('id, address, postcode')
          .in('id', addressIds);
          
        addresses = addressesData || [];
        addressesError = addressesFetchError;
        
        if (addressesError) {
          console.error('Addresses fetch error:', addressesError);
        }
      }

      console.log('Addresses data:', addresses);

      // Create address lookup
      const addressLookup = addresses.reduce((acc, addr) => {
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

      console.log('Final unpaid items:', {
        totalCount: allUnpaidItems.length,
        pastBookingsProcessed: allUnpaidItems.filter(i => i.source === 'past_booking').length,
        linenOrdersProcessed: allUnpaidItems.filter(i => i.source === 'linen_order').length,
        items: allUnpaidItems
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