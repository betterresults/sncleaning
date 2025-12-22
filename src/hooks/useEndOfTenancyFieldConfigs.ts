import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface EndOfTenancyFieldConfig {
  id: string;
  category: string;
  option: string;
  label: string | null;
  value: number;
  value_type: string;
  time: number | null;
  icon: string | null;
  min_value: number | null;
  max_value: number | null;
  display_order: number | null;
  category_order: number | null;
  is_visible: boolean | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export const useEndOfTenancyFieldConfigs = (category?: string, onlyVisible = false) => {
  return useQuery({
    queryKey: ['end-of-tenancy-field-configs', category, onlyVisible],
    queryFn: async () => {
      let query = supabase
        .from('end_of_tenancy_field_configs')
        .select('*')
        .eq('is_active', true)
        .order('category_order', { ascending: true })
        .order('display_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      if (onlyVisible) {
        query = query.eq('is_visible', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EndOfTenancyFieldConfig[];
    },
  });
};

export const useAllEndOfTenancyCategories = () => {
  return useQuery({
    queryKey: ['end-of-tenancy-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('end_of_tenancy_field_configs')
        .select('category, category_order')
        .eq('is_active', true)
        .order('category_order', { ascending: true });

      if (error) throw error;

      // Get unique categories while preserving order
      const seen = new Set<string>();
      const uniqueCategories: string[] = [];
      data?.forEach((item) => {
        if (!seen.has(item.category)) {
          seen.add(item.category);
          uniqueCategories.push(item.category);
        }
      });

      return uniqueCategories;
    },
  });
};

export const useCreateEndOfTenancyFieldConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Omit<EndOfTenancyFieldConfig, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('end_of_tenancy_field_configs')
        .insert(config)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['end-of-tenancy-field-configs'] });
      queryClient.invalidateQueries({ queryKey: ['end-of-tenancy-categories'] });
      toast({
        title: 'Success',
        description: 'Field configuration created successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating field config:', error);
      toast({
        title: 'Error',
        description: 'Failed to create field configuration',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateEndOfTenancyFieldConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EndOfTenancyFieldConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from('end_of_tenancy_field_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['end-of-tenancy-field-configs'] });
      queryClient.invalidateQueries({ queryKey: ['end-of-tenancy-categories'] });
      toast({
        title: 'Success',
        description: 'Field configuration updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating field config:', error);
      toast({
        title: 'Error',
        description: 'Failed to update field configuration',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteEndOfTenancyFieldConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('end_of_tenancy_field_configs')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['end-of-tenancy-field-configs'] });
      queryClient.invalidateQueries({ queryKey: ['end-of-tenancy-categories'] });
      toast({
        title: 'Success',
        description: 'Field configuration deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting field config:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete field configuration',
        variant: 'destructive',
      });
    },
  });
};
