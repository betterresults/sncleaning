
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Cleaner {
  id: number;
  full_name: string;
  presentage_rate: number;
  hourly_rate: number;
}

interface AssignCleanerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: number | null;
  onSuccess: () => void;
}

const AssignCleanerDialog: React.FC<AssignCleanerDialogProps> = ({
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
  const [calculatedCleanerPay, setCalculatedCleanerPay] = useState<number | null>(null);
  const [isHourlyService, setIsHourlyService] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && bookingId) {
      fetchCleaners();
      fetchBookingDetails();
    }
  }, [open, bookingId]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('total_cost, cleaner, total_hours, cleaning_time, service_type, cleaner_rate')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      
      setBookingTotalCost(data.total_cost || 0);
      const hours = data.total_hours || data.cleaning_time || 0;
      setBookingTotalHours(hours);
      
      // Determine if this is an hourly service (based on cleaner_rate being set or service type)
      const isHourly = data.cleaner_rate != null && data.cleaner_rate > 0;
      setIsHourlyService(isHourly);
      
      if (data.cleaner) {
        setSelectedCleaner(data.cleaner.toString());
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  };

  const fetchCleaners = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id, full_name, presentage_rate, hourly_rate')
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

  // Calculate cleaner pay when cleaner is selected
  useEffect(() => {
    if (selectedCleaner) {
      const cleaner = cleaners.find(c => c.id.toString() === selectedCleaner);
      if (cleaner) {
        let calculatedPay: number;
        
        if (isHourlyService && bookingTotalHours > 0 && cleaner.hourly_rate) {
          // Use hourly rate calculation
          calculatedPay = bookingTotalHours * cleaner.hourly_rate;
        } else if (bookingTotalCost > 0 && cleaner.presentage_rate) {
          // Use percentage calculation
          calculatedPay = (bookingTotalCost * cleaner.presentage_rate) / 100;
        } else {
          setCalculatedCleanerPay(null);
          return;
        }
        
        setCalculatedCleanerPay(calculatedPay);
      } else {
        setCalculatedCleanerPay(null);
      }
    } else {
      setCalculatedCleanerPay(null);
    }
  }, [selectedCleaner, bookingTotalCost, bookingTotalHours, isHourlyService, cleaners]);

  const handleAssign = async () => {
    if (!bookingId || !selectedCleaner) return;

    setIsLoading(true);

    try {
      const updateData: any = { 
        cleaner: parseInt(selectedCleaner)
      };

      // Add calculated cleaner pay if available
      if (calculatedCleanerPay !== null) {
        updateData.cleaner_pay = calculatedCleanerPay;
        
        // Also store the cleaner percentage used
        const cleaner = cleaners.find(c => c.id.toString() === selectedCleaner);
        if (cleaner) {
          updateData.cleaner_percentage = cleaner.presentage_rate;
        }
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) {
        console.error('Error assigning cleaner:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Cleaner assigned${calculatedCleanerPay ? ` with £${calculatedCleanerPay.toFixed(2)} pay` : ''}`,
      });

      onSuccess();
      onOpenChange(false);
      setSelectedCleaner('');
      setCalculatedCleanerPay(null);
    } catch (error) {
      console.error('Error assigning cleaner:', error);
      toast({
        title: "Error",
        description: "Failed to assign cleaner",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Cleaner</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Cleaner</Label>
            <Select value={selectedCleaner} onValueChange={setSelectedCleaner}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a cleaner" />
              </SelectTrigger>
              <SelectContent>
                {cleaners.map((cleaner) => (
                  <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{cleaner.full_name}</span>
                      <span className="text-xs text-muted-foreground ml-4">
                        {cleaner.presentage_rate}% • £{cleaner.hourly_rate}/hr
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Show calculated cleaner pay */}
          {calculatedCleanerPay !== null && (
            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
              {isHourlyService ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Hours:</span>
                    <span className="font-semibold">{bookingTotalHours.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Hourly Rate:</span>
                    <span className="font-semibold">
                      £{cleaners.find(c => c.id.toString() === selectedCleaner)?.hourly_rate}/hr
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Booking Total:</span>
                    <span className="font-semibold">£{bookingTotalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cleaner Rate:</span>
                    <span className="font-semibold">
                      {cleaners.find(c => c.id.toString() === selectedCleaner)?.presentage_rate}%
                    </span>
                  </div>
                </>
              )}
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-sm font-semibold">Cleaner Pay:</span>
                <span className="text-lg font-bold text-primary">£{calculatedCleanerPay.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedCleaner('');
              setCalculatedCleanerPay(null);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedCleaner || isLoading}
          >
            {isLoading ? 'Assigning...' : 'Assign Cleaner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignCleanerDialog;
