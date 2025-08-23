import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Copy, Filter, Search, MoreHorizontal, CalendarDays, MapPin, Clock, User, Phone, Mail, Banknote, CheckCircle, XCircle, AlertCircle, X, Edit3, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import BulkEditPastBookingsDialog from './BulkEditPastBookingsDialog';
import ConvertToRecurringDialog from './ConvertToRecurringDialog';
import EditPastBookingDialog from './EditPastBookingDialog';

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
  total_cost: string; // Changed from number to string to match database
  cleaner: number;
  customer: number;
  cleaner_pay: number;
  payment_status: string;
  booking_status: string;
  total_hours: number;
  property_details: string;
  additional_details: string;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
  };
  customers?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  cleanerId: string;
  customerId: string;
  customerSearch: string;
  timePeriod: string;
}

interface Stats {
  totalBookings: number;
  uniqueCustomers: number;
  totalRevenue: number;
}

const PastBookingsTable = () => {
  const [bookings, setBookings] = useState<PastBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<PastBooking[]>([]);
  const [cleaners, setCleaners] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    uniqueCustomers: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    cleanerId: 'all',
    customerId: 'all',
    customerSearch: '',
    timePeriod: 'all',
  });
  const { toast } = useToast();
  const [duplicateDialog, setDuplicateDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PastBooking | null>(null);
  const [newDateTime, setNewDateTime] = useState('');
  const [bulkEditDialog, setBulkEditDialog] = useState(false);
  const [convertToRecurringOpen, setConvertToRecurringOpen] = useState(false);
  const [selectedBookingForRecurring, setSelectedBookingForRecurring] = useState<PastBooking | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<PastBooking | null>(null);

  const getTimePeriodDates = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'last-week':
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        return { from: lastWeek, to: today };
      case 'last-month':
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        return { from: lastMonth, to: today };
      case 'last-3-months':
        const last3Months = new Date(today);
        last3Months.setMonth(today.getMonth() - 3);
        return { from: last3Months, to: today };
      case 'last-6-months':
        const last6Months = new Date(today);
        last6Months.setMonth(today.getMonth() - 6);
        return { from: last6Months, to: today };
      case 'last-year':
        const lastYear = new Date(today);
        lastYear.setFullYear(today.getFullYear() - 1);
        return { from: lastYear, to: today };
      default:
        return null;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching cleaners...');
      const { data: cleanersData, error: cleanersError } = await supabase
        .from('cleaners')
        .select('*');

      if (cleanersError) {
        console.error('Error fetching cleaners:', cleanersError);
      }

      console.log('Fetching customers...');
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) {
        console.error('Error fetching customers:', customersError);
      }

      console.log('Fetching past bookings...');
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('past_bookings')
        .select('*')
        .order('date_time', { ascending: sortOrder === 'asc' });

      if (bookingsError) {
        console.error('Error fetching past bookings:', bookingsError);
        setError('Failed to fetch past bookings: ' + bookingsError.message);
        return;
      }

      setBookings(bookingsData || []);
      setCleaners(cleanersData || []);
      setCustomers(customersData || []);

      console.log('Data loaded successfully:', {
        cleaners: cleanersData?.length || 0,
        customers: customersData?.length || 0,
        pastBookings: bookingsData?.length || 0
      });

    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
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

    // Cleaner filter
    if (filters.cleanerId && filters.cleanerId !== 'all') {
      filtered = filtered.filter(booking => 
        booking.cleaner === parseInt(filters.cleanerId)
      );
    }

    // Customer filter
    if (filters.customerId && filters.customerId !== 'all') {
      filtered = filtered.filter(booking => 
        booking.customer === parseInt(filters.customerId)
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
    setCurrentPage(1);

    // Calculate stats for filtered bookings
    const uniqueCustomers = new Set(filtered.map(booking => booking.customer)).size;
    const totalRevenue = filtered.reduce((sum, booking) => {
      const cost = typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) : booking.total_cost;
      return sum + (cost || 0);
    }, 0);
    
    setStats({
      totalBookings: filtered.length,
      uniqueCustomers,
      totalRevenue
    });
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      cleanerId: 'all',
      customerId: 'all',
      customerSearch: '',
      timePeriod: 'all',
    });
  };

  const getPaymentStatusIcon = (status: string, cost: number | string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    const costValue = typeof cost === 'string' ? parseFloat(cost) : cost;
    
    if (normalizedStatus.includes('paid') && !normalizedStatus.includes('not')) {
      return (
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-green-600 text-base">
            £{costValue?.toFixed(2) || '0.00'}
          </span>
        </div>
      );
    } else if (normalizedStatus.includes('processing')) {
      return (
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="font-semibold text-yellow-600 text-base">
            £{costValue?.toFixed(2) || '0.00'}
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="font-semibold text-red-600 text-base">
            £{costValue?.toFixed(2) || '0.00'}
          </span>
        </div>
      );
    }
  };

  const getCleanerInfo = (booking: PastBooking) => {
    if (booking.cleaners) {
      const name = booking.cleaners.full_name || 
                   `${booking.cleaners.first_name || ''} ${booking.cleaners.last_name || ''}`.trim() || 
                   'Unknown Cleaner';
      return {
        name,
        pay: booking.cleaner_pay || 0
      };
    }
    
    if (booking.cleaner && cleaners.length > 0) {
      const cleaner = cleaners.find(c => c.id === booking.cleaner);
      
      if (cleaner) {
        const name = cleaner.full_name || 
                     `${cleaner.first_name || ''} ${cleaner.last_name || ''}`.trim() || 
                     `Cleaner ${cleaner.id}`;
        return {
          name,
          pay: booking.cleaner_pay || 0
        };
      }
    }
    
    if (booking.cleaner) {
      return {
        name: `Cleaner ID: ${booking.cleaner} (Data Missing)`,
        pay: booking.cleaner_pay || 0
      };
    }
    
    return {
      name: 'No Cleaner Assigned',
      pay: 0
    };
  };

  const handleDuplicate = (booking: PastBooking) => {
    setSelectedBooking(booking);
    setDuplicateDialog(true);
  };

  const handleMakeRecurring = (booking: PastBooking) => {
    setSelectedBookingForRecurring(booking);
    setConvertToRecurringOpen(true);
  };

  const handleEdit = (booking: PastBooking) => {
    setSelectedBookingForEdit(booking);
    setEditDialogOpen(true);
  };

  const handleDelete = (bookingId: number) => {
    setBookingToDelete(bookingId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;

    try {
      const { error } = await supabase
        .from('past_bookings')
        .delete()
        .eq('id', bookingToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking deleted successfully."
      });

      setDeleteDialogOpen(false);
      setBookingToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Error",
        description: "Failed to delete booking.",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateConfirm = async () => {
    if (!selectedBooking || !newDateTime) {
      toast({
        title: "Error",
        description: "Please select a date and time for the new booking.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create new booking data based on the selected past booking
      const newBookingData = {
        customer: selectedBooking.customer,
        cleaner: selectedBooking.cleaner,
        first_name: selectedBooking.first_name,
        last_name: selectedBooking.last_name,
        email: selectedBooking.email,
        phone_number: selectedBooking.phone_number,
        date_time: newDateTime,
        address: selectedBooking.address,
        postcode: selectedBooking.postcode,
        total_hours: selectedBooking.total_hours,
        total_cost: typeof selectedBooking.total_cost === 'string' ? parseFloat(selectedBooking.total_cost) : selectedBooking.total_cost,
        cleaner_pay: selectedBooking.cleaner_pay,
        cleaning_type: selectedBooking.cleaning_type,
        property_details: selectedBooking.property_details,
        additional_details: selectedBooking.additional_details,
        payment_method: 'Cash', // Default for new booking
        payment_status: 'Unpaid', // Default for new booking
        booking_status: 'Confirmed'
      };

      const { error } = await supabase
        .from('bookings')
        .insert([newBookingData]);

      if (error) {
        console.error('Error duplicating booking:', error);
        toast({
          title: "Error",
          description: "Failed to duplicate booking. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Booking duplicated successfully!",
      });

      setDuplicateDialog(false);
      setSelectedBooking(null);
      setNewDateTime('');
    } catch (error) {
      console.error('Error duplicating booking:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
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
        <button 
          onClick={fetchData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Time Period Filter Buttons */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Time Period</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.timePeriod === 'all' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'all'})}
              size="sm"
              className="text-xs sm:text-sm"
            >
              All Time
            </Button>
            <Button
              variant={filters.timePeriod === 'last-week' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'last-week'})}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Last Week
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
              variant={filters.timePeriod === 'last-year' ? 'default' : 'outline'}
              onClick={() => setFilters({...filters, timePeriod: 'last-year'})}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Last Year
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">Total Bookings</CardTitle>
            <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-blue-900">{stats.totalBookings}</div>
            <p className="text-xs text-blue-600">Past bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700">Unique Customers</CardTitle>
            <User className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-green-900">{stats.uniqueCustomers}</div>
            <p className="text-xs text-green-600">From past bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700">Total Revenue</CardTitle>
            <span className="text-purple-600 font-bold text-sm sm:text-base">£</span>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-purple-900">£{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-purple-600">From past bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Additional Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom" className="text-xs sm:text-sm font-medium">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="h-8 sm:h-9 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateTo" className="text-xs sm:text-sm font-medium">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="h-8 sm:h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaner" className="text-xs sm:text-sm font-medium">Cleaner</Label>
              <Select value={filters.cleanerId} onValueChange={(value) => setFilters({...filters, cleanerId: value})}>
                <SelectTrigger className="h-8 sm:h-9 text-sm">
                  <SelectValue placeholder="Select cleaner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cleaners</SelectItem>
                  {cleaners.length > 0 ? (
                    cleaners.map((cleaner) => {
                      const cleanerName = cleaner.full_name || 
                                         `${cleaner.first_name || ''} ${cleaner.last_name || ''}`.trim() || 
                                         `Cleaner ${cleaner.id}`;
                      return (
                        <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                          {cleanerName}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-cleaners-found" disabled>No cleaners found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer" className="text-xs sm:text-sm font-medium">Customer</Label>
              <Select value={filters.customerId} onValueChange={(value) => setFilters({...filters, customerId: value})}>
                <SelectTrigger className="h-8 sm:h-9 text-sm">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All customers</SelectItem>
                  {customers.length > 0 ? (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.first_name} {customer.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-customers-found" disabled>No customers found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerSearch" className="text-xs sm:text-sm font-medium">Search Customer</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2 sm:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="customerSearch"
                  placeholder="Search by name or email"
                  value={filters.customerSearch}
                  onChange={(e) => setFilters({...filters, customerSearch: e.target.value})}
                  className="pl-7 sm:pl-8 h-8 sm:h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto">
                <X className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 bg-gray-50 p-3 sm:p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <Label htmlFor="itemsPerPage" className="text-xs sm:text-sm font-medium whitespace-nowrap">Show:</Label>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(parseInt(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-16 sm:w-20 h-7 sm:h-8 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="sortOrder" className="text-xs sm:text-sm font-medium whitespace-nowrap">Sort:</Label>
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger className="w-28 sm:w-32 h-7 sm:h-8 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Latest first</SelectItem>
                <SelectItem value="asc">Earliest first</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => setBulkEditDialog(true)}
            className="flex items-center gap-2 h-7 sm:h-8 text-xs sm:text-sm"
            size="sm"
          >
            <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
            Bulk Edit
          </Button>
        </div>

        <div className="text-xs sm:text-sm text-gray-600 w-full sm:w-auto text-left sm:text-right">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
        </div>
      </div>

      {/* Mobile Card View for small screens, Table for larger screens */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            {paginatedBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No past bookings found
              </div>
            ) : (
              <div className="space-y-3 p-3">
                {paginatedBookings.map((booking) => {
                  const cleanerInfo = getCleanerInfo(booking);
                  const cost = typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) : booking.total_cost;
                  
                  return (
                    <Card key={booking.id} className="border border-gray-200">
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          {/* Date and Time */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <CalendarDays className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-sm">
                                  {booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : 'No date'}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'No time'}
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleEdit(booking)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleDuplicate(booking)}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleMakeRecurring(booking)}
                                >
                                  <Repeat className="mr-2 h-4 w-4" />
                                  Make Recurring
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer text-red-600"
                                  onClick={() => handleDelete(booking.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Customer Info */}
                          <div className="space-y-1">
                            <div className="font-medium text-sm flex items-center">
                              <User className="h-3 w-3 mr-2 text-gray-400" />
                              {booking.first_name} {booking.last_name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-2" />
                              {booking.email}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-2" />
                              {booking.phone_number}
                            </div>
                          </div>

                          {/* Address */}
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                            <div className="text-xs text-gray-700 leading-tight">
                              <div>{booking.address}</div>
                              {booking.postcode && (
                                <div className="text-gray-500 font-medium">{booking.postcode}</div>
                              )}
                            </div>
                          </div>

                          {/* Service and Cleaner */}
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {booking.cleaning_type || 'Standard Cleaning'}
                            </span>
                            <div className="text-xs">
                              <span className="text-gray-500">Cleaner: </span>
                              <span className="font-medium">{cleanerInfo.name}</span>
                            </div>
                          </div>

                          {/* Cost and Payment Status */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="text-xs text-green-600 font-medium flex items-center">
                              <Banknote className="h-3 w-3 mr-1" />
                              Pay: £{cleanerInfo.pay.toFixed(2)}
                            </div>
                            {getPaymentStatusIcon(booking.payment_status, cost)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-base">Date & Time</TableHead>
                  <TableHead className="font-semibold text-base">Customer</TableHead>
                  <TableHead className="font-semibold text-base">Address</TableHead>
                  <TableHead className="font-semibold text-base">Service</TableHead>
                  <TableHead className="font-semibold text-base">Cleaner</TableHead>
                  <TableHead className="font-semibold text-base">Cost</TableHead>
                  <TableHead className="font-semibold text-center text-base">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500 text-base">
                      No past bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBookings.map((booking) => {
                    const cleanerInfo = getCleanerInfo(booking);
                    const cost = typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) : booking.total_cost;
                    
                    return (
                      <TableRow key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="flex items-start space-x-3">
                            <div className="flex flex-col items-center space-y-1">
                              <CalendarDays className="h-4 w-4 text-gray-400" />
                              <Clock className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium text-base">
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
                            <div className="font-medium text-base flex items-center">
                              <User className="h-3 w-3 mr-2 text-gray-400" />
                              {booking.first_name} {booking.last_name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-2" />
                              {booking.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-2" />
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
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-base font-medium">{cleanerInfo.name}</span>
                            </div>
                            <div className="text-sm text-green-600 font-medium flex items-center">
                              <Banknote className="h-3 w-3 mr-2" />
                              Pay: £{cleanerInfo.pay.toFixed(2)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusIcon(booking.payment_status, cost)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleEdit(booking)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleDuplicate(booking)}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleMakeRecurring(booking)}
                                >
                                  <Repeat className="mr-2 h-4 w-4" />
                                  Make Recurring
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer text-red-600"
                                  onClick={() => handleDelete(booking.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            Previous
          </Button>
          
          <div className="flex space-x-1 sm:space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8 h-8 sm:w-auto sm:h-auto text-xs sm:text-sm"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            Next
          </Button>
        </div>
      )}

      {/* Duplicate Booking Dialog */}
      <Dialog open={duplicateDialog} onOpenChange={setDuplicateDialog}>
        <DialogContent className="mx-3 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Duplicate Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select a new date and time for the duplicated booking:
            </p>
            <div>
              <Label htmlFor="newDateTime" className="text-sm">Date & Time *</Label>
              <Input
                id="newDateTime"
                type="datetime-local"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDuplicateDialog(false);
                  setSelectedBooking(null);
                  setNewDateTime('');
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={handleDuplicateConfirm} className="w-full sm:w-auto">
                Create Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Past Bookings Dialog */}
      <BulkEditPastBookingsDialog
        open={bulkEditDialog}
        onOpenChange={setBulkEditDialog}
        onSuccess={() => {
          fetchData();
        }}
      />

      <ConvertToRecurringDialog
        open={convertToRecurringOpen}
        onOpenChange={setConvertToRecurringOpen}
        booking={selectedBookingForRecurring}
        onSuccess={fetchData}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditPastBookingDialog
        booking={selectedBookingForEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onBookingUpdated={() => {
          fetchData();
          setEditDialogOpen(false);
          setSelectedBookingForEdit(null);
        }}
      />
    </div>
  );
};

export default PastBookingsTable;
