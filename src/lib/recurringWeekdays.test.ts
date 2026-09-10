import { describe, expect, it } from 'vitest';
import {
  addUtcDays,
  expectedDatesThroughHorizon,
  firstDateForWeekday,
  formatUtcDate,
  frequencyStepDays,
  parseRecurringDaysOfTheWeek,
  recurringAlignDateToDow,
  recurringDayNameToDow,
  shouldSkipRecurringDate,
  utcDate,
} from '@/lib/recurringWeekdays';

describe('recurringDayNameToDow', () => {
  it('maps weekday names case-insensitively and trims spaces', () => {
    expect(recurringDayNameToDow('sunday')).toBe(0);
    expect(recurringDayNameToDow(' Monday ')).toBe(1);
    expect(recurringDayNameToDow('TUESDAY')).toBe(2);
    expect(recurringDayNameToDow('wednesday')).toBe(3);
    expect(recurringDayNameToDow('thursday')).toBe(4);
    expect(recurringDayNameToDow('friday')).toBe(5);
    expect(recurringDayNameToDow('saturday')).toBe(6);
  });

  it('returns null for invalid or empty tokens', () => {
    expect(recurringDayNameToDow('funday')).toBeNull();
    expect(recurringDayNameToDow('')).toBeNull();
    expect(recurringDayNameToDow('   ')).toBeNull();
    expect(recurringDayNameToDow(null)).toBeNull();
  });
});

describe('parseRecurringDaysOfTheWeek', () => {
  it('parses Prue-style comma lists and keeps both days', () => {
    expect(parseRecurringDaysOfTheWeek('thursday, monday')).toEqual([1, 4]);
  });

  it('tolerates missing spaces, duplicates, and junk tokens', () => {
    expect(parseRecurringDaysOfTheWeek('thursday,monday')).toEqual([1, 4]);
    expect(parseRecurringDaysOfTheWeek('monday, monday, thursday')).toEqual([1, 4]);
    expect(parseRecurringDaysOfTheWeek('thursday, banana, monday, ')).toEqual([1, 4]);
  });

  it('returns empty when every token is invalid', () => {
    expect(parseRecurringDaysOfTheWeek('never, ever')).toEqual([]);
  });
});

describe('recurringAlignDateToDow', () => {
  const thursday = utcDate(2026, 8, 10);

  it('keeps the date when it is already the target weekday', () => {
    expect(formatUtcDate(recurringAlignDateToDow(thursday, 4))).toBe('2026-09-10');
    expect(formatUtcDate(recurringAlignDateToDow(utcDate(2026, 8, 14), 1))).toBe('2026-09-14');
  });

  it('snaps forward, never backward, to the next target weekday', () => {
    expect(formatUtcDate(recurringAlignDateToDow(thursday, 1))).toBe('2026-09-14');
    expect(formatUtcDate(recurringAlignDateToDow(utcDate(2026, 8, 14), 4))).toBe('2026-09-17');
    expect(formatUtcDate(recurringAlignDateToDow(utcDate(2026, 8, 13), 6))).toBe('2026-09-19');
  });
});

describe('firstDateForWeekday / expectedDatesThroughHorizon', () => {
  const today = utcDate(2026, 8, 10);
  const horizon = addUtcDays(today, 30);
  const start = utcDate(2025, 10, 6);

  it('fills every Monday in the 30-day horizon when only Thursdays exist', () => {
    const firstMonday = firstDateForWeekday({
      today,
      startDate: start,
      dow: 1,
      lastBookingOnDow: null,
      stepDays: 7,
    });
    const mondays = expectedDatesThroughHorizon({ firstDate: firstMonday, stepDays: 7, horizon });
    expect(mondays.map(formatUtcDate)).toEqual([
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
    ]);
  });

  it('does not invent a Thursday past the horizon when the cursor is already filled', () => {
    const firstThursday = firstDateForWeekday({
      today,
      startDate: start,
      dow: 4,
      lastBookingOnDow: utcDate(2026, 9, 8),
      stepDays: 7,
    });
    expect(formatUtcDate(firstThursday)).toBe('2026-10-15');
    expect(
      expectedDatesThroughHorizon({ firstDate: firstThursday, stepDays: 7, horizon }).map(formatUtcDate),
    ).toEqual([]);
  });

  it('keeps biweekly cadence from the last booking of that weekday', () => {
    const nextFriday = firstDateForWeekday({
      today,
      startDate: start,
      dow: 5,
      lastBookingOnDow: utcDate(2026, 8, 4),
      stepDays: 14,
    });
    expect(formatUtcDate(nextFriday)).toBe('2026-09-18');
  });

  it('walks from start_date when a biweekly series has no upcoming row', () => {
    expect(formatUtcDate(firstDateForWeekday({
      today,
      startDate: utcDate(2026, 5, 25),
      dow: 4,
      lastBookingOnDow: null,
      stepDays: 14,
    }))).toBe('2026-09-17');
  });

  it('keeps monthly steps on the same weekday', () => {
    const first = firstDateForWeekday({
      today: utcDate(2026, 8, 10),
      startDate: utcDate(2026, 0, 30),
      dow: 5,
      lastBookingOnDow: utcDate(2026, 8, 25),
      stepDays: 30,
    });
    expect(formatUtcDate(first)).toBe('2026-10-30');
    expect(
      expectedDatesThroughHorizon({
        firstDate: first,
        stepDays: 30,
        horizon: utcDate(2027, 1, 28),
        dow: 5,
      }).map(formatUtcDate),
    ).toEqual(['2026-10-30', '2026-12-04', '2027-01-08', '2027-02-12']);
  });

  it('uses a future start_date instead of today', () => {
    const futureStart = utcDate(2026, 9, 1);
    const first = firstDateForWeekday({
      today,
      startDate: futureStart,
      dow: 4,
      lastBookingOnDow: null,
      stepDays: 7,
    });
    expect(formatUtcDate(first)).toBe('2026-10-01');
  });

  it('excludes the first Monday after the 30-day horizon', () => {
    const firstMonday = utcDate(2026, 8, 14);
    const dates = expectedDatesThroughHorizon({
      firstDate: firstMonday,
      stepDays: 7,
      horizon,
    }).map(formatUtcDate);
    expect(dates).not.toContain('2026-10-12');
    expect(horizon.toISOString().slice(0, 10)).toBe('2026-10-10');
  });
});

describe('shouldSkipRecurringDate', () => {
  it('honours a cancelled past visit so cron cannot recreate it', () => {
    expect(shouldSkipRecurringDate({ hasLiveBooking: false, hasCancelledPastOnDate: true })).toBe(true);
    expect(shouldSkipRecurringDate({ hasLiveBooking: true, hasCancelledPastOnDate: false })).toBe(true);
    expect(shouldSkipRecurringDate({ hasLiveBooking: false, hasCancelledPastOnDate: false })).toBe(false);
  });
});

describe('frequencyStepDays', () => {
  it('normalizes weekly / bi-weekly / monthly labels', () => {
    expect(frequencyStepDays('weekly')).toBe(7);
    expect(frequencyStepDays('Bi-Weekly')).toBe(14);
    expect(frequencyStepDays('monthly')).toBe(30);
    expect(frequencyStepDays('unknown')).toBe(7);
  });
});
