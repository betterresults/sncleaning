
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
import { addBookingCleaner, recalculatePrimaryCleanerPay } from '@/hooks/useBookingCleaners';

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
  const [paymentMethod, setPaymentMethod] = useState<'hourly' | 'percentage' | 'fixed'>('percentage');
  const [hoursAssigned, setHoursAssigned] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [percentageRate, setPercentageRate] = useState<string>('');
  const [fixedAmount, setFixedAmount] = useState<string>('');
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
    } else if (paymentMethod === 'percentage') {
      const percentage = parseFloat(percentageRate) || 0;
      return (bookingTotalCost * percentage) / 100;
    } else {
      return parseFloat(fixedAmount) || 0;
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
      const subCleanerHours = paymentMethod === 'hourly' ? parseFloat(hoursAssigned) : 0;

      // Add to cleaner_payments table
      await addBookingCleaner({
        bookingId,
        cleanerId: parseInt(selectedCleaner),
        isPrimary: false,
        paymentType: paymentMethod,
        hourlyRate: paymentMethod === 'hourly' ? parseFloat(hourlyRate) : undefined,
        percentageRate: paymentMethod === 'percentage' ? parseFloat(percentageRate) : undefined,
        fixedAmount: paymentMethod === 'fixed' ? parseFloat(fixedAmount) : undefined,
        hoursAssigned: subCleanerHours,
        totalCost: bookingTotalCost
      });

      // Update primary cleaner's pay
      await recalculatePrimaryCleanerPay(bookingId, subCleanerHours);

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
      setFixedAmount('');
      setOpen(false);
      onSubCleanerAdded();
    } catch (error) {
      console.error('Error adding sub cleaner:', error);
      toast({
        title: "Error",
        description: "Failed to add additional cleaner",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            <RadioGroup value={paymentMethod} onValueChange={(value: 'hourly' | 'percentage' | 'fixed') => setPaymentMethod(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage">Percentage of total cost</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hourly" id="hourly" />
                <Label htmlFor="hourly">Hourly rate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed">Fixed amount</Label>
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
              <p className="text-sm text-muted-foreground">
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

          {paymentMethod === 'fixed' && (
            <div className="space-y-2">
              <Label htmlFor="fixed-amount">Fixed Amount (£)</Label>
              <Input
                id="fixed-amount"
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
