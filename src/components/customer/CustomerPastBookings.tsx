
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, DollarSign, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BookingCard from '@/components/booking/BookingCard';
import CleaningPhotosViewDialog from './CleaningPhotosViewDialog';
import BookingFilters from '@/components/cleaner/BookingFilters';

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
  const [filteredBookings, setFilteredBookings] = useState<PastBooking[]>([]);
  const [reviews, setReviews] = useState<{[key: number]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<PastBooking | null>(null);
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);
  
  // Filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [customerSearch, setCustomerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  
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
      setFilteredBookings([]);
      setLoading(false);
    }
  }, [activeCustomerId]);

  // Filter bookings when filters change
  useEffect(() => {
    applyFilters();
  }, [bookings, dateFrom, dateTo, customerSearch, statusFilter, serviceTypeFilter]);

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
      
      // Extract unique service types for filter
      const uniqueServiceTypes = [...new Set(bookingsWithCleanerInfo.map(b => b.service_type).filter(Boolean))];
      setServiceTypes(uniqueServiceTypes);

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

  const applyFilters = () => {
    let filtered = [...bookings];

    // Date filters
    if (dateFrom) {
      filtered = filtered.filter(booking => 
        new Date(booking.date_time) >= dateFrom
      );
    }
    if (dateTo) {
      filtered = filtered.filter(booking => 
        new Date(booking.date_time) <= dateTo
      );
    }

    // Customer search (for admin use)
    if (customerSearch && userRole === 'admin') {
      filtered = filtered.filter(booking =>
        booking.address?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        booking.postcode?.toLowerCase().includes(customerSearch.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(booking => 
        booking.booking_status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Service type filter
    if (serviceTypeFilter && serviceTypeFilter !== 'all') {
      filtered = filtered.filter(booking => 
        booking.service_type === serviceTypeFilter
      );
    }

    setFilteredBookings(filtered);

    // Calculate statistics for filtered results
    const totalBookings = filtered.length;
    const paidBookings = filtered.filter(b => 
      b.payment_status && b.payment_status.toLowerCase().includes('paid')
    ).length;
    const reviewedBookings = filtered.filter(b => reviews[b.id]).length;
    const totalPaid = filtered.reduce((sum, booking) => {
      const cost = parseFloat(booking.total_cost) || 0;
      return sum + cost;
    }, 0);

    setStats({
      totalBookings,
      totalPaid,
      paidBookings,
      reviewedBookings
    });
  };
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setCustomerSearch('');
    setStatusFilter('all');
    setServiceTypeFilter('all');
  };

  const handleReview = (booking: PastBooking) => {
    // TODO: Open review dialog
    console.log('Review booking:', booking.id);
  };

  const handleSeePhotos = (booking: PastBooking) => {
    setSelectedBooking(booking);
    setPhotosDialogOpen(true);
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
      {/* Filters */}
      <BookingFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        customerSearch={customerSearch}
        statusFilter={statusFilter}
        serviceTypeFilter={serviceTypeFilter}
        serviceTypes={serviceTypes}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onCustomerSearchChange={setCustomerSearch}
        onStatusFilterChange={setStatusFilter}
        onServiceTypeFilterChange={setServiceTypeFilter}
        onClearFilters={clearFilters}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Bookings</p>
                <p className="text-2xl font-bold text-[#185166]">{stats.totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold text-[#185166]">£{stats.totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Status</p>
                <p className="text-2xl font-bold text-[#185166]">{stats.paidBookings}/{stats.totalBookings}</p>
                <p className="text-xs text-gray-400">{paymentPercentage}% paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Reviews Left</p>
                <p className="text-2xl font-bold text-[#185166]">{stats.reviewedBookings}/{stats.totalBookings}</p>
                <p className="text-xs text-gray-400">{reviewPercentage}% reviewed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardContent className="p-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No completed bookings found.</p>
              <p className="text-sm">Your completed bookings will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
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
                  onSeePhotos={(b) => handleSeePhotos(booking)}
                  hasReview={reviews[booking.id] || false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBooking && (
        <CleaningPhotosViewDialog
          open={photosDialogOpen}
          onOpenChange={setPhotosDialogOpen}
          booking={{
            id: selectedBooking.id,
            postcode: selectedBooking.postcode,
            date_time: selectedBooking.date_time,
            address: selectedBooking.address,
            service_type: selectedBooking.service_type
          }}
        />
      )}
    </div>
  );
};

export default CustomerPastBookings;
