import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Calendar, Clock, Sparkles, CookingPot, Blinds, Plus } from 'lucide-react';
import { EndOfTenancyBookingData } from './EndOfTenancyBookingForm';
import { format } from 'date-fns';

interface EndOfTenancySummaryProps {
  data: EndOfTenancyBookingData;
  isAdminMode?: boolean;
  onUpdate?: (updates: Partial<EndOfTenancyBookingData>) => void;
}

// Pricing constants
const BASE_HOURS_MAP: Record<string, Record<string, number>> = {
  studio: { '1': 3, '2': 3.5 },
  '1': { '1': 4, '2': 4.5 },
  '2': { '1': 5, '2': 5.5, '3': 6 },
  '3': { '1': 6, '2': 6.5, '3': 7, '4': 7.5 },
  '4': { '1': 7, '2': 7.5, '3': 8, '4': 8.5 },
  '5': { '1': 8, '2': 8.5, '3': 9, '4': 9.5, '5': 10 },
  '6+': { '1': 9, '2': 10, '3': 11, '4': 12, '5': 13, '6+': 14 },
};

const HOURLY_RATE = 28;

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
  // Calculate estimated hours based on property size
  const getBaseHours = () => {
    const bedrooms = data.bedrooms || '1';
    const bathrooms = data.bathrooms || '1';
    
    const bedroomMap = BASE_HOURS_MAP[bedrooms] || BASE_HOURS_MAP['1'];
    return bedroomMap[bathrooms] || bedroomMap['1'] || 4;
  };
  
  const baseHours = getBaseHours();
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
  const baseCost = baseHours * HOURLY_RATE;
  const totalCost = baseCost + ovenCleaningCost + blindsTotal + extrasTotal + steamCleaningTotal + shortNoticeCharge;
  
  // Format property type
  const getPropertyTypeLabel = () => {
    switch (data.propertyType) {
      case 'house': return 'House';
      case 'flat': return 'Flat';
      case 'house-share': return 'House Share';
      default: return '';
    }
  };
  
  // Format bedrooms
  const getBedroomLabel = (value: string) => {
    if (value === 'studio') return 'Studio';
    if (value === '6+') return '6+ Bed';
    return `${value} Bed`;
  };

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 shadow-lg">
      <CardHeader className="pb-2 bg-primary text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold">End Of Tenancy Cleaning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Service Details */}
        <div>
          <p className="font-semibold text-slate-700 mb-2">Service Details:</p>
          <div className="space-y-1 text-sm">
            {data.propertyType && (
              <p className="text-primary">{getPropertyTypeLabel()}</p>
            )}
            {data.furnitureStatus && (
              <p className="text-primary">{FURNITURE_STATUS_LABELS[data.furnitureStatus]}</p>
            )}
            {data.propertyCondition && (
              <p className="text-primary">{PROPERTY_CONDITION_LABELS[data.propertyCondition]}</p>
            )}
            {data.bedrooms && data.bathrooms && (
              <p className="text-primary">{getBedroomLabel(data.bedrooms)} {data.bathrooms} Bathroom{data.bathrooms !== '1' ? 's' : ''}</p>
            )}
            {data.ovenType ? (
              <p className="text-primary capitalize">{data.ovenType} Oven Cleaning</p>
            ) : (
              <p className="text-primary">No Oven Cleaning Required</p>
            )}
          </div>
        </div>

        {/* Add-ons */}
        {(data.additionalRooms?.length > 0 || data.blindsItems?.length > 0 || data.extraServices?.length > 0) && (
          <div>
            <p className="font-semibold text-slate-700 mb-2">Add On:</p>
            <div className="space-y-1 text-sm text-primary">
              {data.additionalRooms?.map(room => (
                <p key={room}>{room.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
              ))}
              {data.blindsItems?.map((item, idx) => (
                <p key={idx}>{item.quantity}x {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Blinds - £{item.price * item.quantity}</p>
              ))}
              {data.extraServices?.map(service => (
                <p key={service.id}>{service.quantity}x {service.name} - £{service.price * service.quantity}</p>
              ))}
            </div>
          </div>
        )}

        {/* Date & Time */}
        {data.selectedDate && (
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-slate-700">Schedule</p>
              <p className="text-sm text-muted-foreground">
                {format(data.selectedDate, 'EEEE, MMMM d, yyyy')}
                {data.selectedTime && ` at ${data.selectedTime}`}
              </p>
            </div>
          </div>
        )}

        {/* Estimated Hours */}
        {baseHours > 0 && (
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-slate-700">Estimated Time</p>
              <p className="text-sm text-muted-foreground">{baseHours} hours</p>
            </div>
          </div>
        )}

        {/* Oven Cleaning */}
        {ovenCleaningCost > 0 && (
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
            <CookingPot className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-slate-700">Oven Cleaning</p>
              <p className="text-sm text-muted-foreground capitalize">{data.ovenType} oven</p>
            </div>
            <span className="font-semibold text-primary">+£{ovenCleaningCost}</span>
          </div>
        )}

        {/* Blinds */}
        {blindsTotal > 0 && (
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
            <Blinds className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-slate-700">Blinds/Shutters Cleaning</p>
              <p className="text-sm text-muted-foreground">
                {data.blindsItems?.reduce((sum, item) => sum + item.quantity, 0)} items
              </p>
            </div>
            <span className="font-semibold text-primary">+£{blindsTotal}</span>
          </div>
        )}

        {/* Extras */}
        {extrasTotal > 0 && (
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
            <Plus className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-slate-700">Extra Services</p>
              <p className="text-sm text-muted-foreground">
                {data.extraServices?.map(s => s.name).join(', ')}
              </p>
            </div>
            <span className="font-semibold text-primary">+£{extrasTotal}</span>
          </div>
        )}

        {/* Steam Cleaning Items */}
        {steamCleaningTotal > 0 && (
          <div className="p-3 bg-primary/5 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="font-semibold text-slate-700">Steam Cleaning Add-ons</p>
            </div>
            <div className="space-y-1 ml-7">
              {data.carpetItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span className="text-slate-700">£{item.price * item.quantity}</span>
                </div>
              ))}
              {data.upholsteryItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span className="text-slate-700">£{item.price * item.quantity}</span>
                </div>
              ))}
              {data.mattressItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span className="text-slate-700">£{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-1 border-t border-primary/20">
                <span className="text-slate-700">Steam Cleaning Total</span>
                <span className="text-primary">£{steamCleaningTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Short Notice Charge */}
        {shortNoticeCharge > 0 && (
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-sm font-medium text-amber-700">Short Notice Charge</span>
            <span className="font-semibold text-amber-700">+£{shortNoticeCharge.toFixed(2)}</span>
          </div>
        )}

        {/* Total */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-4 text-white">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total Cost:</span>
            <span className="text-3xl font-bold">£ {totalCost.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
