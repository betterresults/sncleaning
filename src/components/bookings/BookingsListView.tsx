import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useBookingsListData,
  useCancelBooking,
  useCustomerPaymentMethods,
  useDeleteBooking,
} from '@/hooks/queries/useBookingsListData';
import { UpcomingBookingsFilters } from '@/components/bookings/UpcomingBookingsFilters';
import { useToast } from '@/hooks/use-toast';
import { applyBookingsListFilters } from './list/applyBookingsListFilters';
import { BookingsListCard } from './list/BookingsListCard';
import { BookingsListDialogs } from './list/BookingsListDialogs';
import { BookingsListPagination } from './list/BookingsListPagination';
import { BookingsListEmpty, BookingsListError, BookingsListLoading } from './list/BookingsListStates';
import {
  defaultBookingsListFilters,
  type Booking,
  type BookingsListCardHandlers,
  type BookingsListFilters,
  type BookingsListViewProps,
} from './list/types';

const BookingsListView = ({
  dashboardDateFilter,
  initialCleanerFilter,
  filterBySubmissionDate = false,
  showPagination = true,
  maxItems,
}: BookingsListViewProps) => {
  const listParams = useMemo(
    () => ({ dashboardDateFilter, filterBySubmissionDate }),
    [dashboardDateFilter, filterBySubmissionDate],
  );
  const {
    data: listData,
    isLoading,
    isFetching,
    error: listError,
    refetch,
  } = useBookingsListData(listParams);
  const cancelBookingMutation = useCancelBooking();
  const deleteBookingMutation = useDeleteBooking();
  const { toast } = useToast();

  const bookings = listData?.bookings ?? [];
  const cleaners = listData?.cleaners ?? [];
  const customerSourceMap = listData?.customerSourceMap ?? {};
  const availableSources = listData?.availableSources ?? [];
  const loading = isLoading;
  const isRefreshing = isFetching && !isLoading;
  const error = listError?.message ?? null;

  const customerIds = useMemo(
    () => [...new Set(bookings.map((b) => b.customer).filter(Boolean))],
    [bookings],
  );
  const { data: customersWithPaymentMethods = new Set<number>() } =
    useCustomerPaymentMethods(customerIds);

  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<BookingsListFilters>(defaultBookingsListFilters);
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

  const refreshBookings = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    setFilteredBookings(applyBookingsListFilters(bookings, filters, customerSourceMap));
    setCurrentPage(1);
  }, [bookings, filters, customerSourceMap]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dashboardDateFilter]);

  useEffect(() => {
    if (initialCleanerFilter && initialCleanerFilter !== filters.cleanerId) {
      setFilters((prev) => ({ ...prev, cleanerId: initialCleanerFilter }));
    }
  }, [initialCleanerFilter, filters.cleanerId]);

  const handleEdit = (bookingId: number) => {
    const booking = bookings.find((b) => b.id === bookingId);
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
    setBookingToCancel(bookingId);
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!bookingToCancel) return;

    try {
      await cancelBookingMutation.mutateAsync(bookingToCancel);
      toast({
        title: 'Success',
        description: 'Booking cancelled successfully. Payment authorization has been released.',
      });
    } catch (cancelError) {
      console.error('Error cancelling booking:', cancelError);
      toast({
        title: 'Error',
        description: 'Failed to cancel booking',
        variant: 'destructive',
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
      await deleteBookingMutation.mutateAsync(bookingToDelete);
      toast({
        title: 'Success',
        description: 'Booking deleted successfully',
      });
    } catch (deleteError) {
      console.error('Error deleting booking:', deleteError);
      toast({
        title: 'Error',
        description: 'Failed to delete booking',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  const cardHandlers: BookingsListCardHandlers = {
    onEdit: handleEdit,
    onDuplicate: handleDuplicate,
    onAssignCleaner: handleAssignCleaner,
    onMakeRecurring: handleMakeRecurring,
    onSendEmail: handleSendEmail,
    onViewInvoice: handleViewInvoice,
    onSetSource: handleSetSource,
    onPaymentAction: handlePaymentAction,
    onCancel: handleCancel,
    onDelete: handleDelete,
    onRefresh: refreshBookings,
  };

  if (loading) return <BookingsListLoading />;
  if (error) return <BookingsListError message={error} />;
  if (bookings.length === 0 && filteredBookings.length === 0) return <BookingsListEmpty />;

  const displayBookings = !dashboardDateFilter ? filteredBookings : bookings;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(displayBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  let displayedBookings = displayBookings.slice(startIndex, endIndex);
  if (maxItems != null) {
    displayedBookings = displayedBookings.slice(0, maxItems);
  }
  const showFilters = !dashboardDateFilter;

  return (
    <div className="space-y-3 sm:space-y-4 min-w-0">
      {showFilters && (
        <UpcomingBookingsFilters
          filters={filters}
          onFiltersChange={setFilters}
          cleaners={cleaners}
          availableSources={availableSources}
          onRefresh={refreshBookings}
          isRefreshing={isRefreshing}
        />
      )}

      {displayedBookings.map((booking) => (
        <BookingsListCard
          key={booking.id}
          booking={booking}
          customerSourceMap={customerSourceMap}
          customersWithPaymentMethods={customersWithPaymentMethods}
          handlers={cardHandlers}
        />
      ))}

      {showPagination && (
        <BookingsListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={displayBookings.length}
          onPageChange={setCurrentPage}
        />
      )}

      <BookingsListDialogs
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        selectedBookingForEdit={selectedBookingForEdit}
        assignCleanerOpen={assignCleanerOpen}
        setAssignCleanerOpen={setAssignCleanerOpen}
        selectedBookingId={selectedBookingId}
        duplicateDialogOpen={duplicateDialogOpen}
        setDuplicateDialogOpen={setDuplicateDialogOpen}
        selectedBookingForDuplicate={selectedBookingForDuplicate}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        onConfirmDelete={confirmDelete}
        cancelDialogOpen={cancelDialogOpen}
        setCancelDialogOpen={setCancelDialogOpen}
        onConfirmCancel={confirmCancel}
        convertToRecurringOpen={convertToRecurringOpen}
        setConvertToRecurringOpen={setConvertToRecurringOpen}
        selectedBookingForRecurring={selectedBookingForRecurring}
        paymentDialogOpen={paymentDialogOpen}
        setPaymentDialogOpen={setPaymentDialogOpen}
        selectedBookingForPayment={selectedBookingForPayment}
        setSelectedBookingForPayment={setSelectedBookingForPayment}
        invoiceSendDialogOpen={invoiceSendDialogOpen}
        setInvoiceSendDialogOpen={setInvoiceSendDialogOpen}
        selectedBookingForInvoiceSend={selectedBookingForInvoiceSend}
        setSelectedBookingForInvoiceSend={setSelectedBookingForInvoiceSend}
        showEmailDialog={showEmailDialog}
        setShowEmailDialog={setShowEmailDialog}
        selectedBookingForEmail={selectedBookingForEmail}
        invoiceDialogOpen={invoiceDialogOpen}
        setInvoiceDialogOpen={setInvoiceDialogOpen}
        selectedBookingForInvoice={selectedBookingForInvoice}
        sourceDialogOpen={sourceDialogOpen}
        setSourceDialogOpen={setSourceDialogOpen}
        selectedBookingForSource={selectedBookingForSource}
        setSelectedBookingForSource={setSelectedBookingForSource}
        customerSourceMap={customerSourceMap}
        onRefresh={refreshBookings}
      />
    </div>
  );
};

export default BookingsListView;
