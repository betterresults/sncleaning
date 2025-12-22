import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { EndOfTenancyBookingData } from './EndOfTenancyBookingForm';
import { Home, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface EndOfTenancySummaryProps {
  data: EndOfTenancyBookingData;
  isAdminMode?: boolean;
  onUpdate?: (updates: Partial<EndOfTenancyBookingData>) => void;
}

// Fixed pricing based on property size
const BASE_PRICE_MAP: Record<string, Record<string, number>> = {
  studio: { '1': 150, '2': 170 },
  '1': { '1': 180, '2': 200 },
  '2': { '1': 220, '2': 250, '3': 280 },
  '3': { '1': 280, '2': 310, '3': 340, '4': 370 },
  '4': { '1': 340, '2': 380, '3': 420, '4': 460 },
  '5': { '1': 400, '2': 450, '3': 500, '4': 550, '5': 600 },
  '6+': { '1': 480, '2': 550, '3': 620, '4': 690, '5': 760, '6+': 830 },
};

const OVEN_PRICES: Record<string, number> = {
  single: 45,
  double: 65,
  range: 85,
};

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

  // Calculate fixed price based on property size
  const getBasePrice = () => {
    const bedrooms = data.bedrooms || '1';
    const bathrooms = data.bathrooms || '1';
    
    const bedroomMap = BASE_PRICE_MAP[bedrooms] || BASE_PRICE_MAP['1'];
    return bedroomMap[bathrooms] || bedroomMap['1'] || 180;
  };
  
  const basePrice = getBasePrice();
  const ovenCleaningCost = data.ovenType ? OVEN_PRICES[data.ovenType] || 0 : 0;
  
  // Calculate blinds total
  const blindsTotal = (data.blindsItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate extras total
  const extrasTotal = (data.extraServices || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate steam cleaning total
  const steamCleaningTotal = 
    data.carpetItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
    data.upholsteryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
    data.mattressItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate short notice charge
  const shortNoticeCharge = data.shortNoticeCharge || 0;
  
  // Calculate total cost
  const totalCost = basePrice + ovenCleaningCost + blindsTotal + extrasTotal + steamCleaningTotal + shortNoticeCharge;
  
  // Update parent when total changes
  useEffect(() => {
    if (onUpdate && totalCost !== data.totalCost) {
      onUpdate({ totalCost });
    }
  }, [totalCost]);
  
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

  const renderSummaryContent = () => (
    <div className="space-y-3">
      {/* Service Section - Fixed Price */}
      {basePrice > 0 && data.bedrooms && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">End of Tenancy Cleaning</span>
          <span className="text-foreground font-semibold whitespace-nowrap">
            £{basePrice.toFixed(2)}
          </span>
        </div>
      )}

      {/* Property Condition */}
      {data.propertyCondition && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Condition</span>
          <span className="text-foreground font-medium">
            {PROPERTY_CONDITION_LABELS[data.propertyCondition]}
          </span>
        </div>
      )}

      {/* Furniture Status */}
      {data.furnitureStatus && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status</span>
          <span className="text-foreground font-medium">
            {FURNITURE_STATUS_LABELS[data.furnitureStatus]}
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

      {/* Oven Cleaning */}
      {ovenCleaningCost > 0 && (
        <div className="flex justify-between items-center mt-3">
          <span className="text-muted-foreground capitalize">{data.ovenType} oven cleaning</span>
          <span className="text-foreground font-semibold">£{ovenCleaningCost.toFixed(2)}</span>
        </div>
      )}

      {/* Additional Rooms */}
      {data.additionalRooms && data.additionalRooms.length > 0 && (
        <div className="flex justify-between items-center mt-3">
          <span className="text-muted-foreground">Additional Rooms ({data.additionalRooms.length})</span>
          <span className="text-foreground font-semibold">Included</span>
        </div>
      )}

      {/* Blinds */}
      {blindsTotal > 0 && (
        <div className="flex justify-between items-center mt-3">
          <span className="text-muted-foreground">Blinds/Shutters Cleaning</span>
          <span className="text-foreground font-semibold">£{blindsTotal.toFixed(2)}</span>
        </div>
      )}

      {/* Extra Services */}
      {extrasTotal > 0 && (
        <div className="flex justify-between items-center mt-3">
          <span className="text-muted-foreground">Extra Services</span>
          <span className="text-foreground font-semibold">£{extrasTotal.toFixed(2)}</span>
        </div>
      )}

      {/* Steam Cleaning */}
      {steamCleaningTotal > 0 && (
        <div className="space-y-1 mt-3 pt-3 border-t border-border">
          <div className="flex justify-between items-center font-medium">
            <span className="text-muted-foreground">Steam Cleaning</span>
            <span className="text-foreground font-semibold">£{steamCleaningTotal.toFixed(2)}</span>
          </div>
          {data.carpetItems.map(item => (
            <div key={item.id} className="flex justify-between items-center pl-4 text-sm">
              <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
              <span className="text-foreground">£{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {data.upholsteryItems.map(item => (
            <div key={item.id} className="flex justify-between items-center pl-4 text-sm">
              <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
              <span className="text-foreground">£{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {data.mattressItems.map(item => (
            <div key={item.id} className="flex justify-between items-center pl-4 text-sm">
              <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
              <span className="text-foreground">£{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Short Notice Charge */}
      {shortNoticeCharge > 0 && (
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-amber-200 bg-amber-50 -mx-4 px-4 py-2">
          <span className="text-amber-700 font-medium">Short Notice Charge</span>
          <span className="text-amber-700 font-semibold">£{shortNoticeCharge.toFixed(2)}</span>
        </div>
      )}

      {/* Total */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-primary">
        <span className="text-lg font-semibold text-foreground">Total</span>
        <span className="text-2xl font-bold text-primary">£{totalCost.toFixed(2)}</span>
      </div>
    </div>
  );

  return (
    <Card className="p-4 sm:p-5 lg:p-6 bg-white sticky top-4 border border-border">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Booking Summary</h3>
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

      {basePrice > 0 && data.bedrooms && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              End of Tenancy Cleaning
            </p>
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
        {basePrice > 0 && data.bedrooms ? renderSummaryContent() : (
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
