import React from 'react';
import { Calendar, CheckCircle2, Link2, RefreshCw, Unplug, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useCleanerCalendarConnection,
  useConnectGoogleCalendar,
  useDisconnectGoogleCalendar,
  useSyncGoogleCalendar,
} from '@/hooks/useCleanerGoogleCalendar';
import { formatLondonDateTime } from '@/lib/ukTime';

interface AvailabilityGoogleCalendarPanelProps {
  cleanerId: number;
  weekStartIso: string;
  weekEndIso: string;
}

const AvailabilityGoogleCalendarPanel: React.FC<AvailabilityGoogleCalendarPanelProps> = ({
  cleanerId,
  weekStartIso,
  weekEndIso,
}) => {
  const { data: connection, isLoading } = useCleanerCalendarConnection(cleanerId);
  const connectGoogle = useConnectGoogleCalendar();
  const syncGoogle = useSyncGoogleCalendar(cleanerId, weekStartIso, weekEndIso);
  const disconnectGoogle = useDisconnectGoogleCalendar(cleanerId);

  const connected = connection?.status === 'connected';
  const hasError = connection?.status === 'error' || !!connection?.last_error;

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Calendar className="h-4 w-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Google Calendar</p>
            {connected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </span>
            )}
            {hasError && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                Needs attention
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {connected
              ? `Busy events block availability${connection.last_synced_at ? ` · Synced ${formatLondonDateTime(connection.last_synced_at)}` : ''}`
              : 'Connect a cleaner calendar to block busy time automatically.'}
          </p>
          {connection?.last_error && <p className="text-xs text-amber-700">{connection.last_error}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {connected ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => syncGoogle.mutate()}
              disabled={syncGoogle.isPending || disconnectGoogle.isPending}
              className="gap-2"
            >
              <RefreshCw className={syncGoogle.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Sync now
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => disconnectGoogle.mutate()}
              disabled={disconnectGoogle.isPending || syncGoogle.isPending}
              className="gap-2 text-muted-foreground"
            >
              <Unplug className="h-4 w-4" />
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => connectGoogle.mutate()}
            disabled={connectGoogle.isPending || isLoading}
            className="gap-2"
          >
            <Link2 className="h-4 w-4" />
            Connect
          </Button>
        )}
      </div>
    </div>
  );
};

export default AvailabilityGoogleCalendarPanel;
