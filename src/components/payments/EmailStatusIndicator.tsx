import React, { useEffect, useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface EmailStatusIndicatorProps {
  customerEmail: string;
  phoneNumber?: string;
  onClick?: () => void;
  onEmailClick?: () => void;
  onSmsClick?: () => void;
}

interface NotificationStats {
  emailPositive: boolean;
  emailNegative: boolean;
  smsPositive: boolean;
  hasEmail: boolean;
  hasSms: boolean;
}

const EmailStatusIndicator = ({ customerEmail, phoneNumber, onClick, onEmailClick, onSmsClick }: EmailStatusIndicatorProps) => {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificationStats();
  }, [customerEmail, phoneNumber]);

  const fetchNotificationStats = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('status, recipient_email')
        .eq('recipient_email', customerEmail);

      if (error) throw error;

      let smsData: any[] = [];
      
      // Also check for SMS notifications by phone number if provided
      if (phoneNumber) {
        const { data: smsResult } = await supabase
          .from('notification_logs')
          .select('status, recipient_email')
          .eq('recipient_email', phoneNumber);
        
        smsData = smsResult || [];
      }

      if ((!data || data.length === 0) && smsData.length === 0) {
        setStats(null);
        setLoading(false);
        return;
      }

      const emailLogs = data || [];
      const smsLogs = smsData;

      const stats: NotificationStats = {
        hasEmail: emailLogs.length > 0,
        hasSms: smsLogs.length > 0,
        emailPositive: emailLogs.some(log => log.status === 'opened' || log.status === 'delivered'),
        emailNegative: emailLogs.some(log => log.status === 'bounced' || log.status === 'failed'),
        smsPositive: smsLogs.some(log => log.status === 'sent' || log.status === 'delivered'),
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
        <Mail className="h-4 w-4 text-gray-300 animate-pulse" />
      </div>
    );
  }

  // Always show icons in light gray, colored only if there are notifications
  const hasAnyNotifications = stats && (stats.hasEmail || stats.hasSms);

  return (
    <div className="flex gap-2">
      <Mail 
        className={cn(
          "h-4 w-4 cursor-pointer hover:opacity-70 transition-opacity",
          hasAnyNotifications && stats.hasEmail
            ? (stats.emailNegative ? "text-destructive" : stats.emailPositive ? "text-green-500" : "text-primary")
            : "text-gray-300"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (onEmailClick) {
            onEmailClick();
          } else if (onClick) {
            onClick();
          }
        }}
      />
      <MessageSquare 
        className={cn(
          "h-4 w-4 cursor-pointer hover:opacity-70 transition-opacity",
          hasAnyNotifications && stats.hasSms && stats.smsPositive
            ? "text-green-500"
            : "text-gray-300"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (onSmsClick) {
            onSmsClick();
          } else if (onClick) {
            onClick();
          }
        }}
      />
    </div>
  );
};

export default EmailStatusIndicator;
