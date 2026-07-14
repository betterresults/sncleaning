import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface CleanerCalendarConnection {
  id: string;
  cleaner_id: number;
  provider: 'google';
  google_calendar_id: string;
  google_calendar_email: string | null;
  status: 'connected' | 'disconnected' | 'error';
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CleanerCalendarBusyBlock {
  id: string;
  cleaner_id: number;
  connection_id: string;
  google_event_id: string;
  summary: string | null;
  starts_at: string;
  ends_at: string;
  is_all_day: boolean;
  status: string;
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const cleanerCalendarConnectionQueryKey = (cleanerId: number | null) => [
  'cleaner-calendar-connection',
  cleanerId,
];

export const cleanerCalendarBusyBlocksQueryKey = (
  cleanerId: number | null,
  rangeStartIso: string | null,
  rangeEndIso: string | null
) => ['cleaner-calendar-busy-blocks', cleanerId, rangeStartIso, rangeEndIso];

export const useCleanerCalendarConnection = (cleanerId: number | null) =>
  useQuery({
    queryKey: cleanerCalendarConnectionQueryKey(cleanerId),
    enabled: !!cleanerId,
    queryFn: async (): Promise<CleanerCalendarConnection | null> => {
      const { data, error } = await supabase
        .from('cleaner_calendar_connections' as never)
        .select(
          'id, cleaner_id, provider, google_calendar_id, google_calendar_email, status, last_synced_at, last_error, created_at, updated_at'
        )
        .eq('cleaner_id', cleanerId as number)
        .eq('provider', 'google')
        .maybeSingle();

      if (error) throw error;
      return data as CleanerCalendarConnection | null;
    },
  });

export const allCleanerCalendarConnectionsQueryKey = ['cleaner-calendar-connections', 'all'];

// Admin-only: RLS grants admins full access to cleaner_calendar_connections, so this
// returns every cleaner's Google connection keyed by cleaner_id for at-a-glance health.
export const useAllCleanerCalendarConnections = (enabled = true) =>
  useQuery({
    queryKey: allCleanerCalendarConnectionsQueryKey,
    enabled,
    queryFn: async (): Promise<Map<number, CleanerCalendarConnection>> => {
      const { data, error } = await supabase
        .from('cleaner_calendar_connections' as never)
        .select(
          'id, cleaner_id, provider, google_calendar_id, google_calendar_email, status, last_synced_at, last_error, created_at, updated_at'
        )
        .eq('provider', 'google');

      if (error) throw error;

      const map = new Map<number, CleanerCalendarConnection>();
      (data as CleanerCalendarConnection[] | null)?.forEach((connection) => {
        map.set(connection.cleaner_id, connection);
      });
      return map;
    },
  });

export const useCleanerCalendarBusyBlocks = (
  cleanerId: number | null,
  rangeStartIso: string | null,
  rangeEndIso: string | null
) =>
  useQuery({
    queryKey: cleanerCalendarBusyBlocksQueryKey(cleanerId, rangeStartIso, rangeEndIso),
    enabled: !!cleanerId && !!rangeStartIso && !!rangeEndIso,
    queryFn: async (): Promise<CleanerCalendarBusyBlock[]> => {
      const { data, error } = await supabase
        .from('cleaner_calendar_busy_blocks' as never)
        .select('id, cleaner_id, connection_id, google_event_id, summary, starts_at, ends_at, is_all_day, status')
        .eq('cleaner_id', cleanerId as number)
        .lt('starts_at', rangeEndIso as string)
        .gt('ends_at', rangeStartIso as string)
        .order('starts_at', { ascending: true });

      if (error) throw error;
      return (data || []) as CleanerCalendarBusyBlock[];
    },
  });

export const useConnectGoogleCalendar = () =>
  useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-calendar-connect', {
        body: { returnTo: '/cleaner-availability' },
      });
      if (error) throw error;
      if (!data?.authUrl) throw new Error('Google Calendar connection URL was not returned');
      window.location.href = data.authUrl;
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, 'Failed to start Google Calendar connection'));
    },
  });

export const useSyncGoogleCalendar = (cleanerId: number | null, weekStartIso?: string | null, weekEndIso?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cleanerCalendarConnectionQueryKey(cleanerId) });
      queryClient.invalidateQueries({
        queryKey: cleanerCalendarBusyBlocksQueryKey(cleanerId, weekStartIso ?? null, weekEndIso ?? null),
      });
      toast.success('Google Calendar synced');
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, 'Failed to sync Google Calendar'));
    },
  });
};

/** Admin: force-resync one cleaner's Google connection (including error status). */
export const useAdminSyncCleanerGoogleCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cleanerId: number) => {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { cleanerId },
      });
      if (error) throw error;
      if (data?.skipped) throw new Error(data.skipped);
      return data;
    },
    onSuccess: (_data, cleanerId) => {
      queryClient.invalidateQueries({ queryKey: allCleanerCalendarConnectionsQueryKey });
      queryClient.invalidateQueries({ queryKey: cleanerCalendarConnectionQueryKey(cleanerId) });
      toast.success('Google Calendar re-synced');
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, 'Failed to re-sync Google Calendar'));
    },
  });
};

/** Admin: sync every connected/error Google calendar connection. */
export const useAdminSyncAllGoogleCalendars = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { syncAll: true },
      });
      if (error) throw error;
      return data as { results?: Array<{ connectionId: string; error?: string; synced?: number }> };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: allCleanerCalendarConnectionsQueryKey });
      const results = data?.results ?? [];
      const failed = results.filter((r) => r.error).length;
      const ok = results.length - failed;
      if (failed > 0) {
        toast.error(`Synced ${ok} calendar${ok === 1 ? '' : 's'}; ${failed} failed`);
      } else {
        toast.success(`Synced ${ok} Google calendar${ok === 1 ? '' : 's'}`);
      }
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, 'Failed to sync Google calendars'));
    },
  });
};

export const useDisconnectGoogleCalendar = (cleanerId: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-calendar-disconnect', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cleanerCalendarConnectionQueryKey(cleanerId) });
      queryClient.invalidateQueries({ queryKey: ['cleaner-calendar-busy-blocks', cleanerId] });
      toast.success('Google Calendar disconnected');
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, 'Failed to disconnect Google Calendar'));
    },
  });
};
