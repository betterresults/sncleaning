import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CalendarCheck, CalendarOff, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  useAdminSyncCleanerGoogleCalendar,
  type CleanerCalendarConnection,
} from '@/hooks/useCleanerGoogleCalendar';

const formatSynced = (iso: string | null) => {
  if (!iso) return 'never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return formatDistanceToNow(date, { addSuffix: true });
};

interface CleanerCalendarStatusProps {
  cleanerId: number;
  connection?: CleanerCalendarConnection | null;
}

// Admin-facing at-a-glance Google Calendar connection health for a cleaner.
export const CleanerCalendarStatus: React.FC<CleanerCalendarStatusProps> = ({
  cleanerId,
  connection,
}) => {
  const syncCleaner = useAdminSyncCleanerGoogleCalendar();

  if (!connection || connection.status === 'disconnected') {
    return (
      <div className="flex items-center gap-1.5 flex-wrap text-sm">
        <span className="text-muted-foreground font-medium">Calendar:</span>
        <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
          <CalendarOff className="h-3 w-3" />
          Not connected
        </Badge>
      </div>
    );
  }

  const showRetry = connection.status === 'error' || connection.status === 'connected';

  return (
    <div className="flex items-center gap-1.5 flex-wrap text-sm">
      <span className="text-muted-foreground font-medium">Calendar:</span>
      {connection.status === 'error' ? (
        <Badge variant="outline" className="text-xs gap-1 text-red-700 border-red-300 bg-red-50">
          <AlertTriangle className="h-3 w-3" />
          Connection error
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs gap-1 text-green-700 border-green-300 bg-green-50">
          <CalendarCheck className="h-3 w-3" />
          Google connected
        </Badge>
      )}
      {connection.status === 'error' && connection.last_error && (
        <span className="text-xs text-red-600 max-w-xs truncate" title={connection.last_error}>
          {connection.last_error}
        </span>
      )}
      {connection.status === 'connected' && connection.google_calendar_email && (
        <span className="text-xs text-muted-foreground break-all">{connection.google_calendar_email}</span>
      )}
      <span className="text-xs text-muted-foreground">
        · {connection.status === 'error' ? 'last ok' : 'synced'} {formatSynced(connection.last_synced_at)}
      </span>
      {showRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={syncCleaner.isPending}
          onClick={() => syncCleaner.mutate(cleanerId)}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${syncCleaner.isPending ? 'animate-spin' : ''}`} />
          {connection.status === 'error' ? 'Retry sync' : 'Sync'}
        </Button>
      )}
    </div>
  );
};

export default CleanerCalendarStatus;
