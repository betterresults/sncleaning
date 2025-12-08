import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FieldConfig {
  id: string;
  category: string;
  option: string;
  value: number;
  value_type: string;
  time: number | null;
  is_active: boolean | null;
  icon: string | null;
  icon_color: string | null;
  icon_size: number | null;
  icon_storage_path: string | null;
  label: string | null;
  min_value: number | null;
  max_value: number | null;
  is_visible: boolean | null;
  display_order: number | null;
  category_order: number | null;
}

export const useAirbnbFieldConfigs = (category?: string, onlyVisible = false) => {
  return useQuery({
    queryKey: ['airbnb-field-configs', category, onlyVisible],
    queryFn: async () => {
      let query = supabase
        .from('airbnb_field_configs')
        .select('*')
        .eq('is_active', true);
      
      if (category) {
        query = query.eq('category', category);
      }
      
      if (onlyVisible) {
        query = query.eq('is_visible', true);
      }
      
      query = query.order('display_order', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return data as FieldConfig[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useAllAirbnbCategories = () => {
  return useQuery({
    queryKey: ['airbnb-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('airbnb_field_configs')
        .select('category, category_order')
        .eq('is_active', true)
        .order('category_order', { ascending: true });

      if (error) throw error;
      
      // Get unique categories while preserving order
      const seen = new Set();
      const orderedCategories: { category: string; order: number }[] = [];
      
      data.forEach(d => {
        if (!seen.has(d.category)) {
          seen.add(d.category);
          orderedCategories.push({ 
            category: d.category, 
            order: d.category_order || 999 
          });
        }
      });
      
      return orderedCategories
        .sort((a, b) => a.order - b.order)
        .map(c => c.category);
    },
  });
};

export const useCreateFieldConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Omit<FieldConfig, 'id' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('airbnb_field_configs')
        .insert([{
          category: config.category,
          option: config.option,
          value: config.value,
          value_type: config.value_type,
          time: config.time,
          icon: config.icon,
          icon_color: config.icon_color ?? '#000000',
          icon_size: config.icon_size ?? 24,
          icon_storage_path: config.icon_storage_path ?? null,
          label: config.label,
          min_value: (config as any).min_value ?? null,
          max_value: config.max_value,
          is_visible: config.is_visible ?? true,
          display_order: config.display_order ?? 0,
          category_order: (config as any).category_order ?? 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airbnb-field-configs'] });
      queryClient.invalidateQueries({ queryKey: ['airbnb-categories'] });
      toast.success('Successfully added new field');
    },
    onError: (error: any) => {
      toast.error('Error adding field: ' + error.message);
    },
  });
};

export const useUpdateFieldConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FieldConfig> }) => {
      const { data, error } = await supabase
        .from('airbnb_field_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airbnb-field-configs'] });
      queryClient.invalidateQueries({ queryKey: ['airbnb-categories'] });
      toast.success('Successfully updated field');
    },
    onError: (error: any) => {
      toast.error('Error updating field: ' + error.message);
    },
  });
};

export const useDeleteFieldConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('airbnb_field_configs')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airbnb-field-configs'] });
      queryClient.invalidateQueries({ queryKey: ['airbnb-categories'] });
      toast.success('Successfully deleted field');
    },
    onError: (error: any) => {
      toast.error('Error deleting field: ' + error.message);
    },
  });
};

export const useAirbnbFieldConfigsBatch = (categories: string[], onlyVisible = false) => {
  return useQuery({
    queryKey: ['airbnb-field-configs-batch', categories, onlyVisible],
    queryFn: async () => {
      let query = supabase
        .from('airbnb_field_configs')
        .select('*')
        .eq('is_active', true)
        .in('category', categories);
      
      if (onlyVisible) {
        query = query.eq('is_visible', true);
      }
      
      query = query.order('display_order', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      
      // Group by category
      const grouped: Record<string, FieldConfig[]> = {};
      (data as FieldConfig[]).forEach(config => {
        if (!grouped[config.category]) {
          grouped[config.category] = [];
        }
        grouped[config.category].push(config);
      });
      
      return grouped;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - configs rarely change
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
