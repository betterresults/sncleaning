import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingData } from './AirbnbBookingForm';
import { Home, Clock, Calendar, PoundSterling, ChevronDown, ChevronUp, AlertTriangle, Edit2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAirbnbHardcodedCalculations } from '@/hooks/useAirbnbHardcodedCalculations';
import { useAirbnbPricingFormulas } from '@/hooks/useAirbnbPricingFormulas';
import { useCustomerPricingOverride } from '@/hooks/useCustomerPricingOverride';
interface BookingSummaryProps {
  data: BookingData;
  isAdminMode?: boolean;
  onUpdate?: (updates: Partial<BookingData>) => void;
}
const BookingSummary: React.FC<BookingSummaryProps> = ({
  data,
  isAdminMode = false,
  onUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingPricing, setIsEditingPricing] = useState(false);

  // Use hardcoded calculations
  const calculations = useAirbnbHardcodedCalculations(data);

  // Fetch formulas for admin view
  const {
    data: formulas = []
  } = useAirbnbPricingFormulas();

  // Fetch customer pricing override if customer is available
  const { data: customerOverride } = useCustomerPricingOverride(
    data.customerId || null,
    'airbnb-cleaning',
    data.serviceType || null
  );

  // Fetch linen products from database
  const {
    data: linenProducts = []
  } = useQuery({
    queryKey: ['linen-products'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('linen_products').select('*').eq('is_active', true).order('name', {
        ascending: true
      });
      if (error) throw error;
      return data;
    }
  });
  const getPropertyDescription = () => {
    if (!data.propertyType || !data.bedrooms) return '';
    const propertyType = data.propertyType.charAt(0).toUpperCase() + data.propertyType.slice(1);
    let bedroomText = '';
    if (data.bedrooms === 'studio') {
      bedroomText = 'Studio';
    } else {
      bedroomText = `${data.bedrooms} Bedroom${data.bedrooms !== '1' ? 's' : ''}`;
    }

    // Add bathrooms to the main description
    let bathroomText = '';
    if (data.bathrooms) {
      bathroomText = `, ${data.bathrooms} Bathroom${data.bathrooms !== '1' ? 's' : ''}`;
    }
    return `${propertyType} ${bedroomText}${bathroomText}`;
  };
  const getServiceDescription = () => {
    if (!data.serviceType) return '';
    const serviceTypes = {
      'checkin-checkout': 'Check-in/Check-out Cleaning',
      'midstay': 'Mid-stay Cleaning',
      'light': 'Light Cleaning',
      'deep': 'Deep Cleaning'
    };
    return serviceTypes[data.serviceType as keyof typeof serviceTypes] || '';
  };
  const getLinensDescription = () => {
    if (!data.linensHandling) return '';
    const linensTypes = {
      'customer-handles': 'Customer provides linens',
      'wash-hang': 'Wash and hang dry',
      'wash-dry': 'Wash and tumble dry',
      'order-linens': 'Order linens from us'
    };
    return linensTypes[data.linensHandling as keyof typeof linensTypes] || '';
  };

  // Get short notice info for display
  const getShortNoticeInfo = () => {
    if (!data.selectedDate || calculations.shortNoticeCharge === 0) {
      return {
        charge: 0,
        notice: '',
        hoursUntil: 0
      };
    }
    const now = new Date();
    const cleaningDate = new Date(data.selectedDate);
    const isToday = cleaningDate.getDate() === now.getDate() && cleaningDate.getMonth() === now.getMonth() && cleaningDate.getFullYear() === now.getFullYear();
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
      return {
        charge: calculations.shortNoticeCharge,
        notice: 'Same day booking (within 12 hours)',
        hoursUntil: hoursUntilCleaning
      };
    }
    if (hoursUntilCleaning <= 24) {
      return {
        charge: calculations.shortNoticeCharge,
        notice: 'Short notice booking (within 24 hours)',
        hoursUntil: hoursUntilCleaning
      };
    }
    if (hoursUntilCleaning <= 48) {
      return {
        charge: calculations.shortNoticeCharge,
        notice: 'Short notice booking (within 48 hours)',
        hoursUntil: hoursUntilCleaning
      };
    }
    return {
      charge: calculations.shortNoticeCharge,
      notice: '',
      hoursUntil: hoursUntilCleaning
    };
  };

  // Calculate linen packages cost
  const calculateLinenCost = () => {
    if (!data.linenPackages) return 0;
    return Object.entries(data.linenPackages).reduce((total, [packageId, quantity]) => {
      const product = linenProducts.find((p: any) => p.id === packageId);
      return total + (product && quantity > 0 ? product.price * quantity : 0);
    }, 0);
  };

  // Calculate total with admin overrides
  const calculateTotal = () => {
    // Use admin override if set (works in admin mode AND for resumed admin quotes/email links)
    if (data.adminTotalCostOverride !== undefined && data.adminTotalCostOverride !== null && data.adminTotalCostOverride > 0) {
      return data.adminTotalCostOverride;
    }
    
    // Calculate base cost - use override rate if set, otherwise use calculated rate
    const effectiveRate = data.adminHourlyRateOverride !== undefined ? data.adminHourlyRateOverride : calculations.hourlyRate;
    let total = (calculations.totalHours || 0) * effectiveRate;

    // Apply customer pricing override (discount/markup per hour)
    if (customerOverride?.override_rate && calculations.totalHours) {
      const overrideAmount = customerOverride.override_rate * calculations.totalHours;
      total += overrideAmount; // Can be negative (discount) or positive (markup)
    }

    // Add short notice charge (unless admin removed it)
    if (!(isAdminMode && data.adminRemoveShortNoticeCharge)) {
      total += shortNoticeInfo.charge;
    }

    // Add equipment one-time cost
    total += calculations.equipmentOneTimeCost || 0;

    // Add oven cleaning cost
    total += calculations.ovenCleaningCost || 0;

    // Add linen packages cost
    total += calculateLinenCost();
    
    // Add scheduling modifiers (additional charges and discounts)
    const additionalCharges = calculations.modifierDetails
      ?.filter((m: any) => m.type === 'additional')
      .reduce((sum: number, m: any) => sum + m.amount, 0) || 0;
    const discounts = calculations.modifierDetails
      ?.filter((m: any) => m.type === 'discount')
      .reduce((sum: number, m: any) => sum + m.amount, 0) || 0;
    
    total += additionalCharges - discounts;
    const subtotal = total;

    // Apply admin discount if set (apply percentage first, then fixed amount)
    if (isAdminMode && data.adminDiscountPercentage) {
      total -= subtotal * data.adminDiscountPercentage / 100;
    }
    if (isAdminMode && data.adminDiscountAmount) {
      total -= data.adminDiscountAmount;
    }
    return Math.max(0, total);
  };
  const shortNoticeInfo = getShortNoticeInfo();
  // Admin can remove short notice charge
  const hasShortNoticeCharge = shortNoticeInfo.charge > 0 && !(isAdminMode && data.adminRemoveShortNoticeCharge);
  const effectiveHourlyRate = data.adminHourlyRateOverride !== undefined ? data.adminHourlyRateOverride : calculations.hourlyRate;

  // Update parent form's totalCost and estimatedHours whenever calculated values change
  useEffect(() => {
    if (onUpdate && calculations.totalHours > 0) {
      const calculatedTotal = calculateTotal();
      const updates: Partial<BookingData> = {};
      
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
    data.linenPackages,
    customerOverride?.override_rate,
    shortNoticeInfo.charge
  ]);
  const renderSummaryContent = () => <div className="space-y-3">
      {/* Service Section */}
      {getServiceDescription() && (calculations.totalHours ?? 0) > 0 && <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{getServiceDescription()}</span>
            <span className="text-foreground font-semibold whitespace-nowrap">
              {calculations.totalHours}h × £{effectiveHourlyRate.toFixed(2)}/hr
            </span>
          </div>
        </div>}

      {/* Customer Pricing Override - Only show discounts, hide additional charges */}
      {customerOverride && customerOverride.override_rate < 0 && calculations.totalHours > 0 && (
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-100">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">Valued Customer Discount</span>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" aria-label="Discount details" className="focus:outline-none">
                  <Info className="w-4 h-4 text-green-600 cursor-pointer" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-xs">
                <p className="text-sm">
                  <span className="font-medium">Thank you for your continued trust!</span>
                  <span className="block text-muted-foreground mt-2">
                    As a valued customer, you receive special pricing on our services.
                  </span>
                </p>
              </PopoverContent>
            </Popover>
          </div>
          <span className="text-green-600 font-semibold">
            -£{Math.abs(customerOverride.override_rate * calculations.totalHours).toFixed(2)}
          </span>
        </div>
      )}

      {/* Schedule Section */}
      {data.selectedDate && <div className="space-y-3 mt-3">
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
          
          {(data.selectedTime || data.flexibility === 'flexible-time') && <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Arrival time</span>
              <span className="text-foreground font-medium">
                {data.flexibility === 'flexible-time' ? 'Flexible timing' : data.selectedTime}
              </span>
            </div>}
        </div>}

      {/* Equipment One-Time Cost */}
      {calculations.equipmentOneTimeCost > 0 && <div className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Equipment delivery (one-time)</span>
            <span className="text-foreground font-semibold">
              £{calculations.equipmentOneTimeCost.toFixed(2)}
            </span>
          </div>
        </div>}

      {/* Oven Cleaning Section - Shows cost only, no additional time */}
      {data.ovenType && data.ovenType !== 'dontneed' && data.ovenType !== '' && (
        <div className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {data.ovenType.charAt(0).toUpperCase() + data.ovenType.slice(1)} oven cleaning
            </span>
            <span className="text-foreground font-semibold">
              {calculations.ovenCleaningCost > 0 ? `£${calculations.ovenCleaningCost.toFixed(2)}` : 'Included'}
            </span>
          </div>
        </div>
      )}

      {/* Additional Rooms */}
      {data.additionalRooms && Object.entries(data.additionalRooms).map(([type, count]) => {
      if (count === 0) return null;
      const labels = {
        toilets: 'Extra Toilet',
        studyRooms: 'Study Room',
        utilityRooms: 'Utility Room',
        otherRooms: 'Other Room'
      };
      const label = labels[type as keyof typeof labels];
      return <div key={type} className="flex justify-between items-center pl-4">
            <span className="text-muted-foreground">
              {label}{count > 1 ? 's' : ''} ({count})
            </span>
            <span className="text-foreground font-semibold">Included</span>
          </div>;
    }).filter(Boolean)}

      {data.linensHandling && data.linensHandling !== 'customer-handles' && getLinensDescription() && (
        <>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Linens</span>
            <span className="text-foreground font-medium">{getLinensDescription()}</span>
          </div>
          {calculations.linenHandlingAdditionalHours > 0 && (
            <div className="flex justify-between items-center pl-4">
              <span className="text-muted-foreground">Linen handling (extra hours)</span>
              <span className="text-foreground font-semibold">{calculations.linenHandlingAdditionalHours.toFixed(2)}h</span>
            </div>
          )}
        </>
      )}

      {/* Linen packages */}
      {data.linenPackages && Object.entries(data.linenPackages).map(([packageId, quantity]) => {
      if (quantity === 0) return null;
      const product = linenProducts.find((p: any) => p.id === packageId);
      if (!product) return null;
      return <div key={packageId} className="flex justify-between items-center pl-4">
            <span className="text-muted-foreground">
              {product.name} ({quantity})
            </span>
            <span className="text-foreground font-semibold">
              £{(product.price * quantity).toFixed(2)}
            </span>
          </div>;
    }).filter(Boolean)}

      {/* Short Notice Charge */}
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
      
      {/* Additional Charges from Scheduling Rules */}
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
      
      {/* Discounts from Scheduling Rules */}
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
      
      {/* Admin Discount - Show only if set */}
      {isAdminMode && data.adminDiscountPercentage && data.adminDiscountPercentage > 0 && <div className="flex justify-between items-center text-red-600">
          <span>Discount ({data.adminDiscountPercentage}%)</span>
          <span className="font-semibold">
            -£{(() => {
          const subtotal = calculations.totalCost + calculateLinenCost();
          return (subtotal * data.adminDiscountPercentage! / 100).toFixed(2);
        })()}
          </span>
        </div>}
      
      {isAdminMode && data.adminDiscountAmount && data.adminDiscountAmount > 0 && <div className="flex justify-between items-center text-red-600">
          <span>Discount (Fixed)</span>
          <span className="font-semibold">
            -£{data.adminDiscountAmount.toFixed(2)}
          </span>
        </div>}
    </div>;
  return <Card className="p-4 sm:p-5 lg:p-6 bg-white sticky top-4 border border-border">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Booking Summary</h3>
        {isAdminMode && onUpdate && (
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
            <p className="font-medium text-foreground">
              {calculations.totalHours} hour{calculations.totalHours !== 1 ? 's' : ''}{getServiceDescription() ? ` - ${getServiceDescription()}` : ''}
            </p>
            {isAdminMode && (
              <p className="text-sm text-muted-foreground">
                £{effectiveHourlyRate.toFixed(2)}/hour
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
        {(calculations.totalHours && calculations.totalHours > 0) ? renderSummaryContent() : (
          <div className="text-center py-12 text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium">Complete the form to see your booking summary</p>
            </div>
          </div>
        )}
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
                id="waive-short-notice-airbnb"
                checked={data.adminRemoveShortNoticeCharge || false}
                onChange={(e) => onUpdate({ adminRemoveShortNoticeCharge: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="waive-short-notice-airbnb" className="text-sm cursor-pointer">
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

      {/* Total Cost */}
      {(calculations.totalHours > 0) && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">
              £{calculateTotal().toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </Card>;
};
export { BookingSummary };