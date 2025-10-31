import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingData } from './BookingForm';
import { Home, Clock, Calendar, PoundSterling, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingSummaryProps {
  data: BookingData;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const calculateShortNoticeCharge = () => {
    if (!data.selectedDate) return { charge: 0, notice: '', hoursUntil: 0 };
    
    const now = new Date();
    const cleaningDate = new Date(data.selectedDate);

    // Check if it's today (same-day booking)
    const isToday = cleaningDate.getDate() === now.getDate() &&
      cleaningDate.getMonth() === now.getMonth() &&
      cleaningDate.getFullYear() === now.getFullYear();

    if (isToday) {
      // For same-day bookings, if no specific time, assume earliest available (now + 2h)
      if (data.selectedTime) {
        const timeStr = data.selectedTime.replace(/[AP]M/, '').trim();
        const [hours, minutes] = timeStr.split(':').map(Number);
        let adjustedHours = hours;
        if (data.selectedTime.includes('PM') && hours !== 12) adjustedHours += 12;
        if (data.selectedTime.includes('AM') && hours === 12) adjustedHours = 0;
        cleaningDate.setHours(adjustedHours, minutes || 0, 0, 0);
      } else {
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        cleaningDate.setHours(twoHoursFromNow.getHours(), twoHoursFromNow.getMinutes(), 0, 0);
      }
      const hoursUntilCleaning = (cleaningDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return { charge: 50, notice: 'Same day booking (within 12 hours)', hoursUntil: hoursUntilCleaning };
    }

    // Not same-day: compute hours until cleaning based on selected time or default
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
    if (hoursUntilCleaning < 0) return { charge: 0, notice: '', hoursUntil: hoursUntilCleaning };
    if (hoursUntilCleaning <= 24) return { charge: 30, notice: 'Short notice booking (within 24 hours)', hoursUntil: hoursUntilCleaning };
    if (hoursUntilCleaning <= 48) return { charge: 15, notice: 'Short notice booking (within 48 hours)', hoursUntil: hoursUntilCleaning };
    return { charge: 0, notice: '', hoursUntil: hoursUntilCleaning };
  };

  const calculateHourlyRate = () => {
    let rate = 25; // Base rate
    
    // Service type pricing
    const serviceRates = {
      'checkin-checkout': 0,
      'midstay': 0,
      'light': -3,
      'deep': 5
    };
    rate += serviceRates[data.serviceType as keyof typeof serviceRates] || 0;
    
    // Cleaning products pricing
    if (data.cleaningProducts === 'products') {
      rate += 2; // Bring cleaning products
    }
    
    // Equipment pricing - only add to hourly rate for specific conditions
    if (data.cleaningProducts === 'equipment') {
      // If ongoing arrangement, no extra hourly charge
      if (data.equipmentArrangement === 'ongoing') {
        rate += 5; // Ongoing arrangement adds £5/hour
      } else if (data.equipmentArrangement === 'oneoff' || data.serviceType === 'deep') {
        // One-off charge handled separately, not per hour
      } else {
        // Default behavior: add per hour charge for regular cleaning
        const isStandardCleaning = data.alreadyCleaned !== false && 
          ['checkin-checkout', 'midstay', 'light'].includes(data.serviceType);
        if (isStandardCleaning) {
          rate += 5; // Per hour equipment cost for regular cleaning only
        }
      }
    }
    
    // Airbnb standard (affects rate for check-in/checkout)
    if (data.serviceType === 'checkin-checkout' && data.alreadyCleaned === false) {
      rate += 5; // Deep cleaning surcharge
    }
    
    return rate;
  };

  const calculateEquipmentCost = () => {
    if (data.cleaningProducts !== 'equipment') return 0;
    
    if (data.serviceType === 'deep' || data.equipmentArrangement === 'oneoff') {
      return 30; // One-off cost
    }
    
    if (data.equipmentArrangement === 'ongoing') {
      return 0; // No extra charge for ongoing arrangements
    }
    
    // Default behavior for equipment without arrangement specified
    const requiresOneOffCost = data.alreadyCleaned === false || 
      !['checkin-checkout', 'midstay', 'light'].includes(data.serviceType);
    if (requiresOneOffCost) {
      return 30; // One-off cost
    } else {
      return (data.estimatedHours || 0) * 5; // Per hour cost
    }
  };

  const calculateOvenCost = () => {
    if (!data.needsOvenCleaning || !data.ovenType) return 0;
    
    const ovenCosts = {
      single: 25,
      double: 35,
      range: 45,
      convection: 30
    };
    
    return ovenCosts[data.ovenType as keyof typeof ovenCosts] || 0;
  };

  const calculateTotal = () => {
    let total = 0;
    const hourlyRate = calculateHourlyRate();
    
    // Cleaning service cost
    if (data.estimatedHours) {
      const cleaningHours = data.estimatedHours + (data.extraHours || 0);
      const baseRate = 25;
      
      // Service type cost
      const serviceRates = { 'checkin-checkout': 0, 'midstay': 0, 'light': -3, 'deep': 5 };
      const serviceAdjustment = serviceRates[data.serviceType as keyof typeof serviceRates] || 0;
      
      // Products cost
      const productsAdjustment = data.cleaningProducts === 'products' ? 2 : 0;
      
      // Airbnb standard adjustment
      const airbnbAdjustment = (data.serviceType === 'checkin-checkout' && data.alreadyCleaned === false) ? 5 : 0;
      
      const cleaningRate = baseRate + serviceAdjustment + productsAdjustment + airbnbAdjustment;
      total += cleaningHours * cleaningRate;
    }
    
    // Equipment cost (separate from hourly rate)
    total += calculateEquipmentCost();
    
    // Oven cleaning cost
    total += calculateOvenCost();
    
    // Short notice charges
    const shortNotice = calculateShortNoticeCharge();
    total += shortNotice.charge;
    
    // Linen packages cost
    if (data.linenPackages) {
      Object.entries(data.linenPackages).forEach(([packageId, quantity]) => {
        const packagePrices = {
          single: 19.95, double: 23.95, king: 25.75, superking: 26.75,
          bathmat: 2.80, bathsheet: 3.10, bathrobe: 6.50, teatowel: 1.30
        };
        const price = packagePrices[packageId as keyof typeof packagePrices] || 0;
        total += price * quantity;
      });
    }
    
    return total;
  };

  const shortNoticeInfo = calculateShortNoticeCharge();
  const hasShortNoticeCharge = shortNoticeInfo.charge > 0;

  const renderSummaryContent = () => (
    <div className="space-y-3">
      {/* Service Section */}
      {getServiceDescription() && data.estimatedHours && data.estimatedHours > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{getServiceDescription()}</span>
            <span className="text-foreground font-semibold whitespace-nowrap">
              {(data.estimatedHours + (data.extraHours || 0))}h × £{calculateHourlyRate().toFixed(2)}/hr
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
      {data.cleaningProducts === 'equipment' && calculateEquipmentCost() > 0 && (
        <div className="space-y-3 mt-3">
          <div className="flex justify-between items-center pl-4">
            <span className="text-muted-foreground">
              Equipment {data.equipmentArrangement === 'oneoff' ? 'delivery' : ''}
            </span>
            <span className="text-foreground font-semibold">
              £{calculateEquipmentCost().toFixed(2)}
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
              £{calculateOvenCost().toFixed(2)}
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
      {getLinensDescription() && data.linensHandling !== 'customer-handles' && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Linens</span>
          <span className="text-foreground font-medium">{getLinensDescription()}</span>
        </div>
      )}

      {/* Linen packages */}
      {data.linenPackages && Object.entries(data.linenPackages).map(([packageId, quantity]) => {
        if (quantity === 0) return null;
        const packagePrices = { 
          single: 19.95, double: 23.95, king: 25.75, superking: 26.75,
          bathmat: 2.80, bathsheet: 3.10, bathrobe: 6.50, teatowel: 1.30 
        };
        const price = packagePrices[packageId as keyof typeof packagePrices] || 0;
        const packageLabels = {
          single: 'Single Bed Set', double: 'Double Bed Set', 
          king: 'King Bed Set', superking: 'Super King Bed Set',
          bathmat: 'Bath Mat', bathsheet: 'Bath Sheet', 
          bathrobe: 'Bath Robe', teatowel: 'Tea Towel'
        };
        const label = packageLabels[packageId as keyof typeof packageLabels] || packageId;
        return (
          <div key={packageId} className="flex justify-between items-center pl-4">
            <span className="text-muted-foreground">
              {label} ({quantity})
            </span>
            <span className="text-foreground font-semibold">
              £{(price * quantity).toFixed(2)}
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