import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

interface SubCleaner {
  id: number;
  cleaner_id: number;
  payment_method: 'hourly' | 'percentage';
  hourly_rate: number | null;
  percentage_rate: number | null;
  hours_assigned: number;
  cleaner_pay: number;
  cleaner: {
    first_name: string;
    last_name: string;
    full_name: string;
  };
}

interface EditSubCleanerDialogProps {
  subCleaner: SubCleaner | null;
  bookingId: number;
  bookingTotalCost: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubCleanerUpdated: () => void;
}

const EditSubCleanerDialog = ({ 
  subCleaner, 
  bookingId,
  bookingTotalCost, 
  open, 
  onOpenChange, 
  onSubCleanerUpdated 
}: EditSubCleanerDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'hourly' | 'percentage'>('percentage');
  const [hoursAssigned, setHoursAssigned] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [percentageRate, setPercentageRate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (subCleaner && open) {
      setPaymentMethod(subCleaner.payment_method);
      setHoursAssigned(subCleaner.hours_assigned?.toString() || '');
      setHourlyRate(subCleaner.hourly_rate?.toString() || '');
      setPercentageRate(subCleaner.percentage_rate?.toString() || '');
    }
  }, [subCleaner, open]);

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

  // Update the primary cleaner's pay in bookings table
  const updatePrimaryCleanerPay = async (updatedSubCleanerHours: number) => {
    try {
      // Get the current booking data
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('cleaner, cleaner_rate, cleaner_percentage, total_cost, total_hours, cleaning_time')
        .eq('id', bookingId)
        .single();
      
      if (bookingError || !booking || !booking.cleaner) return;
      
      // Get all sub-cleaners for this booking
      const { data: allSubCleaners } = await supabase
        .from('sub_bookings')
        .select('id, hours_assigned')
        .eq('primary_booking_id', bookingId);
      
      const totalHours = booking.total_hours || booking.cleaning_time || 0;
      // Calculate total sub-cleaner hours, using the updated value for the current sub-cleaner
      const subCleanerHours = (allSubCleaners || []).reduce((sum, sc) => {
        if (sc.id === subCleaner?.id) {
          return sum + updatedSubCleanerHours;
        }
        return sum + (sc.hours_assigned || 0);
      }, 0);
      const primaryCleanerHours = Math.max(0, totalHours - subCleanerHours);
      
      let newPrimaryCleanerPay: number;
      
      if (booking.cleaner_rate && booking.cleaner_rate > 0) {
        newPrimaryCleanerPay = primaryCleanerHours * booking.cleaner_rate;
      } else if (booking.cleaner_percentage && booking.cleaner_percentage > 0) {
        const hoursRatio = totalHours > 0 ? primaryCleanerHours / totalHours : 0;
        newPrimaryCleanerPay = (booking.total_cost || 0) * (booking.cleaner_percentage / 100) * hoursRatio;
      } else {
        newPrimaryCleanerPay = primaryCleanerHours * 20;
      }
      
      await supabase
        .from('bookings')
        .update({ cleaner_pay: newPrimaryCleanerPay })
        .eq('id', bookingId);
    } catch (error) {
      console.error('Error updating primary cleaner pay:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subCleaner) return;

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
      const expectedPay = calculateExpectedPay();
      const newHoursAssigned = paymentMethod === 'hourly' ? parseFloat(hoursAssigned) : 0;
      
      const { error } = await supabase
        .from('sub_bookings')
        .update({
          payment_method: paymentMethod,
          hours_assigned: paymentMethod === 'hourly' ? newHoursAssigned : null,
          hourly_rate: paymentMethod === 'hourly' ? parseFloat(hourlyRate) : null,
          percentage_rate: paymentMethod === 'percentage' ? parseFloat(percentageRate) : null,
          cleaner_pay: expectedPay,
        })
        .eq('id', subCleaner.id);

      if (error) {
        console.error('Error updating sub cleaner:', error);
        toast({
          title: "Error",
          description: "Failed to update cleaner",
          variant: "destructive",
        });
        return;
      }

      // Update primary cleaner pay
      await updatePrimaryCleanerPay(newHoursAssigned);

      toast({
        title: "Success",
        description: "Cleaner payment updated successfully",
      });

      onOpenChange(false);
      onSubCleanerUpdated();
    } catch (error) {
      console.error('Error updating sub cleaner:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const expectedPay = calculateExpectedPay();
  const cleanerName = subCleaner?.cleaner?.full_name || 
    `${subCleaner?.cleaner?.first_name || ''} ${subCleaner?.cleaner?.last_name || ''}`.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Cleaner Payment - {cleanerName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Payment Method</Label>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(value: 'hourly' | 'percentage') => setPaymentMethod(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="edit-percentage" />
                <Label htmlFor="edit-percentage">Percentage of total cost</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hourly" id="edit-hourly" />
                <Label htmlFor="edit-hourly">Hourly rate</Label>
              </div>
            </RadioGroup>
          </div>

          {paymentMethod === 'percentage' && (
            <div className="space-y-2">
              <Label htmlFor="edit-percentage-rate">Percentage Rate (%)</Label>
              <Input
                id="edit-percentage-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentageRate}
                onChange={(e) => setPercentageRate(e.target.value)}
                placeholder="e.g., 25"
              />
              <p className="text-sm text-muted-foreground">
                Total booking cost: £{bookingTotalCost.toFixed(2)}
              </p>
            </div>
          )}

          {paymentMethod === 'hourly' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hours">Hours Assigned</Label>
                <Input
                  id="edit-hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={hoursAssigned}
                  onChange={(e) => setHoursAssigned(e.target.value)}
                  placeholder="e.g., 2.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-rate">Hourly Rate (£)</Label>
                <Input
                  id="edit-rate"
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
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm font-medium text-primary">
                Expected Pay: £{expectedPay.toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubCleanerDialog;
