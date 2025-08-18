import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar, DollarSign, Clock, User, Edit2, Check, X, MapPin, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface BookingPayment {
  id: number;
  date_time: string;
  address: string;
  cleaner_pay: number;
  total_hours: number;
  payment_status: string;
  cleaner_pay_status: string;
  first_name?: string;
  last_name?: string;
  customer?: number;
}

interface PaymentData {
  totalEarnings: number;
  completedJobs: number;
  averagePerJob: number;
  bookings: BookingPayment[];
}

interface BookingPaymentCardProps {
  booking: BookingPayment;
  onUpdate: () => void;
  isSelected: boolean;
  onSelectionChange: (bookingId: number, selected: boolean) => void;
}

const BookingPaymentCard: React.FC<BookingPaymentCardProps> = ({ booking, onUpdate, isSelected, onSelectionChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPay, setEditingPay] = useState(booking.cleaner_pay?.toString() || '0');
  const [editingStatus, setEditingStatus] = useState(booking.cleaner_pay_status || 'Unpaid');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (booking.customer) {
      fetchCustomerName();
    }
  }, [booking.customer]);

  const fetchCustomerName = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('first_name, last_name')
        .eq('id', booking.customer)
        .single();

      if (error) throw error;
      if (data) {
        setCustomerName(`${data.first_name || ''} ${data.last_name || ''}`.trim());
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('past_bookings')
        .update({
          cleaner_pay: parseFloat(editingPay),
          cleaner_pay_status: editingStatus
        })
        .eq('id', booking.id);

      if (error) throw error;
      
      toast.success('Booking updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const handleCancel = () => {
    setEditingPay(booking.cleaner_pay?.toString() || '0');
    setEditingStatus(booking.cleaner_pay_status || 'Unpaid');
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'unpaid':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectionChange(booking.id, checked as boolean)}
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{booking.address}</span>
            </div>
            
            {customerName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Customer: {customerName}</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{format(new Date(booking.date_time), 'MMM dd, yyyy HH:mm')}</span>
              <span>{booking.total_hours}h</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {isEditing ? (
              <Select value={editingStatus} onValueChange={setEditingStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={getStatusColor(booking.cleaner_pay_status)}>
                {booking.cleaner_pay_status || 'Unpaid'}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Pay:</span>
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                value={editingPay}
                onChange={(e) => setEditingPay(e.target.value)}
                className="w-24"
              />
            ) : (
              <span className="font-semibold">£{Number(booking.cleaner_pay || 0).toFixed(2)}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="h-8">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="h-8">
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-8">
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const CleanerPaymentsManager = () => {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [selectedCleanerIds, setSelectedCleanerIds] = useState<string[]>([]);
  const [selectedBookingIds, setSelectedBookingIds] = useState<number[]>([]);
  const [paymentData, setPaymentData] = useState<{ [cleanerId: string]: PaymentData }>({});
  const [period, setPeriod] = useState<'last_month' | 'current_month'>('current_month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [allCleanersSelected, setAllCleanersSelected] = useState(true);

  useEffect(() => {
    fetchCleaners();
  }, []);

  useEffect(() => {
    if (cleaners.length > 0) {
      // Set all cleaners selected by default for current month
      setSelectedCleanerIds(cleaners.map(c => c.id.toString()));
      setAllCleanersSelected(true);
    }
  }, [cleaners]);

  useEffect(() => {
    if (selectedCleanerIds.length > 0) {
      fetchPaymentData();
    }
  }, [selectedCleanerIds, period, customStartDate, customEndDate]);

  const fetchCleaners = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (error) throw error;
      setCleaners(data || []);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
      toast.error('Failed to load cleaners');
    }
  };

  const getDateRange = () => {
    // If custom dates are set, use them, otherwise use period selection
    if (customStartDate && customEndDate) {
      return {
        start: customStartDate,
        end: customEndDate
      };
    }
    
    const now = new Date();
    if (period === 'current_month') {
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    } else if (period === 'last_month') {
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      };
    } else {
      // Default to current month
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    }
  };

  const fetchPaymentData = async () => {
    if (selectedCleanerIds.length === 0) return;

    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const newPaymentData: { [cleanerId: string]: PaymentData } = {};
      
      // Fetch data for each selected cleaner
      for (const cleanerId of selectedCleanerIds) {
        const { data, error } = await supabase
          .from('past_bookings')
          .select(`
            id,
            date_time,
            address,
            cleaner_pay,
            total_hours,
            payment_status,
            cleaner_pay_status,
            customer
          `)
          .eq('cleaner', parseInt(cleanerId))
          .gte('date_time', start.toISOString())
          .lte('date_time', end.toISOString())
          .order('date_time', { ascending: false });

        if (error) throw error;

        const bookings = data || [];
        const totalEarnings = bookings.reduce((sum, booking) => sum + (Number(booking.cleaner_pay) || 0), 0);
        const completedJobs = bookings.length;
        const averagePerJob = completedJobs > 0 ? totalEarnings / completedJobs : 0;

        newPaymentData[cleanerId] = {
          totalEarnings,
          completedJobs,
          averagePerJob,
          bookings
        };
      }

      setPaymentData(newPaymentData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanerToggle = (cleanerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCleanerIds([...selectedCleanerIds, cleanerId]);
    } else {
      setSelectedCleanerIds(selectedCleanerIds.filter(id => id !== cleanerId));
    }
    setAllCleanersSelected(false);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCleanerIds(cleaners.map(c => c.id.toString()));
      setAllCleanersSelected(true);
    } else {
      setSelectedCleanerIds([]);
      setAllCleanersSelected(false);
    }
  };

  const getTotalStats = () => {
    const totalEarnings = Object.values(paymentData).reduce((sum, data) => sum + data.totalEarnings, 0);
    const totalJobs = Object.values(paymentData).reduce((sum, data) => sum + data.completedJobs, 0);
    const averagePerJob = totalJobs > 0 ? totalEarnings / totalJobs : 0;
    
    return { totalEarnings, totalJobs, averagePerJob };
  };

  const handleBookingSelectionChange = (bookingId: number, selected: boolean) => {
    if (selected) {
      setSelectedBookingIds([...selectedBookingIds, bookingId]);
    } else {
      setSelectedBookingIds(selectedBookingIds.filter(id => id !== bookingId));
    }
  };

  const handleSelectAllBookings = (selectAll: boolean) => {
    if (selectAll) {
      // Collect all booking IDs from current payment data
      const allBookingIds: number[] = [];
      Object.values(paymentData).forEach(data => {
        data.bookings.forEach(booking => {
          allBookingIds.push(booking.id);
        });
      });
      setSelectedBookingIds(allBookingIds);
    } else {
      setSelectedBookingIds([]);
    }
  };

  const getTotalBookingsCount = () => {
    return Object.values(paymentData).reduce((total, data) => total + data.bookings.length, 0);
  };

  const areAllBookingsSelected = () => {
    const totalBookings = getTotalBookingsCount();
    return totalBookings > 0 && selectedBookingIds.length === totalBookings;
  };

  const handleMarkSelectedPaid = async () => {
    try {
      if (selectedBookingIds.length === 0) {
        toast.info('No bookings selected to mark as paid');
        return;
      }

      const { error } = await supabase
        .from('past_bookings')
        .update({ cleaner_pay_status: 'Paid' })
        .in('id', selectedBookingIds);

      if (error) throw error;

      toast.success(`Marked ${selectedBookingIds.length} bookings as paid`);
      setSelectedBookingIds([]); // Clear selection after marking as paid
      fetchPaymentData();
    } catch (error) {
      console.error('Error marking payments as paid:', error);
      toast.error('Failed to mark payments as paid');
    }
  };

  const { start, end } = getDateRange();
  const totalStats = getTotalStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Select Cleaners
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={allCleanersSelected}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All
                </label>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-48 overflow-y-auto">
            <div className="space-y-2">
              {cleaners.map((cleaner) => (
                <div key={cleaner.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cleaner-${cleaner.id}`}
                    checked={selectedCleanerIds.includes(cleaner.id.toString())}
                    onCheckedChange={(checked) => 
                      handleCleanerToggle(cleaner.id.toString(), checked as boolean)
                    }
                  />
                  <label htmlFor={`cleaner-${cleaner.id}`} className="text-sm">
                    {cleaner.first_name} {cleaner.last_name}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Period Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Quick Select</label>
              <Select value={period} onValueChange={(value: 'last_month' | 'current_month') => setPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="current_month">Current Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Period: {format(start, 'MMM dd, yyyy')} - {format(end, 'MMM dd, yyyy')}
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading payment data...</div>
        </div>
      ) : selectedCleanerIds.length > 0 && Object.keys(paymentData).length > 0 ? (
        <>
          {/* Overall Summary */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Payment Summary</h3>
                {getTotalBookingsCount() > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-bookings"
                      checked={areAllBookingsSelected()}
                      onCheckedChange={handleSelectAllBookings}
                    />
                    <label htmlFor="select-all-bookings" className="text-sm font-medium">
                      Select All Bookings ({getTotalBookingsCount()})
                    </label>
                  </div>
                )}
              </div>
              {selectedBookingIds.length > 0 && (
                <Button 
                  onClick={handleMarkSelectedPaid} 
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Mark Selected as Paid ({selectedBookingIds.length})
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£{totalStats.totalEarnings.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    {selectedCleanerIds.length} cleaner{selectedCleanerIds.length > 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStats.totalJobs}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average per Job</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£{totalStats.averagePerJob.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Individual Cleaner Breakdowns */}
          {selectedCleanerIds.map(cleanerId => {
            const cleaner = cleaners.find(c => c.id.toString() === cleanerId);
            const data = paymentData[cleanerId];
            
            if (!cleaner || !data) return null;

            return (
              <Card key={cleanerId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {cleaner.first_name} {cleaner.last_name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>Earnings: £{data.totalEarnings.toFixed(2)}</span>
                    <span>Jobs: {data.completedJobs}</span>
                    <span>Avg: £{data.averagePerJob.toFixed(2)}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {data.bookings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No completed jobs found for this period.
                    </p>
                  ) : (
                    <div className="space-y-4">
                       {data.bookings.map((booking) => (
                         <BookingPaymentCard 
                           key={booking.id}
                           booking={booking}
                           onUpdate={fetchPaymentData}
                           isSelected={selectedBookingIds.includes(booking.id)}
                           onSelectionChange={handleBookingSelectionChange}
                         />
                       ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </>
      ) : selectedCleanerIds.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Select at least one cleaner to view payment details.</p>
        </div>
      ) : null}
    </div>
  );
};

export default CleanerPaymentsManager;