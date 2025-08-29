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

      // Fetch unpaid bookings from both current and past bookings
      const [upcomingResponse, pastResponse] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, date_time, address, postcode, total_cost, cleaning_type, payment_status')
          .eq('customer', profile.customer_id)
          .in('payment_status', ['Unpaid', 'unpaid', 'Pending', 'pending'])
          .order('date_time', { ascending: true }),
        
        supabase
          .from('past_bookings')
          .select('id, date_time, address, postcode, total_cost, cleaning_type, payment_status')
          .eq('customer', profile.customer_id)
          .in('payment_status', ['Unpaid', 'unpaid', 'Pending', 'pending'])
          .order('date_time', { ascending: false })
      ]);

      const upcomingBookings = upcomingResponse.data || [];
      const pastBookings = pastResponse.data || [];

      // Combine and format bookings
      const allUnpaidBookings = [
        ...upcomingBookings.map(booking => ({
          ...booking,
          id: booking.id.toString(), // Convert to string
          total_cost: parseFloat(booking.total_cost?.toString() || '0')
        })),
        ...pastBookings.map(booking => ({
          ...booking,
          id: booking.id.toString(), // Convert to string
          total_cost: parseFloat(booking.total_cost?.toString() || '0')
        }))
      ];

      setUnpaidBookings(allUnpaidBookings);
    } catch (error) {
      console.error('Error fetching unpaid bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch unpaid bookings",
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