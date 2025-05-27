
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  cleaning_type: string;
  total_cost: number;
  payment_status: string;
  cleaner: number;
  customer: number;
}

const UpcomingBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching all bookings...');

      // Fetch ALL bookings first to see what's in the database
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*');

      console.log('All bookings:', bookingsData);
      console.log('Bookings error:', bookingsError);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to fetch bookings: ' + bookingsError.message);
        return;
      }

      setBookings(bookingsData || []);
      console.log('Set bookings count:', bookingsData?.length || 0);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An unexpected error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
      case 'not paid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">No bookings found in database</div>
        <button 
          onClick={fetchData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        </div>
        <button 
          onClick={fetchData}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Refresh
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Cleaner ID</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">
                      {booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : 'No date'}
                    </div>
                    <div className="text-gray-500">
                      {booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'No time'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">
                      {booking.first_name} {booking.last_name}
                    </div>
                    <div className="text-gray-500 text-xs">
                      ID: {booking.customer}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{booking.email}</div>
                    <div className="text-gray-500">{booking.phone_number}</div>
                  </div>
                </TableCell>
                <TableCell className="max-w-32 truncate">
                  {booking.address}
                </TableCell>
                <TableCell>{booking.cleaning_type || 'Standard'}</TableCell>
                <TableCell>{booking.cleaner || 'Unassigned'}</TableCell>
                <TableCell className="font-medium">
                  £{booking.total_cost?.toFixed(2) || '0.00'}
                </TableCell>
                <TableCell>
                  <Badge className={getPaymentStatusColor(booking.payment_status)}>
                    {booking.payment_status || 'Unpaid'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UpcomingBookings;
