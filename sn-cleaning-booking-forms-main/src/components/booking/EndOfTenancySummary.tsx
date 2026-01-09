import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { EndOfTenancyBookingData } from './EndOfTenancyBookingForm';
import { Home, Clock, Calendar, ChevronDown, ChevronUp, Percent, Pencil } from 'lucide-react';
import { useEndOfTenancyCalculations } from '@/hooks/useEndOfTenancyCalculations';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface EndOfTenancySummaryProps {
  data: EndOfTenancyBookingData;
  isAdminMode?: boolean;
  onUpdate?: (updates: Partial<EndOfTenancyBookingData>) => void;
}

const PROPERTY_CONDITION_LABELS: Record<string, string> = {
  'well-maintained': 'Well-Maintained',
  'moderate': 'Moderate Condition',
  'heavily-used': 'Heavily Used',
  'intensive': 'Intensive Cleaning Required',
};

const FURNITURE_STATUS_LABELS: Record<string, string> = {
  'furnished': 'Furnished',
  'unfurnished': 'Unfurnished',
  'part-furnished': 'Part Furnished',
};

export const EndOfTenancySummary: React.FC<EndOfTenancySummaryProps> = ({
  data,
  isAdminMode = false,
  onUpdate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSteamExpanded, setIsSteamExpanded] = useState(false);
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [manualTotalCost, setManualTotalCost] = useState<string>('');
  const [manualDiscount, setManualDiscount] = useState<string>('');
  const [waiveShortNotice, setWaiveShortNotice] = useState(false);

  // Use the calculation hook with database prices
  const calculations = useEndOfTenancyCalculations(data, data.isFirstTimeCustomer || false);

  // Calculate final total with admin overrides
  const getDisplayTotal = () => {
    if (manualTotalCost) {
      let total = parseFloat(manualTotalCost) || 0;
      if (manualDiscount) {
        total -= parseFloat(manualDiscount) || 0;
      }
      return total;
    }
    
    let total = calculations.totalCost;
    if (waiveShortNotice) {
      total -= calculations.shortNoticeCharge;
    }
    if (manualDiscount) {
      total -= parseFloat(manualDiscount) || 0;
    }
    return total;
  };

  // Update parent when total changes - sync the calculated total to parent
  // This ensures the correct price is used during booking submission
  useEffect(() => {
    if (onUpdate && !calculations.isLoading) {
      const displayTotal = getDisplayTotal();
      // Only update if the values are actually different (with small tolerance for floating point)
      const totalDiff = Math.abs(displayTotal - (data.totalCost || 0));
      const hoursDiff = Math.abs(calculations.estimatedHours - (data.estimatedHours || 0));
      if (totalDiff > 0.01 || hoursDiff > 0.01) {
        console.log('[EndOfTenancySummary] Syncing totalCost to parent:', displayTotal, 'estimatedHours:', calculations.estimatedHours);
        onUpdate({ 
          totalCost: displayTotal,
          estimatedHours: calculations.estimatedHours,
        });
      }
    }
  }, [calculations.totalCost, calculations.estimatedHours, calculations.isLoading, manualTotalCost, manualDiscount, waiveShortNotice, data.totalCost, data.estimatedHours]);
  
  // Format property description
  const getPropertyDescription = () => {
    if (!data.propertyType) return '';
    
    let desc = '';
    switch (data.propertyType) {
      case 'house': desc = 'House'; break;
      case 'flat': desc = 'Flat'; break;
      case 'house-share': desc = 'House Share'; break;
      default: return '';
    }
    
    if (data.bedrooms) {
      if (data.bedrooms === 'studio') {
        desc += ' Studio';
      } else {
        desc += ` ${data.bedrooms} Bedroom${data.bedrooms !== '1' ? 's' : ''}`;
      }
    }
    
    if (data.bathrooms) {
      desc += `, ${data.bathrooms} Bathroom${data.bathrooms !== '1' ? 's' : ''}`;
    }
    
    return desc;
  };

  const hasPropertyData = data.bedrooms && calculations.baseCost > 0;
  const totalPercentage = calculations.conditionPercentage + calculations.furniturePercentage;

  const renderSummaryContent = () => (
    <div className="space-y-3">
      {/* Base Cleaning Cost */}
      {calculations.baseCost > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">End of Tenancy Cleaning</span>
          <span className="text-foreground font-semibold whitespace-nowrap">
            £{calculations.baseCost.toFixed(2)}
          </span>
        </div>
      )}

      {/* Property Condition with percentage */}
      {data.propertyCondition && calculations.conditionPercentage > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">
            {PROPERTY_CONDITION_LABELS[data.propertyCondition]}
          </span>
          <span className="text-foreground font-medium">
            +£{(calculations.baseCost * calculations.conditionPercentage / 100).toFixed(2)}
          </span>
        </div>
      )}

      {/* Furniture Status with percentage */}
      {data.furnitureStatus && calculations.furniturePercentage > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">
            {FURNITURE_STATUS_LABELS[data.furnitureStatus]}
          </span>
          <span className="text-foreground font-medium">
            +£{(calculations.baseCost * calculations.furniturePercentage / 100).toFixed(2)}
          </span>
        </div>
      )}

      {/* Oven Cleaning - show positive costs or negative deductions */}
      {calculations.ovenCleaningCost !== 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">
            {calculations.ovenCleaningCost < 0 ? 'No Oven Cleaning' : 'Oven Cleaning'}
          </span>
          <span className={`font-semibold ${calculations.ovenCleaningCost < 0 ? 'text-green-600' : 'text-foreground'}`}>
            {calculations.ovenCleaningCost < 0 ? '-' : ''}£{Math.abs(calculations.ovenCleaningCost).toFixed(2)}
          </span>
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
          
          {data.selectedTime && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Arrival time</span>
              <span className="text-foreground font-medium">{data.selectedTime}</span>
            </div>
          )}
        </div>
      )}

      {/* Blinds */}
      {calculations.blindsTotal > 0 && (
        <div className="flex justify-between items-center mt-3">
          <span className="text-muted-foreground">Blinds/Shutters Cleaning</span>
          <span className="text-foreground font-semibold">£{calculations.blindsTotal.toFixed(2)}</span>
        </div>
      )}

      {/* Extra Services */}
      {calculations.extrasTotal > 0 && (
        <div className="flex justify-between items-center mt-3">
          <span className="text-muted-foreground">Extra Services</span>
          <span className="text-foreground font-semibold">£{calculations.extrasTotal.toFixed(2)}</span>
        </div>
      )}

      {/* Additional Services (Balcony, Garage, Waste Removal) */}
      {calculations.additionalServicesTotal > 0 && (
        <div className="flex justify-between items-center mt-3">
          <span className="text-muted-foreground">Additional Services</span>
          <span className="text-foreground font-semibold">£{calculations.additionalServicesTotal.toFixed(2)}</span>
        </div>
      )}

      {/* Steam Cleaning */}
      {calculations.steamCleaningTotal > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Steam Cleaning</span>
            <span className="text-foreground font-semibold">£{calculations.steamCleaningFinal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setIsSteamExpanded(!isSteamExpanded)}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <span>View details</span>
            {isSteamExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {isSteamExpanded && (
            <div className="pl-4 space-y-1 text-sm">
              {data.carpetItems.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span className="text-foreground">£{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {data.upholsteryItems.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span className="text-foreground">£{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {data.mattressItems.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span className="text-foreground">£{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-muted-foreground line-through">£{calculations.steamCleaningTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-green-600">
                <span>Bundle discount (20% off)</span>
                <span>-£{(calculations.steamCleaningTotal - calculations.steamCleaningFinal).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Short Notice Charge */}
      {calculations.shortNoticeCharge > 0 && (
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-amber-200 bg-amber-50 -mx-4 px-4 py-2">
          <span className="text-amber-700 font-medium">Short Notice Charge</span>
          <span className="text-amber-700 font-semibold">£{calculations.shortNoticeCharge.toFixed(2)}</span>
        </div>
      )}

      {/* First-Time Customer Discount */}
      {data.isFirstTimeCustomer && calculations.firstTimeDiscount > 0 && (
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-green-200 bg-green-50 -mx-4 px-4 py-2">
          <span className="text-green-700 font-medium">
            New Customer Discount (10%)
          </span>
          <span className="text-green-700 font-semibold">-£{calculations.firstTimeDiscount.toFixed(2)}</span>
        </div>
      )}

      {/* Total */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-primary">
        <span className="text-lg font-semibold text-foreground">Total</span>
        <span className="text-2xl font-bold text-primary">£{getDisplayTotal().toFixed(2)}</span>
      </div>

      {/* Admin Pricing Controls */}
      {isAdminMode && isEditingPricing && (
        <div className="mt-4 pt-4 border-t border-border space-y-3 bg-muted/30 -mx-4 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium text-foreground">Admin Pricing Controls</p>
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Override Total Cost (£)</label>
            <Input
              type="number"
              placeholder="Leave empty to use calculated price"
              value={manualTotalCost}
              onChange={(e) => setManualTotalCost(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Additional Discount (£)</label>
            <Input
              type="number"
              placeholder="0"
              value={manualDiscount}
              onChange={(e) => setManualDiscount(e.target.value)}
              className="bg-white"
            />
          </div>

          {calculations.shortNoticeCharge > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="waiveShortNotice"
                checked={waiveShortNotice}
                onCheckedChange={(checked) => setWaiveShortNotice(checked === true)}
              />
              <label htmlFor="waiveShortNotice" className="text-sm text-muted-foreground">
                Waive short notice charge (£{calculations.shortNoticeCharge.toFixed(2)})
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderMobileContent = () => (
    <div className="space-y-3">
      {/* Base Cleaning Cost */}
      {calculations.baseCost > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">End of Tenancy Cleaning</span>
          <span className="text-foreground font-semibold whitespace-nowrap">
            £{calculations.baseCost.toFixed(2)}
          </span>
        </div>
      )}

      {/* Property Condition adjustment */}
      {data.propertyCondition && calculations.conditionPercentage > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">
            {PROPERTY_CONDITION_LABELS[data.propertyCondition]}
          </span>
          <span className="text-foreground font-medium">
            +£{(calculations.baseCost * calculations.conditionPercentage / 100).toFixed(2)}
          </span>
        </div>
      )}

      {/* Furniture Status adjustment */}
      {data.furnitureStatus && calculations.furniturePercentage > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">
            {FURNITURE_STATUS_LABELS[data.furnitureStatus]}
          </span>
          <span className="text-foreground font-medium">
            +£{(calculations.baseCost * calculations.furniturePercentage / 100).toFixed(2)}
          </span>
        </div>
      )}

      {/* Oven Cleaning - show positive costs or negative deductions */}
      {calculations.ovenCleaningCost !== 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">
            {calculations.ovenCleaningCost < 0 ? 'No Oven Cleaning' : 'Oven Cleaning'}
          </span>
          <span className={`font-semibold ${calculations.ovenCleaningCost < 0 ? 'text-green-600' : 'text-foreground'}`}>
            {calculations.ovenCleaningCost < 0 ? '-' : ''}£{Math.abs(calculations.ovenCleaningCost).toFixed(2)}
          </span>
        </div>
      )}

      {/* Blinds */}
      {calculations.blindsTotal > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Blinds/Shutters Cleaning</span>
          <span className="text-foreground font-semibold">£{calculations.blindsTotal.toFixed(2)}</span>
        </div>
      )}

      {/* Extra Services */}
      {calculations.extrasTotal > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Extra Services</span>
          <span className="text-foreground font-semibold">£{calculations.extrasTotal.toFixed(2)}</span>
        </div>
      )}

      {/* Additional Services (Balcony, Garage, Waste Removal) */}
      {calculations.additionalServicesTotal > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Additional Services</span>
          <span className="text-foreground font-semibold">£{calculations.additionalServicesTotal.toFixed(2)}</span>
        </div>
      )}

      {/* Steam Cleaning with discount */}
      {calculations.steamCleaningTotal > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Steam Cleaning (20% off)</span>
          <span className="text-foreground font-semibold">£{calculations.steamCleaningFinal.toFixed(2)}</span>
        </div>
      )}

      {/* Short Notice Charge */}
      {calculations.shortNoticeCharge > 0 && (
        <div className="flex justify-between items-center bg-amber-50 -mx-4 px-4 py-2 rounded">
          <span className="text-amber-700 font-medium">Short Notice Charge</span>
          <span className="text-amber-700 font-semibold">£{calculations.shortNoticeCharge.toFixed(2)}</span>
        </div>
      )}

      {/* First-Time Customer Discount */}
      {data.isFirstTimeCustomer && calculations.firstTimeDiscount > 0 && (
        <div className="flex justify-between items-center bg-green-50 -mx-4 px-4 py-2 rounded">
          <span className="text-green-700 font-medium text-sm">New Customer (10% off)</span>
          <span className="text-green-700 font-semibold">-£{calculations.firstTimeDiscount.toFixed(2)}</span>
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
            className="text-primary hover:text-primary/80"
          >
            <Pencil className="w-4 h-4 mr-1" />
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

      {hasPropertyData && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              Est. {calculations.estimatedHours.toFixed(1)} hours team work
            </p>
          </div>
        </div>
      )}

      {/* Mobile: Total always visible, details collapsible */}
      <div className="lg:hidden">
        {/* View Details button first */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full py-2 text-primary mb-3"
        >
          <span className="font-medium">View Details</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {/* Expanded details */}
        {isExpanded && (
          <div className="pb-3 border-b border-border mb-3">
            {renderMobileContent()}
          </div>
        )}
        
        {/* Total always at bottom */}
        {hasPropertyData && (
          <div className="flex justify-between items-center pt-2 border-t-2 border-primary">
            <span className="text-lg font-semibold text-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">£{getDisplayTotal().toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Desktop: Always visible */}
      <div className="hidden lg:block">
        {hasPropertyData ? renderSummaryContent() : (
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
    </Card>
  );
};
