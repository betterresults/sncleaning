import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, ArrowLeft, Filter, X, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { LinenUsageEditor } from '@/components/dashboard/LinenUsageEditor';
import { CreditCard } from 'lucide-react';
import { useServiceTypes, useCleaningTypes, ServiceType, CleaningType } from '@/hooks/useCompanySettings';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';

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

interface Filters {
  dateFrom: string;
  dateTo: string;
  paymentStatus: string;
  bookingStatus: string;
  customerSearch: string;
}

const BulkEditBookings = () => {
  const { user, userRole, cleanerId, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [editType, setEditType] = useState<string>('total_cost');
  const [newValue, setNewValue] = useState<string>('');
  const [linenUsage, setLinenUsage] = useState<any[]>([]);
  const [editTypeOpen, setEditTypeOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    paymentStatus: 'all',
    bookingStatus: 'all',
    customerSearch: '',
  });
  const [sendingPaymentLinks, setSendingPaymentLinks] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Fetch service types and cleaning types
  const { data: serviceTypes } = useServiceTypes();
  const { data: cleaningTypes } = useCleaningTypes();

  useEffect(() => {
    fetchBookings();
    fetchCleaners();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
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

    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(booking => 
        booking.payment_status === filters.paymentStatus
      );
    }

    if (filters.bookingStatus !== 'all') {
      filtered = filtered.filter(booking => 
        booking.booking_status === filters.bookingStatus
      );
    }

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

    if (editType !== 'linen_management' && editType !== 'linen_used' && (!newValue || (typeof newValue === 'string' && newValue.trim() === ''))) {
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
          const boolValue = newValue === 'true';
          updateData = { linen_management: boolValue };
          break;
        case 'linen_used':
          updateData = { linen_used: linenUsage };
          break;
        default:
          updateData = { [editType]: newValue };
          break;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .in('id', selectedBookings)
        .select();

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

      toast({
        title: "Update Successful",
        description: `Successfully updated ${selectedBookings.length} booking${selectedBookings.length !== 1 ? 's' : ''}`,
      });
      
      await fetchBookings();
      
      setFilteredBookings(prevBookings => 
        prevBookings.map(booking => {
          if (selectedBookings.includes(booking.id)) {
            return { ...booking, ...updateData };
          }
          return booking;
        })
      );
      
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

  const handleBulkSendPaymentLinks = async () => {
    if (selectedBookings.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one booking to send payment links.",
        variant: "destructive",
      });
      return;
    }

    setSendingPaymentLinks(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (const bookingId of selectedBookings) {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) continue;

        // Validate booking has required data
        if (!booking.email || !booking.first_name || !booking.total_cost) {
          errors.push(`Booking #${bookingId}: Missing email, name, or cost`);
          errorCount++;
          continue;
        }

        try {
          const { data, error } = await supabase.functions.invoke('stripe-send-payment-link', {
            body: {
              customer_id: booking.id,
              email: booking.email,
              name: `${booking.first_name} ${booking.last_name || ''}`.trim(),
              amount: booking.total_cost,
              description: `Cleaning Service - ${format(new Date(booking.date_time), 'dd MMM yyyy')}`,
              booking_id: booking.id,
              collect_payment_method: true, // Collect card details for future use
            }
          });

          if (error) {
            errors.push(`Booking #${bookingId}: ${error.message}`);
            errorCount++;
          } else if (data?.success) {
            successCount++;
          } else {
            errors.push(`Booking #${bookingId}: ${data?.error || 'Unknown error'}`);
            errorCount++;
          }
        } catch (err: any) {
          errors.push(`Booking #${bookingId}: ${err.message}`);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "Payment Links Sent",
          description: `Successfully sent ${successCount} payment link${successCount !== 1 ? 's' : ''}. Card details will be collected for future bookings.`,
        });
      }

      if (errorCount > 0) {
        toast({
          title: "Some Payments Failed",
          description: `${errorCount} payment link${errorCount !== 1 ? 's' : ''} failed. ${errors.slice(0, 3).join('; ')}`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error sending payment links:', error);
      toast({
        title: "Payment Links Failed",
        description: error.message || "Failed to send payment links.",
        variant: "destructive",
      });
    } finally {
      setSendingPaymentLinks(false);
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
      service_type: 'Service Type',
      cleaning_type: 'Cleaning Type',
      occupied: 'Occupied',
      frequently: 'Frequency',
      extras: 'Extras',
      linens: 'Old Linens (Legacy)',
      linen_management: 'Linen Management',
      linen_used: 'Linen Usage',
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
      { value: 'service_type', label: 'Service Type' },
      { value: 'cleaning_type', label: 'Cleaning Type' },
      { value: 'occupied', label: 'Occupied' },
      { value: 'frequently', label: 'Frequency' },
      { value: 'extras', label: 'Extras' },
      { value: 'linens', label: 'Old Linens (Legacy)' },
      { value: 'linen_management', label: 'Linen Management' },
      { value: 'linen_used', label: 'Linen Usage' },
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
      service_type: serviceTypes?.map(st => ({ value: st.key, label: st.label })) || [],
      cleaning_type: cleaningTypes?.map(ct => ({ value: ct.key, label: ct.label })) || [],
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole === 'user' && cleanerId) {
    return <Navigate to="/cleaner-dashboard" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50">
        <UnifiedHeader 
          title=""
          user={user}
          userRole={userRole}
          onSignOut={handleSignOut}
        />
        <div className="flex flex-1 w-full">
          <UnifiedSidebar 
            navigationItems={adminNavigation}
            user={user}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-6 space-y-6 max-w-full overflow-x-hidden">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/upcoming-bookings')}
                    className="rounded-full"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Bulk Edit Bookings</h1>
                    <p className="text-muted-foreground mt-1">Filter and select bookings to update any field in bulk</p>
                  </div>
                </div>

                {/* Filters Card */}
                <Card className="shadow-md border-0">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Filters</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateFrom">Date From</Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dateTo">Date To</Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
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

                      <div className="space-y-2">
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

                      <div className="space-y-2">
                        <Label htmlFor="customerSearch">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="customerSearch"
                            placeholder="Customer, cleaner, email, address..."
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
                  </CardContent>
                </Card>

                {/* Bulk Edit Controls Card */}
                <Card className="shadow-md border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Bulk Edit Controls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
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
                          <PopoverContent className="w-full p-0 z-50 bg-popover border shadow-lg max-h-80 overflow-auto">
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
                                        setNewValue('');
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
                      
                      <div className="space-y-2">
                        <Label htmlFor="newValue">New {getFieldLabel()}</Label>
                        {editType === 'linen_used' ? (
                          <LinenUsageEditor 
                            value={linenUsage} 
                            onChange={setLinenUsage}
                          />
                        ) : (
                          renderValueInput()
                        )}
                      </div>

                      <div className="flex items-end">
                        <Button 
                          onClick={handleBulkUpdate} 
                          disabled={loading || selectedBookings.length === 0}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {loading ? 'Updating...' : `Update ${selectedBookings.length} booking${selectedBookings.length !== 1 ? 's' : ''}`}
                        </Button>
                      </div>
                    </div>

                    {/* Stripe Payment Links Section */}
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">Stripe Payment & Card Collection</h3>
                          <p className="text-sm text-muted-foreground mt-1">Send payment links and collect card details for future bookings</p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleBulkSendPaymentLinks}
                        disabled={sendingPaymentLinks || selectedBookings.length === 0}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {sendingPaymentLinks ? 'Sending...' : `Send Payment Links (${selectedBookings.length} booking${selectedBookings.length !== 1 ? 's' : ''})`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Summary */}
                <div className="flex items-center justify-between px-1">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredBookings.length} of {bookings.length} bookings
                    {filteredBookings.length !== bookings.length && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={clearFilters}
                        className="p-0 h-auto ml-2"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                  {selectedBookings.length > 0 && (
                    <div className="text-sm font-medium text-primary">
                      {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>

                {/* Bookings Table Card */}
                <Card className="shadow-md border-0">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
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
                              <TableCell colSpan={editType ? 7 : 6} className="text-center py-12">
                                <div className="text-muted-foreground">
                                  {Object.values(filters).some(f => f && f !== 'all') ? 'No bookings match your filters' : 'No upcoming bookings found'}
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredBookings.map((booking) => (
                              <TableRow key={booking.id} className="hover:bg-muted/50">
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
                                    <div className="text-muted-foreground">
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
                                  <TableCell className="bg-blue-50/50 font-medium">
                                    <div className="px-2 py-1 bg-background rounded border text-sm">
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
                  </CardContent>
                </Card>
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default BulkEditBookings;
