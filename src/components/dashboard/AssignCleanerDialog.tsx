
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';
import SubCleanersList from '@/components/booking/SubCleanersList';
import AddSubCleanerDialog from '@/components/booking/AddSubCleanerDialog';

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
  const [customHourlyRate, setCustomHourlyRate] = useState<string>('');
  const [customPercentageRate, setCustomPercentageRate] = useState<string>('');
  const [subCleanersKey, setSubCleanersKey] = useState(0);
  const { toast } = useToast();
  
  const handleSubCleanerChange = () => {
    setSubCleanersKey(prev => prev + 1);
  };

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

  // Set default rates when cleaner is selected
  useEffect(() => {
    if (selectedCleaner) {
      const cleaner = cleaners.find(c => c.id.toString() === selectedCleaner);
      if (cleaner) {
        setCustomHourlyRate(cleaner.hourly_rate?.toString() || '');
        setCustomPercentageRate(cleaner.presentage_rate?.toString() || '');
      }
    } else {
      setCustomHourlyRate('');
      setCustomPercentageRate('');
    }
  }, [selectedCleaner, cleaners]);

  // Calculate cleaner pay when values change
  useEffect(() => {
    if (selectedCleaner) {
      let calculatedPay: number | null = null;
      
      if (isHourlyService && bookingTotalHours > 0 && customHourlyRate) {
        // Use hourly rate calculation
        const hourlyRate = parseFloat(customHourlyRate);
        if (!isNaN(hourlyRate)) {
          calculatedPay = bookingTotalHours * hourlyRate;
        }
      } else if (bookingTotalCost > 0 && customPercentageRate) {
        // Use percentage calculation
        const percentageRate = parseFloat(customPercentageRate);
        if (!isNaN(percentageRate)) {
          calculatedPay = (bookingTotalCost * percentageRate) / 100;
        }
      }
      
      setCalculatedCleanerPay(calculatedPay);
    } else {
      setCalculatedCleanerPay(null);
    }
  }, [selectedCleaner, bookingTotalCost, bookingTotalHours, isHourlyService, customHourlyRate, customPercentageRate]);

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
        
        // Store the custom rates used
        if (isHourlyService && customHourlyRate) {
          updateData.cleaner_rate = parseFloat(customHourlyRate);
        } else if (customPercentageRate) {
          updateData.cleaner_percentage = parseFloat(customPercentageRate);
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
          {selectedCleaner && (
            <div className="bg-primary/5 rounded-lg p-4 space-y-3">
              {isHourlyService ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Hours:</span>
                    <span className="font-semibold">{bookingTotalHours.toFixed(2)}h</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly-rate" className="text-sm text-muted-foreground">Hourly Rate (£):</Label>
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
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Booking Total:</span>
                    <span className="font-semibold">£{bookingTotalCost.toFixed(2)}</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="percentage-rate" className="text-sm text-muted-foreground">Cleaner Rate (%):</Label>
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
                </>
              )}
              {calculatedCleanerPay !== null && (
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-sm font-semibold">Cleaner Pay:</span>
                  <span className="text-lg font-bold text-primary">£{calculatedCleanerPay.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Additional Cleaners Section */}
          {bookingId && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Additional Cleaners</Label>
                </div>
                
                <SubCleanersList 
                  key={subCleanersKey}
                  bookingId={bookingId} 
                  compact={true}
                  onSubCleanerRemoved={handleSubCleanerChange}
                  onSubCleanerUpdated={handleSubCleanerChange}
                />
                
                <AddSubCleanerDialog 
                  bookingId={bookingId} 
                  onSubCleanerAdded={handleSubCleanerChange}
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Add Additional Cleaner
                  </Button>
                </AddSubCleanerDialog>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedCleaner('');
              setCalculatedCleanerPay(null);
              setCustomHourlyRate('');
              setCustomPercentageRate('');
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
