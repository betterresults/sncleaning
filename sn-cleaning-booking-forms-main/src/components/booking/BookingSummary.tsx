import React, { useState } from 'react';
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

  console.log('[BookingSummary] Current customer ID:', data.customerId);

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
  
  console.log('[BookingSummary] Customer override:', customerOverride);

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
    // If admin has set a total cost override, use that
    if (isAdminMode && data.adminTotalCostOverride !== undefined && data.adminTotalCostOverride !== null) {
      return data.adminTotalCostOverride;
    }
    let total = calculations.totalCost;

    // Apply customer pricing override (discount/markup per hour)
    if (customerOverride?.override_rate && calculations.totalHours) {
      const overrideAmount = customerOverride.override_rate * calculations.totalHours;
      total += overrideAmount; // Can be negative (discount) or positive (markup)
    }

    // Add linen packages cost
    total += calculateLinenCost();
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
  const hasShortNoticeCharge = shortNoticeInfo.charge > 0;
  const effectiveHourlyRate = data.adminHourlyRateOverride !== undefined ? data.adminHourlyRateOverride : calculations.hourlyRate;
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
        <div className="flex justify-between items-center text-green-600">
          <span>
            Special Discount
            {' '}
            {customerOverride.cleaning_type ? `(${customerOverride.cleaning_type})` : '(All)'}
          </span>
          <span className="font-semibold">
            -£{Math.abs(customerOverride.override_rate * calculations.totalHours).toFixed(2)}
            <span className="text-xs text-muted-foreground ml-1">
              ({calculations.totalHours}h × -£{Math.abs(customerOverride.override_rate)}/hr)
            </span>
          </span>
        </div>
      )}

      {/* DEBUG: Customer Pricing Override Status - Remove after debugging */}
      {data.customerId && (
        <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-2 mt-2">
          <span>
            DEBUG: Customer #{data.customerId} | Service: airbnb-cleaning | Cleaning: {data.serviceType || 'All'} |
            Override: {customerOverride ? `£${customerOverride.override_rate}/hr (${customerOverride.cleaning_type ?? 'All'})` : 'none found'}
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

      {/* Oven Cleaning Section */}
      {data.ovenType && data.ovenType !== 'dontneed' && data.ovenType !== '' && <div className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {data.ovenType.charAt(0).toUpperCase() + data.ovenType.slice(1)} oven cleaning
            </span>
            <span className="text-foreground font-semibold">
              Included
            </span>
          </div>
        </div>}

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
      {hasShortNoticeCharge && <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{shortNoticeInfo.notice}</span>
          <span className="text-foreground font-semibold">
            £{shortNoticeInfo.charge.toFixed(2)}
          </span>
        </div>}
      
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
  return <Card className="p-4 bg-white transition-shadow duration-300 sticky top-4 border border-border shadow-[0_20px_60px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.12)]">
      <div className="pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-sm">🏠</span>
          </div>
          <h3 className="text-xl font-semibold text-foreground">Booking Summary</h3>
        </div>
      </div>

      {/* Only show content if we have valid data */}
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

      {/* Admin Pricing Controls */}
      {isAdminMode && onUpdate && <div className="pt-4 mt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => setIsEditingPricing(!isEditingPricing)} className="w-full flex items-center justify-center gap-2 mb-3">
            <Edit2 className="w-4 h-4" />
            {isEditingPricing ? 'Hide' : 'Edit'} Pricing
          </Button>
          
          {isEditingPricing && <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-xs text-gray-600">Hourly Rate Override (£)</Label>
                <Input type="number" step="0.01" placeholder={`Default: £${effectiveHourlyRate.toFixed(2)}`} value={data.adminHourlyRateOverride ?? ''} onChange={e => onUpdate({
            adminHourlyRateOverride: e.target.value ? parseFloat(e.target.value) : undefined
          })} className="h-10 mt-1" />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Discount Amount (£)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={data.adminDiscountAmount ?? ''} onChange={e => onUpdate({
            adminDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined
          })} className="h-10 mt-1" />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Discount Percentage (%)</Label>
                <Input type="number" step="1" min="0" max="100" placeholder="0" value={data.adminDiscountPercentage ?? ''} onChange={e => onUpdate({
            adminDiscountPercentage: e.target.value ? parseFloat(e.target.value) : undefined
          })} className="h-10 mt-1" />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Total Cost Override (£)</Label>
                <Input type="number" step="0.01" placeholder={`Calculated: £${calculateTotal().toFixed(2)}`} value={data.adminTotalCostOverride ?? ''} onChange={e => onUpdate({
            adminTotalCostOverride: e.target.value ? parseFloat(e.target.value) : undefined
          })} className="h-10 mt-1" />
              </div>
              
              <Button variant="ghost" size="sm" onClick={() => onUpdate({
          adminHourlyRateOverride: undefined,
          adminDiscountAmount: undefined,
          adminDiscountPercentage: undefined,
          adminTotalCostOverride: undefined
        })} className="w-full text-xs">
                Reset All Overrides
              </Button>
            </div>}
        </div>}

      {/* Total Cost */}
      {(calculations.totalHours > 0) && <div className="pt-4 mt-4">
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-foreground">Total Cost</span>
              <span className="text-3xl font-bold text-primary">£{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>}
    </Card>;
};
export { BookingSummary };