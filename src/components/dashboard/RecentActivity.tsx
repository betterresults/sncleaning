import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CheckCircle, DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface ActivityItem {
  id: number;
  type: 'completed' | 'payment' | 'booking';
  title: string;
  subtitle: string;
  amount?: number;
  timestamp: string;
}

const RecentActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);

      // Fetch recent completed bookings
      const { data: completedBookings, error: completedError } = await supabase
        .from('past_bookings')
        .select('id, date_time, first_name, last_name, total_cost, service_type')
        .order('date_time', { ascending: false })
        .limit(5);

      if (completedError) throw completedError;

      // Combine and format activities
      const combinedActivities: ActivityItem[] = [];

      // Add completed bookings
      completedBookings?.forEach(booking => {
        combinedActivities.push({
          id: Number(booking.id),
          type: 'completed',
          title: `Completed: ${booking.first_name} ${booking.last_name}`,
          subtitle: booking.service_type || 'Cleaning service',
          amount: booking.total_cost ? Number(booking.total_cost) : undefined,
          timestamp: booking.date_time
        });
      });

      // Sort by timestamp and take top 5
      combinedActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(combinedActivities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'payment':
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      case 'booking':
        return <Calendar className="h-5 w-5 text-purple-600" />;
      default:
        return <TrendingUp className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Няма скорошна активност</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div 
          key={`${activity.type}-${activity.id}`}
          className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="flex-shrink-0">
            {getIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {activity.title}
            </p>
            <p className="text-xs text-gray-500">
              {activity.subtitle} • {format(new Date(activity.timestamp), 'dd MMM, HH:mm')}
            </p>
          </div>
          {activity.amount && (
            <div className="flex-shrink-0 text-sm font-semibold text-gray-900">
              £{activity.amount.toFixed(2)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;
