import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  cleaning_type: string;
  service_type?: string;
  total_cost: number;
  payment_status: string;
  cleaner: number | null;
  customer: number;
  postcode?: string;
  additional_details?: string;
  property_details?: string;
  frequently?: string;
  first_cleaning?: string;
  occupied?: string;
  total_hours?: number;
  ironing_hours?: number;
  cleaning_time?: number;
  carpet_items?: string;
  exclude_areas?: string;
  upholstery_items?: string;
  mattress_items?: string;
  extras?: string;
  linens?: string;
  ironing?: string;
  photos?: any;
  parking_details?: string;
  key_collection?: string;
  access?: string;
  agency?: string;
  record_message?: string;
  video_message?: string;
  cost_deduction?: string;
  cleaning_cost_per_visit?: string;
  cleaning_cost_per_hour?: number;
  steam_cleaning_cost?: string;
  deposit?: number;
  oven_size?: string;
  payment_method?: string;
  payment_term?: string;
  cleaner_pay?: number;
  cleaner_rate?: number;
  cleaner_percentage?: number;
  cleaner_pay_status?: string; // Only exists in past_bookings table
  booking_status?: string;
  frontly_id?: number;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  customers?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

interface Cleaner {
  id: number;
  full_name: string;
}

interface DuplicateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onSuccess: () => void;
}

const DuplicateBookingDialog: React.FC<DuplicateBookingDialogProps> = ({
  open,
  onOpenChange,
  booking,
  onSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [cleanerOption, setCleanerOption] = useState('same'); // 'same', 'unassigned', 'different'
  const [selectedCleaner, setSelectedCleaner] = useState<number | null>(null);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSameDayCleaning, setIsSameDayCleaning] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch cleaners when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchCleaners();
    }
  }, [open]);

  const fetchCleaners = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id, full_name')
        .order('full_name');

      if (error) {
        console.error('Error fetching cleaners:', error);
        return;
      }

      setCleaners(data || []);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    }
  };

  // Generate hour options (1-12 for 12-hour format)
  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const hour = (i + 1).toString().padStart(2, '0');
    return { value: hour, label: hour };
  });

  // Generate minute options (00, 15, 30, 45)
  const minuteOptions = [
    { value: '00', label: '00' },
    { value: '15', label: '15' },
    { value: '30', label: '30' },
    { value: '45', label: '45' }
  ];

  const handleDuplicate = async () => {
    if (!booking || !selectedDate || !selectedHour || !selectedMinute) {
      return;
    }

    setIsLoading(true);

    try {
      // Convert 12-hour format to 24-hour format
      let hour24 = parseInt(selectedHour);
      if (selectedPeriod === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (selectedPeriod === 'AM' && hour24 === 12) {
        hour24 = 0;
      }

      // Combine date and time
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(hour24, parseInt(selectedMinute), 0, 0);

      // Determine cleaner assignment
      let assignedCleaner: number | null = null;
      if (cleanerOption === 'same') {
        assignedCleaner = booking.cleaner;
      } else if (cleanerOption === 'different') {
        assignedCleaner = selectedCleaner;
      }
      // 'unassigned' keeps assignedCleaner as null

      // Create duplicate booking data, excluding generated fields, auto-increment fields, and relationship data
      const { 
        id, 
        date_time, 
        frontly_id,
        cleaners,
        customers,
        photos, // Exclude this - not a column in bookings table
        cleaner_pay_status, // Exclude this - only exists in past_bookings table
        ...bookingData 
      } = booking;
      
      // Handle frequently field for Airbnb same day cleaning
      let frequently = bookingData.frequently;
      if ((booking.service_type === 'Air BnB' || booking.cleaning_type === 'Air BnB') && isSameDayCleaning) {
        frequently = 'Same Day';
      }
      
      // Extract date_only and time_only from newDateTime
      const dateOnly = newDateTime.toISOString().split('T')[0];
      const timeOnly = `${hour24.toString().padStart(2, '0')}:${selectedMinute}:00`;
      
      const duplicateData = {
        ...bookingData,
        date_time: newDateTime.toISOString(),
        date_only: dateOnly,
        time_only: timeOnly,
        payment_status: 'Unpaid', // Reset payment status for new booking
        invoice_id: null, // Reset invoice data
        invoice_link: null, // Reset invoice data
        invoice_term: null, // Reset invoice data
        cleaner: assignedCleaner, // Use determined cleaner assignment
        cleaner_pay: null, // Reset cleaner pay
        booking_status: null, // Reset booking status
        frequently: frequently, // Set frequently field
      };

      const { data: insertedData, error } = await supabase
        .from('bookings')
        .insert([duplicateData])
        .select();

      if (error) {
        console.error('Error duplicating booking:', error);
        toast({
          title: "Error",
          description: "Failed to duplicate booking. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Booking duplicated successfully! Redirecting to upcoming bookings...",
      });
      
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setSelectedDate(undefined);
      setSelectedHour('09');
      setSelectedMinute('00');
      setSelectedPeriod('AM');
      setCleanerOption('same');
      setSelectedCleaner(null);
      setIsSameDayCleaning(false);
      
      // Navigate to upcoming bookings
      setTimeout(() => {
        navigate('/upcoming-bookings');
      }, 500);
    } catch (error) {
      console.error('Error duplicating booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = selectedDate && selectedHour && selectedMinute && 
    (cleanerOption !== 'different' || selectedCleaner !== null);

  const isAirbnbBooking = booking?.service_type === 'Air BnB' || booking?.cleaning_type === 'Air BnB';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-slate-50 to-blue-50 border-0 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Duplicate Booking
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {booking && (
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Original Booking
              </h4>
              <p className="text-gray-700 font-medium">
                {booking.first_name} {booking.last_name} - {booking.cleaning_type || 'Cleaning Service'}
              </p>
              <p className="text-gray-500 text-sm">
                {format(new Date(booking.date_time), 'EEEE, MMMM do, yyyy \'at\' HH:mm')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">New Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal border-2 border-gray-200 hover:border-blue-400 rounded-xl bg-white shadow-sm transition-all duration-200",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-blue-600" />
                    {selectedDate ? format(selectedDate, "EEEE, MMMM do") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-2 border-gray-200 rounded-xl shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-4 pointer-events-auto rounded-xl"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">New Time *</Label>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 flex-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <Select value={selectedHour} onValueChange={setSelectedHour}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-400 rounded-xl bg-white shadow-sm transition-all duration-200">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-lg">
                      {hourOptions.map((hour) => (
                        <SelectItem key={hour.value} value={hour.value} className="hover:bg-blue-50">
                          {hour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <span className="text-gray-400 font-bold">:</span>
                
                <div className="flex-1">
                  <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-400 rounded-xl bg-white shadow-sm transition-all duration-200">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-lg">
                      {minuteOptions.map((minute) => (
                        <SelectItem key={minute.value} value={minute.value} className="hover:bg-blue-50">
                          {minute.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-400 rounded-xl bg-white shadow-sm transition-all duration-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-lg">
                      <SelectItem value="AM" className="hover:bg-blue-50">AM</SelectItem>
                      <SelectItem value="PM" className="hover:bg-blue-50">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedHour && selectedMinute && (
                <p className="text-sm text-blue-600 font-medium mt-2">
                  Selected time: {selectedHour}:{selectedMinute} {selectedPeriod}
                </p>
              )}
            </div>
          </div>

          {/* Airbnb Same Day Option */}
          {isAirbnbBooking && (
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="isSameDayCleaning"
                  checked={isSameDayCleaning}
                  onCheckedChange={(checked) => setIsSameDayCleaning(checked === true)}
                  className="border-2 border-blue-300 data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="isSameDayCleaning" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Mark as Same Day Cleaning (Airbnb)
                </Label>
              </div>
            </div>
          )}

          {/* Cleaner Assignment */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-700">Cleaner Assignment</Label>
            <Select value={cleanerOption} onValueChange={setCleanerOption}>
              <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-purple-400 rounded-xl bg-white shadow-sm transition-all duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-lg">
                <SelectItem value="same" className="hover:bg-purple-50">Keep Same Cleaner</SelectItem>
                <SelectItem value="unassigned" className="hover:bg-purple-50">Leave Unassigned</SelectItem>
                <SelectItem value="different" className="hover:bg-purple-50">Assign Different Cleaner</SelectItem>
              </SelectContent>
            </Select>

            {cleanerOption === 'different' && (
              <div className="mt-3">
                <Select value={selectedCleaner?.toString() || ''} onValueChange={(value) => setSelectedCleaner(parseInt(value))}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-purple-400 rounded-xl bg-white shadow-sm transition-all duration-200">
                    <SelectValue placeholder="Select a cleaner" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-lg">
                    {cleaners.map((cleaner) => (
                      <SelectItem key={cleaner.id} value={cleaner.id.toString()} className="hover:bg-purple-50">
                        {cleaner.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-6 border-t border-gray-200">
          <div className="flex gap-3 w-full justify-center">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="px-8 py-3 h-12 border-2 border-gray-300 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDuplicate}
              disabled={!isFormValid || isLoading}
              className="px-12 py-3 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg disabled:opacity-50 transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Duplicating...
                </div>
              ) : (
                'Duplicate Booking'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateBookingDialog;
