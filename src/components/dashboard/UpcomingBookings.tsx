import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  useCancelBooking,
  useDeleteBooking,
} from '@/hooks/queries/useBookingsListData';
import { useUpcomingBookingsCalendarData } from '@/hooks/queries/useUpcomingBookingsCalendar';
import type { UpcomingCalendarBooking } from '@/api/bookings';
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
import { BookingsViewControls, BookedFilterType } from '@/components/bookings/BookingsViewControls';

import BookingsListView from '@/components/bookings/BookingsListView';
import EditBookingDialog from './EditBookingDialog';
import AssignCleanerDialog from './AssignCleanerDialog';
import DuplicateBookingDialog from './DuplicateBookingDialog';
import ConvertToRecurringDialog from './ConvertToRecurringDialog';
import DayBookingsDialog from './DayBookingsDialog';
import ManualEmailDialog from './ManualEmailDialog';

interface Booking extends UpcomingCalendarBooking {}

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
  const { user, userRole, assignedSources } = useAuth();
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
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
  const [bookedFilter, setBookedFilter] = useState<BookedFilterType>('none');
  const { toast } = useToast();
  const cancelBookingMutation = useCancelBooking();
  const deleteBookingMutation = useDeleteBooking();

  const calendarParams = useMemo(
    () => ({
      dashboardDateFilter,
      sortOrder,
      userRole,
      userId: user?.id,
      assignedSources,
    }),
    [dashboardDateFilter, sortOrder, userRole, user?.id, assignedSources],
  );

  const {
    data: calendarData,
    isLoading: loading,
    error: calendarError,
    refetch: refetchCalendarData,
  } = useUpcomingBookingsCalendarData(calendarParams, viewMode !== 'list');

  const bookings = calendarData?.bookings ?? [];
  const cleaners = calendarData?.cleaners ?? [];
  const availableSources = calendarData?.availableSources ?? [];
  const customerSourceMap = calendarData?.customerSourceMap ?? {};
  const error = calendarError ? calendarError.message : null;

  // Setup calendar localizer
  const localizer = momentLocalizer(moment);

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
      await deleteBookingMutation.mutateAsync(bookingToDelete);
      toast({
        title: 'Success',
        description: 'Booking deleted successfully!',
      });
      refetchCalendarData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while deleting the booking.',
        variant: 'destructive',
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
      await cancelBookingMutation.mutateAsync(bookingToCancel);
      toast({
        title: 'Booking cancelled',
        description:
          'The booking has been successfully cancelled. Payment authorization has been released.',
      });
      refetchCalendarData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
        variant: 'destructive',
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
    applyFilters();
  }, [bookings, filters, customerSourceMap]);

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

  if (viewMode !== 'list' && loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading bookings...</div>
      </div>
    );
  }

  if (viewMode !== 'list' && error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => refetchCalendarData()}>
          Retry
        </Button>
      </div>
    );
  }

  // Calculate unassigned bookings (calendar view only)
  const unassignedBookings =
    viewMode !== 'list' ? filteredBookings.filter((booking) => !booking.cleaner) : [];

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
        bookedFilter={bookedFilter}
        onBookedFilterChange={setBookedFilter}
      />

      <div className="bg-white rounded-xl border-0 shadow-sm overflow-hidden">
          {viewMode === 'list' ? (
            <BookingsListView 
              dashboardDateFilter={bookedFilter !== 'none' ? (() => {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                let dateFrom: Date;
                const dateTo = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
                
                switch (bookedFilter) {
                  case 'today':
                    dateFrom = today;
                    break;
                  case 'yesterday':
                    dateFrom = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                    break;
                  case 'last3days':
                    dateFrom = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
                    break;
                  case 'lastweek':
                    dateFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                  case 'lastmonth':
                    dateFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                  default:
                    dateFrom = today;
                }
                
                return {
                  dateFrom: dateFrom.toISOString(),
                  dateTo: dateTo.toISOString()
                };
              })() : dashboardDateFilter}
              initialCleanerFilter={filters.cleanerId}
              filterBySubmissionDate={bookedFilter !== 'none'}
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
        onBookingUpdated={refetchCalendarData}
      />

      <AssignCleanerDialog
        bookingId={selectedBookingId}
        open={assignCleanerOpen}
        onOpenChange={setAssignCleanerOpen}
        onSuccess={refetchCalendarData}
      />

      <DuplicateBookingDialog
        booking={selectedBookingForDuplicate}
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        onSuccess={refetchCalendarData}
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
        onSuccess={refetchCalendarData}
      />

      <ManualPaymentDialog
        booking={selectedBookingForPayment}
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
        onSuccess={() => {
          refetchCalendarData();
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
          refetchCalendarData();
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
