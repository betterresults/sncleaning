
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
  const [isLoading, setIsLoading] = useState(false);

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
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
      // Combine date and time
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);

      console.log('Creating duplicate booking with date:', newDateTime.toISOString());

      // Create duplicate booking data (excluding id and date_time)
      const { id, date_time, ...bookingData } = booking;
      
      const duplicateData = {
        ...bookingData,
        date_time: newDateTime.toISOString(),
        payment_status: 'Unpaid', // Reset payment status for new booking
        cleaner: null, // Reset cleaner assignment
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
    } catch (error) {
      console.error('Error duplicating booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = selectedDate && selectedHour && selectedMinute;

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
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Hour" />
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
                  <SelectTrigger className="w-20">
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
            </div>
            {selectedHour && selectedMinute && (
              <p className="text-xs text-gray-500 mt-1">
                Selected time: {selectedHour}:{selectedMinute}
              </p>
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
