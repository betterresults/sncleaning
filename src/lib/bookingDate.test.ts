import { describe, expect, it } from 'vitest';
import { formatDateForStorage } from '@/lib/bookingDate';

describe('formatDateForStorage', () => {
  it('uses local calendar Y/M/D (not Date#toISOString)', () => {
    const localDate = new Date(2026, 6, 14, 0, 30, 0, 0);
    expect(formatDateForStorage(localDate)).toBe('2026-07-14');

    // In timezones ahead of UTC, local midnight-morning is still the previous UTC day.
    const isoDay = localDate.toISOString().split('T')[0];
    if (isoDay !== '2026-07-14') {
      expect(formatDateForStorage(localDate)).not.toBe(isoDay);
    }
  });

  it('parses ISO date strings as calendar days', () => {
    expect(formatDateForStorage('2026-07-14')).toBe('2026-07-14');
    expect(formatDateForStorage('2026-07-14T23:00:00+00:00')).toBe('2026-07-14');
  });
});
