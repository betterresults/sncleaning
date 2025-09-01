import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  message: string;
  type: 'booking' | 'customer' | 'payment' | 'system';
  severity: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  entityId?: string;
  entityType?: string;
  actionType: string;
  dismissed?: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  // Load dismissed notifications from localStorage
  const getDismissedNotifications = (): string[] => {
    try {
      const dismissed = localStorage.getItem('dismissed_notifications');
      return dismissed ? JSON.parse(dismissed) : [];
    } catch {
      return [];
    }
  };

  // Save dismissed notification to localStorage
  const saveDismissedNotification = (notificationId: string) => {
    try {
      const dismissed = getDismissedNotifications();
      dismissed.push(notificationId);
      localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
    } catch (error) {
      console.warn('Failed to save dismissed notification:', error);
    }
  };

  // Convert activity log to notification
  const activityLogToNotification = (log: any): Notification | null => {
    const dismissed = getDismissedNotifications();
    if (dismissed.includes(log.id)) return null;

    let message = '';
    let type: Notification['type'] = 'system';
    let severity: Notification['severity'] = 'info';

    switch (log.action_type) {
      case 'booking_created':
        message = `New booking created for ${log.details?.customer_email || 'customer'}`;
        type = 'booking';
        severity = 'success';
        break;
      case 'booking_cancelled':
        message = `Booking cancelled for ${log.details?.customer_email || 'customer'}`;
        type = 'booking';
        severity = 'warning';
        break;
      case 'customer_created':
        message = `New customer registered: ${log.details?.name || 'Unknown'}`;
        type = 'customer';
        severity = 'success';
        break;
      case 'payment_method_added':
        message = `Payment method added for customer`;
        type = 'payment';
        severity = 'info';
        break;
      case 'booking_status_changed':
        if (log.details?.new_status === 'completed') {
          message = `Booking completed for ${log.details?.customer_email || 'customer'}`;
          type = 'booking';
          severity = 'success';
        } else {
          message = `Booking status changed to ${log.details?.new_status}`;
          type = 'booking';
          severity = 'info';
        }
        break;
      case 'file_upload':
        if (log.details?.file_type?.includes('image')) {
          message = `Cleaning photos uploaded for booking`;
          type = 'booking';
          severity = 'info';
        }
        break;
      default:
        return null; // Don't show notification for this action type
    }

    if (!message) return null;

    return {
      id: log.id,
      message,
      type,
      severity,
      timestamp: log.created_at,
      entityId: log.entity_id,
      entityType: log.entity_type,
      actionType: log.action_type,
      dismissed: false
    };
  };

  // Fetch recent notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get recent activity logs (last 24 hours)
      const since = new Date();
      since.setHours(since.getHours() - 24);

      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Convert to notifications and filter out dismissed ones
      const newNotifications = (logs || [])
        .map(activityLogToNotification)
        .filter((n): n is Notification => n !== null)
        .slice(0, 10); // Show max 10 notifications

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dismiss notification
  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    saveDismissedNotification(notificationId);
  };

  // Dismiss all notifications
  const dismissAll = () => {
    notifications.forEach(n => saveDismissedNotification(n.id));
    setNotifications([]);
  };

  // Setup real-time updates
  useEffect(() => {
    if (!user || userRole !== 'admin') return;

    fetchNotifications();

    // Subscribe to real-time updates for activity logs
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs'
        },
        (payload) => {
          const newNotification = activityLogToNotification(payload.new);
          if (newNotification) {
            setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole]);

  return {
    notifications,
    loading,
    dismissNotification,
    dismissAll,
    refetch: fetchNotifications
  };
};