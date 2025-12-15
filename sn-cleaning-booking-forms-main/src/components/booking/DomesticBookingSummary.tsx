import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { DomesticBookingData } from './DomesticBookingForm';
import { Home, Clock, Calendar, PoundSterling, ChevronDown, ChevronUp, Edit2, Info, Tag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDomesticHardcodedCalculations } from '@/hooks/useDomesticHardcodedCalculations';
import { Badge } from '@/components/ui/badge';

interface DomesticBookingSummaryProps {
  data: DomesticBookingData;
  isAdminMode?: boolean;
  onUpdate?: (updates: Partial<DomesticBookingData>) => void;
}

export const DomesticBookingSummary: React.FC<DomesticBookingSummaryProps> = ({
  data,
  isAdminMode = false,
  onUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingPricing, setIsEditingPricing] = useState(false);

  const calculations = useDomesticHardcodedCalculations(data);

  const getPropertyDescription = () => {
    if (!data.propertyType || !data.bedrooms) return '';
    const propertyType = data.propertyType.charAt(0).toUpperCase() + data.propertyType.slice(1);
    let bedroomText = '';
    if (data.bedrooms === 'studio') {
      bedroomText = 'Studio';
    } else {
      bedroomText = `${data.bedrooms} Bedroom${data.bedrooms !== '1' ? 's' : ''}`;
    }

    let bathroomText = '';
    if (data.bathrooms) {
      bathroomText = `, ${data.bathrooms} Bathroom${data.bathrooms !== '1' ? 's' : ''}`;
    }
    return `${propertyType} ${bedroomText}${bathroomText}`;
  };

  const getFrequencyDescription = () => {
    if (!data.serviceFrequency) return '';
    const frequencyTypes: Record<string, string> = {
      'weekly': 'Weekly Cleaning',
      'biweekly': 'Biweekly Cleaning',
      'monthly': 'Monthly Cleaning',
      'onetime': 'One-time Cleaning'
    };
    return frequencyTypes[data.serviceFrequency] || '';
  };

  const getShortNoticeInfo = () => {
    if (!data.selectedDate || calculations.shortNoticeCharge === 0) {
      return { charge: 0, notice: '', hoursUntil: 0 };
    }
    const now = new Date();
    const cleaningDate = new Date(data.selectedDate);
    const isToday = cleaningDate.getDate() === now.getDate() && 
                    cleaningDate.getMonth() === now.getMonth() && 
                    cleaningDate.getFullYear() === now.getFullYear();
    
    if (data.selectedTime) {
      const timeStr = data.selectedTime.replace(/[AP]M/, '').trim();
      const [hours, minutes] = timeStr.split(':').map(Number);
      let adjustedHours = hours;
      if (data.selectedTime.includes('PM') && hours !== 12) adjustedHours += 12;
      if (data.selectedTime.includes('AM') && hours === 12) adjustedHours = 0;
      cleaningDate.setHours(adjustedHours, minutes || 0, 0, 0);
    } else {
      cleaningDate.setHours(9, 0, 0, 0);
    }
    
    const hoursUntilCleaning = (cleaningDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (isToday) {
      return { charge: calculations.shortNoticeCharge, notice: 'Same day booking (within 12 hours)', hoursUntil: hoursUntilCleaning };
    }
    if (hoursUntilCleaning <= 24) {
      return { charge: calculations.shortNoticeCharge, notice: 'Short notice booking (within 24 hours)', hoursUntil: hoursUntilCleaning };
    }
    if (hoursUntilCleaning <= 48) {
      return { charge: calculations.shortNoticeCharge, notice: 'Short notice booking (within 48 hours)', hoursUntil: hoursUntilCleaning };
    }
    return { charge: calculations.shortNoticeCharge, notice: '', hoursUntil: hoursUntilCleaning };
  };

  const calculateTotal = () => {
    if (isAdminMode && data.adminTotalCostOverride !== undefined && data.adminTotalCostOverride !== null) {
      return data.adminTotalCostOverride;
    }
    
    // If first deep clean is selected, use the first deep clean cost for the first booking
    if (calculations.wantsFirstDeepClean) {
      let total = calculations.firstDeepCleanCost;
      
      if (isAdminMode && data.adminRemoveShortNoticeCharge) {
        total -= calculations.shortNoticeCharge || 0;
      }
      
      if (isAdminMode && data.adminDiscountPercentage) {
        total -= total * data.adminDiscountPercentage / 100;
      }
      if (isAdminMode && data.adminDiscountAmount) {
        total -= data.adminDiscountAmount;
      }
      
      // Apply new client 15% discount
      if (data.isFirstTimeCustomer) {
        total = total * 0.85;
      }
      
      return Math.max(0, total);
    }
    
    const effectiveRate = data.adminHourlyRateOverride !== undefined ? data.adminHourlyRateOverride : calculations.hourlyRate;
    let total = (calculations.totalHours || 0) * effectiveRate;

    if (!(isAdminMode && data.adminRemoveShortNoticeCharge)) {
      total += shortNoticeInfo.charge;
    }

    total += calculations.equipmentOneTimeCost || 0;
    total += calculations.ovenCleaningCost || 0;
    
    const additionalCharges = calculations.modifierDetails
      ?.filter((m: any) => m.type === 'additional')
      .reduce((sum: number, m: any) => sum + m.amount, 0) || 0;
    const discounts = calculations.modifierDetails
      ?.filter((m: any) => m.type === 'discount')
      .reduce((sum: number, m: any) => sum + m.amount, 0) || 0;
    
    total += additionalCharges - discounts;
    const subtotal = total;

    if (isAdminMode && data.adminDiscountPercentage) {
      total -= subtotal * data.adminDiscountPercentage / 100;
    }
    if (isAdminMode && data.adminDiscountAmount) {
      total -= data.adminDiscountAmount;
    }
    
    // Apply new client 15% discount
    if (data.isFirstTimeCustomer) {
      total = total * 0.85;
    }
    
    return Math.max(0, total);
  };
  
  // Calculate subtotal before first-time discount (for display purposes)
  const calculateSubtotalBeforeFirstTimeDiscount = () => {
    if (isAdminMode && data.adminTotalCostOverride !== undefined && data.adminTotalCostOverride !== null) {
      return data.adminTotalCostOverride;
    }
    
    // If first deep clean is selected, use the first deep clean cost
    if (calculations.wantsFirstDeepClean) {
      let total = calculations.firstDeepCleanCost;
      
      if (isAdminMode && data.adminRemoveShortNoticeCharge) {
        total -= calculations.shortNoticeCharge || 0;
      }
      
      if (isAdminMode && data.adminDiscountPercentage) {
        total -= total * data.adminDiscountPercentage / 100;
      }
      if (isAdminMode && data.adminDiscountAmount) {
        total -= data.adminDiscountAmount;
      }
      
      return Math.max(0, total);
    }
    
    const effectiveRate = data.adminHourlyRateOverride !== undefined ? data.adminHourlyRateOverride : calculations.hourlyRate;
    let total = (calculations.totalHours || 0) * effectiveRate;

    if (!(isAdminMode && data.adminRemoveShortNoticeCharge)) {
      total += shortNoticeInfo.charge;
    }

    total += calculations.equipmentOneTimeCost || 0;
    total += calculations.ovenCleaningCost || 0;
    
    const additionalCharges = calculations.modifierDetails
      ?.filter((m: any) => m.type === 'additional')
      .reduce((sum: number, m: any) => sum + m.amount, 0) || 0;
    const discounts = calculations.modifierDetails
      ?.filter((m: any) => m.type === 'discount')
      .reduce((sum: number, m: any) => sum + m.amount, 0) || 0;
    
    total += additionalCharges - discounts;
    const subtotal = total;

    if (isAdminMode && data.adminDiscountPercentage) {
      total -= subtotal * data.adminDiscountPercentage / 100;
    }
    if (isAdminMode && data.adminDiscountAmount) {
      total -= data.adminDiscountAmount;
    }
    
    return Math.max(0, total);
  };

  const shortNoticeInfo = getShortNoticeInfo();
  const hasShortNoticeCharge = shortNoticeInfo.charge > 0 && !(isAdminMode && data.adminRemoveShortNoticeCharge);
  const effectiveHourlyRate = data.adminHourlyRateOverride !== undefined ? data.adminHourlyRateOverride : calculations.hourlyRate;

  useEffect(() => {
    if (onUpdate && calculations.totalHours > 0) {
      const calculatedTotal = calculateTotal();
      if (calculatedTotal !== data.totalCost) {
        onUpdate({ totalCost: calculatedTotal });
      }
    }
  }, [
    calculations.totalHours,
    calculations.hourlyRate,
    calculations.equipmentOneTimeCost,
    calculations.ovenCleaningCost,
    data.adminHourlyRateOverride,
    data.adminTotalCostOverride,
    data.adminDiscountPercentage,
    data.adminDiscountAmount,
    data.adminRemoveShortNoticeCharge,
    shortNoticeInfo.charge,
    data.isFirstTimeCustomer,
    calculations.wantsFirstDeepClean,
    calculations.firstDeepCleanCost,
  ]);

  const renderSummaryContent = () => (
    <div className="space-y-3">

      {data.selectedDate && (
        <div className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Clean date</span>
            <span className="text-foreground font-medium">
              {data.selectedDate.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              })}
            </span>
          </div>
          
          {(data.selectedTime || data.flexibility === 'flexible-time') && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Arrival time</span>
              <span className="text-foreground font-medium">
                {data.flexibility === 'flexible-time' ? 'Flexible timing' : data.selectedTime}
              </span>
            </div>
          )}
        </div>
      )}

      {calculations.equipmentOneTimeCost > 0 && (
        <div className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Equipment delivery (one-time)</span>
            <span className="text-foreground font-semibold">
              £{calculations.equipmentOneTimeCost.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {data.ovenType && data.ovenType !== 'dontneed' && data.ovenType !== '' && (
        <div className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {data.ovenType.charAt(0).toUpperCase() + data.ovenType.slice(1)} oven cleaning
            </span>
            <span className="text-foreground font-semibold">
              Included
            </span>
          </div>
        </div>
      )}

      {data.additionalRooms && Object.entries(data.additionalRooms).map(([type, count]) => {
        if (count === 0) return null;
        const labels: Record<string, string> = {
          toilets: 'Extra Toilet',
          studyRooms: 'Study Room',
          utilityRooms: 'Utility Room',
          otherRooms: 'Other Room'
        };
        const label = labels[type];
        return (
          <div key={type} className="flex justify-between items-center pl-4">
            <span className="text-muted-foreground">
              {label}{count > 1 ? 's' : ''} ({count})
            </span>
            <span className="text-foreground font-semibold">Included</span>
          </div>
        );
      }).filter(Boolean)}

      {shortNoticeInfo.charge > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{shortNoticeInfo.notice}</span>
          <span className={`font-semibold ${isAdminMode && data.adminRemoveShortNoticeCharge ? 'line-through text-gray-400' : 'text-foreground'}`}>
            {isAdminMode && data.adminRemoveShortNoticeCharge && (
              <span className="text-green-600 mr-2 no-underline">WAIVED</span>
            )}
            £{shortNoticeInfo.charge.toFixed(2)}
          </span>
        </div>
      )}
      
      {calculations.modifierDetails && calculations.modifierDetails
        .filter((m: any) => m.type === 'additional')
        .map((modifier: any, idx: number) => (
          <div key={`additional-${idx}`} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Extra charge</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" aria-label="Extra charge info" className="focus:outline-none">
                    <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-xs">
                  <p className="text-sm font-medium">{modifier.label}</p>
                </PopoverContent>
              </Popover>
            </div>
            <span className="text-foreground font-semibold">
              £{modifier.amount.toFixed(2)}
            </span>
          </div>
        ))}
      
      {calculations.modifierDetails && calculations.modifierDetails
        .filter((m: any) => m.type === 'discount')
        .map((modifier: any, idx: number) => (
          <div key={`discount-${idx}`} className="flex justify-between items-center text-green-600">
            <div className="flex items-center gap-2">
              <span>Discount</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" aria-label="Discount info" className="focus:outline-none">
                    <Info className="w-4 h-4 cursor-pointer" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-xs">
                  <p className="text-sm font-medium">{modifier.label}</p>
                </PopoverContent>
              </Popover>
            </div>
            <span className="font-semibold">
              -£{modifier.amount.toFixed(2)}
            </span>
          </div>
        ))}
      
      {isAdminMode && data.adminDiscountPercentage && data.adminDiscountPercentage > 0 && (
        <div className="flex justify-between items-center text-red-600">
          <span>Discount ({data.adminDiscountPercentage}%)</span>
          <span className="font-semibold">
            -£{((calculateTotal() / (1 - data.adminDiscountPercentage / 100)) * data.adminDiscountPercentage / 100).toFixed(2)}
          </span>
        </div>
      )}
      
      {isAdminMode && data.adminDiscountAmount && data.adminDiscountAmount > 0 && (
        <div className="flex justify-between items-center text-red-600">
          <span>Fixed Discount</span>
          <span className="font-semibold">-£{data.adminDiscountAmount.toFixed(2)}</span>
        </div>
      )}
    </div>
  );

  return (
    <Card className="p-4 sm:p-5 lg:p-6 bg-white sticky top-4 shadow-[0_20px_60px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Booking Summary</h3>
        {isAdminMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingPricing(!isEditingPricing)}
            className="text-primary hover:bg-primary/10"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            {isEditingPricing ? 'Done' : 'Edit'}
          </Button>
        )}
      </div>

      {getPropertyDescription() && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Home className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{getPropertyDescription()}</p>
          </div>
        </div>
      )}

      {(calculations.totalHours ?? 0) > 0 && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            {calculations.wantsFirstDeepClean ? (
              <>
                <p className="font-medium text-foreground">
                  <span className="text-amber-600">{calculations.firstDeepCleanHours}h</span> first clean (deep), then {calculations.totalHours}h {getFrequencyDescription().toLowerCase() || 'per visit'}
                </p>
              </>
            ) : (
              <p className="font-medium text-foreground">
                {calculations.totalHours} hour{calculations.totalHours !== 1 ? 's' : ''}{getFrequencyDescription() ? ` ${getFrequencyDescription()}` : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mobile: Collapsible details */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full py-2 text-primary"
        >
          <span className="font-medium">View Details</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {isExpanded && (
          <div className="pt-2 border-t border-border">
            {renderSummaryContent()}
          </div>
        )}
      </div>

      {/* Desktop: Always visible */}
      <div className="hidden lg:block">
        {renderSummaryContent()}
      </div>

      {/* Admin pricing controls */}
      {isAdminMode && isEditingPricing && onUpdate && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div>
            <Label className="text-sm">Override Hourly Rate (£)</Label>
            <Input
              type="number"
              step="0.5"
              value={data.adminHourlyRateOverride ?? ''}
              onChange={(e) => onUpdate({ 
                adminHourlyRateOverride: e.target.value ? Number(e.target.value) : undefined 
              })}
              placeholder={`Default: £${calculations.hourlyRate.toFixed(2)}`}
            />
          </div>
          <div>
            <Label className="text-sm">Discount (%)</Label>
            <Input
              type="number"
              step="1"
              min="0"
              max="100"
              value={data.adminDiscountPercentage ?? ''}
              onChange={(e) => onUpdate({ 
                adminDiscountPercentage: e.target.value ? Number(e.target.value) : undefined 
              })}
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-sm">Fixed Discount (£)</Label>
            <Input
              type="number"
              step="1"
              min="0"
              value={data.adminDiscountAmount ?? ''}
              onChange={(e) => onUpdate({ 
                adminDiscountAmount: e.target.value ? Number(e.target.value) : undefined 
              })}
              placeholder="0"
            />
          </div>
          {shortNoticeInfo.charge > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="waive-short-notice"
                checked={data.adminRemoveShortNoticeCharge || false}
                onChange={(e) => onUpdate({ adminRemoveShortNoticeCharge: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="waive-short-notice" className="text-sm cursor-pointer">
                Waive short notice charge (£{shortNoticeInfo.charge.toFixed(2)})
              </Label>
            </div>
          )}
          <div>
            <Label className="text-sm">Override Total Cost (£)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={data.adminTotalCostOverride ?? ''}
              onChange={(e) => onUpdate({ 
                adminTotalCostOverride: e.target.value ? Number(e.target.value) : undefined 
              })}
              placeholder="Leave empty for calculated total"
            />
          </div>
        </div>
      )}

      {data.serviceFrequency && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {/* First Deep Clean Banner */}
          {calculations.wantsFirstDeepClean && (
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">First Deep Clean</span>
                <span className="text-xs text-amber-600">({calculations.firstDeepCleanHours}h @ £{calculations.oneTimeRate}/hr)</span>
              </div>
              <span className="text-sm font-bold text-amber-700">
                £{calculations.firstDeepCleanCost.toFixed(2)}
              </span>
            </div>
          )}
          
          {/* First-time discount banner */}
          {data.isFirstTimeCustomer && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">New clients 15% off</span>
              </div>
              <span className="text-sm font-bold text-green-600">
                -£{(calculateSubtotalBeforeFirstTimeDiscount() * 0.15).toFixed(2)}
              </span>
            </div>
          )}
          
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">
              {calculations.wantsFirstDeepClean ? 'First Clean' : 'Total'}
            </span>
            <div className="text-right">
              {data.isFirstTimeCustomer && (
                <span className="text-sm text-muted-foreground line-through mr-2">
                  £{calculateSubtotalBeforeFirstTimeDiscount().toFixed(2)}
                </span>
              )}
              <span className="text-2xl font-bold text-primary">
                £{calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Upcoming Cleanings - only show for recurring */}
          {data.serviceFrequency && data.serviceFrequency !== 'onetime' && (
            <div className="p-3 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {calculations.wantsFirstDeepClean ? 'Regular Cleans' : 'Upcoming'} ({data.serviceFrequency === 'weekly' 
                    ? 'Weekly' 
                    : data.serviceFrequency === 'biweekly' 
                      ? 'Biweekly' 
                      : 'Monthly'})
                  {data.serviceFrequency === 'weekly' && data.daysPerWeek > 1 && (
                    <span className="text-muted-foreground font-normal"> ({data.daysPerWeek}x/week)</span>
                  )}
                </span>
                <span className="text-lg font-bold text-foreground">
                  £{(() => {
                    // For first deep clean, use the regular recurring cost from calculations
                    if (calculations.wantsFirstDeepClean) {
                      let recurringTotal = calculations.regularRecurringCost;
                      // Apply first-time discount to recurring
                      if (data.isFirstTimeCustomer) {
                        recurringTotal = recurringTotal * 0.85;
                      }
                      // Multiply by days per week if more than 1
                      if (data.serviceFrequency === 'weekly' && data.daysPerWeek > 1) {
                        recurringTotal = recurringTotal * data.daysPerWeek;
                      }
                      return Math.max(0, recurringTotal).toFixed(2);
                    }
                    
                    // Original logic for non-deep-clean bookings
                    let recurringTotal = calculateSubtotalBeforeFirstTimeDiscount();
                    if (data.ovenCleaningScope === 'this-booking' && calculations.ovenCleaningCost > 0) {
                      recurringTotal -= calculations.ovenCleaningCost;
                    }
                    // Also exclude equipment one-time cost from recurring
                    if (calculations.equipmentOneTimeCost > 0) {
                      recurringTotal -= calculations.equipmentOneTimeCost;
                    }
                    // Exclude short notice charge from recurring
                    if (calculations.shortNoticeCharge > 0 && !(isAdminMode && data.adminRemoveShortNoticeCharge)) {
                      recurringTotal -= calculations.shortNoticeCharge;
                    }
                    // Apply new client 15% discount to recurring as well
                    if (data.isFirstTimeCustomer) {
                      recurringTotal = recurringTotal * 0.85;
                    }
                    // Multiply by days per week if more than 1
                    if (data.serviceFrequency === 'weekly' && data.daysPerWeek > 1) {
                      recurringTotal = recurringTotal * data.daysPerWeek;
                    }
                    return Math.max(0, recurringTotal).toFixed(2);
                  })()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default DomesticBookingSummary;