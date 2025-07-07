import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CalendarIcon, Clock, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';

interface Booking {
  id: number;
  date_time: string;
  address: string;
  postcode: string;
  service_type: string;
  total_hours: number;
  total_cost: number;
  cleaning_cost_per_hour: number | null;
  additional_details: string | null;
  property_details: string | null;
  parking_details: string | null;
  key_collection: string | null;
  access: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  email: string | null;
}

interface DuplicateBookingDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingCreated: () => void;
}

const DuplicateBookingDialog: React.FC<DuplicateBookingDialogProps> = ({
  booking,
  open,
  onOpenChange,
  onBookingCreated
}) => {
  const { userRole, customerId } = useAuth();
  const { selectedCustomerId } = useAdminCustomer();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    additional_details: '',
    property_details: '',
    parking_details: '',
    key_collection: '',
    access: ''
  });

  // Get active customer ID
  const activeCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;

  React.useEffect(() => {
    if (booking && open) {
      // Set default date to next week
      const nextWeek = new Date(booking.date_time);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setSelectedDate(nextWeek);
      setSelectedTime(format(new Date(booking.date_time), 'HH:mm'));
      
      setFormData({
        additional_details: booking.additional_details || '',
        property_details: booking.property_details || '',
        parking_details: booking.parking_details || '',
        key_collection: booking.key_collection || '',
        access: booking.access || ''
      });
    }
  }, [booking, open]);

  const handleDuplicate = async () => {
    if (!booking || !selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from('bookings')
        .insert({
          customer: activeCustomerId,
          date_time: newDateTime.toISOString(),
          address: booking.address,
          postcode: booking.postcode,
          service_type: booking.service_type,
          total_hours: booking.total_hours,
          total_cost: booking.total_cost,
          cleaning_cost_per_hour: booking.cleaning_cost_per_hour,
          first_name: booking.first_name,
          last_name: booking.last_name,
          phone_number: booking.phone_number,
          email: booking.email,
          booking_status: 'Pending',
          ...formData
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking duplicated successfully",
      });

      onBookingCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error duplicating booking:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Duplicate Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date and Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
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
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Service Details Summary */}
          <div className="p-3 bg-muted/30 rounded-lg text-sm">
            <p><strong>Service:</strong> {booking.service_type}</p>
            <p><strong>Duration:</strong> {booking.total_hours}h</p>
            <p><strong>Cost:</strong> £{booking.total_cost}</p>
            <p><strong>Address:</strong> {booking.address}, {booking.postcode}</p>
          </div>

          {/* Collapsible Additional Details */}
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", isDetailsOpen && "rotate-180")} />
                Additional Details (Optional)
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div>
                <Label>Additional Details</Label>
                <Textarea
                  value={formData.additional_details}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_details: e.target.value }))}
                  placeholder="Any special instructions..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Property Details</Label>
                <Input
                  value={formData.property_details}
                  onChange={(e) => setFormData(prev => ({ ...prev, property_details: e.target.value }))}
                  placeholder="Property type, size..."
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
            </CollapsibleContent>
          </Collapsible>
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
            onClick={handleDuplicate}
            disabled={loading || !selectedDate || !selectedTime}
          >
            {loading ? 'Creating...' : 'Duplicate Booking'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateBookingDialog;