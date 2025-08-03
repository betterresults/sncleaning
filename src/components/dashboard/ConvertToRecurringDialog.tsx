import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Repeat, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ConvertToRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onSuccess: () => void;
}

const ConvertToRecurringDialog = ({ open, onOpenChange, booking, onSuccess }: ConvertToRecurringDialogProps) => {
  const navigate = useNavigate();

  const handleCreateRecurring = () => {
    // Close the dialog
    onOpenChange(false);
    
    // Navigate to the unified recurring booking form with prefilled data
    const params = new URLSearchParams({
      from: 'booking',
      bookingId: booking.id?.toString() || '',
      customerId: booking.customer?.toString() || '',
      cleaningType: booking.cleaning_type || 'Standard Cleaning',
      hours: booking.total_hours?.toString() || '2',
      costPerHour: booking.cleaning_cost_per_hour?.toString() || '20',
      totalCost: booking.total_cost?.toString() || '40',
      paymentMethod: booking.payment_method || 'Cash',
      cleanerRate: booking.cleaner_rate?.toString() || '16',
      cleaner: booking.cleaner?.toString() || ''
    });
    
    navigate(`/recurring-bookings/add?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Convert to Recurring Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info Display */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Customer Information</h3>
            <p className="text-blue-800">
              {booking?.first_name} {booking?.last_name} - {booking?.email}
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Service: {booking?.cleaning_type || 'Standard Cleaning'}
            </p>
            <p className="text-blue-600 text-sm">
              Hours: {booking?.total_hours || 'N/A'} | Cost: £{booking?.total_cost || 'N/A'}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800 text-sm">
              This will take you to the complete recurring booking form where you can set up the schedule, frequency, and all details.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRecurring}
              className="bg-green-600 hover:bg-green-700"
            >
              Continue to Form
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertToRecurringDialog;