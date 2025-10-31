import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';

interface BookingDate {
  date: string;
  count: number;
}

const UpcomingScheduleCalendar = () => {
  const [bookingDates, setBookingDates] = useState<BookingDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchUpcomingBookings();
  }, []);

  const fetchUpcomingBookings = async () => {
    try {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('bookings')
        .select('date_time')
        .gte('date_time', now.toISOString())
        .lte('date_time', thirtyDaysLater.toISOString());

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      // Group bookings by date
      const dateMap = new Map<string, number>();
      data?.forEach((booking) => {
        const date = new Date(booking.date_time).toDateString();
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      });

      const dates: BookingDate[] = Array.from(dateMap.entries()).map(([date, count]) => ({
        date,
        count,
      }));

      setBookingDates(dates);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getBookingCountForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return bookingDates.find((bd) => bd.date === dateStr)?.count || 0;
  };

  const modifiers = {
    hasBookings: (date: Date) => getBookingCountForDate(date) > 0,
  };

  const modifiersStyles = {
    hasBookings: {
      fontWeight: 'bold',
      position: 'relative' as const,
    },
  };

  return (
    <Card className="border shadow-sm h-full">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Upcoming Schedule
        </h3>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border"
            components={{
              DayContent: ({ date, ...props }) => {
                const count = getBookingCountForDate(date);
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div {...props}>{date.getDate()}</div>
                    {count > 0 && (
                      <Badge 
                        variant="default" 
                        className="absolute -bottom-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-teal-500"
                      >
                        {count}
                      </Badge>
                    )}
                  </div>
                );
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingScheduleCalendar;
