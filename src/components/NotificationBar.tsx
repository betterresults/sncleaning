import React from 'react';
import { X, Bell, Calendar, User, CreditCard, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const NotificationBar = () => {
  const { notifications, loading, dismissNotification, dismissAll } = useNotifications();
  const { userRole } = useAuth();

  // Only show for admins
  if (userRole !== 'admin' || loading) return null;

  // Don't render if no notifications
  if (notifications.length === 0) return null;

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
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getBadgeVariant = (severity: Notification['severity']) => {
    switch (severity) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Recent Activity
            </span>
            <Badge variant="secondary" className="text-xs">
              {notifications.length}
            </Badge>
          </div>
          
          {notifications.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss All
            </Button>
          )}
        </div>
        
        <div className="pb-3 space-y-2">
          {notifications.slice(0, 3).map((notification) => {
            const Icon = getIcon(notification.type);
            
            return (
              <Alert
                key={notification.id}
                className={`${getSeverityColor(notification.severity)} relative pr-12`}
              >
                <Icon className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{notification.message}</span>
                    <Badge variant={getBadgeVariant(notification.severity)} className="text-xs">
                      {notification.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(notification.timestamp), 'HH:mm')}
                    </span>
                  </div>
                </AlertDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-transparent"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Alert>
            );
          })}
          
          {notifications.length > 3 && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
              >
                +{notifications.length - 3} more notifications
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationBar;