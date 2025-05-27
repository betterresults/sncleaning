
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
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [cleaners, setCleaners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching all bookings to check database...');

      // First, let's check if there are ANY bookings at all
      const { data: allBookingsData, error: allBookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('date_time', { ascending: true });

      console.log('All bookings in database:', { 
        allBookingsData, 
        allBookingsError,
        count: allBookingsData?.length || 0 
      });

      if (allBookingsError) {
        console.error('Error fetching all bookings:', allBookingsError);
        setError('Failed to fetch bookings: ' + allBookingsError.message);
        return;
      }

      setAllBookings(allBookingsData || []);

      // Now let's filter for upcoming bookings
      const now = new Date().toISOString();
      console.log('Current time for filtering:', now);

      const upcomingBookings = (allBookingsData || []).filter(booking => {
        const bookingDate = new Date(booking.date_time);
        const isUpcoming = bookingDate >= new Date();
        console.log(`Booking ${booking.id}: ${booking.date_time} - Is upcoming: ${isUpcoming}`);
        return isUpcoming;
      });

      console.log('Filtered upcoming bookings:', {
        upcomingCount: upcomingBookings.length,
        upcomingBookings: upcomingBookings
      });

      // Fetch cleaners for names
      const { data: cleanersData, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name')
        .order('first_name');

      console.log('Cleaners query result:', { cleanersData, cleanersError });

      if (cleanersError) {
        console.error('Error fetching cleaners:', cleanersError);
      }

      setBookings(upcomingBookings);
      setCleaners(cleanersData || []);

      console.log('Final data set:', {
        totalBookingsInDB: allBookingsData?.length || 0,
        upcomingBookingsCount: upcomingBookings.length,
        cleanersCount: cleanersData?.length || 0
      });

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

  const getCleanerName = (cleanerId: number) => {
    if (!cleanerId) return 'Unassigned';
    const cleaner = cleaners.find(c => c.id === cleanerId);
    return cleaner ? `${cleaner.first_name} ${cleaner.last_name}` : 'Unassigned';
  };

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

  if (allBookings.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">No bookings found in the database</div>
        <div className="text-sm text-gray-400">
          There are no bookings in your database yet. Create some bookings to see them here.
        </div>
        <button 
          onClick={fetchData}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">No upcoming bookings found</div>
        <div className="text-sm text-gray-400 mb-4">
          Found {allBookings.length} total booking{allBookings.length !== 1 ? 's' : ''} in database, but none are upcoming.
        </div>
        <div className="text-xs text-gray-300 mb-4">
          All bookings might be in the past, or there might be an issue with date filtering.
        </div>
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
          Showing {bookings.length} upcoming booking{bookings.length !== 1 ? 's' : ''} out of {allBookings.length} total
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
              <TableHead>Cleaner</TableHead>
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
                      {format(new Date(booking.date_time), 'dd/MM/yyyy')}
                    </div>
                    <div className="text-gray-500">
                      {format(new Date(booking.date_time), 'HH:mm')}
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
                <TableCell>{getCleanerName(booking.cleaner)}</TableCell>
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
