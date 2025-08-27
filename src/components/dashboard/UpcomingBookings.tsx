import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Filter, Search, Settings, Copy, X, UserPlus, DollarSign, Repeat, Calendar, List, MoreHorizontal, CalendarDays, Clock, MapPin, User, Mail, Phone, Banknote, CheckCircle, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import PaymentStatusIndicator from '@/components/payments/PaymentStatusIndicator';
import ManualPaymentDialog from '@/components/payments/ManualPaymentDialog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { AuthorizeRemainingAmountDialog } from '@/components/payments/AuthorizeRemainingAmountDialog';

import BulkEditBookingsDialog from './BulkEditBookingsDialog';
import EditBookingDialog from './EditBookingDialog';
import AssignCleanerDialog from './AssignCleanerDialog';
import DuplicateBookingDialog from './DuplicateBookingDialog';
import ConvertToRecurringDialog from './ConvertToRecurringDialog';
import DayBookingsDialog from './DayBookingsDialog';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  cleaning_type: string;
  service_type: string;
  total_cost: number;
  payment_status: string;
  cleaner: number | null;
  customer: number;
  cleaner_pay: number | null;
  total_hours: number | null;
  additional_details?: string;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  customers?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  cleanerId: string;
  customerId: string;
  customerSearch: string;
}

interface UpcomingBookingsProps {
  dashboardDateFilter?: {
    dateFrom: string;
    dateTo: string;
  };
}

const UpcomingBookings = ({ dashboardDateFilter }: UpcomingBookingsProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    cleanerId: 'all',
    customerId: 'all',
    customerSearch: '',
  });
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);
  const [assignCleanerOpen, setAssignCleanerOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedBookingForDuplicate, setSelectedBookingForDuplicate] = useState<Booking | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);
  const [convertToRecurringOpen, setConvertToRecurringOpen] = useState(false);
  const [selectedBookingForRecurring, setSelectedBookingForRecurring] = useState<Booking | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [dayBookingsDialogOpen, setDayBookingsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayBookings, setSelectedDayBookings] = useState<Booking[]>([]);
  const { toast } = useToast();

  // Setup calendar localizer
  const localizer = momentLocalizer(moment);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build the query with date filtering
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
          cleaners!bookings_cleaner_fkey (
            id,
            first_name,
            last_name
          ),
          customers!bookings_customer_fkey (
            id,
            first_name,
            last_name
          )
        `);

      // Apply dashboard date filter first
      if (dashboardDateFilter) {
        bookingsQuery = bookingsQuery
          .gte('date_time', dashboardDateFilter.dateFrom)
          .lte('date_time', dashboardDateFilter.dateTo);
      } else {
        // Show all future bookings when no date filter is provided
        bookingsQuery = bookingsQuery
          .gte('date_time', new Date().toISOString());
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery
        .order('date_time', { ascending: sortOrder === 'asc' });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to load bookings: ' + bookingsError.message);
        return;
      }

      // Fetch cleaners and customers
      const { data: cleanersData, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name')
        .order('first_name');

      if (cleanersError) {
        console.error('Error fetching cleaners:', cleanersError);
      }

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, first_name, last_name')
        .order('first_name');

      if (customersError) {
        console.error('Error fetching customers:', customersError);
      }

      console.log('Fetched data:', {
        bookings: bookingsData?.length || 0,
        cleaners: cleanersData?.length || 0,
        customers: customersData?.length || 0
      });

      setBookings(bookingsData || []);
      setCleaners(cleanersData || []);
      setCustomers(customersData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

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

    if (filters.cleanerId && filters.cleanerId !== 'all') {
      filtered = filtered.filter(booking => 
        booking.cleaner === parseInt(filters.cleanerId)
      );
    }

    if (filters.customerId && filters.customerId !== 'all') {
      filtered = filtered.filter(booking => 
        booking.customer === parseInt(filters.customerId)
      );
    }

    if (filters.customerSearch) {
      filtered = filtered.filter(booking => 
        `${booking.first_name} ${booking.last_name}`.toLowerCase()
          .includes(filters.customerSearch.toLowerCase()) ||
        booking.email.toLowerCase().includes(filters.customerSearch.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      cleanerId: 'all',
      customerId: 'all',
      customerSearch: '',
    });
  };

  const getCleanerName = (booking: Booking) => {
    if (!booking.cleaner) {
      return 'Unsigned';
    }

    if (booking.cleaners) {
      return `${booking.cleaners.first_name} ${booking.cleaners.last_name}`;
    }

    const cleaner = cleaners.find(c => c.id === booking.cleaner);
    if (cleaner) {
      return `${cleaner.first_name} ${cleaner.last_name}`;
    }

    return 'Unsigned';
  };

  const handleEdit = (bookingId: number) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBookingForEdit(booking);
      setEditDialogOpen(true);
    }
  };

  const handleDelete = async (bookingId: number) => {
    setBookingToDelete(bookingId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;
    
    try {
      console.log('Attempting to delete booking with ID:', bookingToDelete);
      
      // Check if booking exists first
      const { data: existingBooking, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('id', bookingToDelete)
        .single();

      if (checkError || !existingBooking) {
        console.error('Booking not found:', checkError);
        toast({
          title: "Error",
          description: "Booking not found",
          variant: "destructive"
        });
        return;
      }

      const { error, count } = await supabase
        .from('bookings')
        .delete({ count: 'exact' })
        .eq('id', bookingToDelete);

      if (error) {
        console.error('Error deleting booking:', error);
        toast({
          title: "Error",
          description: `Failed to delete booking: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Deletion result - affected rows:', count);
      
      if (count === 0) {
        toast({
          title: "Warning",
          description: "No booking was deleted. It may have already been removed.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Booking deleted successfully!"
        });
      }
      
      fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the booking.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  const handleDuplicate = (booking: Booking) => {
    setSelectedBookingForDuplicate(booking);
    setDuplicateDialogOpen(true);
  };

  const handleCancel = async (bookingId: number) => {
    setBookingToCancel(bookingId);
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!bookingToCancel) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'Cancelled' })
        .eq('id', bookingToCancel);

      if (error) {
        console.error('Error cancelling booking:', error);
        toast({
          title: "Error",
          description: "Failed to cancel booking. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Booking cancelled",
        description: "The booking has been successfully cancelled.",
      });

      fetchData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelDialogOpen(false);
      setBookingToCancel(null);
    }
  };

  const handleAssignCleaner = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setAssignCleanerOpen(true);
  };

  const handlePaymentAction = (booking: Booking) => {
    setSelectedBookingForPayment(booking);
    setPaymentDialogOpen(true);
  };

  const handleMakeRecurring = (booking: Booking) => {
    setSelectedBookingForRecurring(booking);
    setConvertToRecurringOpen(true);
  };

  // Handle day click in calendar
  const handleDayClick = (date: Date) => {
    if (!date) return;
    
    const dayBookings = filteredBookings.filter(booking => {
      if (!booking.date_time) return false;
      const bookingDate = new Date(booking.date_time);
      if (isNaN(bookingDate.getTime())) return false;
      return bookingDate.toDateString() === date.toDateString();
    });
    
    if (dayBookings.length > 0) {
      setSelectedDate(date);
      setSelectedDayBookings(dayBookings);
      setDayBookingsDialogOpen(true);
    }
  };

  // Get bookings count for a specific date
  const getBookingsForDate = (date: Date) => {
    if (!date) return [];
    
    return filteredBookings.filter(booking => {
      if (!booking.date_time) return false;
      const bookingDate = new Date(booking.date_time);
      if (isNaN(bookingDate.getTime())) return false;
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  // Custom day cell component with booking count
  const CustomDayCell = ({ children, value, ...props }: any) => {
    const dayBookings = getBookingsForDate(value);
    const bookingCount = dayBookings.length;
    
    return (
      <div 
        className="relative h-full w-full cursor-pointer hover:bg-blue-50 transition-colors min-h-[100px] p-1"
        onClick={() => handleDayClick(value)}
        {...props}
      >
        {/* Render the default calendar day content (date number) */}
        {children}
        
        {/* Show booking count badge */}
        {bookingCount > 0 && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-sm font-bold rounded-lg px-2 py-1 shadow-md border-2 border-white min-w-[24px] text-center">
            {bookingCount}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchData();
  }, [sortOrder, dashboardDateFilter, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  const getPaymentStatusIcon = (status: string, cost: number) => {
    const normalizedStatus = status?.toLowerCase() || 'unpaid';
    
    console.log('Payment status debug:', { status, normalizedStatus, cost }); // Debug log
    
    if (normalizedStatus === 'paid' || normalizedStatus.includes('paid')) {
      return (
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-green-600 text-base">
            £{cost?.toFixed(2) || '0.00'}
          </span>
        </div>
      );
    } else if (normalizedStatus === 'collecting' || normalizedStatus.includes('collecting')) {
      return (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-yellow-600 text-base">
            £{cost?.toFixed(2) || '0.00'}
          </span>
        </div>
      );
    } else {
      // Unpaid or other statuses - no icon, darker grey
      return (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-700 text-base">
            £{cost?.toFixed(2) || '0.00'}
          </span>
        </div>
      );
    }
  };

  const hasActiveFilters = filters.dateFrom || filters.dateTo || 
                          (filters.cleanerId && filters.cleanerId !== 'all') || 
                          (filters.customerId && filters.customerId !== 'all') || 
                          filters.customerSearch;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchData}>
          Retry
        </Button>
      </div>
    );
  }

  // Calculate unassigned bookings
  const unassignedBookings = filteredBookings.filter(booking => !booking.cleaner);

  return (
    <div className="space-y-6">
      {/* Unassigned Bookings Notification */}
      {unassignedBookings.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-rose-100 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
            <span className="text-red-800 font-semibold">
              {unassignedBookings.length} unassigned booking{unassignedBookings.length > 1 ? 's' : ''} require{unassignedBookings.length === 1 ? 's' : ''} attention
            </span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {/* Date From */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">From:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[120px] justify-start text-left font-normal h-8"
                  >
                    <Calendar className="mr-2 h-3 w-3" />
                    {filters.dateFrom ? format(new Date(filters.dateFrom), 'dd/MM') : 'Select'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                    onSelect={(date) => setFilters({...filters, dateFrom: date ? date.toISOString().split('T')[0] : ''})}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Date To */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">To:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[120px] justify-start text-left font-normal h-8"
                  >
                    <Calendar className="mr-2 h-3 w-3" />
                    {filters.dateTo ? format(new Date(filters.dateTo), 'dd/MM') : 'Select'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                    onSelect={(date) => setFilters({...filters, dateTo: date ? date.toISOString().split('T')[0] : ''})}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Cleaner Filter */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">Cleaner:</Label>
              <Select value={filters.cleanerId} onValueChange={(value) => setFilters({...filters, cleanerId: value})}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="All cleaners" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  <SelectItem value="all">All cleaners</SelectItem>
                  {cleaners.map((cleaner) => (
                    <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                      {cleaner.first_name} {cleaner.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Search */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">Customer:</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                <Input
                  placeholder="Search customer..."
                  value={filters.customerSearch}
                  onChange={(e) => setFilters({...filters, customerSearch: e.target.value})}
                  className="pl-7 w-[160px] h-8 text-sm"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <Button onClick={clearFilters} variant="outline" size="sm" className="h-8">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="itemsPerPage" className="text-sm whitespace-nowrap">Show:</Label>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(parseInt(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-16 sm:w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="sortOrder" className="text-sm whitespace-nowrap">Sort:</Label>
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger className="w-28 sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Earliest first</SelectItem>
                <SelectItem value="desc">Latest first</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => setBulkEditOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
            size="sm"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Bulk Edit</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-lg border bg-background p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </Button>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 text-center lg:text-right">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredBookings.length)} of {filteredBookings.length}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-base">Date & Time</TableHead>
                    <TableHead className="font-semibold text-base">Customer</TableHead>
                    <TableHead className="font-semibold text-base">Address</TableHead>
                    <TableHead className="font-semibold text-base">Service</TableHead>
                    <TableHead className="font-semibold text-base">Cleaner</TableHead>
                    <TableHead className="font-semibold text-base">Cost</TableHead>
                    <TableHead className="text-center font-semibold text-base">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500 text-base">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBookings.map((booking) => {
                      const isUnsigned = !booking.cleaner;
                      const cleanerName = getCleanerName(booking);
                      
                      return (
                        <TableRow 
                          key={booking.id} 
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-start space-x-3">
                              <div className="flex flex-col items-center space-y-1">
                                <CalendarDays className="h-4 w-4 text-gray-400" />
                                <Clock className="h-4 w-4 text-gray-400" />
                              </div>
                              <div>
                                <div className="font-medium text-base">
                                  {format(new Date(booking.date_time), 'dd/MM/yyyy')}
                                </div>
                                <div className="text-gray-500 text-sm">
                                  {format(new Date(booking.date_time), 'HH:mm')}
                                </div>
                                {booking.total_hours && (
                                  <div className="text-xs text-gray-600 font-medium">
                                    {booking.total_hours === 1 ? '1 hour' : `${booking.total_hours} hours`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[140px]">
                            <div className="space-y-1">
                              <div className="font-medium text-base flex items-center">
                                <User className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{booking.first_name} {booking.last_name}</span>
                              </div>
                              <div className="text-sm text-gray-500 flex items-center group">
                                <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                                <span className="truncate cursor-help" title={booking.email}>
                                  {booking.email.length > 20 ? `${booking.email.substring(0, 20)}...` : booking.email}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                                <span className="truncate">{booking.phone_number}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[180px]">
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                              <div className="text-sm text-gray-700 leading-tight">
                                <div className="text-gray-500 font-medium">{booking.postcode}</div>
                                <div className="truncate cursor-help" title={booking.address}>
                                  {booking.address.length > 25 ? `${booking.address.substring(0, 25)}...` : booking.address}
                                </div>
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
                              {isUnsigned ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  Unassigned
                                </span>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <User className="h-3 w-3 text-gray-400" />
                                  <span className="text-base font-medium">{cleanerName}</span>
                                </div>
                              )}
                              {booking.cleaner_pay && (
                                <div className="text-sm text-green-600 font-medium flex items-center">
                                  <Banknote className="h-3 w-3 mr-2" />
                                  Pay: £{booking.cleaner_pay.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <PaymentStatusIndicator 
                                  status={booking.payment_status} 
                                  isClickable={true}
                                  onClick={() => handlePaymentAction(booking)}
                                  size="sm"
                                />
                                <span className="font-semibold text-base">
                                  £{booking.total_cost?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                              
                              {/* Show AuthorizeRemainingAmountDialog for partially authorized bookings */}
                              <AuthorizeRemainingAmountDialog
                                booking={booking}
                                onSuccess={fetchData}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(booking.id);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicate(booking);
                                    }}
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAssignCleaner(booking.id);
                                    }}
                                  >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Assign Cleaner
                                  </DropdownMenuItem>
                                   <DropdownMenuItem
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleMakeRecurring(booking);
                                     }}
                                   >
                                     <Repeat className="w-4 h-4 mr-2" />
                                     Make Recurring
                                   </DropdownMenuItem>
                                   <DropdownMenuSeparator />
                                   <DropdownMenuItem
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handlePaymentAction(booking);
                                     }}
                                   >
                                     <DollarSign className="w-4 h-4 mr-2" />
                                     Manage Payment
                                   </DropdownMenuItem>
                                   <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancel(booking.id);
                                    }}
                                    className="text-orange-600"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(booking.id);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
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
          ) : (
            <div className="p-4" style={{ height: '600px' }}>
              <BigCalendar
                localizer={localizer}
                events={[]} // No events - we'll show count badges instead
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month']}
                defaultView="month"
                toolbar={true}
                components={{
                  dateCellWrapper: CustomDayCell,
                }}
                onSelectSlot={(slotInfo) => {
                  if (slotInfo.start) {
                    handleDayClick(slotInfo.start);
                  }
                }}
                selectable={true}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <BulkEditBookingsDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        onSuccess={fetchData}
      />

      <EditBookingDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        booking={selectedBookingForEdit}
        onBookingUpdated={fetchData}
      />

      <AssignCleanerDialog
        bookingId={selectedBookingId}
        open={assignCleanerOpen}
        onOpenChange={setAssignCleanerOpen}
        onSuccess={fetchData}
      />

      <DuplicateBookingDialog
        booking={selectedBookingForDuplicate}
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
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
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This will mark the booking as cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelDialogOpen(false)}>
              No, Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-orange-600 hover:bg-orange-700">
              Yes, Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConvertToRecurringDialog
        open={convertToRecurringOpen}
        onOpenChange={setConvertToRecurringOpen}
        booking={selectedBookingForRecurring}
        onSuccess={fetchData}
      />

      <ManualPaymentDialog
        booking={selectedBookingForPayment}
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
        onSuccess={() => {
          fetchData();
          setPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
      />

      <DayBookingsDialog
        open={dayBookingsDialogOpen}
        onOpenChange={setDayBookingsDialogOpen}
        selectedDate={selectedDate}
        bookings={selectedDayBookings}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onAssignCleaner={handleAssignCleaner}
        onMakeRecurring={handleMakeRecurring}
        onPaymentAction={handlePaymentAction}
        onCancel={handleCancel}
        onDelete={handleDelete}
        getCleanerName={getCleanerName}
      />
    </div>
  );
};

export default UpcomingBookings;
