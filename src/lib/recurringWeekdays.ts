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

export function advanceDateToDow(date: Date, stepDays: number, dow: number): Date {
  return recurringAlignDateToDow(addUtcDays(date, stepDays), dow);
}

export function firstDateForWeekday(args: {
  today: Date;
  startDate: Date;
  dow: number;
  lastBookingOnDow: Date | null;
  stepDays: number;
}): Date {
  if (args.lastBookingOnDow) {
    let next = advanceDateToDow(args.lastBookingOnDow, args.stepDays, args.dow);
    while (next < args.today) {
      next = advanceDateToDow(next, args.stepDays, args.dow);
    }
    return next;
  }

  let next = recurringAlignDateToDow(args.startDate, args.dow);
  while (next < args.today) {
    next = advanceDateToDow(next, args.stepDays, args.dow);
  }
  return next;
}

export function expectedDatesThroughHorizon(args: {
  firstDate: Date;
  stepDays: number;
  horizon: Date;
  dow?: number;
}): Date[] {
  const dates: Date[] = [];
  let cursor = args.firstDate;
  while (cursor <= args.horizon) {
    dates.push(cursor);
    cursor =
      args.dow == null
        ? addUtcDays(cursor, args.stepDays)
        : advanceDateToDow(cursor, args.stepDays, args.dow);
  }
  return dates;
}

export function shouldSkipRecurringDate(args: {
  hasLiveBooking: boolean;
  hasCancelledPastOnDate: boolean;
}): boolean {
  return args.hasLiveBooking || args.hasCancelledPastOnDate;
}
