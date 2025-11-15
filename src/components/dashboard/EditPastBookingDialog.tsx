import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePaymentMethods } from '@/hooks/useCompanySettings';

interface PastBooking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  cleaning_type: string;
  total_cost: string;
  cleaner: number;
  customer: number;
  cleaner_pay: number;
  payment_status: string;
  payment_method: string;
  booking_status: string;
  total_hours: number;
  property_details: string;
  additional_details: string;
}

interface EditPastBookingDialogProps {
  booking: PastBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingUpdated: () => void;
}

const EditPastBookingDialog: React.FC<EditPastBookingDialogProps> = ({
  booking,
  open,
  onOpenChange,
  onBookingUpdated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  
  // Fetch dynamic payment methods from company settings
  const { data: paymentMethods } = usePaymentMethods();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    postcode: '',
    cleaning_type: '',
    total_cost: '',
    total_hours: 0,
    property_details: '',
    additional_details: '',
    payment_status: '',
    payment_method: '',
    booking_status: ''
  });


  useEffect(() => {
    if (booking && open) {
      const bookingDate = new Date(booking.date_time);
      setSelectedDate(bookingDate);
      setSelectedTime(format(bookingDate, 'HH:mm'));
      
      setFormData({
        first_name: booking.first_name || '',
        last_name: booking.last_name || '',
        email: booking.email || '',
        phone_number: booking.phone_number || '',
        address: booking.address || '',
        postcode: booking.postcode || '',
        cleaning_type: booking.cleaning_type || '',
        total_cost: booking.total_cost || '',
        total_hours: booking.total_hours || 0,
        property_details: booking.property_details || '',
        additional_details: booking.additional_details || '',
        payment_status: booking.payment_status || '',
        payment_method: booking.payment_method || '',
        booking_status: booking.booking_status || ''
      });
    }
  }, [booking, open]);

  const handleSave = async () => {
    if (!booking || !selectedDate) return;

    setLoading(true);
    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from('past_bookings')
        .update({
          date_time: newDateTime.toISOString(),
          ...formData
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Past booking updated successfully",
      });

      onBookingUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating past booking:', error);
      toast({
        title: "Error",
        description: "Failed to update past booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div>
            <DialogTitle>Edit Past Booking</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Booking #{booking?.id}</p>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              />
            </div>

            {/* Address */}
            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div>
              <Label>Postcode</Label>
              <Input
                value={formData.postcode}
                onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value }))}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Service Details */}
            <div>
              <Label>Cleaning Type</Label>
              <Input
                value={formData.cleaning_type}
                onChange={(e) => setFormData(prev => ({ ...prev, cleaning_type: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_cost: e.target.value }))}
                />
              </div>
              <div>
                <Label>Total Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.total_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_hours: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payment Status</Label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Processing">Processing</option>
                  <option value="Not Paid">Not Paid</option>
                </select>
              </div>
              <div>
                <Label>Payment Method</Label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select Payment Method</option>
                  {paymentMethods?.map(method => (
                    <option key={method.key} value={method.key}>
                      {method.label}
                    </option>
                  ))}
                  {(!paymentMethods || paymentMethods.length === 0) && (
                    <option value="" disabled>No payment methods configured</option>
                  )}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <Label>Booking Status</Label>
              <select
                value={formData.booking_status}
                onChange={(e) => setFormData(prev => ({ ...prev, booking_status: e.target.value }))}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No Show">No Show</option>
              </select>
            </div>

            {/* Details */}
            <div>
              <Label>Property Details</Label>
              <Textarea
                value={formData.property_details}
                onChange={(e) => setFormData(prev => ({ ...prev, property_details: e.target.value }))}
                placeholder="Property type, size, special requirements..."
                rows={3}
              />
            </div>

            <div>
              <Label>Additional Details</Label>
              <Textarea
                value={formData.additional_details}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_details: e.target.value }))}
                placeholder="Any special instructions or requests..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPastBookingDialog;