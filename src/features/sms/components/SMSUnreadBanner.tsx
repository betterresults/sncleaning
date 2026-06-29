import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="mb-4 flex flex-shrink-0 items-center justify-between rounded-lg border border-primary/20 bg-primary/10 p-3">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary p-2">
          <Bell className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="font-medium text-primary">
            {totalUnread} new message{totalUnread !== 1 ? 's' : ''} waiting for response
          </p>
          <p className="text-sm text-muted-foreground">
            {unreadConversationCount} conversation{unreadConversationCount !== 1 ? 's' : ''} with
            unread messages
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        onClick={onViewMessages}
      >
        View Messages
      </Button>
    </div>
  );
}
