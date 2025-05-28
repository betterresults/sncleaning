import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, DollarSign, TrendingUp, Clock, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, subDays, isAfter } from 'date-fns';

interface EarningsData {
  upcomingPayment: {
    paymentDate: string;
    amount: number;
    periodStart: string;
    periodEnd: string;
  };
  currentEarnings: {
    last7Days: number;
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

interface MonthlyEarnings {
  month: string;
  year: number;
  totalEarnings: number;
  completedJobs: number;
  averagePerJob: number;
}

const CleanerEarnings = () => {
  const { cleanerId, loading: authLoading } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    upcomingPayment: {
      paymentDate: '',
      amount: 0,
      periodStart: '',
      periodEnd: ''
    },
    currentEarnings: {
      last7Days: 0,
      totalEarnings: 0,
      completedJobs: 0,
      averagePerJob: 0
    },
    recentJobs: []
  });
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyEarnings[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('current');
  const [selectedMonthData, setSelectedMonthData] = useState<MonthlyEarnings | null>(null);
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

      // Get all completed bookings for this cleaner
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('cleaner', cleanerId)
        .eq('booking_status', 'Completed')
        .order('date_time', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching earnings:', bookingsError);
        setError('Failed to fetch earnings: ' + bookingsError.message);
        return;
      }

      console.log('Fetched completed bookings:', bookingsData?.length || 0);

      const completedBookings = bookingsData || [];
      const now = new Date();
      const last7Days = subDays(now, 7);
      
      // Get payment period info
      const paymentInfo = getPaymentPeriodInfo();

      // Calculate upcoming payment (earnings for the payment period)
      const upcomingPaymentEarnings = completedBookings
        .filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= paymentInfo.periodStartDate && bookingDate <= paymentInfo.periodEndDate;
        })
        .reduce((sum, booking) => sum + (booking.cleaner_pay || 0), 0);

      // Calculate last 7 days earnings
      const last7DaysEarnings = completedBookings
        .filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= last7Days;
        })
        .reduce((sum, booking) => sum + (booking.cleaner_pay || 0), 0);

      // Calculate total earnings and stats
      const totalEarnings = completedBookings.reduce((sum, booking) => sum + (booking.cleaner_pay || 0), 0);
      const averagePerJob = completedBookings.length > 0 ? totalEarnings / completedBookings.length : 0;

      // Get recent jobs (last 10)
      const recentJobs = completedBookings.slice(0, 10);

      // Calculate monthly history
      const monthlyData: { [key: string]: MonthlyEarnings } = {};
      
      completedBookings.forEach(booking => {
        const bookingDate = new Date(booking.date_time);
        const monthKey = format(bookingDate, 'yyyy-MM');
        const monthName = format(bookingDate, 'MMMM');
        const year = bookingDate.getFullYear();
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthName,
            year: year,
            totalEarnings: 0,
            completedJobs: 0,
            averagePerJob: 0
          };
        }
        
        monthlyData[monthKey].totalEarnings += booking.cleaner_pay || 0;
        monthlyData[monthKey].completedJobs += 1;
      });

      // Calculate averages and sort monthly data
      const monthlyHistory = Object.values(monthlyData)
        .map(month => ({
          ...month,
          averagePerJob: month.completedJobs > 0 ? month.totalEarnings / month.completedJobs : 0
        }))
        .sort((a, b) => b.year - a.year || (b.month.localeCompare(a.month)));

      setEarnings({
        upcomingPayment: {
          paymentDate: paymentInfo.paymentDate,
          amount: upcomingPaymentEarnings,
          periodStart: paymentInfo.periodStart,
          periodEnd: paymentInfo.periodEnd
        },
        currentEarnings: {
          last7Days: last7DaysEarnings,
          totalEarnings,
          completedJobs: completedBookings.length,
          averagePerJob
        },
        recentJobs
      });

      setMonthlyHistory(monthlyHistory);

    } catch (error) {
      console.error('Error in fetchEarningsData:', error);
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    if (value === 'current') {
      setSelectedMonthData(null);
    } else {
      const monthData = monthlyHistory.find(m => `${m.year}-${m.month}` === value);
      setSelectedMonthData(monthData || null);
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

  const displayData = selectedMonthData || earnings.currentEarnings;

  return (
    <div className="space-y-6">
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

      {/* Monthly History Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Earnings Overview</span>
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Period</SelectItem>
                {monthlyHistory.map((month) => (
                  <SelectItem key={`${month.year}-${month.month}`} value={`${month.year}-${month.month}`}>
                    {month.month} {month.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {selectedMonth === 'current' && (
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Last 7 Days</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">£{earnings.currentEarnings.last7Days.toFixed(2)}</div>
                  <p className="text-xs text-green-600">Recent activity</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">
                  {selectedMonth === 'current' ? 'Total Earnings' : 'Month Earnings'}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  £{(selectedMonthData?.totalEarnings || displayData.totalEarnings || 0).toFixed(2)}
                </div>
                <p className="text-xs text-purple-600">
                  {selectedMonth === 'current' ? 'All time' : `${selectedMonthData?.month} ${selectedMonthData?.year}`}
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
                  {selectedMonthData?.completedJobs || displayData.completedJobs || 0}
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
                  £{(selectedMonthData?.averagePerJob || displayData.averagePerJob || 0).toFixed(2)}
                </div>
                <p className="text-xs text-orange-600">Per completed job</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs - only show for current period */}
      {selectedMonth === 'current' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {earnings.recentJobs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent jobs found</p>
            ) : (
              <div className="space-y-4">
                {earnings.recentJobs
                  .filter(job => {
                    const jobDate = new Date(job.date_time);
                    const last7Days = subDays(new Date(), 7);
                    return jobDate >= last7Days;
                  })
                  .map((job) => (
                    <div key={job.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {job.first_name} {job.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {job.form_name || 'Standard Cleaning'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(job.date_time), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {job.booking_status}
                        </Badge>
                        <div className="font-semibold text-green-600">
                          £{job.cleaner_pay?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CleanerEarnings;
