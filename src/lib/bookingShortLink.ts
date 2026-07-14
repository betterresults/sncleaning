const PROD_ORIGIN = 'https://account.sncleaningservices.co.uk';

/**
 * Customer-facing absolute short URL (email / SMS). Always production so local
 * admin sessions cannot email localhost links to customers.
 */
export function getCustomerBookingShortUrl(shortCode: string): string {
  return `${PROD_ORIGIN}/b/${shortCode}`;
}

/**
 * In-app copy / preview URL. Uses the current origin on localhost so admins can
 * test `/b/:code` locally; otherwise production.
 */
export function getAppBookingShortUrl(shortCode: string): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${window.location.origin}/b/${shortCode}`;
    }
  }
  return getCustomerBookingShortUrl(shortCode);
}

/** Normalize stored quote service labels for routing ("Air BnB" → "airbnb"). */
export function normalizeQuoteServiceType(serviceType: string | null | undefined): string {
  return (serviceType || 'domestic').toLowerCase().replace(/[\s_-]+/g, '');
}

export function resolveQuoteBookingRoute(serviceType: string | null | undefined): string {
  const n = normalizeQuoteServiceType(serviceType);
  if (n.includes('carpet')) return '/carpet-cleaning';
  if (n.includes('endoftenancy') || n === 'eot') return '/end-of-tenancy';
  if (n.includes('airbnb')) return '/airbnb-cleaning';
  return '/domestic-cleaning';
}
