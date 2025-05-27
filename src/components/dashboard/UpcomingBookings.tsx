
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
  const [cleaners, setCleaners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch upcoming bookings (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .gte('date_time', new Date().toISOString())
        .lte('date_time', nextWeek.toISOString())
        .order('date_time', { ascending: true })
        .limit(10);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return;
      }

      // Fetch cleaners for names
      const { data: cleanersData } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name')
        .order('first_name');

      setBookings(bookingsData || []);
      setCleaners(cleanersData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCleanerName = (cleanerId: number) => {
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

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No upcoming bookings in the next 7 days
      </div>
    );
  }

  return (
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
  );
};

export default UpcomingBookings;
