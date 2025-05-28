
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { CalendarDays, Clock, MapPin, User, Banknote } from 'lucide-react';

interface PastBooking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  form_name: string;
  total_cost: string;
  cleaner_pay: number;
  payment_status: string;
  booking_status: string;
}

const CleanerPastBookings = () => {
  const { cleanerId, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<PastBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPastBookings = async () => {
    if (!cleanerId) {
      setError('No cleaner ID found');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching past bookings for cleaner ID:', cleanerId);
      
      // Only get past bookings that were assigned to this specific cleaner
      const { data, error } = await supabase
        .from('past_bookings')
        .select('*')
        .eq('cleaner', cleanerId)
        .order('date_time', { ascending: false });

      if (error) {
        console.error('Error fetching past bookings:', error);
        setError('Failed to fetch past bookings');
        return;
      }

      console.log('Past bookings data for cleaner:', data?.length || 0);
      setBookings(data || []);
    } catch (error) {
      console.error('Error in fetchPastBookings:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && cleanerId) {
      fetchPastBookings();
    }
  }, [cleanerId, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading past bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Past Bookings</CardTitle>
          <p className="text-sm text-gray-600">
            {bookings.length} completed booking{bookings.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No past bookings found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-start space-x-3">
                          <div className="flex flex-col items-center space-y-1">
                            <CalendarDays className="h-4 w-4 text-gray-400" />
                            <Clock className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : 'No date'}
                            </div>
                            <div className="text-gray-500 text-sm">
                              {booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'No time'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center">
                            <User className="h-3 w-3 mr-2 text-gray-400" />
                            {booking.first_name} {booking.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.phone_number}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start space-x-2 max-w-48">
                          <MapPin className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                          <div className="text-sm text-gray-700 leading-tight">
                            <div>{booking.address}</div>
                            {booking.postcode && (
                              <div className="text-gray-500 font-medium">{booking.postcode}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {booking.form_name || 'Standard Cleaning'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Banknote className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            £{booking.cleaner_pay?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CleanerPastBookings;
