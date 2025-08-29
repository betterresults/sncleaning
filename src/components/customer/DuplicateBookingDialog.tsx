import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CalendarIcon, Clock, ChevronDown, MapPin, User } from 'lucide-react';
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
          cleaning_type: booking.service_type,
          total_hours: booking.total_hours,
          total_cost: booking.total_cost,
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
                <h3 className="text-xl font-bold text-[#185166] tracking-tight">{booking.service_type}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Original Booking #{booking.id}</span>
                </div>
                <div className="w-full h-px bg-border/40 mt-2"></div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#18A5A5]">£{booking.total_cost}</div>
              </div>
            </div>
            
            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[#185166]">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="font-medium">{booking.total_hours} hours</span>
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
                <Label className="text-sm font-medium text-gray-700">Time *</Label>
                <div className="relative mt-1.5">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="pl-10 border-[#185166]/20 hover:border-[#185166] focus:border-[#185166]"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Additional Details */}
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
                <Label className="text-sm font-medium text-gray-700">Additional Details</Label>
                <Textarea
                  value={formData.additional_details}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_details: e.target.value }))}
                  placeholder="Any special instructions..."
                  rows={2}
                  className="mt-1.5 border-[#185166]/20 focus:border-[#185166]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Property Details</Label>
                  <Input
                    value={formData.property_details}
                    onChange={(e) => setFormData(prev => ({ ...prev, property_details: e.target.value }))}
                    placeholder="Property type, size..."
                    className="mt-1.5 border-[#185166]/20 focus:border-[#185166]"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Parking Details</Label>
                  <Input
                    value={formData.parking_details}
                    onChange={(e) => setFormData(prev => ({ ...prev, parking_details: e.target.value }))}
                    placeholder="Parking instructions"
                    className="mt-1.5 border-[#185166]/20 focus:border-[#185166]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Key Collection</Label>
                  <Input
                    value={formData.key_collection}
                    onChange={(e) => setFormData(prev => ({ ...prev, key_collection: e.target.value }))}
                    placeholder="How to collect keys"
                    className="mt-1.5 border-[#185166]/20 focus:border-[#185166]"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Access Instructions</Label>
                  <Input
                    value={formData.access}
                    onChange={(e) => setFormData(prev => ({ ...prev, access: e.target.value }))}
                    placeholder="Access codes, special entry..."
                    className="mt-1.5 border-[#185166]/20 focus:border-[#185166]"
                  />
                </div>
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
            disabled={loading || !selectedDate || !selectedTime}
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