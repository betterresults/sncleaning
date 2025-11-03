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
  cleaningProducts: string;
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
      const normalizedOption = String(option).toLowerCase().replace(/[^a-z0-9]/g, '');
      const config = allConfigs.find((cfg: any) => {
        const cfgCategory = String(cfg.category || '').toLowerCase();
        const cfgOption = String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return cfgCategory === category.toLowerCase() && cfgOption === normalizedOption;
      });
      return config?.time || 0;
    };

    // Helper to get value from configs
    const getConfigValue = (category: string, option: string): number => {
      const normalizedOption = String(option).toLowerCase().replace(/[^a-z0-9]/g, '');
      const config = allConfigs.find((cfg: any) => {
        const cfgCategory = String(cfg.category || '').toLowerCase();
        const cfgOption = String(cfg.option || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return cfgCategory === category.toLowerCase() && cfgOption === normalizedOption;
      });
      return config?.value || 0;
    };

    // Get all required field times and values
    const propertyTypeTime = getConfigTime('property type', bookingData.propertyType);
    const bedroomsTime = getConfigTime('bedrooms', bookingData.bedrooms);
    const bathroomsTime = getConfigTime('bathrooms', bookingData.bathrooms);
    const serviceTypeTime = getConfigTime('service type', bookingData.serviceType);
    
    // Already cleaned value
    let alreadyCleanedValue = 1; // Default
    if (bookingData.serviceType === 'checkin-checkout' && bookingData.alreadyCleaned !== null) {
      alreadyCleanedValue = getConfigValue('cleaning history', bookingData.alreadyCleaned ? 'yes' : 'no');
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

    // BASE TIME CALCULATION
    // Formula: Math.ceil(((propertyType.time + bedrooms.time + bathrooms.time + additionalRooms.time + ovenCleaning.time) * (serviceType.time * alreadyCleaned.value)) / 30) / 2
    const baseTime = Math.ceil(
      ((propertyTypeTime + bedroomsTime + bathroomsTime + additionalRoomsTime + ovenCleaningTime) 
      * (serviceTypeTime * alreadyCleanedValue)) / 30
    ) / 2;

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
    const dryTime = bookingData.linensHandling && bookingData.linensHandling !== 'customer-handles'
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
    const ironTime = bookingData.needsIroning 
      ? Math.ceil(bedSizesTime / 30) / 2
      : 0;

    // ADDITIONAL TIME CALCULATION
    // Formula: Math.abs((Drytime + IronTime) - Basetime) - ((Drytime - Basetime) < 0 ? 0 : (Drytime - Basetime))
    const additionalTime = bookingData.linensHandling && bookingData.linensHandling !== 'customer-handles'
      ? Math.abs((dryTime + ironTime) - baseTime) - ((dryTime - baseTime) < 0 ? 0 : (dryTime - baseTime))
      : 0;

    // TOTAL HOURS
    const totalHours = baseTime + additionalTime;

    // HOURLY RATE CALCULATION
    // Formula: sameday.value + serviceType.value + cleaningProducts.value + (equipmentArrangement.value < 10 ? equipmentArrangement.value : 0)
    const sameDayValue = bookingData.sameDayTurnaround 
      ? getConfigValue('time flexibility', 'same-day-turnaround')
      : 0;

    const serviceTypeValue = getConfigValue('service type', bookingData.serviceType);
    const cleaningProductsValue = getConfigValue('cleaning products', bookingData.cleaningProducts);

    const equipmentValue = bookingData.equipmentArrangement 
      ? getConfigValue('equipment arrangement', bookingData.equipmentArrangement)
      : 0;

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
      hourlyRate,
      cleaningCost,
      shortNoticeCharge,
      totalCost,
      debug: {
        dryTime,
        ironTime,
        baseTime,
        additionalTime,
        propertyTypeTime,
        bedroomsTime,
        bathroomsTime,
        serviceTypeTime,
        alreadyCleanedValue,
        ovenCleaningTime,
        additionalRoomsTime,
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
  }, [bookingData, allConfigs]);

  return calculations;
};
