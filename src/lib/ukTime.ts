import { format as fnsFormat } from 'date-fns';

/**
 * Booking date/time formatting pinned to UK time (Europe/London).
 *
 * `bookings.date_time` / `end_date_time` (and equivalents on `past_bookings`,
 * `recurring_services`) are written by the booking form as naive London wall-clock
 * strings with a hardcoded `+00:00` suffix (see NewBookingForm). So a booking at
 * 08:00 London is stored as `2026-07-10T08:00:00+00:00`.
 *
 * Parsing that with `new Date()` yields a UTC instant whose UTC getters equal the
 * London wall-clock digits. To display UK time consistently for viewers in any
 * timezone we format with `timeZone: 'UTC'` (Intl) or use the UTC getters. Do NOT
 * switch to `Europe/London` — during BST that would add an extra hour on top of
 * the already-shifted stored value.
 */

type DateInput = string | number | Date | null | undefined;

const toDate = (value: DateInput): Date | null => {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Returns a Date whose *local* fields equal the UTC fields of the input, so it can be
// passed to date-fns `format()` without any timezone drift.
const asWallClockLocal = (value: DateInput): Date | null => {
  const d = toDate(value);
  if (!d) return null;
  return new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds(),
  );
};

/** Format a booking date/time with a date-fns pattern, in UK wall-clock time. */
export const formatUK = (value: DateInput, pattern: string): string => {
  const local = asWallClockLocal(value);
  if (!local) return '';
  return fnsFormat(local, pattern);
};

/** Default: `dd MMM yyyy` (e.g. `10 Jul 2026`). */
export const formatUKDate = (value: DateInput, pattern = 'dd MMM yyyy'): string =>
  formatUK(value, pattern);

/** Default: `HH:mm` (24h, e.g. `08:00`). */
export const formatUKTime = (value: DateInput, pattern = 'HH:mm'): string =>
  formatUK(value, pattern);

/** Default: `dd MMM yyyy HH:mm`. */
export const formatUKDateTime = (value: DateInput, pattern = 'dd MMM yyyy HH:mm'): string =>
  formatUK(value, pattern);

/** Long form: `Friday, 10 July 2026`. */
export const formatUKLong = (value: DateInput): string =>
  formatUK(value, 'EEEE, d MMMM yyyy');

/** For toLocale*-style callers: same shape but locked to UK wall clock. */
export const formatUKLocaleDate = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
  locale: string | string[] = 'en-GB',
): string => {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(d);
};

export const formatUKLocaleTime = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false },
  locale: string | string[] = 'en-GB',
): string => {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(d);
};

/** UK weekday index (0=Sunday..6=Saturday). */
export const getUKWeekday = (value: DateInput): number | null => {
  const d = toDate(value);
  return d ? d.getUTCDay() : null;
};

export const ukDateParts = (value: DateInput) => ({
  date: formatUKDate(value),
  time: formatUKTime(value),
  long: formatUKLong(value),
  weekday: formatUK(value, 'EEEE'),
});
