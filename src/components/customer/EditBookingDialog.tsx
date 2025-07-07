import React, { useState } from 'react';
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

interface Booking {
  id: number;
  date_time: string;
  additional_details: string | null;
  property_details: string | null;
  parking_details: string | null;
  key_collection: string | null;
  access: string | null;
  address: string | null;
  postcode: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  email: string | null;
}

interface EditBookingDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingUpdated: () => void;
}

const EditBookingDialog: React.FC<EditBookingDialogProps> = ({
  booking,
  open,
  onOpenChange,
  onBookingUpdated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  
  const [formData, setFormData] = useState({
    additional_details: '',
    property_details: '',
    parking_details: '',
    key_collection: '',
    access: '',
    address: '',
    postcode: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    email: ''
  });

  React.useEffect(() => {
    if (booking) {
      const bookingDate = new Date(booking.date_time);
      setSelectedDate(bookingDate);
      setSelectedTime(format(bookingDate, 'HH:mm'));
      
      setFormData({
        additional_details: booking.additional_details || '',
        property_details: booking.property_details || '',
        parking_details: booking.parking_details || '',
        key_collection: booking.key_collection || '',
        access: booking.access || '',
        address: booking.address || '',
        postcode: booking.postcode || '',
        first_name: booking.first_name || '',
        last_name: booking.last_name || '',
        phone_number: booking.phone_number || '',
        email: booking.email || ''
      });
    }
  }, [booking]);

  const handleSave = async () => {
    if (!booking || !selectedDate) return;

    setLoading(true);
    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from('bookings')
        .update({
          date_time: newDateTime.toISOString(),
          ...formData
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking updated successfully",
      });

      onBookingUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });

      onBookingUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
        </DialogHeader>

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
                    className="pointer-events-auto"
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

          {/* Contact Information */}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone Number</Label>
              <Input
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* Details */}
          <div>
            <Label>Additional Details</Label>
            <Textarea
              value={formData.additional_details}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_details: e.target.value }))}
              placeholder="Any special instructions or requests..."
              rows={3}
            />
          </div>

          <div>
            <Label>Property Details</Label>
            <Textarea
              value={formData.property_details}
              onChange={(e) => setFormData(prev => ({ ...prev, property_details: e.target.value }))}
              placeholder="Property type, size, special requirements..."
              rows={2}
            />
          </div>

          <div>
            <Label>Parking Details</Label>
            <Input
              value={formData.parking_details}
              onChange={(e) => setFormData(prev => ({ ...prev, parking_details: e.target.value }))}
              placeholder="Parking instructions"
            />
          </div>

          <div>
            <Label>Key Collection</Label>
            <Input
              value={formData.key_collection}
              onChange={(e) => setFormData(prev => ({ ...prev, key_collection: e.target.value }))}
              placeholder="How to collect keys"
            />
          </div>

          <div>
            <Label>Access Instructions</Label>
            <Input
              value={formData.access}
              onChange={(e) => setFormData(prev => ({ ...prev, access: e.target.value }))}
              placeholder="Access codes, special entry instructions"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            onClick={handleCancel}
            variant="destructive"
            disabled={loading}
          >
            Cancel Booking
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              disabled={loading}
            >
              Close
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;