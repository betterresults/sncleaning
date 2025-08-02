import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConvertToRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onSuccess: () => void;
}

interface RecurringData {
  frequently: string;
  interval: string;
  daysOfTheWeek: string;
  startDate: Date | undefined;
  startTime: string;
  cleaningType: string;
  hours: string;
  costPerHour: string;
  totalCost: string;
  paymentMethod: string;
  cleanerRate: string;
  cleaner: string;
}

const ConvertToRecurringDialog = ({ open, onOpenChange, booking, onSuccess }: ConvertToRecurringDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [cleaners, setCleaners] = useState<any[]>([]);
  
  const [recurringData, setRecurringData] = useState<RecurringData>({
    frequently: 'weekly',
    interval: '7',
    daysOfTheWeek: 'saturday',
    startDate: undefined,
    startTime: '09:00',
    cleaningType: booking?.cleaning_type || 'Standard Cleaning',
    hours: booking?.total_hours?.toString() || '2',
    costPerHour: booking?.cleaning_cost_per_hour?.toString() || '20',
    totalCost: booking?.total_cost?.toString() || '40',
    paymentMethod: booking?.payment_method || 'Cash',
    cleanerRate: booking?.cleaner_rate?.toString() || '16',
    cleaner: booking?.cleaner?.toString() || ''
  });

  const frequencies = [
    { value: 'weekly', label: 'Weekly', interval: '7' },
    { value: 'fortnightly', label: 'Fortnightly', interval: '14' },
    { value: 'monthly', label: 'Monthly', interval: '30' },
    { value: 'bi-weekly', label: 'Bi-weekly', interval: '14' }
  ];

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const cleaningTypes = [
    'Standard Cleaning',
    'Deep Cleaning',
    'Office Cleaning',
    'End of Tenancy',
    'After Builders Cleaning',
    'Carpet Cleaning'
  ];

  const paymentMethods = [
    'Cash',
    'Card',
    'Bank Transfer',
    'Freeagent',
    'Stripe'
  ];

  useEffect(() => {
    if (booking?.customer) {
      fetchCustomerAddresses();
      fetchCleaners();
      
      // Update form data when booking prop changes
      console.log('Booking data for recurring conversion:', booking);
      setRecurringData(prev => ({
        ...prev,
        cleaningType: booking?.cleaning_type || 'Standard Cleaning',
        hours: booking?.total_hours?.toString() || '2',
        costPerHour: booking?.cleaning_cost_per_hour?.toString() || '20',
        totalCost: booking?.total_cost?.toString() || '40',
        paymentMethod: booking?.payment_method || 'Cash',
        cleanerRate: booking?.cleaner_rate?.toString() || '16',
        cleaner: booking?.cleaner?.toString() || ''
      }));
    }
  }, [booking]);

  const fetchCustomerAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('id, address, postcode, is_default')
        .eq('customer_id', booking.customer)
        .order('is_default', { ascending: false });

      if (error) throw error;
      
      setCustomerAddresses(data || []);
      
      // Auto-select default address if available
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (data?.length > 0) {
        setSelectedAddressId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching customer addresses:', error);
    }
  };

  const fetchCleaners = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, full_name')
        .order('first_name');

      if (error) throw error;
      setCleaners(data || []);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    }
  };

  const handleFrequencyChange = (value: string) => {
    const frequency = frequencies.find(f => f.value === value);
    setRecurringData(prev => ({
      ...prev,
      frequently: value,
      interval: frequency?.interval || '7'
    }));
  };

  const handleInputChange = (field: keyof RecurringData, value: string | Date) => {
    setRecurringData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateRecurringGroupId = () => {
    return crypto.randomUUID();
  };

  const handleSubmit = async () => {
    if (!recurringData.startDate || !selectedAddressId) {
      toast({
        title: "Missing Information",
        description: "Please select a start date and address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const recurringGroupId = generateRecurringGroupId();
      
      const { error } = await supabase
        .from('recurring_services')
        .insert({
          customer: booking.customer,
          cleaner: parseInt(recurringData.cleaner) || booking.cleaner,
          address: selectedAddressId,
          cleaning_type: recurringData.cleaningType,
          frequently: recurringData.frequently,
          interval: recurringData.interval,
          days_of_the_week: recurringData.daysOfTheWeek,
          start_date: recurringData.startDate.toISOString().split('T')[0],
          start_time: `${recurringData.startTime}:00`,
          hours: parseFloat(recurringData.hours),
          cost_per_hour: parseFloat(recurringData.costPerHour),
          total_cost: parseFloat(recurringData.totalCost),
          payment_method: recurringData.paymentMethod,
          cleaner_rate: parseFloat(recurringData.cleanerRate),
          recurring_group_id: recurringGroupId
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Booking converted to recurring service successfully."
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating recurring service:', error);
      toast({
        title: "Error",
        description: "Failed to create recurring service.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = () => {
    const hours = parseFloat(recurringData.hours) || 0;
    const costPerHour = parseFloat(recurringData.costPerHour) || 0;
    return (hours * costPerHour).toFixed(2);
  };

  useEffect(() => {
    const newTotal = calculateTotalCost();
    setRecurringData(prev => ({
      ...prev,
      totalCost: newTotal
    }));
  }, [recurringData.hours, recurringData.costPerHour]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Convert to Recurring Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info Display */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Customer Information</h3>
            <p className="text-blue-800">
              {booking?.first_name} {booking?.last_name} - {booking?.email}
            </p>
          </div>

          {/* Address Selection */}
          <div className="space-y-2">
            <Label htmlFor="address">Customer Address *</Label>
            <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer address" />
              </SelectTrigger>
              <SelectContent>
                {customerAddresses.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    {address.address}, {address.postcode}
                    {address.is_default && " (Default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency *</Label>
              <Select value={recurringData.frequently} onValueChange={handleFrequencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Day of Week *</Label>
              <Select value={recurringData.daysOfTheWeek} onValueChange={(value) => handleInputChange('daysOfTheWeek', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !recurringData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {recurringData.startDate ? format(recurringData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={recurringData.startDate}
                    onSelect={(date) => handleInputChange('startDate', date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={recurringData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
              />
            </div>
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cleaning Type *</Label>
              <Select value={recurringData.cleaningType} onValueChange={(value) => handleInputChange('cleaningType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cleaningTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hours *</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={recurringData.hours}
                onChange={(e) => handleInputChange('hours', e.target.value)}
              />
            </div>
          </div>

          {/* Cost Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cost per Hour (£) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={recurringData.costPerHour}
                onChange={(e) => handleInputChange('costPerHour', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Total Cost (£)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={recurringData.totalCost}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Cleaner Rate (£) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={recurringData.cleanerRate}
                onChange={(e) => handleInputChange('cleanerRate', e.target.value)}
              />
            </div>
          </div>

          {/* Cleaner Selection */}
          <div className="space-y-2">
            <Label>Assigned Cleaner *</Label>
            <Select value={recurringData.cleaner} onValueChange={(value) => handleInputChange('cleaner', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a cleaner" />
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

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <Select value={recurringData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Creating..." : "Create Recurring Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertToRecurringDialog;