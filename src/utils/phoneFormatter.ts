/**
 * Formats a phone number to international format for SMS sending via Twilio.
 * Specifically handles UK phone numbers.
 * 
 * Examples:
 * - "07494 875251" → "+447494875251"
 * - "07494875251" → "+447494875251"
 * - "+447494875251" → "+447494875251" (already formatted)
 * - "447494875251" → "+447494875251"
 */
export function formatPhoneToInternational(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove all spaces, dashes, parentheses, and other non-numeric characters except +
  let cleaned = phone.replace(/[^\\d+]/g, '');
  
  // If empty after cleaning, return original
  if (!cleaned) return phone;
  
  // If it starts with +, assume it's already in international format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // UK number starting with 0 (e.g., 07494875251)
  if (cleaned.startsWith('0') && cleaned.length >= 10) {
    // Remove leading 0 and add +44
    return '+44' + cleaned.substring(1);
  }
  
  // UK number starting with 44 (e.g., 447494875251)
  if (cleaned.startsWith('44') && cleaned.length >= 11) {
    return '+' + cleaned;
  }
  
  // For other formats, try to add + if it looks like an international number
  if (cleaned.length >= 10) {
    // If it's a UK mobile without country code (starts with 7)
    if (cleaned.startsWith('7') && cleaned.length === 10) {
      return '+44' + cleaned;
    }
    // Otherwise assume it might need a + prefix
    return '+' + cleaned;
  }
  
  // Return original if we can't determine the format
  return phone;
}

/**
 * Validates if a phone number looks valid for SMS
 */
export function isValidPhoneForSMS(phone: string | null | undefined): boolean {
  if (!phone) return false;
  
  const formatted = formatPhoneToInternational(phone);
  
  // Should start with + and have at least 10 digits
  return formatted.startsWith('+') && formatted.replace(/\D/g, '').length >= 10;
}
