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

    // Debug collectors
    const formulaLogs: any[] = [];
    let shortNoticeDebug: any = {};

    // Helper function to get field value
    const getFieldValue = (fieldName: string): number => {
      const normalizedFieldName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      console.debug('[Pricing] getFieldValue called for:', fieldName);
      
      // Map field names to booking data values
      const fieldMapping: Record<string, any> = {
        propertytype: bookingData.propertyType,
        bedrooms: bookingData.bedrooms,
        bathrooms: bookingData.bathrooms,
        toilets: bookingData.toilets,
        servicetype: bookingData.serviceType,
        alreadycleaned: bookingData.alreadyCleaned,
        cleaninghistory: bookingData.alreadyCleaned,
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

      // Get the value from booking data for this field
      let fieldValue = fieldMapping[normalizedFieldName];

      console.debug('[Pricing]   - normalized:', normalizedFieldName, '-> value:', fieldValue);

      // Special-case: when serviceType is not checkin-checkout, treat alreadyCleaned as 1 by default
      if (
        normalizedFieldName === 'alreadycleaned' &&
        (fieldValue === '' || fieldValue === null || fieldValue === undefined)
      ) {
        if (bookingData.serviceType && bookingData.serviceType !== 'checkin-checkout') {
          console.debug('[Pricing]   - defaulting alreadyCleaned to 1 (non-checkin service)');
          return 1;
        }
      }
      
      // If we have a direct numeric value, return it
      if (typeof fieldValue === 'number') {
        console.debug('[Pricing]   - returning direct numeric value:', fieldValue);
        return fieldValue;
      }
      
      // If it's a boolean, convert to 1/0
      if (typeof fieldValue === 'boolean') {
        const val = fieldValue ? 1 : 0;
        console.debug('[Pricing]   - returning boolean as number:', val);
        return val;
      }
      
      // If field value is empty/null, try to use category default FIRST
      if (fieldValue === '' || fieldValue === null || fieldValue === undefined) {
        const categoryName = fieldToCategoryMap[normalizedFieldName];
        
        console.debug('[Pricing]   - field empty, looking for category default:', categoryName);
        
        if (categoryName) {
          const categoryDefault = categoryDefaults.find(
            (def: any) => def.category === categoryName
          );
          
          if (categoryDefault && categoryDefault.default_value) {
            console.debug('[Pricing]   - found category default:', categoryDefault.default_value);
            // Try to find a config with this default value
            const defaultConfig = allConfigs.find((cfg: any) => {
              return cfg.category === categoryName && 
                     String(cfg.option).toLowerCase() === categoryDefault.default_value.toLowerCase();
            });
            
            if (defaultConfig) {
              console.debug('[Pricing]   - using config value from default:', defaultConfig.value);
              return Number(defaultConfig.value) || 0;
            }

            // Fallback: numeric or boolean-like defaults
            const dv = String(categoryDefault.default_value).trim().toLowerCase();
            if (dv === 'yes' || dv === 'true') return 1;
            if (dv === 'no' || dv === 'false') return 0;
            const parsed = parseFloat(String(categoryDefault.default_value));
            if (!isNaN(parsed)) {
              console.debug('[Pricing]   - using parsed default value:', parsed);
              return parsed;
            }
          }
        }
        
        // No default found, check nested objects
        console.debug('[Pricing]   - no default found, checking nested objects');
      }
      
      // Now try to find the config for this field's VALUE
      // The category name is the original field name (with proper casing)
      const categoryName = fieldToCategoryMap[normalizedFieldName];
      
      if (categoryName && fieldValue) {
        console.debug('[Pricing]   - looking for config: category =', categoryName, ', option =', fieldValue);
        
        const config = allConfigs.find((cfg: any) => {
          if (cfg.category !== categoryName) return false;
          const dataValueNorm = String(fieldValue).trim().toLowerCase();
          const cfgOptionNorm = String(cfg.option).trim().toLowerCase();
          return cfgOptionNorm === dataValueNorm;
        });

        if (config) {
          console.debug('[Pricing]   - found config value:', config.value);
          return Number(config.value) || 0;
        } else {
          console.debug('[Pricing]   - no config found for this value');
        }
      }

      // Check additional rooms (match by normalized key)
      if (bookingData.additionalRooms) {
        const arKey = Object.keys(bookingData.additionalRooms).find(
          (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedFieldName
        );
        if (arKey) {
          const val = Number((bookingData.additionalRooms as any)[arKey]) || 0;
          console.debug('[Pricing]   - found in additionalRooms:', val);
          return val;
        }
      }

      // Check bed sizes (match by normalized key)
      if (bookingData.bedSizes) {
        const bsKey = Object.keys(bookingData.bedSizes).find(
          (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedFieldName
        );
        if (bsKey) {
          const val = Number((bookingData.bedSizes as any)[bsKey]) || 0;
          console.debug('[Pricing]   - found in bedSizes:', val);
          return val;
        }
      }

      // Check property features (match by normalized key)
      if (bookingData.propertyFeatures) {
        const pfKey = Object.keys(bookingData.propertyFeatures).find(
          (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedFieldName
        );
        if (pfKey) {
          const val = (bookingData.propertyFeatures as any)[pfKey] ? 1 : 0;
          console.debug('[Pricing]   - found in propertyFeatures:', val);
          return val;
        }
      }

      // Try to parse as number
      if (typeof fieldValue === 'string') {
        const parsed = parseFloat(fieldValue);
        if (!isNaN(parsed)) {
          console.debug('[Pricing]   - parsed string as number:', parsed);
          return parsed;
        }
      }

      console.debug('[Pricing]   - returning default 0');
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
      if (fieldValue === '' || fieldValue === null || fieldValue === undefined) {
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
    const evaluateFormula = (elements: any[], context: Record<string, number> = {}, label?: string): number => {
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
        const numeric = typeof result === 'number' && isFinite(result) ? result : 0;
        // Collect debug info
        formulaLogs.push({ label: label || 'unnamed', expression, result: numeric, context: { ...context } });
        return numeric;
      } catch (error) {
        console.error('Error evaluating formula:', error, 'Expression:', expression);
        // Even on error, push what we have
        formulaLogs.push({ label: label || 'unnamed', expression, result: 0, context: { ...context }, error: String(error) });
        return 0;
      }
    };

    // Calculate short notice charge
    const calculateShortNoticeCharge = (): number => {
      if (!bookingData.selectedDate || !bookingData.selectedTime) {
        shortNoticeDebug = { reason: 'missing_date_or_time' };
        return 0;
      }

      const now = new Date();
      const bookingDateTime = new Date(bookingData.selectedDate);
      const [hours, minutes] = bookingData.selectedTime.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);

      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Get time flexibility configs for short notice charges
      const timeFlexConfigs = allConfigs
        .filter((cfg: any) => cfg.category?.toLowerCase() === 'time flexibility')
        .sort((a: any, b: any) => (b.min_value || 0) - (a.min_value || 0));

      shortNoticeDebug = {
        hoursUntilBooking,
        selectedDate: bookingData.selectedDate,
        selectedTime: bookingData.selectedTime,
        candidates: timeFlexConfigs.map((c: any) => ({ min: c.min_value, max: c.max_value, value: c.value }))
      };

      for (const config of timeFlexConfigs) {
        const minHours = config.min_value || 0;
        const maxHours = config.max_value || Infinity;
        if (hoursUntilBooking >= minHours && hoursUntilBooking < maxHours) {
          shortNoticeDebug.matched = { min: minHours, max: maxHours, value: config.value };
          return config.value || 0;
        }
      }

      return 0;
    };

    // Find formulas by name (case-insensitive, whitespace-insensitive)
    const findFormula = (target: string) => {
      const norm = (s: string) => String(s || '').trim().toLowerCase().replace(/\s+/g, '');
      const want = norm(target);
      return formulas.find((f: any) => norm(f.name) === want);
    };

    const baseTimeFormula =
      findFormula('Base time') ||
      findFormula('Base Time') ||
      formulas.find((f: any) => String(f.result_type || '').trim().toLowerCase() === 'base_time') ||
      formulas.find((f: any) => String(f.name || '').toLowerCase().includes('base') && String(f.name || '').toLowerCase().includes('time'));
    const additionalTimeFormula = findFormula('Additional Time');
    const totalHoursFormula = findFormula('Total Hours');
    const cleaningCostFormula = findFormula('Cleaning Cost');
    const totalCostFormula = findFormula('Total cost') || findFormula('Total Cost');

    // Calculate base time from formula
    let baseTime = 0;
    if (baseTimeFormula && Array.isArray(baseTimeFormula.elements) && baseTimeFormula.elements.length > 0) {
      baseTime = evaluateFormula(baseTimeFormula.elements, {}, 'Base time');
      console.debug('[Pricing] Base time calculated:', baseTime, 'from formula');
    } else {
      console.warn('[Pricing] Base time formula not found or empty');
    }

    // Use user override if explicitly set (allow 0 as valid if user sets it)
    if (bookingData.estimatedHours !== null && bookingData.estimatedHours !== undefined) {
      baseTime = bookingData.estimatedHours;
      console.debug('[Pricing] Using user override for base time:', baseTime);
    }

    // Calculate additional time
    let additionalTime = 0;
    if (additionalTimeFormula) {
      additionalTime = evaluateFormula(additionalTimeFormula.elements, {}, 'Additional Time');
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
      totalHours = evaluateFormula(totalHoursFormula.elements, context, 'Total Hours');
    }
    // Calculate cleaning cost (pass totalHours as context)
    let cleaningCost = 0;
    if (cleaningCostFormula) {
      const context = {
        totalhours: totalHours,
      };
      cleaningCost = evaluateFormula(cleaningCostFormula.elements, context, 'Cleaning Cost');
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
      const evaluated = evaluateFormula(totalCostFormula.elements, context, 'Total cost');
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
      debug: {
        formulas: formulaLogs,
        shortNotice: shortNoticeDebug,
        inputs: bookingData,
      },
    };
  }, [bookingData, formulas, allConfigs, categoryDefaults]);

  return calculations;
};
