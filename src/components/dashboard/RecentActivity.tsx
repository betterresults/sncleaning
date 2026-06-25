import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CheckCircle, DollarSign, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'booking':
        return <Calendar className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getIconClass = (type: ActivityItem['type']) => {
    switch (type) {
      case 'completed':
        return 'shell-list__icon shell-list__icon--success';
      case 'payment':
      case 'booking':
        return 'shell-list__icon shell-list__icon--brand';
      default:
        return 'shell-list__icon';
    }
  };

  if (loading) {
    return (
      <div className="shell-list">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="shell-list__item animate-pulse">
            <div className="shell-list__icon bg-black/5" />
            <div className="shell-list__content space-y-2">
              <div className="h-3.5 bg-black/5 rounded w-3/4" />
              <div className="h-3 bg-black/5 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return <div className="shell-empty">No recent activity</div>;
  }

  return (
    <>
      <div className="shell-list">
        {activities.map((activity) => (
          <div key={`${activity.type}-${activity.id}`} className="shell-list__item">
            <span className={getIconClass(activity.type)} aria-hidden>
              {getIcon(activity.type)}
            </span>
            <div className="shell-list__content">
              <p className="shell-list__title">{activity.title}</p>
              <p className="shell-list__meta">
                {activity.subtitle} · {format(new Date(activity.timestamp), 'dd MMM, HH:mm')}
              </p>
            </div>
            {activity.amount != null && (
              <span className="shell-list__value">£{activity.amount.toFixed(2)}</span>
            )}
          </div>
        ))}
      </div>
      <div className="shell-list__footer">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate('/past-bookings')}
        >
          View all activity
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};

export default RecentActivity;
