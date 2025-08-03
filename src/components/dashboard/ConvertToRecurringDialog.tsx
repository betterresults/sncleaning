import { useNavigate } from 'react-router-dom';

interface ConvertToRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onSuccess: () => void;
}

const ConvertToRecurringDialog = ({ open, onOpenChange, booking, onSuccess }: ConvertToRecurringDialogProps) => {
  const navigate = useNavigate();

  // This component now just handles direct navigation without showing a dialog
  if (open) {
    // Navigate directly with prefilled data
    const params = new URLSearchParams({
      from: 'booking',
      bookingId: booking.id?.toString() || '',
      customerId: booking.customer?.toString() || '',
      addressId: booking.address?.toString() || '',
      cleaningType: booking.cleaning_type || 'Standard Cleaning',
      hours: booking.total_hours?.toString() || '2',
      costPerHour: booking.cleaning_cost_per_hour?.toString() || '20',
      totalCost: booking.total_cost?.toString() || '40',
      paymentMethod: booking.payment_method || 'Cash',
      cleanerRate: booking.cleaner_rate?.toString() || '16',
      cleaner: booking.cleaner?.toString() || ''
    });
    
    // Close the dialog and navigate
    onOpenChange(false);
    navigate(`/recurring-bookings/add?${params.toString()}`);
  }

  return null; // No UI needed anymore
};

export default ConvertToRecurringDialog;