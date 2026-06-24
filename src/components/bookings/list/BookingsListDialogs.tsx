import ManualPaymentDialog from '@/components/payments/ManualPaymentDialog';
import InvoilessInvoiceDialog from '@/components/payments/InvoilessInvoiceDialog';
import { BookingInvoiceDialog } from '@/components/bookings/BookingInvoiceDialog';
import SetCustomerSourceDialog from '@/components/bookings/SetCustomerSourceDialog';
import EditBookingDialog from '@/components/dashboard/EditBookingDialog';
import AssignCleanerDialog from '@/components/dashboard/AssignCleanerDialog';
import DuplicateBookingDialog from '@/components/dashboard/DuplicateBookingDialog';
import ConvertToRecurringDialog from '@/components/dashboard/ConvertToRecurringDialog';
import ManualEmailDialog from '@/components/dashboard/ManualEmailDialog';
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
import type { Booking } from './types';

export interface BookingsListDialogsProps {
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  selectedBookingForEdit: Booking | null;
  assignCleanerOpen: boolean;
  setAssignCleanerOpen: (open: boolean) => void;
  selectedBookingId: number | null;
  duplicateDialogOpen: boolean;
  setDuplicateDialogOpen: (open: boolean) => void;
  selectedBookingForDuplicate: Booking | null;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  onConfirmDelete: () => void;
  cancelDialogOpen: boolean;
  setCancelDialogOpen: (open: boolean) => void;
  onConfirmCancel: () => void;
  convertToRecurringOpen: boolean;
  setConvertToRecurringOpen: (open: boolean) => void;
  selectedBookingForRecurring: Booking | null;
  paymentDialogOpen: boolean;
  setPaymentDialogOpen: (open: boolean) => void;
  selectedBookingForPayment: Booking | null;
  setSelectedBookingForPayment: (booking: Booking | null) => void;
  invoiceSendDialogOpen: boolean;
  setInvoiceSendDialogOpen: (open: boolean) => void;
  selectedBookingForInvoiceSend: Booking | null;
  setSelectedBookingForInvoiceSend: (booking: Booking | null) => void;
  showEmailDialog: boolean;
  setShowEmailDialog: (open: boolean) => void;
  selectedBookingForEmail: Booking | null;
  invoiceDialogOpen: boolean;
  setInvoiceDialogOpen: (open: boolean) => void;
  selectedBookingForInvoice: Booking | null;
  sourceDialogOpen: boolean;
  setSourceDialogOpen: (open: boolean) => void;
  selectedBookingForSource: Booking | null;
  setSelectedBookingForSource: (booking: Booking | null) => void;
  customerSourceMap: Record<number, string>;
  onRefresh: () => void;
}

export function BookingsListDialogs({
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
  cancelDialogOpen,
  setCancelDialogOpen,
  onConfirmCancel,
  convertToRecurringOpen,
  setConvertToRecurringOpen,
  selectedBookingForRecurring,
  paymentDialogOpen,
  setPaymentDialogOpen,
  selectedBookingForPayment,
  setSelectedBookingForPayment,
  invoiceSendDialogOpen,
  setInvoiceSendDialogOpen,
  selectedBookingForInvoiceSend,
  setSelectedBookingForInvoiceSend,
  showEmailDialog,
  setShowEmailDialog,
  selectedBookingForEmail,
  invoiceDialogOpen,
  setInvoiceDialogOpen,
  selectedBookingForInvoice,
  sourceDialogOpen,
  setSourceDialogOpen,
  selectedBookingForSource,
  setSelectedBookingForSource,
  customerSourceMap,
  onRefresh,
}: BookingsListDialogsProps) {
  return (
    <>
      <EditBookingDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        booking={selectedBookingForEdit}
        onBookingUpdated={onRefresh}
      />

      <AssignCleanerDialog
        bookingId={selectedBookingId}
        open={assignCleanerOpen}
        onOpenChange={setAssignCleanerOpen}
        onSuccess={onRefresh}
      />

      <DuplicateBookingDialog
        booking={selectedBookingForDuplicate}
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
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className="bg-red-600 hover:bg-red-700">
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
            <AlertDialogAction onClick={onConfirmCancel} className="bg-orange-600 hover:bg-orange-700">
              Yes, Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConvertToRecurringDialog
        open={convertToRecurringOpen}
        onOpenChange={setConvertToRecurringOpen}
        booking={selectedBookingForRecurring}
        onSuccess={onRefresh}
      />

      <ManualPaymentDialog
        booking={selectedBookingForPayment}
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

      <InvoilessInvoiceDialog
        booking={selectedBookingForInvoiceSend}
        isOpen={invoiceSendDialogOpen}
        onClose={() => {
          setInvoiceSendDialogOpen(false);
          setSelectedBookingForInvoiceSend(null);
        }}
        onSuccess={() => {
          onRefresh();
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
            onRefresh();
            setSourceDialogOpen(false);
            setSelectedBookingForSource(null);
          }}
        />
      )}
    </>
  );
}
