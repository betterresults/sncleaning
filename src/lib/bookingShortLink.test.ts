import { describe, expect, it } from 'vitest';
import {
  getCustomerBookingShortUrl,
  normalizeQuoteServiceType,
  resolveQuoteBookingRoute,
} from '@/lib/bookingShortLink';

describe('bookingShortLink', () => {
  it('builds production customer URLs', () => {
    expect(getCustomerBookingShortUrl('abc123')).toBe(
      'https://account.sncleaningservices.co.uk/b/abc123',
    );
  });

  it('normalizes spaced Airbnb labels', () => {
    expect(normalizeQuoteServiceType('Air BnB')).toBe('airbnb');
    expect(normalizeQuoteServiceType('End of Tenancy')).toBe('endoftenancy');
  });

  it('routes service types safely', () => {
    expect(resolveQuoteBookingRoute('Air BnB')).toBe('/airbnb-cleaning');
    expect(resolveQuoteBookingRoute('airbnb')).toBe('/airbnb-cleaning');
    expect(resolveQuoteBookingRoute('Carpet Cleaning')).toBe('/carpet-cleaning');
    expect(resolveQuoteBookingRoute('End of Tenancy')).toBe('/end-of-tenancy');
    expect(resolveQuoteBookingRoute('eot')).toBe('/end-of-tenancy');
    expect(resolveQuoteBookingRoute('Domestic')).toBe('/domestic-cleaning');
    expect(resolveQuoteBookingRoute(null)).toBe('/domestic-cleaning');
  });
});
