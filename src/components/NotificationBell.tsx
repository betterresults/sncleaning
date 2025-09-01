import React, { useState } from 'react';
import { Bell, X, Calendar, User, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, loading, dismissNotification, dismissAll } = useNotifications();
  const { userRole } = useAuth();

  // Only show for admins
  if (userRole !== 'admin' || loading) return null;

  const unreadCount = notifications.length;

  const getIcon = (type: Notification['type']) => {
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
  };

  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getTimeLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  };

  const handleDismiss = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    dismissNotification(notificationId);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 p-0 text-white hover:bg-white/10 hover:text-white flex-shrink-0"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center min-w-[20px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0 mr-4" 
        align="end"
        side="bottom"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissAll}
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
        
        {unreadCount === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="p-2">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 relative group"
                  >
                    <div className={`p-1.5 rounded-full bg-muted ${getSeverityColor(notification.severity)}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs h-5">
                          {notification.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getTimeLabel(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDismiss(notification.id, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;