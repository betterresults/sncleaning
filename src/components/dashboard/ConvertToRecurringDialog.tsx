import { useNavigate } from 'react-router-dom';

interface ConvertToRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onSuccess: () => void;
}

const ConvertToRecurringDialog = ({ open, onOpenChange, booking, onSuccess }: ConvertToRecurringDialogProps) => {
  const navigate = useNavigate();

  // Function to extract booking data regardless of source (upcoming/past bookings)
  const extractBookingData = (booking: any) => {
    return {
      bookingId: booking.id?.toString() || '',
      customerId: booking.customer?.toString() || '',
      addressId: booking.address?.toString() || '',
      cleaningType: booking.cleaning_type || 'Standard Cleaning',
      // Use total_hours (actual billable hours) as priority, fallback to hours_required only if needed
      hours: booking.total_hours?.toString() || booking.hours_required?.toString() || '2',
      // Handle both cleaning_cost_per_hour and calculated cost
      costPerHour: booking.cleaning_cost_per_hour?.toString() || 
                   (booking.total_cost && booking.total_hours 
                     ? (parseFloat(booking.total_cost) / booking.total_hours).toString()
                     : '20'),
      totalCost: booking.total_cost?.toString() || '40',
      paymentMethod: booking.payment_method || 'Cash',
      cleanerRate: booking.cleaner_rate?.toString() || booking.cleaner_pay?.toString() || '16',
      cleaner: booking.cleaner?.toString() || ''
    };
  };

  // This component now just handles direct navigation without showing a dialog
  if (open) {
    // Extract data using the robust function
    const extractedData = extractBookingData(booking);
    
    // Navigate directly with prefilled data
    const params = new URLSearchParams({
      from: 'booking',
      ...extractedData
    });
    
    // Close the dialog and navigate
    onOpenChange(false);
    navigate(`/recurring-bookings/add?${params.toString()}`);
  }

  return null; // No UI needed anymore
};

export default ConvertToRecurringDialog;