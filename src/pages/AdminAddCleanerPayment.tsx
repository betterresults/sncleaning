import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, ChevronDown, User, Calendar, MapPin, DollarSign, Clock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { useLinkedCleaners } from '@/hooks/useLinkedCleaners';
import { Badge } from '@/components/ui/badge';

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

const formatServiceType = (serviceType: string | null | undefined): string => {
  if (!serviceType) return 'Unknown';
  const normalized = serviceType.toLowerCase().replace(/_/g, ' ').trim();
  if (normalized.includes('airbnb') || normalized.includes('air bnb')) return 'Airbnb Cleaning';
  if (normalized.includes('domestic')) return 'Domestic Cleaning';
  if (normalized.includes('end of tenancy') || normalized.includes('eot')) return 'End of Tenancy';
  if (normalized.includes('commercial')) return 'Commercial Cleaning';
  if (normalized.includes('carpet')) return 'Carpet Cleaning';
  if (normalized.includes('standard') || normalized.includes('regular')) return 'Domestic Cleaning';
  if (normalized.includes('deep')) return 'Deep Cleaning';
  return serviceType.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const AdminAddCleanerPayment = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState<PastBooking[]>([]);
  const [selectedCleanerId, setSelectedCleanerId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<PastBooking | null>(null);
  const [cleanerPay, setCleanerPay] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [submitting, setSubmitting] = useState(false);
  const [cleanerDropdownOpen, setCleanerDropdownOpen] = useState(false);
  const [bookingDropdownOpen, setBookingDropdownOpen] = useState(false);
  const [cleanerSearch, setCleanerSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');

  const { cleaners: linkedCleaners, loading: cleanersLoading } = useLinkedCleaners(true);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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
    if (!selectedCleanerId || !selectedBooking) {
      toast.error('Please select both a cleaner and a booking');
      return;
    }

    if (!cleanerPay || parseFloat(cleanerPay) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('past_bookings')
        .update({
          cleaner: selectedCleanerId,
          cleaner_pay: parseFloat(cleanerPay),
          cleaner_pay_status: paymentStatus
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      toast.success('Payment record added successfully');
      navigate('/admin-cleaner-payments');
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Failed to add payment record');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCleaners = linkedCleaners.filter(cleaner =>
    `${cleaner.first_name} ${cleaner.last_name}`.toLowerCase().includes(cleanerSearch.toLowerCase())
  );

  const filteredBookings = bookings.filter(booking => {
    const searchLower = bookingSearch.toLowerCase();
    return (
      booking.address?.toLowerCase().includes(searchLower) ||
      booking.postcode?.toLowerCase().includes(searchLower) ||
      booking.id.toString().includes(searchLower) ||
      `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchLower) ||
      booking.service_type?.toLowerCase().includes(searchLower)
    );
  });

  const selectedCleaner = linkedCleaners.find(c => c.id === selectedCleanerId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading...</div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-background">
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
            userRole={userRole}
            customerId={customerId}
            cleanerId={cleanerId}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/admin-cleaner-payments')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Add Cleaner Payment</h1>
                    <p className="text-muted-foreground">Assign a cleaner to a past booking with payment details</p>
                  </div>
                </div>

                {/* Main Form Card */}
                <Card className="shadow-lg border-border/50">
                  <CardHeader className="border-b border-border/50 bg-muted/30">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Payment Details
                    </CardTitle>
                    <CardDescription>
                      Select a cleaner and booking, then enter the payment information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Cleaner Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Select Cleaner
                      </Label>
                      <Popover open={cleanerDropdownOpen} onOpenChange={setCleanerDropdownOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between h-12 text-left font-normal"
                          >
                            {selectedCleaner
                              ? `${selectedCleaner.first_name} ${selectedCleaner.last_name}`
                              : cleanersLoading ? "Loading cleaners..." : "Select a cleaner..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-[400px] p-0 bg-popover z-50" 
                          align="start"
                          onPointerDownOutside={(e) => e.preventDefault()}
                          onInteractOutside={(e) => e.preventDefault()}
                        >
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search cleaner..."
                              value={cleanerSearch}
                              onValueChange={setCleanerSearch}
                            />
                            <CommandList>
                              <CommandEmpty>No cleaner found.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {filteredCleaners.map((cleaner) => (
                                  <div
                                    key={cleaner.id}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedCleanerId(cleaner.id);
                                      setCleanerDropdownOpen(false);
                                    }}
                                    className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                  >
                                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {cleaner.first_name} {cleaner.last_name}
                                  </div>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Booking Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Select Booking
                      </Label>
                      <Popover open={bookingDropdownOpen} onOpenChange={setBookingDropdownOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between h-12 text-left font-normal"
                          >
                            {selectedBooking ? (
                              <span className="truncate">
                                {selectedBooking.first_name || selectedBooking.last_name 
                                  ? `${selectedBooking.first_name || ''} ${selectedBooking.last_name || ''}`.trim()
                                  : 'Unknown'} - {formatServiceType(selectedBooking.service_type)} - {selectedBooking.postcode || 'No postcode'}
                              </span>
                            ) : (
                              "Select a booking..."
                            )}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-[500px] p-0 bg-popover z-50" 
                          align="start"
                          onPointerDownOutside={(e) => e.preventDefault()}
                          onInteractOutside={(e) => e.preventDefault()}
                        >
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search by client, address, postcode, or service..."
                              value={bookingSearch}
                              onValueChange={setBookingSearch}
                            />
                            <CommandList>
                              <CommandEmpty>No booking found.</CommandEmpty>
                              <CommandGroup className="max-h-80 overflow-auto">
                                {filteredBookings.slice(0, 50).map((booking) => (
                                  <div
                                    key={booking.id}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedBooking(booking);
                                      setBookingDropdownOpen(false);
                                    }}
                                    className="relative flex flex-col cursor-pointer select-none items-start rounded-sm px-3 py-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground border-b border-border/30 last:border-0"
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      <span className="font-medium">
                                        {booking.first_name || booking.last_name 
                                          ? `${booking.first_name || ''} ${booking.last_name || ''}`.trim()
                                          : 'Unknown Client'}
                                      </span>
                                      <Badge variant="secondary" className="text-xs">
                                        {formatServiceType(booking.service_type)}
                                      </Badge>
                                      <span className="font-medium ml-auto">{booking.postcode || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(booking.date_time), 'dd MMM yyyy')}
                                      </span>
                                      <span>#{booking.id}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate w-full mt-1 flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {booking.address}
                                    </div>
                                  </div>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Selected Booking Details */}
                    {selectedBooking && (
                      <Card className="bg-muted/30 border-dashed">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Selected Booking Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground text-xs">Address</p>
                              <p className="font-medium">{selectedBooking.address || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground text-xs">Date & Time</p>
                              <p className="font-medium">{format(new Date(selectedBooking.date_time), 'dd MMM yyyy HH:mm')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground text-xs">Total Cost</p>
                              <p className="font-medium">£{selectedBooking.total_cost || '0'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground text-xs">Hours</p>
                              <p className="font-medium">{selectedBooking.total_hours || 0}h</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Payment Amount & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-base font-medium flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          Payment Amount
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={cleanerPay}
                            onChange={(e) => setCleanerPay(e.target.value)}
                            className="pl-8 h-12 text-lg"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-medium flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          Payment Status
                        </Label>
                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                          <SelectTrigger className="h-12">
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

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/admin-cleaner-payments')}
                        className="px-6"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSubmit} 
                        disabled={submitting || !selectedCleanerId || !selectedBooking}
                        className="px-8"
                      >
                        {submitting ? 'Adding...' : 'Add Payment'}
                      </Button>
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

export default AdminAddCleanerPayment;
