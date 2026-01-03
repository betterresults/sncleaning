import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Minimal interface for the calculation - full interface is in the booking form
interface EndOfTenancyCalculationInput {
  propertyType?: 'flat' | 'house' | 'house-share' | '';
  bedrooms?: string;
  bathrooms?: string;
  propertyCondition?: 'well-maintained' | 'moderate' | 'heavily-used' | 'intensive' | '';
  furnitureStatus?: 'furnished' | 'unfurnished' | 'part-furnished' | '';
  kitchenLivingSeparate?: boolean | null;
  additionalRooms?: string[];
  ovenType?: string;
  houseShareAreas?: string[];
  additionalServices?: string[];
  blindsItems?: { type: string; quantity: number; price: number }[];
  extraServices?: { id: string; name: string; quantity: number; price: number }[];
  carpetItems?: { id: string; name: string; quantity: number; price: number }[];
  upholsteryItems?: { id: string; name: string; quantity: number; price: number }[];
  mattressItems?: { id: string; name: string; quantity: number; price: number }[];
  shortNoticeCharge?: number;
}

interface FieldConfig {
  id: string;
  category: string;
  option: string;
  label: string | null;
  value: number;
  value_type: string;
  time: number | null;
  icon: string | null;
  min_value: number | null;
  max_value: number | null;
  display_order: number | null;
  category_order: number | null;
  is_visible: boolean | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface EndOfTenancyCalculationResult {
  baseCost: number;           // Sum of fixed costs (bedrooms, bathrooms, kitchen, additional rooms, house share)
  conditionPercentage: number; // Property condition % to add
  furniturePercentage: number; // Furniture status % to add
  adjustedBaseCost: number;   // Base cost after applying percentages
  ovenCleaningCost: number;   // Oven cleaning (fixed, not affected by percentages)
  blindsTotal: number;        // Blinds cost (not affected by percentages)
  extrasTotal: number;        // Extra services cost (not affected by percentages)
  additionalServicesTotal: number; // Additional services (Balcony, Garage, Waste Removal)
  steamCleaningTotal: number; // Carpet/upholstery/mattress total
  steamCleaningDiscount: number; // 20% discount on steam cleaning when combined
  steamCleaningFinal: number; // Steam cleaning after discount
  firstTimeDiscount: number;  // 10% first-time customer discount
  shortNoticeCharge: number;
  subtotalBeforeDiscounts: number;
  totalCost: number;
  estimatedHours: number;
  isLoading: boolean;
}

const CARPET_DISCOUNT_PERCENTAGE = 0.20; // 20% off carpet when combined
const FIRST_TIME_DISCOUNT_PERCENTAGE = 0.10; // 10% off for first-time customers

const useEndOfTenancyFieldConfigs = () => {
  return useQuery({
    queryKey: ['end-of-tenancy-field-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('end_of_tenancy_field_configs')
        .select('*')
        .eq('is_active', true)
        .order('category_order', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as FieldConfig[];
    },
  });
};

export const useEndOfTenancyCalculations = (
  data: EndOfTenancyCalculationInput,
  isFirstTimeCustomer: boolean = false
): EndOfTenancyCalculationResult => {
  const { data: fieldConfigs, isLoading } = useEndOfTenancyFieldConfigs();

  const calculations = useMemo(() => {
    if (!fieldConfigs || fieldConfigs.length === 0) {
      return {
        baseCost: 0,
        conditionPercentage: 0,
        furniturePercentage: 0,
        adjustedBaseCost: 0,
        ovenCleaningCost: 0,
        blindsTotal: 0,
        extrasTotal: 0,
        additionalServicesTotal: 0,
        steamCleaningTotal: 0,
        steamCleaningDiscount: 0,
        steamCleaningFinal: 0,
        firstTimeDiscount: 0,
        shortNoticeCharge: 0,
        subtotalBeforeDiscounts: 0,
        totalCost: 0,
        estimatedHours: 0,
        isLoading,
      };
    }

    // Helper to get config value by category and option
    const getConfigValue = (category: string, option: string): { value: number; time: number } => {
      const config = fieldConfigs.find(c => c.category === category && c.option === option);
      return {
        value: config?.value ?? 0,
        time: config?.time ?? 0,
      };
    };

    // 1. Calculate BASE COST (sum of fixed costs)
    let baseCost = 0;
    let totalTime = 0;

    // Property Type (Flat, House, House Share)
    if (data.propertyType) {
      const propertyTypeConfig = getConfigValue('property_type', data.propertyType);
      baseCost += propertyTypeConfig.value;
      totalTime += propertyTypeConfig.time;
    }

    // Bedrooms
    if (data.bedrooms) {
      const bedroomConfig = getConfigValue('bedrooms', data.bedrooms);
      baseCost += bedroomConfig.value;
      totalTime += bedroomConfig.time;
    }

    // Bathrooms
    if (data.bathrooms) {
      const bathroomConfig = getConfigValue('bathrooms', data.bathrooms);
      baseCost += bathroomConfig.value;
      totalTime += bathroomConfig.time;
    }

    // Kitchen layout (separate kitchen adds extra)
    if (data.kitchenLivingSeparate === true) {
      const kitchenConfig = getConfigValue('kitchen_living_layout', 'separate');
      baseCost += kitchenConfig.value;
      totalTime += kitchenConfig.time;
    }

    // Additional rooms
    if (data.additionalRooms && data.additionalRooms.length > 0) {
      data.additionalRooms.forEach(room => {
        const roomConfig = getConfigValue('additional_rooms', room);
        baseCost += roomConfig.value;
        totalTime += roomConfig.time;
      });
    }

    // House share areas
    if (data.propertyType === 'house-share' && data.houseShareAreas && data.houseShareAreas.length > 0) {
      data.houseShareAreas.forEach(area => {
        const areaConfig = getConfigValue('house_share_areas', area);
        baseCost += areaConfig.value;
        totalTime += areaConfig.time;
      });
    }

    // Additional services (Balcony, Garage, Waste Removal, etc.) - tracked separately for display
    let additionalServicesTotal = 0;
    let additionalServicesTime = 0;
    if (data.additionalServices && data.additionalServices.length > 0) {
      data.additionalServices.forEach(service => {
        const serviceConfig = getConfigValue('additional_services', service);
        additionalServicesTotal += serviceConfig.value;
        additionalServicesTime += serviceConfig.time;
      });
      totalTime += additionalServicesTime;
    }

    // Oven cleaning - stored separately as it's a fixed add-on not affected by percentages
    // Note: "no_oven_cleaning" has a negative value (-30) to deduct from total since single oven is included in base price
    let ovenCleaningCost = 0;
    let ovenCleaningTime = 0;
    if (data.ovenType && data.ovenType !== 'none') {
      const ovenConfig = getConfigValue('oven_cleaning', data.ovenType);
      ovenCleaningCost = ovenConfig.value; // Can be negative for "no_oven_cleaning"
      ovenCleaningTime = ovenConfig.time;
      totalTime += ovenCleaningTime;
    }

    // 2. Get PERCENTAGE adjustments for property condition and furniture status
    let conditionPercentage = 0;
    let conditionTime = 0;
    if (data.propertyCondition) {
      const conditionConfig = getConfigValue('property_condition', data.propertyCondition);
      conditionPercentage = conditionConfig.value; // This is stored as percentage (e.g., 20 for 20%)
      conditionTime = conditionConfig.time;
    }

    let furniturePercentage = 0;
    let furnitureTime = 0;
    if (data.furnitureStatus) {
      const furnitureConfig = getConfigValue('furniture_status', data.furnitureStatus);
      furniturePercentage = furnitureConfig.value;
      furnitureTime = furnitureConfig.time;
    }

    // 3. Apply percentages to base cost
    const totalPercentageIncrease = (conditionPercentage + furniturePercentage) / 100;
    const adjustedBaseCost = baseCost * (1 + totalPercentageIncrease);
    const adjustedTime = totalTime + conditionTime + furnitureTime;

    // 4. Calculate EXTRAS (not affected by condition/furniture percentages)
    
    // Blinds
    const blindsTotal = (data.blindsItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Extra services
    const extrasTotal = (data.extraServices || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 5. Calculate STEAM CLEANING with 20% discount
    const steamCleaningTotal = 
      (data.carpetItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0) +
      (data.upholsteryItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0) +
      (data.mattressItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const steamCleaningDiscount = steamCleaningTotal * CARPET_DISCOUNT_PERCENTAGE;
    const steamCleaningFinal = steamCleaningTotal - steamCleaningDiscount;

    // 6. Calculate subtotal before first-time discount
    // Oven cleaning and additional services are added as fixed costs, not affected by condition/furniture percentages
    const shortNoticeCharge = data.shortNoticeCharge || 0;
    const subtotalBeforeDiscounts = adjustedBaseCost + ovenCleaningCost + blindsTotal + extrasTotal + additionalServicesTotal + steamCleaningFinal + shortNoticeCharge;

    // 7. Apply 10% first-time customer discount
    const firstTimeDiscount = isFirstTimeCustomer ? subtotalBeforeDiscounts * FIRST_TIME_DISCOUNT_PERCENTAGE : 0;
    const totalCost = subtotalBeforeDiscounts - firstTimeDiscount;

    // Convert time from minutes to hours
    const estimatedHours = adjustedTime / 60;

    return {
      baseCost,
      conditionPercentage,
      furniturePercentage,
      adjustedBaseCost,
      ovenCleaningCost,
      blindsTotal,
      extrasTotal,
      additionalServicesTotal,
      steamCleaningTotal,
      steamCleaningDiscount,
      steamCleaningFinal,
      firstTimeDiscount,
      shortNoticeCharge,
      subtotalBeforeDiscounts,
      totalCost,
      estimatedHours,
      isLoading,
    };
  }, [fieldConfigs, data, isFirstTimeCustomer, isLoading]);

  return calculations;
};
