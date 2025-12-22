import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { 
  updateBookingCleaner, 
  recalculatePrimaryCleanerPay,
  BookingCleaner 
} from '@/hooks/useBookingCleaners';

interface EditSubCleanerDialogProps {
  subCleaner: BookingCleaner | null;
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
  const [paymentMethod, setPaymentMethod] = useState<'hourly' | 'percentage' | 'fixed'>('percentage');
  const [hoursAssigned, setHoursAssigned] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [percentageRate, setPercentageRate] = useState<string>('');
  const [fixedAmount, setFixedAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (subCleaner && open) {
      setPaymentMethod(subCleaner.payment_type);
      setHoursAssigned(subCleaner.hours_assigned?.toString() || '');
      setHourlyRate(subCleaner.hourly_rate?.toString() || '');
      setPercentageRate(subCleaner.percentage_rate?.toString() || '');
      setFixedAmount(subCleaner.fixed_amount?.toString() || '');
    }
  }, [subCleaner, open]);

  const calculateExpectedPay = () => {
    if (paymentMethod === 'hourly') {
      const hours = parseFloat(hoursAssigned) || 0;
      const rate = parseFloat(hourlyRate) || 0;
      return hours * rate;
    } else if (paymentMethod === 'percentage') {
      const percentage = parseFloat(percentageRate) || 0;
      return (bookingTotalCost * percentage) / 100;
    } else {
      return parseFloat(fixedAmount) || 0;
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

    if (paymentMethod === 'fixed' && !fixedAmount) {
      toast({
        title: "Error",
        description: "Please enter fixed amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newHoursAssigned = paymentMethod === 'hourly' ? parseFloat(hoursAssigned) : 0;
      const oldHoursAssigned = subCleaner.hours_assigned || 0;
      const hoursDifference = newHoursAssigned - oldHoursAssigned;
      
      await updateBookingCleaner({
        id: subCleaner.id,
        paymentType: paymentMethod,
        hourlyRate: paymentMethod === 'hourly' ? parseFloat(hourlyRate) : undefined,
        percentageRate: paymentMethod === 'percentage' ? parseFloat(percentageRate) : undefined,
        fixedAmount: paymentMethod === 'fixed' ? parseFloat(fixedAmount) : undefined,
        hoursAssigned: newHoursAssigned,
        totalCost: bookingTotalCost
      });

      // Update primary cleaner pay with the hours difference
      await recalculatePrimaryCleanerPay(bookingId, hoursDifference);

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
        description: "Failed to update cleaner",
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
              onValueChange={(value: 'hourly' | 'percentage' | 'fixed') => setPaymentMethod(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="edit-percentage" />
                <Label htmlFor="edit-percentage">Percentage of total cost</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hourly" id="edit-hourly" />
                <Label htmlFor="edit-hourly">Hourly rate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="edit-fixed" />
                <Label htmlFor="edit-fixed">Fixed amount</Label>
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

          {paymentMethod === 'fixed' && (
            <div className="space-y-2">
              <Label htmlFor="edit-fixed-amount">Fixed Amount (£)</Label>
              <Input
                id="edit-fixed-amount"
                type="number"
                step="0.01"
                min="0"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                placeholder="e.g., 50.00"
              />
            </div>
          )}

          {(percentageRate || (hoursAssigned && hourlyRate) || fixedAmount) && (
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
