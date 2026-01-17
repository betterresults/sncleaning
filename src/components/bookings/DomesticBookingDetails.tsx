import React from 'react';
import { Home, Bath, Key, Sparkles, Calendar, Package, Flame, FileText, Droplets } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DomesticBookingDetailsProps {
  propertyDetails?: string | null;
  additionalDetails?: string | null;
  ovenSize?: string | null;
  access?: string | null;
  frequently?: string | null;
  serviceType?: string | null;
}

interface ParsedPropertyDetails {
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  kitchens?: string;
  receptionRooms?: number;
  additionalRooms?: string[];
}

interface ParsedAdditionalDetails {
  firstDeepClean?: boolean;
  ovenCleaning?: boolean;
  ovenSize?: string;
  equipmentArrangement?: string;
  cleaningProducts?: string[];
  accessMethod?: string;
  notes?: string;
  ironingHours?: number;
}

// Parse property_details JSON
const parsePropertyDetails = (detailsString?: string | null): ParsedPropertyDetails => {
  if (!detailsString) return {};
  
  try {
    const parsed = JSON.parse(detailsString);
    return {
      propertyType: parsed.property_type || parsed.propertyType,
      bedrooms: parsed.bedrooms,
      bathrooms: parsed.bathrooms,
      toilets: parsed.toilets,
      kitchens: parsed.kitchen || parsed.kitchens,
      receptionRooms: parsed.reception_rooms || parsed.receptionRooms,
      additionalRooms: parsed.additional_rooms || parsed.additionalRooms || [],
    };
  } catch {
    return {};
  }
};

// Parse additional_details JSON
const parseAdditionalDetails = (detailsString?: string | null): ParsedAdditionalDetails => {
  if (!detailsString) return {};
  
  try {
    const parsed = JSON.parse(detailsString);
    return {
      firstDeepClean: parsed.first_deep_clean || parsed.firstDeepClean || parsed.isFirstDeepClean,
      ovenCleaning: parsed.oven_cleaning || parsed.ovenCleaning,
      ovenSize: parsed.oven_size || parsed.ovenSize,
      equipmentArrangement: parsed.equipment_arrangement || parsed.equipmentArrangement,
      cleaningProducts: parsed.cleaning_products || parsed.cleaningProducts || [],
      accessMethod: parsed.access || parsed.accessMethod || parsed.property_access,
      notes: parsed.notes || parsed.customer_notes || parsed.accessNotes,
      ironingHours: parsed.ironing_hours || parsed.ironingHours,
    };
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

// Format oven size
const formatOvenSize = (size?: string): string => {
  if (!size) return '';
  const ovenMap: Record<string, string> = {
    'single': 'Single Oven',
    'double': 'Double Oven',
    'range': 'Range Cooker',
  };
  return ovenMap[size.toLowerCase()] || size;
};

// Format cleaning products
const formatCleaningProducts = (products?: string[]): string => {
  if (!products || products.length === 0) return '';
  
  const productMap: Record<string, string> = {
    'customer_provides': 'Customer provides',
    'cleaner_brings': 'Cleaner brings',
    'equipment': 'Equipment needed',
  };
  
  return products
    .map(p => productMap[p] || p)
    .join(', ');
};

// Format access method
const formatAccessMethod = (access?: string): string => {
  if (!access) return '';
  const accessMap: Record<string, string> = {
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
}) => {
  // Only show for domestic cleaning
  const isDomestic = serviceType?.toLowerCase().includes('domestic') || 
                     serviceType?.toLowerCase().includes('regular') ||
                     serviceType?.toLowerCase() === 'domestic_cleaning';

  if (!isDomestic) return null;

  const property = parsePropertyDetails(propertyDetails);
  const additional = parseAdditionalDetails(additionalDetails);
  
  // Merge access from different sources
  const accessMethod = access || additional.accessMethod;
  const ovenSizeValue = ovenSize || additional.ovenSize;

  // Check if we have any data to display
  const hasPropertyData = property.propertyType || property.bedrooms || property.bathrooms;
  const hasServiceData = frequently || additional.firstDeepClean || additional.ovenCleaning || 
                         additional.equipmentArrangement || (additional.cleaningProducts && additional.cleaningProducts.length > 0);
  const hasNotes = additional.notes;

  if (!hasPropertyData && !hasServiceData && !accessMethod && !hasNotes) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Property Details Column */}
        {hasPropertyData && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Property</h4>
            <div className="space-y-1.5">
              {property.propertyType && (
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-3.5 w-3.5 text-primary" />
                  <span className="text-foreground">
                    {property.bedrooms ? `${property.bedrooms} Bed ` : ''}
                    {formatPropertyType(property.propertyType)}
                  </span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="h-3.5 w-3.5 text-primary" />
                  <span className="text-foreground">{property.bathrooms} Bathroom{property.bathrooms > 1 ? 's' : ''}</span>
                </div>
              )}
              {accessMethod && (
                <div className="flex items-center gap-2 text-sm">
                  <Key className="h-3.5 w-3.5 text-primary" />
                  <span className="text-foreground">{formatAccessMethod(accessMethod)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service Details Column */}
        {hasServiceData && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service</h4>
            <div className="space-y-1.5">
              {frequently && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="text-foreground">{formatFrequency(frequently)}</span>
                </div>
              )}
              {additional.firstDeepClean && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5">
                  <Sparkles className="h-3 w-3 mr-1" />
                  First Deep Clean
                </Badge>
              )}
              {(additional.cleaningProducts && additional.cleaningProducts.length > 0) && (
                <div className="flex items-center gap-2 text-sm">
                  <Droplets className="h-3.5 w-3.5 text-primary" />
                  <span className="text-foreground">{formatCleaningProducts(additional.cleaningProducts)}</span>
                </div>
              )}
              {additional.equipmentArrangement && (
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <span className="text-foreground">{formatEquipment(additional.equipmentArrangement)}</span>
                </div>
              )}
              {(additional.ovenCleaning || ovenSizeValue) && (
                <div className="flex items-center gap-2 text-sm">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-foreground">{formatOvenSize(ovenSizeValue) || 'Oven Cleaning'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes Column */}
        {hasNotes && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</h4>
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground line-clamp-3">{additional.notes}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DomesticBookingDetails;
