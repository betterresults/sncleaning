
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, User, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  address: string;
  cleaning_type: string;
  total_cost: number;
  cleaner: number | null;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

const UpcomingBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUpcomingBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          date_time,
          first_name,
          last_name,
          address,
          cleaning_type,
          total_cost,
          cleaner,
          cleaners!bookings_cleaner_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching upcoming bookings:', error);
        return;
      }

      console.log('Fetched bookings data:', data);
      setBookings(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingBookings();
  }, []);

  const getCleanerName = (booking: Booking) => {
    if (!booking.cleaner) {
      return null; // Return null for unassigned bookings
    }

    if (booking.cleaners) {
      return `${booking.cleaners.first_name} ${booking.cleaners.last_name}`;
    }

    return 'Unknown Cleaner';
  };

  if (loading) {
    return <div className="text-center py-4">Loading upcoming bookings...</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No upcoming bookings found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const isUnassigned = !booking.cleaner;
        const cleanerName = getCleanerName(booking);

        return (
          <Card 
            key={booking.id} 
            className={`${
              isUnassigned 
                ? 'border-l-4 border-red-500 bg-red-50 hover:bg-red-100' 
                : 'hover:shadow-md'
            } transition-all duration-200`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {booking.first_name} {booking.last_name}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : 'No date'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'No time'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{booking.address}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {booking.cleaning_type || 'Standard Cleaning'}
                    </span>
                    <span className="font-semibold text-green-600">
                      £{booking.total_cost?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                <div className="ml-4 flex flex-col items-end space-y-2">
                  {isUnassigned ? (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <Badge variant="destructive" className="bg-red-600 text-white font-medium">
                        Unassigned
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <span className="text-gray-500">Cleaner:</span>
                      <div className="font-medium text-green-700">{cleanerName}</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default UpcomingBookings;
