import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Search,
  FileText,
  TrendingUp,
  Wallet,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import PaymentStatusIndicator from './PaymentStatusIndicator';
import ManualPaymentDialog from './ManualPaymentDialog';
import BulkInvoiceDialog from './BulkInvoiceDialog';
import { EmailSentLogsDialog } from './EmailSentLogsDialog';
import EmailStatusIndicator from './EmailStatusIndicator';
import { useSendPaymentSMS } from '@/hooks/useSendPaymentSMS';

interface Booking {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  date_time: string;
  total_cost: number | string;
  payment_status: string;
  payment_method?: string;
  customer: number;
  cleaners?: {
    first_name: string;
    last_name: string;
  } | null | Array<{first_name: string; last_name: string}>;
}

interface NormalizedBooking {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  date_time: string;
  total_cost: number;
  payment_status: string;
  customer: number;
  cleaners?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface PaymentStats {
  totalBookings: number;
  paidBookings: number;
  unpaidBookings: number;
  failedBookings: number;
  totalRevenue: number;
  cleanerExpenses: number;
}

const PaymentManagementDashboard = () => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<NormalizedBooking | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [bulkInvoiceDialogOpen, setBulkInvoiceDialogOpen] = useState(false);
  const [emailLogsDialogOpen, setEmailLogsDialogOpen] = useState(false);
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<number>>(new Set());
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [currentMonthStats, setCurrentMonthStats] = useState<PaymentStats>({
    totalBookings: 0,
    paidBookings: 0,
    unpaidBookings: 0,
    failedBookings: 0,
    totalRevenue: 0,
    cleanerExpenses: 0,
  });
  const { toast } = useToast();
  const { sendPaymentSMS, isLoading: isSendingSMS } = useSendPaymentSMS();

  useEffect(() => {
    fetchBookings();
    fetchCurrentMonthStats();
  }, [startDate, endDate, showUpcoming]);

  useEffect(() => {
    applyFilters();
    extractAvailableStatuses();
  }, [allBookings, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const tableName = showUpcoming ? 'bookings' : 'past_bookings';
      
      let query = supabase
        .from(tableName)
        .select(`
          *,
          cleaners!${tableName}_cleaner_fkey (
            first_name,
            last_name
          )
        `);

      // For upcoming bookings, filter for future dates
      if (showUpcoming) {
        const now = new Date().toISOString();
        query = query.gte('date_time', now);
      }

      // Apply additional date filters if set
      if (startDate) {
        query = query.gte('date_time', startDate);
      }
      if (endDate) {
        query = query.lte('date_time', endDate + 'T23:59:59');
      }

      const { data, error } = await query.order('date_time', { ascending: false });

      if (error) throw error;

      // Normalize the cleaners data structure
      const normalizedData = (data || []).map(booking => ({
        ...booking,
        cleaners: Array.isArray(booking.cleaners) && booking.cleaners.length > 0 
          ? booking.cleaners[0] 
          : booking.cleaners
      }));

      setAllBookings(normalizedData as Booking[]);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentMonthStats = async () => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data, error } = await supabase
        .from('past_bookings')
        .select('total_cost, payment_status, cleaner_pay, date_time')
        .gte('date_time', monthStart.toISOString())
        .lte('date_time', now.toISOString());

      if (error) throw error;

      const stats: PaymentStats = {
        totalBookings: data?.length || 0,
        paidBookings: 0,
        unpaidBookings: 0,
        failedBookings: 0,
        totalRevenue: 0,
        cleanerExpenses: 0,
      };

      data?.forEach(booking => {
        const cost = typeof booking.total_cost === 'string' 
          ? parseFloat(booking.total_cost) || 0 
          : (booking.total_cost || 0);
        
        const cleanerPay = booking.cleaner_pay || 0;
        const status = booking.payment_status?.toLowerCase();
        
        stats.totalRevenue += cost;
        stats.cleanerExpenses += cleanerPay;
        
        if (status === 'paid') {
          stats.paidBookings++;
        } else if (['failed', 'authorization_failed', 'capture_failed'].includes(status)) {
          stats.failedBookings++;
        } else if (['unpaid', 'not paid', ''].includes(status) || !status) {
          stats.unpaidBookings++;
        }
      });

      setCurrentMonthStats(stats);
    } catch (error: any) {
      console.error('Error fetching current month stats:', error);
    }
  };

  const extractAvailableStatuses = () => {
    const statuses = new Set<string>();
    allBookings.forEach(booking => {
      if (booking.payment_status) {
        statuses.add(booking.payment_status.toLowerCase());
      }
    });
    setAvailableStatuses(Array.from(statuses).sort());
  };

  const applyFilters = () => {
    let filtered = [...allBookings];

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(booking => {
        const status = booking.payment_status?.toLowerCase();
        return status === statusFilter;
      });
    }

    setFilteredBookings(filtered);
  };

  const handlePaymentAction = (booking: Booking) => {
    const normalizedBooking: NormalizedBooking = {
      ...booking,
      total_cost: typeof booking.total_cost === 'string' 
        ? parseFloat(booking.total_cost) || 0 
        : booking.total_cost,
      cleaners: Array.isArray(booking.cleaners) && booking.cleaners.length > 0 
        ? booking.cleaners[0] 
        : (booking.cleaners as {first_name: string; last_name: string} | null)
    };
    setSelectedBooking(normalizedBooking);
    setPaymentDialogOpen(true);
  };

  const handleSendPaymentSMS = async (booking: Booking) => {
    const amount = typeof booking.total_cost === 'string' 
      ? parseFloat(booking.total_cost) || 0 
      : booking.total_cost;

    await sendPaymentSMS({
      bookingId: booking.id,
      phoneNumber: booking.phone_number,
      customerName: booking.first_name,
      amount: amount,
    });
  };

  const handleSelectBooking = (bookingId: number) => {
    const newSelected = new Set(selectedBookingIds);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookingIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedBookingIds.size === filteredBookings.length) {
      setSelectedBookingIds(new Set());
    } else {
      setSelectedBookingIds(new Set(filteredBookings.map(b => b.id)));
    }
  };

  const handleBulkInvoice = () => {
    const selectedBookings = filteredBookings.filter(b => selectedBookingIds.has(b.id));
    
    const emails = new Set(selectedBookings.map(b => b.email));
    if (emails.size > 1) {
      toast({
        title: 'Multiple customers selected',
        description: 'Please select bookings from the same customer only',
        variant: 'destructive'
      });
      return;
    }
    
    setBulkInvoiceDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-7 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const selectedBookings = filteredBookings.filter(b => selectedBookingIds.has(b.id));
  const netProfit = currentMonthStats.totalRevenue - currentMonthStats.cleanerExpenses;

  return (
    <div className="space-y-6">
      {/* Modern Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <div className="p-2 bg-primary/10 rounded-xl">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-primary">£{currentMonthStats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">All bookings this month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Cleaner Expenses</p>
              <div className="p-2 bg-orange-100 rounded-xl">
                <Wallet className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-orange-600">£{currentMonthStats.cleanerExpenses.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total cleaner pay</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
              <div className="p-2 bg-green-100 rounded-xl">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-green-600">£{netProfit.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
              <div className="p-2 bg-blue-100 rounded-xl">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-blue-600">{currentMonthStats.totalBookings}</p>
              <p className="text-xs text-muted-foreground">
                {currentMonthStats.paidBookings} paid • {currentMonthStats.unpaidBookings} unpaid • {currentMonthStats.failedBookings} failed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Booking Type Toggle */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-blue-50/50 rounded-2xl border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {showUpcoming ? 'Upcoming Bookings' : 'Past Bookings'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {showUpcoming ? 'Services scheduled for the future' : 'Completed services requiring payment'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Past</span>
                <Switch 
                  checked={showUpcoming} 
                  onCheckedChange={setShowUpcoming}
                  className="data-[state=checked]:bg-blue-600"
                />
                <span className="text-sm font-medium text-slate-600">Upcoming</span>
              </div>
            </div>

            {/* Filter Inputs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="search" className="text-sm font-medium mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, email, address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-xl border-gray-200"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter" className="text-sm font-medium mb-2 block">Payment Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {availableStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-date" className="text-sm font-medium mb-2 block">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border-gray-200"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-sm font-medium mb-2 block">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                variant="outline"
                className="w-full rounded-xl"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedBookingIds.size > 0 && (
        <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold text-primary">{selectedBookingIds.size} booking{selectedBookingIds.size > 1 ? 's' : ''} selected</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedBookingIds(new Set())} className="rounded-xl">
                  Clear Selection
                </Button>
                <Button onClick={handleBulkInvoice} className="rounded-xl">
                  Send Bulk Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Table */}
      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300">
        <div className="bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Payment Management</h2>
            </div>
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-sm font-semibold text-slate-800">
                {filteredBookings.length} result{filteredBookings.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b bg-gradient-to-r from-slate-50 to-slate-100">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedBookingIds.size === filteredBookings.length && filteredBookings.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-bold text-slate-700">Customer</TableHead>
                  <TableHead className="font-bold text-slate-700">Date & Time</TableHead>
                  <TableHead className="font-bold text-slate-700">Address</TableHead>
                  <TableHead className="font-bold text-slate-700">Amount</TableHead>
                  <TableHead className="font-bold text-slate-700">Payment</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Cleaner</TableHead>
                  <TableHead className="font-bold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-100 rounded-2xl">
                          <AlertCircle className="h-12 w-12 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-medium text-lg">No bookings found</p>
                        <p className="text-slate-400 text-sm">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking, index) => (
                    <TableRow 
                      key={booking.id} 
                      className={`hover:bg-gradient-to-r hover:from-primary/5 hover:to-blue-50/50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedBookingIds.has(booking.id)}
                          onCheckedChange={() => handleSelectBooking(booking.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-slate-900">{booking.first_name} {booking.last_name}</div>
                          <div className="text-sm text-slate-500">{booking.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium text-slate-700">
                        {format(new Date(booking.date_time), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-slate-600">{booking.address}</TableCell>
                      <TableCell className="font-bold text-slate-900">£{(typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost).toFixed(2)}</TableCell>
                      <TableCell>
                        <PaymentStatusIndicator status={booking.payment_status} paymentMethod={booking.payment_method} />
                      </TableCell>
                      <TableCell>
                        <EmailStatusIndicator 
                          customerEmail={booking.email}
                          phoneNumber={booking.phone_number}
                          onClick={() => {
                            setSelectedCustomerEmail(booking.email);
                            setEmailLogsDialogOpen(true);
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {booking.cleaners && typeof booking.cleaners === 'object' && !Array.isArray(booking.cleaners)
                          ? `${booking.cleaners.first_name} ${booking.cleaners.last_name}` 
                          : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handlePaymentAction(booking)}
                            className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendPaymentSMS(booking)}
                            disabled={isSendingSMS}
                            className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            SMS
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ManualPaymentDialog
        isOpen={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        booking={selectedBooking}
        onSuccess={() => {
          fetchBookings();
          fetchCurrentMonthStats();
        }}
      />

      <BulkInvoiceDialog
        open={bulkInvoiceDialogOpen}
        onOpenChange={setBulkInvoiceDialogOpen}
        selectedBookings={selectedBookings}
        onSuccess={() => {
          setSelectedBookingIds(new Set());
          fetchBookings();
          fetchCurrentMonthStats();
        }}
      />

      <EmailSentLogsDialog
        open={emailLogsDialogOpen}
        onOpenChange={setEmailLogsDialogOpen}
        customerEmail={selectedCustomerEmail}
      />
    </div>
  );
};

export default PaymentManagementDashboard;
