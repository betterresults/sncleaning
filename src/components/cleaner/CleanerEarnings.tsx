
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, DollarSign, TrendingUp, Clock, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, subDays, isAfter, startOfYear } from 'date-fns';

interface EarningsData {
  upcomingPayment: {
    paymentDate: string;
    amount: number;
    periodStart: string;
    periodEnd: string;
  };
  currentEarnings: {
    totalEarnings: number;
    completedJobs: number;
    averagePerJob: number;
  };
  recentJobs: BookingEarning[];
}

interface BookingEarning {
  id: number;
  date_time: string;
  cleaner_pay: number;
  form_name: string;
  booking_status: string;
  first_name: string;
  last_name: string;
}

interface PeriodData {
  totalEarnings: number;
  completedJobs: number;
  averagePerJob: number;
}

const CleanerEarnings = () => {
  const { user, cleanerId, loading: authLoading } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    upcomingPayment: {
      paymentDate: '',
      amount: 0,
      periodStart: '',
      periodEnd: ''
    },
    currentEarnings: {
      totalEarnings: 0,
      completedJobs: 0,
      averagePerJob: 0
    },
    recentJobs: []
  });
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');
  const [periodData, setPeriodData] = useState<PeriodData>({
    totalEarnings: 0,
    completedJobs: 0,
    averagePerJob: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getPaymentPeriodInfo = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // If we're before the 5th of current month, payment is for previous month
    // If we're after the 5th, payment is for current month (next payment date)
    let paymentMonth, paymentYear, periodStart, periodEnd;
    
    if (now.getDate() < 5) {
      // Payment is for previous month, happening on 5th of this month
      paymentMonth = currentMonth;
      paymentYear = currentYear;
      periodStart = startOfMonth(subMonths(now, 1));
      periodEnd = endOfMonth(subMonths(now, 1));
    } else {
      // Payment is for current month, happening on 5th of next month
      const nextMonth = addMonths(now, 1);
      paymentMonth = nextMonth.getMonth();
      paymentYear = nextMonth.getFullYear();
      periodStart = startOfMonth(now);
      periodEnd = endOfMonth(now);
    }
    
    const paymentDate = new Date(paymentYear, paymentMonth, 5);
    
    return {
      paymentDate: format(paymentDate, 'do MMMM yyyy'),
      periodStart: format(periodStart, 'do MMMM yyyy'),
      periodEnd: format(periodEnd, 'do MMMM yyyy'),
      periodStartDate: periodStart,
      periodEndDate: periodEnd
    };
  };

  const calculatePeriodData = (bookings: BookingEarning[], period: string) => {
    const now = new Date();
    let filteredBookings: BookingEarning[] = [];

    switch (period) {
      case 'current':
        // Current month (1st to end of month)
        const currentStart = startOfMonth(now);
        const currentEnd = endOfMonth(now);
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= currentStart && bookingDate <= currentEnd;
        });
        break;
      case 'lastMonth':
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= lastMonthStart && bookingDate <= lastMonthEnd;
        });
        break;
      case 'last3Months':
        const last3MonthsStart = startOfMonth(subMonths(now, 2));
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= last3MonthsStart;
        });
        break;
      case 'last6Months':
        const last6MonthsStart = startOfMonth(subMonths(now, 5));
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= last6MonthsStart;
        });
        break;
      case 'allTime':
        filteredBookings = bookings;
        break;
      default:
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= startOfMonth(now) && bookingDate <= endOfMonth(now);
        });
    }

    const totalEarnings = filteredBookings.reduce((sum, booking) => sum + (Number(booking.cleaner_pay) || 0), 0);
    const completedJobs = filteredBookings.length;
    const averagePerJob = completedJobs > 0 ? totalEarnings / completedJobs : 0;

    return {
      totalEarnings,
      completedJobs,
      averagePerJob
    };
  };

  const fetchEarningsData = async () => {
    if (!cleanerId) {
      console.log('No cleaner ID found, cannot fetch earnings');
      setError('No cleaner ID found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching earnings for cleaner ID:', cleanerId);

      // Get all completed bookings for this cleaner from past_bookings table
      const { data: pastBookingsData, error: pastBookingsError } = await supabase
        .from('past_bookings')
        .select('*')
        .eq('cleaner', cleanerId)
        .order('date_time', { ascending: false });

      if (pastBookingsError) {
        console.error('Error fetching past bookings:', pastBookingsError);
        setError('Failed to fetch earnings: ' + pastBookingsError.message);
        return;
      }

      console.log('Fetched past bookings:', pastBookingsData?.length || 0);

      const completedBookings = pastBookingsData || [];
      
      // Get payment period info
      const paymentInfo = getPaymentPeriodInfo();

      // Calculate upcoming payment (earnings for the payment period)
      const upcomingPaymentEarnings = completedBookings
        .filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= paymentInfo.periodStartDate && bookingDate <= paymentInfo.periodEndDate;
        })
        .reduce((sum, booking) => sum + (Number(booking.cleaner_pay) || 0), 0);

      // Calculate current month data (default)
      const currentMonthData = calculatePeriodData(completedBookings, 'current');

      // Get recent jobs (last 10)
      const recentJobs = completedBookings.slice(0, 10);

      setEarnings({
        upcomingPayment: {
          paymentDate: paymentInfo.paymentDate,
          amount: upcomingPaymentEarnings,
          periodStart: paymentInfo.periodStart,
          periodEnd: paymentInfo.periodEnd
        },
        currentEarnings: currentMonthData,
        recentJobs
      });

      // Set initial period data to current month
      setPeriodData(currentMonthData);

    } catch (error) {
      console.error('Error in fetchEarningsData:', error);
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = async (value: string) => {
    setSelectedPeriod(value);
    
    // Recalculate data for the selected period
    if (earnings.recentJobs.length > 0) {
      // We need to get all bookings again to calculate for the new period
      const { data: pastBookingsData } = await supabase
        .from('past_bookings')
        .select('*')
        .eq('cleaner', cleanerId)
        .order('date_time', { ascending: false });

      if (pastBookingsData) {
        const newPeriodData = calculatePeriodData(pastBookingsData, value);
        setPeriodData(newPeriodData);
      }
    }
  };

  useEffect(() => {
    if (!authLoading && cleanerId) {
      fetchEarningsData();
    }
  }, [cleanerId, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading earnings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchEarningsData}>
          Retry
        </Button>
      </div>
    );
  }

  // Get first name for greeting
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Cleaner';

  return (
    <div className="space-y-6">
      {/* Friendly Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Hello {firstName}! 👋</h1>
      </div>

      {/* Upcoming Payment */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-900">£{earnings.upcomingPayment.amount.toFixed(2)}</div>
            <div className="text-sm text-blue-700">
              Payment on: <span className="font-semibold">{earnings.upcomingPayment.paymentDate}</span>
            </div>
            <div className="text-xs text-blue-600">
              For period: {earnings.upcomingPayment.periodStart} - {earnings.upcomingPayment.periodEnd}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Overview with Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Earnings Overview</span>
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="last3Months">Last 3 Months</SelectItem>
                <SelectItem value="last6Months">Last 6 Months</SelectItem>
                <SelectItem value="allTime">All Time</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  £{periodData.totalEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-purple-600">
                  {selectedPeriod === 'current' ? 'This month' : 
                   selectedPeriod === 'lastMonth' ? 'Last month' :
                   selectedPeriod === 'last3Months' ? 'Last 3 months' :
                   selectedPeriod === 'last6Months' ? 'Last 6 months' : 'All time'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Completed Jobs</CardTitle>
                <CalendarDays className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {periodData.completedJobs}
                </div>
                <p className="text-xs text-blue-600">Jobs completed</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Average per Job</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  £{periodData.averagePerJob.toFixed(2)}
                </div>
                <p className="text-xs text-orange-600">Per completed job</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.recentJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent jobs found</p>
          ) : (
            <div className="space-y-4">
              {earnings.recentJobs.map((job) => (
                <div key={job.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {job.first_name} {job.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {job.form_name || 'Standard Cleaning'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(job.date_time), 'dd/MM/yyyy')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {job.booking_status}
                    </Badge>
                    <div className="font-semibold text-green-600">
                      £{Number(job.cleaner_pay)?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CleanerEarnings;
