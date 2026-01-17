import React, { useState } from 'react';
import { Home, Bath, Key, Sparkles, Calendar, Package, Flame, FileText, Droplets, Clock, ChevronDown, ChevronUp, Shirt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DomesticBookingDetailsProps {
  propertyDetails?: string | null;
  additionalDetails?: string | null;
  ovenSize?: string | null;
  access?: string | null;
  frequently?: string | null;
  serviceType?: string | null;
  cleaningType?: string | null;
  totalHours?: number | null;
  recommendedHours?: number | null;
  hoursRequired?: number | null;
  ironingHours?: number | null;
}

interface ParsedPropertyDetails {
  propertyType?: string;
  bedrooms?: string | number;
  bathrooms?: string | number;
  toilets?: string | number;
  additionalRooms?: {
    toilets?: number;
    studyRooms?: number;
    utilityRooms?: number;
    otherRooms?: number;
  };
  propertyFeatures?: {
    separateKitchen?: boolean;
    livingRoom?: boolean;
    diningRoom?: boolean;
  };
}

interface FirstDeepCleanInfo {
  enabled?: boolean;
  extraHours?: number;
  hours?: number;
  cost?: number;
  regularRecurringCost?: number;
}

interface ParsedAdditionalDetails {
  serviceFrequency?: string;
  firstDeepClean?: FirstDeepCleanInfo;
  ovenCleaning?: boolean;
  ovenSize?: string;
  equipmentArrangement?: string;
  cleaningProducts?: string[];
  access?: { method?: string; notes?: string };
  notes?: string;
  ironingHours?: number;
}

// Parse property_details JSON
const parsePropertyDetails = (detailsString?: string | null): ParsedPropertyDetails => {
  if (!detailsString) return {};
  
  try {
    return JSON.parse(detailsString);
  } catch {
    return {};
  }
};

// Parse additional_details JSON
const parseAdditionalDetails = (detailsString?: string | null): ParsedAdditionalDetails => {
  if (!detailsString) return {};
  
  // Check if it's just a payment note, not actual details
  if (detailsString.startsWith('Payment captured') || detailsString.startsWith('Payment')) {
    return {};
  }
  
  try {
    return JSON.parse(detailsString);
  } catch {
    return {};
  }
};

// Format frequency display
const formatFrequency = (frequency?: string | null): string => {
  if (!frequency) return '';
  const freqMap: Record<string, string> = {
    'weekly': 'Weekly',
    'biweekly': 'Biweekly',
    'bi-weekly': 'Biweekly',
    'fortnightly': 'Fortnightly',
    'monthly': 'Monthly',
    'one_off': 'One-off',
    'oneoff': 'One-off',
    'one-off': 'One-off',
  };
  return freqMap[frequency.toLowerCase()] || frequency;
};

// Format property type display
const formatPropertyType = (type?: string): string => {
  if (!type) return '';
  const typeMap: Record<string, string> = {
    'flat': 'Flat',
    'house': 'House',
    'studio': 'Studio',
    'apartment': 'Apartment',
    'bungalow': 'Bungalow',
    'maisonette': 'Maisonette',
  };
  return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
};

// Format equipment arrangement
const formatEquipment = (equipment?: string): string => {
  if (!equipment) return '';
  const equipMap: Record<string, string> = {
    'oneoff': 'One-off delivery',
    'one_off': 'One-off delivery',
    'ongoing': 'Leave at property',
  };
  return equipMap[equipment.toLowerCase()] || equipment;
};

// Format access method
const formatAccessMethod = (access?: string): string => {
  if (!access) return '';
  const accessMap: Record<string, string> = {
    'meet': 'Meet customer',
    'meet_customer': 'Meet customer',
    'key_safe': 'Key safe',
    'concierge': 'Concierge',
    'key_collection': 'Key collection',
    'spare_key': 'Spare key',
  };
  return accessMap[access.toLowerCase().replace(/\s+/g, '_')] || access;
};

const DomesticBookingDetails: React.FC<DomesticBookingDetailsProps> = ({
  propertyDetails,
  additionalDetails,
  ovenSize,
  access,
  frequently,
  serviceType,
  cleaningType,
  totalHours,
  recommendedHours,
  hoursRequired,
  ironingHours,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Only show for domestic cleaning
  const isDomestic = serviceType?.toLowerCase().includes('domestic') || 
                     serviceType?.toLowerCase().includes('standard') ||
                     serviceType?.toLowerCase() === 'domestic_cleaning';

  if (!isDomestic) return null;

  const property = parsePropertyDetails(propertyDetails);
  const additional = parseAdditionalDetails(additionalDetails);
  
  // Extract values
  const accessMethod = access || additional.access?.method;
  const freq = additional.serviceFrequency || frequently;
  const hasFirstDeepClean = additional.firstDeepClean?.enabled;
  const deepCleanHours = additional.firstDeepClean?.hours || totalHours;
  const regularHours = recommendedHours || (totalHours && additional.firstDeepClean?.extraHours ? 
    totalHours - additional.firstDeepClean.extraHours : null);
  const equipmentArrangement = additional.equipmentArrangement;
  const accessNotes = additional.access?.notes;
  
  // Build detail items
  const detailItems: { icon: React.ReactNode; label: string; value: string }[] = [];
  
  // Property info
  if (property.propertyType || property.bedrooms) {
    const beds = property.bedrooms ? `${property.bedrooms} Bed ` : '';
    const type = formatPropertyType(property.propertyType);
    if (beds || type) {
      detailItems.push({ 
        icon: <Home className="h-3.5 w-3.5" />, 
        label: 'Property', 
        value: `${beds}${type}`.trim() 
      });
    }
  }
  
  // Bathrooms
  if (property.bathrooms && Number(property.bathrooms) > 0) {
    detailItems.push({ 
      icon: <Bath className="h-3.5 w-3.5" />, 
      label: 'Bathrooms', 
      value: `${property.bathrooms}` 
    });
  }
  
  // Frequency
  if (freq) {
    detailItems.push({ 
      icon: <Calendar className="h-3.5 w-3.5" />, 
      label: 'Frequency', 
      value: formatFrequency(freq) 
    });
  }
  
  // Hours - First Deep Clean
  if (hasFirstDeepClean && deepCleanHours) {
    detailItems.push({ 
      icon: <Clock className="h-3.5 w-3.5" />, 
      label: 'First Clean', 
      value: `${deepCleanHours}h (Deep Clean)` 
    });
    if (regularHours && regularHours !== deepCleanHours) {
      detailItems.push({ 
        icon: <Clock className="h-3.5 w-3.5" />, 
        label: 'Regular', 
        value: `${regularHours}h` 
      });
    }
  } else if (totalHours || hoursRequired) {
    // Regular hours display if not first deep clean
    const hours = totalHours || hoursRequired;
    if (hours && !detailItems.find(i => i.label === 'First Clean')) {
      // Only add if we haven't already added hours info
      detailItems.push({ 
        icon: <Clock className="h-3.5 w-3.5" />, 
        label: 'Hours', 
        value: `${hours}h` 
      });
    }
  }
  
  // Ironing hours
  if (ironingHours && ironingHours > 0) {
    detailItems.push({ 
      icon: <Shirt className="h-3.5 w-3.5" />, 
      label: 'Ironing', 
      value: `${ironingHours}h` 
    });
  }
  
  // Access method
  if (accessMethod) {
    detailItems.push({ 
      icon: <Key className="h-3.5 w-3.5" />, 
      label: 'Access', 
      value: formatAccessMethod(accessMethod) 
    });
  }
  
  // Equipment
  if (equipmentArrangement) {
    detailItems.push({ 
      icon: <Package className="h-3.5 w-3.5" />, 
      label: 'Equipment', 
      value: formatEquipment(equipmentArrangement) 
    });
  }
  
  // Oven cleaning
  if (ovenSize) {
    detailItems.push({ 
      icon: <Flame className="h-3.5 w-3.5" />, 
      label: 'Oven', 
      value: ovenSize.charAt(0).toUpperCase() + ovenSize.slice(1) 
    });
  }
  
  // Notes
  if (accessNotes) {
    detailItems.push({ 
      icon: <FileText className="h-3.5 w-3.5" />, 
      label: 'Notes', 
      value: accessNotes 
    });
  }

  // If no details, don't render anything
  if (detailItems.length === 0) return null;

  // Handle toggle - prevent page refresh
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button 
          type="button"
          onClick={handleToggle}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer border-t border-border/30"
        >
          <div className="flex items-center gap-3 flex-wrap min-w-0 flex-1">
            {/* Cleaning type badge (deep clean, weekly, biweekly, etc.) */}
            {hasFirstDeepClean && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 font-medium flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                First Deep Clean
              </Badge>
            )}
            {cleaningType && !hasFirstDeepClean && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium flex-shrink-0">
                {cleaningType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Badge>
            )}
            {/* Show ALL items inline - no "+X more" */}
            {detailItems.map((item, idx) => (
              <span key={idx} className="flex items-center gap-1.5 text-sm text-muted-foreground flex-shrink-0">
                <span className="text-primary">{item.icon}</span>
                <span className="font-medium">{item.value}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0 ml-3">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-4 py-3 bg-muted/20 border-t border-border/20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {detailItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="text-primary mt-0.5 flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground font-medium">{item.label}</div>
                  <div className="text-sm text-foreground">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DomesticBookingDetails;
