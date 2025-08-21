import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Search,
  Filter,
  Download,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PaymentStatusIndicator from './PaymentStatusIndicator';
import ManualPaymentDialog from './ManualPaymentDialog';

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
  customer: number;
  cleaners?: {
    first_name: string;
    last_name: string;
  } | null;
}

// Normalized booking interface for ManualPaymentDialog
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
  authorizedBookings: number;
  totalRevenue: number;
  pendingRevenue: number;
}

const PaymentManagementDashboard = () => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalBookings: 0,
    paidBookings: 0,
    unpaidBookings: 0,
    failedBookings: 0,
    authorizedBookings: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<NormalizedBooking | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncingCustomers, setSyncingCustomers] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allBookings, pastBookings, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch upcoming and today's bookings
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('bookings')
        .select(`
          *,
          cleaners!bookings_cleaner_fkey (
            first_name,
            last_name
          )
        `)
        .order('date_time', { ascending: true });

      if (upcomingError) throw upcomingError;

      // Fetch past bookings
      const { data: pastData, error: pastError } = await supabase
        .from('past_bookings')
        .select(`
          *,
          cleaners!past_bookings_cleaner_fkey (
            first_name,
            last_name
          )
        `)
        .order('date_time', { ascending: false });

      if (pastError) throw pastError;

      const allUpcoming = upcomingData || [];
      const allPast = (pastData || []).map(booking => ({
        ...booking,
        total_cost: typeof booking.total_cost === 'string' 
          ? parseFloat(booking.total_cost) || 0 
          : booking.total_cost
      }));

      setAllBookings(allUpcoming);
      setPastBookings(allPast);
      calculateStats([...allUpcoming, ...allPast]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingData: Booking[]) => {
    const stats: PaymentStats = {
      totalBookings: bookingData.length,
      paidBookings: 0,
      unpaidBookings: 0,
      failedBookings: 0,
      authorizedBookings: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
    };

    bookingData.forEach((booking) => {
      const status = booking.payment_status?.toLowerCase();
      const cost = typeof booking.total_cost === 'string' 
        ? parseFloat(booking.total_cost) || 0 
        : booking.total_cost || 0;

      switch (status) {
        case 'paid':
          stats.paidBookings++;
          stats.totalRevenue += cost;
          break;
        case 'authorized':
          stats.authorizedBookings++;
          stats.pendingRevenue += cost;
          break;
        case 'failed':
        case 'authorization_failed':
        case 'capture_failed':
          stats.failedBookings++;
          break;
        case 'unpaid':
        case 'not paid':
        default:
          stats.unpaidBookings++;
          break;
      }
    });

    setStats(stats);
  };

  const applyFilters = () => {
    // Combine all bookings for filtering
    let filtered = [...allBookings, ...pastBookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(booking => {
        const status = booking.payment_status?.toLowerCase();
        
        switch (statusFilter) {
          case 'failed':
            return ['failed', 'authorization_failed', 'capture_failed'].includes(status);
          case 'unpaid':
            return ['unpaid', 'not paid', ''].includes(status) || !status;
          default:
            return status === statusFilter;
        }
      });
    }

    setFilteredBookings(filtered);
  };

  const handleSyncCustomers = async () => {
    setSyncingCustomers(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-customer-stripe-accounts');
      
      if (error) throw error;

      toast({
        title: 'Sync Complete',
        description: `Processed ${data.customersProcessed} customers, synced ${data.customersSynced}, added ${data.newPaymentMethods} payment methods`,
      });

      fetchBookings(); // Refresh data
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync customer accounts',
        variant: 'destructive',
      });
    } finally {
      setSyncingCustomers(false);
    }
  };

  const handlePaymentAction = (booking: Booking) => {
    // Normalize booking data to ensure total_cost is a number
    const normalizedBooking: NormalizedBooking = {
      ...booking,
      total_cost: typeof booking.total_cost === 'string' 
        ? parseFloat(booking.total_cost) || 0 
        : booking.total_cost
    };
    setSelectedBooking(normalizedBooking);
    setPaymentDialogOpen(true);
  };

  const getFailedBookings = () => {
    return filteredBookings.filter(booking => {
      const status = booking.payment_status?.toLowerCase();
      return ['failed', 'authorization_failed', 'capture_failed'].includes(status);
    });
  };

  const getUnpaidBookings = () => {
    return filteredBookings.filter(booking => {
      const status = booking.payment_status?.toLowerCase();
      return ['unpaid', 'not paid', ''].includes(status) || !status;
    });
  };

  const getTodaysBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return allBookings.filter(booking => {
      const bookingDate = new Date(booking.date_time);
      return bookingDate >= today && bookingDate < tomorrow;
    });
  };

  const getUpcomingBookings = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return allBookings.filter(booking => {
      const bookingDate = new Date(booking.date_time);
      return bookingDate >= tomorrow;
    });
  };

  const getCompletedBookings = () => {
    return pastBookings;
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex justify-center py-8">Loading payment data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Payment Management</h2>
          <p className="text-muted-foreground">Monitor and manage booking payments</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSyncCustomers} 
            disabled={syncingCustomers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncingCustomers ? 'animate-spin' : ''}`} />
            {syncingCustomers ? 'Syncing...' : 'Sync Customers'}
          </Button>
          <Button onClick={fetchBookings} variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`£${stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="text-green-600"
          subtitle={`${stats.paidBookings} paid bookings`}
        />
        <StatCard
          title="Pending Revenue"
          value={`£${stats.pendingRevenue.toFixed(2)}`}
          icon={Clock}
          color="text-blue-600"
          subtitle={`${stats.authorizedBookings} authorized`}
        />
        <StatCard
          title="Failed Payments"
          value={stats.failedBookings}
          icon={AlertCircle}
          color="text-red-600"
          subtitle="Require attention"
        />
        <StatCard
          title="Unpaid Bookings"
          value={stats.unpaidBookings}
          icon={AlertCircle}
          color="text-yellow-600"
          subtitle="Need payment setup"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by customer name, email, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Payment Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="authorized">Authorized</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              variant="outline"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Tables */}
      <Tabs defaultValue="today" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="today" className="text-blue-600">
            Today ({getTodaysBookings().length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({getUpcomingBookings().length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-green-600">
            Completed ({getCompletedBookings().length})
          </TabsTrigger>
          <TabsTrigger value="failed" className="text-red-600">
            Failed ({getFailedBookings().length})
          </TabsTrigger>
          <TabsTrigger value="unpaid" className="text-yellow-600">
            Unpaid ({getUnpaidBookings().length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({filteredBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cleaner</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getTodaysBookings().map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.date_time), 'HH:mm')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{booking.address}</TableCell>
                      <TableCell>£{typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost}</TableCell>
                      <TableCell>
                        <PaymentStatusIndicator status={booking.payment_status} />
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cleaner</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getUpcomingBookings().map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.date_time), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{booking.address}</TableCell>
                      <TableCell>£{typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost}</TableCell>
                      <TableCell>
                        <PaymentStatusIndicator status={booking.payment_status} />
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Completed Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cleaner</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCompletedBookings().map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.date_time), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{booking.address}</TableCell>
                      <TableCell>£{typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost}</TableCell>
                      <TableCell>
                        <PaymentStatusIndicator status={booking.payment_status} />
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cleaner</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.date_time), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{booking.address}</TableCell>
                      <TableCell>£{typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost}</TableCell>
                      <TableCell>
                        <PaymentStatusIndicator status={booking.payment_status} />
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Failed Payments - Requires Immediate Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFailedBookings().map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.date_time), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>£{typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost}</TableCell>
                      <TableCell>
                        <PaymentStatusIndicator status={booking.payment_status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handlePaymentAction(booking)}
                          variant="destructive"
                          className="flex items-center gap-1"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Retry Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unpaid">
          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-600 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Unpaid Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getUnpaidBookings().map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.date_time), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>£{typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost}</TableCell>
                      <TableCell>
                        <PaymentStatusIndicator status={booking.payment_status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handlePaymentAction(booking)}
                          className="flex items-center gap-1"
                        >
                          <DollarSign className="h-4 w-4" />
                          Setup Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Manual Payment Dialog */}
      <ManualPaymentDialog
        booking={selectedBooking}
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedBooking(null);
        }}
        onSuccess={fetchBookings}
      />
    </div>
  );
};

export default PaymentManagementDashboard;