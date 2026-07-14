import { describe, expect, it } from 'vitest';
import {
  cleanerDeleteIsBlocked,
  type CleanerDeleteImpact,
} from '@/api/cleaners/fetchDeleteImpact';

const emptyImpact = (): CleanerDeleteImpact => ({
  upcomingBookings: 0,
  pastBookings: 0,
  payments: 0,
  photos: 0,
  recurringServices: 0,
  hasLoginAccount: false,
  loginEmail: null,
});

describe('cleanerDeleteIsBlocked', () => {
  it('allows delete when no blocking relations exist', () => {
    expect(cleanerDeleteIsBlocked(emptyImpact())).toBe(false);
  });

  it('allows delete even when a login account exists', () => {
    expect(
      cleanerDeleteIsBlocked({
        ...emptyImpact(),
        hasLoginAccount: true,
        loginEmail: 'cleaner@example.com',
      })
    ).toBe(false);
  });

  it('blocks when any booking/payment/photo relation exists', () => {
    expect(cleanerDeleteIsBlocked({ ...emptyImpact(), upcomingBookings: 1 })).toBe(true);
    expect(cleanerDeleteIsBlocked({ ...emptyImpact(), pastBookings: 1 })).toBe(true);
    expect(cleanerDeleteIsBlocked({ ...emptyImpact(), payments: 1 })).toBe(true);
    expect(cleanerDeleteIsBlocked({ ...emptyImpact(), photos: 3 })).toBe(true);
    expect(cleanerDeleteIsBlocked({ ...emptyImpact(), recurringServices: 1 })).toBe(true);
  });
});
