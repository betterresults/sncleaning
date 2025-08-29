import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  total_cost: number;
  cleaner_pay: number;
  cleaner: number | null;
  total_hours: number;
  hours_required: number;
  cleaning_time: number;
  ironing_hours: number;
  cleaner_rate: number;
  cleaner_percentage: number;
  payment_status: string;
  booking_status: string;
  cleaning_type: string;
  occupied: string;
  frequently: string;
  extras: string;
  linens: string;
  linen_management: boolean;
  linen_used: any;
  ironing: string;
  property_details: string;
  additional_details: string;
  parking_details: string;
  key_collection: string;
  access: string;
  agency: string;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
}

interface BulkEditBookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  paymentStatus: string;
  bookingStatus: string;
  customerSearch: string;
}

const BulkEditBookingsDialog: React.FC<BulkEditBookingsDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [editType, setEditType] = useState<string>('total_cost');
  const [newValue, setNewValue] = useState<string>('');
  const [editTypeOpen, setEditTypeOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    paymentStatus: 'all',
    bookingStatus: 'all',
    customerSearch: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchBookings();
      fetchCleaners();
      setFilters({
        dateFrom: '',
        dateTo: '',
        paymentStatus: 'all',
        bookingStatus: 'all',
        customerSearch: '',
      });
      setSelectedBookings([]);
      setNewValue('');
    }
  }, [open]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          date_time,
          first_name,
          last_name,
          email,
          phone_number,
          address,
          postcode,
          total_cost,
          cleaner_pay,
          cleaner,
          total_hours,
          hours_required,
          cleaning_time,
          ironing_hours,
          cleaner_rate,
          cleaner_percentage,
          payment_status,
          booking_status,
          cleaning_type,
          occupied,
          frequently,
          extras,
          linens,
          linen_management,
          linen_used,
          ironing,
          property_details,
          additional_details,
          parking_details,
          key_collection,
          access,
          agency,
          cleaners!bookings_cleaner_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchCleaners = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name')
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

  const applyFilters = () => {
    let filtered = [...bookings];

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(booking => 
        new Date(booking.date_time) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(booking => 
        new Date(booking.date_time) <= new Date(filters.dateTo)
      );
    }

    // Payment status filter
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(booking => 
        booking.payment_status === filters.paymentStatus
      );
    }

    // Booking status filter
    if (filters.bookingStatus !== 'all') {
      filtered = filtered.filter(booking => 
        booking.booking_status === filters.bookingStatus
      );
    }

    // Customer search
    if (filters.customerSearch) {
      filtered = filtered.filter(booking => {
        const customerName = `${booking.first_name} ${booking.last_name}`.toLowerCase();
        const cleanerName = booking.cleaners ? `${booking.cleaners.first_name} ${booking.cleaners.last_name}`.toLowerCase() : '';
        const dateString = booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : '';
        
        return customerName.includes(filters.customerSearch.toLowerCase()) ||
               cleanerName.includes(filters.customerSearch.toLowerCase()) ||
               dateString.includes(filters.customerSearch.toLowerCase()) ||
               booking.email?.toLowerCase().includes(filters.customerSearch.toLowerCase()) ||
               booking.address?.toLowerCase().includes(filters.customerSearch.toLowerCase());
      });
    }

    setFilteredBookings(filtered);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      paymentStatus: 'all',
      bookingStatus: 'all',
      customerSearch: '',
    });
  };

  const handleBookingSelect = (bookingId: number, checked: boolean) => {
    if (checked) {
      setSelectedBookings([...selectedBookings, bookingId]);
    } else {
      setSelectedBookings(selectedBookings.filter(id => id !== bookingId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(filteredBookings.map(b => b.id));
    } else {
      setSelectedBookings([]);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedBookings.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one booking to update.",
        variant: "destructive",
      });
      return;
    }

    // Skip validation for boolean fields
    if (editType !== 'linen_management' && (!newValue || (typeof newValue === 'string' && newValue.trim() === ''))) {
      toast({
        title: "Invalid Value",
        description: "Please enter a valid value.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let updateData: any = {};
      
      // Handle different field types
      switch (editType) {
        case 'total_cost':
        case 'cleaner_pay':
        case 'cleaner_rate':
        case 'cleaner_percentage':
        case 'total_hours':
        case 'hours_required':
        case 'cleaning_time':
        case 'ironing_hours':
          const numValue = parseFloat(newValue);
          if (isNaN(numValue) || numValue < 0) {
            toast({
              title: "Invalid Number",
              description: "Please enter a valid number.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          updateData = { [editType]: numValue };
          break;
        case 'cleaner':
          const cleanerId = parseInt(newValue);
          if (isNaN(cleanerId)) {
            toast({
              title: "Invalid Cleaner",
              description: "Please select a valid cleaner.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          updateData = { cleaner: cleanerId };
          break;
        case 'linen_management':
          // Convert string to boolean
          const boolValue = newValue === 'true';
          updateData = { linen_management: boolValue };
          break;
        default:
          // Text fields
          updateData = { [editType]: newValue };
          break;
      }
      
      console.log('Update data:', updateData);
      console.log('Selected bookings:', selectedBookings);
      
      const { data, error, count } = await supabase
        .from('bookings')
        .update(updateData)
        .in('id', selectedBookings)
        .select();

      console.log('Update result:', { data, error, count });

      if (error) {
        console.error('Error updating bookings:', error);
        toast({
          title: "Update Failed",
          description: "Error updating bookings: " + error.message,
          variant: "destructive",
        });
        return;
      }

      if (!data || data.length === 0) {
        toast({
          title: "Update Failed",
          description: "No bookings were updated. Please check your selection.",
          variant: "destructive",
        });
        return;
      }

      console.log(`Successfully updated ${selectedBookings.length} bookings`);
      
      toast({
        title: "Update Successful",
        description: `Successfully updated ${selectedBookings.length} booking${selectedBookings.length !== 1 ? 's' : ''}`,
      });
      
      // Refresh the bookings data
      await fetchBookings();
      
      // Update local filtered bookings to reflect the changes immediately
      setFilteredBookings(prevBookings => 
        prevBookings.map(booking => {
          if (selectedBookings.includes(booking.id)) {
            return { ...booking, ...updateData };
          }
          return booking;
        })
      );
      
      onSuccess();
      
      // Clear selections and reset form, but keep dialog open
      setSelectedBookings([]);
      setNewValue('');
      
    } catch (error) {
      console.error('Error updating bookings:', error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = () => {
    const labels: Record<string, string> = {
      total_cost: 'Total Cost',
      cleaner_pay: 'Cleaner Pay',
      cleaner_rate: 'Hourly Rate',
      cleaner_percentage: 'Percentage',
      total_hours: 'Total Hours',
      hours_required: 'Hours Required',
      cleaning_time: 'Cleaning Time',
      ironing_hours: 'Ironing Hours',
      payment_status: 'Payment Status',
      booking_status: 'Booking Status',
      cleaning_type: 'Cleaning Type',
      occupied: 'Occupied',
      frequently: 'Frequency',
      extras: 'Extras',
      linens: 'Old Linens (Legacy)',
      linen_management: 'Linen Management',
      ironing: 'Ironing',
      first_name: 'First Name',
      last_name: 'Last Name',
      email: 'Email',
      phone_number: 'Phone Number',
      address: 'Address',
      postcode: 'Postcode',
      property_details: 'Property Details',
      additional_details: 'Additional Details',
      parking_details: 'Parking Details',
      key_collection: 'Key Collection',
      access: 'Access',
      agency: 'Agency',
      cleaner: 'Cleaner'
    };
    return labels[editType] || 'Value';
  };

  const getEditTypeOptions = () => {
    return [
      { value: 'total_cost', label: 'Total Cost' },
      { value: 'cleaner_pay', label: 'Cleaner Pay' },
      { value: 'cleaner_rate', label: 'Hourly Rate' },
      { value: 'cleaner_percentage', label: 'Percentage' },
      { value: 'total_hours', label: 'Total Hours' },
      { value: 'hours_required', label: 'Hours Required' },
      { value: 'cleaning_time', label: 'Cleaning Time' },
      { value: 'ironing_hours', label: 'Ironing Hours' },
      { value: 'payment_status', label: 'Payment Status' },
      { value: 'booking_status', label: 'Booking Status' },
      { value: 'cleaning_type', label: 'Cleaning Type' },
      { value: 'occupied', label: 'Occupied' },
      { value: 'frequently', label: 'Frequency' },
      { value: 'extras', label: 'Extras' },
      { value: 'linens', label: 'Old Linens (Legacy)' },
      { value: 'linen_management', label: 'Linen Management' },
      { value: 'ironing', label: 'Ironing' },
      { value: 'first_name', label: 'First Name' },
      { value: 'last_name', label: 'Last Name' },
      { value: 'email', label: 'Email' },
      { value: 'phone_number', label: 'Phone Number' },
      { value: 'address', label: 'Address' },
      { value: 'postcode', label: 'Postcode' },
      { value: 'property_details', label: 'Property Details' },
      { value: 'additional_details', label: 'Additional Details' },
      { value: 'parking_details', label: 'Parking Details' },
      { value: 'key_collection', label: 'Key Collection' },
      { value: 'access', label: 'Access' },
      { value: 'agency', label: 'Agency' },
      { value: 'cleaner', label: 'Cleaner' }
    ];
  };

  const getCurrentFieldValue = (booking: Booking, fieldType: string) => {
    if (fieldType === 'cleaner') {
      return booking.cleaners ? `${booking.cleaners.first_name} ${booking.cleaners.last_name}` : 'No cleaner assigned';
    }
    
    const value = (booking as any)[fieldType];
    
    if (value === null || value === undefined) {
      return 'Not set';
    }
    
    if (typeof value === 'number') {
      if (fieldType.includes('cost') || fieldType.includes('pay')) {
        return `£${value.toFixed(2)}`;
      }
      return value.toString();
    }
    
    return value.toString() || 'Not set';
  };

  const renderValueInput = () => {
    const selectFields = {
      payment_status: [
        { value: 'Paid', label: 'Paid' },
        { value: 'Unpaid', label: 'Unpaid' },
        { value: 'Not Paid', label: 'Not Paid' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Partially Paid', label: 'Partially Paid' },
        { value: 'Refunded', label: 'Refunded' }
      ],
      booking_status: [
        { value: 'Confirmed', label: 'Confirmed' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Cancelled', label: 'Cancelled' },
        { value: 'Completed', label: 'Completed' }
      ],
      occupied: [
        { value: 'Yes', label: 'Yes' },
        { value: 'No', label: 'No' }
      ],
      frequently: [
        { value: 'Weekly', label: 'Weekly' },
        { value: 'Bi-weekly', label: 'Bi-weekly' },
        { value: 'Monthly', label: 'Monthly' },
        { value: 'One-off', label: 'One-off' }
      ],
      linen_management: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ],
      ironing: [
        { value: 'Yes', label: 'Yes' },
        { value: 'No', label: 'No' }
      ]
    };

    if (editType === 'cleaner') {
      return (
        <Select value={newValue} onValueChange={setNewValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select cleaner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No cleaner</SelectItem>
            {cleaners.map((cleaner) => (
              <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                {cleaner.first_name} {cleaner.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (selectFields[editType as keyof typeof selectFields]) {
      const options = selectFields[editType as keyof typeof selectFields];
      return (
        <Select value={newValue} onValueChange={setNewValue}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${getFieldLabel().toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    const numberFields = ['total_cost', 'cleaner_pay', 'cleaner_rate', 'cleaner_percentage', 'total_hours', 'hours_required', 'cleaning_time', 'ironing_hours'];
    const textareaFields = ['property_details', 'additional_details', 'parking_details'];

    if (numberFields.includes(editType)) {
      return (
        <Input
          type="number"
          step={editType === 'cleaner_percentage' ? '1' : '0.01'}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={`Enter new ${getFieldLabel().toLowerCase()}`}
        />
      );
    }

    if (textareaFields.includes(editType)) {
      return (
        <Textarea
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={`Enter new ${getFieldLabel().toLowerCase()}`}
          rows={3}
        />
      );
    }

    return (
      <Input
        type="text"
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        placeholder={`Enter new ${getFieldLabel().toLowerCase()}`}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Edit Bookings</DialogTitle>
          <DialogDescription>
            Filter and select bookings to update any field in bulk
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Filters Section */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4" />
              <h3 className="font-medium">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select value={filters.paymentStatus} onValueChange={(value) => setFilters({...filters, paymentStatus: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Not Paid">Not Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                    <SelectItem value="Refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bookingStatus">Booking Status</Label>
                <Select value={filters.bookingStatus} onValueChange={(value) => setFilters({...filters, bookingStatus: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customerSearch">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="customerSearch"
                    placeholder="Search customer, cleaner, email, address..."
                    value={filters.customerSearch}
                    onChange={(e) => setFilters({...filters, customerSearch: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Edit Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="editType">What to update</Label>
              <Popover open={editTypeOpen} onOpenChange={setEditTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={editTypeOpen}
                    className="w-full justify-between"
                  >
                    {editType
                      ? getEditTypeOptions().find((option) => option.value === editType)?.label
                      : "Select field to update..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 z-50 bg-white border shadow-lg">
                  <Command>
                    <CommandInput placeholder="Search field to update..." />
                    <CommandList>
                      <CommandEmpty>No field found.</CommandEmpty>
                      <CommandGroup>
                        {getEditTypeOptions().map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={(currentValue) => {
                              setEditType(currentValue === editType ? "" : currentValue);
                              setEditTypeOpen(false);
                              setNewValue(''); // Reset value when changing field type
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                editType === option.value ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="newValue">New {getFieldLabel()}</Label>
              {renderValueInput()}
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleBulkUpdate} 
                disabled={loading || selectedBookings.length === 0}
                className="w-full"
              >
                {loading ? 'Updating...' : `Update ${selectedBookings.length} booking${selectedBookings.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600">
            Showing {filteredBookings.length} of {bookings.length} bookings
            {filteredBookings.length !== bookings.length && (
              <Button
                variant="link"
                size="sm"
                onClick={clearFilters}
                className="p-0 h-auto ml-2 text-blue-600"
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cleaner</TableHead>
                  <TableHead>Total Cost</TableHead>
                  {editType && <TableHead className="bg-blue-50 font-semibold">{getFieldLabel()}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={editType ? 6 : 5} className="text-center py-8">
                      {Object.values(filters).some(f => f && f !== 'all') ? 'No bookings match your filters' : 'No upcoming bookings found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedBookings.includes(booking.id)}
                          onCheckedChange={(checked) => handleBookingSelect(booking.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : 'No date'}
                          </div>
                          <div className="text-gray-500">
                            {booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'No time'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {booking.first_name} {booking.last_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {booking.email}
                      </TableCell>
                      <TableCell>
                        {booking.cleaners ? `${booking.cleaners.first_name} ${booking.cleaners.last_name}` : 'No cleaner assigned'}
                      </TableCell>
                      <TableCell className="font-medium">
                        £{booking.total_cost?.toFixed(2) || '0.00'}
                      </TableCell>
                      {editType && (
                        <TableCell className="bg-blue-50 font-medium">
                          <div className="px-2 py-1 bg-white rounded border">
                            {getCurrentFieldValue(booking, editType)}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditBookingsDialog;
