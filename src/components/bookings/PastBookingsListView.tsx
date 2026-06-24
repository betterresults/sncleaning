import { useState, useEffect, useCallback } from 'react';
import {
  useDeletePastBooking,
  usePastBookingsListData,
  usePastBookingsListParams,
} from '@/hooks/queries/usePastBookingsListData';
import { useAuth } from '@/contexts/AuthContext';
import { PastBookingsFilters } from '@/components/bookings/PastBookingsFilters';
import { useToast } from '@/hooks/use-toast';
import { BookingsListPagination } from '@/components/bookings/list/BookingsListPagination';
import {
  BookingsListEmpty,
  BookingsListError,
  BookingsListLoading,
} from '@/components/bookings/list/BookingsListStates';
import { applyPastBookingsListFilters } from './past/list/applyPastBookingsListFilters';
import { PastBookingsListCard } from './past/list/PastBookingsListCard';
import { PastBookingsListDialogs } from './past/list/PastBookingsListDialogs';
import { PastBookingsListStats } from './past/list/PastBookingsListStats';
import {
  defaultPastBookingsListFilters,
  type PastBooking,
  type PastBookingsListCardHandlers,
  type PastBookingsListFilters,
  type PastBookingsListViewProps,
} from './past/list/types';

const PastBookingsListView = ({
  dashboardDateFilter,
  showOnlyCancelled = false,
  showStatsForAdmin = false,
}: PastBookingsListViewProps) => {
  const { user, userRole, assignedSources } = useAuth();
  const listParams = usePastBookingsListParams(
    dashboardDateFilter,
    userRole,
    user?.id,
    assignedSources,
  );
  const {
    data: listData,
    isLoading,
    isFetching,
    error: listError,
    refetch,
  } = usePastBookingsListData(listParams);
  const deletePastBookingMutation = useDeletePastBooking();
  const { toast } = useToast();

  const bookings = listData?.bookings ?? [];
  const cleaners = listData?.cleaners ?? [];
  const customerSourceMap = listData?.customerSourceMap ?? {};
  const availableSources = listData?.availableSources ?? [];
  const loading = isLoading;
  const isRefreshing = isFetching && !isLoading;
  const error = listError?.message ?? null;

  const [filteredBookings, setFilteredBookings] = useState<PastBooking[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<PastBookingsListFilters>(
    defaultPastBookingsListFilters(showOnlyCancelled),
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<PastBooking | null>(null);
  const [assignCleanerOpen, setAssignCleanerOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedBookingForDuplicate, setSelectedBookingForDuplicate] = useState<PastBooking | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);
  const [convertToRecurringOpen, setConvertToRecurringOpen] = useState(false);
  const [selectedBookingForRecurring, setSelectedBookingForRecurring] = useState<PastBooking | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedBookingForEmail, setSelectedBookingForEmail] = useState<PastBooking | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<PastBooking | null>(null);
  const [invoilessDialogOpen, setInvoilessDialogOpen] = useState(false);
  const [selectedBookingForInvoiless, setSelectedBookingForInvoiless] = useState<PastBooking | null>(null);
  const [photoManagementOpen, setPhotoManagementOpen] = useState(false);
  const [selectedBookingForPhotos, setSelectedBookingForPhotos] = useState<PastBooking | null>(null);

  const refreshBookings = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dashboardDateFilter, userRole, assignedSources]);

  useEffect(() => {
    setFilteredBookings(applyPastBookingsListFilters(bookings, filters, customerSourceMap));
    setCurrentPage(1);
  }, [bookings, filters, customerSourceMap]);

  const handleEdit = (bookingId: number) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setSelectedBookingForEdit(booking);
      setEditDialogOpen(true);
    }
  };

  const handleDuplicate = (booking: PastBooking) => {
    setSelectedBookingForDuplicate(booking);
    setDuplicateDialogOpen(true);
  };

  const handleAssignCleaner = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setAssignCleanerOpen(true);
  };

  const handleMakeRecurring = (booking: PastBooking) => {
    setSelectedBookingForRecurring(booking);
    setConvertToRecurringOpen(true);
  };

  const handleSendEmail = (booking: PastBooking) => {
    setSelectedBookingForEmail(booking);
    setShowEmailDialog(true);
  };

  const handlePaymentAction = (booking: PastBooking) => {
    const paymentMethod = booking.payment_method?.toLowerCase() || '';
    if (paymentMethod.includes('invoiless') || paymentMethod.includes('invoice')) {
      setSelectedBookingForInvoiless(booking);
      setInvoilessDialogOpen(true);
    } else {
      setSelectedBookingForPayment(booking);
      setPaymentDialogOpen(true);
    }
  };

  const handlePhotoManagement = (booking: PastBooking) => {
    setSelectedBookingForPhotos(booking);
    setPhotoManagementOpen(true);
  };

  const handleDelete = (bookingId: number) => {
    setBookingToDelete(bookingId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;

    try {
      await deletePastBookingMutation.mutateAsync(bookingToDelete);
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

  const cardHandlers: PastBookingsListCardHandlers = {
    onEdit: handleEdit,
    onDuplicate: handleDuplicate,
    onAssignCleaner: handleAssignCleaner,
    onMakeRecurring: handleMakeRecurring,
    onSendEmail: handleSendEmail,
    onPhotoManagement: handlePhotoManagement,
    onPaymentAction: handlePaymentAction,
    onDelete: handleDelete,
  };

  if (loading) return <BookingsListLoading />;
  if (error) return <BookingsListError message={error} />;
  if (bookings.length === 0 && filteredBookings.length === 0) return <BookingsListEmpty />;

  const displayBookings = !dashboardDateFilter ? filteredBookings : bookings;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(displayBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedBookings = displayBookings.slice(startIndex, endIndex);
  const showFilters = !dashboardDateFilter;

  return (
    <div className="space-y-4">
      {showFilters && !showOnlyCancelled && showStatsForAdmin && (
        <PastBookingsListStats bookings={displayBookings} />
      )}

      {showFilters && (
        <PastBookingsFilters
          filters={filters}
          onFiltersChange={setFilters}
          cleaners={cleaners}
          availableSources={availableSources}
          onRefresh={refreshBookings}
          isRefreshing={isRefreshing}
          showOnlyCancelled={showOnlyCancelled}
        />
      )}

      {displayedBookings.map((booking) => (
        <PastBookingsListCard key={booking.id} booking={booking} handlers={cardHandlers} />
      ))}

      <BookingsListPagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={displayBookings.length}
        onPageChange={setCurrentPage}
      />

      <PastBookingsListDialogs
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
        convertToRecurringOpen={convertToRecurringOpen}
        setConvertToRecurringOpen={setConvertToRecurringOpen}
        selectedBookingForRecurring={selectedBookingForRecurring}
        paymentDialogOpen={paymentDialogOpen}
        setPaymentDialogOpen={setPaymentDialogOpen}
        selectedBookingForPayment={selectedBookingForPayment}
        setSelectedBookingForPayment={setSelectedBookingForPayment}
        invoilessDialogOpen={invoilessDialogOpen}
        setInvoilessDialogOpen={setInvoilessDialogOpen}
        selectedBookingForInvoiless={selectedBookingForInvoiless}
        setSelectedBookingForInvoiless={setSelectedBookingForInvoiless}
        photoManagementOpen={photoManagementOpen}
        setPhotoManagementOpen={setPhotoManagementOpen}
        selectedBookingForPhotos={selectedBookingForPhotos}
        showEmailDialog={showEmailDialog}
        setShowEmailDialog={setShowEmailDialog}
        selectedBookingForEmail={selectedBookingForEmail}
        onRefresh={refreshBookings}
      />
    </div>
  );
};

export default PastBookingsListView;
