import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { DomesticBookingData } from './DomesticBookingForm';
import { Home, Clock, Calendar, PoundSterling, ChevronDown, ChevronUp, Edit2, Info, Tag } from 'lucide-react';
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
  storedQuotePrice?: number | null; // Exact price from quote link - use this if not modified
  hasModifiedAfterLoad?: boolean; // Whether user modified the form after loading quote
}

export const DomesticBookingSummary: React.FC<DomesticBookingSummaryProps> = ({
  data,
  isAdminMode = false,
  onUpdate,
  storedQuotePrice = null,
  hasModifiedAfterLoad = false
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
      'biweekly': 'Bi-Weekly Cleaning',
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
    // If we have a stored quote price from a quote link and user hasn't modified the form, use it directly
    if (storedQuotePrice && !hasModifiedAfterLoad) {
      return storedQuotePrice;
    }
    
    // Use admin override if set (works in admin mode AND for resumed admin quotes)
    if (data.adminTotalCostOverride !== undefined && data.adminTotalCostOverride !== null && data.adminTotalCostOverride > 0) {
      return data.adminTotalCostOverride;
    }
    
    // If first deep clean is selected, use the first deep clean cost for the first booking
    // NOTE: First-time customer discount (10%) does NOT apply to first deep clean
    // It only applies to weekly recurring cleans
    if (calculations.wantsFirstDeepClean) {
      let total = calculations.firstDeepCleanCost;
      
      if (isAdminMode && data.adminRemoveShortNoticeCharge) {
        total -= calculations.shortNoticeCharge || 0;
      }
      
      // Do NOT apply first-time customer discount to first deep clean
      // The discount only applies to recurring weekly/bi-weekly/monthly cleans
      
      // Apply admin discounts
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
    
    // Apply new client 10% discount FIRST (before admin adjustments)
    if (data.isFirstTimeCustomer) {
      total = total * 0.90;
    }
    
    // Apply admin discounts AFTER the first-time discount (so admin sees £X and subtracts £Y to get £X-Y)
    const subtotalAfterFirstTime = total;
    if (isAdminMode && data.adminDiscountPercentage) {
      total -= subtotalAfterFirstTime * data.adminDiscountPercentage / 100;
    }
    if (isAdminMode && data.adminDiscountAmount) {
      total -= data.adminDiscountAmount;
    }
    
    return Math.max(0, total);
  };
  
  // Calculate subtotal before first-time discount (for display purposes)
  // This shows the price BEFORE the 10% first-time customer discount
  // Admin discounts are applied AFTER first-time discount, so they're not included here
  const calculateSubtotalBeforeFirstTimeDiscount = () => {
    if (isAdminMode && data.adminTotalCostOverride !== undefined && data.adminTotalCostOverride !== null) {
      // When total is overridden, we can't show a meaningful "before discount" price
      // Return the override value (the 10% banner won't show in this case anyway due to override)
      return data.adminTotalCostOverride;
    }
    
    // If first deep clean is selected, use the first deep clean cost
    if (calculations.wantsFirstDeepClean) {
      let total = calculations.firstDeepCleanCost;
      
      if (isAdminMode && data.adminRemoveShortNoticeCharge) {
        total -= calculations.shortNoticeCharge || 0;
      }
      
      // Don't include admin discounts here - they're applied after first-time discount
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
    
    // Don't include admin discounts here - they're applied after first-time discount
    return Math.max(0, total);
  };

  const shortNoticeInfo = getShortNoticeInfo();
  const hasShortNoticeCharge = shortNoticeInfo.charge > 0 && !(isAdminMode && data.adminRemoveShortNoticeCharge);
  const effectiveHourlyRate = data.adminHourlyRateOverride !== undefined ? data.adminHourlyRateOverride : calculations.hourlyRate;
  
  // Calculate the effective per-hour rate after discounts for display purposes
  const getDisplayHourlyRate = () => {
    if (calculations.totalHours <= 0) return effectiveHourlyRate;
    
    // Start with base rate
    let rate = effectiveHourlyRate;
    
    // If first-time customer, apply 10% discount to the rate
    if (data.isFirstTimeCustomer) {
      rate = rate * 0.90;
    }
    
    // If admin percentage discount, apply it to the rate
    if (isAdminMode && data.adminDiscountPercentage) {
      rate = rate * (1 - data.adminDiscountPercentage / 100);
    }
    
    // If admin fixed discount, distribute it across hours
    if (isAdminMode && data.adminDiscountAmount && calculations.totalHours > 0) {
      rate = rate - (data.adminDiscountAmount / calculations.totalHours);
    }
    
    return Math.max(0, rate);
  };
  
  const displayHourlyRate = getDisplayHourlyRate();

  useEffect(() => {
    if (onUpdate && calculations.totalHours > 0) {
      const calculatedTotal = calculateTotal();
      const updates: Partial<DomesticBookingData> = {};
      
      // Sync totalCost if changed
      if (calculatedTotal !== data.totalCost) {
        updates.totalCost = calculatedTotal;
      }
      
      // CRITICAL: Sync estimatedHours so it's available for quote emails
      if (calculations.totalHours !== data.estimatedHours) {
        updates.estimatedHours = calculations.totalHours;
      }
      
      // Sync shortNoticeCharge if changed
      if (shortNoticeInfo.charge !== data.shortNoticeCharge) {
        updates.shortNoticeCharge = shortNoticeInfo.charge;
      }
      
      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
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
    <Card className="p-4 sm:p-5 lg:p-6 bg-white sticky top-4 border border-border">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
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
              <p className="font-medium text-foreground">
                {calculations.firstDeepCleanHours}h first clean, then {calculations.totalHours}h {data.serviceFrequency} cleans
              </p>
            ) : (
              <p className="font-medium text-foreground">
                {calculations.totalHours} hour{calculations.totalHours !== 1 ? 's' : ''}{getFrequencyDescription() ? ` ${getFrequencyDescription()}` : ''}
              </p>
            )}
            {isAdminMode && (
              <p className="text-sm text-muted-foreground">
                £{displayHourlyRate.toFixed(2)}/hour
                {(data.isFirstTimeCustomer || data.adminDiscountPercentage || data.adminDiscountAmount) && displayHourlyRate < effectiveHourlyRate && (
                  <span className="ml-1 line-through text-gray-400">£{effectiveHourlyRate.toFixed(2)}</span>
                )}
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
          {data.serviceFrequency && data.serviceFrequency !== 'onetime' && (data.adminDiscountAmount || data.adminDiscountPercentage) && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="apply-discount-recurring"
                checked={data.adminApplyDiscountToRecurring || false}
                onChange={(e) => onUpdate({ adminApplyDiscountToRecurring: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="apply-discount-recurring" className="text-sm cursor-pointer">
                Apply discount to recurring bookings
              </Label>
            </div>
          )}
        </div>
      )}

      {data.serviceFrequency && (
        <div className="mt-4 space-y-3">
          
          {/* Quoted price badge - show when using admin override */}
          {!isAdminMode && data.adminTotalCostOverride && data.adminTotalCostOverride > 0 && (
            <div className="flex items-center justify-center p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Your Quoted Price</span>
              </div>
            </div>
          )}
          
          {/* First-time discount banner - only show when NOT using quoted price */}
          {data.isFirstTimeCustomer && !(data.adminTotalCostOverride && data.adminTotalCostOverride > 0) && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">New clients 10% off</span>
              </div>
              <span className="text-sm font-bold text-green-600">
                -£{(calculateSubtotalBeforeFirstTimeDiscount() * 0.10).toFixed(2)}
              </span>
            </div>
          )}
          
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">
              {calculations.wantsFirstDeepClean ? 'First Clean' : 'Total'}
            </span>
            <div className="text-right">
              {data.isFirstTimeCustomer && !(data.adminTotalCostOverride && data.adminTotalCostOverride > 0) && (
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
                  {calculations.wantsFirstDeepClean ? 'Regular' : 'Upcoming'} {data.serviceFrequency === 'weekly' 
                    ? 'Weekly' 
                    : data.serviceFrequency === 'biweekly' 
                      ? 'Bi-Weekly' 
                      : 'Monthly'} Cleans
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
                        recurringTotal = recurringTotal * 0.90;
                      }
                      // Apply admin discounts to recurring if option is checked
                      if (isAdminMode && data.adminApplyDiscountToRecurring) {
                        if (data.adminDiscountPercentage) {
                          recurringTotal -= recurringTotal * data.adminDiscountPercentage / 100;
                        }
                        if (data.adminDiscountAmount) {
                          recurringTotal -= data.adminDiscountAmount;
                        }
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
                    // Apply new client 10% discount to recurring as well
                    if (data.isFirstTimeCustomer) {
                      recurringTotal = recurringTotal * 0.90;
                    }
                    // Apply admin discounts to recurring if option is checked
                    if (isAdminMode && data.adminApplyDiscountToRecurring) {
                      if (data.adminDiscountPercentage) {
                        recurringTotal -= recurringTotal * data.adminDiscountPercentage / 100;
                      }
                      if (data.adminDiscountAmount) {
                        recurringTotal -= data.adminDiscountAmount;
                      }
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