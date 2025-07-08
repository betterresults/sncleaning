
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, DollarSign, Star, CalendarDays, Filter, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BookingCard from '@/components/booking/BookingCard';
import CleaningPhotosViewDialog from './CleaningPhotosViewDialog';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
  has_photos?: boolean;
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
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<PastBooking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  
  // Filter states
  const [timePeriod, setTimePeriod] = useState('current-month');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
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

  const getTimePeriodDates = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'current-month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case 'last-3-months':
        const last3Months = subMonths(now, 3);
        return { from: startOfMonth(last3Months), to: today };
      case 'last-6-months':
        const last6Months = subMonths(now, 6);
        return { from: startOfMonth(last6Months), to: today };
      default:
        return null;
    }
  };

  // Filter bookings when filters change
  useEffect(() => {
    applyFilters();
  }, [bookings, timePeriod, dateFrom, dateTo]);

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
      
      // Transform the data to include cleaner info and check for photos
      const bookingsWithCleanerInfo = await Promise.all(
        (data || []).map(async (booking) => {
          let cleanerData = null;
          let hasPhotos = false;

          // Get cleaner info
          if (booking.cleaner) {
            const { data: cleanerResult } = await supabase
              .from('cleaners')
              .select('first_name, last_name')
              .eq('id', booking.cleaner)
              .single();
            cleanerData = cleanerResult;
          }

          // Check if photos exist for this booking
          const { data: photosData } = await supabase
            .from('cleaning_photos')
            .select('id')
            .eq('booking_id', booking.id)
            .limit(1);
          
          hasPhotos = photosData && photosData.length > 0;
            
          return {
            ...booking,
            cleaner: cleanerData,
            cleaner_id: booking.cleaner,
            has_photos: hasPhotos
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

    // Apply time period filter first
    if (timePeriod !== 'all') {
      const periodDates = getTimePeriodDates(timePeriod);
      if (periodDates) {
        filtered = filtered.filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= periodDates.from && bookingDate <= periodDates.to;
        });
      }
    }

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

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setTimePeriod('current-month');
  };

  const handleReview = (booking: PastBooking) => {
    setSelectedBookingForReview(booking);
    setReviewRating(5);
    setReviewText('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBookingForReview) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          past_booking_id: selectedBookingForReview.id,
          rating: reviewRating,
          review_text: reviewText
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your review has been submitted successfully!'
      });

      setReviewDialogOpen(false);
      setSelectedBookingForReview(null);
      
      // Refresh reviews
      fetchPastBookings();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive'
      });
    }
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
      {/* Time Period Filter */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="period" className="border-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-medium">
                    {timePeriod === 'current-month' && 'Current Month'}
                    {timePeriod === 'last-month' && 'Last Month'}
                    {timePeriod === 'last-3-months' && 'Last 3 Months'}
                    {timePeriod === 'last-6-months' && 'Last 6 Months'}
                    {timePeriod === 'all' && 'All Time'}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant={timePeriod === 'current-month' ? 'default' : 'outline'}
                    onClick={() => setTimePeriod('current-month')}
                    className="w-full justify-start"
                  >
                    Current Month
                  </Button>
                  <Button
                    variant={timePeriod === 'last-month' ? 'default' : 'outline'}
                    onClick={() => setTimePeriod('last-month')}
                    className="w-full justify-start"
                  >
                    Last Month
                  </Button>
                  <Button
                    variant={timePeriod === 'last-3-months' ? 'default' : 'outline'}
                    onClick={() => setTimePeriod('last-3-months')}
                    className="w-full justify-start"
                  >
                    Last 3 Months
                  </Button>
                  <Button
                    variant={timePeriod === 'last-6-months' ? 'default' : 'outline'}
                    onClick={() => setTimePeriod('last-6-months')}
                    className="w-full justify-start"
                  >
                    Last 6 Months
                  </Button>
                  <Button
                    variant={timePeriod === 'all' ? 'default' : 'outline'}
                    onClick={() => setTimePeriod('all')}
                    className="w-full justify-start"
                  >
                    All Time
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

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
                  onSeePhotos={booking.has_photos ? (b) => handleSeePhotos(booking) : undefined}
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-[#18A5A5]/20">
          <DialogHeader>
            <DialogTitle className="text-[#185166] text-xl font-semibold">Leave a Review</DialogTitle>
            <DialogDescription className="text-gray-600">
              How would you rate {selectedBookingForReview?.cleaner?.first_name} {selectedBookingForReview?.cleaner?.last_name}'s cleaning service?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label htmlFor="rating" className="text-[#185166] font-medium">How would you rate this service?</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= reviewRating 
                        ? 'text-[#18A5A5] hover:text-[#18A5A5]' 
                        : 'text-gray-300 hover:text-[#18A5A5]'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {reviewRating === 1 && 'Poor'}
                  {reviewRating === 2 && 'Fair'}
                  {reviewRating === 3 && 'Good'}
                  {reviewRating === 4 && 'Very Good'}
                  {reviewRating === 5 && 'Excellent'}
                </span>
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="review" className="text-[#185166] font-medium">Additional Comments (Optional)</Label>
              <Textarea
                id="review"
                placeholder="Tell us about your experience with the cleaning service..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                className="border-gray-200 focus:border-[#18A5A5] focus:ring-[#18A5A5]/20"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setReviewDialogOpen(false)}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              className="bg-[#18A5A5] hover:bg-[#185166] text-white"
            >
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerPastBookings;
