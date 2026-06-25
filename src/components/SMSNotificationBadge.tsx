import React, { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { useUnreadSMSCount } from '@/hooks/useUnreadSMSCount';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SMSNotificationBadge = () => {
  const { count, loading } = useUnreadSMSCount();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const prevCountRef = useRef<number | undefined>(undefined);

  // Show toast when new message arrives
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

  // Only show for admins
  if (userRole !== 'admin') return null;

  const handleClick = () => {
    navigate('/admin-sms-messages');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="shell-icon-btn shell-icon-btn--badge"
      title={count > 0 ? `${count} unanswered message${count !== 1 ? 's' : ''}` : 'SMS Messages'}
      aria-label={count > 0 ? `${count} unanswered SMS messages` : 'SMS Messages'}
    >
      <MessageSquare size={18} />
      {count > 0 && (
        <span className="shell-icon-badge" aria-hidden>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default SMSNotificationBadge;
