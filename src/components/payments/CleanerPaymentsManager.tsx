import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar, DollarSign, Clock, User } from 'lucide-react';

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface PaymentData {
  totalEarnings: number;
  completedJobs: number;
  averagePerJob: number;
  bookings: Array<{
    id: number;
    date_time: string;
    address: string;
    cleaner_pay: number;
    total_hours: number;
    payment_status: string;
  }>;
}

const CleanerPaymentsManager = () => {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string>('');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [period, setPeriod] = useState<'last_month' | 'current_month'>('last_month');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCleaners();
  }, []);

  useEffect(() => {
    if (selectedCleanerId) {
      fetchPaymentData();
    }
  }, [selectedCleanerId, period]);

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
    if (!selectedCleanerId) return;

    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from('past_bookings')
        .select(`
          id,
          date_time,
          address,
          cleaner_pay,
          total_hours,
          payment_status,
          cleaner_pay_status
        `)
        .eq('cleaner', parseInt(selectedCleanerId))
        .gte('date_time', start.toISOString())
        .lte('date_time', end.toISOString())
        .order('date_time', { ascending: false });

      if (error) throw error;

      const bookings = data || [];
      const totalEarnings = bookings.reduce((sum, booking) => sum + (Number(booking.cleaner_pay) || 0), 0);
      const completedJobs = bookings.length;
      const averagePerJob = completedJobs > 0 ? totalEarnings / completedJobs : 0;

      setPaymentData({
        totalEarnings,
        completedJobs,
        averagePerJob,
        bookings
      });
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const selectedCleaner = cleaners.find(c => c.id.toString() === selectedCleanerId);
  const { start, end } = getDateRange();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Select Cleaner</label>
          <Select value={selectedCleanerId} onValueChange={setSelectedCleanerId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a cleaner..." />
            </SelectTrigger>
            <SelectContent>
              {cleaners.map((cleaner) => (
                <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                  {cleaner.first_name} {cleaner.last_name}
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

      {selectedCleaner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedCleaner.first_name} {selectedCleaner.last_name}
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
      ) : paymentData && selectedCleaner ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{paymentData.totalEarnings.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paymentData.completedJobs}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average per Job</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{paymentData.averagePerJob.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentData.bookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No completed jobs found for this period.
                </p>
              ) : (
                <div className="space-y-3">
                  {paymentData.bookings.map((booking) => (
                    <div key={booking.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{booking.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.date_time), 'MMM dd, yyyy HH:mm')} • 
                          {booking.total_hours}h • Pay Status: {booking.payment_status || 'Unpaid'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">£{Number(booking.cleaner_pay || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : selectedCleanerId ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Select a cleaner to view payment details.</p>
        </div>
      ) : null}
    </div>
  );
};

export default CleanerPaymentsManager;