import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnreadSMSCount } from '@/hooks/useUnreadSMSCount';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const SMSNotificationBadge = () => {
  const { count, loading } = useUnreadSMSCount();
  const navigate = useNavigate();
  const { userRole } = useAuth();

  // Only show for admins
  if (userRole !== 'admin' || loading) return null;

  const handleClick = () => {
    navigate('/admin/sms-messages');
  };

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      size="sm"
      className="relative h-8 w-8 p-0 text-white hover:bg-white/10 hover:text-white flex-shrink-0"
      title={count > 0 ? `${count} unanswered message${count !== 1 ? 's' : ''}` : 'SMS Messages'}
    >
      <MessageSquare className="h-4 w-4" />
      {count > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center min-w-[20px] animate-pulse"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  );
};

export default SMSNotificationBadge;
