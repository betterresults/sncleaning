import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SchedulingRule {
  id: string;
  rule_type: 'day_pricing' | 'time_slot' | 'cutoff_time' | 'overtime_window' | 'time_surcharge';
  day_of_week?: number; // 0=Sunday, 6=Saturday
  start_time?: string;
  end_time?: string;
  price_modifier: number;
  modifier_type: 'fixed' | 'percentage';
  is_active: boolean;
  display_order: number;
  label?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Fetch all scheduling rules or filter by type
export const useSchedulingRules = (ruleType?: string, onlyActive = true) => {
  return useQuery({
    queryKey: ['scheduling-rules', ruleType, onlyActive],
    queryFn: async () => {
      let query = supabase
        .from('scheduling_rules')
        .select('*')
        .order('display_order', { ascending: true });

      if (ruleType) {
        query = query.eq('rule_type', ruleType);
      }

      if (onlyActive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SchedulingRule[];
    },
  });
};

// Create new scheduling rule
export const useCreateSchedulingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Omit<SchedulingRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('scheduling_rules')
        .insert([rule])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-rules'] });
      toast.success('Scheduling rule created successfully');
    },
    onError: (error) => {
      console.error('Error creating scheduling rule:', error);
      toast.error('Failed to create scheduling rule');
    },
  });
};

// Update scheduling rule
export const useUpdateSchedulingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SchedulingRule> }) => {
      const { data, error } = await supabase
        .from('scheduling_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-rules'] });
      toast.success('Scheduling rule updated successfully');
    },
    onError: (error) => {
      console.error('Error updating scheduling rule:', error);
      toast.error('Failed to update scheduling rule');
    },
  });
};

// Delete scheduling rule (soft delete)
export const useDeleteSchedulingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduling_rules')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-rules'] });
      toast.success('Scheduling rule deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting scheduling rule:', error);
      toast.error('Failed to delete scheduling rule');
    },
  });
};

// Helper to get time slots for booking form
export const useBookingTimeSlots = () => {
  const { data: timeSlots } = useSchedulingRules('time_slot', true);
  return timeSlots || [];
};

// Helper to get cutoff time
export const useCutoffTime = () => {
  const { data: rules } = useSchedulingRules('cutoff_time', true);
  return rules && rules.length > 0 ? rules[0] : null;
};

// Helper to get overtime window
export const useOvertimeWindow = () => {
  const { data: rules } = useSchedulingRules('overtime_window', true);
  return rules && rules.length > 0 ? rules[0] : null;
};

// Helper to get day pricing rules
export const useDayPricing = () => {
  const { data: rules } = useSchedulingRules('day_pricing', true);
  return rules || [];
};

// Helper to get time surcharges
export const useTimeSurcharges = () => {
  const { data: rules } = useSchedulingRules('time_surcharge', true);
  return rules || [];
};
