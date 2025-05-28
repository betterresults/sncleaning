import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  cleaning_type: string;
  total_cost: number;
  payment_status: string;
  cleaner: number | null;
  customer: number;
  form_name?: string;
  postcode?: string;
  additional_details?: string;
  property_details?: string;
  frequently?: string;
  first_cleaning?: string;
  occupied?: string;
  hours_required?: number;
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
  booking_status?: string;
  frontly_id?: number;
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
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [cleanerOption, setCleanerOption] = useState('same'); // 'same', 'unassigned', 'different'
  const [selectedCleaner, setSelectedCleaner] = useState<number | null>(null);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    const hour = (i + 1).toString();
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
      console.log('Missing required fields:', { booking: !!booking, selectedDate, selectedHour, selectedMinute });
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

      console.log('Creating duplicate booking with date:', newDateTime.toISOString());

      // Determine cleaner assignment
      let assignedCleaner: number | null = null;
      if (cleanerOption === 'same') {
        assignedCleaner = booking.cleaner;
      } else if (cleanerOption === 'different') {
        assignedCleaner = selectedCleaner;
      }
      // 'unassigned' keeps assignedCleaner as null

      // Create duplicate booking data, excluding generated fields and auto-increment fields
      const { 
        id, 
        date_time, 
        frontly_id, 
        ...bookingData 
      } = booking;
      
      const duplicateData = {
        ...bookingData,
        date_time: newDateTime.toISOString(),
        payment_status: 'Unpaid', // Reset payment status for new booking
        cleaner: assignedCleaner, // Use determined cleaner assignment
        cleaner_pay: null, // Reset cleaner pay
        booking_status: null, // Reset booking status
      };

      console.log('Inserting duplicate booking data:', duplicateData);

      const { error } = await supabase
        .from('bookings')
        .insert([duplicateData]);

      if (error) {
        console.error('Error duplicating booking:', error);
        throw error;
      }

      console.log('Booking duplicated successfully');
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setSelectedDate(undefined);
      setSelectedHour('');
      setSelectedMinute('');
      setSelectedPeriod('AM');
      setCleanerOption('same');
      setSelectedCleaner(null);
    } catch (error) {
      console.error('Error duplicating booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = selectedDate && selectedHour && selectedMinute && 
    (cleanerOption !== 'different' || selectedCleaner !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicate Booking</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {booking && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Original Booking:</h4>
              <p className="text-sm text-gray-600">
                {booking.first_name} {booking.last_name} - {booking.form_name || 'Cleaning Service'}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(booking.date_time), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">New Date</Label>
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
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>New Time</Label>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <Select value={selectedHour} onValueChange={setSelectedHour}>
                  <SelectTrigger className="w-16">
                    <SelectValue placeholder="Hr" />
                  </SelectTrigger>
                  <SelectContent>
                    {hourOptions.map((hour) => (
                      <SelectItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <span className="text-gray-500">:</span>
              
              <div>
                <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                  <SelectTrigger className="w-16">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent>
                    {minuteOptions.map((minute) => (
                      <SelectItem key={minute.value} value={minute.value}>
                        {minute.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedHour && selectedMinute && (
              <p className="text-xs text-gray-500 mt-1">
                Selected time: {selectedHour}:{selectedMinute} {selectedPeriod}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cleaner Assignment</Label>
            <Select value={cleanerOption} onValueChange={setCleanerOption}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="same">Same Cleaner</SelectItem>
                <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                <SelectItem value="different">Different Cleaner</SelectItem>
              </SelectContent>
            </Select>

            {cleanerOption === 'different' && (
              <div className="mt-2">
                <Select value={selectedCleaner?.toString() || ''} onValueChange={(value) => setSelectedCleaner(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cleaner" />
                  </SelectTrigger>
                  <SelectContent>
                    {cleaners.map((cleaner) => (
                      <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                        {cleaner.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Duplicating...' : 'Duplicate Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateBookingDialog;
