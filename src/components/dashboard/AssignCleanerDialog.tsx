
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Trash2, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  presentage_rate: number;
  hourly_rate: number;
}

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
  const [customHourlyRate, setCustomHourlyRate] = useState<string>('');
  const [customHours, setCustomHours] = useState<string>('');
  const [customPercentageRate, setCustomPercentageRate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'hourly' | 'percentage'>('percentage');
  
  // Additional cleaners state
  const [subCleaners, setSubCleaners] = useState<SubCleaner[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCleanerId, setNewCleanerId] = useState<string>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'hourly' | 'percentage'>('percentage');
  const [newHours, setNewHours] = useState<string>('');
  const [newHourlyRate, setNewHourlyRate] = useState<string>('');
  const [newPercentageRate, setNewPercentageRate] = useState<string>('');
  const [addingSubCleaner, setAddingSubCleaner] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (open && bookingId) {
      fetchCleaners();
      fetchBookingDetails();
      fetchSubCleaners();
    }
  }, [open, bookingId]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('total_cost, cleaner, total_hours, cleaning_time, service_type, cleaner_rate, cleaner_percentage')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      
      setBookingTotalCost(data.total_cost || 0);
      const hours = data.total_hours || data.cleaning_time || 0;
      setBookingTotalHours(hours);
      setCustomHours(hours.toString());
      
      // Determine payment method based on existing data
      if (data.cleaner_rate != null && data.cleaner_rate > 0) {
        setPaymentMethod('hourly');
      } else {
        setPaymentMethod('percentage');
      }
      
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
        .select('id, first_name, last_name, full_name, presentage_rate, hourly_rate')
        .order('first_name');

      if (error) {
        console.error('Error fetching cleaners:', error);
        return;
      }

      setCleaners(data || []);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    }
  };

  const fetchSubCleaners = async () => {
    if (!bookingId) return;
    
    try {
      const { data, error } = await supabase
        .from('sub_bookings')
        .select(`
          id,
          cleaner_id,
          payment_method,
          hourly_rate,
          percentage_rate,
          hours_assigned,
          cleaner_pay,
          cleaner:cleaners(first_name, last_name, full_name)
        `)
        .eq('primary_booking_id', bookingId);

      if (error) throw error;
      setSubCleaners((data || []) as unknown as SubCleaner[]);
    } catch (error) {
      console.error('Error fetching sub cleaners:', error);
    }
  };

  // Set default rates when main cleaner is selected
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

  // Set default rates when new additional cleaner is selected
  useEffect(() => {
    if (newCleanerId) {
      const cleaner = cleaners.find(c => c.id.toString() === newCleanerId);
      if (cleaner) {
        setNewHourlyRate(cleaner.hourly_rate?.toString() || '');
        setNewPercentageRate(cleaner.presentage_rate?.toString() || '');
      }
    } else {
      setNewHourlyRate('');
      setNewPercentageRate('');
    }
  }, [newCleanerId, cleaners]);

  // Calculate main cleaner pay when values change
  useEffect(() => {
    if (selectedCleaner) {
      let calculatedPay: number | null = null;
      
      if (paymentMethod === 'hourly') {
        const hours = parseFloat(customHours) || 0;
        const hourlyRate = parseFloat(customHourlyRate) || 0;
        if (hours > 0 && hourlyRate > 0) {
          calculatedPay = hours * hourlyRate;
        }
      } else {
        const percentageRate = parseFloat(customPercentageRate) || 0;
        if (bookingTotalCost > 0 && percentageRate > 0) {
          calculatedPay = (bookingTotalCost * percentageRate) / 100;
        }
      }
      
      setCalculatedCleanerPay(calculatedPay);
    } else {
      setCalculatedCleanerPay(null);
    }
  }, [selectedCleaner, bookingTotalCost, paymentMethod, customHours, customHourlyRate, customPercentageRate]);

  const calculateNewCleanerPay = (): number => {
    if (newPaymentMethod === 'hourly') {
      const hours = parseFloat(newHours) || 0;
      const rate = parseFloat(newHourlyRate) || 0;
      return hours * rate;
    } else {
      const rate = parseFloat(newPercentageRate) || 0;
      return (bookingTotalCost * rate) / 100;
    }
  };

  const handleAddSubCleaner = async () => {
    if (!bookingId || !newCleanerId) return;
    
    setAddingSubCleaner(true);
    try {
      const cleanerPay = calculateNewCleanerPay();
      
      const { error } = await supabase
        .from('sub_bookings')
        .insert({
          primary_booking_id: bookingId,
          cleaner_id: parseInt(newCleanerId),
          payment_method: newPaymentMethod,
          hourly_rate: newPaymentMethod === 'hourly' ? parseFloat(newHourlyRate) : null,
          percentage_rate: newPaymentMethod === 'percentage' ? parseFloat(newPercentageRate) : null,
          hours_assigned: parseFloat(newHours) || 0,
          cleaner_pay: cleanerPay
        });

      if (error) throw error;

      toast({ title: "Success", description: "Additional cleaner added" });
      
      // Reset form and refresh list
      setNewCleanerId('');
      setNewHours('');
      setNewHourlyRate('');
      setNewPercentageRate('');
      setShowAddForm(false);
      fetchSubCleaners();
    } catch (error) {
      console.error('Error adding sub cleaner:', error);
      toast({ title: "Error", description: "Failed to add additional cleaner", variant: "destructive" });
    } finally {
      setAddingSubCleaner(false);
    }
  };

  const handleRemoveSubCleaner = async (subCleanerId: number) => {
    try {
      const { error } = await supabase
        .from('sub_bookings')
        .delete()
        .eq('id', subCleanerId);

      if (error) throw error;
      
      toast({ title: "Success", description: "Additional cleaner removed" });
      fetchSubCleaners();
    } catch (error) {
      console.error('Error removing sub cleaner:', error);
      toast({ title: "Error", description: "Failed to remove cleaner", variant: "destructive" });
    }
  };

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
        
        if (paymentMethod === 'hourly') {
          updateData.cleaner_rate = parseFloat(customHourlyRate);
          updateData.cleaner_percentage = null;
        } else {
          updateData.cleaner_percentage = parseFloat(customPercentageRate);
          updateData.cleaner_rate = null;
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
      resetForm();
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

  const resetForm = () => {
    setSelectedCleaner('');
    setCalculatedCleanerPay(null);
    setCustomHourlyRate('');
    setCustomHours('');
    setCustomPercentageRate('');
    setShowAddForm(false);
    setNewCleanerId('');
    setSubCleaners([]);
  };

  // Get available cleaners for additional (excluding main cleaner and already added)
  const availableCleanersForAdditional = cleaners.filter(c => 
    c.id.toString() !== selectedCleaner && 
    !subCleaners.some(sc => sc.cleaner_id === c.id)
  );

  const totalAdditionalPay = subCleaners.reduce((sum, sc) => sum + (sc.cleaner_pay || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Cleaners</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Main Cleaner Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Primary Cleaner</Label>
            <Select value={selectedCleaner} onValueChange={setSelectedCleaner}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a cleaner" />
              </SelectTrigger>
              <SelectContent>
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

          {/* Main cleaner payment details */}
          {selectedCleaner && (
            <div className="bg-primary/5 rounded-lg p-4 space-y-3">
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(v) => setPaymentMethod(v as 'hourly' | 'percentage')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="main-percentage" />
                  <Label htmlFor="main-percentage" className="text-sm">Percentage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hourly" id="main-hourly" />
                  <Label htmlFor="main-hourly" className="text-sm">Hourly</Label>
                </div>
              </RadioGroup>

              {paymentMethod === 'hourly' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      placeholder="Hours"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hourly Rate (£)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customHourlyRate}
                      onChange={(e) => setCustomHourlyRate(e.target.value)}
                      placeholder="Rate"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Booking Total:</span>
                    <span className="font-medium">£{bookingTotalCost.toFixed(2)}</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Percentage Rate (%)</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={customPercentageRate}
                      onChange={(e) => setCustomPercentageRate(e.target.value)}
                      placeholder="Percentage"
                    />
                  </div>
                </div>
              )}

              {calculatedCleanerPay !== null && (
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-sm font-medium">Primary Cleaner Pay:</span>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Additional Cleaners</Label>
                  </div>
                  {subCleaners.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Total: £{totalAdditionalPay.toFixed(2)}
                    </span>
                  )}
                </div>
                
                {/* List existing sub cleaners */}
                {subCleaners.length > 0 && (
                  <div className="space-y-2">
                    {subCleaners.map((sc) => (
                      <div key={sc.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {sc.cleaner?.full_name || `${sc.cleaner?.first_name} ${sc.cleaner?.last_name}`}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {sc.payment_method === 'hourly' ? 'Hourly' : 'Percentage'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">£{sc.cleaner_pay?.toFixed(2)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveSubCleaner(sc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Add Form */}
                {showAddForm ? (
                  <div className="bg-muted/30 rounded-lg p-3 space-y-3 border">
                    <Select value={newCleanerId} onValueChange={setNewCleanerId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select cleaner" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCleanersForAdditional.map((cleaner) => (
                          <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                            {cleaner.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {newCleanerId && (
                      <>
                        <RadioGroup 
                          value={newPaymentMethod} 
                          onValueChange={(v) => setNewPaymentMethod(v as 'hourly' | 'percentage')}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="percentage" id="new-percentage" />
                            <Label htmlFor="new-percentage" className="text-xs">Percentage</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hourly" id="new-hourly" />
                            <Label htmlFor="new-hourly" className="text-xs">Hourly</Label>
                          </div>
                        </RadioGroup>

                        {newPaymentMethod === 'hourly' ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Hours</Label>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={newHours}
                                onChange={(e) => setNewHours(e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Rate (£/hr)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={newHourlyRate}
                                onChange={(e) => setNewHourlyRate(e.target.value)}
                                className="h-8"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Percentage (%)</Label>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              value={newPercentageRate}
                              onChange={(e) => setNewPercentageRate(e.target.value)}
                              className="h-8"
                            />
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Expected Pay:</span>
                          <span className="font-semibold">£{calculateNewCleanerPay().toFixed(2)}</span>
                        </div>
                      </>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewCleanerId('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={handleAddSubCleaner}
                        disabled={!newCleanerId || addingSubCleaner}
                      >
                        {addingSubCleaner ? 'Adding...' : 'Add'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setShowAddForm(true)}
                    disabled={availableCleanersForAdditional.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Additional Cleaner
                  </Button>
                )}
              </div>
            </>
          )}
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
            onClick={handleAssign}
            disabled={!selectedCleaner || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignCleanerDialog;
