import ManualPaymentDialog from '@/components/payments/ManualPaymentDialog';
import { InvoilessPaymentDialog } from '@/components/payments/InvoilessPaymentDialog';
import EditPastBookingDialog from '@/components/dashboard/EditPastBookingDialog';
import AssignCleanerToPastBookingDialog from '@/components/dashboard/AssignCleanerToPastBookingDialog';
import DuplicateBookingDialog from '@/components/dashboard/DuplicateBookingDialog';
import ConvertToRecurringDialog from '@/components/dashboard/ConvertToRecurringDialog';
import ManualEmailDialog from '@/components/dashboard/ManualEmailDialog';
import PhotoManagementDialog from '@/components/dashboard/PhotoManagementDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { PastBooking } from './types';

export interface PastBookingsListDialogsProps {
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  selectedBookingForEdit: PastBooking | null;
  assignCleanerOpen: boolean;
  setAssignCleanerOpen: (open: boolean) => void;
  selectedBookingId: number | null;
  duplicateDialogOpen: boolean;
  setDuplicateDialogOpen: (open: boolean) => void;
  selectedBookingForDuplicate: PastBooking | null;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  onConfirmDelete: () => void;
  convertToRecurringOpen: boolean;
  setConvertToRecurringOpen: (open: boolean) => void;
  selectedBookingForRecurring: PastBooking | null;
  paymentDialogOpen: boolean;
  setPaymentDialogOpen: (open: boolean) => void;
  selectedBookingForPayment: PastBooking | null;
  setSelectedBookingForPayment: (booking: PastBooking | null) => void;
  invoilessDialogOpen: boolean;
  setInvoilessDialogOpen: (open: boolean) => void;
  selectedBookingForInvoiless: PastBooking | null;
  setSelectedBookingForInvoiless: (booking: PastBooking | null) => void;
  photoManagementOpen: boolean;
  setPhotoManagementOpen: (open: boolean) => void;
  selectedBookingForPhotos: PastBooking | null;
  showEmailDialog: boolean;
  setShowEmailDialog: (open: boolean) => void;
  selectedBookingForEmail: PastBooking | null;
  onRefresh: () => void;
}

export function PastBookingsListDialogs({
  editDialogOpen,
  setEditDialogOpen,
  selectedBookingForEdit,
  assignCleanerOpen,
  setAssignCleanerOpen,
  selectedBookingId,
  duplicateDialogOpen,
  setDuplicateDialogOpen,
  selectedBookingForDuplicate,
  deleteDialogOpen,
  setDeleteDialogOpen,
  onConfirmDelete,
  convertToRecurringOpen,
  setConvertToRecurringOpen,
  selectedBookingForRecurring,
  paymentDialogOpen,
  setPaymentDialogOpen,
  selectedBookingForPayment,
  setSelectedBookingForPayment,
  invoilessDialogOpen,
  setInvoilessDialogOpen,
  selectedBookingForInvoiless,
  setSelectedBookingForInvoiless,
  photoManagementOpen,
  setPhotoManagementOpen,
  selectedBookingForPhotos,
  showEmailDialog,
  setShowEmailDialog,
  selectedBookingForEmail,
  onRefresh,
}: PastBookingsListDialogsProps) {
  return (
    <>
      <EditPastBookingDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        booking={selectedBookingForEdit as Parameters<typeof EditPastBookingDialog>[0]['booking']}
        onBookingUpdated={onRefresh}
      />

      <AssignCleanerToPastBookingDialog
        bookingId={selectedBookingId}
        open={assignCleanerOpen}
        onOpenChange={setAssignCleanerOpen}
        onSuccess={onRefresh}
      />

      <DuplicateBookingDialog
        booking={selectedBookingForDuplicate as unknown as Parameters<typeof DuplicateBookingDialog>[0]['booking']}
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        onSuccess={onRefresh}
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
            <AlertDialogAction onClick={onConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConvertToRecurringDialog
        open={convertToRecurringOpen}
        onOpenChange={setConvertToRecurringOpen}
        booking={selectedBookingForRecurring as Parameters<typeof ConvertToRecurringDialog>[0]['booking']}
        onSuccess={onRefresh}
      />

      <ManualPaymentDialog
        booking={selectedBookingForPayment as unknown as Parameters<typeof ManualPaymentDialog>[0]['booking']}
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
        onSuccess={() => {
          onRefresh();
          setPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
      />

      {selectedBookingForInvoiless && (
        <InvoilessPaymentDialog
          booking={selectedBookingForInvoiless as Parameters<typeof InvoilessPaymentDialog>[0]['booking']}
          isOpen={invoilessDialogOpen}
          bookingType="past"
          onClose={() => {
            setInvoilessDialogOpen(false);
            setSelectedBookingForInvoiless(null);
          }}
          onSuccess={() => {
            onRefresh();
            setInvoilessDialogOpen(false);
            setSelectedBookingForInvoiless(null);
          }}
        />
      )}

      {selectedBookingForPhotos && (
        <PhotoManagementDialog
          open={photoManagementOpen}
          onOpenChange={setPhotoManagementOpen}
          booking={{
            id: selectedBookingForPhotos.id,
            customer: selectedBookingForPhotos.customer,
            cleaner: selectedBookingForPhotos.cleaner || 0,
            date_time: selectedBookingForPhotos.date_time,
            postcode: selectedBookingForPhotos.postcode,
            first_name: selectedBookingForPhotos.first_name,
            last_name: selectedBookingForPhotos.last_name,
          }}
        />
      )}

      {selectedBookingForEmail && (
        <ManualEmailDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          booking={selectedBookingForEmail as unknown as Parameters<typeof ManualEmailDialog>[0]['booking']}
        />
      )}
    </>
  );
}
