import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CalendarIcon, Clock, MapPin, User, Edit3, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';

interface Booking {
  id: number;
  customer?: number;
  date_time: string;
  address: string;
  postcode: string;
  service_type: string;
  cleaning_type?: string;
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
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [hours, setHours] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [isSameDay, setIsSameDay] = useState(false);
  
  const [formData, setFormData] = useState({
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
      
      // Set default time
      const originalTime = new Date(booking.date_time);
      const hour24 = originalTime.getHours();
      const minutes = originalTime.getMinutes() >= 30 ? '30' : '00';
      setSelectedHour(hour24.toString());
      setSelectedMinute(minutes);
      
      setHours(booking.total_hours);
      setTotalCost(booking.total_cost);
      
      setFormData({
        access: booking.access || ''
      });
    }
  }, [booking, open]);

  // Calculate total cost when hours or same day option changes
  React.useEffect(() => {
    if (booking?.cleaning_cost_per_hour && hours > 0) {
      const baseCost = hours * booking.cleaning_cost_per_hour;
      const sameDaySurcharge = isSameDay ? hours * 3 : 0; // £3 per hour extra
      setTotalCost(baseCost + sameDaySurcharge);
    }
  }, [hours, isSameDay, booking?.cleaning_cost_per_hour]);

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

  const handleDuplicate = async () => {
    if (!booking || !selectedDate || !selectedHour || !selectedMinute) return;

    setLoading(true);
    try {
      // Build datetime string as London time - no timezone conversion
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateOnly = `${year}-${month}-${day}`;
      const timeOnly = `${selectedHour.padStart(2, '0')}:${selectedMinute}:00`;
      const dateTimeStr = `${dateOnly}T${timeOnly}+00:00`;

      // Get the customer from the original booking if activeCustomerId is not set
      const customerToUse = activeCustomerId || booking.customer;

      const { error } = await supabase
        .from('bookings')
        .insert({
          customer: customerToUse,
          date_time: dateTimeStr,
          date_only: dateOnly,
          time_only: timeOnly,
          address: booking.address,
          postcode: booking.postcode,
          service_type: booking.cleaning_type || booking.service_type,
          cleaning_type: booking.cleaning_type || booking.service_type,
          total_hours: Math.round(hours), // Ensure integer for bigint compatibility
          total_cost: Math.round(totalCost), // Ensure integer for bigint compatibility
          cleaning_cost_per_hour: booking.cleaning_cost_per_hour ? Math.round(booking.cleaning_cost_per_hour) : null,
          first_name: booking.first_name,
          last_name: booking.last_name,
          phone_number: booking.phone_number,
          email: booking.email,
          booking_status: 'active',
          payment_status: 'Unpaid',
          same_day: isSameDay,
          access: formData.access
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
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-[#185166]">Duplicate Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Modern Booking Summary Card */}
          <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#185166] tracking-tight">{booking.cleaning_type || booking.service_type}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Original Booking #{booking.id}</span>
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
                    min="1"
                    max="24"
                    step="0.5"
                    value={hours}
                    onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                    className="w-20 h-8 text-center border-[#185166]/20 focus:border-[#185166]"
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
            <h4 className="font-semibold text-[#185166]">Select New Date & Time</h4>
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

          {/* Access Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Access Instructions (Optional)</Label>
            <Input
              value={formData.access}
              onChange={(e) => setFormData(prev => ({ ...prev, access: e.target.value }))}
              placeholder="Access codes, key location, special entry instructions..."
              className="border-[#185166]/20 hover:border-[#185166] focus:border-[#185166]"
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
            onClick={handleDuplicate}
            disabled={loading || !selectedDate || !selectedHour || !selectedMinute || hours <= 0}
            className="px-6 bg-[#18A5A5] hover:bg-[#185166] text-white font-semibold"
          >
            {loading ? 'Creating...' : 'Duplicate Booking'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateBookingDialog;