
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface EarningsData {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  completedBookings: number;
  averagePerBooking: number;
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

const CleanerEarnings = () => {
  const { cleanerId, loading: authLoading } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    completedBookings: 0,
    averagePerBooking: 0,
  });
  const [recentEarnings, setRecentEarnings] = useState<BookingEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // Calculate earnings
      const totalEarnings = completedBookings.reduce((sum, booking) => sum + (booking.cleaner_pay || 0), 0);
      
      const thisMonthEarnings = completedBookings
        .filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= thisMonthStart && bookingDate <= thisMonthEnd;
        })
        .reduce((sum, booking) => sum + (booking.cleaner_pay || 0), 0);

      const lastMonthEarnings = completedBookings
        .filter(booking => {
          const bookingDate = new Date(booking.date_time);
          return bookingDate >= lastMonthStart && bookingDate <= lastMonthEnd;
        })
        .reduce((sum, booking) => sum + (booking.cleaner_pay || 0), 0);

      const averagePerBooking = completedBookings.length > 0 ? totalEarnings / completedBookings.length : 0;

      setEarnings({
        totalEarnings,
        thisMonthEarnings,
        lastMonthEarnings,
        completedBookings: completedBookings.length,
        averagePerBooking,
      });

      // Set recent earnings (last 10 completed bookings)
      setRecentEarnings(completedBookings.slice(0, 10));

    } catch (error) {
      console.error('Error in fetchEarningsData:', error);
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
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
        <button 
          onClick={fetchEarningsData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earnings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">£{earnings.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-green-600">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">This Month</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">£{earnings.thisMonthEarnings.toFixed(2)}</div>
            <p className="text-xs text-blue-600">{format(new Date(), 'MMMM yyyy')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Completed Jobs</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{earnings.completedBookings}</div>
            <p className="text-xs text-purple-600">Total completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Average per Job</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">£{earnings.averagePerBooking.toFixed(2)}</div>
            <p className="text-xs text-orange-600">Per completed job</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEarnings.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No completed bookings found</p>
          ) : (
            <div className="space-y-4">
              {recentEarnings.map((booking) => (
                <div key={booking.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {booking.first_name} {booking.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.form_name || 'Standard Cleaning'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(booking.date_time), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {booking.booking_status}
                    </Badge>
                    <div className="font-semibold text-green-600">
                      £{booking.cleaner_pay?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Comparison */}
      {earnings.lastMonthEarnings > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">Last Month</div>
                <div className="text-lg font-semibold">£{earnings.lastMonthEarnings.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">This Month</div>
                <div className="text-lg font-semibold">£{earnings.thisMonthEarnings.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Change</div>
                <div className={`text-lg font-semibold ${
                  earnings.thisMonthEarnings >= earnings.lastMonthEarnings ? 'text-green-600' : 'text-red-600'
                }`}>
                  {earnings.thisMonthEarnings >= earnings.lastMonthEarnings ? '+' : ''}
                  £{(earnings.thisMonthEarnings - earnings.lastMonthEarnings).toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CleanerEarnings;
