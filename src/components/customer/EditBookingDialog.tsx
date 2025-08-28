import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';

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
  total_hours: number;
  cleaning_cost_per_hour: number | null;
  total_cost: number;
  same_day: boolean;
}

interface Address {
  id: string;
  address: string;
  postcode: string;
  deatails: string | null;
  is_default: boolean;
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
  const { userRole } = useAuth();
  const { selectedCustomerId } = useAdminCustomer();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [totalHours, setTotalHours] = useState(0);
  const [isSameDay, setIsSameDay] = useState(false);
  
  const [formData, setFormData] = useState({
    additional_details: '',
    property_details: '',
    parking_details: '',
    key_collection: '',
    access: ''
  });

  // Get active customer ID
  const activeCustomerId = userRole === 'admin' ? selectedCustomerId : null;

  // Fetch customer addresses
  const fetchAddresses = async () => {
    if (!activeCustomerId) return;
    
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', activeCustomerId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  React.useEffect(() => {
    if (booking && open) {
      const bookingDate = new Date(booking.date_time);
      setSelectedDate(bookingDate);
      setSelectedTime(format(bookingDate, 'HH:mm'));
      setTotalHours(booking.total_hours || 0);
      setIsSameDay(booking.same_day || false);
      
      // Find matching address
      const matchingAddress = addresses.find(addr => 
        addr.address === booking.address && addr.postcode === booking.postcode
      );
      setSelectedAddressId(matchingAddress?.id || '');
      
      setFormData({
        additional_details: booking.additional_details || '',
        property_details: booking.property_details || '',
        parking_details: booking.parking_details || '',
        key_collection: booking.key_collection || '',
        access: booking.access || ''
      });
    }
  }, [booking, open, addresses]);

  React.useEffect(() => {
    if (open && activeCustomerId) {
      fetchAddresses();
    }
  }, [open, activeCustomerId]);

  const handleSave = async () => {
    if (!booking || !selectedDate || !selectedAddressId) return;

    setLoading(true);
    try {
      // Get selected address details
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
      if (!selectedAddress) throw new Error('Selected address not found');

      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(hours, minutes, 0, 0);

      // Calculate new total cost if hours changed
      let newTotalCost = booking.total_cost;
      if (totalHours !== booking.total_hours && booking.cleaning_cost_per_hour) {
        newTotalCost = totalHours * booking.cleaning_cost_per_hour;
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          date_time: newDateTime.toISOString(),
          total_hours: totalHours,
          total_cost: newTotalCost,
          address: selectedAddress.address,
          postcode: selectedAddress.postcode,
          same_day: isSameDay,
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


  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div>
            <DialogTitle>Edit Booking</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Booking #{booking?.id}</p>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date, Time and Hours */}
          <div className="grid grid-cols-3 gap-4">
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

            <div>
              <Label>Hours</Label>
              <Input
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={totalHours}
                onChange={(e) => setTotalHours(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Same Day Option */}
          <div className="flex items-center space-x-2 p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <Checkbox
              id="same-day"
              checked={isSameDay}
              onCheckedChange={(checked) => setIsSameDay(checked as boolean)}
            />
            <Label htmlFor="same-day" className="text-sm font-medium">
              Same day check in/check out cleaning
            </Label>
            <span className="text-xs text-muted-foreground ml-2">
              (Check if this is same-day service)
            </span>
          </div>

          {/* Address Selection */}
          <div>
            <Label>Address</Label>
            <select
              value={selectedAddressId}
              onChange={(e) => setSelectedAddressId(e.target.value)}
              className="w-full p-2 border border-input rounded-md bg-background"
            >
              <option value="">Select an address...</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.address}, {address.postcode}
                  {address.is_default ? ' (Default)' : ''}
                </option>
              ))}
            </select>
            {addresses.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No addresses found. Please add an address in Settings first.
              </p>
            )}
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

        <div className="flex justify-end gap-2 pt-4">
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
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;