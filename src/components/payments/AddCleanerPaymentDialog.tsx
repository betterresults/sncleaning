import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, ChevronDown, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
}

interface PastBooking {
  id: number;
  date_time: string;
  address: string;
  postcode: string;
  service_type: string;
  total_cost: string;
  total_hours: number;
  customer: number;
  first_name?: string;
  last_name?: string;
}

interface AddCleanerPaymentDialogProps {
  onPaymentAdded: () => void;
}

const AddCleanerPaymentDialog: React.FC<AddCleanerPaymentDialogProps> = ({ onPaymentAdded }) => {
  const [open, setOpen] = useState(false);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [bookings, setBookings] = useState<PastBooking[]>([]);
  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<PastBooking | null>(null);
  const [cleanerPay, setCleanerPay] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [loading, setLoading] = useState(false);
  const [cleanerDropdownOpen, setCleanerDropdownOpen] = useState(false);
  const [bookingDropdownOpen, setBookingDropdownOpen] = useState(false);
  const [cleanerSearch, setCleanerSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');

  useEffect(() => {
    if (open) {
      fetchCleaners();
      fetchBookings();
    }
  }, [open]);

  const fetchCleaners = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      setCleaners(data || []);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('past_bookings')
        .select('id, date_time, address, postcode, service_type, total_cost, total_hours, customer, first_name, last_name')
        .order('date_time', { ascending: false })
        .limit(500);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCleaner || !selectedBooking) {
      toast.error('Please select both a cleaner and a booking');
      return;
    }

    if (!cleanerPay || parseFloat(cleanerPay) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    try {
      // Update the past_booking with the cleaner and payment info
      const { error } = await supabase
        .from('past_bookings')
        .update({
          cleaner: selectedCleaner.id,
          cleaner_pay: parseFloat(cleanerPay),
          cleaner_pay_status: paymentStatus
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      toast.success('Payment record added successfully');
      setOpen(false);
      resetForm();
      onPaymentAdded();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Failed to add payment record');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCleaner(null);
    setSelectedBooking(null);
    setCleanerPay('');
    setPaymentStatus('Unpaid');
    setCleanerSearch('');
    setBookingSearch('');
  };

  const filteredCleaners = cleaners.filter(cleaner =>
    `${cleaner.first_name} ${cleaner.last_name}`.toLowerCase().includes(cleanerSearch.toLowerCase())
  );

  const filteredBookings = bookings.filter(booking => {
    const searchLower = bookingSearch.toLowerCase();
    return (
      booking.address?.toLowerCase().includes(searchLower) ||
      booking.postcode?.toLowerCase().includes(searchLower) ||
      booking.id.toString().includes(searchLower) ||
      `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Cleaner Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cleaner Selection */}
          <div className="space-y-2">
            <Label>Select Cleaner</Label>
            <Popover open={cleanerDropdownOpen} onOpenChange={setCleanerDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedCleaner
                    ? `${selectedCleaner.first_name} ${selectedCleaner.last_name}`
                    : "Select a cleaner..."}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search cleaner..."
                    value={cleanerSearch}
                    onValueChange={setCleanerSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No cleaner found.</CommandEmpty>
                    <CommandGroup className="max-h-48 overflow-auto">
                      {filteredCleaners.map((cleaner) => (
                        <CommandItem
                          key={cleaner.id}
                          onSelect={() => {
                            setSelectedCleaner(cleaner);
                            setCleanerDropdownOpen(false);
                          }}
                        >
                          {cleaner.first_name} {cleaner.last_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Booking Selection */}
          <div className="space-y-2">
            <Label>Select Booking</Label>
            <Popover open={bookingDropdownOpen} onOpenChange={setBookingDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between text-left"
                >
                  {selectedBooking ? (
                    <span className="truncate">
                      #{selectedBooking.id} - {selectedBooking.postcode} - {format(new Date(selectedBooking.date_time), 'dd/MM/yy')}
                    </span>
                  ) : (
                    "Select a booking..."
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search by address, postcode, or ID..."
                    value={bookingSearch}
                    onValueChange={setBookingSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No booking found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {filteredBookings.slice(0, 50).map((booking) => (
                        <CommandItem
                          key={booking.id}
                          onSelect={() => {
                            setSelectedBooking(booking);
                            setBookingDropdownOpen(false);
                          }}
                          className="flex flex-col items-start py-2"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="font-medium">#{booking.id}</span>
                            <span className="text-muted-foreground">-</span>
                            <span className="font-medium">{booking.postcode}</span>
                            <span className="text-muted-foreground text-sm ml-auto">
                              {format(new Date(booking.date_time), 'dd MMM yyyy')}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground truncate w-full">
                            {booking.address}
                          </div>
                          {(booking.first_name || booking.last_name) && (
                            <div className="text-xs text-muted-foreground">
                              Customer: {booking.first_name} {booking.last_name}
                            </div>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Selected Booking Details */}
          {selectedBooking && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium">{selectedBooking.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{format(new Date(selectedBooking.date_time), 'dd MMM yyyy HH:mm')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="font-medium">£{selectedBooking.total_cost || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hours:</span>
                <span className="font-medium">{selectedBooking.total_hours || 0}h</span>
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label>Payment Amount (£)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter payment amount"
              value={cleanerPay}
              onChange={(e) => setCleanerPay(e.target.value)}
            />
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCleanerPaymentDialog;
