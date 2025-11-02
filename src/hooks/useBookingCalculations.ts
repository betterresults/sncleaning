import { useMemo } from 'react';
import { useAirbnbPricingFormulas } from './useAirbnbPricingFormulas';
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

export const useBookingCalculations = (bookingData: BookingData) => {
  const { data: formulas = [] } = useAirbnbPricingFormulas();
  const { data: allConfigs = [] } = useAirbnbFieldConfigs();

  const calculations = useMemo(() => {
    // Helper function to get field value
    const getFieldValue = (fieldName: string): number => {
      const normalizedFieldName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Map field names to booking data
      const fieldMapping: Record<string, any> = {
        propertytype: bookingData.propertyType,
        bedrooms: bookingData.bedrooms,
        bathrooms: bookingData.bathrooms,
        toilets: bookingData.toilets,
        servicetype: bookingData.serviceType,
        alreadycleaned: bookingData.alreadyCleaned,
        ovencleaning: bookingData.needsOvenCleaning,
        oventype: bookingData.ovenType,
        cleaningproducts: bookingData.cleaningProducts,
        cleaningsupplies: bookingData.cleaningProducts,
        equipmentarrangement: bookingData.equipmentArrangement,
        linenshandling: bookingData.linensHandling,
        needsironing: bookingData.needsIroning,
        ironinghours: bookingData.ironingHours || 0,
        sameday: bookingData.sameDayTurnaround,
        samedayturnaround: bookingData.sameDayTurnaround,
        timeflexibility: bookingData.flexibility,
        numberoffloors: bookingData.numberOfFloors || 0,
      };

      // Check if it's a direct field
      const fieldValue = fieldMapping[normalizedFieldName];
      
      // Get the config for this field value
      const config = allConfigs.find((cfg: any) => {
        const cfgCategory = cfg.category?.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cfgOption = String(cfg.option).toLowerCase();
        const dataValue = String(fieldValue).toLowerCase();
        return cfgCategory === normalizedFieldName && cfgOption === dataValue;
      });

      if (config) {
        return Number(config.value) || 0;
      }

      // Check additional rooms
      if (bookingData.additionalRooms && normalizedFieldName in bookingData.additionalRooms) {
        return Number(bookingData.additionalRooms[normalizedFieldName]) || 0;
      }

      // Check bed sizes
      if (bookingData.bedSizes && normalizedFieldName in bookingData.bedSizes) {
        return Number(bookingData.bedSizes[normalizedFieldName]) || 0;
      }

      // Check property features
      if (bookingData.propertyFeatures && normalizedFieldName in bookingData.propertyFeatures) {
        return bookingData.propertyFeatures[normalizedFieldName] ? 1 : 0;
      }

      // Try to parse as number
      if (typeof fieldValue === 'number') return fieldValue;
      if (typeof fieldValue === 'string') {
        const parsed = parseFloat(fieldValue);
        if (!isNaN(parsed)) return parsed;
      }
      if (typeof fieldValue === 'boolean') return fieldValue ? 1 : 0;

      return 0;
    };

    // Helper function to get time value in hours
    const getFieldTime = (fieldName: string): number => {
      const normalizedFieldName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const fieldMapping: Record<string, any> = {
        propertytype: bookingData.propertyType,
        bedrooms: bookingData.bedrooms,
        bathrooms: bookingData.bathrooms,
        servicetype: bookingData.serviceType,
        alreadycleaned: bookingData.alreadyCleaned,
        oventype: bookingData.ovenType,
        cleaningproducts: bookingData.cleaningProducts,
        equipmentarrangement: bookingData.equipmentArrangement,
        linenshandling: bookingData.linensHandling,
        needsironing: bookingData.needsIroning,
      };

      const fieldValue = fieldMapping[normalizedFieldName];
      
      const config = allConfigs.find((cfg: any) => {
        const cfgCategory = cfg.category?.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cfgOption = String(cfg.option).toLowerCase();
        const dataValue = String(fieldValue).toLowerCase();
        return cfgCategory === normalizedFieldName && cfgOption === dataValue;
      });

      if (config && typeof config.time === 'number') {
        return config.time; // Return minutes; formulas handle conversion to hours
      }

      return 0;
    };

    // Helper function to evaluate formula
    const evaluateFormula = (elements: any[], context: Record<string, number> = {}): number => {
      if (!elements || elements.length === 0) return 0;

      try {
        let expression = '';
        
        for (const element of elements) {
          if (element.type === 'field') {
            const fieldName = element.value.toLowerCase();
            
            // Check if this is a formula reference (like TotalHours, CleaningCost, etc.)
            if (fieldName in context) {
              expression += context[fieldName].toString();
              continue;
            }
            
            // Determine if we should use value or time
            const useTime = element.attribute === 'time' || fieldName.includes('.time');
            const actualFieldName = fieldName.replace('.value', '').replace('.time', '');
            
            const val = useTime 
              ? getFieldTime(actualFieldName) 
              : getFieldValue(actualFieldName);
            expression += val.toString();
          } else if (element.type === 'operator') {
            expression += element.value;
          } else if (element.type === 'number') {
            expression += element.value;
          }
        }

        // Safely evaluate the expression
        const result = Function('"use strict"; return (' + expression + ')')();
        return typeof result === 'number' && isFinite(result) ? result : 0;
      } catch (error) {
        console.error('Error evaluating formula:', error);
        return 0;
      }
    };

    // Calculate short notice charge
    const calculateShortNoticeCharge = (): number => {
      if (!bookingData.selectedDate || !bookingData.selectedTime) return 0;

      const now = new Date();
      const bookingDateTime = new Date(bookingData.selectedDate);
      const [hours, minutes] = bookingData.selectedTime.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);

      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Get time flexibility configs for short notice charges
      const timeFlexConfigs = allConfigs.filter((cfg: any) => 
        cfg.category?.toLowerCase() === 'time flexibility'
      ).sort((a: any, b: any) => (b.min_value || 0) - (a.min_value || 0));

      for (const config of timeFlexConfigs) {
        const minHours = config.min_value || 0;
        const maxHours = config.max_value || Infinity;
        if (hoursUntilBooking >= minHours && hoursUntilBooking < maxHours) {
          return config.value || 0;
        }
      }

      return 0;
    };

    // Find formulas by name
    const baseTimeFormula = formulas.find((f: any) => f.name === 'Base time');
    const additionalTimeFormula = formulas.find((f: any) => f.name === 'Additional Time');
    const totalHoursFormula = formulas.find((f: any) => f.name === 'Total Hours');
    const cleaningCostFormula = formulas.find((f: any) => f.name === 'Cleaning Cost');
    const totalCostFormula = formulas.find((f: any) => f.name === 'Total cost');

    // Calculate base time
    let baseTime = 0;
    if (baseTimeFormula) {
      baseTime = evaluateFormula(baseTimeFormula.elements);
      console.debug('[Pricing] Base time result:', baseTime, { elements: baseTimeFormula.elements });
    } else {
      console.warn('[Pricing] Base time formula not found');
    }

    // Allow user override of base time
    if (bookingData.estimatedHours) {
      baseTime = bookingData.estimatedHours;
    }

    // Calculate additional time
    let additionalTime = 0;
    if (additionalTimeFormula) {
      additionalTime = evaluateFormula(additionalTimeFormula.elements);
    }

    // Allow user override of additional time (ironingHours)
    if (bookingData.ironingHours) {
      additionalTime = bookingData.ironingHours;
    }

    // Calculate total hours (pass calculated values as context)
    let totalHours = baseTime + additionalTime;
    if (totalHoursFormula) {
      const context = {
        basetime: baseTime,
        additionaltime: additionalTime,
      };
      totalHours = evaluateFormula(totalHoursFormula.elements, context);
    }

    // Ensure minimum 2 hours
    totalHours = Math.max(totalHours, 2);

    // Calculate cleaning cost (pass totalHours as context)
    let cleaningCost = 0;
    if (cleaningCostFormula) {
      const context = {
        totalhours: totalHours,
      };
      cleaningCost = evaluateFormula(cleaningCostFormula.elements, context);
    }

    // Calculate short notice charge
    const shortNoticeCharge = calculateShortNoticeCharge();

    // Calculate total cost (pass all calculated values as context)
    let totalCost = cleaningCost + shortNoticeCharge;
    if (totalCostFormula) {
      const context = {
        cleaningcost: cleaningCost,
        shortnoticecharge: shortNoticeCharge,
      };
      totalCost = evaluateFormula(totalCostFormula.elements, context);
    }

    // Round to 2 decimal places
    const roundTo2 = (num: number) => Math.round(num * 100) / 100;

    return {
      baseTime: roundTo2(baseTime),
      additionalTime: roundTo2(additionalTime),
      totalHours: roundTo2(totalHours),
      cleaningCost: roundTo2(cleaningCost),
      shortNoticeCharge: roundTo2(shortNoticeCharge),
      totalCost: roundTo2(totalCost),
      hourlyRate: totalHours > 0 ? roundTo2(cleaningCost / totalHours) : 0,
    };
  }, [bookingData, formulas, allConfigs]);

  return calculations;
};
