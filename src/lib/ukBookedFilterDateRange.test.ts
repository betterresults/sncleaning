import { describe, expect, it } from 'vitest';
import { getUKBookedFilterDateRange, shiftUKDateString } from '@/lib/ukTime';

describe('shiftUKDateString', () => {
  it('shifts calendar days without timezone math', () => {
    expect(shiftUKDateString('2026-07-14', -1)).toBe('2026-07-13');
    expect(shiftUKDateString('2026-07-01', -1)).toBe('2026-06-30');
    expect(shiftUKDateString('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('getUKBookedFilterDateRange', () => {
  const today = '2026-07-14';

  it('anchors all ranges to the provided UK today string', () => {
    expect(getUKBookedFilterDateRange('today', today)).toEqual({
      dateFrom: '2026-07-14',
      dateTo: '2026-07-14',
    });
    expect(getUKBookedFilterDateRange('yesterday', today)).toEqual({
      dateFrom: '2026-07-13',
      dateTo: '2026-07-14',
    });
    expect(getUKBookedFilterDateRange('last3days', today)).toEqual({
      dateFrom: '2026-07-11',
      dateTo: '2026-07-14',
    });
    expect(getUKBookedFilterDateRange('lastweek', today)).toEqual({
      dateFrom: '2026-07-07',
      dateTo: '2026-07-14',
    });
    expect(getUKBookedFilterDateRange('lastmonth', today)).toEqual({
      dateFrom: '2026-06-14',
      dateTo: '2026-07-14',
    });
  });
});
