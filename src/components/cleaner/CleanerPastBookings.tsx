import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { CalendarDays, MapPin, User, Banknote, Search, Filter, X, Upload } from 'lucide-react';
import CleaningPhotosUploadDialog from './CleaningPhotosUploadDialog';

interface PastBooking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  cleaning_type: string;
  total_cost: string;
  cleaner_pay: number;
  payment_status: string;
  booking_status: string;
  customer?: number;
  cleaner?: number;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  customerSearch: string;
  timePeriod: string;
}

const CleanerPastBookings = () => {
  const { cleanerId, userRole, loading: authLoading } = useAuth();
  
  // Safely get admin cleaner context - it might not be available in all cases
  let selectedCleanerId = null;
  try {
    const adminContext = useAdminCleaner();
    selectedCleanerId = adminContext.selectedCleanerId;
  } catch (error) {
    // Context not available, which is fine for non-admin usage
    console.log('AdminCleanerContext not available, continuing without it');
  }
  
  
  const [bookings, setBookings] = useState<PastBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<PastBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    customerSearch: '',
    timePeriod: 'current-month',
  });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedBookingForUpload, setSelectedBookingForUpload] = useState<PastBooking | null>(null);

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

  const applyFilters = () => {
    let filtered = [...bookings];

    // Apply time period filter first
    if (filters.timePeriod !== 'all') {
      const periodDates = getTimePeriodDates(filters.timePeriod);
      if (periodDates) {
        filtered = filtered.filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= periodDates.from && bookingDate <= periodDates.to;
        });
      }
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(booking => 
        new Date(booking.date_time) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(booking => 
        new Date(booking.date_time) <= new Date(filters.dateTo)
      );
    }

    // Customer search
    if (filters.customerSearch) {
      filtered = filtered.filter(booking => 
        `${booking.first_name} ${booking.last_name}`.toLowerCase()
          .includes(filters.customerSearch.toLowerCase()) ||
        booking.email.toLowerCase().includes(filters.customerSearch.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      customerSearch: '',
      timePeriod: 'current-month',
    });
  };

  const handleUploadPhotos = (booking: PastBooking) => {
    // Get the cleaner ID for the booking
    const currentCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;
    
    if (!currentCleanerId) {
      return;
    }

    setSelectedBookingForUpload({
      ...booking,
      cleaner: currentCleanerId,
      customer: booking.customer || 0
    });
    setUploadDialogOpen(true);
  };

  const fetchPastBookings = async () => {
    // For admin users, use selectedCleanerId, for regular cleaners use cleanerId
    const currentCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;
    
    if (!currentCleanerId) {
      setError(userRole === 'admin' ? 'Please select a cleaner to view past bookings' : 'No cleaner ID found');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching past bookings for cleaner ID:', currentCleanerId);
      
      // Only get past bookings that were assigned to this specific cleaner
      const { data, error } = await supabase
        .from('past_bookings')
        .select('*')
        .eq('cleaner', currentCleanerId)
        .order('date_time', { ascending: false });

      if (error) {
        console.error('Error fetching past bookings:', error);
        setError('Failed to fetch past bookings');
        return;
      }

      console.log('Past bookings data for cleaner:', data?.length || 0);
      setBookings(data || []);
    } catch (error) {
      console.error('Error in fetchPastBookings:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;
    if (!authLoading && currentCleanerId) {
      fetchPastBookings();
    }
  }, [cleanerId, selectedCleanerId, userRole, authLoading]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading past bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
      </div>
    );
  }

  // Calculate total earnings for current period
  const totalEarnings = filteredBookings.reduce((sum, booking) => sum + (booking.cleaner_pay || 0), 0);

  const PastBookingCard = ({ booking }: { booking: PastBooking }) => (
    <div className="group relative overflow-hidden rounded-2xl border p-3 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 border-border/60 bg-gradient-to-br from-card to-card/80 hover:shadow-primary/5">
      
      {/* Header with Service Type and Earnings */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{booking.cleaning_type || 'Standard Cleaning'}</h3>
        </div>
        <div className="text-right">
          <div className="text-xl sm:text-2xl font-bold text-green-600">£{booking.cleaner_pay?.toFixed(2) || '0.00'}</div>
          <div className="text-xs text-muted-foreground">Your earnings</div>
        </div>
      </div>
      
      {/* Date and Customer - Mobile responsive */}
      <div className="space-y-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-medium">{booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : 'No date'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="font-medium text-blue-600 dark:text-blue-400">{booking.first_name} {booking.last_name}</span>
        </div>
      </div>
      
      {/* Address and Actions - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border/40">
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1 min-w-0">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.postcode)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          >
            {booking.address}, {booking.postcode}
          </a>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUploadPhotos(booking)}
          className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30 sm:ml-4"
        >
          <Upload className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">Upload Photos</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700">
              Total Earnings
            </CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-900">£{totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-green-600">From completed bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">
              Completed Bookings
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-900">{filteredBookings.length}</div>
            <p className="text-xs text-blue-600">Total bookings completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Period Filter - Consistent Design */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full" defaultValue="period">
            <AccordionItem value="period" className="border-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-medium">Time Period</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {/* Mobile: Dropdown */}
                <div className="block sm:hidden">
                  <Label className="text-sm font-medium mb-2 block">Select Period</Label>
                  <Select
                    value={filters.timePeriod}
                    onValueChange={(value) => setFilters({...filters, timePeriod: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Current Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                      <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Desktop: Buttons */}
                <div className="hidden sm:grid grid-cols-5 gap-2 w-full">
                  <Button
                    variant={filters.timePeriod === 'current-month' ? 'default' : 'outline'}
                    onClick={() => setFilters({...filters, timePeriod: 'current-month'})}
                    className="w-full text-xs sm:text-sm"
                  >
                    Current Month
                  </Button>
                  <Button
                    variant={filters.timePeriod === 'last-month' ? 'default' : 'outline'}
                    onClick={() => setFilters({...filters, timePeriod: 'last-month'})}
                    className="w-full text-xs sm:text-sm"
                  >
                    Last Month
                  </Button>
                  <Button
                    variant={filters.timePeriod === 'last-3-months' ? 'default' : 'outline'}
                    onClick={() => setFilters({...filters, timePeriod: 'last-3-months'})}
                    className="w-full text-xs sm:text-sm"
                  >
                    Last 3 Months
                  </Button>
                  <Button
                    variant={filters.timePeriod === 'last-6-months' ? 'default' : 'outline'}
                    onClick={() => setFilters({...filters, timePeriod: 'last-6-months'})}
                    className="w-full text-xs sm:text-sm"
                  >
                    Last 6 Months
                  </Button>
                  <Button
                    variant={filters.timePeriod === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilters({...filters, timePeriod: 'all'})}
                    className="w-full text-xs sm:text-sm"
                  >
                    All Time
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Additional Filters - Now Collapsed */}
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
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateFrom" className="text-sm font-medium">Date From</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                        className="h-9"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dateTo" className="text-sm font-medium">Date To</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerSearch" className="text-sm font-medium">Search Customer</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="customerSearch"
                        placeholder="Search by name or email"
                        value={filters.customerSearch}
                        onChange={(e) => setFilters({...filters, customerSearch: e.target.value})}
                        className="pl-8 h-9"
                      />
                    </div>
                  </div>

                  <Button onClick={clearFilters} variant="outline" className="h-9 w-full sm:w-auto">
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Past Bookings */}
      <Card>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No completed bookings found
            </div>
          ) : (
            <>
              {/* Card view - works for both mobile and desktop */}
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <PastBookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Photos Dialog */}
      {selectedBookingForUpload && (
        <CleaningPhotosUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          booking={{
            id: selectedBookingForUpload.id,
            customer: selectedBookingForUpload.customer || 0,
            cleaner: selectedBookingForUpload.cleaner || 0,
            postcode: selectedBookingForUpload.postcode,
            date_time: selectedBookingForUpload.date_time
          }}
        />
      )}
    </div>
  );
};

export default CleanerPastBookings;
