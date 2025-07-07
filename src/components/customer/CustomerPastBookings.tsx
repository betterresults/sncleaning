import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, DollarSign, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BookingCard from '@/components/booking/BookingCard';

interface PastBooking {
  id: number;
  date_time: string;
  address: string;
  postcode: string;
  service_type: string;
  total_hours: number;
  total_cost: string;
  booking_status: string;
  payment_status: string;
  same_day?: string;
  cleaner?: {
    first_name: string;
    last_name: string;
  } | null;
  cleaner_id?: number;
}

const CustomerPastBookings = () => {
  const { customerId, userRole } = useAuth();
  const { selectedCustomerId } = useAdminCustomer();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<PastBooking[]>([]);
  const [reviews, setReviews] = useState<{[key: number]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalPaid: 0,
    paidBookings: 0,
    reviewedBookings: 0
  });

  // Use selected customer ID if admin is viewing, otherwise use the logged-in user's customer ID
  const activeCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;

  useEffect(() => {
    if (activeCustomerId) {
      fetchPastBookings();
    } else {
      setBookings([]);
      setLoading(false);
    }
  }, [activeCustomerId]);

  const fetchPastBookings = async () => {
    if (!activeCustomerId) return;

    try {
      const { data, error } = await supabase
        .from('past_bookings')
        .select(`
          id,
          date_time,
          address,
          postcode,
          service_type,
          total_hours,
          total_cost,
          booking_status,
          payment_status,
          same_day,
          cleaner
        `)
        .eq('customer', activeCustomerId)
        .order('date_time', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include cleaner info from the cleaner ID
      const bookingsWithCleanerInfo = await Promise.all(
        (data || []).map(async (booking) => {
          if (booking.cleaner) {
            const { data: cleanerData } = await supabase
              .from('cleaners')
              .select('first_name, last_name')
              .eq('id', booking.cleaner)
              .single();
            
            return {
              ...booking,
              cleaner: cleanerData,
              cleaner_id: booking.cleaner
            };
          }
          return {
            ...booking,
            cleaner: null,
            cleaner_id: booking.cleaner
          };
        })
      );
      
      setBookings(bookingsWithCleanerInfo);

      // Fetch reviews for these bookings
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('past_booking_id')
        .in('past_booking_id', bookingsWithCleanerInfo.map(b => b.id));

      const reviewsMap: {[key: number]: boolean} = {};
      reviewData?.forEach(review => {
        reviewsMap[review.past_booking_id] = true;
      });
      setReviews(reviewsMap);

      // Calculate statistics
      const totalBookings = bookingsWithCleanerInfo.length;
      const paidBookings = bookingsWithCleanerInfo.filter(b => 
        b.payment_status && b.payment_status.toLowerCase().includes('paid')
      ).length;
      const reviewedBookings = Object.keys(reviewsMap).length;
      const totalPaid = bookingsWithCleanerInfo.reduce((sum, booking) => {
        const cost = parseFloat(booking.total_cost) || 0;
        return sum + cost;
      }, 0);

      setStats({
        totalBookings,
        totalPaid,
        paidBookings,
        reviewedBookings
      });

    } catch (error) {
      console.error('Error fetching past bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load completed bookings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (booking: PastBooking) => {
    // TODO: Open review dialog
    console.log('Review booking:', booking.id);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          Loading completed bookings...
        </div>
      </div>
    );
  }

  const paymentPercentage = stats.totalBookings > 0 ? Math.round((stats.paidBookings / stats.totalBookings) * 100) : 0;
  const reviewPercentage = stats.totalBookings > 0 ? Math.round((stats.reviewedBookings / stats.totalBookings) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Bookings</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-foreground">£{stats.totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950/20 dark:to-purple-900/20 dark:border-purple-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                <p className="text-2xl font-bold text-foreground">{stats.paidBookings}/{stats.totalBookings}</p>
                <p className="text-xs text-muted-foreground">{paymentPercentage}% paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-950/20 dark:to-yellow-900/20 dark:border-yellow-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reviews Left</p>
                <p className="text-2xl font-bold text-foreground">{stats.reviewedBookings}/{stats.totalBookings}</p>
                <p className="text-xs text-muted-foreground">{reviewPercentage}% reviewed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardContent className="p-6">
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No completed bookings found.</p>
              <p className="text-sm">Your completed bookings will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={{
                    id: booking.id,
                    date_time: booking.date_time,
                    address: booking.address,
                    postcode: booking.postcode,
                    service_type: booking.service_type,
                    total_hours: booking.total_hours,
                    total_cost: parseFloat(booking.total_cost) || 0,
                    booking_status: booking.booking_status,
                    payment_status: booking.payment_status,
                    same_day: booking.same_day === 'true',
                    cleaner: booking.cleaner
                  }}
                  type="completed"
                  onReview={(b) => handleReview(booking)}
                  hasReview={reviews[booking.id] || false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPastBookings;