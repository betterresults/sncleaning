import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLinkedCleaners } from '@/hooks/useLinkedCleaners';

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  presentage_rate: number;
  hourly_rate: number;
}

interface AssignCleanerToPastBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: number | null;
  onSuccess: () => void;
}

const AssignCleanerToPastBookingDialog: React.FC<AssignCleanerToPastBookingDialogProps> = ({
  open,
  onOpenChange,
  bookingId,
  onSuccess,
}) => {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [selectedCleaner, setSelectedCleaner] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookingTotalCost, setBookingTotalCost] = useState<number>(0);
  const [bookingTotalHours, setBookingTotalHours] = useState<number>(0);
  const [cleanerPay, setCleanerPay] = useState<string>('');
  const [isHourlyService, setIsHourlyService] = useState<boolean>(false);
  const [customHourlyRate, setCustomHourlyRate] = useState<string>('');
  const [customPercentageRate, setCustomPercentageRate] = useState<string>('');
  const { toast } = useToast();
  
  // Use the shared hook for fetching linked cleaners
  const { cleaners: linkedCleaners } = useLinkedCleaners(open);

  useEffect(() => {
    if (open && bookingId) {
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
        full_name: c.full_name || `${c.first_name} ${c.last_name}`,
        presentage_rate: c.presentage_rate || 0,
        hourly_rate: c.hourly_rate || 0
      })));
    }
  }, [linkedCleaners]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;
    
    try {
      const { data, error } = await supabase
        .from('past_bookings')
        .select('total_cost, cleaner, total_hours, cleaning_time, service_type, cleaner_pay')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      
      const totalCost = parseFloat(data.total_cost) || 0;
      setBookingTotalCost(totalCost);
      const hours = Number(data.total_hours || data.cleaning_time || 0);
      setBookingTotalHours(hours);
      
      // Determine if this is an hourly service
      const serviceType = data.service_type?.toLowerCase() || '';
      const isHourly = serviceType.includes('domestic') || serviceType.includes('standard');
      setIsHourlyService(isHourly);
      
      if (data.cleaner) {
        setSelectedCleaner(data.cleaner.toString());
      }
      
      if (data.cleaner_pay) {
        setCleanerPay(data.cleaner_pay.toString());
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  };

  // Set default rates when cleaner is selected
  useEffect(() => {
    if (selectedCleaner) {
      const cleaner = cleaners.find(c => c.id.toString() === selectedCleaner);
      if (cleaner) {
        setCustomHourlyRate(cleaner.hourly_rate?.toString() || '');
        setCustomPercentageRate(cleaner.presentage_rate?.toString() || '');
        
        // Auto-calculate cleaner pay if not already set
        if (!cleanerPay) {
          let calculatedPay: number | null = null;
          if (isHourlyService && bookingTotalHours > 0 && cleaner.hourly_rate) {
            calculatedPay = bookingTotalHours * cleaner.hourly_rate;
          } else if (bookingTotalCost > 0 && cleaner.presentage_rate) {
            calculatedPay = (bookingTotalCost * cleaner.presentage_rate) / 100;
          }
          if (calculatedPay !== null) {
            setCleanerPay(calculatedPay.toFixed(2));
          }
        }
      }
    } else {
      setCustomHourlyRate('');
      setCustomPercentageRate('');
    }
  }, [selectedCleaner, cleaners]);

  // Recalculate cleaner pay when rates change
  const recalculateCleanerPay = () => {
    if (!selectedCleaner) return;
    
    let calculatedPay: number | null = null;
    
    if (isHourlyService && bookingTotalHours > 0 && customHourlyRate) {
      const hourlyRate = parseFloat(customHourlyRate);
      if (!isNaN(hourlyRate)) {
        calculatedPay = bookingTotalHours * hourlyRate;
      }
    } else if (bookingTotalCost > 0 && customPercentageRate) {
      const percentageRate = parseFloat(customPercentageRate);
      if (!isNaN(percentageRate)) {
        calculatedPay = (bookingTotalCost * percentageRate) / 100;
      }
    }
    
    if (calculatedPay !== null) {
      setCleanerPay(calculatedPay.toFixed(2));
    }
  };

  const handleSave = async () => {
    if (!bookingId) return;

    setIsLoading(true);

    try {
      const updateData: Record<string, number | null> = {};
      
      // Update cleaner if selected
      if (selectedCleaner) {
        updateData.cleaner = parseInt(selectedCleaner);
      } else {
        updateData.cleaner = null;
      }

      // Update cleaner pay
      if (cleanerPay) {
        updateData.cleaner_pay = parseFloat(cleanerPay);
      } else {
        updateData.cleaner_pay = null;
      }

      const { error } = await supabase
        .from('past_bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating past booking:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Cleaner ${selectedCleaner ? 'assigned' : 'removed'} with £${cleanerPay || '0'} pay`,
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error updating past booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCleaner('');
    setCleanerPay('');
    setCustomHourlyRate('');
    setCustomPercentageRate('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Cleaner & Pay</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Cleaner</Label>
            <Select value={selectedCleaner} onValueChange={setSelectedCleaner}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a cleaner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">No cleaner assigned</span>
                </SelectItem>
                {cleaners.map((cleaner) => {
                  const displayName = cleaner.full_name || `${cleaner.first_name || ''} ${cleaner.last_name || ''}`.trim() || 'Unnamed';
                  return (
                    <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{displayName}</span>
                        <span className="text-xs text-muted-foreground ml-4">
                          {cleaner.presentage_rate || 0}% • £{cleaner.hourly_rate || 0}/hr
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Booking Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Booking Total:</span>
              <span className="font-semibold">£{bookingTotalCost.toFixed(2)}</span>
            </div>
            {bookingTotalHours > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Hours:</span>
                <span className="font-semibold">{bookingTotalHours}h</span>
              </div>
            )}
          </div>

          {/* Rate Inputs */}
          {selectedCleaner && selectedCleaner !== 'none' && (
            <div className="bg-primary/5 rounded-lg p-4 space-y-3">
              {isHourlyService ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hourly-rate" className="text-sm text-muted-foreground">Hourly Rate (£):</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={recalculateCleanerPay}
                      className="h-7 text-xs"
                    >
                      Recalculate
                    </Button>
                  </div>
                  <Input
                    id="hourly-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={customHourlyRate}
                    onChange={(e) => setCustomHourlyRate(e.target.value)}
                    placeholder="Enter hourly rate"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="percentage-rate" className="text-sm text-muted-foreground">Percentage Rate (%):</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={recalculateCleanerPay}
                      className="h-7 text-xs"
                    >
                      Recalculate
                    </Button>
                  </div>
                  <Input
                    id="percentage-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={customPercentageRate}
                    onChange={(e) => setCustomPercentageRate(e.target.value)}
                    placeholder="Enter percentage rate"
                  />
                </div>
              )}
            </div>
          )}

          {/* Cleaner Pay Input - Always Editable */}
          <div className="space-y-2">
            <Label htmlFor="cleaner-pay" className="font-semibold">Cleaner Pay (£)</Label>
            <Input
              id="cleaner-pay"
              type="number"
              step="0.01"
              min="0"
              value={cleanerPay}
              onChange={(e) => setCleanerPay(e.target.value)}
              placeholder="Enter cleaner pay"
              className="text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              You can manually adjust the cleaner pay amount
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignCleanerToPastBookingDialog;
