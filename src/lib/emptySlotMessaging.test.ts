import { describe, expect, it } from 'vitest';
import {
  EMPTY_SLOT_QUOTE_PATH,
  getEmptySlotAvailabilityMessage,
} from '@/lib/emptySlotMessaging';

describe('emptySlotMessaging', () => {
  it('explains same-day empty slots', () => {
    expect(getEmptySlotAvailabilityMessage(true)).toContain('2 hours notice');
  });

  it('explains future-date empty slots', () => {
    expect(getEmptySlotAvailabilityMessage(false)).toContain('try another date');
  });

  it('points empty-slot CTA at the quote request route', () => {
    expect(EMPTY_SLOT_QUOTE_PATH).toBe('/quote-request');
  });
});
