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
}

export const useAirbnbFieldConfigs = () => {
  return useQuery({
    queryKey: ['airbnb-field-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('airbnb_field_configs')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('option', { ascending: true });

      if (error) throw error;
      return data as FieldConfig[];
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
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airbnb-field-configs'] });
      toast.success('Успешно добавихте ново поле');
    },
    onError: (error: any) => {
      toast.error('Грешка при добавяне: ' + error.message);
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
      toast.success('Успешно обновихте полето');
    },
    onError: (error: any) => {
      toast.error('Грешка при обновяване: ' + error.message);
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
      toast.success('Успешно изтрихте полето');
    },
    onError: (error: any) => {
      toast.error('Грешка при изтриване: ' + error.message);
    },
  });
};
