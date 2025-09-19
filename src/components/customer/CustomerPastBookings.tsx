
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, DollarSign, Star, CalendarDays, Filter, X, Grid, ChevronLeft, ChevronRight, User, CreditCard, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BookingCard from '@/components/booking/BookingCard';
import CleaningPhotosViewDialog from './CleaningPhotosViewDialog';
import { AdjustPaymentAmountDialog } from '@/components/payments/AdjustPaymentAmountDialog';
import { CollectPaymentMethodDialog } from '@/components/payments/CollectPaymentMethodDialog';
import EditBookingDialog from './EditBookingDialog';
import { format, isAfter, isBefore, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import CustomerBookingPaymentDialog from '@/components/customer/CustomerBookingPaymentDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useSearchParams } from 'react-router-dom';

interface PastBooking {
  id: number;
  date_time: string;
  address: string;
  postcode: string;
  service_type: string;
  cleaning_type?: string;
  total_hours: number;
  total_cost: string;
  booking_status: string;
  payment_status: string;
  same_day?: string;
  invoice_id?: string;
  invoice_link?: string;
  cleaner?: {
    id: number;
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
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  
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
  const [bulkReviewDialogOpen, setBulkReviewDialogOpen] = useState(false);
  const [excludedFromBulk, setExcludedFromBulk] = useState<Set<number>>(new Set());
  const [additionalFiltersOpen, setAdditionalFiltersOpen] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
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
  const [paymentFilter, setPaymentFilter] = useState(filterParam === 'unpaid' ? 'unpaid' : 'all');
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

  console.log('CustomerPastBookings - Debug info:', {
    userRole,
    customerId,
    selectedCustomerId,
    activeCustomerId
  });

  useEffect(() => {
    if (activeCustomerId) {
      fetchPastBookings();
    } else {
      console.log('CustomerPastBookings - No activeCustomerId, setting empty state');
      setBookings([]);
      setFilteredBookings([]);
      setLoading(false);
    }
  }, [activeCustomerId]);

  // Set default time period to 'all' to show all bookings
  useEffect(() => {
    setTimePeriod('all');
  }, []);

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

  // Update available cleaners when filtered bookings change (excluding cleaner filter)
  useEffect(() => {
    updateAvailableCleaners();
  }, [bookings, timePeriod, dateFrom, dateTo, paymentFilter, ratingFilter, reviews]);

  const fetchPastBookings = async () => {
    if (!activeCustomerId) return;
    
    try {
      setLoading(true);
      console.log('Fetching past bookings for customer:', activeCustomerId);
      
      const { data, error } = await supabase
        .from('past_bookings')
        .select(`
          *,
          cleaner:cleaners(id, first_name, last_name)
        `)
        .eq('customer', activeCustomerId)
        .order('date_time', { ascending: false });

      if (error) {
        console.error('Error fetching past bookings:', error);
        throw error;
      }

      console.log('Raw past bookings data:', data);

      // Process the data to include photo availability
      const bookingsWithPhotos = await Promise.all(
        (data || []).map(async (booking) => {
          const { data: photos } = await supabase
            .from('cleaning_photos')
            .select('id')
            .eq('booking_id', booking.id)
            .limit(1);
          
          return {
            ...booking,
            has_photos: photos && photos.length > 0,
            total_cost: booking.total_cost || '0'
          };
        })
      );

      console.log('Processed bookings with photos:', bookingsWithPhotos);
      setBookings(bookingsWithPhotos);

      // Extract service types
      const types = [...new Set(bookingsWithPhotos.map(b => b.service_type).filter(Boolean))];
      setServiceTypes(types);

      // Fetch review status for all bookings
      if (bookingsWithPhotos.length > 0) {
        const bookingIds = bookingsWithPhotos.map(b => b.id);
        const { data: reviews } = await supabase
          .from('reviews')
          .select('past_booking_id')
          .in('past_booking_id', bookingIds);

        const reviewStatusMap: { [key: number]: boolean } = {};
        reviews?.forEach(review => {
          reviewStatusMap[review.past_booking_id] = true;
        });

        setReviews(reviewStatusMap);
      }
    } catch (error) {
      console.error('Error in fetchPastBookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailableCleaners = () => {
    let filtered = [...bookings];

    // Apply all filters except cleaner filter to determine available cleaners
    if (timePeriod !== 'all') {
      const periodDates = getTimePeriodDates(timePeriod);
      if (periodDates) {
        filtered = filtered.filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= periodDates.from && bookingDate <= periodDates.to;
        });
      }
    }

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

    if (ratingFilter !== 'all') {
      if (ratingFilter === 'reviewed') {
        filtered = filtered.filter(booking => reviews[booking.id]);
      } else if (ratingFilter === 'not-reviewed') {
        filtered = filtered.filter(booking => !reviews[booking.id]);
      }
    }

    // Extract cleaners from the filtered bookings
    const cleanersFromFiltered = filtered
      .map(b => b.cleaner)
      .filter(Boolean)
      .reduce((unique, cleaner) => {
        if (!unique.some(c => c.id === cleaner.id)) {
          unique.push({
            id: cleaner.id,
            name: `${cleaner.first_name} ${cleaner.last_name}`
          });
        }
        return unique;
      }, [] as {id: number, name: string}[]);

    setAvailableCleaners(cleanersFromFiltered);
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
        booking.cleaner?.id === parseInt(cleanerFilter)
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
    const paidBookings = filtered.filter(b => {
      if (!b.payment_status) return false;
      const status = b.payment_status.toLowerCase();
      return status === 'paid' || status === 'confirmed' || status === 'complete' || status === 'completed';
    }).length;
    const reviewedBookings = filtered.filter(b => reviews[b.id]).length;
    const totalPaid = filtered.reduce((sum, booking) => {
      // Only count cost if booking is actually paid
      if (!booking.payment_status) return sum;
      const status = booking.payment_status.toLowerCase();
      const isPaid = status === 'paid' || status === 'confirmed' || status === 'complete' || status === 'completed';
      if (isPaid) {
        const cost = parseFloat(booking.total_cost) || 0;
        return sum + cost;
      }
      return sum;
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
    setTimePeriod('all'); // Changed from 'current-month' to 'all'
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

  const handleBulkReviewSubmit = async () => {
    if (includedBookings.length === 0) {
      toast({
        title: 'No Reviews',
        description: 'No bookings selected for review.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Apply the same rating and comment to all included bookings
      const reviewInserts = includedBookings.map((booking) => ({
        past_booking_id: booking.id,
        rating: reviewRating,
        review_text: reviewText
      }));

      const { error } = await supabase
        .from('reviews')
        .insert(reviewInserts);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Review submitted for ${includedBookings.length} booking${includedBookings.length > 1 ? 's' : ''}!`
      });

      resetBulkReviewState();
      
      // Update reviews state for all submitted bookings
      const newReviews = { ...reviews };
      includedBookings.forEach((booking) => {
        newReviews[booking.id] = true;
      });
      setReviews(newReviews);
      
      fetchPastBookings();
    } catch (error) {
      console.error('Error submitting bulk reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit reviews. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const unreviewedBookings = filteredBookings.filter(booking => !reviews[booking.id]);
  
  // Get bookings included in bulk review (not excluded)
  const includedBookings = unreviewedBookings.filter(booking => !excludedFromBulk.has(booking.id));

  const toggleExcludeFromBulk = (bookingId: number) => {
    setExcludedFromBulk(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const resetBulkReviewState = () => {
    setBulkReviewDialogOpen(false);
    setReviewRating(5);
    setReviewText('');
    setExcludedFromBulk(new Set());
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
    setShowPaymentDialog(true);
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

  // Show message when no customer ID is available
  if (!activeCustomerId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completed Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div>
                <p className="text-lg font-medium">No Customer Account Found</p>
                <p className="text-sm">Please contact support to link your account to view completed bookings.</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
        
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer" 
              onClick={() => setBulkReviewDialogOpen(true)}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Reviews Left</p>
                <p className="text-lg sm:text-2xl font-bold text-[#185166]">{stats.reviewedBookings}/{stats.totalBookings}</p>
                <p className="text-xs text-gray-400">{reviewPercentage}% reviewed</p>
                {stats.totalBookings - stats.reviewedBookings > 0 && (
                  <p className="text-xs text-blue-600 font-medium mt-1">Review in Bulk →</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact One-Line Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Time Period Filter - Left Half */}
            <div className="flex items-center gap-2">
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Current Month
                    </div>
                  </SelectItem>
                  <SelectItem value="last-month">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Last Month
                    </div>
                  </SelectItem>
                  <SelectItem value="last-3-months">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Last 3 Months
                    </div>
                  </SelectItem>
                  <SelectItem value="last-6-months">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Last 6 Months
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      All Time
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Filters - Right Half */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setAdditionalFiltersOpen(!additionalFiltersOpen)}
                className="flex items-center gap-2 justify-center flex-shrink-0"
                size="sm"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Additional Filters</span>
                <span className="xs:hidden sm:hidden">Filters</span>
                {additionalFiltersOpen ? <X className="h-4 w-4" /> : <span className="text-xs">+</span>}
              </Button>
            </div>
          </div>

          {/* Additional Filters Panel */}
          {additionalFiltersOpen && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Cleaner Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    Cleaner
                  </Label>
                  <Select value={cleanerFilter} onValueChange={setCleanerFilter}>
                    <SelectTrigger className="text-sm">
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

                {/* Payment Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4" />
                    Payment
                  </Label>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Review Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4" />
                    Reviews
                  </Label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="not-reviewed">Not reviewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end xs:col-span-2 lg:col-span-1">
                  <Button onClick={clearFilters} variant="outline" size="sm" className="w-full text-sm">
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          )}
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
                          title={`${booking.cleaning_type || booking.service_type} - ${booking.address} - ${new Date(booking.date_time).toLocaleTimeString('en-GB', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}`}
                        >
                          <div className="font-medium">{booking.cleaning_type || booking.service_type}</div>
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
                        cleaning_type: booking.cleaning_type,
                        total_hours: booking.total_hours,
                        total_cost: parseFloat(booking.total_cost) || 0,
                        booking_status: booking.booking_status,
                        payment_status: booking.payment_status,
                        same_day: booking.same_day === 'true',
                        cleaner: booking.cleaner,
                        invoice_id: booking.invoice_id,
                        invoice_link: booking.invoice_link
                      }}
                      type="completed"
                      onReview={(b) => handleReview(booking)}
              onSeePhotos={booking.has_photos ? (b) => handleSeePhotos(booking) : undefined}
              onPaymentAction={booking.payment_status?.toLowerCase().includes('paid') ? undefined : (b) => handlePaymentAction(booking)}
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
        <DialogContent className="sm:max-w-[500px] bg-white border-[#18A5A5]/20 mx-2 sm:mx-4">
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
      
      {/* Bulk Review Dialog */}
      <Dialog open={bulkReviewDialogOpen} onOpenChange={setBulkReviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white border-[#18A5A5]/20 mx-2 sm:mx-4">
          <DialogHeader className="text-center">
            <DialogTitle className="text-[#185166] text-xl sm:text-2xl font-semibold text-center">Review Multiple Bookings</DialogTitle>
            <DialogDescription className="text-gray-600 text-center mt-2">
              Leave the same review for {includedBookings.length > 0 ? `${includedBookings.length} selected bookings` : 'selected bookings'} at once
              {excludedFromBulk.size > 0 && (
                <span className="block text-sm text-orange-600 mt-1">
                  ({excludedFromBulk.size} booking{excludedFromBulk.size !== 1 ? 's' : ''} excluded)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {unreviewedBookings.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
              <p className="text-lg font-medium text-[#185166] mb-2">All Bookings Reviewed!</p>
              <p className="text-gray-600">You have reviewed all your completed bookings.</p>
            </div>
          ) : (
            <div className="space-y-6 py-6">
              {/* Show list of bookings that will be reviewed */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-[#185166] mb-3">
                  Bookings to be reviewed ({includedBookings.length} of {unreviewedBookings.length}):
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {unreviewedBookings.map((booking) => (
                    <div key={booking.id} className={`flex justify-between items-center text-sm p-2 rounded transition-all ${
                      excludedFromBulk.has(booking.id) ? 'bg-red-50 opacity-60' : 'bg-white'
                    }`}>
                      <div className="flex-1">
                        <span className={excludedFromBulk.has(booking.id) ? 'line-through text-gray-500' : ''}>
                          {booking.cleaning_type || booking.service_type} - {booking.cleaner?.first_name} {booking.cleaner?.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">
                          {new Date(booking.date_time).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExcludeFromBulk(booking.id)}
                          className={`h-6 w-6 p-0 rounded-full ${
                            excludedFromBulk.has(booking.id) 
                              ? 'text-green-600 hover:text-green-700 hover:bg-green-100' 
                              : 'text-red-600 hover:text-red-700 hover:bg-red-100'
                          }`}
                          title={excludedFromBulk.has(booking.id) ? 'Include in bulk review' : 'Exclude from bulk review'}
                        >
                          {excludedFromBulk.has(booking.id) ? '↩️' : '✕'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {excludedFromBulk.size > 0 && (
                  <p className="text-xs text-gray-600 mt-2">
                    💡 Excluded bookings can be reviewed individually later
                  </p>
                )}
              </div>

              {/* Single review form for all bookings */}
              <div className="space-y-4">
                <div className="text-center">
                  <Label className="text-[#185166] font-medium text-lg block mb-4">How would you rate these services?</Label>
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
                  <Label htmlFor="bulk-review" className="text-[#185166] font-medium text-center block">General Comments (Optional)</Label>
                  <Textarea
                    id="bulk-review"
                    placeholder="Tell us about your overall experience with our cleaning services..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    className="border-gray-200 focus:border-[#18A5A5] focus:ring-[#18A5A5]/20 text-center"
                  />
                </div>
              </div>
            </div>
          )}
          
          {unreviewedBookings.length > 0 && (
            <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <Button 
                variant="outline" 
                onClick={resetBulkReviewState}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkReviewSubmit}
                disabled={includedBookings.length === 0}
                className="bg-[#18A5A5] hover:bg-[#185166] text-white w-full sm:w-auto order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Review for {includedBookings.length} Booking{includedBookings.length !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      
      <CustomerBookingPaymentDialog
        booking={selectedBookingForPayment ? {
          id: selectedBookingForPayment.id,
          service_type: selectedBookingForPayment.service_type,
          address: selectedBookingForPayment.address,
          date_time: selectedBookingForPayment.date_time,
          total_hours: selectedBookingForPayment.total_hours,
          total_cost: parseFloat(selectedBookingForPayment.total_cost) || 0,
          payment_status: selectedBookingForPayment.payment_status,
          customer: activeCustomerId || 0
        } : null}
        isOpen={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false);
          setSelectedBookingForPayment(null);
        }}
        onSuccess={() => {
          fetchPastBookings();
          setShowPaymentDialog(false);
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
          cleaning_type: selectedBookingForEdit.cleaning_type || selectedBookingForEdit.service_type,
          service_type: selectedBookingForEdit.service_type,
          address: selectedBookingForEdit.address,
          postcode: selectedBookingForEdit.postcode,
          total_hours: selectedBookingForEdit.total_hours,
          cleaning_cost_per_hour: null,
          total_cost: parseFloat(selectedBookingForEdit.total_cost) || 0,
          same_day: selectedBookingForEdit.same_day === 'true',
          access: null,
          first_name: null,
          last_name: null,
          linen_management: false,
          linen_used: []
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
