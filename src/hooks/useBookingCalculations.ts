import { useMemo } from 'react';
import { useAirbnbPricingFormulas } from './useAirbnbPricingFormulas';
import { useAirbnbFieldConfigs } from './useAirbnbFieldConfigs';
import { useAirbnbCategoryDefaults } from './useAirbnbCategoryDefaults';

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
  const { data: categoryDefaults = [] } = useAirbnbCategoryDefaults();

  const calculations = useMemo(() => {
    // Map field names to their category names for default lookup
    const fieldToCategoryMap: Record<string, string> = {
      propertytype: 'Property Type',
      bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms',
      toilets: 'Toilets',
      servicetype: 'Service Type',
      propertyfeatures: 'Property Features',
      alreadycleaned: 'Cleaning History',
      ovencleaning: 'Oven Cleaning',
      oventype: 'Oven Type',
      cleaningproducts: 'Cleaning Supplies',
      cleaningsupplies: 'Cleaning Supplies',
      equipmentarrangement: 'Equipment Arrangement',
      linenhandling: 'Linen Handling',
      linenshandling: 'Linen Handling',
      timeflexibility: 'Time Flexibility',
    };

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
      
      // If field value is empty/null, try to use category default FIRST
      if (!fieldValue || fieldValue === '' || fieldValue === null || fieldValue === undefined || fieldValue === false) {
        const categoryName = fieldToCategoryMap[normalizedFieldName];
        
        if (categoryName) {
          const categoryDefault = categoryDefaults.find(
            (def: any) => def.category === categoryName
          );
          
          if (categoryDefault && categoryDefault.default_value) {
            // Try to find a config with this default value
            const defaultConfig = allConfigs.find((cfg: any) => {
              return cfg.category === categoryName && 
                     String(cfg.option).toLowerCase() === categoryDefault.default_value.toLowerCase();
            });
            
            if (defaultConfig) {
              console.debug('[Pricing] Using category default for', fieldName, '(', categoryName, '):', defaultConfig.value);
              return Number(defaultConfig.value) || 0;
            }

            // Fallback: numeric or boolean-like defaults
            const dv = String(categoryDefault.default_value).trim().toLowerCase();
            if (dv === 'yes' || dv === 'true') return 1;
            if (dv === 'no' || dv === 'false') return 0;
            const parsed = parseFloat(String(categoryDefault.default_value));
            if (!isNaN(parsed)) {
              console.debug('[Pricing] Using numeric category default for', fieldName, '(', categoryName, '):', parsed);
              return parsed;
            }
          }
        }
      }
      
      // Get the config for this field value (if field has a value)
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
      
      // If field value is empty/null, try to use category default FIRST
      if (!fieldValue || fieldValue === '' || fieldValue === null || fieldValue === undefined || fieldValue === false) {
        const categoryName = fieldToCategoryMap[normalizedFieldName];
        
        if (categoryName) {
          const categoryDefault = categoryDefaults.find(
            (def: any) => def.category === categoryName
          );
          
          if (categoryDefault && categoryDefault.default_value) {
            // Try to find a config with this default value
            const defaultConfig = allConfigs.find((cfg: any) => {
              return cfg.category === categoryName && 
                     String(cfg.option).toLowerCase() === String(categoryDefault.default_value).toLowerCase();
            });
            
            if (defaultConfig && typeof defaultConfig.time === 'number') {
              console.debug('[Pricing] Using category default time for', fieldName, '(', categoryName, '):', defaultConfig.time);
              return defaultConfig.time;
            }

            // Fallback: numeric default interpreted as minutes
            const parsed = parseFloat(String(categoryDefault.default_value));
            if (!isNaN(parsed)) {
              console.debug('[Pricing] Using numeric category default time for', fieldName, '(', categoryName, '):', parsed);
              return parsed;
            }
          }
        }
      }
      
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

      let expression = '';
      let lastType: 'start' | 'value' | 'close' | 'operator' = 'start';
      try {
        for (const element of elements) {
          if (element.type === 'field') {
            const rawName = String(element.value || '').toLowerCase();
            // Formula references (e.g., totalhours)
            if (rawName in context) {
              if (lastType === 'value' || lastType === 'close') expression += ' * ';
              expression += `(${context[rawName].toString()})`;
              lastType = 'value';
              continue;
            }
            // Value vs time
            const useTime = String(element.attribute || '').toLowerCase() === 'time' || rawName.includes('.time');
            const actualFieldName = rawName.replace('.value', '').replace('.time', '');
            const val = useTime ? getFieldTime(actualFieldName) : getFieldValue(actualFieldName);
            if (lastType === 'value' || lastType === 'close') expression += ' * ';
            expression += `(${val.toString()})`;
            lastType = 'value';
          } else if (element.type === 'number') {
            if (lastType === 'value' || lastType === 'close') expression += ' * ';
            expression += String(element.value);
            lastType = 'value';
          } else if (element.type === 'operator') {
            const op = String(element.value).trim();
            if (op === '(') {
              if (lastType === 'value' || lastType === 'close') expression += ' * ';
              expression += '(';
              lastType = 'operator';
            } else if (op === ')') {
              expression += ')';
              lastType = 'close';
            } else {
              expression += ` ${op} `;
              lastType = 'operator';
            }
          }
        }

        console.debug('[Formula] Expression:', expression);
        const result = Function('"use strict"; return (' + expression + ')')();
        return typeof result === 'number' && isFinite(result) ? result : 0;
      } catch (error) {
        console.error('Error evaluating formula:', error, 'Expression:', expression);
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

    // Calculate base time from formula
    let baseTime = 2; // Default minimum
    if (baseTimeFormula && baseTimeFormula.elements && baseTimeFormula.elements.length > 0) {
      const calculated = evaluateFormula(baseTimeFormula.elements);
      baseTime = Math.max(2, calculated); // Ensure minimum 2 hours
      console.debug('[Pricing] Base time calculated:', baseTime, 'from formula');
    } else {
      console.warn('[Pricing] Base time formula not found or empty');
    }

    // Use user override if explicitly set
    if (bookingData.estimatedHours && bookingData.estimatedHours > 0) {
      baseTime = bookingData.estimatedHours;
      console.debug('[Pricing] Using user override for base time:', baseTime);
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
    if (totalCostFormula && Array.isArray(totalCostFormula.elements) && totalCostFormula.elements.length > 0) {
      const context = {
        cleaningcost: cleaningCost,
        shortnoticecharge: shortNoticeCharge,
      };
      const evaluated = evaluateFormula(totalCostFormula.elements, context);
      // Only override when evaluation produced a meaningful value.
      // If a misconfigured/empty formula returns 0 but cleaningCost > 0, keep the fallback.
      if (Number.isFinite(evaluated)) {
        if (!(evaluated === 0 && cleaningCost > 0)) {
          totalCost = evaluated;
        }
      }
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
  }, [bookingData, formulas, allConfigs, categoryDefaults]);

  return calculations;
};
