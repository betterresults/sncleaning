import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CategoryDefault {
  id: string;
  category: string;
  default_value: string | null;
  created_at: string;
  updated_at: string;
}

export const useAirbnbCategoryDefaults = () => {
  return useQuery({
    queryKey: ['airbnb-category-defaults'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('airbnb_category_defaults')
        .select('*')
        .order('category');
      
      if (error) throw error;
      return data as CategoryDefault[];
    }
  });
};

export const useUpsertCategoryDefault = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ category, default_value }: { category: string; default_value: string | null }) => {
      const { data, error } = await supabase
        .from('airbnb_category_defaults')
        .upsert({ category, default_value }, { onConflict: 'category' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airbnb-category-defaults'] });
      toast.success('Category default updated');
    },
    onError: (error: Error) => {
      console.error('Error updating category default:', error);
      toast.error('Failed to update category default');
    }
  });
};