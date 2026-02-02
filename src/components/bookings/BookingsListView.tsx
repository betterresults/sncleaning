import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Edit, Trash2, Copy, X, UserPlus, DollarSign, Repeat, MoreHorizontal, MapPin, User, Mail, Phone, Send, Calendar, Camera, FileText, CreditCard, Users, Tag } from 'lucide-react';
import PaymentStatusIndicator from '@/components/payments/PaymentStatusIndicator';
import ManualPaymentDialog from '@/components/payments/ManualPaymentDialog';
import InvoilessInvoiceDialog from '@/components/payments/InvoilessInvoiceDialog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AuthorizeRemainingAmountDialog } from '@/components/payments/AuthorizeRemainingAmountDialog';
import { UpcomingBookingsFilters } from '@/components/bookings/UpcomingBookingsFilters';
import DomesticBookingDetails from '@/components/bookings/DomesticBookingDetails';

import EditBookingDialog from '../dashboard/EditBookingDialog';
import AssignCleanerDialog from '../dashboard/AssignCleanerDialog';
import DuplicateBookingDialog from '../dashboard/DuplicateBookingDialog';
import ConvertToRecurringDialog from '../dashboard/ConvertToRecurringDialog';
import ManualEmailDialog from '../dashboard/ManualEmailDialog';
import { BookingInvoiceDialog } from '@/components/bookings/BookingInvoiceDialog';
import SetCustomerSourceDialog from '@/components/bookings/SetCustomerSourceDialog';
import { useServiceTypes, useCleaningTypes, getServiceTypeBadgeColor as getBadgeColor } from '@/hooks/useCompanySettings';

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
  cleaner_rate?: number | null;
  total_hours: number | null;
  hours_required?: number | null;
  recommended_hours?: number | null;
  ironing_hours?: number | null;
  linen_management?: boolean;
  additional_details?: string;
  frequently?: string;
  booking_status?: string;
  has_photos?: boolean;
  same_day?: boolean;
  sub_cleaners_count?: number;
  sub_cleaners_total_pay?: number;
  customer_source?: string | null;
  // Additional fields for domestic booking details
  property_details?: string | null;
  oven_size?: string | null;
  access?: string | null;
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

interface TodayBookingsCardsProps {
  dashboardDateFilter?: {
    dateFrom: string;
    dateTo: string;
  };
  initialCleanerFilter?: string;
  filterBySubmissionDate?: boolean; // If true, filter by date_submited instead of date_time
}

const BookingsListView = ({ dashboardDateFilter, initialCleanerFilter, filterBySubmissionDate = false }: TodayBookingsCardsProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [customerSourceMap, setCustomerSourceMap] = useState<Record<number, string>>({});
  const [customersWithPaymentMethods, setCustomersWithPaymentMethods] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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
  const [selectedBookingForRecurring, setSelectedBookingForRecurring] = useState<Booking | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedBookingForEmail, setSelectedBookingForEmail] = useState<Booking | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [invoiceSendDialogOpen, setInvoiceSendDialogOpen] = useState(false);
  const [selectedBookingForInvoiceSend, setSelectedBookingForInvoiceSend] = useState<Booking | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<Booking | null>(null);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [selectedBookingForSource, setSelectedBookingForSource] = useState<Booking | null>(null);
  const { toast } = useToast();
  
  // Fetch service/cleaning types for labels and badge colors
  const { data: serviceTypes } = useServiceTypes();
  const { data: cleaningTypes } = useCleaningTypes();

  const humanize = (val?: string | null) => {
    if (!val) return '';
    return val
      .split('_')
      .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');
  };

  const getServiceTypeLabel = (key?: string | null) => {
    if (!key) return '';
    const found = serviceTypes?.find(st => st.key === key);
    return found?.label ?? humanize(key);
  };

  const getCleaningTypeLabel = (key?: string | null) => {
    if (!key) return '';
    const found = cleaningTypes?.find(ct => ct.key === key);
    return found?.label ?? humanize(key);
  };
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
          time_only,
          property_details,
          oven_size,
          access,
          hours_required,
          recommended_hours,
          ironing_hours,
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

      if (dashboardDateFilter) {
        if (filterBySubmissionDate) {
          // Filter by date_submited (when booking was created)
          // date_submited is stored as text, so we need to handle it differently
          const dateFrom = dashboardDateFilter.dateFrom.split('T')[0];
          const dateTo = dashboardDateFilter.dateTo.split('T')[0];
          bookingsQuery = bookingsQuery
            .gte('date_submited', dateFrom)
            .lte('date_submited', dateTo + 'T23:59:59');
        } else {
          // Filter by date_time (scheduled booking date)
          bookingsQuery = bookingsQuery
            .gte('date_time', dashboardDateFilter.dateFrom)
            .lte('date_time', dashboardDateFilter.dateTo);
        }
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery
        .order('date_time', { ascending: true });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to load bookings: ' + bookingsError.message);
        return;
      }

      // Fetch all cleaners data from cleaner_payments table (both primary and additional)
      const bookingIds = (bookingsData || []).map(b => b.id);
      let primaryCleanersData: Record<number, { cleanerId: number; calculatedPay: number }> = {};
      let additionalCleanersData: Record<number, { count: number; totalPay: number; totalHours: number }> = {};
      
      if (bookingIds.length > 0) {
        const { data: bookingCleanersData } = await supabase
          .from('cleaner_payments')
          .select('booking_id, cleaner_id, calculated_pay, hours_assigned, is_primary')
          .in('booking_id', bookingIds);
        
        if (bookingCleanersData) {
          bookingCleanersData.forEach(cleaner => {
            if (cleaner.is_primary) {
              // Store primary cleaner data
              primaryCleanersData[cleaner.booking_id] = {
                cleanerId: cleaner.cleaner_id,
                calculatedPay: cleaner.calculated_pay || 0
              };
            } else {
              // Aggregate additional cleaners data
              if (!additionalCleanersData[cleaner.booking_id]) {
                additionalCleanersData[cleaner.booking_id] = { count: 0, totalPay: 0, totalHours: 0 };
              }
              additionalCleanersData[cleaner.booking_id].count += 1;
              additionalCleanersData[cleaner.booking_id].totalPay += cleaner.calculated_pay || 0;
              additionalCleanersData[cleaner.booking_id].totalHours += cleaner.hours_assigned || 0;
            }
          });
        }
      }

      // Merge cleaners data into bookings - use cleaner_payments table as primary source
      const enrichedBookings = (bookingsData || []).map(booking => {
        const primaryData = primaryCleanersData[booking.id];
        const additionalData = additionalCleanersData[booking.id];
        
        // Use calculated_pay from cleaner_payments if available, otherwise fall back to bookings table
        const cleanerPay = primaryData ? primaryData.calculatedPay : (booking.cleaner_pay || 0);
        
        return {
          ...booking,
          cleaner_pay: cleanerPay,
          sub_cleaners_count: additionalData?.count || 0,
          sub_cleaners_total_pay: additionalData?.totalPay || 0
        };
      });

      // Fetch cleaners for filter dropdown (only when showing all bookings)
      if (!dashboardDateFilter) {
        const { data: cleanersData, error: cleanersError } = await supabase
          .from('cleaners')
          .select('id, first_name, last_name')
          .order('first_name');

        if (cleanersError) {
          console.error('Error fetching cleaners:', cleanersError);
        } else {
          setCleaners(cleanersData || []);
        }
      }

      // Always fetch customer sources for source display and filtering
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, source');
      
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
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch payment methods for customers in bookings
  const fetchPaymentMethods = async (customerIds: number[]) => {
    if (customerIds.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('customer_payment_methods')
        .select('customer_id')
        .in('customer_id', customerIds);
      
      if (error) {
        console.error('Error fetching payment methods:', error);
        return;
      }
      
      const customersWithCards = new Set(data?.map(pm => pm.customer_id) || []);
      setCustomersWithPaymentMethods(customersWithCards);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
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
      if (filters.cleanerId === 'unassigned') {
        filtered = filtered.filter(booking => !booking.cleaner);
      } else {
        filtered = filtered.filter(booking => 
          booking.cleaner === parseInt(filters.cleanerId)
        );
      }
    }

    // Apply payment method filter
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      filtered = filtered.filter(booking => 
        booking.payment_method === filters.paymentMethod
      );
    }

    // Apply payment status filter
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      filtered = filtered.filter(booking => 
        booking.payment_status === filters.paymentStatus
      );
    }

    // Apply service type filter
    if (filters.serviceType && filters.serviceType !== 'all') {
      filtered = filtered.filter(booking => 
        booking.service_type === filters.serviceType
      );
    }

    // Apply cleaning type filter
    if (filters.cleaningType && filters.cleaningType !== 'all') {
      filtered = filtered.filter(booking => 
        booking.cleaning_type === filters.cleaningType
      );
    }

    // Apply booking status filter
    if (filters.bookingStatus && filters.bookingStatus !== 'all') {
      filtered = filtered.filter(booking => 
        booking.booking_status === filters.bookingStatus
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

    // Apply customer source filter
    if (filters.customerSource && filters.customerSource !== 'all') {
      filtered = filtered.filter(booking => {
        const customerId = booking.customer;
        return customerId && customerSourceMap[customerId] === filters.customerSource;
      });
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchData();
    setCurrentPage(1); // Reset to page 1 when filter changes
  }, [dashboardDateFilter]);

  // Sync cleaner filter from parent when it changes
  useEffect(() => {
    if (initialCleanerFilter && initialCleanerFilter !== filters.cleanerId) {
      setFilters(prev => ({ ...prev, cleanerId: initialCleanerFilter }));
    }
  }, [initialCleanerFilter]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  // Fetch payment methods when bookings change
  useEffect(() => {
    const customerIds = [...new Set(bookings.map(b => b.customer).filter(Boolean))];
    if (customerIds.length > 0) {
      fetchPaymentMethods(customerIds);
    }
  }, [bookings]);

  // Refresh data when page becomes visible again (e.g., after navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    const handleFocus = () => {
      fetchData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);


  const handleEdit = (bookingId: number) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBookingForEdit(booking);
      setEditDialogOpen(true);
    }
  };

  const handleDuplicate = (booking: Booking) => {
    setSelectedBookingForDuplicate(booking);
    setDuplicateDialogOpen(true);
  };

  const handleAssignCleaner = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setAssignCleanerOpen(true);
  };

  const handleMakeRecurring = (booking: Booking) => {
    setSelectedBookingForRecurring(booking);
    setConvertToRecurringOpen(true);
  };

  const handleSendEmail = (booking: Booking) => {
    setSelectedBookingForEmail(booking);
    setShowEmailDialog(true);
  };

  const handleViewInvoice = (booking: Booking) => {
    setSelectedBookingForInvoice(booking);
    setInvoiceDialogOpen(true);
  };

  const handleSetSource = (booking: Booking) => {
    setSelectedBookingForSource(booking);
    setSourceDialogOpen(true);
  };

  const handlePaymentAction = (booking: Booking) => {
    const paymentMethod = booking.payment_method?.toLowerCase() || '';
    if (paymentMethod.includes('invoiless') || paymentMethod.includes('invoice')) {
      setSelectedBookingForInvoiceSend(booking);
      setInvoiceSendDialogOpen(true);
    } else {
      setSelectedBookingForPayment(booking);
      setPaymentDialogOpen(true);
    }
  };

  const handleCancel = (bookingId: number) => {
    console.log('handleCancel called with bookingId:', bookingId);
    setBookingToCancel(bookingId);
    setCancelDialogOpen(true);
    console.log('Cancel dialog should now be open');
  };

  const confirmCancel = async () => {
    console.log('confirmCancel called with bookingToCancel:', bookingToCancel);
    if (!bookingToCancel) {
      console.log('No booking to cancel, returning');
      return;
    }

    try {
      console.log('Attempting to cancel booking...');
      
      // Update booking status to 'cancelled' - the database trigger will automatically:
      // 1. Cancel the Stripe authorization if payment_status is 'authorized'
      // 2. Move the booking to past_bookings table
      // 3. Delete it from the bookings table
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', bookingToCancel);

      if (updateError) throw updateError;

      console.log('Booking cancelled - trigger will handle Stripe cancellation and moving to past_bookings');

      toast({
        title: "Success",
        description: "Booking cancelled successfully. Payment authorization has been released.",
      });
      
      // Wait a moment for the trigger to complete before refreshing
      await new Promise(resolve => setTimeout(resolve, 1000));
      fetchData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    } finally {
      setCancelDialogOpen(false);
      setBookingToCancel(null);
    }
  };

  const handleDelete = (bookingId: number) => {
    setBookingToDelete(bookingId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;

    try {
      // Get booking details before deletion for activity log
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*, customers(first_name, last_name, email)')
        .eq('id', bookingToDelete)
        .single();

      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingToDelete);

      if (error) throw error;

      // Log deletion to activity_logs for admin notifications
      if (bookingData) {
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
      }

      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Error",
        description: "Failed to delete booking",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  const getCleanerName = (booking: Booking) => {
    if (booking.cleaners) {
      return `${booking.cleaners.first_name} ${booking.cleaners.last_name}`;
    }
    return 'Unassigned';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-md">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (bookings.length === 0 && filteredBookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className="rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-center max-w-sm">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-gray-500" />
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">No bookings for this period</p>
          <p className="text-xs text-gray-500">Select another period or create a new booking</p>
        </div>
      </div>
    );
  }

  // Determine which bookings to display
  const displayBookings = !dashboardDateFilter ? filteredBookings : bookings;

  // Pagination: 10 bookings per page
  const itemsPerPage = 10;
  const totalPages = Math.ceil(displayBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedBookings = displayBookings.slice(startIndex, endIndex);

  // Show filters only when displaying all future bookings (no dashboardDateFilter)
  const showFilters = !dashboardDateFilter;

  return (
    <div className="space-y-4">
      {/* Filters - only show for upcoming bookings page */}
      {showFilters && (
        <UpcomingBookingsFilters
          filters={filters}
          onFiltersChange={setFilters}
          cleaners={cleaners}
          availableSources={availableSources}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      )}

      {/* Cards View - Current page bookings */}
      {displayedBookings.map((booking) => {
        const isUnsigned = !booking.cleaner;
        const cleanerName = getCleanerName(booking);
        // Check if time is flexible (time_only is NULL)
        const isFlexibleTime = !booking.time_only;
        const bookingTime = isFlexibleTime 
          ? '⏰ Flexible' 
          : (booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'N/A');
        const bookingDate = booking.date_time ? format(new Date(booking.date_time), 'dd MMM') : 'N/A';
        const bookingWeekday = booking.date_time ? format(new Date(booking.date_time), 'EEE') : '';
        const serviceBadgeColor = serviceTypes ? getBadgeColor(booking.service_type, serviceTypes) : 'bg-gray-500 text-white';
        const serviceLabel = getServiceTypeLabel(booking.service_type);
        const cleaningLabel = getCleaningTypeLabel(booking.cleaning_type);

        return (
          <div
            key={booking.id} 
            className={`rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-200 border-none overflow-hidden ${
              booking.same_day
                ? 'bg-gradient-to-br from-orange-50 to-red-50'
                : 'bg-card'
            }`}
          >
            {/* Desktop Layout - 5 Equal Columns */}
            <div className="hidden lg:block">
                {/* Main Row */}
                <div className="flex items-stretch">
                  {/* Date/Time Box - Larger, more prominent */}
                  <div className="bg-primary/10 w-32 flex-shrink-0 flex items-center justify-center py-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{booking.date_time ? format(new Date(booking.date_time), 'EEEE') : ''}</div>
                      <div className="text-base font-semibold text-foreground">{booking.date_time ? format(new Date(booking.date_time), 'd MMMM') : 'N/A'}</div>
                      <div className={`text-2xl font-bold mt-1 ${isFlexibleTime ? 'text-orange-500' : 'text-primary'}`} title={isFlexibleTime ? 'Flexible arrival' : undefined}>
                        {bookingTime}
                      </div>
                      {booking.total_hours && (
                        <div className="text-sm font-bold text-primary/80 mt-0.5">
                          {booking.total_hours}h
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Content - 5 Equal Columns */}
                  <div className="flex-1 grid grid-cols-5 items-center py-3 min-w-0">
                    {/* Column 1: Customer Info */}
                    <div className="px-4">
                      <h3 className="text-base font-bold text-foreground truncate">
                        {booking.first_name} {booking.last_name}
                      </h3>
                      {/* Icons row - all same size (w-4 h-4) */}
                      <div className="flex items-center gap-2 mt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="p-1 hover:bg-accent rounded transition-colors">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{booking.phone_number}</span>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(booking.phone_number); toast({ title: "Copied" }); }}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="p-1 hover:bg-accent rounded transition-colors">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{booking.email}</span>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(booking.email); toast({ title: "Copied" }); }}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                        {customersWithPaymentMethods.has(booking.customer) && (
                          <span title="Card on file" className="p-1">
                            <CreditCard className="w-4 h-4 text-green-600" />
                          </span>
                        )}
                        {booking.has_photos && (
                          <span title="Has photos" className="p-1">
                            <Camera className="w-4 h-4 text-green-600" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Address - Multiple lines, same style */}
                    <div className="px-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm text-foreground leading-snug">{booking.address}</div>
                          <div className="text-sm text-foreground">{booking.postcode}</div>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Service Type + Frequency */}
                    <div className="px-4">
                      <Badge className={`${serviceBadgeColor} text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap`}>
                        {serviceLabel}
                      </Badge>
                      {booking.frequently && (
                        <div className="text-sm text-muted-foreground mt-1.5 capitalize">
                          {booking.frequently.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>

                    {/* Column 4: Cleaner + Pay */}
                    <div className="px-4">
                      {!isUnsigned ? (
                        <button onClick={() => handleAssignCleaner(booking.id)} className="flex items-center gap-2 hover:bg-accent/50 rounded-lg p-1.5 -m-1.5 transition-colors">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-left min-w-0">
                            <div className="text-sm font-medium truncate">{cleanerName}</div>
                            {(booking.cleaner_pay || booking.sub_cleaners_total_pay) ? (
                              <div className="text-sm text-muted-foreground">£{((booking.cleaner_pay || 0) + (booking.sub_cleaners_total_pay || 0)).toFixed(2)}</div>
                            ) : null}
                          </div>
                          {(booking.sub_cleaners_count ?? 0) > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">+{booking.sub_cleaners_count}</Badge>
                          )}
                        </button>
                      ) : (
                        <button onClick={() => handleAssignCleaner(booking.id)} className="hover:opacity-80">
                          <Badge variant="destructive" className="text-xs font-medium px-2.5 py-1">Unassigned</Badge>
                        </button>
                      )}
                    </div>

                    {/* Column 5: Payment & Cost */}
                    <div className="px-4 flex items-center gap-3">
                      <PaymentStatusIndicator 
                        status={booking.payment_status}
                        paymentMethod={booking.payment_method}
                        isClickable={true}
                        onClick={() => handlePaymentAction(booking)}
                        size="sm"
                      />
                      <span className="text-xl font-bold text-primary">
                        £{booking.total_cost?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Actions - Green area */}
                  <div className="w-10 flex-shrink-0 bg-accent/20 flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 z-50 bg-popover">
                        <DropdownMenuItem onClick={() => handleEdit(booking.id)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(booking)}><Copy className="w-4 h-4 mr-2" />Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignCleaner(booking.id)}><UserPlus className="w-4 h-4 mr-2" />Assign Cleaner</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMakeRecurring(booking)}><Repeat className="w-4 h-4 mr-2" />Make Recurring</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendEmail(booking)}><Send className="w-4 h-4 mr-2" />Send Email</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewInvoice(booking)}><FileText className="w-4 h-4 mr-2" />View Invoice</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetSource(booking)}><Tag className="w-4 h-4 mr-2" />Set Customer Source</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handlePaymentAction(booking)}><DollarSign className="w-4 h-4 mr-2" />{booking.payment_method === 'Invoiless' ? 'Manage Invoice' : 'Manage Payment'}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleCancel(booking.id)} className="text-orange-600"><X className="w-4 h-4 mr-2" />Cancel</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(booking.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              
              {/* Expandable Domestic Booking Details */}
              <DomesticBookingDetails
                propertyDetails={booking.property_details}
                additionalDetails={booking.additional_details}
                ovenSize={booking.oven_size}
                access={booking.access}
                frequently={booking.frequently}
                serviceType={booking.service_type}
                cleaningType={booking.cleaning_type}
                totalHours={booking.total_hours}
                recommendedHours={booking.recommended_hours}
                hoursRequired={booking.hours_required}
                ironingHours={booking.ironing_hours}
                customerSource={customerSourceMap[booking.customer] || null}
                onSourceClick={() => {
                  setSelectedBookingForSource(booking);
                  setSourceDialogOpen(true);
                }}
              />
              
              {/* Hidden */}
              <div className="hidden">
                <AuthorizeRemainingAmountDialog booking={booking} onSuccess={fetchData} />
              </div>
            </div>

            {/* Mobile & Tablet Layout */}
            <div className="lg:hidden p-4 space-y-3 overflow-hidden">
              {/* Row 1: Time, Customer, Actions */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Time Box - Larger, more prominent */}
                  <div className="bg-primary/10 rounded-xl px-3 py-2.5 min-w-[80px] flex-shrink-0">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground font-semibold uppercase">{bookingWeekday}</div>
                      <div className="text-sm text-foreground font-semibold">{bookingDate}</div>
                      <div className={`text-xl font-bold ${isFlexibleTime ? 'text-orange-500' : 'text-primary'} mt-0.5`} title={isFlexibleTime ? 'Flexible arrival' : undefined}>
                        {bookingTime}
                      </div>
                      {booking.total_hours && (
                        <div className="text-xs font-bold text-primary/80">
                          {booking.total_hours}h
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Customer Name */}
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-foreground truncate">
                      {booking.first_name} {booking.last_name}
                    </h3>
                    {/* Icons row - all same size, under name */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 hover:bg-accent rounded-md transition-colors">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{booking.phone_number}</span>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(booking.phone_number); toast({ title: "Copied" }); }}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 hover:bg-accent rounded-md transition-colors">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{booking.email}</span>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(booking.email); toast({ title: "Copied" }); }}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {customersWithPaymentMethods.has(booking.customer) && (
                        <span title="Card on file" className="p-1">
                          <CreditCard className="w-4 h-4 text-green-600" />
                        </span>
                      )}
                      {booking.has_photos && (
                        <span title="Has photos" className="p-1">
                          <Camera className="w-4 h-4 text-green-600" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 z-50 bg-popover">
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
                    <DropdownMenuItem onClick={() => handleViewInvoice(booking)}>
                      <FileText className="w-4 h-4 mr-2" />
                      View Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetSource(booking)}>
                      <Tag className="w-4 h-4 mr-2" />
                      Set Customer Source
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

              {/* Row 2: Address */}
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium">{booking.address}</div>
                  <div className="text-muted-foreground">{booking.postcode}</div>
                </div>
              </div>

              {/* Row 3: Service Badge & Cleaner - Clickable */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Service badge - just service type, no cleaning type */}
                <Badge className={`${serviceBadgeColor} text-xs px-2 py-1 rounded-full`}>
                  {serviceLabel}
                </Badge>
                
                {!isUnsigned ? (
                  <button 
                    onClick={() => handleAssignCleaner(booking.id)}
                    className="flex items-center gap-2 text-sm hover:bg-accent/50 rounded-lg px-2 py-1 -ml-2 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-medium">{cleanerName}</span>
                    {(booking.sub_cleaners_count ?? 0) > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        +{booking.sub_cleaners_count}
                      </Badge>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleAssignCleaner(booking.id)}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Badge variant="destructive" className="text-xs px-2 py-1 cursor-pointer">
                      Unassigned
                    </Badge>
                  </button>
                )}
              </div>

              {/* Row 4: Payment & Cost */}
              <div className="flex items-center justify-between pt-2 border-t">
                <PaymentStatusIndicator 
                  status={booking.payment_status}
                  paymentMethod={booking.payment_method}
                  isClickable={true}
                  onClick={() => handlePaymentAction(booking)}
                  size="sm"
                />
                <span className="text-xl font-bold" style={{ color: '#18A5A5' }}>
                  £{booking.total_cost?.toFixed(2) || '0.00'}
                </span>
              </div>
              
              {/* Domestic Booking Details Section - Mobile */}
              <DomesticBookingDetails
                propertyDetails={booking.property_details}
                additionalDetails={booking.additional_details}
                ovenSize={booking.oven_size}
                access={booking.access}
                frequently={booking.frequently}
                serviceType={booking.service_type}
                cleaningType={booking.cleaning_type}
                totalHours={booking.total_hours}
                recommendedHours={booking.recommended_hours}
                hoursRequired={booking.hours_required}
                ironingHours={booking.ironing_hours}
                customerSource={customerSourceMap[booking.customer] || null}
                onSourceClick={() => {
                  setSelectedBookingForSource(booking);
                  setSourceDialogOpen(true);
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, bookings.length)} of {bookings.length} bookings
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2 px-4">
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* All Dialogs */}
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

      <InvoilessInvoiceDialog
        booking={selectedBookingForInvoiceSend}
        isOpen={invoiceSendDialogOpen}
        onClose={() => {
          setInvoiceSendDialogOpen(false);
          setSelectedBookingForInvoiceSend(null);
        }}
        onSuccess={() => {
          fetchData();
          setInvoiceSendDialogOpen(false);
          setSelectedBookingForInvoiceSend(null);
        }}
      />

      {selectedBookingForEmail && (
        <ManualEmailDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          booking={selectedBookingForEmail}
        />
      )}

      <BookingInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        booking={selectedBookingForInvoice}
      />

      {selectedBookingForSource && (
        <SetCustomerSourceDialog
          open={sourceDialogOpen}
          onOpenChange={setSourceDialogOpen}
          customerId={selectedBookingForSource.customer}
          customerName={`${selectedBookingForSource.first_name} ${selectedBookingForSource.last_name}`}
          currentSource={customerSourceMap[selectedBookingForSource.customer] || null}
          onSuccess={() => {
            fetchData();
            setSourceDialogOpen(false);
            setSelectedBookingForSource(null);
          }}
        />
      )}
    </div>
  );
};

export default BookingsListView;
