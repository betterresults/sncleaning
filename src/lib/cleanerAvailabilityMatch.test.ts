import { describe, expect, it } from 'vitest';
import {
  cleanerCoversTime,
  cleanerHasCalendarConflict,
  computeBookingTimeWindow,
  timeToMinutes,
  type CalendarBusyBlock,
  type WorkingHourBlock,
} from '@/lib/cleanerAvailabilityMatch';

const tuesdayHours: WorkingHourBlock[] = [
  { day_of_week: 2, start_time: '09:00', end_time: '17:00' },
];

describe('timeToMinutes', () => {
  it('converts HH:MM strings to minutes', () => {
    expect(timeToMinutes('09:00')).toBe(540);
    expect(timeToMinutes('17:30')).toBe(1050);
  });
});

describe('computeBookingTimeWindow', () => {
  it('parses wall-clock digits regardless of +00:00 offset (BST-style tagging)', () => {
    const window = computeBookingTimeWindow('2026-07-14T09:00:00+00:00', 2.5);
    expect(window).toMatchObject({
      dateKey: '2026-07-14',
      dayOfWeek: 2,
      startMinutes: 9 * 60,
      endMinutes: 9 * 60 + 2.5 * 60,
    });
  });

  it('uses explicit end_date_time spanning to next calendar day', () => {
    const window = computeBookingTimeWindow(
      '2026-07-14T22:00:00+00:00',
      null,
      '2026-07-15T02:00:00+00:00'
    );
    expect(window?.startMinutes).toBe(22 * 60);
    expect(window?.endMinutes).toBe(26 * 60);
  });

  it('returns null when date_time is missing', () => {
    expect(computeBookingTimeWindow(null, 2)).toBeNull();
  });
});

describe('cleanerCoversTime', () => {
  const window = computeBookingTimeWindow('2026-07-14T09:00:00+00:00', 2.5)!;

  it('treats empty working hours as wildcard', () => {
    expect(cleanerCoversTime([], window)).toBe(true);
  });

  it('matches when job fits inside configured block', () => {
    expect(cleanerCoversTime(tuesdayHours, window)).toBe(true);
  });

  it('rejects when job ends after shift end', () => {
    const lateWindow = computeBookingTimeWindow('2026-07-14T15:00:00+00:00', 3)!;
    expect(cleanerCoversTime(tuesdayHours, lateWindow)).toBe(false);
  });

  it('rejects when cleaner has no block for that day', () => {
    const mondayHours: WorkingHourBlock[] = [
      { day_of_week: 1, start_time: '09:00', end_time: '17:00' },
    ];
    expect(cleanerCoversTime(mondayHours, window)).toBe(false);
  });
});

describe('cleanerHasCalendarConflict', () => {
  const window = computeBookingTimeWindow('2026-07-14T09:00:00+00:00', 2.5)!;

  it('detects overlapping busy blocks on same date', () => {
    const busy: CalendarBusyBlock[] = [
      { dateKey: '2026-07-14', startMinutes: 10 * 60, endMinutes: 11 * 60 },
    ];
    expect(cleanerHasCalendarConflict(busy, window)).toBe(true);
  });

  it('ignores blocks on other dates', () => {
    const busy: CalendarBusyBlock[] = [
      { dateKey: '2026-07-15', startMinutes: 9 * 60, endMinutes: 17 * 60 },
    ];
    expect(cleanerHasCalendarConflict(busy, window)).toBe(false);
  });

  it('treats all-day blocks as conflicts', () => {
    const busy: CalendarBusyBlock[] = [
      { dateKey: '2026-07-14', startMinutes: 0, endMinutes: 0, isAllDay: true },
    ];
    expect(cleanerHasCalendarConflict(busy, window)).toBe(true);
  });
});
