
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, DollarSign, Star, CalendarDays, Filter, X, Grid, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BookingCard from '@/components/booking/BookingCard';
import CleaningPhotosViewDialog from './CleaningPhotosViewDialog';
import ManualPaymentDialog from '@/components/payments/ManualPaymentDialog';
import { AdjustPaymentAmountDialog } from '@/components/payments/AdjustPaymentAmountDialog';
import { CollectPaymentMethodDialog } from '@/components/payments/CollectPaymentMethodDialog';
import EditBookingDialog from './EditBookingDialog';
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
  photo_folder_name?: string; // Direct reference to photo folder
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
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [adjustPaymentDialogOpen, setAdjustPaymentDialogOpen] = useState(false);
  const [collectPaymentDialogOpen, setCollectPaymentDialogOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<PastBooking | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<PastBooking | null>(null);
  
  // Filter states
  const [timePeriod, setTimePeriod] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;
  const [cleanerFilter, setCleanerFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [availableCleaners, setAvailableCleaners] = useState<{id: number, name: string}[]>([]);
  
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
  }, [bookings, timePeriod, dateFrom, dateTo, cleanerFilter, paymentFilter, ratingFilter, reviews]);

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
          let photoFolderName = '';

          // Get cleaner info
          if (booking.cleaner) {
            const { data: cleanerResult } = await supabase
              .from('cleaners')
              .select('first_name, last_name')
              .eq('id', booking.cleaner)
              .maybeSingle();
            cleanerData = cleanerResult;
          }

          // Get photos info for this booking
          const { data: photosData } = await supabase
            .from('cleaning_photos')
            .select('file_path')
            .eq('booking_id', booking.id)
            .limit(1);
          
          if (photosData && photosData.length > 0) {
            hasPhotos = true;
            // Extract folder name from the file path
            const filePath = photosData[0].file_path;
            const folderMatch = filePath.match(/^([^\/]+)\//);
            if (folderMatch) {
              photoFolderName = folderMatch[1];
            }
          }
            
          return {
            ...booking,
            cleaner: cleanerData,
            cleaner_id: booking.cleaner,
            has_photos: hasPhotos,
            photo_folder_name: photoFolderName
          };
        })
      );
      
      setBookings(bookingsWithCleanerInfo);
      
      // Extract unique service types for filter
      const uniqueServiceTypes = [...new Set(bookingsWithCleanerInfo.map(b => b.service_type).filter(Boolean))];
      setServiceTypes(uniqueServiceTypes);

      // Extract unique cleaners for filter
      const uniqueCleaners = bookingsWithCleanerInfo
        .filter(b => b.cleaner)
        .map(b => ({
          id: b.cleaner_id!,
          name: `${b.cleaner!.first_name} ${b.cleaner!.last_name}`
        }))
        .filter((cleaner, index, self) => 
          index === self.findIndex(c => c.id === cleaner.id)
        );
      setAvailableCleaners(uniqueCleaners);

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

    // Cleaner filter
    if (cleanerFilter !== 'all') {
      filtered = filtered.filter(booking => 
        booking.cleaner_id === parseInt(cleanerFilter)
      );
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      if (paymentFilter === 'paid') {
        filtered = filtered.filter(booking => 
          booking.payment_status && booking.payment_status.toLowerCase().includes('paid')
        );
      } else if (paymentFilter === 'unpaid') {
        filtered = filtered.filter(booking => 
          !booking.payment_status || !booking.payment_status.toLowerCase().includes('paid')
        );
      }
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      if (ratingFilter === 'reviewed') {
        filtered = filtered.filter(booking => reviews[booking.id]);
      } else if (ratingFilter === 'not-reviewed') {
        filtered = filtered.filter(booking => !reviews[booking.id]);
      }
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
    setCleanerFilter('all');
    setPaymentFilter('all');
    setRatingFilter('all');
  };

  const handleReview = (booking: PastBooking) => {
    setSelectedBookingForReview(booking);
    setReviewRating(5);
    setReviewText('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBookingForReview) return;

    // Determine the effective customer ID (either the logged-in customer or selected customer for admin)
    const effectiveCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;
    
    try {
      console.log('Submitting review for booking:', selectedBookingForReview.id);
      console.log('Review data:', { rating: reviewRating, text: reviewText });
      console.log('Effective customer ID:', effectiveCustomerId);

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          past_booking_id: selectedBookingForReview.id,
          rating: reviewRating,
          review_text: reviewText
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Review inserted successfully:', data);

      toast({
        title: 'Success',
        description: 'Your review has been submitted successfully!'
      });

      setReviewDialogOpen(false);
      setSelectedBookingForReview(null);
      setReviewRating(5);
      setReviewText('');
      
      // Update the reviews state to include the new review
      setReviews(prev => ({
        ...prev,
        [selectedBookingForReview.id]: true
      }));
      
      // Refresh reviews to get the latest data
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
    if (!booking.photo_folder_name) {
      toast({
        title: 'Error',
        description: 'Photo folder not found for this booking.',
        variant: 'destructive'
      });
      return;
    }
    
    console.log('Opening photos for folder:', booking.photo_folder_name);
    // Navigate to dedicated photos page with the direct folder reference
    window.open(`/photos/${booking.photo_folder_name}`, '_blank');
  };

  const handlePaymentAction = (booking: PastBooking) => {
    setSelectedBookingForPayment(booking);
    setPaymentDialogOpen(true);
  };

  const handleAdjustPayment = (booking: PastBooking) => {
    setSelectedBookingForPayment(booking);
    setAdjustPaymentDialogOpen(true);
  };

  const handleCollectPayment = (booking: PastBooking) => {
    setSelectedBookingForPayment(booking);
    setCollectPaymentDialogOpen(true);
  };

  const handleEdit = (booking: PastBooking) => {
    setSelectedBookingForEdit(booking);
    setEditDialogOpen(true);
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Statistics Cards - Moved to top */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Completed Bookings</p>
                <p className="text-lg sm:text-2xl font-bold text-[#185166]">{stats.totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Paid</p>
                <p className="text-lg sm:text-2xl font-bold text-[#185166]">£{stats.totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Payment Status</p>
                <p className="text-lg sm:text-2xl font-bold text-[#185166]">{stats.paidBookings}/{stats.totalBookings}</p>
                <p className="text-xs text-gray-400">{paymentPercentage}% paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Reviews Left</p>
                <p className="text-lg sm:text-2xl font-bold text-[#185166]">{stats.reviewedBookings}/{stats.totalBookings}</p>
                <p className="text-xs text-gray-400">{reviewPercentage}% reviewed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Period Filter */}
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

      {/* Filters Card */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="filters" className="border-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium">Additional Filters</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cleaner</Label>
                    <Select value={cleanerFilter} onValueChange={setCleanerFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All cleaners" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All cleaners</SelectItem>
                        {availableCleaners.map((cleaner) => (
                          <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                            {cleaner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All payments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All payments</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Review Status</Label>
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All reviews" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All reviews</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="not-reviewed">Not reviewed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Date From</Label>
                    <Input
                      type="date"
                      value={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Date To</Label>
                    <Input
                      type="date"
                      value={dateTo ? format(dateTo, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setDateTo(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={clearFilters} variant="outline" className="w-full">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#185166] text-center">Your Completed Bookings</h2>
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto w-full">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            onClick={() => setViewMode('cards')}
            className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold w-full ${
              viewMode === 'cards' 
                ? 'bg-[#18A5A5] hover:bg-[#185166] text-white' 
                : 'border-[#18A5A5] text-[#18A5A5] hover:bg-[#18A5A5] hover:text-white'
            }`}
          >
            <Grid className="h-4 w-4" />
            <span>Cards View</span>
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold w-full ${
              viewMode === 'calendar' 
                ? 'bg-[#18A5A5] hover:bg-[#185166] text-white' 
                : 'border-[#18A5A5] text-[#18A5A5] hover:bg-[#18A5A5] hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Calendar View</span>
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {(() => {
                const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                const startDate = new Date(monthStart);
                startDate.setDate(startDate.getDate() - monthStart.getDay());
                
                const days = [];
                const endDate = new Date(monthEnd);
                endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
                
                for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
                  const dayBookings = filteredBookings.filter(booking => {
                    const bookingDate = new Date(booking.date_time);
                    return bookingDate.toDateString() === day.toDateString();
                  });
                  
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  days.push(
                    <div 
                      key={day.toISOString()} 
                      className={`min-h-[80px] p-1 border rounded-lg ${
                        isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                      } ${isToday ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {day.getDate()}
                      </div>
                      {dayBookings.map(booking => (
                        <div
                          key={booking.id}
                          className="text-xs p-1 mb-1 rounded truncate bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer"
                          title={`${booking.service_type} - ${booking.address} - ${new Date(booking.date_time).toLocaleTimeString('en-GB', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}`}
                        >
                          <div className="font-medium">{booking.service_type}</div>
                          <div className="text-[10px] opacity-80">{booking.address}</div>
                        </div>
                      ))}
                    </div>
                  );
                }
                
                return days;
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <Card>
          <CardContent className="p-3 sm:p-6">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p>No completed bookings found.</p>
                <p className="text-sm">Your completed bookings will appear here.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 sm:space-y-4">
                  {filteredBookings.slice((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage).map((booking) => (
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
                      onPaymentAction={(b) => handlePaymentAction(booking)}
                      onEdit={(b) => handleEdit(booking)}
                      hasReview={reviews[booking.id] || false}
                    />
                  ))}
                </div>
                {filteredBookings.length > bookingsPerPage && (
                  <div className="flex justify-center mt-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="border-[#185166] text-[#185166] hover:bg-[#185166] hover:text-white"
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: Math.ceil(filteredBookings.length / bookingsPerPage) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum 
                              ? "bg-[#185166] hover:bg-[#18A5A5] text-white" 
                              : "border-[#185166] text-[#185166] hover:bg-[#185166] hover:text-white"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(filteredBookings.length / bookingsPerPage)))}
                        disabled={currentPage === Math.ceil(filteredBookings.length / bookingsPerPage)}
                        className="border-[#185166] text-[#185166] hover:bg-[#185166] hover:text-white"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}


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
        <DialogContent className="sm:max-w-[500px] bg-white border-[#18A5A5]/20 mx-4">
          <DialogHeader className="text-center">
            <DialogTitle className="text-[#185166] text-xl sm:text-2xl font-semibold text-center">Leave a Review</DialogTitle>
            <DialogDescription className="text-gray-600 text-center mt-2">
              How would you rate <span className="font-semibold text-[#18A5A5]">{selectedBookingForReview?.cleaner?.first_name} {selectedBookingForReview?.cleaner?.last_name}</span>'s cleaning service?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="text-center">
              <Label className="text-[#185166] font-medium text-lg block mb-4">How would you rate this service?</Label>
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`text-4xl sm:text-5xl transition-all duration-200 transform hover:scale-110 ${
                      star <= reviewRating 
                        ? 'text-yellow-400 hover:text-yellow-500 drop-shadow-sm' 
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="text-center">
                <span className="text-lg font-semibold text-[#185166]">
                  {reviewRating === 1 && '😞 Poor'}
                  {reviewRating === 2 && '😐 Fair'}
                  {reviewRating === 3 && '🙂 Good'}
                  {reviewRating === 4 && '😊 Very Good'}
                  {reviewRating === 5 && '🤩 Excellent'}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="review" className="text-[#185166] font-medium text-center block">Additional Comments (Optional)</Label>
              <Textarea
                id="review"
                placeholder="Tell us about your experience with the cleaning service..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                className="border-gray-200 focus:border-[#18A5A5] focus:ring-[#18A5A5]/20 text-center"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={() => setReviewDialogOpen(false)}
              className="border-gray-200 text-gray-600 hover:bg-gray-50 w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              className="bg-[#18A5A5] hover:bg-[#185166] text-white w-full sm:w-auto order-1 sm:order-2"
            >
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ManualPaymentDialog
        booking={selectedBookingForPayment ? {
          id: selectedBookingForPayment.id,
          customer: activeCustomerId || 0,
          first_name: selectedBookingForPayment.cleaner?.first_name || '',
          last_name: selectedBookingForPayment.cleaner?.last_name || '',
          email: '', // Past bookings don't have email in this structure
          total_cost: parseFloat(selectedBookingForPayment.total_cost) || 0,
          payment_status: selectedBookingForPayment.payment_status,
          date_time: selectedBookingForPayment.date_time,
          address: selectedBookingForPayment.address
        } : null}
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
        onSuccess={() => {
          fetchPastBookings();
          setPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
      />

      <AdjustPaymentAmountDialog
        booking={selectedBookingForPayment ? {
          id: selectedBookingForPayment.id,
          first_name: selectedBookingForPayment.cleaner?.first_name || '',
          last_name: selectedBookingForPayment.cleaner?.last_name || '',
          total_cost: parseFloat(selectedBookingForPayment.total_cost) || 0,
          payment_status: selectedBookingForPayment.payment_status
        } : null}
        isOpen={adjustPaymentDialogOpen}
        onClose={() => {
          setAdjustPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
        onSuccess={() => {
          fetchPastBookings();
          setAdjustPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
      />

      <CollectPaymentMethodDialog
        open={collectPaymentDialogOpen}
        onOpenChange={setCollectPaymentDialogOpen}
        customer={{
          id: activeCustomerId || 0,
          first_name: selectedBookingForPayment?.cleaner?.first_name || '',
          last_name: selectedBookingForPayment?.cleaner?.last_name || '',
          email: '' // Past bookings don't have email in this structure
        }}
        booking={selectedBookingForPayment ? {
          id: selectedBookingForPayment.id,
          total_cost: parseFloat(selectedBookingForPayment.total_cost) || 0,
          cleaning_type: selectedBookingForPayment.service_type,
          address: selectedBookingForPayment.address
        } : undefined}
      />

      <EditBookingDialog
        booking={selectedBookingForEdit ? {
          id: selectedBookingForEdit.id,
          date_time: selectedBookingForEdit.date_time,
          additional_details: null,
          property_details: null,
          parking_details: null,
          key_collection: null,
          access: null,
          address: selectedBookingForEdit.address,
          postcode: selectedBookingForEdit.postcode,
          total_hours: selectedBookingForEdit.total_hours,
          cleaning_cost_per_hour: null,
          total_cost: parseFloat(selectedBookingForEdit.total_cost) || 0,
          same_day: selectedBookingForEdit.same_day === 'true'
        } : null}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onBookingUpdated={() => {
          fetchPastBookings();
          setEditDialogOpen(false);
          setSelectedBookingForEdit(null);
        }}
      />
    </div>
  );
};

export default CustomerPastBookings;
