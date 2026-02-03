import React, { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUnreadSMSCount } from '@/hooks/useUnreadSMSCount';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SMSNotificationBadge = () => {
  const { count, loading } = useUnreadSMSCount();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const prevCountRef = useRef(count);

  // Show toast when new message arrives
  useEffect(() => {
    if (!loading && count > prevCountRef.current && prevCountRef.current !== undefined) {
      toast.info('📱 New SMS message received!', {
        description: 'Click to view your messages',
        action: {
          label: 'View',
          onClick: () => navigate('/admin/sms-messages'),
        },
        duration: 10000,
      });
    }
    prevCountRef.current = count;
  }, [count, loading, navigate]);

  // Only show for admins
  if (userRole !== 'admin' || loading) return null;
  if (count === 0) return null;

  const handleClick = () => {
    navigate('/admin/sms-messages');
  };

  return (
    <Badge 
      onClick={handleClick}
      variant="destructive" 
      className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:opacity-90 transition-opacity animate-pulse"
    >
      <MessageSquare className="h-4 w-4" />
      <span className="font-medium whitespace-nowrap">
        {count} New Message{count !== 1 ? 's' : ''}
      </span>
    </Badge>
  );
};

export default SMSNotificationBadge;
