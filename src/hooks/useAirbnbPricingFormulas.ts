import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FormulaElement {
  type: 'field' | 'operator' | 'number';
  value: string;
  label?: string;
  attribute?: string;
}

export interface PricingFormula {
  id: string;
  name: string;
  description: string | null;
  elements: FormulaElement[];
  result_type: string;
  is_active: boolean | null;
}

export const useAirbnbPricingFormulas = () => {
  return useQuery({
    queryKey: ['airbnb-pricing-formulas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('airbnb_pricing_formulas')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data.map(item => ({
        ...item,
        elements: item.elements as unknown as FormulaElement[],
      })) as PricingFormula[];
    },
  });
};

export const useCreatePricingFormula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formula: Omit<PricingFormula, 'id' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('airbnb_pricing_formulas')
        .insert([{
          name: formula.name,
          description: formula.description,
          elements: formula.elements as any,
          result_type: formula.result_type,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airbnb-pricing-formulas'] });
      toast.success('Formula added successfully');
    },
    onError: (error: any) => {
      toast.error('Error adding formula: ' + error.message);
    },
  });
};

export const useUpdatePricingFormula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PricingFormula> }) => {
      const updateData: any = { ...updates };
      if (updates.elements) {
        updateData.elements = updates.elements as any;
      }
      
      const { data, error } = await supabase
        .from('airbnb_pricing_formulas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airbnb-pricing-formulas'] });
      toast.success('Formula updated successfully');
    },
    onError: (error: any) => {
      toast.error('Error updating formula: ' + error.message);
    },
  });
};

export const useDeletePricingFormula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('airbnb_pricing_formulas')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airbnb-pricing-formulas'] });
      toast.success('Formula deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Error deleting formula: ' + error.message);
    },
  });
};
