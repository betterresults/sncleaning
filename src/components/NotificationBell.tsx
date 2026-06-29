import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Calendar, User, CreditCard } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { getNotificationRoute } from '@/lib/notificationRoutes';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ShellIconButton, ShellIconBadge } from '@/layouts/shell/ShellIconButton';
import {
  ShellList,
  ShellListItem,
  ShellListIcon,
  ShellListContent,
  ShellListTitle,
  ShellListMeta,
  type ShellListIconTone,
} from '@/layouts/shell';

function getIcon(type: Notification['type']) {
  switch (type) {
    case 'booking':
      return Calendar;
    case 'customer':
      return User;
    case 'payment':
      return CreditCard;
    default:
      return Bell;
  }
}

function getIconTone(severity: Notification['severity']): ShellListIconTone {
  switch (severity) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'brand';
  }
}

function getTimeLabel(notification: Notification) {
  const timestamp = notification.bookingTime || notification.timestamp;
  const date = new Date(timestamp);

  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

function getTypeLabel(type: Notification['type']) {
  switch (type) {
    case 'booking':
      return 'Booking';
    case 'customer':
      return 'Customer';
    case 'payment':
      return 'Payment';
    default:
      return 'System';
  }
}

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, loading, dismissNotification, dismissAll } = useNotifications();
  const { userRole } = useAuth();

  if (userRole !== 'admin') return null;

  const unreadCount = notifications.length;

  const handleDismiss = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    dismissNotification(notificationId);
  };

  const handleNotificationClick = (notification: Notification) => {
    const route = getNotificationRoute(notification);
    if (route) {
      setIsOpen(false);
      navigate(route);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <ShellIconButton
          aria-label={
            loading
              ? 'Notifications'
              : unreadCount > 0
                ? `${unreadCount} notifications`
                : 'Notifications'
          }
          badge={
            !loading && unreadCount > 0 ? (
              <ShellIconBadge>{unreadCount > 99 ? '99+' : unreadCount}</ShellIconBadge>
            ) : undefined
          }
        >
          <Bell size={18} />
        </ShellIconButton>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          'w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-[14px] border border-black/10 bg-white p-0 shadow-none isolate',
          'shadow-[0_4px_12px_rgba(0,40,100,0.08),0_0_0_1px_rgba(0,0,0,0.04)]',
        )}
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between gap-2 border-b border-shell-divider px-2.5 py-2">
          <h3 className="m-0 text-[13px] font-semibold tracking-tight text-shell-text">
            Notifications
          </h3>
          {!loading && unreadCount > 1 && (
            <button
              type="button"
              className="cursor-pointer rounded-md border-none bg-transparent px-1.5 py-0.5 text-xs font-medium text-shell-brand transition-colors hover:bg-shell-brand/10"
              onClick={dismissAll}
            >
              Clear all
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2.5 px-2.5 pb-2.5 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="h-[26px] w-[26px] shrink-0 animate-shell-stat-pulse rounded-full bg-black/[0.06]" />
                <div className="flex flex-1 flex-col gap-1.5 pt-1">
                  <div className="h-2 w-[88%] animate-shell-stat-pulse rounded bg-black/[0.06]" />
                  <div className="h-2 w-[42%] animate-shell-stat-pulse rounded bg-black/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        ) : unreadCount === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-3 py-5 text-shell-muted">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-shell-faint"
              aria-hidden
            >
              <Bell className="h-[18px] w-[18px]" />
            </span>
            <p className="m-0 text-[13px]">You're all caught up</p>
          </div>
        ) : (
          <div className="max-h-[min(300px,50dvh)] overflow-x-hidden overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-color:rgba(0,0,0,0.2)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15">
            <ShellList variant="notification">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                const route = getNotificationRoute(notification);

                return (
                  <ShellListItem
                    key={notification.id}
                    variant="notification"
                    clickable={!!route}
                    role={route ? 'button' : undefined}
                    tabIndex={route ? 0 : undefined}
                    onClick={route ? () => handleNotificationClick(notification) : undefined}
                    onKeyDown={
                      route
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleNotificationClick(notification);
                            }
                          }
                        : undefined
                    }
                  >
                    <ShellListIcon
                      icon={Icon}
                      tone={getIconTone(notification.severity)}
                      variant="notification"
                    />

                    <ShellListContent>
                      <ShellListTitle variant="notification">
                        {notification.message}
                      </ShellListTitle>
                      <ShellListMeta variant="notification">
                        {getTypeLabel(notification.type)} · {getTimeLabel(notification)}
                      </ShellListMeta>
                    </ShellListContent>

                    <button
                      type="button"
                      className={cn(
                        'mt-px inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-shell-faint opacity-0 transition-[opacity,background,color] group-hover:opacity-100 hover:bg-black/5 hover:text-shell-muted focus-visible:opacity-100 max-md:opacity-100',
                      )}
                      onClick={(e) => handleDismiss(notification.id, e)}
                      aria-label="Dismiss notification"
                    >
                      <X size={14} />
                    </button>
                  </ShellListItem>
                );
              })}
            </ShellList>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
