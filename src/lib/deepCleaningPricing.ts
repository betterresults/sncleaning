export const DEEP_CLEANING_OCCUPIED_SURCHARGE = 0.10;
export const DEEP_CLEANING_MIN_HOURS = 2;
export const EQUIPMENT_INCLUDED_HOURS = 6;

export type DeepCleaningPricingMode = 'hourly' | 'property';

export interface DeepCleaningEotPortion {
  adjustedBaseCost: number;
  ovenCleaningCost: number;
  blindsTotal: number;
  extrasTotal: number;
  additionalServicesTotal: number;
  steamCleaningFinal: number;
  shortNoticeCharge: number;
  estimatedHours: number;
}

export interface DeepCleaningPricingInput {
  eot: DeepCleaningEotPortion;
  pricingMode: DeepCleaningPricingMode;
  hourlyHours: number;
  hourlyRate: number;
  wantsEquipment: boolean;
  equipmentOneOffCost: number;
}

export interface DeepCleaningPricingResult {
  pricingMode: DeepCleaningPricingMode;
  hourlyRate: number;
  hourlyHours: number;
  hourlyCost: number;
  propertyPortion: number;
  occupiedSurcharge: number;
  extrasTotal: number;
  estimatedHours: number;
  equipmentIncluded: boolean;
  equipmentCost: number;
  equipmentOneOffCost: number;
  totalCost: number;
}

const roundMoney = (value: number): number => Math.round(value * 100) / 100;
const roundHours = (value: number): number => Math.round(value * 100) / 100;

export function applyDeepCleaningPricing({
  eot,
  pricingMode,
  hourlyHours,
  hourlyRate,
  wantsEquipment,
  equipmentOneOffCost,
}: DeepCleaningPricingInput): DeepCleaningPricingResult {
  const extrasTotal =
    (eot.ovenCleaningCost || 0) +
    (eot.blindsTotal || 0) +
    (eot.extrasTotal || 0) +
    (eot.additionalServicesTotal || 0) +
    (eot.steamCleaningFinal || 0) +
    (eot.shortNoticeCharge || 0);

  let hourlyCost = 0;
  let occupiedSurcharge = 0;
  let propertyPortion = 0;
  let estimatedHours = 0;

  if (pricingMode === 'hourly') {
    estimatedHours = Math.max(hourlyHours || 0, 0);
    hourlyCost = estimatedHours * (hourlyRate || 0);
  } else {
    occupiedSurcharge = (eot.adjustedBaseCost || 0) * DEEP_CLEANING_OCCUPIED_SURCHARGE;
    propertyPortion = (eot.adjustedBaseCost || 0) + occupiedSurcharge;
    estimatedHours = (eot.estimatedHours || 0) * (1 + DEEP_CLEANING_OCCUPIED_SURCHARGE);
  }

  const equipmentIncluded = estimatedHours >= EQUIPMENT_INCLUDED_HOURS;
  const equipmentCost = equipmentIncluded || !wantsEquipment ? 0 : equipmentOneOffCost || 0;
  const cleaningPortion = pricingMode === 'hourly' ? hourlyCost : propertyPortion;

  return {
    pricingMode,
    hourlyRate: hourlyRate || 0,
    hourlyHours: pricingMode === 'hourly' ? estimatedHours : hourlyHours || 0,
    hourlyCost: roundMoney(hourlyCost),
    propertyPortion: roundMoney(propertyPortion),
    occupiedSurcharge: roundMoney(occupiedSurcharge),
    extrasTotal: roundMoney(extrasTotal),
    estimatedHours: roundHours(estimatedHours),
    equipmentIncluded,
    equipmentCost: roundMoney(equipmentCost),
    equipmentOneOffCost: equipmentOneOffCost || 0,
    totalCost: roundMoney(cleaningPortion + extrasTotal + equipmentCost),
  };
}
