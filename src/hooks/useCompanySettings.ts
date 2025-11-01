import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CompanySetting {
  id: string;
  setting_category: string;
  setting_key: string;
  setting_value: any;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceType {
  key: string;
  label: string;
  badge_color: string;
  allowed_cleaning_types?: string[];
}

export interface CleaningType {
  key: string;
  label: string;
  description?: string;
}

export interface PaymentMethod {
  key: string;
  label: string;
}

export const useCompanySettings = (category?: string) => {
  return useQuery({
    queryKey: ['company-settings', category],
    queryFn: async () => {
      let query = supabase
        .from('company_settings')
        .select('*')
        .order('display_order');

      if (category) {
        query = query.eq('setting_category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CompanySetting[];
    },
  });
};

export const useServiceTypes = () => {
  const { data, ...rest } = useCompanySettings('service_type');
  
  const serviceTypes: ServiceType[] = data?.map(setting => ({
    key: setting.setting_key,
    label: setting.setting_value.label,
    badge_color: setting.setting_value.badge_color || 'bg-gray-500/10 text-gray-700 border-gray-200',
    allowed_cleaning_types: setting.setting_value.allowed_cleaning_types || [],
  })) || [];

  return { data: serviceTypes, ...rest };
};

export const useCleaningTypes = () => {
  const { data, ...rest } = useCompanySettings('cleaning_type');
  
  const cleaningTypes: CleaningType[] = data?.map(setting => ({
    key: setting.setting_key,
    label: setting.setting_value.label,
    description: setting.setting_value.description,
  })) || [];

  return { data: cleaningTypes, ...rest };
};

export const usePaymentMethods = () => {
  const { data, ...rest } = useCompanySettings('payment_method');
  
  const paymentMethods: PaymentMethod[] = data
    ?.filter(setting => setting.is_active)
    ?.map(setting => ({
      key: setting.setting_key,
      label: setting.setting_value.label,
    })) || [];

  return { data: paymentMethods, ...rest };
};

export const useUpdateCompanySetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CompanySetting> }) => {
      const { data, error } = await supabase
        .from('company_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success('Setting updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update setting: ${error.message}`);
    },
  });
};

export const useCreateCompanySetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSetting: Omit<CompanySetting, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('company_settings')
        .insert(newSetting)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success('Setting created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create setting: ${error.message}`);
    },
  });
};

export const useDeleteCompanySetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success('Setting deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete setting: ${error.message}`);
    },
  });
};

// Helper functions to get badge colors
export const getServiceTypeBadgeColor = (serviceType: string, serviceTypes: ServiceType[]) => {
  const type = serviceTypes.find(t => t.key === serviceType);
  return type?.badge_color || 'bg-gray-500/10 text-gray-700 border-gray-200';
};

export const getServiceTypeLabel = (serviceType: string, serviceTypes: ServiceType[]) => {
  const type = serviceTypes.find(t => t.key === serviceType);
  return type?.label || serviceType;
};

export const getCleaningTypeLabel = (cleaningType: string, cleaningTypes: CleaningType[]) => {
  const type = cleaningTypes.find(t => t.key === cleaningType);
  return type?.label || cleaningType;
};
