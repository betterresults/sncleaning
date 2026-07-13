import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CleanerWorkingHour {
  id: string;
  cleaner_id: number;
  day_of_week: number; // 0=Sunday .. 6=Saturday
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const WEEKDAY_VALUES = [1, 2, 3, 4, 5];
const ALL_DAY_VALUES = DAYS_OF_WEEK.map((d) => d.value);

export const workingHoursQueryKey = (cleanerId: number | null) => ['cleaner-working-hours', cleanerId];

// Fetch every block for a cleaner (a day can have zero, one, or several rows)
export const useCleanerWorkingHours = (cleanerId: number | null) => {
  return useQuery({
    queryKey: workingHoursQueryKey(cleanerId),
    enabled: !!cleanerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cleaner_working_hours')
        .select('*')
        .eq('cleaner_id', cleanerId as number)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as CleanerWorkingHour[];
    },
  });
};

export interface WeeklyBlockInput {
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

// Replaces the cleaner's entire weekly template in one go: used by the "Save changes"
// action on the grid, since edits there are batched locally until the cleaner saves.
export const useSaveWeeklyAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cleanerId, blocks }: { cleanerId: number; blocks: WeeklyBlockInput[] }) => {
      // Upsert by day so a failed write cannot wipe the whole week first.
      const { data: existing, error: fetchError } = await supabase
        .from('cleaner_working_hours')
        .select('id, day_of_week')
        .eq('cleaner_id', cleanerId);
      if (fetchError) throw fetchError;

      const byDay = new Map((existing || []).map((row) => [row.day_of_week, row.id]));
      const desiredDays = new Set(blocks.map((b) => b.dayOfWeek));

      for (const block of blocks) {
        const existingId = byDay.get(block.dayOfWeek);
        if (existingId) {
          const { error: updateError } = await supabase
            .from('cleaner_working_hours')
            .update({
              start_time: block.startTime,
              end_time: block.endTime,
              is_active: true,
            })
            .eq('id', existingId);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase.from('cleaner_working_hours').insert({
            cleaner_id: cleanerId,
            day_of_week: block.dayOfWeek,
            start_time: block.startTime,
            end_time: block.endTime,
            is_active: true,
          });
          if (insertError) throw insertError;
        }
      }

      const toDelete = (existing || [])
        .filter((row) => !desiredDays.has(row.day_of_week))
        .map((row) => row.id);
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('cleaner_working_hours')
          .delete()
          .in('id', toDelete);
        if (deleteError) throw deleteError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workingHoursQueryKey(variables.cleanerId) });
      toast.success('Availability saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save availability');
    },
  });
};

export const AVAILABILITY_PRESETS = [
  { id: 'weekdays-9-5', label: 'Weekdays 9–5', days: WEEKDAY_VALUES, startHour: 9, endHour: 17 },
  { id: 'evenings-only', label: 'Evenings only', days: ALL_DAY_VALUES, startHour: 17, endHour: 21 },
] as const;
