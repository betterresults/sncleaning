import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { CalendarDays, Clock, MapPin, User, Banknote, Camera, Search, Filter, X, Upload } from 'lucide-react';

interface PastBooking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  form_name: string;
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
  const { cleanerId, loading: authLoading } = useAuth();
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
    if (!cleanerId) {
      setError('No cleaner ID found');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching past bookings for cleaner ID:', cleanerId);
      
      // Only get past bookings that were assigned to this specific cleaner
      const { data, error } = await supabase
        .from('past_bookings')
        .select('*')
        .eq('cleaner', cleanerId)
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
    if (!authLoading && cleanerId) {
      fetchPastBookings();
    }
  }, [cleanerId, authLoading]);

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

  return (
    <div className="space-y-6">
      {/* Statistics Card */}
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700">
            Total Earnings - {filters.timePeriod === 'current-month' ? 'Current Month' : 
                              filters.timePeriod === 'last-month' ? 'Last Month' :
                              filters.timePeriod === 'last-3-months' ? 'Last 3 Months' :
                              filters.timePeriod === 'last-6-months' ? 'Last 6 Months' : 'All Time'}
          </CardTitle>
          <Banknote className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">£{totalEarnings.toFixed(2)}</div>
          <p className="text-xs text-green-600">{filteredBookings.length} completed jobs</p>
        </CardContent>
      </Card>

      {/* Time Period Filter Buttons */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Time Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.timePeriod === 'current-month' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'current-month'})}
              size="sm"
            >
              Current Month
            </Button>
            <Button
              variant={filters.timePeriod === 'last-month' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'last-month'})}
              size="sm"
            >
              Last Month
            </Button>
            <Button
              variant={filters.timePeriod === 'last-3-months' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'last-3-months'})}
              size="sm"
            >
              Last 3 Months
            </Button>
            <Button
              variant={filters.timePeriod === 'last-6-months' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'last-6-months'})}
              size="sm"
            >
              Last 6 Months
            </Button>
            <Button
              variant={filters.timePeriod === 'all' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'all'})}
              size="sm"
            >
              All Time
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Additional Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="h-9">
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Past Bookings Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Past Bookings</CardTitle>
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
                            {booking.email}
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
                          {booking.form_name || 'Standard Cleaning'}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default CleanerPastBookings;
