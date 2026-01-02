// Utility functions to format booking data for cleaner-friendly display

/**
 * Normalizes cleaning type keys to match company settings format
 * Handles various formats and edge cases from legacy data
 */
export const normalizeCleaningTypeKey = (key: string | null | undefined): string => {
  if (!key) return '';
  
  const lowerKey = key.toLowerCase().trim();
  
  const mappings: Record<string, string> = {
    'checkin-checkout': 'check_in_check_out',
    'check in check out': 'check_in_check_out',
    'midstay': 'midstay_cleaning',
    'mid-stay': 'midstay_cleaning',
    'mid stay': 'midstay_cleaning',
    'standard cleaning': 'standard_cleaning',
    'deep cleaning': 'deep_cleaning',
    'one off': 'one_off',
    'one-off': 'one_off',
    'light cleaning': 'light_cleaning',
    // Handle cases where service types ended up in cleaning_type field
    'airbnb': 'check_in_check_out',  // Common swap
    'domestic': 'standard_cleaning',
    'commercial': 'standard_cleaning',
    'domestic cleaning': 'standard_cleaning',
    'commercial cleaning': 'standard_cleaning',
  };
  
  return mappings[lowerKey] || key;
};

/**
 * Normalizes service type keys to match company settings format
 * Handles various formats and edge cases from legacy data
 */
export const normalizeServiceTypeKey = (key: string | null | undefined): string => {
  if (!key) return '';
  
  const lowerKey = key.toLowerCase().trim();
  
  const mappings: Record<string, string> = {
    'domestic cleaning': 'domestic',
    'commercial cleaning': 'commercial',
    'standard cleaning': 'domestic',  // Legacy mapping
    'deep cleaning': 'deep_cleaning',
    'end of tenancy': 'end_of_tenancy',
    'end-of-tenancy': 'end_of_tenancy',
    // Handle cases where cleaning types ended up in service_type field
    'check_in_check_out': 'airbnb',
    'checkin-checkout': 'airbnb',
    'midstay_cleaning': 'airbnb',
    'standard_cleaning': 'domestic',
    'deep_cleaning': 'deep_cleaning',
  };
  
  return mappings[lowerKey] || key;
};

/**
 * Intelligently corrects service_type and cleaning_type when they're swapped
 * Returns corrected { serviceType, cleaningType } object
 */
export const correctBookingTypes = (booking: { service_type?: string | null; cleaning_type?: string | null }) => {
  const serviceType = booking.service_type || '';
  const cleaningType = booking.cleaning_type || '';
  
  // Known service type keys (these should be in service_type field)
  const serviceTypeKeys = ['domestic', 'commercial', 'airbnb', 'end_of_tenancy', 'deep_cleaning', 'domestic_cleaning'];
  
  // Known cleaning type keys (these should be in cleaning_type field)  
  const cleaningTypeKeys = ['check_in_check_out', 'checkin-checkout', 'midstay_cleaning', 'standard_cleaning', 'deep_cleaning', 'one_off', 'light_cleaning'];
  
  const serviceLower = serviceType.toLowerCase().trim();
  const cleaningLower = cleaningType.toLowerCase().trim();
  
  // Check if they're swapped
  const serviceIsActuallyCleaning = cleaningTypeKeys.includes(serviceLower) || serviceLower.includes('check_in') || serviceLower.includes('checkin');
  const cleaningIsActuallyService = serviceTypeKeys.includes(cleaningLower) || ['airbnb', 'domestic', 'commercial'].includes(cleaningLower);
  
  // If both are swapped, swap them back
  if (serviceIsActuallyCleaning && cleaningIsActuallyService) {
    return {
      serviceType: cleaningType,
      cleaningType: serviceType
    };
  }
  
  // If only service is wrong, try to infer correct service from cleaning
  if (serviceIsActuallyCleaning && !cleaningIsActuallyService) {
    // Airbnb-related cleaning types should have airbnb as service
    if (serviceLower.includes('check_in') || serviceLower.includes('checkin') || serviceLower.includes('midstay')) {
      return {
        serviceType: 'airbnb',
        cleaningType: serviceType
      };
    }
    // Standard/deep cleaning could be domestic or commercial - keep original cleaning, default to domestic
    return {
      serviceType: 'domestic',
      cleaningType: serviceType
    };
  }
  
  // If only cleaning is wrong, swap
  if (cleaningIsActuallyService && !serviceIsActuallyCleaning) {
    return {
      serviceType: cleaningType,
      cleaningType: serviceType
    };
  }
  
  // No swap needed
  return {
    serviceType: serviceType,
    cleaningType: cleaningType
  };
};

/**
 * Converts camelCase or snake_case keys to human-readable labels
 */
export const formatFieldName = (key: string): string => {
  // Handle common special cases
  const specialCases: Record<string, string> = {
    airbnb: "Airbnb",
    propertyFeatures: "Property Features",
    additionalRooms: "Additional Rooms",
    linensHandling: "Linens Handling",
    shortNoticeCharge: "Short Notice Charge",
    alreadyCleaned: "Already Cleaned",
    cleaningProducts: "Cleaning Products",
    studyRooms: "Study Rooms",
    utilityRooms: "Utility Rooms",
    otherRooms: "Other Rooms",
    separateKitchen: "Separate Kitchen",
    livingRoom: "Living Room",
    diningRoom: "Dining Room",
  };

  if (specialCases[key]) return specialCases[key];

  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/([A-Z])/g, " $1") // Add space before capitals
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
};

/**
 * Formats a value based on its type
 */
export const formatFieldValue = (value: any, key?: string): string => {
  if (value === null || value === undefined) return "Not specified";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    // Check if it's a currency value
    if (key?.toLowerCase().includes("charge") || key?.toLowerCase().includes("cost")) {
      return `£${value}`;
    }
    return value.toString();
  }
  if (typeof value === "string") {
    // Format special string values
    if (value === "customer-handles") return "Customer Handles";
    if (value === "cleaner-brings") return "Cleaner Brings";
    if (value === "keybox") return "Keybox";
    if (value === "meet-customer") return "Meet Customer";
    if (value === "hidden-key") return "Hidden Key";
    if (value === "studio") return "Studio";
    if (value === "flat") return "Flat";
    if (value === "house") return "House";
    if (value === "apartment") return "Apartment";
    
    // Capitalize first letter for other strings
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return String(value);
};

/**
 * Formats property details from JSON string to readable text
 */
export const formatPropertyDetails = (detailsString: string | null | undefined): string => {
  if (!detailsString) return "";

  try {
    const details = typeof detailsString === "string" ? JSON.parse(detailsString) : detailsString;
    const lines: string[] = [];

    // Main property info
    if (details.type) {
      lines.push(`Property Type: ${formatFieldValue(details.type)}`);
    }
    if (details.bedrooms) {
      const bedroomValue = details.bedrooms === "studio" ? "Studio" : `${details.bedrooms} bedroom${details.bedrooms > 1 ? "s" : ""}`;
      lines.push(`Bedrooms: ${bedroomValue}`);
    }
    if (details.bathrooms) {
      lines.push(`Bathrooms: ${details.bathrooms}`);
    }
    if (details.toilets && details.toilets !== "0" && details.toilets !== 0) {
      lines.push(`Toilets: ${details.toilets}`);
    }

    // Additional rooms (only show non-zero values)
    if (details.additionalRooms && typeof details.additionalRooms === "object") {
      const roomLines: string[] = [];
      Object.entries(details.additionalRooms).forEach(([key, value]) => {
        if (value && value !== 0 && value !== "0") {
          roomLines.push(`${formatFieldName(key)}: ${value}`);
        }
      });
      if (roomLines.length > 0) {
        lines.push("", "Additional Rooms:", ...roomLines);
      }
    }

    // Property features (only show true values)
    if (details.propertyFeatures && typeof details.propertyFeatures === "object") {
      const features: string[] = [];
      Object.entries(details.propertyFeatures).forEach(([key, value]) => {
        if (value === true) {
          features.push(formatFieldName(key));
        }
      });
      if (features.length > 0) {
        lines.push("", `Features: ${features.join(", ")}`);
      }
    }

    return lines.join("\n");
  } catch (error) {
    console.error("Error parsing property details:", error);
    return detailsString || "";
  }
};

/**
 * Formats service/cleaning type to user-friendly display name
 * Handles all raw database values including legacy and inconsistent formats
 */
export const formatServiceType = (serviceType: string | null | undefined): string => {
  if (!serviceType) return 'Standard Cleaning';
  
  const lowerType = serviceType.toLowerCase().trim();
  
  const serviceTypeMap: Record<string, string> = {
    // Service types
    'domestic': 'Domestic Cleaning',
    'domestic cleaning': 'Domestic Cleaning',
    'domestic_cleaning': 'Domestic Cleaning',
    'commercial': 'Commercial Cleaning',
    'commercial cleaning': 'Commercial Cleaning',
    'commercial_cleaning': 'Commercial Cleaning',
    'airbnb': 'Airbnb Cleaning',
    'airbnb cleaning': 'Airbnb Cleaning',
    'airbnb_cleaning': 'Airbnb Cleaning',
    'air bnb': 'Airbnb Cleaning',
    'carpet': 'Carpet Cleaning',
    'carpet cleaning': 'Carpet Cleaning',
    'carpet_cleaning': 'Carpet Cleaning',
    'end of tenancy': 'End of Tenancy',
    'end_of_tenancy': 'End of Tenancy',
    'end-of-tenancy': 'End of Tenancy',
    
    // Cleaning types - Airbnb related
    'checkin-checkout': 'Airbnb Cleaning',
    'check_in_check_out': 'Airbnb Cleaning',
    'check-in/check-out': 'Airbnb Cleaning',
    'midstay': 'Midstay Cleaning',
    'midstay_cleaning': 'Midstay Cleaning',
    'mid-stay': 'Midstay Cleaning',
    
    // Cleaning types - Domestic related
    'standard_cleaning': 'Standard Cleaning',
    'standard cleaning': 'Standard Cleaning',
    'deep_cleaning': 'Deep Cleaning',
    'deep cleaning': 'Deep Cleaning',
    'one_off': 'One-Off Cleaning',
    'one-off': 'One-Off Cleaning',
    'onetime': 'One-Off Cleaning',
    'weekly': 'Weekly Cleaning',
    'biweekly': 'Bi-Weekly Cleaning',
    'bi-weekly': 'Bi-Weekly Cleaning',
    'fortnightly': 'Fortnightly Cleaning',
    'monthly': 'Monthly Cleaning',
    'light_cleaning': 'Light Cleaning',
    'light cleaning': 'Light Cleaning',
    'after_party': 'After Party Cleaning',
    'after party': 'After Party Cleaning',
  };
  
  return serviceTypeMap[lowerType] || serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Formats additional details from JSON string to readable text
 */
export const formatAdditionalDetails = (detailsString: string | null | undefined): string => {
  if (!detailsString) return "";

  try {
    const details = typeof detailsString === "string" ? JSON.parse(detailsString) : detailsString;
    const lines: string[] = [];

  // Direct fields
  if (details.alreadyCleaned !== undefined) {
    lines.push(`Already Cleaned: ${formatFieldValue(details.alreadyCleaned)}`);
  }
  // Only show linens handling if cleaner needs to do something (not customer-handles)
  if (details.linensHandling && details.linensHandling !== "customer-handles") {
    lines.push(`Linens Handling: ${formatFieldValue(details.linensHandling)}`);
  }
  // Short Notice Charge removed - cleaners don't need to see it

    // Access information
    if (details.access && typeof details.access === "object") {
      if (details.access.method) {
        lines.push(`Access Method: ${formatFieldValue(details.access.method)}`);
      }
      if (details.access.notes) {
        lines.push(`Access Notes: ${details.access.notes}`);
      }
    }

    // Cleaning products
    if (details.cleaningProducts && typeof details.cleaningProducts === "object") {
      if (details.cleaningProducts.type) {
        lines.push(`Cleaning Products: ${formatFieldValue(details.cleaningProducts.type)}`);
      }
      if (details.cleaningProducts.storageConfirmed !== undefined) {
        lines.push(`Storage Confirmed: ${formatFieldValue(details.cleaningProducts.storageConfirmed)}`);
      }
    }

    // Any other top-level fields
    Object.entries(details).forEach(([key, value]) => {
      if (!["alreadyCleaned", "linensHandling", "shortNoticeCharge", "access", "cleaningProducts"].includes(key)) {
        if (typeof value !== "object" && value !== null && value !== undefined) {
          lines.push(`${formatFieldName(key)}: ${formatFieldValue(value, key)}`);
        }
      }
    });

    return lines.join("\n");
  } catch (error) {
    console.error("Error parsing additional details:", error);
    return detailsString || "";
  }
};
