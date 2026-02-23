/**
 * Check if the user came from the landing page quote funnel.
 * The landing page sets 'quote_session_id' in localStorage when submitting the free quote form.
 * Only users from the landing page are eligible for the first-time customer discount.
 */
export const isEligibleForFirstTimeDiscount = (): boolean => {
  const sessionId = localStorage.getItem('quote_session_id');
  const timestamp = localStorage.getItem('quote_session_timestamp');
  
  if (!sessionId || !timestamp) return false;
  
  // Check if the session is still valid (within 24 hours)
  const sessionAge = Date.now() - parseInt(timestamp, 10);
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  return sessionAge < TWENTY_FOUR_HOURS;
};
