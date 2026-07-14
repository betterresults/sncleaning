import { describe, expect, it } from 'vitest';
import {
  getPaymentFailedCleanupCopy,
  parsePaymentFailedBookingId,
} from '@/lib/paymentFailedCleanup';

describe('paymentFailedCleanup', () => {
  it('parses valid booking ids', () => {
    expect(parsePaymentFailedBookingId('42')).toBe(42);
    expect(parsePaymentFailedBookingId('0')).toBe(0);
  });

  it('rejects missing or invalid booking ids', () => {
    expect(parsePaymentFailedBookingId(null)).toBeNull();
    expect(parsePaymentFailedBookingId('')).toBeNull();
    expect(parsePaymentFailedBookingId('abc')).toBeNull();
  });

  it('returns null copy while cleanup is in progress', () => {
    expect(
      getPaymentFailedCleanupCopy({
        hasBookingId: true,
        cleanupDone: false,
        cleanupFailed: false,
      }),
    ).toBeNull();
  });

  it('returns success cleanup copy after cancel', () => {
    expect(
      getPaymentFailedCleanupCopy({
        hasBookingId: true,
        cleanupDone: true,
        cleanupFailed: false,
      }),
    ).toContain('cancelled');
  });

  it('returns support path when cleanup fails', () => {
    expect(
      getPaymentFailedCleanupCopy({
        hasBookingId: true,
        cleanupDone: true,
        cleanupFailed: true,
      }),
    ).toContain('contact support');
  });
});
