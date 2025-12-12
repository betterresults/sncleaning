import { useMemo } from 'react';
import { useAirbnbFieldConfigs } from './useAirbnbFieldConfigs';
import { useSchedulingRules } from './useSchedulingRules';

interface DomesticBookingData {
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  additionalRooms: Record<string, number>;
  propertyFeatures?: Record<string, boolean>;
  numberOfFloors?: number;
  serviceFrequency: string;
  hasOvenCleaning?: boolean;
  ovenType: string;
  cleaningProducts: string[];
  equipmentArrangement: string | null;
  selectedDate?: Date | null;
  selectedTime?: string;
  flexibility?: string;
  estimatedHours?: number | null;
  shortNoticeCharge?: number;
}

export const useDomesticHardcodedCalculations = (bookingData: DomesticBookingData) => {
  const { data: allConfigs = [] } = useAirbnbFieldConfigs();
  const { data: dayPricingRules = [] } = useSchedulingRules('day_pricing', true);
  const { data: timeSurchargeRules = [] } = useSchedulingRules('time_surcharge', true);

  const calculations = useMemo(() => {
    // Helper to get time value from configs
    const getConfigTime = (category: string, option: string): number => {
      const normalizedCategory = String(category || '').toLowerCase();
      const normalizedOption = String(option ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const digitsInOption = normalizedOption.replace(/[^0-9]/g, '');

      const candidates = allConfigs.filter((cfg: any) => String(cfg.category || '').toLowerCase() === normalizedCategory);

      let config = candidates.find((cfg: any) => String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedOption);
      if (config) return config?.time || 0;

      if (digitsInOption) {
        config = candidates.find((cfg: any) => {
          const opt = String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const digits = opt.replace(/[^0-9]/g, '');
          return digits === digitsInOption || opt.startsWith(digitsInOption) || opt.endsWith(digitsInOption);
        });
        if (config) return config?.time || 0;
      }

      config = candidates.find((cfg: any) => String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedOption));
      return config?.time || 0;
    };

    const getConfigValue = (category: string, option: string): number => {
      const normalizedCategory = String(category || '').toLowerCase();
      const normalizedOption = String(option ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const digitsInOption = normalizedOption.replace(/[^0-9]/g, '');

      const candidates = allConfigs.filter((cfg: any) => String(cfg.category || '').toLowerCase() === normalizedCategory);

      let config = candidates.find((cfg: any) => String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedOption);
      if (config) return config?.value || 0;

      if (digitsInOption) {
        config = candidates.find((cfg: any) => {
          const opt = String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const digits = opt.replace(/[^0-9]/g, '');
          return digits === digitsInOption || opt.startsWith(digitsInOption) || opt.endsWith(digitsInOption);
        });
        if (config) return config?.value || 0;
      }

      config = candidates.find((cfg: any) => String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedOption));
      return config?.value || 0;
    };

    // Get all required field times
    const propertyTypeTime = bookingData.propertyType ? getConfigTime('property type', bookingData.propertyType) : 0;
    const bedroomsTime = bookingData.bedrooms ? getConfigTime('bedrooms', bookingData.bedrooms) : 0;
    const bathroomsTime = bookingData.bathrooms ? getConfigTime('bathrooms', bookingData.bathrooms) : 0;
    
    // Service frequency time multiplier
    const serviceFrequencyTime = bookingData.serviceFrequency ? getConfigTime('domestic service frequency', bookingData.serviceFrequency) : 1;
    const serviceFrequencyValue = bookingData.serviceFrequency ? getConfigValue('domestic service frequency', bookingData.serviceFrequency) : 22;

    // Oven cleaning
    const ovenCleaningTime = (bookingData.hasOvenCleaning && bookingData.ovenType && bookingData.ovenType !== 'dontneed' && bookingData.ovenType !== '')
      ? getConfigTime('oven cleaning', bookingData.ovenType)
      : 0;
    const ovenCleaningCost = (bookingData.hasOvenCleaning && bookingData.ovenType && bookingData.ovenType !== 'dontneed' && bookingData.ovenType !== '')
      ? getConfigValue('oven cleaning', bookingData.ovenType)
      : 0;

    // Additional rooms time
    let additionalRoomsTime = 0;
    if (bookingData.additionalRooms) {
      for (const [key, count] of Object.entries(bookingData.additionalRooms)) {
        const qty = Number(count) || 0;
        if (!qty) continue;
        const unitTime = getConfigTime('additional rooms', key);
        additionalRoomsTime += unitTime * qty;
      }
    }

    // Property features time
    let propertyFeaturesTime = 0;
    const pf = bookingData.propertyFeatures || {};
    if (pf.separateKitchen || pf.livingRoom) {
      propertyFeaturesTime += getConfigTime('property features', 'separateKitchenLivingRoom');
    }
    for (const [feature, isSelected] of Object.entries(pf)) {
      if (!isSelected) continue;
      if (feature === 'separateKitchen' || feature === 'livingRoom') continue;
      propertyFeaturesTime += getConfigTime('property features', feature);
    }
    const floors = Number(bookingData.numberOfFloors) || 0;
    if (floors > 0) {
      const perFloor = getConfigTime('property features', 'numberOfFloors');
      propertyFeaturesTime += perFloor * floors;
    }

    // BASE TIME CALCULATION
    const minutesSum = propertyTypeTime + bedroomsTime + bathroomsTime + additionalRoomsTime + propertyFeaturesTime + ovenCleaningTime;
    const totalMinutes = minutesSum * serviceFrequencyTime;

    // Convert to hours with rounding
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

    // Ensure minimum time
    if (baseTime < 2 && bookingData.propertyType && bookingData.bedrooms) {
      baseTime = 2;
    }

    // User override
    const isUserOverride = bookingData.estimatedHours !== null 
      && bookingData.estimatedHours !== undefined 
      && Math.abs((bookingData.estimatedHours as number) - baseTime) > 0.001;
    const totalHours = isUserOverride ? (bookingData.estimatedHours as number) : baseTime;

    // HOURLY RATE CALCULATION
    let cleaningProductsValue = 0;
    if (bookingData.cleaningProducts && Array.isArray(bookingData.cleaningProducts) && bookingData.cleaningProducts.length > 0) {
      if (bookingData.cleaningProducts.includes('products')) {
        cleaningProductsValue = getConfigValue('cleaning supplies', 'products');
      }
    }

    let equipmentValue = 0;
    if (bookingData.cleaningProducts && Array.isArray(bookingData.cleaningProducts) && bookingData.cleaningProducts.includes('equipment')) {
      if (bookingData.equipmentArrangement) {
        equipmentValue = getConfigValue('equipment arrangement', bookingData.equipmentArrangement);
      }
    }

    // Determine if equipment is ongoing or one-time
    const equipmentConfigs = allConfigs.filter((cfg: any) => 
      String(cfg.category || '').toLowerCase() === 'equipment arrangement'
    );
    const equipmentValues = equipmentConfigs.map((cfg: any) => cfg?.value || 0).sort((a, b) => a - b);
    const smallerEquipmentValue = equipmentValues[0] || 0;
    const largerEquipmentValue = equipmentValues[1] || 0;

    let equipmentHourlyAddition = 0;
    let equipmentOneTimeCost = 0;
    
    if (equipmentValue > 0) {
      if (equipmentValue <= smallerEquipmentValue || (equipmentValue < largerEquipmentValue && Math.abs(equipmentValue - smallerEquipmentValue) < Math.abs(equipmentValue - largerEquipmentValue))) {
        equipmentHourlyAddition = equipmentValue;
      } else {
        equipmentOneTimeCost = equipmentValue;
      }
    }

    const hourlyRate = serviceFrequencyValue + cleaningProductsValue + equipmentHourlyAddition;
    const cleaningCost = totalHours * hourlyRate;

    // SHORT NOTICE CHARGE
    const shortNoticeCharge = bookingData.shortNoticeCharge || 0;

    // SCHEDULING MODIFIERS
    let additionalCharge = 0;
    let discount = 0;
    const modifierDetails: Array<{ type: string; label: string; amount: number }> = [];

    if (bookingData.selectedDate) {
      const dayOfWeek = bookingData.selectedDate.getDay();
      const dayRule = dayPricingRules.find(rule => rule.day_of_week === dayOfWeek);
      
      if (dayRule) {
        const modifier = dayRule.modifier_type === 'percentage' 
          ? (cleaningCost * dayRule.price_modifier) / 100
          : dayRule.price_modifier;
        
        if (modifier > 0) {
          additionalCharge += modifier;
          modifierDetails.push({ type: 'additional', label: dayRule.label || 'Day pricing', amount: modifier });
        } else if (modifier < 0) {
          discount += Math.abs(modifier);
          modifierDetails.push({ type: 'discount', label: dayRule.label || 'Day discount', amount: Math.abs(modifier) });
        }
      }
    }

    if (bookingData.selectedTime) {
      const startTime = bookingData.selectedTime.split(' - ')[0];
      const hourMatch = startTime.match(/(\d+)(am|pm)/i);
      
      if (hourMatch) {
        let hours = parseInt(hourMatch[1]);
        const isPM = hourMatch[2].toLowerCase() === 'pm';
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        const selectedTimeMinutes = hours * 60;

        timeSurchargeRules.forEach(rule => {
          if (rule.start_time && rule.end_time) {
            const [startHours, startMinutes] = rule.start_time.split(':').map(Number);
            const [endHours, endMinutes] = rule.end_time.split(':').map(Number);
            const startTimeMinutes = startHours * 60 + startMinutes;
            const endTimeMinutes = endHours * 60 + endMinutes;

            if (selectedTimeMinutes >= startTimeMinutes && selectedTimeMinutes < endTimeMinutes) {
              const modifier = rule.modifier_type === 'percentage'
                ? (cleaningCost * rule.price_modifier) / 100
                : rule.price_modifier;

              if (modifier > 0) {
                additionalCharge += modifier;
                modifierDetails.push({ type: 'additional', label: rule.label || 'Time surcharge', amount: modifier });
              } else if (modifier < 0) {
                discount += Math.abs(modifier);
                modifierDetails.push({ type: 'discount', label: rule.label || 'Time discount', amount: Math.abs(modifier) });
              }
            }
          }
        });
      }
    }

    const totalCost = cleaningCost + shortNoticeCharge + equipmentOneTimeCost + ovenCleaningCost + additionalCharge - discount;

    return {
      baseTime,
      totalHours,
      hourlyRate,
      cleaningCost,
      ovenCleaningCost,
      equipmentOneTimeCost,
      equipmentHourlyAddition,
      shortNoticeCharge,
      additionalCharge,
      discount,
      modifierDetails,
      totalCost,
      isUserOverride,
    };
  }, [
    bookingData.propertyType,
    bookingData.bedrooms,
    bookingData.bathrooms,
    bookingData.toilets,
    bookingData.additionalRooms,
    bookingData.propertyFeatures,
    bookingData.numberOfFloors,
    bookingData.serviceFrequency,
    bookingData.hasOvenCleaning,
    bookingData.ovenType,
    bookingData.cleaningProducts,
    bookingData.equipmentArrangement,
    bookingData.selectedDate,
    bookingData.selectedTime,
    bookingData.estimatedHours,
    bookingData.shortNoticeCharge,
    allConfigs,
    dayPricingRules,
    timeSurchargeRules,
  ]);

  return calculations;
};