
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useLinkedCleaners } from '@/hooks/useLinkedCleaners';

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface AddSubCleanerDialogProps {
  bookingId: number;
  onSubCleanerAdded: () => void;
  children: React.ReactNode;
}

const AddSubCleanerDialog = ({ bookingId, onSubCleanerAdded, children }: AddSubCleanerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [selectedCleaner, setSelectedCleaner] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'hourly' | 'percentage'>('percentage');
  const [hoursAssigned, setHoursAssigned] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [percentageRate, setPercentageRate] = useState<string>('');
  const [bookingTotalCost, setBookingTotalCost] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Use the shared hook for fetching linked cleaners
  const { cleaners: linkedCleaners } = useLinkedCleaners(open);

  useEffect(() => {
    if (open) {
      fetchBookingDetails();
    }
  }, [open, bookingId]);

  // Sync linked cleaners to local state
  useEffect(() => {
    if (linkedCleaners.length > 0) {
      setCleaners(linkedCleaners.map(c => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        full_name: c.full_name || `${c.first_name} ${c.last_name}`
      })));
    }
  }, [linkedCleaners]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('total_cost')
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('Error fetching booking details:', error);
        return;
      }

      setBookingTotalCost(data.total_cost || 0);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  };

  const calculateExpectedPay = () => {
    if (paymentMethod === 'hourly') {
      const hours = parseFloat(hoursAssigned) || 0;
      const rate = parseFloat(hourlyRate) || 0;
      return hours * rate;
    } else {
      const percentage = parseFloat(percentageRate) || 0;
      return (bookingTotalCost * percentage) / 100;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCleaner) {
      toast({
        title: "Error",
        description: "Please select a cleaner",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'hourly' && (!hoursAssigned || !hourlyRate)) {
      toast({
        title: "Error",
        description: "Please enter hours assigned and hourly rate",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'percentage' && !percentageRate) {
      toast({
        title: "Error",
        description: "Please enter percentage rate",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const subCleanerHours = paymentMethod === 'hourly' ? parseFloat(hoursAssigned) : 0;
      const subCleanerPay = calculateExpectedPay();

      const { error } = await supabase
        .from('sub_bookings')
        .insert({
          primary_booking_id: bookingId,
          cleaner_id: parseInt(selectedCleaner),
          payment_method: paymentMethod,
          hours_assigned: subCleanerHours,
          hourly_rate: paymentMethod === 'hourly' ? parseFloat(hourlyRate) : null,
          percentage_rate: paymentMethod === 'percentage' ? parseFloat(percentageRate) : null,
          cleaner_pay: subCleanerPay,
        });

      if (error) {
        console.error('Error adding sub cleaner:', error);
        toast({
          title: "Error",
          description: "Failed to add additional cleaner",
          variant: "destructive",
        });
        return;
      }

      // Update primary cleaner's pay in the bookings table
      await updatePrimaryCleanerPay(bookingId, subCleanerHours);

      toast({
        title: "Success",
        description: "Additional cleaner added successfully",
      });

      // Reset form
      setSelectedCleaner('');
      setPaymentMethod('percentage');
      setHoursAssigned('');
      setHourlyRate('');
      setPercentageRate('');
      setOpen(false);
      onSubCleanerAdded();
    } catch (error) {
      console.error('Error adding sub cleaner:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update primary cleaner's pay when a sub-cleaner is added
  const updatePrimaryCleanerPay = async (bookingId: number, newSubCleanerHours: number) => {
    try {
      // Get the current booking data
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('cleaner, cleaner_rate, cleaner_percentage, total_cost, total_hours, cleaning_time')
        .eq('id', bookingId)
        .single();
      
      if (bookingError || !booking || !booking.cleaner) return;
      
      // Get existing sub-cleaners hours
      const { data: existingSubCleaners } = await supabase
        .from('sub_bookings')
        .select('hours_assigned')
        .eq('primary_booking_id', bookingId);
      
      const existingSubCleanerHours = (existingSubCleaners || []).reduce(
        (sum, sc) => sum + (sc.hours_assigned || 0), 0
      );
      
      const totalHours = booking.total_hours || booking.cleaning_time || 0;
      // Include the newly added sub-cleaner hours
      const totalSubCleanerHours = existingSubCleanerHours + newSubCleanerHours;
      const primaryCleanerHours = Math.max(0, totalHours - totalSubCleanerHours);
      
      let newPrimaryCleanerPay: number;
      
      if (booking.cleaner_rate && booking.cleaner_rate > 0) {
        // Hourly rate
        newPrimaryCleanerPay = primaryCleanerHours * booking.cleaner_rate;
      } else if (booking.cleaner_percentage && booking.cleaner_percentage > 0) {
        // Percentage rate - calculate proportionally based on hours
        const hoursRatio = totalHours > 0 ? primaryCleanerHours / totalHours : 0;
        newPrimaryCleanerPay = (booking.total_cost || 0) * (booking.cleaner_percentage / 100) * hoursRatio;
      } else {
        // Default fallback - use hourly rate of 20
        newPrimaryCleanerPay = primaryCleanerHours * 20;
      }
      
      // Update the booking with new cleaner_pay
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ cleaner_pay: newPrimaryCleanerPay })
        .eq('id', bookingId);
      
      if (updateError) {
        console.error('Error updating primary cleaner pay:', updateError);
      }
    } catch (error) {
      console.error('Error updating primary cleaner pay:', error);
    }
  };

  const expectedPay = calculateExpectedPay();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Additional Cleaner</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cleaner">Select Cleaner</Label>
            <Select value={selectedCleaner} onValueChange={setSelectedCleaner}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a cleaner" />
              </SelectTrigger>
              <SelectContent>
                {cleaners.map((cleaner) => (
                  <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                    {cleaner.full_name || `${cleaner.first_name} ${cleaner.last_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value: 'hourly' | 'percentage') => setPaymentMethod(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage">Percentage of total cost</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hourly" id="hourly" />
                <Label htmlFor="hourly">Hourly rate</Label>
              </div>
            </RadioGroup>
          </div>

          {paymentMethod === 'percentage' && (
            <div className="space-y-2">
              <Label htmlFor="percentage-rate">Percentage Rate (%)</Label>
              <Input
                id="percentage-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentageRate}
                onChange={(e) => setPercentageRate(e.target.value)}
                placeholder="e.g., 25"
              />
              <p className="text-sm text-gray-600">
                Total booking cost: £{bookingTotalCost.toFixed(2)}
              </p>
            </div>
          )}

          {paymentMethod === 'hourly' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours">Hours Assigned</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={hoursAssigned}
                  onChange={(e) => setHoursAssigned(e.target.value)}
                  placeholder="e.g., 2.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Hourly Rate (£)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="e.g., 15.00"
                />
              </div>
            </div>
          )}

          {(percentageRate || (hoursAssigned && hourlyRate)) && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Expected Pay: £{expectedPay.toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Cleaner'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubCleanerDialog;
