import { useMemo } from 'react';
import { useEndOfTenancyCalculations } from '@/hooks/useEndOfTenancyCalculations';
import { useAirbnbFieldConfigs } from '@/hooks/useAirbnbFieldConfigs';
import {
  applyDeepCleaningPricing,
  DEEP_CLEANING_MIN_HOURS,
  type DeepCleaningPricingMode,
  type DeepCleaningPricingResult,
} from '@/lib/deepCleaningPricing';
import type { EndOfTenancyBookingData } from '@/features/booking/EndOfTenancyBookingForm';

const getConfigValue = (
  configs: Array<{ category?: string | null; option?: string | null; value?: number | null }> | undefined,
  category: string,
  option: string
): number => {
  if (!configs?.length) return 0;
  const normalizedCategory = category.toLowerCase();
  const normalizedOption = option.toLowerCase().replace(/[^a-z0-9]/g, '');
  const match = configs.find((cfg) => {
    const cfgCategory = String(cfg.category || '').toLowerCase();
    const cfgOption = String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return cfgCategory === normalizedCategory && cfgOption === normalizedOption;
  });
  return match?.value || 0;
};

export const useDeepCleaningCalculations = (
  data: EndOfTenancyBookingData
): DeepCleaningPricingResult & { isLoading: boolean; eotBaseCost: number; eotFurniturePercentage: number; eotConditionPercentage: number } => {
  const eot = useEndOfTenancyCalculations(
    { ...data, furnitureStatus: 'furnished' },
    false
  );
  const { data: fieldConfigs = [], isLoading: configsLoading } = useAirbnbFieldConfigs();

  return useMemo(() => {
    const pricingMode: DeepCleaningPricingMode = data.pricingMode === 'hourly' ? 'hourly' : 'property';
    const hourlyRate = getConfigValue(fieldConfigs, 'domestic service frequency', 'onetime') || 25;
    const equipmentOneOffCost = getConfigValue(fieldConfigs, 'equipment arrangement', 'oneoff') || 29;
    const pricing = applyDeepCleaningPricing({
      eot,
      pricingMode,
      hourlyHours: data.hourlyHours ?? DEEP_CLEANING_MIN_HOURS,
      hourlyRate,
      wantsEquipment: Boolean(data.wantsEquipment),
      equipmentOneOffCost,
    });

    return {
      ...pricing,
      isLoading: eot.isLoading || configsLoading,
      eotBaseCost: eot.baseCost,
      eotFurniturePercentage: eot.furniturePercentage,
      eotConditionPercentage: eot.conditionPercentage,
    };
  }, [
    configsLoading,
    data.hourlyHours,
    data.pricingMode,
    data.wantsEquipment,
    eot,
    fieldConfigs,
  ]);
};
