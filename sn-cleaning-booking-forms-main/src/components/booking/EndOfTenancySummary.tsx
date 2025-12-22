import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Calendar, Clock, Sparkles, CookingPot } from 'lucide-react';
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

const HOURLY_RATE = 28; // End of tenancy rate

const OVEN_PRICES: Record<string, number> = {
  single: 45,
  double: 65,
  range: 85,
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
  const ovenCleaningCost = data.hasOvenCleaning && data.ovenType ? OVEN_PRICES[data.ovenType] || 0 : 0;
  
  // Calculate steam cleaning total
  const steamCleaningTotal = 
    data.carpetItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
    data.upholsteryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
    data.mattressItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate short notice charge
  const shortNoticeCharge = data.shortNoticeCharge || 0;
  
  // Calculate total cost
  const baseCost = baseHours * HOURLY_RATE;
  const totalCost = baseCost + ovenCleaningCost + steamCleaningTotal + shortNoticeCharge;
  
  // Format property type
  const propertyTypeLabel = data.propertyType === 'house' ? 'House' : data.propertyType === 'flat' ? 'Flat' : '';
  
  // Format bedrooms
  const getBedroomLabel = (value: string) => {
    if (value === 'studio') return 'Studio';
    if (value === '6+') return '6+ Bed';
    return `${value} Bed`;
  };

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-slate-700">Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Details */}
        {(data.propertyType || data.bedrooms || data.bathrooms) && (
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
            <Home className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-slate-700">Property</p>
              <p className="text-sm text-muted-foreground">
                {propertyTypeLabel && `${propertyTypeLabel}, `}
                {data.bedrooms && `${getBedroomLabel(data.bedrooms)}, `}
                {data.bathrooms && `${data.bathrooms} Bath`}
              </p>
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
        {data.hasOvenCleaning && data.ovenType && (
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
            <CookingPot className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-slate-700">Oven Cleaning</p>
              <p className="text-sm text-muted-foreground capitalize">{data.ovenType} oven</p>
            </div>
            <span className="font-semibold text-primary">+£{ovenCleaningCost}</span>
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
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="text-slate-700">£{item.price}</span>
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
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="text-slate-700">£{item.price}</span>
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

        {/* Price Breakdown */}
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cleaning ({baseHours}h × £{HOURLY_RATE})</span>
            <span className="text-slate-700">£{baseCost.toFixed(2)}</span>
          </div>
          {ovenCleaningCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Oven Cleaning</span>
              <span className="text-slate-700">£{ovenCleaningCost.toFixed(2)}</span>
            </div>
          )}
          {steamCleaningTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Steam Cleaning</span>
              <span className="text-slate-700">£{steamCleaningTotal.toFixed(2)}</span>
            </div>
          )}
          {shortNoticeCharge > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Short Notice</span>
              <span className="text-slate-700">£{shortNoticeCharge.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-4 text-white">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-3xl font-bold">£{totalCost.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
