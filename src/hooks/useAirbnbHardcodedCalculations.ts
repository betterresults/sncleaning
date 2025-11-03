import { useMemo } from 'react';
import { useAirbnbFieldConfigs } from './useAirbnbFieldConfigs';

interface BookingData {
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  additionalRooms: Record<string, number>;
  propertyFeatures?: Record<string, boolean>;
  numberOfFloors?: number;
  serviceType: string;
  alreadyCleaned: boolean | null;
  needsOvenCleaning: boolean | null;
  ovenType: string;
  cleaningProducts: string | { needed: boolean; equipment: boolean } | null;
  equipmentArrangement: string | null;
  linensHandling: string;
  needsIroning: boolean | null;
  ironingHours?: number;
  bedSizes?: Record<string, number>;
  selectedDate?: Date | null;
  selectedTime?: string;
  flexibility?: string;
  sameDayTurnaround?: boolean;
  estimatedHours?: number | null;
}

export const useAirbnbHardcodedCalculations = (bookingData: BookingData) => {
  const { data: allConfigs = [] } = useAirbnbFieldConfigs();

  const calculations = useMemo(() => {
    // Helper to get time value from configs
    const getConfigTime = (category: string, option: string): number => {
      const normalizedCategory = String(category || '').toLowerCase();
      const normalizedOption = String(option ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const digitsInOption = normalizedOption.replace(/[^0-9]/g, '');

      const candidates = allConfigs.filter((cfg: any) => String(cfg.category || '').toLowerCase() === normalizedCategory);

      // 1) Exact normalized match
      let config = candidates.find((cfg: any) => String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedOption);
      if (config) return config?.time || 0;

      // 2) Numeric-aware match (e.g., "3" matches "3 bedrooms")
      if (digitsInOption) {
        config = candidates.find((cfg: any) => {
          const opt = String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const digits = opt.replace(/[^0-9]/g, '');
          return digits === digitsInOption || opt.startsWith(digitsInOption) || opt.endsWith(digitsInOption);
        });
        if (config) return config?.time || 0;
      }

      // 3) Substring fallback
      config = candidates.find((cfg: any) => String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedOption));
      return config?.time || 0;
    };

    // Helper to get value from configs
    const getConfigValue = (category: string, option: string): number => {
      const normalizedCategory = String(category || '').toLowerCase();
      const normalizedOption = String(option ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const digitsInOption = normalizedOption.replace(/[^0-9]/g, '');

      const candidates = allConfigs.filter((cfg: any) => String(cfg.category || '').toLowerCase() === normalizedCategory);

      // 1) Exact normalized match
      let config = candidates.find((cfg: any) => String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedOption);
      if (config) return config?.value || 0;

      // 2) Numeric-aware match (e.g., "3" matches "3 bedrooms")
      if (digitsInOption) {
        config = candidates.find((cfg: any) => {
          const opt = String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const digits = opt.replace(/[^0-9]/g, '');
          return digits === digitsInOption || opt.startsWith(digitsInOption) || opt.endsWith(digitsInOption);
        });
        if (config) return config?.value || 0;
      }

      // 3) Substring fallback
      config = candidates.find((cfg: any) => String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedOption));
      return config?.value || 0;
    };

    // Get all required field times and values - only if fields are not empty
    const propertyTypeTime = bookingData.propertyType ? getConfigTime('property type', bookingData.propertyType) : 0;
    const bedroomsTime = bookingData.bedrooms ? getConfigTime('bedrooms', bookingData.bedrooms) : 0;
    const bathroomsTime = bookingData.bathrooms ? getConfigTime('bathrooms', bookingData.bathrooms) : 0;
    const serviceTypeTime = bookingData.serviceType ? getConfigTime('service type', bookingData.serviceType) : 1;
    const serviceTypeValue = bookingData.serviceType ? getConfigValue('service type', bookingData.serviceType) : 0;
    
    // Already cleaned value - only for check-in/check-out
    let alreadyCleanedValue = 1; // Default
    if (bookingData.serviceType === 'checkin-checkout' && bookingData.alreadyCleaned === false) {
      alreadyCleanedValue = 1.5; // Not cleaned to standard = 1.5x multiplier
    }

    // Oven cleaning time
    const ovenCleaningTime = bookingData.needsOvenCleaning 
      ? getConfigTime('oven type', bookingData.ovenType || 'standard')
      : 0;

    // Additional rooms time
    const keyToOption: Record<string, string> = {
      toilets: 'Extra Toilet',
      studyrooms: 'Study Room',
      studyRooms: 'Study Room',
      utilityrooms: 'Utility Room',
      utilityRooms: 'Utility Room',
      otherrooms: 'Other Room',
      otherRooms: 'Other Room',
    };
    
    let additionalRoomsTime = 0;
    if (bookingData.additionalRooms) {
      for (const [key, count] of Object.entries(bookingData.additionalRooms)) {
        const qty = Number(count) || 0;
        if (!qty) continue;
        const optionLabel = keyToOption[key] || key;
        const roomTime = getConfigTime('additional rooms', optionLabel);
        additionalRoomsTime += roomTime * qty;
      }
    }

    // Property features time
    let propertyFeaturesTime = 0;
    if (bookingData.propertyFeatures) {
      for (const [feature, isSelected] of Object.entries(bookingData.propertyFeatures)) {
        if (!isSelected) continue;
        const featureTime = getConfigTime('property features', feature);
        propertyFeaturesTime += featureTime;
      }
    }

    // BASE TIME CALCULATION
    // Minutes sum from all relevant fields (in minutes)
    const minutesSum = propertyTypeTime + bedroomsTime + bathroomsTime + additionalRoomsTime + propertyFeaturesTime + ovenCleaningTime;

    // Calculate total minutes with multipliers
    // Formula: (sum of all times) * service type value * already cleaned value
    const totalMinutes = minutesSum * serviceTypeValue * alreadyCleanedValue;
    
    // Convert to hours with custom rounding logic:
    // 0-14 minutes → round down to whole hour
    // 15-44 minutes → add 0.5 hour
    // 45+ minutes → round up to next whole hour
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    let baseTime: number;
    if (remainingMinutes < 15) {
      baseTime = hours;
    } else if (remainingMinutes <= 44) {
      baseTime = hours + 0.5;
    } else {
      baseTime = hours + 1;
    }

    // DRY TIME CALCULATION
    // Formula: Math.ceil((bedSizes.value) / 30) / 2
    let bedSizesValue = 0;
    if (bookingData.bedSizes) {
      for (const [size, count] of Object.entries(bookingData.bedSizes)) {
        const qty = Number(count) || 0;
        if (!qty) continue;
        const sizeValue = getConfigValue('bed sizes', size);
        bedSizesValue += sizeValue * qty;
      }
    }
    const shouldCalculateDryTime = bookingData.linensHandling === 'wash-hang' || bookingData.linensHandling === 'wash-dry';
    const dryTime = shouldCalculateDryTime
      ? Math.ceil(bedSizesValue / 30) / 2
      : 0;

    // IRON TIME CALCULATION
    // Formula: Math.ceil((bedSizes.time) / 30) / 2
    let bedSizesTime = 0;
    if (bookingData.bedSizes && bookingData.needsIroning) {
      for (const [size, count] of Object.entries(bookingData.bedSizes)) {
        const qty = Number(count) || 0;
        if (!qty) continue;
        const sizeTime = getConfigTime('bed sizes', size);
        bedSizesTime += sizeTime * qty;
      }
    }
    const shouldCalculateIronTime = bookingData.needsIroning && (bookingData.linensHandling === 'wash-hang' || bookingData.linensHandling === 'wash-dry');
    const ironTime = shouldCalculateIronTime
      ? Math.ceil(bedSizesTime / 30) / 2
      : 0;

    // ADDITIONAL TIME CALCULATION
    // Only applies to wash-hang and wash-dry options
    // Formula: If ironTime > waitingTime, then additionalTime = ironTime - waitingTime
    let additionalTime = 0;
    const shouldCalculateAdditionalTime = bookingData.linensHandling === 'wash-hang' || bookingData.linensHandling === 'wash-dry';
    
    if (shouldCalculateAdditionalTime) {
      // Waiting time = how much longer drying takes compared to base cleaning
      const waitingTime = Math.max(0, dryTime - baseTime);
      
      // If ironing takes longer than waiting time, add the extra ironing time
      if (ironTime > waitingTime) {
        additionalTime = ironTime - waitingTime;
      }
    }

    // TOTAL HOURS
    // User override takes priority only if it differs from calculated hours
    const calculatedTotalHours = baseTime + additionalTime;
    const isUserOverride = bookingData.estimatedHours !== null 
      && bookingData.estimatedHours !== undefined 
      && Math.abs((bookingData.estimatedHours as number) - calculatedTotalHours) > 0.001;
    const totalHours = isUserOverride ? (bookingData.estimatedHours as number) : calculatedTotalHours;

    // HOURLY RATE CALCULATION
    // Formula: sameday.value + serviceType.value + cleaningProducts.value + (equipmentArrangement.value < 10 ? equipmentArrangement.value : 0)
    const sameDayValue = bookingData.sameDayTurnaround 
      ? getConfigValue('time flexibility', 'same-day-turnaround')
      : 0;
    
    // Check if cleaning products are needed - handle both string and object format
    let cleaningProductsValue = 0;
    if (bookingData.cleaningProducts && bookingData.cleaningProducts !== '') {
      if (typeof bookingData.cleaningProducts === 'string') {
        cleaningProductsValue = getConfigValue('cleaning products', bookingData.cleaningProducts);
      } else if (typeof bookingData.cleaningProducts === 'object' && 'needed' in bookingData.cleaningProducts) {
        cleaningProductsValue = (bookingData.cleaningProducts as any).needed 
          ? getConfigValue('cleaning products', 'bring-products')
          : 0;
      }
    }

    // Check if equipment is needed - handle both direct arrangement and nested object
    let equipmentValue = 0;
    if (bookingData.equipmentArrangement) {
      equipmentValue = getConfigValue('equipment arrangement', bookingData.equipmentArrangement);
    } else if (bookingData.cleaningProducts) {
      // If equipment is in nested object, check the arrangement
      const cleaningProducts = bookingData.cleaningProducts;
      if (typeof cleaningProducts === 'object' && 'equipment' in cleaningProducts) {
        if ((cleaningProducts as any).equipment && bookingData.equipmentArrangement) {
          equipmentValue = getConfigValue('equipment arrangement', bookingData.equipmentArrangement);
        }
      }
    }

    const hourlyRate = sameDayValue + serviceTypeValue + cleaningProductsValue + (equipmentValue < 10 ? equipmentValue : 0);

    // CLEANING COST
    const cleaningCost = totalHours * hourlyRate;

    // SHORT NOTICE CHARGE
    const calculateShortNoticeCharge = (): number => {
      if (!bookingData.selectedDate || !bookingData.selectedTime) {
        return 0;
      }

      const now = new Date();
      const bookingDateTime = new Date(bookingData.selectedDate);
      const [hours, minutes] = bookingData.selectedTime.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);

      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Get time flexibility charge
      let shortNoticeCharge = 0;
      
      if (hoursUntilBooking <= 12) {
        shortNoticeCharge = getConfigValue('time flexibility', 'within-12-hours');
      } else if (hoursUntilBooking <= 24) {
        shortNoticeCharge = getConfigValue('time flexibility', 'within-24-hours');
      } else if (hoursUntilBooking <= 48) {
        shortNoticeCharge = getConfigValue('time flexibility', 'within-48-hours');
      }

      return shortNoticeCharge;
    };

    const shortNoticeCharge = calculateShortNoticeCharge();

    // TOTAL COST
    const totalCost = cleaningCost + shortNoticeCharge;

    return {
      baseTime,
      dryTime,
      ironTime,
      additionalTime,
      totalHours,
      calculatedTotalHours,
      hourlyRate,
      cleaningCost,
      shortNoticeCharge,
      totalCost,
      isUserOverride,
      debug: {
        dryTime,
        ironTime,
        baseTime,
        additionalTime,
        calculatedTotalHours,
        userEstimatedHours: bookingData.estimatedHours,
        minutesSum,
        propertyTypeTime,
        bedroomsTime,
        bathroomsTime,
        serviceTypeTime,
        serviceTypeValue,
        alreadyCleanedValue,
        ovenCleaningTime,
        additionalRoomsTime,
        propertyFeaturesTime,
        bedSizesValue,
        bedSizesTime,
        hourlyRateBreakdown: {
          sameDayValue,
          serviceTypeValue,
          cleaningProductsValue,
          equipmentValue,
          hourlyRate,
        }
      }
    };
  }, [JSON.stringify(bookingData), allConfigs]);

  return calculations;
};
