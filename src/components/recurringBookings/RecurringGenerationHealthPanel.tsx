import { AlertTriangle, CalendarClock, Play, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  useRecurringGenerationHealth,
  useRunRecurringGeneration,
} from '@/hooks/queries/useRecurringGenerationHealth';
import { ShellStat, ShellStatGrid } from '@/layouts/shell';
import { formatUKDate } from '@/lib/ukTime';
import type { RecurringGenerationGapReason } from '@/api/recurring';

function formatRunTime(value?: string | null): string {
  if (!value) return 'Never';
  try {
    return new Date(value).toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function gapReasonLabel(reason: RecurringGenerationGapReason): string {
  switch (reason) {
    case 'no_upcoming_booking':
      return 'No upcoming booking';
    case 'horizon_lag':
      return 'Horizon not filled (~30 days)';
    case 'missing_schedule_fields':
      return 'Missing schedule fields';
    case 'missing_group_id':
      return 'Missing recurring group';
    default:
      return reason;
  }
}

export function RecurringGenerationHealthPanel() {
  const { data, isLoading, isFetching, refetch } = useRecurringGenerationHealth();
  const runNow = useRunRecurringGeneration();

  const lastRun = data?.last_run ?? null;
  const gaps = data?.gaps ?? [];

  return (
    <Card className="mb-4">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Generation health</h2>
            <p className="text-sm text-muted-foreground">
              Cron creates upcoming bookings automatically. Use Run now to force a pass, and review any series with gaps.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching || runNow.isPending}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => runNow.mutate()}
              disabled={runNow.isPending}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {runNow.isPending ? 'Running…' : 'Run now'}
            </Button>
          </div>
        </div>

        <ShellStatGrid className="mb-0 border-b-0 pb-0">
          <ShellStat
            label="Active series"
            value={isLoading ? '—' : data?.active_series ?? 0}
            hint="Confirmed & not postponed"
            icon={CalendarClock}
            tone="brand"
            loading={isLoading}
          />
          <ShellStat
            label="Gaps"
            value={isLoading ? '—' : data?.gap_count ?? 0}
            hint="Need attention"
            icon={AlertTriangle}
            tone={(data?.gap_count ?? 0) > 0 ? 'warning' : 'success'}
            loading={isLoading}
          />
          <ShellStat
            label="Last run"
            value={isLoading ? '—' : formatRunTime(lastRun?.finished_at ?? lastRun?.started_at)}
            hint={
              lastRun
                ? `${lastRun.status} · created ${lastRun.bookings_created} · via ${lastRun.triggered_by}`
                : 'No runs recorded yet'
            }
            icon={RefreshCw}
            tone={lastRun?.status === 'error' ? 'warning' : 'brand'}
            loading={isLoading}
          />
        </ShellStatGrid>

        {lastRun?.error_message && (
          <p className="text-sm text-destructive">{lastRun.error_message}</p>
        )}

        {gaps.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Series needing attention</h3>
            <div className="divide-y rounded-md border">
              {gaps.slice(0, 12).map((gap) => (
                <div
                  key={gap.service_id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-medium truncate">
                      {gap.customer_name || `Series #${gap.service_id}`}
                    </div>
                    <div className="text-muted-foreground">
                      {gap.frequently || '—'} · {gap.days_of_the_week || 'no day'} · until{' '}
                      {gap.was_created_until ? formatUKDate(gap.was_created_until) : 'never'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{gapReasonLabel(gap.reason)}</Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/recurring-bookings/edit/${gap.service_id}`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
