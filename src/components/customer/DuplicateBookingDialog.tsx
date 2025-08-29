import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CalendarIcon, Clock, ChevronDown, MapPin, User, Edit3 } from 'lucide-react';
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
  const [selectedTime, setSelectedTime] = useState('');
  const [hours, setHours] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    property_details: '',
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
      setHours(booking.total_hours);
      setTotalCost(booking.total_cost);
      
      setFormData({
        property_details: booking.property_details || '',
        access: booking.access || ''
      });
    }
  }, [booking, open]);

  // Calculate total cost when hours change
  React.useEffect(() => {
    if (booking?.cleaning_cost_per_hour && hours > 0) {
      setTotalCost(hours * booking.cleaning_cost_per_hour);
    }
  }, [hours, booking?.cleaning_cost_per_hour]);

  // Generate time options (6 AM to 5 PM, :00 and :30 only)
  const timeOptions = React.useMemo(() => {
    const options = [];
    for (let hour = 6; hour <= 17; hour++) {
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hourStr = hour.toString().padStart(2, '0');
      
      options.push({
        value: `${hourStr}:00`,
        label: `${hour12}:00 ${ampm}`
      });
      
      if (hour < 17) { // Don't add :30 for the last hour (5 PM)
        options.push({
          value: `${hourStr}:30`,
          label: `${hour12}:30 ${ampm}`
        });
      }
    }
    return options;
  }, []);

  const handleDuplicate = async () => {
    if (!booking || !selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      // Combine date and time
      const [timeHours, minutes] = selectedTime.split(':').map(Number);
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(timeHours, minutes, 0, 0);

      const { error } = await supabase
        .from('bookings')
        .insert({
          customer: activeCustomerId,
          date_time: newDateTime.toISOString(),
          address: booking.address,
          postcode: booking.postcode,
          service_type: booking.cleaning_type || booking.service_type,
          cleaning_type: booking.cleaning_type || booking.service_type,
          total_hours: hours,
          total_cost: totalCost,
          cleaning_cost_per_hour: booking.cleaning_cost_per_hour,
          first_name: booking.first_name,
          last_name: booking.last_name,
          phone_number: booking.phone_number,
          email: booking.email,
          booking_status: 'active',
          payment_status: 'Unpaid',
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
                  Rate: £{booking.cleaning_cost_per_hour}/hour
                </div>
              )}
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
                        "w-full justify-start text-left font-normal mt-1.5 border-[#185166]/20 hover:border-[#185166]",
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1.5 border-[#185166]/20 hover:border-[#185166]",
                        !selectedTime && "text-muted-foreground"
                      )}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {selectedTime ? timeOptions.find(opt => opt.value === selectedTime)?.label : "Select time"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="max-h-60 overflow-y-auto">
                      {timeOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant="ghost"
                          className="w-full justify-start text-left h-10 hover:bg-[#185166]/10"
                          onClick={() => setSelectedTime(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Simplified Additional Details */}
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-[#185166]/20 hover:border-[#185166] hover:bg-[#185166]/5"
              >
                <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", isDetailsOpen && "rotate-180")} />
                Additional Details (Optional)
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4 p-4 border border-border/40 rounded-lg bg-gray-50/50">
              <div>
                <Label className="text-sm font-medium text-gray-700">Property Details</Label>
                <Input
                  value={formData.property_details}
                  onChange={(e) => setFormData(prev => ({ ...prev, property_details: e.target.value }))}
                  placeholder="Property type, size, special requirements..."
                  className="mt-1.5 border-[#185166]/20 focus:border-[#185166]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Access Instructions</Label>
                <Input
                  value={formData.access}
                  onChange={(e) => setFormData(prev => ({ ...prev, access: e.target.value }))}
                  placeholder="Access codes, key location, special entry instructions..."
                  className="mt-1.5 border-[#185166]/20 focus:border-[#185166]"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
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
            disabled={loading || !selectedDate || !selectedTime || hours <= 0}
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