import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Mail, MailOpen, MailX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailStatusIndicatorProps {
  customerEmail: string;
  onClick?: () => void;
}

interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  failed: number;
}

const EmailStatusIndicator = ({ customerEmail, onClick }: EmailStatusIndicatorProps) => {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmailStats();
  }, [customerEmail]);

  const fetchEmailStats = async () => {
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

      const stats: EmailStats = {
        total: data.length,
        sent: data.filter(log => log.status === 'sent').length,
        delivered: data.filter(log => log.status === 'delivered').length,
        opened: data.filter(log => log.status === 'opened').length,
        bounced: data.filter(log => log.status === 'bounced').length,
        failed: data.filter(log => log.status === 'failed').length,
      };

      setStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching email stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Badge variant="outline" className="cursor-default">
        <Mail className="h-3 w-3 mr-1" />
        Loading...
      </Badge>
    );
  }

  if (!stats || stats.total === 0) {
    return null;
  }

  // Determine status based on priority: bounced > failed > opened > delivered > sent
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let icon = <Mail className="h-3 w-3 mr-1" />;
  let text = '';

  if (stats.bounced > 0) {
    variant = 'destructive';
    icon = <MailX className="h-3 w-3 mr-1" />;
    text = `${stats.bounced} Bounced`;
  } else if (stats.failed > 0) {
    variant = 'destructive';
    icon = <MailX className="h-3 w-3 mr-1" />;
    text = `${stats.failed} Failed`;
  } else if (stats.opened > 0) {
    variant = 'default';
    icon = <MailOpen className="h-3 w-3 mr-1" />;
    text = `${stats.opened} Opened`;
  } else if (stats.delivered > 0) {
    variant = 'secondary';
    icon = <Mail className="h-3 w-3 mr-1" />;
    text = `${stats.delivered} Delivered`;
  } else if (stats.sent > 0) {
    variant = 'outline';
    icon = <Mail className="h-3 w-3 mr-1" />;
    text = `${stats.sent} Sent`;
  }

  return (
    <Badge 
      variant={variant} 
      className="cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      {icon}
      {text}
    </Badge>
  );
};

export default EmailStatusIndicator;
