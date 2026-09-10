/** Mirrors public.recurring_day_name_to_dow / recurring_align_date_to_dow. */

const DAY_TO_DOW: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function recurringDayNameToDow(day: string | null | undefined): number | null {
  if (day == null) return null;
  const key = day.trim().toLowerCase();
  if (!(key in DAY_TO_DOW)) return null;
  return DAY_TO_DOW[key];
}

export function parseRecurringDaysOfTheWeek(value: string | null | undefined): number[] {
  if (!value) return [];
  const dows = value
    .split(',')
    .map((token) => recurringDayNameToDow(token))
    .filter((dow): dow is number => dow != null);
  return [...new Set(dows)].sort((a, b) => a - b);
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function recurringAlignDateToDow(date: Date, dow: number): Date {
  const current = date.getUTCDay();
  if (current === dow) return addUtcDays(date, 0);
  return addUtcDays(date, (dow - current + 7) % 7);
}

export function frequencyStepDays(frequently: string | null | undefined): number {
  switch ((frequently ?? '').replace(/-/g, '').toLowerCase()) {
    case 'biweekly':
      return 14;
    case 'monthly':
      return 30;
    default:
      return 7;
  }
}

export function firstDateForWeekday(args: {
  today: Date;
  startDate: Date;
  dow: number;
  lastBookingOnDow: Date | null;
  stepDays: number;
}): Date {
  if (args.lastBookingOnDow) {
    let next = addUtcDays(args.lastBookingOnDow, args.stepDays);
    while (next < args.today) {
      next = addUtcDays(next, args.stepDays);
    }
    return recurringAlignDateToDow(next, args.dow);
  }
  const base = args.startDate > args.today ? args.startDate : args.today;
  return recurringAlignDateToDow(base, args.dow);
}

export function expectedDatesThroughHorizon(args: {
  firstDate: Date;
  stepDays: number;
  horizon: Date;
}): Date[] {
  const dates: Date[] = [];
  let cursor = args.firstDate;
  while (cursor <= args.horizon) {
    dates.push(cursor);
    cursor = addUtcDays(cursor, args.stepDays);
  }
  return dates;
}
