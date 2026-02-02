import { useMemo } from 'react';
import { useAirbnbFieldConfigs } from './useAirbnbFieldConfigs';
import { useSchedulingRules } from './useSchedulingRules';

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
  hasOvenCleaning?: boolean;
  ovenType: string;
  cleaningProducts: string[]; // Array of cleaning products: ['no'], ['products'], ['equipment'], or ['products', 'equipment']
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
  estimatedAdditionalHours?: number | null;
  shortNoticeCharge?: number;
}

export const useAirbnbHardcodedCalculations = (bookingData: BookingData) => {
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
    const serviceTypeTime = bookingData.serviceType ? getConfigTime('service type', bookingData.serviceType) : 0;
    const serviceTypeValue = bookingData.serviceType ? getConfigValue('service type', bookingData.serviceType) : 0;
    
    // Already cleaned value - only for check-in/check-out
    let alreadyCleanedValue = 1; // Default
    let alreadyCleanedCostValue = 0; // Default for hourly rate addition
    if (bookingData.serviceType === 'checkin-checkout' && bookingData.alreadyCleaned === false) {
      alreadyCleanedValue = getConfigTime('cleaning history', 'No'); // Use time from config
      alreadyCleanedCostValue = getConfigValue('cleaning history', 'No'); // Add to hourly rate
    }

    // Oven cleaning time and cost - only when hasOvenCleaning is true AND a specific type is chosen
    const ovenCleaningTime = (bookingData.hasOvenCleaning && bookingData.ovenType && bookingData.ovenType !== 'dontneed' && bookingData.ovenType !== '')
      ? getConfigTime('oven cleaning', bookingData.ovenType)
      : 0;
    const ovenCleaningCost = (bookingData.hasOvenCleaning && bookingData.ovenType && bookingData.ovenType !== 'dontneed' && bookingData.ovenType !== '')
      ? getConfigValue('oven cleaning', bookingData.ovenType)
      : 0;

    // Additional rooms time - sum of each selected room count * its time
    let additionalRoomsTime = 0;
    const additionalRoomsBreakdown: Record<string, { qty: number; timePerUnit: number; total: number }> = {};
    if (bookingData.additionalRooms) {
      for (const [key, count] of Object.entries(bookingData.additionalRooms)) {
        const qty = Number(count) || 0;
        if (!qty) continue;
        const unitTime = getConfigTime('additional rooms', key);
        additionalRoomsTime += unitTime * qty;
        additionalRoomsBreakdown[key] = { qty, timePerUnit: unitTime, total: unitTime * qty };
      }
    }

    // Property features time
    let propertyFeaturesTime = 0;
    const featuresBreakdown: Record<string, number> = {};
    const pf = bookingData.propertyFeatures || {};
    // combined separateKitchen + livingRoom counts once as 'separateKitchenLivingRoom'
    if (pf.separateKitchen || pf.livingRoom) {
      const t = getConfigTime('property features', 'separateKitchenLivingRoom');
      propertyFeaturesTime += t;
      featuresBreakdown['separateKitchenLivingRoom'] = t;
    }
    // other boolean features
    for (const [feature, isSelected] of Object.entries(pf)) {
      if (!isSelected) continue;
      if (feature === 'separateKitchen' || feature === 'livingRoom') continue;
      const t = getConfigTime('property features', feature);
      propertyFeaturesTime += t;
      featuresBreakdown[feature] = (featuresBreakdown[feature] || 0) + t;
    }
    // number of floors (multiplier)
    const floors = Number(bookingData.numberOfFloors) || 0;
    if (floors > 0) {
      const perFloor = getConfigTime('property features', 'numberOfFloors');
      const ft = perFloor * floors;
      propertyFeaturesTime += ft;
      featuresBreakdown['numberOfFloors'] = ft;
    }

    // BASE TIME CALCULATION
    // Minutes sum from all relevant fields (in minutes)
    const minutesSum = propertyTypeTime + bedroomsTime + bathroomsTime + additionalRoomsTime + propertyFeaturesTime + ovenCleaningTime;

    // Calculate total minutes with multipliers
    // Formula: (sum of all times) * service type time * already cleaned multiplier
    const totalMinutes = minutesSum * serviceTypeTime * alreadyCleanedValue;

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
    // Formula: Math.ceil((bedSizes.value) / 90) / 2
    // Changed from /30 to /90 to get realistic drying times (1h per double bed instead of 3h)
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
      ? Math.ceil(bedSizesValue / 90) / 2
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
    // Formula: Max of waitingTime or ironTime (we can iron during waiting, so take the longer one)
    let additionalTime = 0;
    const shouldCalculateAdditionalTime = bookingData.linensHandling === 'wash-hang' || bookingData.linensHandling === 'wash-dry';
    
    if (shouldCalculateAdditionalTime) {
      // Waiting time = how much longer drying takes compared to base cleaning
      const waitingTime = Math.max(0, dryTime - baseTime);
      
      // Additional time = max of waiting or ironing (we can iron during waiting time)
      additionalTime = Math.max(waitingTime, ironTime);
    }

    // TOTAL HOURS
    // User override for base time
    const isUserOverrideBase = bookingData.estimatedHours !== null 
      && bookingData.estimatedHours !== undefined 
      && Math.abs((bookingData.estimatedHours as number) - baseTime) > 0.001;
    const finalBaseTime = isUserOverrideBase ? (bookingData.estimatedHours as number) : baseTime;

    // User override for additional time
    const isUserOverrideAdditional = bookingData.estimatedAdditionalHours !== null 
      && bookingData.estimatedAdditionalHours !== undefined 
      && Math.abs((bookingData.estimatedAdditionalHours as number) - additionalTime) > 0.001;
    const finalAdditionalTime = isUserOverrideAdditional ? (bookingData.estimatedAdditionalHours as number) : additionalTime;

    const calculatedTotalHours = baseTime + additionalTime;
    const totalHours = finalBaseTime + finalAdditionalTime;

    // HOURLY RATE CALCULATION
    // Formula: sameday.value + serviceType.value + cleaningProducts.value + (equipmentArrangement.value < 10 ? equipmentArrangement.value : 0)
    const sameDayValue = bookingData.sameDayTurnaround 
      ? getConfigValue('time flexibility', 'same-day-turnaround')
      : 0;
    
    // Check if cleaning products are needed - handle array format
    let cleaningProductsValue = 0;
    if (bookingData.cleaningProducts && Array.isArray(bookingData.cleaningProducts) && bookingData.cleaningProducts.length > 0) {
      // If 'products' is in the array, get its value
      if (bookingData.cleaningProducts.includes('products')) {
        cleaningProductsValue = getConfigValue('cleaning supplies', 'products');
      }
      // Note: 'equipment' value is handled separately in equipmentArrangement
    }

    // Check if equipment is needed - handle array format
    let equipmentValue = 0;
    if (bookingData.cleaningProducts && Array.isArray(bookingData.cleaningProducts) && bookingData.cleaningProducts.includes('equipment')) {
      if (bookingData.equipmentArrangement) {
        equipmentValue = getConfigValue('equipment arrangement', bookingData.equipmentArrangement);
      }
    } else if (bookingData.equipmentArrangement) {
      // Fallback: if equipment arrangement is specified, use it
      equipmentValue = getConfigValue('equipment arrangement', bookingData.equipmentArrangement);
    }

    // Get all equipment arrangement values to determine which is ongoing vs one-time
    const equipmentConfigs = allConfigs.filter((cfg: any) => 
      String(cfg.category || '').toLowerCase() === 'equipment arrangement'
    );
    const equipmentValues = equipmentConfigs.map((cfg: any) => cfg?.value || 0).sort((a, b) => a - b);
    const smallerEquipmentValue = equipmentValues[0] || 0;
    const largerEquipmentValue = equipmentValues[1] || 0;

    // Determine if current equipment is ongoing (smaller) or one-time (larger)
    let equipmentHourlyAddition = 0;
    let equipmentOneTimeCost = 0;
    
    if (equipmentValue > 0) {
      if (equipmentValue <= smallerEquipmentValue || (equipmentValue < largerEquipmentValue && Math.abs(equipmentValue - smallerEquipmentValue) < Math.abs(equipmentValue - largerEquipmentValue))) {
        // This is the smaller value = ongoing (add to hourly rate)
        equipmentHourlyAddition = equipmentValue;
      } else {
        // This is the larger value = one-time (add to total cost)
        equipmentOneTimeCost = equipmentValue;
      }
    }

    const hourlyRate = sameDayValue + serviceTypeValue + cleaningProductsValue + equipmentHourlyAddition + alreadyCleanedCostValue;

    // CLEANING COST
    const cleaningCost = totalHours * hourlyRate;

    // SHORT NOTICE CHARGE - Use the value already calculated and passed from ScheduleStep
    const shortNoticeCharge = bookingData.shortNoticeCharge || 0;

    // CALCULATE SCHEDULING MODIFIERS (only on cleaning cost, not linens)
    let additionalCharge = 0;
    let discount = 0;
    const modifierDetails: Array<{ type: string; label: string; amount: number }> = [];

    // Day-specific pricing (e.g., weekends)
    if (bookingData.selectedDate) {
      const dayOfWeek = bookingData.selectedDate.getDay();
      const dayRule = dayPricingRules.find(rule => rule.day_of_week === dayOfWeek);
      
      if (dayRule) {
        const modifier = dayRule.modifier_type === 'percentage' 
          ? (cleaningCost * dayRule.price_modifier) / 100
          : dayRule.price_modifier;
        
        if (modifier > 0) {
          additionalCharge += modifier;
          modifierDetails.push({
            type: 'additional',
            label: dayRule.label || 'Day pricing',
            amount: modifier
          });
        } else if (modifier < 0) {
          discount += Math.abs(modifier);
          modifierDetails.push({
            type: 'discount',
            label: dayRule.label || 'Day discount',
            amount: Math.abs(modifier)
          });
        }
      }
    }

    // Time-specific surcharges
    if (bookingData.selectedTime) {
      // Parse time from formats: "9:00 AM", "9am - 10am", "9am"
      let timePart = bookingData.selectedTime.includes(' - ') 
        ? bookingData.selectedTime.split(' - ')[0] 
        : bookingData.selectedTime;
      
      // Match both "9:00 AM" and "9am" formats
      const hourMatch = timePart.match(/(\d+):?(\d{2})?\s*(AM|PM|am|pm)/i);
      
      if (hourMatch) {
        let hours = parseInt(hourMatch[1]);
        const isPM = hourMatch[3].toUpperCase() === 'PM';
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
                modifierDetails.push({
                  type: 'additional',
                  label: rule.label || 'Time surcharge',
                  amount: modifier
                });
              } else if (modifier < 0) {
                discount += Math.abs(modifier);
                modifierDetails.push({
                  type: 'discount',
                  label: rule.label || 'Time discount',
                  amount: Math.abs(modifier)
                });
              }
            }
          }
        });
      }
    }

    // TOTAL COST (with modifiers and oven cleaning)
    const totalCost = cleaningCost + shortNoticeCharge + equipmentOneTimeCost + ovenCleaningCost + additionalCharge - discount;

    // LINEN HANDLING DISPLAY-ONLY CALC (no impact on totals)
    // Display the same additionalTime that is actually added to totalHours
    const linenHandlingOption = bookingData.linensHandling || '';
    const hasLinenHandling = linenHandlingOption === 'wash-hang' || linenHandlingOption === 'wash-dry';
    const linenHandlingTime1 = hasLinenHandling ? getConfigTime('linen handling', linenHandlingOption) : 0;
    const linenHandlingTime2 = hasLinenHandling ? getConfigTime('linens handling', linenHandlingOption) : 0;
    const linenHandlingTime = Math.max(linenHandlingTime1, linenHandlingTime2, 0);
    
    // Calculate dryTime in hours for display purposes
    const linenHandlingDryHours = hasLinenHandling ? dryTime : 0;
    const linenHandlingIronHours = hasLinenHandling && bookingData.needsIroning ? ironTime : 0;
    const linenHandlingExtraFromDryHours = Math.max(0, linenHandlingDryHours - baseTime);
    
    // Show the actual additional hours that are added to totalHours (already in hours)
    const linenHandlingAdditionalHours = additionalTime;

    return {
      baseTime: finalBaseTime,
      dryTime,
      ironTime,
      additionalTime: finalAdditionalTime,
      linenHandlingAdditionalHours: finalAdditionalTime,
      totalHours,
      calculatedTotalHours,
      hourlyRate,
      cleaningCost,
      shortNoticeCharge,
      equipmentOneTimeCost,
      ovenCleaningCost,
      ovenCleaningTime,
      additionalCharge,
      discount,
      modifierDetails,
      totalCost,
      isUserOverride: isUserOverrideBase || isUserOverrideAdditional,
      debug: {
        dryTime,
        ironTime,
        baseTime,
        additionalTime,
        calculatedTotalHours,
        finalBaseTime,
        finalAdditionalTime,
        userEstimatedHours: bookingData.estimatedHours,
        userEstimatedAdditionalHours: bookingData.estimatedAdditionalHours,
        minutesSum,
        totalMinutes,
        propertyTypeTime,
        bedroomsTime,
        bathroomsTime,
        serviceTypeTime,
        serviceTypeValue,
        missingServiceType: !bookingData.serviceType,
        alreadyCleanedValue,
        ovenCleaningTime,
        ovenCleaningCost,
        additionalRoomsTime,
        additionalRoomsBreakdown,
        propertyFeaturesTime,
        featuresBreakdown,
        bedSizesValue,
        bedSizesTime,
        linenHandling: {
          linenHandlingTime,
          linenHandlingDryHours,
          linenHandlingIronHours,
          linenHandlingExtraFromDryHours,
          linenHandlingAdditionalHours,
          bedSizesValue,
          bedSizesTime,
        },
        hourlyRateBreakdown: {
          sameDayValue,
          serviceTypeValue,
          cleaningProductsValue,
          equipmentHourlyAddition,
          equipmentOneTimeCost,
          hourlyRate,
        }
      }
    };
  }, [JSON.stringify(bookingData), allConfigs, dayPricingRules, timeSurchargeRules]);

  return calculations;
};
