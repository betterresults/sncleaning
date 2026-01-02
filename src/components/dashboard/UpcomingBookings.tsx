import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

import BookingsListView from '@/components/bookings/BookingsListView';
import EditBookingDialog from './EditBookingDialog';
import AssignCleanerDialog from './AssignCleanerDialog';
import DuplicateBookingDialog from './DuplicateBookingDialog';
import ConvertToRecurringDialog from './ConvertToRecurringDialog';
import DayBookingsDialog from './DayBookingsDialog';
import ManualEmailDialog from './ManualEmailDialog';

interface Booking {
  id: number;
  date_time: string;
  time_only?: string | null;
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
  same_day?: boolean; // Same-day Airbnb turnover flag
  // Primary cleaner from cleaner_payments (single source of truth)
  primary_cleaner?: {
    id: number;
    full_name: string;
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
  full_name?: string;
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
  paymentMethod: string;
  paymentStatus: string;
  serviceType: string;
  cleaningType: string;
  bookingStatus: string;
  customerSource: string;
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
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [customerSourceMap, setCustomerSourceMap] = useState<Record<number, string>>({});
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
    paymentMethod: 'all',
    paymentStatus: 'all',
    serviceType: 'all',
    cleaningType: 'all',
    bookingStatus: 'all',
    customerSource: 'all'
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
  const [showBookedToday, setShowBookedToday] = useState(false);
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
          time_only,
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
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery
        .order('date_time', { ascending: sortOrder === 'asc' });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to load bookings: ' + bookingsError.message);
        return;
      }

      // Fetch cleaners for dropdown
      const { data: cleanersData, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, full_name')
        .order('first_name');

      if (cleanersError) {
        console.error('Error fetching cleaners:', cleanersError);
      }

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, first_name, last_name, source')
        .order('first_name');

      if (customersError) {
        console.error('Error fetching customers:', customersError);
      }

      // SINGLE SOURCE OF TRUTH: Fetch primary cleaners from cleaner_payments
      const bookingIds = (bookingsData || []).map(b => b.id);
      let primaryCleanersMap: Record<number, { id: number; full_name: string }> = {};
      
      if (bookingIds.length > 0) {
        const { data: primaryCleanersData } = await supabase
          .from('cleaner_payments')
          .select(`
            booking_id,
            cleaner_id,
            cleaners (
              id,
              full_name
            )
          `)
          .in('booking_id', bookingIds)
          .eq('is_primary', true);

        if (primaryCleanersData) {
          primaryCleanersData.forEach(pc => {
            if (pc.cleaners) {
              primaryCleanersMap[pc.booking_id] = {
                id: pc.cleaner_id,
                full_name: pc.cleaners.full_name || 'Unknown'
              };
            }
          });
        }
      }

      // Enrich bookings with primary cleaner from cleaner_payments
      const enrichedBookings = (bookingsData || []).map(booking => ({
        ...booking,
        primary_cleaner: primaryCleanersMap[booking.id] || null
      }));

      console.log('Fetched data:', {
        bookings: enrichedBookings.length,
        cleaners: cleanersData?.length || 0,
        customers: customersData?.length || 0
      });

      // Build customer source map
      const sourceMap: Record<number, string> = {};
      const customerIdsInBookings = new Set((bookingsData || []).map((b: any) => b.customer).filter(Boolean));
      const sourcesWithBookings = new Set<string>();
      
      customersData?.forEach(c => {
        if (c.source) {
          sourceMap[c.id] = c.source;
          if (customerIdsInBookings.has(c.id)) {
            sourcesWithBookings.add(c.source);
          }
        }
      });
      
      setCustomerSourceMap(sourceMap);
      setAvailableSources(Array.from(sourcesWithBookings).sort());

      setBookings(enrichedBookings);
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

    // Apply cleaner filter - use primary_cleaner from cleaner_payments
    if (filters.cleanerId && filters.cleanerId !== 'all') {
      filtered = filtered.filter(booking => 
        booking.primary_cleaner?.id === parseInt(filters.cleanerId)
      );
    }

    // Apply customer source filter
    if (filters.customerSource && filters.customerSource !== 'all') {
      filtered = filtered.filter(booking => {
        const customerId = booking.customer;
        return customerId && customerSourceMap[customerId] === filters.customerSource;
      });
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
      paymentMethod: 'all',
      paymentStatus: 'all',
      serviceType: 'all',
      cleaningType: 'all',
      bookingStatus: 'all',
      customerSource: 'all'
    });
  };

  const getCleanerName = (booking: Booking) => {
    // Use primary_cleaner from cleaner_payments (single source of truth)
    if (booking.primary_cleaner) {
      return booking.primary_cleaner.full_name;
    }

    return 'Unassigned';
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
      // Get booking details for activity log before deletion
      const { data: bookingData, error: checkError } = await supabase
        .from('bookings')
        .select('*, customers(first_name, last_name, email)')
        .eq('id', bookingToDelete)
        .single();

      if (checkError || !bookingData) {
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
        // Log deletion to activity_logs for admin notifications
        await supabase.from('activity_logs').insert({
          action_type: 'booking_deleted',
          entity_type: 'booking',
          entity_id: bookingToDelete.toString(),
          user_role: 'admin',
          details: {
            booking_id: bookingToDelete,
            customer_name: bookingData.customers ? 
              `${bookingData.customers.first_name} ${bookingData.customers.last_name}` : 
              `${bookingData.first_name} ${bookingData.last_name}`,
            customer_email: bookingData.customers?.email || bookingData.email,
            booking_date: bookingData.date_time,
            service_type: bookingData.service_type,
            address: bookingData.address
          }
        });

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
    console.log('UpcomingBookings - handleCancel called with bookingId:', bookingId);
    setBookingToCancel(bookingId);
    setCancelDialogOpen(true);
    console.log('UpcomingBookings - Cancel dialog should now be open');
  };

  const confirmCancel = async () => {
    console.log('UpcomingBookings - confirmCancel called with bookingToCancel:', bookingToCancel);
    if (!bookingToCancel) {
      console.log('UpcomingBookings - No booking to cancel, returning');
      return;
    }
    
    try {
      console.log('UpcomingBookings - Attempting to cancel booking...');
      
      // Update booking status to 'cancelled' - the database trigger will automatically:
      // 1. Cancel the Stripe authorization if payment_status is 'authorized'
      // 2. Move the booking to past_bookings table
      // 3. Delete it from the bookings table
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', bookingToCancel);

      if (updateError) throw updateError;

      console.log('UpcomingBookings - Booking cancelled, trigger will handle Stripe and moving to past_bookings');

      toast({
        title: "Booking cancelled",
        description: "The booking has been successfully cancelled. Payment authorization has been released.",
      });

      // Wait a moment for the trigger to complete before refreshing
      await new Promise(resolve => setTimeout(resolve, 1000));
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
    const paymentMethod = booking.payment_method?.toLowerCase() || '';
    if (paymentMethod.includes('invoiless') || paymentMethod.includes('invoice')) {
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

  // Refresh data when page becomes visible again (e.g., after navigating back)
  // Only refresh if more than 30 seconds have passed since last fetch
  useEffect(() => {
    let lastFetchTime = Date.now();

    const handleVisibilityChange = () => {
      if (!document.hidden && Date.now() - lastFetchTime > 30000) {
        lastFetchTime = Date.now();
        fetchData();
      }
    };

    const handleFocus = () => {
      // Only refetch if more than 30 seconds have passed
      if (Date.now() - lastFetchTime > 30000) {
        lastFetchTime = Date.now();
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);


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
    <div className="space-y-4">
      {/* Unassigned Bookings Notification */}
      {unassignedBookings.length > 0 && (
        <div 
          className="bg-gradient-to-r from-red-50 to-rose-100 border border-red-200 rounded-xl p-4 shadow-sm cursor-pointer hover:from-red-100 hover:to-rose-150 transition-colors"
          onClick={() => {
            setFilters(prev => ({ ...prev, cleanerId: 'unassigned' }));
          }}
        >
          <div className="flex items-center justify-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
            <span className="text-red-800 font-semibold">
              {unassignedBookings.length} unassigned booking{unassignedBookings.length > 1 ? 's' : ''} require{unassignedBookings.length === 1 ? 's' : ''} attention
            </span>
            <span className="text-red-600 text-sm">(click to filter)</span>
          </div>
        </div>
      )}

      {/* Filters - Only show when NOT in list mode (list mode has its own filters) */}
      {viewMode !== 'list' && (
        <UpcomingBookingsFilters
          filters={filters}
          onFiltersChange={setFilters}
          cleaners={cleaners}
          availableSources={availableSources}
        />
      )}

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
        onBulkEditClick={() => navigate('/bulk-edit-bookings')}
        showBookedToday={showBookedToday}
        onShowBookedTodayChange={setShowBookedToday}
      />

      <div className="bg-white rounded-xl border-0 shadow-sm overflow-hidden">
          {viewMode === 'list' ? (
            <BookingsListView 
              dashboardDateFilter={showBookedToday ? (() => {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return {
                  dateFrom: today.toISOString(),
                  dateTo: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
                };
              })() : dashboardDateFilter}
              initialCleanerFilter={filters.cleanerId}
              filterBySubmissionDate={showBookedToday}
            />
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
        </div>

      {/* Only show pagination for calendar view - list view has its own pagination */}
      {viewMode !== 'list' && totalPages > 1 && (
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
