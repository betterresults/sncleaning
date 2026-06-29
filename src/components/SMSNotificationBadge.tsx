import React, { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { useUnreadSMSCount } from '@/hooks/useUnreadSMSCount';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ShellIconButton, ShellIconBadge } from '@/layouts/shell/ShellIconButton';

const SMSNotificationBadge = () => {
  const { count, loading } = useUnreadSMSCount();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const prevCountRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!loading && prevCountRef.current !== undefined && count > prevCountRef.current) {
      toast.info('📱 New SMS message received!', {
        description: 'Click to view your messages',
        action: {
          label: 'View',
          onClick: () => navigate('/admin-sms-messages'),
        },
        duration: 10000,
      });
    }
    prevCountRef.current = count;
  }, [count, loading, navigate]);

  if (userRole !== 'admin') return null;

  return (
    <ShellIconButton
      onClick={() => navigate('/admin-sms-messages')}
      title={count > 0 ? `${count} unanswered message${count !== 1 ? 's' : ''}` : 'SMS Messages'}
      aria-label={count > 0 ? `${count} unanswered SMS messages` : 'SMS Messages'}
      badge={count > 0 ? <ShellIconBadge>{count > 99 ? '99+' : count}</ShellIconBadge> : undefined}
    >
      <MessageSquare size={18} />
    </ShellIconButton>
  );
};

export default SMSNotificationBadge;
