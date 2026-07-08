import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CalendarCheck, CalendarOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { CleanerCalendarConnection } from '@/hooks/useCleanerGoogleCalendar';

const formatSynced = (iso: string | null) => {
  if (!iso) return 'never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return formatDistanceToNow(date, { addSuffix: true });
};

interface CleanerCalendarStatusProps {
  connection?: CleanerCalendarConnection | null;
}

// Admin-facing at-a-glance Google Calendar connection health for a cleaner.
export const CleanerCalendarStatus: React.FC<CleanerCalendarStatusProps> = ({ connection }) => {
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

  if (connection.status === 'error') {
    return (
      <div className="flex items-center gap-1.5 flex-wrap text-sm">
        <span className="text-muted-foreground font-medium">Calendar:</span>
        <Badge variant="outline" className="text-xs gap-1 text-red-700 border-red-300 bg-red-50">
          <AlertTriangle className="h-3 w-3" />
          Connection error
        </Badge>
        {connection.last_error && (
          <span className="text-xs text-red-600 max-w-xs truncate" title={connection.last_error}>
            {connection.last_error}
          </span>
        )}
        <span className="text-xs text-muted-foreground">· last ok {formatSynced(connection.last_synced_at)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap text-sm">
      <span className="text-muted-foreground font-medium">Calendar:</span>
      <Badge variant="outline" className="text-xs gap-1 text-green-700 border-green-300 bg-green-50">
        <CalendarCheck className="h-3 w-3" />
        Google connected
      </Badge>
      {connection.google_calendar_email && (
        <span className="text-xs text-muted-foreground break-all">{connection.google_calendar_email}</span>
      )}
      <span className="text-xs text-muted-foreground">· synced {formatSynced(connection.last_synced_at)}</span>
    </div>
  );
};

export default CleanerCalendarStatus;
