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
  Wallet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PaymentStatusIndicator from './PaymentStatusIndicator';
import ManualPaymentDialog from './ManualPaymentDialog';
import BulkInvoiceDialog from './BulkInvoiceDialog';

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
  } | null;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<number>>(new Set());
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [currentMonthStats, setCurrentMonthStats] = useState<PaymentStats>({
    totalBookings: 0,
    paidBookings: 0,
    unpaidBookings: 0,
    failedBookings: 0,
    totalRevenue: 0,
    cleanerExpenses: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
    fetchCurrentMonthStats();
  }, [startDate, endDate]);

  useEffect(() => {
    applyFilters();
    extractAvailableStatuses();
  }, [allBookings, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          cleaners!bookings_cleaner_fkey (
            first_name,
            last_name
          )
        `);

      if (startDate) {
        query = query.gte('date_time', startDate);
      }
      if (endDate) {
        query = query.lte('date_time', endDate + 'T23:59:59');
      }

      const { data, error } = await query.order('date_time', { ascending: false });

      if (error) throw error;

      setAllBookings(data || []);
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
      const monthStartStr = format(monthStart, 'yyyy-MM-dd');
      const todayStr = format(now, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('bookings')
        .select('total_cost, payment_status, cleaner_pay, date_time')
        .gte('date_time', monthStartStr + 'T00:00:00')
        .lte('date_time', todayStr + 'T23:59:59');

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
        : booking.total_cost
    };
    setSelectedBooking(normalizedBooking);
    setPaymentDialogOpen(true);
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
      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="font-semibold">Payment Management</span>
            <span className="text-sm font-normal text-muted-foreground bg-white px-3 py-1 rounded-full">
              {filteredBookings.length} result{filteredBookings.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedBookingIds.size === filteredBookings.length && filteredBookings.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Date & Time</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Cleaner</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No bookings found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-primary/5">
                      <TableCell>
                        <Checkbox
                          checked={selectedBookingIds.has(booking.id)}
                          onCheckedChange={() => handleSelectBooking(booking.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(booking.date_time), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{booking.address}</TableCell>
                      <TableCell className="font-semibold">£{(typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost).toFixed(2)}</TableCell>
                      <TableCell>
                        <PaymentStatusIndicator status={booking.payment_status} paymentMethod={booking.payment_method} />
                      </TableCell>
                      <TableCell>
                        {booking.cleaners ? `${booking.cleaners.first_name} ${booking.cleaners.last_name}` : 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handlePaymentAction(booking)}
                          className="rounded-xl"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
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
    </div>
  );
};

export default PaymentManagementDashboard;
