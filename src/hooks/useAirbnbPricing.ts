import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PricingRule {
  id: string;
  field_name: string;
  field_value: string;
  base_cost: number;
  multiplier_factor: number;
  is_active: boolean;
  pricing_rules: any;
}

export interface CostBreakdown {
  propertyType: number;
  bedrooms: number;
  bathrooms: number;
  serviceType: number;
  cleaningProducts: number;
  ironing: number;
  sameDayMultiplier: number;
  subtotal: number;
  total: number;
}

export const useAirbnbPricing = () => {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPricingRules = async () => {
    try {
      const { data, error } = await supabase
        .from('airbnb_field_pricing')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPricingRules(data || []);
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = (formData: {
    propertyType: string;
    bedrooms: string;
    bathrooms: string;
    serviceType: string;
    cleaningProducts: string;
    ironingRequired: boolean;
    isSameDayCleaning: boolean;
  }): CostBreakdown => {
    const breakdown: CostBreakdown = {
      propertyType: 0,
      bedrooms: 0,
      bathrooms: 0,
      serviceType: 0,
      cleaningProducts: 0,
      ironing: 0,
      sameDayMultiplier: 0,
      subtotal: 0,
      total: 0
    };

    if (!pricingRules.length) return breakdown;

    // Get base costs
    const propertyRule = pricingRules.find(r => r.field_name === 'property_type' && r.field_value === formData.propertyType);
    const bedroomRule = pricingRules.find(r => r.field_name === 'bedrooms' && r.field_value === formData.bedrooms);
    const bathroomRule = pricingRules.find(r => r.field_name === 'bathrooms' && r.field_value === formData.bathrooms);
    const serviceRule = pricingRules.find(r => r.field_name === 'service_type' && r.field_value === formData.serviceType);
    const productsRule = pricingRules.find(r => r.field_name === 'cleaning_products' && r.field_value === formData.cleaningProducts);
    const ironingRule = pricingRules.find(r => r.field_name === 'ironing_required' && r.field_value === formData.ironingRequired.toString());
    const sameDayRule = pricingRules.find(r => r.field_name === 'same_day_cleaning' && r.field_value === formData.isSameDayCleaning.toString());

    breakdown.propertyType = propertyRule?.base_cost || 0;
    breakdown.bedrooms = bedroomRule?.base_cost || 0;
    breakdown.bathrooms = bathroomRule?.base_cost || 0;
    breakdown.serviceType = serviceRule?.base_cost || 0;
    breakdown.cleaningProducts = productsRule?.base_cost || 0;
    breakdown.ironing = ironingRule?.base_cost || 0;

    // Calculate subtotal
    breakdown.subtotal = breakdown.propertyType + breakdown.bedrooms + breakdown.bathrooms + 
                       breakdown.serviceType + breakdown.cleaningProducts + breakdown.ironing;

    // Apply service type multiplier
    const serviceMultiplier = serviceRule?.multiplier_factor || 1;
    breakdown.subtotal *= serviceMultiplier;

    // Apply same day multiplier
    const sameDayMultiplier = sameDayRule?.multiplier_factor || 1;
    breakdown.sameDayMultiplier = breakdown.subtotal * (sameDayMultiplier - 1);
    breakdown.total = breakdown.subtotal + breakdown.sameDayMultiplier;

    return breakdown;
  };

  useEffect(() => {
    fetchPricingRules();
  }, []);

  return {
    pricingRules,
    loading,
    calculateCost,
    refetchPricing: fetchPricingRules
  };
};