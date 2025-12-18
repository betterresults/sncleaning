import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Trash2, Home } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CustomerSelector from './CustomerSelector';
import CleanerSelector from './CleanerSelector';

interface BookingDate {
  id: string;
  date: Date;
  time: string;
  sameDayCleaning: boolean;
}

interface BulkAirbnbBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingsCreated: () => void;
}

const BulkAirbnbBookingDialog: React.FC<BulkAirbnbBookingDialogProps> = ({
  open,
  onOpenChange,
  onBookingsCreated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Base booking data
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [cleanerId, setCleanerId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [hours, setHours] = useState('3');
  const [costPerHour, setCostPerHour] = useState('20');
  const [cleanerRate, setCleanerRate] = useState('16');
  
  // Multiple dates
  const [bookingDates, setBookingDates] = useState<BookingDate[]>([
    { id: '1', date: new Date(), time: '10:00', sameDayCleaning: false }
  ]);

  const addBookingDate = () => {
    const lastDate = bookingDates[bookingDates.length - 1];
    const newDate = addDays(lastDate.date, 1);
    
    setBookingDates([
      ...bookingDates,
      {
        id: Date.now().toString(),
        date: newDate,
        time: lastDate.time,
        sameDayCleaning: false
      }
    ]);
  };

  const removeBookingDate = (id: string) => {
    if (bookingDates.length > 1) {
      setBookingDates(bookingDates.filter(booking => booking.id !== id));
    }
  };

  const updateBookingDate = (id: string, field: keyof BookingDate, value: any) => {
    setBookingDates(bookingDates.map(booking => 
      booking.id === id ? { ...booking, [field]: value } : booking
    ));
  };

  const handleSubmit = async () => {
    // Prevent double submissions
    if (loading) {
      console.log('BulkAirbnbBookingDialog: Submission already in progress, ignoring');
      return;
    }
    
    if (!customerId || !address || !postcode || bookingDates.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields and add at least one booking date",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get customer details
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;

      const totalCost = parseFloat(hours) * parseFloat(costPerHour);
      const cleanerPay = parseFloat(hours) * parseFloat(cleanerRate);

      // Create all bookings
      const bookingPromises = bookingDates.map(bookingDate => {
        const [hour, minute] = bookingDate.time.split(':').map(Number);
        const dateTime = new Date(bookingDate.date);
        dateTime.setHours(hour, minute, 0, 0);

        return supabase.from('bookings').insert({
          customer: customerId,
          cleaner: cleanerId,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone_number: customer.phone,
          date_time: dateTime.toISOString(),
          address,
          postcode,
          cleaning_type: 'Air BnB',
          service_type: 'Air BnB',
          frequently: bookingDate.sameDayCleaning ? 'Same Day' : 'One Off',
          total_hours: parseFloat(hours),
          total_cost: totalCost,
          cleaning_cost_per_hour: parseFloat(costPerHour),
          cleaner_rate: parseFloat(cleanerRate),
          cleaner_pay: cleanerPay,
          payment_method: 'Cash',
          booking_status: 'active',
          same_day: bookingDate.sameDayCleaning
        }).select();
      });

      const results = await Promise.all(bookingPromises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to create ${errors.length} booking(s)`);
      }

      // Log each successful booking creation to activity_logs
      const successfulResults = results.filter(result => !result.error && result.data);
      for (const result of successfulResults) {
        if (result.data && result.data.length > 0) {
          const booking = result.data[0];
          try {
            await supabase.from('activity_logs').insert({
              action_type: 'booking_created',
              entity_type: 'booking',
              entity_id: booking.id?.toString(),
              user_role: 'admin',
              details: {
                booking_id: booking.id,
                customer_name: `${customer.first_name} ${customer.last_name}`,
                customer_email: customer.email,
                booking_date: booking.date_time,
                service_type: 'Air BnB',
                address: `${address}, ${postcode}`
              }
            });
          } catch (logError) {
            console.error('Failed to log booking creation:', logError);
            // Don't fail if logging fails
          }
        }
      }

      toast({
        title: "Success",
        description: `Created ${bookingDates.length} Airbnb bookings successfully`,
      });

      onBookingsCreated();
      onOpenChange(false);
      
      // Reset form
      setCustomerId(null);
      setCleanerId(null);
      setAddress('');
      setPostcode('');
      setHours('3');
      setCostPerHour('20');
      setCleanerRate('16');
      setBookingDates([{ id: '1', date: new Date(), time: '10:00', sameDayCleaning: false }]);

    } catch (error) {
      console.error('Error creating bulk bookings:', error);
      toast({
        title: "Error",
        description: "Failed to create bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sameDayCount = bookingDates.filter(b => b.sameDayCleaning).length;
  const regularCount = bookingDates.length - sameDayCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-600" />
            Bulk Create Airbnb Bookings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Base Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Customer *</Label>
              <CustomerSelector onCustomerSelect={(customer) => customer && setCustomerId(customer.id)} />
            </div>

            <div>
              <Label>Cleaner</Label>
              <CleanerSelector onCleanerSelect={(cleaner) => cleaner && setCleanerId(cleaner.id)} />
            </div>

            <div>
              <Label>Address *</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Property address"
              />
            </div>

            <div>
              <Label>Postcode *</Label>
              <Input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Postcode"
              />
            </div>

            <div>
              <Label>Hours *</Label>
              <Input
                type="number"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Hours required"
              />
            </div>

            <div>
              <Label>Cost per Hour *</Label>
              <Input
                type="number"
                step="0.01"
                value={costPerHour}
                onChange={(e) => setCostPerHour(e.target.value)}
                placeholder="Cost per hour"
              />
            </div>
          </div>

          {/* Booking Dates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Booking Dates & Times</Label>
              <div className="flex gap-2">
                <Badge variant="secondary">{regularCount} Regular</Badge>
                <Badge variant="outline">{sameDayCount} Same Day</Badge>
              </div>
            </div>

            <div className="space-y-3">
              {bookingDates.map((booking, index) => (
                <div key={booking.id} className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                  <span className="text-sm font-medium w-8">{index + 1}.</span>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-40 justify-start text-left font-normal",
                          !booking.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(booking.date, "MMM dd")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={booking.date}
                        onSelect={(date) => date && updateBookingDate(booking.id, 'date', date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Input
                    type="time"
                    value={booking.time}
                    onChange={(e) => updateBookingDate(booking.id, 'time', e.target.value)}
                    className="w-32"
                  />

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={booking.sameDayCleaning}
                      onCheckedChange={(checked) => 
                        updateBookingDate(booking.id, 'sameDayCleaning', checked)
                      }
                    />
                    <Label className="text-sm">Same Day</Label>
                  </div>

                  {bookingDates.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBookingDate(booking.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addBookingDate}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Date
            </Button>
          </div>

          {/* Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Summary</h4>
            <p className="text-sm text-gray-600">
              Creating {bookingDates.length} Airbnb bookings ({regularCount} regular, {sameDayCount} same day)
            </p>
            <p className="text-sm text-gray-600">
              Total cost per booking: £{(parseFloat(hours) * parseFloat(costPerHour)).toFixed(2)}
            </p>
          </div>
        </div>

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
            disabled={loading || !customerId || !address || !postcode}
          >
            {loading ? 'Creating...' : `Create ${bookingDates.length} Bookings`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkAirbnbBookingDialog;