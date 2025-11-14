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
  Clock, 
  Search,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
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
  pendingRevenue: number;
}

const PaymentManagementDashboard = () => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalBookings: 0,
    paidBookings: 0,
    unpaidBookings: 0,
    failedBookings: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<NormalizedBooking | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [bulkInvoiceDialogOpen, setBulkInvoiceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<number>>(new Set());
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, [startDate, endDate]);

  useEffect(() => {
    applyFilters();
    calculateCurrentStats();
    extractAvailableStatuses();
  }, [allBookings, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cleaners!bookings_cleaner_fkey (
            first_name,
            last_name
          )
        `)
        .gte('date_time', startDate)
        .lte('date_time', endDate + 'T23:59:59')
        .order('date_time', { ascending: false });

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

  const extractAvailableStatuses = () => {
    const statuses = new Set<string>();
    allBookings.forEach(booking => {
      if (booking.payment_status) {
        statuses.add(booking.payment_status.toLowerCase());
      }
    });
    setAvailableStatuses(Array.from(statuses).sort());
  };

  const calculateCurrentStats = () => {
    const bookings = allBookings;
    
    const stats: PaymentStats = {
      totalBookings: bookings.length,
      paidBookings: 0,
      unpaidBookings: 0,
      failedBookings: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
    };

    bookings.forEach(booking => {
      const cost = typeof booking.total_cost === 'string' 
        ? parseFloat(booking.total_cost) || 0 
        : booking.total_cost;
      
      const status = booking.payment_status?.toLowerCase();
      
      if (status === 'paid') {
        stats.paidBookings++;
        stats.totalRevenue += cost;
      } else if (['failed', 'authorization_failed', 'capture_failed'].includes(status)) {
        stats.failedBookings++;
        stats.pendingRevenue += cost;
      } else if (['unpaid', 'not paid', ''].includes(status) || !status) {
        stats.unpaidBookings++;
        stats.pendingRevenue += cost;
      } else {
        stats.pendingRevenue += cost;
      }
    });

    setStats(stats);
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
    
    // Check if all selected bookings have the same customer email
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

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle 
  }: { 
    title: string; 
    value: number | string; 
    icon: any; 
    color: string; 
    subtitle: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading payment data...</div>
      </div>
    );
  }

  const selectedBookings = filteredBookings.filter(b => selectedBookingIds.has(b.id));

  return (
    <div className="space-y-6">
      {/* Stats - Current Month */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`£${stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="text-primary"
          subtitle={`${stats.paidBookings} paid bookings`}
        />
        <StatCard
          title="Pending Revenue"
          value={`£${stats.pendingRevenue.toFixed(2)}`}
          icon={Clock}
          color="text-yellow-600"
          subtitle={`${stats.unpaidBookings + stats.failedBookings} bookings`}
        />
        <StatCard
          title="Failed Payments"
          value={stats.failedBookings}
          icon={AlertCircle}
          color="text-red-600"
          subtitle="Require attention"
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={CheckCircle}
          color="text-primary"
          subtitle="This period"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, email, address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Payment Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                  setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedBookingIds.size > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedBookingIds.size} booking{selectedBookingIds.size > 1 ? 's' : ''} selected</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedBookingIds(new Set())}>
                  Clear Selection
                </Button>
                <Button onClick={handleBulkInvoice}>
                  Send Bulk Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bookings</span>
            <span className="text-sm font-normal text-muted-foreground">
              {filteredBookings.length} result{filteredBookings.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedBookingIds.size === filteredBookings.length && filteredBookings.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cleaner</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
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
                    <TableCell>
                      {format(new Date(booking.date_time), 'dd MMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{booking.address}</TableCell>
                    <TableCell>£{(typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost).toFixed(2)}</TableCell>
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
                        className="flex items-center gap-1"
                      >
                        <DollarSign className="h-4 w-4" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ManualPaymentDialog
        isOpen={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        booking={selectedBooking}
        onSuccess={fetchBookings}
      />

      <BulkInvoiceDialog
        open={bulkInvoiceDialogOpen}
        onOpenChange={setBulkInvoiceDialogOpen}
        selectedBookings={selectedBookings}
        onSuccess={() => {
          setSelectedBookingIds(new Set());
          fetchBookings();
        }}
      />
    </div>
  );
};

export default PaymentManagementDashboard;
