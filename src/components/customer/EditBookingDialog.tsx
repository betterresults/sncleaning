import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, MapPin, User, Edit3, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';

interface Booking {
  id: number;
  date_time: string;
  cleaning_type?: string;
  service_type: string;
  address: string | null;
  postcode: string | null;
  total_hours: number;
  cleaning_cost_per_hour: number | null;
  total_cost: number;
  same_day: boolean;
  access: string | null;
  first_name: string | null;
  last_name: string | null;
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
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [totalHours, setTotalHours] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [isSameDay, setIsSameDay] = useState(false);
  
  const [formData, setFormData] = useState({
    access: ''
  });

  // Get active customer ID  
  const { customerId } = useAuth();
  const activeCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;

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
      
      // Set time
      const hour24 = bookingDate.getHours();
      const minutes = bookingDate.getMinutes() >= 30 ? '30' : '00';
      setSelectedHour(hour24.toString());
      setSelectedMinute(minutes);
      
      setTotalHours(booking.total_hours || 0);
      setTotalCost(booking.total_cost || 0);
      setIsSameDay(booking.same_day || false);
      
      // Find matching address
      const matchingAddress = addresses.find(addr => 
        addr.address === booking.address && addr.postcode === booking.postcode
      );
      setSelectedAddressId(matchingAddress?.id || '');
      
      setFormData({
        access: booking.access || ''
      });
    }
  }, [booking, open, addresses]);

  // Calculate total cost when hours or same day option changes
  React.useEffect(() => {
    if (booking?.cleaning_cost_per_hour && totalHours > 0) {
      const baseCost = totalHours * booking.cleaning_cost_per_hour;
      const sameDaySurcharge = isSameDay ? totalHours * 3 : 0;
      setTotalCost(baseCost + sameDaySurcharge);
    }
  }, [totalHours, isSameDay, booking?.cleaning_cost_per_hour]);

  // Generate hour options (6 AM to 5 PM)
  const hourOptions = React.useMemo(() => {
    const options = [];
    for (let hour = 6; hour <= 17; hour++) {
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      
      options.push({
        value: hour.toString(),
        label: `${hour12} ${ampm}`
      });
    }
    return options;
  }, []);

  const minuteOptions = [
    { value: '00', label: ':00' },
    { value: '30', label: ':30' }
  ];

  React.useEffect(() => {
    if (open && activeCustomerId) {
      fetchAddresses();
    }
  }, [open, activeCustomerId]);

  const handleSave = async () => {
    if (!booking || !selectedDate || !selectedHour || !selectedMinute) return;

    setLoading(true);
    try {
      // Get selected address details (if changed)
      let addressData = { 
        address: booking.address, 
        postcode: booking.postcode 
      };
      
      if (selectedAddressId && selectedAddressId !== 'current') {
        const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
        if (selectedAddress) {
          addressData = {
            address: selectedAddress.address,
            postcode: selectedAddress.postcode
          };
        }
      }

      // Combine date and time
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);

      const { error } = await supabase
        .from('bookings')
        .update({
          date_time: newDateTime.toISOString(),
          total_hours: totalHours,
          total_cost: totalCost,
          address: addressData.address,
          postcode: addressData.postcode,
          same_day: isSameDay,
          access: formData.access
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
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-[#185166]">Edit Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Modern Booking Summary Card */}
          <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#185166] tracking-tight">{booking.cleaning_type || booking.service_type}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Booking #{booking.id}</span>
                </div>
                <div className="w-full h-px bg-border/40 mt-2"></div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#18A5A5]">£{totalCost}</div>
              </div>
            </div>
            
            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#185166]">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Duration:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="2"
                    max="24"
                    step="0.5"
                    value={totalHours}
                    onChange={(e) => setTotalHours(parseFloat(e.target.value) || 0)}
                    className="w-20 h-8 text-center border-gray-200 focus:border-[#185166]"
                  />
                  <span className="text-sm text-gray-600">hours</span>
                  <Edit3 className="h-3 w-3 text-gray-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#185166]">
                <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0" />
                <span className="font-bold">{booking.address}, {booking.postcode}</span>
              </div>
              {(booking.first_name || booking.last_name) && (
                <div className="flex items-center gap-2 text-[#185166]">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">{booking.first_name} {booking.last_name}</span>
                </div>
              )}
              {booking.cleaning_cost_per_hour && (
                <div className="text-xs text-gray-500 mt-2">
                  {isSameDay ? (
                    <div className="text-orange-600 font-medium">
                      Same day rate: £{booking.cleaning_cost_per_hour + 3}/hour
                    </div>
                  ) : (
                    <div>Rate: £{booking.cleaning_cost_per_hour}/hour</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Same Day Cleaning Option */}
          <div className="space-y-3 p-4 border border-orange-200 rounded-lg bg-orange-50/50">
            <div className="flex items-start gap-3">
              <Checkbox
                id="same-day"
                checked={isSameDay}
                onCheckedChange={(checked) => setIsSameDay(checked as boolean)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="same-day" className="text-sm font-semibold text-[#185166] cursor-pointer">
                  Same Day Cleaning (+£3 per hour)
                </Label>
                <div className="flex items-start gap-2 mt-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Same day bookings require immediate scheduling and coordination which involves additional 
                    management complexity. The £3 per hour surcharge covers urgent staff allocation, 
                    priority scheduling, and expedited service preparation to ensure your cleaning is completed today.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="space-y-4">
            <h4 className="font-semibold text-[#185166]">Date & Time</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1.5 border-gray-200 hover:border-gray-300 focus:border-[#185166]",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Time *</Label>
                <div className="flex gap-2 mt-1.5">
                  <Select value={selectedHour} onValueChange={setSelectedHour}>
                    <SelectTrigger className="border-gray-200 hover:border-gray-300 focus:border-[#185166]">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                    <SelectTrigger className="w-20 border-gray-200 hover:border-gray-300 focus:border-[#185166]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minuteOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Address Selection */}
          {addresses.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Address (Optional)</Label>
              <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                <SelectTrigger className="border-gray-200 hover:border-gray-300 focus:border-[#185166]">
                  <SelectValue placeholder="Keep current address or select different one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Keep current address</SelectItem>
                  {addresses.map((address) => (
                    <SelectItem key={address.id} value={address.id}>
                      {address.address}, {address.postcode}
                      {address.is_default ? ' (Default)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Access Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Access Instructions (Optional)</Label>
            <Input
              value={formData.access}
              onChange={(e) => setFormData(prev => ({ ...prev, access: e.target.value }))}
              placeholder="Access codes, key location, special entry instructions..."
              className="border-gray-200 hover:border-gray-300 focus:border-[#185166]"
            />
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-6 border-t border-border/40">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            disabled={loading}
            className="px-6 border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !selectedDate || !selectedHour || !selectedMinute || totalHours < 2}
            className="px-6 bg-[#18A5A5] hover:bg-[#185166] text-white font-semibold"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;