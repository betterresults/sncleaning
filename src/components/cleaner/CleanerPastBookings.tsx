import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { CalendarDays, Clock, MapPin, User, Banknote, Camera, Search, Filter, X, Upload } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  customerSearch: string;
  timePeriod: string;
}

const CleanerPastBookings = () => {
  const { cleanerId, userRole, loading: authLoading } = useAuth();
  const { selectedCleanerId } = useAdminCleaner();
  const isMobile = useIsMobile();
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

  const handleUploadPhotos = (bookingId: number) => {
    // Placeholder for photo upload functionality
    console.log('Upload photos for booking:', bookingId);
    // This will be implemented later based on user requirements
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

  const MobileBookingCard = ({ booking }: { booking: PastBooking }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Date and Time */}
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <div className="text-sm font-medium">
              {booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy HH:mm') : 'No date'}
            </div>
          </div>

          {/* Customer */}
          <div className="flex items-start space-x-2">
            <User className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-sm">{booking.first_name} {booking.last_name}</div>
              <div className="text-xs text-gray-500">{booking.phone_number}</div>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1 text-sm text-gray-700">
              <div>{booking.address}</div>
              {booking.postcode && (
                <div className="text-gray-500 font-medium">{booking.postcode}</div>
              )}
            </div>
          </div>

          {/* Service and Earnings */}
          <div className="flex justify-between items-center">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {booking.cleaning_type || 'Standard Cleaning'}
            </span>
            <div className="flex items-center space-x-1">
              <Banknote className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-600 text-sm">
                £{booking.cleaner_pay?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>

          {/* Upload Button */}
          <Button 
            onClick={() => handleUploadPhotos(booking.id)}
            size="sm"
            className="w-full flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Photos
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700">
              Total Earnings - {filters.timePeriod === 'current-month' ? 'Current Month' : 
                              filters.timePeriod === 'last-month' ? 'Last Month' :
                              filters.timePeriod === 'last-3-months' ? 'Last 3 Months' :
                              filters.timePeriod === 'last-6-months' ? 'Last 6 Months' : 'All Time'}
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
              Completed Bookings - {filters.timePeriod === 'current-month' ? 'Current Month' : 
                                  filters.timePeriod === 'last-month' ? 'Last Month' :
                                  filters.timePeriod === 'last-3-months' ? 'Last 3 Months' :
                                  filters.timePeriod === 'last-6-months' ? 'Last 6 Months' : 'All Time'}
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-900">{filteredBookings.length}</div>
            <p className="text-xs text-blue-600">Total bookings completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Period Filter Buttons */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Time Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Button
              variant={filters.timePeriod === 'current-month' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'current-month'})}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Current Month
            </Button>
            <Button
              variant={filters.timePeriod === 'last-month' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'last-month'})}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Last Month
            </Button>
            <Button
              variant={filters.timePeriod === 'last-3-months' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'last-3-months'})}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Last 3 Months
            </Button>
            <Button
              variant={filters.timePeriod === 'last-6-months' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'last-6-months'})}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Last 6 Months
            </Button>
            <Button
              variant={filters.timePeriod === 'all' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'all'})}
              size="sm"
              className="text-xs sm:text-sm col-span-2 sm:col-span-1"
            >
              All Time
            </Button>
          </div>
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
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-base sm:text-lg">My Past Bookings</CardTitle>
            <p className="text-sm text-gray-600">
              {filteredBookings.length} completed booking{filteredBookings.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No past bookings found
            </div>
          ) : (
            <>
              {/* Mobile view */}
              {isMobile ? (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <MobileBookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              ) : (
                /* Desktop view */
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Earnings</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex items-start space-x-3">
                              <div className="flex flex-col items-center space-y-1">
                                <CalendarDays className="h-4 w-4 text-gray-400" />
                                <Clock className="h-4 w-4 text-gray-400" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : 'No date'}
                                </div>
                                <div className="text-gray-500 text-sm">
                                  {booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'No time'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium flex items-center">
                                <User className="h-3 w-3 mr-2 text-gray-400" />
                                {booking.first_name} {booking.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.phone_number}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start space-x-2 max-w-48">
                              <MapPin className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                              <div className="text-sm text-gray-700 leading-tight">
                                <div>{booking.address}</div>
                                {booking.postcode && (
                                  <div className="text-gray-500 font-medium">{booking.postcode}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {booking.cleaning_type || 'Standard Cleaning'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Banknote className="h-4 w-4 text-green-600" />
                              <span className="font-semibold text-green-600">
                                £{booking.cleaner_pay?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              onClick={() => handleUploadPhotos(booking.id)}
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              Upload Photos
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CleanerPastBookings;
