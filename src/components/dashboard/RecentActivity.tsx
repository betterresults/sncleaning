import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CheckCircle, DollarSign, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import {
  ShellList,
  ShellListItem,
  ShellListIcon,
  ShellListContent,
  ShellListTitle,
  ShellListMeta,
  ShellListValue,
  ShellListFooter,
  ShellEmpty,
  type ShellListIconTone,
} from '@/layouts/shell';

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);

      const { data: completedBookings, error: completedError } = await supabase
        .from('past_bookings')
        .select('id, date_time, first_name, last_name, total_cost, service_type')
        .order('date_time', { ascending: false })
        .limit(5);

      if (completedError) throw completedError;

      const combinedActivities: ActivityItem[] = [];

      completedBookings?.forEach((booking) => {
        combinedActivities.push({
          id: Number(booking.id),
          type: 'completed',
          title: `Completed: ${booking.first_name} ${booking.last_name}`,
          subtitle: booking.service_type || 'Cleaning service',
          amount: booking.total_cost ? Number(booking.total_cost) : undefined,
          timestamp: booking.date_time,
        });
      });

      combinedActivities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(combinedActivities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconTone = (type: ActivityItem['type']): ShellListIconTone => {
    switch (type) {
      case 'completed':
        return 'success';
      case 'payment':
      case 'booking':
        return 'brand';
      default:
        return 'default';
    }
  };

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'completed':
        return CheckCircle;
      case 'payment':
        return DollarSign;
      case 'booking':
        return Calendar;
      default:
        return TrendingUp;
    }
  };

  if (loading) {
    return (
      <ShellList aria-busy aria-label="Loading recent activity">
        {[1, 2, 3, 4, 5].map((i) => (
          <ShellListItem key={i}>
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <ShellListContent className="space-y-2">
              <Skeleton className="h-3.5 w-3/4 max-w-[14rem]" />
              <Skeleton className="h-3 w-1/2 max-w-[10rem]" />
            </ShellListContent>
            <Skeleton className="hidden h-4 w-14 shrink-0 sm:block" />
          </ShellListItem>
        ))}
      </ShellList>
    );
  }

  if (activities.length === 0) {
    return <ShellEmpty>No recent activity</ShellEmpty>;
  }

  return (
    <>
      <ShellList>
        {activities.map((activity) => (
          <ShellListItem key={`${activity.type}-${activity.id}`}>
            <ShellListIcon icon={getIcon(activity.type)} tone={getIconTone(activity.type)} />
            <ShellListContent>
              <ShellListTitle>{activity.title}</ShellListTitle>
              <ShellListMeta>
                {activity.subtitle} · {format(new Date(activity.timestamp), 'dd MMM, HH:mm')}
              </ShellListMeta>
            </ShellListContent>
            {activity.amount != null && (
              <ShellListValue>£{activity.amount.toFixed(2)}</ShellListValue>
            )}
          </ShellListItem>
        ))}
      </ShellList>
      <ShellListFooter>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate('/past-bookings')}
        >
          View all activity
          <ArrowRight className="h-4 w-4" />
        </Button>
      </ShellListFooter>
    </>
  );
};

export default RecentActivity;
