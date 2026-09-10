import { describe, expect, it } from 'vitest';
import { applyDeepCleaningPricing } from './deepCleaningPricing';

const eotBase = {
  adjustedBaseCost: 266.25,
  ovenCleaningCost: 0,
  blindsTotal: 0,
  extrasTotal: 0,
  additionalServicesTotal: 0,
  steamCleaningFinal: 89,
  shortNoticeCharge: 0,
  estimatedHours: 4.3,
};

describe('applyDeepCleaningPricing', () => {
  it('adds 10% only to the furnished EOT property portion', () => {
    const result = applyDeepCleaningPricing({
      eot: eotBase,
      pricingMode: 'property',
      hourlyHours: 2,
      hourlyRate: 25,
      wantsEquipment: false,
      equipmentOneOffCost: 29,
    });

    expect(result.occupiedSurcharge).toBe(26.63);
    expect(result.propertyPortion).toBe(292.88);
    expect(result.extrasTotal).toBe(89);
    expect(result.totalCost).toBe(381.88);
    expect(result.estimatedHours).toBe(4.73);
    expect(result.equipmentIncluded).toBe(false);
    expect(result.equipmentCost).toBe(0);
  });

  it('prices hourly work at the domestic one-time rate plus unchanged extras', () => {
    const result = applyDeepCleaningPricing({
      eot: { ...eotBase, adjustedBaseCost: 0, estimatedHours: 0, ovenCleaningCost: 49 },
      pricingMode: 'hourly',
      hourlyHours: 3,
      hourlyRate: 25,
      wantsEquipment: true,
      equipmentOneOffCost: 29,
    });

    expect(result.hourlyCost).toBe(75);
    expect(result.extrasTotal).toBe(138);
    expect(result.equipmentCost).toBe(29);
    expect(result.totalCost).toBe(242);
    expect(result.equipmentIncluded).toBe(false);
  });

  it('includes equipment at no extra charge once hours reach 6', () => {
    const result = applyDeepCleaningPricing({
      eot: { ...eotBase, adjustedBaseCost: 0, estimatedHours: 0, steamCleaningFinal: 0 },
      pricingMode: 'hourly',
      hourlyHours: 6,
      hourlyRate: 25,
      wantsEquipment: true,
      equipmentOneOffCost: 29,
    });

    expect(result.equipmentIncluded).toBe(true);
    expect(result.equipmentCost).toBe(0);
    expect(result.totalCost).toBe(150);
  });
});
