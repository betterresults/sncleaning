import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, DollarSign, TrendingUp, Clock, Calendar, CreditCard } from 'lucide-react';
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
    <div className="space-y-8">
      {/* Upcoming Payment - Modern Design */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-0 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium opacity-90">Next Payment</div>
              <div className="text-xs opacity-70">{earnings.upcomingPayment.paymentDate}</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 pt-0">
          <div className="space-y-3">
            <div className="text-4xl font-bold tracking-tight">
              £{earnings.upcomingPayment.amount.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm w-fit">
              <Calendar className="h-4 w-4" />
              <span>{earnings.upcomingPayment.periodStart} - {earnings.upcomingPayment.periodEnd}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Overview with Period Selector */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Earnings Overview</h2>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48 bg-white border-gray-200 shadow-sm">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="current">Current Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="last6Months">Last 6 Months</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Earnings Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-medium text-emerald-700">Total Earnings</CardTitle>
                <p className="text-xs text-emerald-600 mt-1">
                  {selectedPeriod === 'current' ? 'This month' : 
                   selectedPeriod === 'lastMonth' ? 'Last month' :
                   selectedPeriod === 'last3Months' ? 'Last 3 months' :
                   selectedPeriod === 'last6Months' ? 'Last 6 months' : 'All time'}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-emerald-900 mb-2">
                £{periodData.totalEarnings.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 text-sm text-emerald-600">
                <TrendingUp className="h-4 w-4" />
                <span>Earnings tracked</span>
              </div>
            </CardContent>
          </Card>

          {/* Completed Jobs Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-medium text-blue-700">Completed Jobs</CardTitle>
                <p className="text-xs text-blue-600 mt-1">
                  Jobs completed successfully
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {periodData.completedJobs}
              </div>
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <Clock className="h-4 w-4" />
                <span>£{periodData.averagePerJob.toFixed(2)} avg per job</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Jobs */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.recentJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No recent jobs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.recentJobs.map((job) => (
                <div key={job.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {job.first_name} {job.last_name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {job.form_name || 'Standard Cleaning'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(job.date_time), 'dd/MM/yyyy')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="default" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                      {job.booking_status}
                    </Badge>
                    <div className="text-right">
                      <div className="font-bold text-lg text-green-600">
                        £{Number(job.cleaner_pay)?.toFixed(2) || '0.00'}
                      </div>
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
