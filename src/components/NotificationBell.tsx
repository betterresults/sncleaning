import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Calendar, User, CreditCard } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { getNotificationRoute } from '@/lib/notificationRoutes';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

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

function getIconClass(severity: Notification['severity']) {
  switch (severity) {
    case 'success':
      return 'shell-list__icon shell-list__icon--success';
    case 'warning':
      return 'shell-list__icon shell-list__icon--warning';
    case 'error':
      return 'shell-list__icon shell-list__icon--error';
    default:
      return 'shell-list__icon shell-list__icon--brand';
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
        <button
          type="button"
          className="shell-icon-btn shell-icon-btn--badge"
          aria-label={
            loading
              ? 'Notifications'
              : unreadCount > 0
                ? `${unreadCount} notifications`
                : 'Notifications'
          }
        >
          <Bell size={18} />
          {!loading && unreadCount > 0 && (
            <span className="shell-icon-badge" aria-hidden>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="shell-notif-panel p-0 shadow-none" align="end" sideOffset={8}>
        <div className="shell-notif-panel__header">
          <h3 className="shell-notif-panel__title">Notifications</h3>
          {!loading && unreadCount > 1 && (
            <button type="button" className="shell-notif-panel__action" onClick={dismissAll}>
              Clear all
            </button>
          )}
        </div>

        {loading ? (
          <div className="shell-notif-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shell-notif-loading__row">
                <div className="shell-notif-loading__icon" />
                <div className="shell-notif-loading__text">
                  <div className="shell-notif-loading__line shell-notif-loading__line--wide" />
                  <div className="shell-notif-loading__line shell-notif-loading__line--narrow" />
                </div>
              </div>
            ))}
          </div>
        ) : unreadCount === 0 ? (
          <div className="shell-notif-empty">
            <span className="shell-notif-empty__icon" aria-hidden>
              <Bell />
            </span>
            <p>You're all caught up</p>
          </div>
        ) : (
          <div className="shell-notif-panel__scroll">
            <div className="shell-list shell-notif-list">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                const route = getNotificationRoute(notification);

                return (
                  <div
                    key={notification.id}
                    className={`shell-list__item shell-notif-list__item${route ? ' shell-notif-list__item--clickable' : ''}`}
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
                    <span className={getIconClass(notification.severity)} aria-hidden>
                      <Icon />
                    </span>

                    <div className="shell-list__content">
                      <p className="shell-list__title">{notification.message}</p>
                      <p className="shell-list__meta">
                        {getTypeLabel(notification.type)} · {getTimeLabel(notification)}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="shell-notif-list__dismiss"
                      onClick={(e) => handleDismiss(notification.id, e)}
                      aria-label="Dismiss notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
