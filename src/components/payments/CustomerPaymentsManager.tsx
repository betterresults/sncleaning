import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar, DollarSign, Clock, User } from 'lucide-react';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface PaymentData {
  totalRevenue: number;
  completedBookings: number;
  averagePerBooking: number;
  bookings: Array<{
    id: number;
    date_time: string;
    address: string;
    total_cost: string;
    payment_status: string;
    payment_method: string;
  }>;
}

const CustomerPaymentsManager = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [period, setPeriod] = useState<'last_month' | 'current_month'>('last_month');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchPaymentData();
    }
  }, [selectedCustomerId, period]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const getDateRange = () => {
    const now = new Date();
    if (period === 'current_month') {
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    } else {
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      };
    }
  };

  const fetchPaymentData = async () => {
    if (!selectedCustomerId) return;

    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from('past_bookings')
        .select(`
          id,
          date_time,
          address,
          total_cost,
          payment_status,
          payment_method
        `)
        .eq('customer', parseInt(selectedCustomerId))
        .gte('date_time', start.toISOString())
        .lte('date_time', end.toISOString())
        .order('date_time', { ascending: false });

      if (error) throw error;

      const bookings = data || [];
      const totalRevenue = bookings.reduce((sum, booking) => sum + (Number(booking.total_cost) || 0), 0);
      const completedBookings = bookings.length;
      const averagePerBooking = completedBookings > 0 ? totalRevenue / completedBookings : 0;

      setPaymentData({
        totalRevenue,
        completedBookings,
        averagePerBooking,
        bookings
      });
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);
  const { start, end } = getDateRange();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Select Customer</label>
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a customer..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.first_name} {customer.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Period</label>
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
      </div>

      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedCustomer.first_name} {selectedCustomer.last_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Period: {format(start, 'MMM dd, yyyy')} - {format(end, 'MMM dd, yyyy')}
            </p>
          </CardHeader>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading payment data...</div>
        </div>
      ) : paymentData && selectedCustomer ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{paymentData.totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paymentData.completedBookings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average per Booking</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{paymentData.averagePerBooking.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentData.bookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No completed bookings found for this period.
                </p>
              ) : (
                <div className="space-y-3">
                  {paymentData.bookings.map((booking) => (
                    <div key={booking.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{booking.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.date_time), 'MMM dd, yyyy HH:mm')} • 
                          {booking.payment_method || 'N/A'} • Status: {booking.payment_status || 'Unpaid'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">£{Number(booking.total_cost || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : selectedCustomerId ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Select a customer to view payment details.</p>
        </div>
      ) : null}
    </div>
  );
};

export default CustomerPaymentsManager;