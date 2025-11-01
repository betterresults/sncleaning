import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Filter, Search, Settings, Copy, X, UserPlus, DollarSign, Repeat, Calendar, List, MoreHorizontal, CalendarDays, Clock, MapPin, User, Mail, Phone, Banknote, CheckCircle, XCircle, AlertCircle, AlertTriangle, Send } from 'lucide-react';
import PaymentStatusIndicator from '@/components/payments/PaymentStatusIndicator';
import ManualPaymentDialog from '@/components/payments/ManualPaymentDialog';
import { InvoilessPaymentDialog } from '@/components/payments/InvoilessPaymentDialog';
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
import { UpcomingBookingsFilters } from '@/components/bookings/UpcomingBookingsFilters';
import { BookingsViewControls } from '@/components/bookings/BookingsViewControls';

import EditBookingDialog from './EditBookingDialog';
import AssignCleanerDialog from './AssignCleanerDialog';
import DuplicateBookingDialog from './DuplicateBookingDialog';
import ConvertToRecurringDialog from './ConvertToRecurringDialog';
import DayBookingsDialog from './DayBookingsDialog';
import ManualEmailDialog from './ManualEmailDialog';

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
  payment_method?: string;
  invoice_id?: string | null;
  invoice_link?: string | null;
  cleaner: number | null;
  customer: number;
  cleaner_pay: number | null;
  total_hours: number | null;
  linen_management?: boolean;
  additional_details?: string;
  frequently?: string;
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
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  cleanerId: string;
}

interface UpcomingBookingsProps {
  dashboardDateFilter?: {
    dateFrom: string;
    dateTo: string;
  };
}

const UpcomingBookings = ({ dashboardDateFilter }: UpcomingBookingsProps) => {
  const navigate = useNavigate();
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
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    cleanerId: 'all',
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);
  const [assignCleanerOpen, setAssignCleanerOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedBookingForDuplicate, setSelectedBookingForDuplicate] = useState<Booking | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);
  const [convertToRecurringOpen, setConvertToRecurringOpen] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [showConvertToRecurringDialog, setShowConvertToRecurringDialog] = useState(false);
  const [selectedBookingForRecurring, setSelectedBookingForRecurring] = useState<Booking | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedBookingForEmail, setSelectedBookingForEmail] = useState<Booking | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [invoilessDialogOpen, setInvoilessDialogOpen] = useState(false);
  const [selectedBookingForInvoiless, setSelectedBookingForInvoiless] = useState<Booking | null>(null);
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

    // Apply date filters
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

    // Apply cleaner filter
    if (filters.cleanerId && filters.cleanerId !== 'all') {
      filtered = filtered.filter(booking => 
        booking.cleaner === parseInt(filters.cleanerId)
      );
    }

    // Apply search term - searches in customer name, email, phone, address
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchLower) ||
        booking.email.toLowerCase().includes(searchLower) ||
        booking.phone_number?.toLowerCase().includes(searchLower) ||
        booking.address?.toLowerCase().includes(searchLower) ||
        booking.postcode?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      cleanerId: 'all',
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
    if (booking.payment_method === 'Invoiless') {
      setSelectedBookingForInvoiless(booking);
      setInvoilessDialogOpen(true);
    } else {
      setSelectedBookingForPayment(booking);
      setPaymentDialogOpen(true);
    }
  };

  const handleMakeRecurring = (booking: Booking) => {
    setSelectedBookingForRecurring(booking);
    setShowConvertToRecurringDialog(true);
  };

  const handleSendEmail = (booking: Booking) => {
    setSelectedBookingForEmail(booking);
    setShowEmailDialog(true);
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

  const hasActiveFilters = filters.searchTerm || filters.dateFrom || filters.dateTo || 
                          (filters.cleanerId && filters.cleanerId !== 'all');

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
        <div className="bg-gradient-to-r from-red-50 to-rose-100 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
            <span className="text-red-800 font-semibold">
              {unassignedBookings.length} unassigned booking{unassignedBookings.length > 1 ? 's' : ''} require{unassignedBookings.length === 1 ? 's' : ''} attention
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <UpcomingBookingsFilters
        filters={filters}
        onFiltersChange={setFilters}
        cleaners={cleaners}
      />

      {/* View Controls */}
      <BookingsViewControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(count) => {
          setItemsPerPage(count);
          setCurrentPage(1);
        }}
        totalItems={filteredBookings.length}
        currentRange={{
          start: startIndex + 1,
          end: Math.min(startIndex + itemsPerPage, filteredBookings.length)
        }}
      />

      {/* Bulk Edit Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => navigate('/bulk-edit-bookings')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-sm h-10 px-4"
        >
          <Settings className="h-4 w-4" />
          <span>Bulk Edit</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          {viewMode === 'list' ? (
            <div>
              {/* Mobile cards */}
              <div className="md:hidden space-y-3 p-2">
                {paginatedBookings.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">No bookings found</div>
                ) : (
                  paginatedBookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className={`rounded-lg border bg-white p-3 shadow-sm ${
                        booking.frequently === 'Same Day' ? 'border-l-4 border-l-orange-500 bg-orange-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{format(new Date(booking.date_time), 'dd/MM/yy')}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(booking.date_time), 'HH:mm')}{booking.total_hours ? ` • ${booking.total_hours}h` : ''}
                          </div>
                          {booking.postcode && (
                            <div 
                              className="mt-1 text-xs text-gray-600 line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                              onClick={() => {
                                navigator.clipboard.writeText(booking.postcode);
                                toast({ title: "Postcode copied!" });
                              }}
                              title="Click to copy postcode"
                            >
                              {booking.postcode}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <PaymentStatusIndicator 
                            status={booking.payment_status} 
                            isClickable={true}
                            onClick={() => handlePaymentAction(booking)}
                            size="sm"
                          />
                          <span className="font-semibold text-sm whitespace-nowrap">£{booking.total_cost?.toFixed(2) || '0.00'}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 bg-white z-50">
                              <DropdownMenuItem onClick={() => handleEdit(booking.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(booking)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignCleaner(booking.id)}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Assign Cleaner
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMakeRecurring(booking)}>
                                <Repeat className="w-4 h-4 mr-2" />
                                Make Recurring
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendEmail(booking)}>
                                <Send className="w-4 h-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handlePaymentAction(booking)}>
                <DollarSign className="w-4 h-4 mr-2" />
                {booking.payment_method === 'Invoiless' ? 'Manage Invoice' : 'Manage Payment'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleCancel(booking.id)} className="text-orange-600">
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(booking.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="font-medium text-sm truncate">{booking.first_name} {booking.last_name}</div>
                        {booking.email && (
                          <div 
                            className="text-xs text-gray-500 truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(booking.email);
                              toast({ title: "Email copied!" });
                            }}
                            title="Click to copy email"
                          >
                            {booking.email}
                          </div>
                        )}
                        {booking.phone_number && (
                          <div 
                            className="text-xs text-gray-500 truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(booking.phone_number);
                              toast({ title: "Phone copied!" });
                            }}
                            title="Click to copy phone"
                          >
                            {booking.phone_number}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                          {booking.cleaning_type || 'Standard Cleaning'}
                        </span>
                        {booking.frequently === 'Same Day' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500 text-white">
                            Same Day
                          </span>
                        )}
                        {!booking.cleaner ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                            Unassigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-700">
                            <User className="h-3 w-3" />
                            {getCleanerName(booking)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto -mx-0">
              <Table className="min-w-full text-sm">
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-sm sm:text-base whitespace-nowrap">Date & Time</TableHead>
                    <TableHead className="font-semibold text-sm sm:text-base">Customer</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-sm sm:text-base">Address</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-sm sm:text-base">Service</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-sm sm:text-base">Cleaner</TableHead>
                    <TableHead className="font-semibold text-sm sm:text-base whitespace-nowrap">Cost</TableHead>
                    <TableHead className="text-center font-semibold text-sm sm:text-base whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 sm:py-8 text-gray-500 text-sm">
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
                          className={`hover:bg-gray-50 transition-colors ${
                            booking.frequently === 'Same Day' ? 'border-l-4 border-l-orange-500 bg-orange-50/30' : ''
                          }`}
                        >
                          <TableCell className="py-2 px-2 sm:px-4">
                            <div className="flex items-start space-x-2">
                              <div className="flex flex-col items-center space-y-0.5">
                                <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-sm whitespace-nowrap">
                                  {format(new Date(booking.date_time), 'dd/MM/yy')}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {format(new Date(booking.date_time), 'HH:mm')}
                                </div>
                                {booking.total_hours && (
                                  <div className="text-xs text-gray-600 font-medium">
                                    {booking.total_hours}h
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[120px] py-2 px-2 sm:px-4">
                            <div className="space-y-0.5">
                              <div className="font-medium text-sm flex items-center">
                                <User className="h-3 w-3 mr-1.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{booking.first_name} {booking.last_name}</span>
                              </div>
                              <div 
                                className="text-xs text-gray-500 flex items-center cursor-pointer hover:text-primary transition-colors"
                                onClick={() => {
                                  navigator.clipboard.writeText(booking.email);
                                  toast({ title: "Email copied!" });
                                }}
                                title="Click to copy email"
                              >
                                <Mail className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                <span className="truncate">
                                  {booking.email.length > 15 ? `${booking.email.substring(0, 15)}...` : booking.email}
                                </span>
                              </div>
                              <div 
                                className="text-xs text-gray-500 flex items-center cursor-pointer hover:text-primary transition-colors"
                                onClick={() => {
                                  navigator.clipboard.writeText(booking.phone_number);
                                  toast({ title: "Phone copied!" });
                                }}
                                title="Click to copy phone"
                              >
                                <Phone className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                <span className="truncate">{booking.phone_number}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-[180px]">
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                              <div className="text-sm text-gray-700 leading-tight">
                                <div 
                                  className="text-gray-500 font-medium cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => {
                                    navigator.clipboard.writeText(booking.postcode);
                                    toast({ title: "Postcode copied!" });
                                  }}
                                  title="Click to copy postcode"
                                >
                                  {booking.postcode}
                                </div>
                                <div 
                                  className="truncate cursor-pointer hover:text-primary transition-colors" 
                                  onClick={() => {
                                    navigator.clipboard.writeText(booking.address);
                                    toast({ title: "Address copied!" });
                                  }}
                                  title="Click to copy address"
                                >
                                  {booking.address.length > 25 ? `${booking.address.substring(0, 25)}...` : booking.address}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {booking.cleaning_type || 'Standard Cleaning'}
                              </span>
                              {booking.frequently === 'Same Day' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-orange-500 text-white">
                                  Same Day
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
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
                          <TableCell className="py-2 px-2 sm:px-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center space-x-1.5">
                                <PaymentStatusIndicator 
                                  status={booking.payment_status} 
                                  isClickable={true}
                                  onClick={() => handlePaymentAction(booking)}
                                  size="sm"
                                />
                                <span className="font-semibold text-sm whitespace-nowrap">
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
                          <TableCell className="py-2 px-2 sm:px-4">
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-100">
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
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSendEmail(booking);
                                      }}
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      Send Email
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePaymentAction(booking);
                      }}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      {booking.payment_method === 'Invoiless' ? 'Manage Invoice' : 'Manage Payment'}
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

      <InvoilessPaymentDialog
        booking={selectedBookingForInvoiless || {} as any}
        isOpen={invoilessDialogOpen}
        bookingType="upcoming"
        onClose={() => {
          setInvoilessDialogOpen(false);
          setSelectedBookingForInvoiless(null);
        }}
        onSuccess={() => {
          fetchData();
          setInvoilessDialogOpen(false);
          setSelectedBookingForInvoiless(null);
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

      {selectedBookingForEmail && (
        <ManualEmailDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          booking={selectedBookingForEmail}
        />
      )}
    </div>
  );
};

export default UpcomingBookings;
