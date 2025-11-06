// Utility functions to format booking data for cleaner-friendly display

/**
 * Normalizes cleaning type keys to match company settings format
 */
export const normalizeCleaningTypeKey = (key: string): string => {
  const mappings: Record<string, string> = {
    'checkin-checkout': 'check_in_check_out',
    'midstay': 'midstay_cleaning',
    // Add more mappings as needed
  };
  
  return mappings[key] || key;
};

/**
 * Normalizes service type keys to match company settings format
 */
export const normalizeServiceTypeKey = (key: string): string => {
  // Add mappings if needed in the future
  return key;
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
  if (details.linensHandling) {
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
