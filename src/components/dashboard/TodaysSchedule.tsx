import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';

interface TodayBooking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  address: string;
  cleaning_type: string;
  cleaners?: {
    first_name: string;
    last_name: string;
  } | null;
}

const TodaysSchedule = () => {
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaysBookings();
  }, []);

  const fetchTodaysBookings = async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          date_time,
          first_name,
          last_name,
          address,
          cleaning_type,
          cleaners!bookings_cleaner_fkey (
            first_name,
            last_name
          )
        `)
        .gte('date_time', today.toISOString())
        .lt('date_time', tomorrow.toISOString())
        .order('date_time', { ascending: true });

      if (error) {
        console.error('Error fetching today\'s bookings:', error);
        return;
      }

      setTodayBookings(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-700 border-0 h-full">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-600 rounded w-1/2"></div>
            <div className="h-3 bg-slate-600 rounded w-3/4"></div>
            <div className="h-3 bg-slate-600 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-700 border-0 h-full">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Schedule
        </h3>
        
        {todayBookings.length === 0 ? (
          <div className="text-slate-300 text-sm py-4">
            No bookings scheduled for today
          </div>
        ) : (
          <div className="space-y-3">
            {todayBookings.map((booking) => (
              <div key={booking.id} className="bg-slate-600/50 rounded-lg p-3 hover:bg-slate-600/70 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-white font-medium text-sm">
                      {booking.cleaning_type}
                    </h4>
                    <p className="text-slate-300 text-xs flex items-center gap-1 mt-1">
                      <User className="h-3 w-3" />
                      {booking.first_name} {booking.last_name}
                    </p>
                  </div>
                  <div className="text-white text-xs font-medium bg-slate-500/50 px-2 py-1 rounded">
                    {format(new Date(booking.date_time), 'HH:mm')}
                  </div>
                </div>
                
                <div className="flex items-start gap-1 text-slate-300 text-xs mb-1">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{booking.address}</span>
                </div>
                
                {booking.cleaners && (
                  <div className="text-slate-400 text-xs mt-2 pt-2 border-t border-slate-500">
                    Cleaner: {booking.cleaners.first_name} {booking.cleaners.last_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysSchedule;
