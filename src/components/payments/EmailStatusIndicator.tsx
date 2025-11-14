import React, { useEffect, useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface EmailStatusIndicatorProps {
  customerEmail: string;
  onClick?: () => void;
}

interface NotificationStats {
  emailPositive: boolean;
  emailNegative: boolean;
  smsPositive: boolean;
  hasEmail: boolean;
  hasSms: boolean;
}

const EmailStatusIndicator = ({ customerEmail, onClick }: EmailStatusIndicatorProps) => {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificationStats();
  }, [customerEmail]);

  const fetchNotificationStats = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('status')
        .eq('recipient_email', customerEmail);

      if (error) throw error;

      if (!data || data.length === 0) {
        setStats(null);
        setLoading(false);
        return;
      }

      const stats: NotificationStats = {
        hasEmail: data.length > 0,
        hasSms: false, // SMS tracking to be added later
        emailPositive: data.some(log => log.status === 'opened' || log.status === 'delivered'),
        emailNegative: data.some(log => log.status === 'bounced' || log.status === 'failed'),
        smsPositive: false,
      };

      setStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2">
        <Mail className="h-4 w-4 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  if (!stats || (!stats.hasEmail && !stats.hasSms)) {
    return null;
  }

  return (
    <div 
      className="flex gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      {stats.hasEmail && (
        <Mail 
          className={cn(
            "h-4 w-4",
            stats.emailNegative ? "text-destructive" : stats.emailPositive ? "text-green-500" : "text-muted-foreground"
          )} 
        />
      )}
      {stats.hasSms && (
        <MessageSquare 
          className={cn(
            "h-4 w-4",
            stats.smsPositive ? "text-green-500" : "text-muted-foreground"
          )} 
        />
      )}
    </div>
  );
};

export default EmailStatusIndicator;
