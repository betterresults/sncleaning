import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShellAlertBanner } from '@/layouts/shell';

interface SMSUnreadBannerProps {
  totalUnread: number;
  unreadConversationCount: number;
  onViewMessages: () => void;
}

export function SMSUnreadBanner({
  totalUnread,
  unreadConversationCount,
  onViewMessages,
}: SMSUnreadBannerProps) {
  if (totalUnread === 0) return null;

  return (
    <ShellAlertBanner
      icon={Bell}
      title={`${totalUnread} new message${totalUnread !== 1 ? 's' : ''} waiting for response`}
      description={`${unreadConversationCount} conversation${unreadConversationCount !== 1 ? 's' : ''} with unread messages`}
      action={
        <Button size="sm" variant="outline" onClick={onViewMessages}>
          View Messages
        </Button>
      }
    />
  );
}
