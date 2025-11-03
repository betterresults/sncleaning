import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingData } from './AirbnbBookingForm';
import { Home, Clock, Calendar, PoundSterling, ChevronDown, ChevronUp, AlertTriangle, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAirbnbHardcodedCalculations } from '@/hooks/useAirbnbHardcodedCalculations';
import { useAirbnbPricingFormulas } from '@/hooks/useAirbnbPricingFormulas';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface BookingSummaryProps {
  data: BookingData;
  isAdminMode?: boolean;
  onUpdate?: (updates: Partial<BookingData>) => void;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({ data, isAdminMode = false, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);

  // Use hardcoded calculations
  const calculations = useAirbnbHardcodedCalculations(data);
  
  // Fetch formulas for admin view
  const { data: formulas = [] } = useAirbnbPricingFormulas();

  // Fetch linen products from database
  const { data: linenProducts = [] } = useQuery({
    queryKey: ['linen-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('linen_products')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
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
    
    return { charge: calculations.shortNoticeCharge, notice: '', hoursUntil: hoursUntilCleaning };
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
    
    // Add linen packages cost
    total += calculateLinenCost();
    
    const subtotal = total;
    
    // Apply admin discount if set (apply percentage first, then fixed amount)
    if (isAdminMode && data.adminDiscountPercentage) {
      total -= (subtotal * data.adminDiscountPercentage) / 100;
    }
    if (isAdminMode && data.adminDiscountAmount) {
      total -= data.adminDiscountAmount;
    }
    
    return Math.max(0, total);
  };

  const shortNoticeInfo = getShortNoticeInfo();
  const hasShortNoticeCharge = shortNoticeInfo.charge > 0;
  
  const effectiveHourlyRate = data.adminHourlyRateOverride !== undefined 
    ? data.adminHourlyRateOverride 
    : calculations.hourlyRate;

  const renderSummaryContent = () => (
    <div className="space-y-3">
      {/* Service Section */}
      {getServiceDescription() && (calculations.totalHours ?? 0) > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{getServiceDescription()}</span>
            <span className="text-foreground font-semibold whitespace-nowrap">
              {calculations.totalHours}h × £{effectiveHourlyRate.toFixed(2)}/hr
            </span>
          </div>
        </div>
      )}

      {/* Schedule Section */}
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

      {/* Equipment */}
      {data.cleaningProducts === 'equipment' && (
        <div className="space-y-3 mt-3">
          <div className="flex justify-between items-center pl-4">
            <span className="text-muted-foreground">
              Equipment {data.equipmentArrangement === 'oneoff' ? 'delivery' : ''}
            </span>
            <span className="text-foreground font-semibold">
              Included
            </span>
          </div>
        </div>
      )}

      {/* Oven Cleaning Section */}
      {data.needsOvenCleaning && (
        <div className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {data.ovenType ? `${data.ovenType.charAt(0).toUpperCase() + data.ovenType.slice(1)} oven cleaning` : 'Oven cleaning'}
            </span>
            <span className="text-foreground font-semibold">
              Included
            </span>
          </div>
        </div>
      )}

      {/* Additional Rooms */}
      {data.additionalRooms && Object.entries(data.additionalRooms).map(([type, count]) => {
        if (count === 0) return null;
        const labels = {
          toilets: 'Extra Toilet', studyRooms: 'Study Room',
          utilityRooms: 'Utility Room', otherRooms: 'Other Room'
        };
        const label = labels[type as keyof typeof labels];
        return (
          <div key={type} className="flex justify-between items-center pl-4">
            <span className="text-muted-foreground">
              {label}{count > 1 ? 's' : ''} ({count})
            </span>
            <span className="text-foreground font-semibold">Included</span>
          </div>
        );
      }).filter(Boolean)}

      {/* Linens */}
      {data.linensHandling && data.linensHandling !== 'customer-handles' && getLinensDescription() && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Linens</span>
          <span className="text-foreground font-medium">{getLinensDescription()}</span>
        </div>
      )}

      {/* Linen packages */}
      {data.linenPackages && Object.entries(data.linenPackages).map(([packageId, quantity]) => {
        if (quantity === 0) return null;
        const product = linenProducts.find((p: any) => p.id === packageId);
        if (!product) return null;
        
        return (
          <div key={packageId} className="flex justify-between items-center pl-4">
            <span className="text-muted-foreground">
              {product.name} ({quantity})
            </span>
            <span className="text-foreground font-semibold">
              £{(product.price * quantity).toFixed(2)}
            </span>
          </div>
        );
      }).filter(Boolean)}

      {/* Short Notice Charge */}
      {hasShortNoticeCharge && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{shortNoticeInfo.notice}</span>
          <span className="text-foreground font-semibold">
            £{shortNoticeInfo.charge.toFixed(2)}
          </span>
        </div>
      )}
      
      {/* Admin Discount - Show only if set */}
      {isAdminMode && data.adminDiscountPercentage && data.adminDiscountPercentage > 0 && (
        <div className="flex justify-between items-center text-red-600">
          <span>Discount ({data.adminDiscountPercentage}%)</span>
          <span className="font-semibold">
            -£{(() => {
              const subtotal = calculations.totalCost + calculateLinenCost();
              return ((subtotal * data.adminDiscountPercentage!) / 100).toFixed(2);
            })()}
          </span>
        </div>
      )}
      
      {isAdminMode && data.adminDiscountAmount && data.adminDiscountAmount > 0 && (
        <div className="flex justify-between items-center text-red-600">
          <span>Discount (Fixed)</span>
          <span className="font-semibold">
            -£{data.adminDiscountAmount.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <Card className="p-4 bg-white transition-shadow duration-300 sticky top-4 border border-border shadow-[0_20px_60px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.12)]">
      <div className="pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-sm">🏠</span>
          </div>
          <h3 className="text-xl font-semibold text-foreground">Booking Summary</h3>
        </div>
      </div>

      {renderSummaryContent()}

      {/* Formula Debug Section - Show in development */}
      <div className="pt-4 mt-4 border-t">
        <Collapsible open={showFormulas} onOpenChange={setShowFormulas}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-between mb-3"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Formula Calculations
              </span>
              {showFormulas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mb-3 p-3 bg-muted/50 rounded-lg text-xs">
            <div className="space-y-2">
              <div className="font-semibold text-sm">Active Formulas ({formulas.length})</div>
              {formulas.length > 0 ? (
                formulas.map((formula: any) => (
                  <div key={formula.id} className="p-2 bg-background rounded border">
                    <div className="font-medium">{formula.name}</div>
                    <div className="text-muted-foreground text-xs">{formula.description}</div>
                    <div className="text-xs mt-1">
                      <span className="font-semibold">Result Type:</span> {formula.result_type}
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold">Elements:</span> {formula.elements?.length || 0} items
                    </div>
                    {formula.elements && formula.elements.length > 0 && (
                      <div className="text-xs mt-1 p-1 bg-muted rounded font-mono">
                        {JSON.stringify(formula.elements).substring(0, 100)}...
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-xs bg-yellow-100 p-2 rounded">
                  ⚠️ No formulas found in database. Go to Admin → Pricing Formulas to create them.
                </div>
              )}
              
              <div className="font-semibold text-sm mt-3">Current Booking Data</div>
              <div className="space-y-1 mb-2 p-2 bg-background rounded">
                <div className="flex justify-between text-xs">
                  <span>Property:</span>
                  <span className="font-mono">{data.propertyType || 'none'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Bedrooms:</span>
                  <span className="font-mono">{data.bedrooms || 'none'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Bathrooms:</span>
                  <span className="font-mono">{data.bathrooms || 'none'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Service:</span>
                  <span className="font-mono">{data.serviceType || 'none'}</span>
                </div>
              </div>
              
              <div className="font-semibold text-sm mt-3">Calculated Values</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Base Time:</span>
                  <span className={`font-mono ${calculations.baseTime === 0 ? 'text-red-600' : ''}`}>
                    {calculations.baseTime?.toFixed(2) || '0'}h
                    {calculations.baseTime === 0 && ' ⚠️'}
                  </span>
                </div>
                {calculations.debug?.dryTime !== undefined && calculations.debug.dryTime > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="pl-2">+ Dry Time:</span>
                    <span className="font-mono">{calculations.debug.dryTime.toFixed(2)}h</span>
                  </div>
                )}
                {calculations.debug?.ironTime !== undefined && calculations.debug.ironTime > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="pl-2">+ Iron Time:</span>
                    <span className="font-mono">{calculations.debug.ironTime.toFixed(2)}h</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Additional Time:</span>
                  <span className="font-mono">{calculations.additionalTime?.toFixed(2) || '0'}h</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total Hours:</span>
                  <span className="font-mono">{calculations.totalHours?.toFixed(2) || '0'}h</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Hourly Rate:</span>
                  <span className="font-mono">£{calculations.hourlyRate?.toFixed(2) || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cleaning Cost:</span>
                  <span className="font-mono">£{calculations.cleaningCost?.toFixed(2) || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Short Notice:</span>
                  <span className="font-mono">£{calculations.shortNoticeCharge?.toFixed(2) || '0'}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total Cost:</span>
                  <span className="font-mono">£{calculations.totalCost?.toFixed(2) || '0'}</span>
                </div>

                {calculations?.debug && (
                  <div className="mt-3">
                    <div className="font-semibold text-sm">Live Formula Breakdown</div>
                    <div className="text-xs mt-1 p-2 bg-background rounded font-mono space-y-1">
                      <div>BaseTime = ceil(((PT+BR+BA+AR+OC) * (ST * AC)) / 30) / 2</div>
                      <div>
                        = ceil((( {calculations.debug.propertyTypeTime || 0} + {calculations.debug.bedroomsTime || 0} + {calculations.debug.bathroomsTime || 0} + {calculations.debug.additionalRoomsTime || 0} + {calculations.debug.ovenCleaningTime || 0} ) * ( {calculations.debug.serviceTypeTime || 0} * {calculations.debug.alreadyCleanedValue ?? 1} )) / 30) / 2
                        = {calculations.baseTime?.toFixed(2)}h
                      </div>
                      <div>
                        DryTime = {data.linensHandling && data.linensHandling !== 'customer-handles' ? (
                          <>ceil(({calculations.debug.bedSizesValue || 0} / 30)) / 2 = {calculations.debug.dryTime?.toFixed(2)}h</>
                        ) : (
                          '0 (linens not selected)'
                        )}
                      </div>
                      <div>
                        IronTime = {data.needsIroning ? (
                          <>ceil(({calculations.debug.bedSizesTime || 0} / 30)) / 2 = {calculations.debug.ironTime?.toFixed(2)}h</>
                        ) : (
                          '0 (no ironing)'
                        )}
                      </div>
                      <div>
                        AdditionalTime = {data.linensHandling && data.linensHandling !== 'customer-handles' ? (
                          <>abs((Dry+Iron) - Base) - max(0, Dry - Base)
                          = abs(({(calculations.debug?.dryTime || 0).toFixed(2)} + {(calculations.debug?.ironTime || 0).toFixed(2)} - {(calculations.baseTime || 0).toFixed(2)})) - {Math.max(0, (calculations.debug?.dryTime || 0) - (calculations.baseTime || 0)).toFixed(2)}
                          = {calculations.additionalTime?.toFixed(2)}h</>
                        ) : '0'}
                      </div>
                      <div>
                        TotalHours = BaseTime + AdditionalTime = {calculations.baseTime?.toFixed(2) || '0'} + {calculations.additionalTime?.toFixed(2) || '0'} = {calculations.totalHours?.toFixed(2) || '0'}h
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Admin Pricing Controls */}
      {isAdminMode && onUpdate && (
        <div className={isAdminMode && !showFormulas ? "pt-4 mt-4 border-t" : ""}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingPricing(!isEditingPricing)}
            className="w-full flex items-center justify-center gap-2 mb-3"
          >
            <Edit2 className="w-4 h-4" />
            {isEditingPricing ? 'Hide' : 'Edit'} Pricing
          </Button>
          
          {isEditingPricing && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-xs text-gray-600">Hourly Rate Override (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={`Default: £${effectiveHourlyRate.toFixed(2)}`}
                  value={data.adminHourlyRateOverride ?? ''}
                  onChange={(e) => onUpdate({ 
                    adminHourlyRateOverride: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="h-10 mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Discount Amount (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={data.adminDiscountAmount ?? ''}
                  onChange={(e) => onUpdate({ 
                    adminDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="h-10 mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Discount Percentage (%)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={data.adminDiscountPercentage ?? ''}
                  onChange={(e) => onUpdate({ 
                    adminDiscountPercentage: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="h-10 mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Total Cost Override (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={`Calculated: £${calculateTotal().toFixed(2)}`}
                  value={data.adminTotalCostOverride ?? ''}
                  onChange={(e) => onUpdate({ 
                    adminTotalCostOverride: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="h-10 mt-1"
                />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({
                  adminHourlyRateOverride: undefined,
                  adminDiscountAmount: undefined,
                  adminDiscountPercentage: undefined,
                  adminTotalCostOverride: undefined
                })}
                className="w-full text-xs"
              >
                Reset All Overrides
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Total Cost */}
      {data.estimatedHours && data.estimatedHours > 0 && (
        <div className="pt-4 mt-4">
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-foreground">Total Cost</span>
              <span className="text-3xl font-bold text-primary">£{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export { BookingSummary };