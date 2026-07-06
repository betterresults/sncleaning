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
 *
 * CONVENTION — do not bypass this file for booking dates/times:
 * - Displaying a stored `date_time`/`end_date_time`/`start_date`/`date_only` value?
 *   Use `formatUK*` / `formatUKLocale*` / `getUKWeekday` below. Never call
 *   `new Date(value).toLocaleDateString()/.toLocaleString()` or a raw `date-fns
 *   format()` directly on one of these columns — the result silently follows the
 *   viewer's device timezone instead of always showing UK time.
 * - Computing "today"/"now" to filter or compare against a stored booking column
 *   (`.gte('date_time', ...)`, "is this booking today", "hours until cleaning")?
 *   Use `getUKNowAsStoredString()` / `getUKNowAsStoredDate()` / `getUKTodayRange()`
 *   / `getUKTodayDateString()` below instead of `new Date()`/`Date.now()`. Raw
 *   `new Date()` reflects the viewer's/server's own clock and drifts from UK time
 *   both by device timezone (e.g. a dev in Manila) and by ~1 real hour during BST.
 * - Comparing against a calendar-picker `Date` that hasn't been saved yet (e.g.
 *   `selectedDate` built the same way `NewBookingForm` builds its payload, via
 *   local-style Y/M/D getters)? Use `getUKNowAsLocalDate()`, not `getUKNowAsStoredDate()`.
 * - Doing real elapsed-time arithmetic relative to a stored booking value (e.g.
 *   rescheduling a reminder N minutes after `date_time`)? Convert with
 *   `toTrueUKInstant()` first — don't do `new Date(booking.date_time).getTime() + …`
 *   directly, which inherits the same BST skew.
 * - Displaying a GENUINE real-UTC timestamp (`created_at`, `updated_at`, activity
 *   logs, chat/SMS timestamps, photo uploads, GPS tracking, export "generated on"
 *   stamps)? Use `formatLondon*` further below instead — those pin to the real
 *   `Europe/London` zone (DST-aware), NOT `timeZone: 'UTC'` (that's specific to the
 *   booking family's mislabeling quirk and would be wrong for a real timestamp).
 * - Hydrating a calendar/time picker FROM a stored value (edit forms)? Use
 *   `getUKStoredAsLocalDate()` for the booking family, `getLondonWallClockDate()` for
 *   genuine real-UTC columns — never `new Date(value)` followed by local getters
 *   (`.getHours()`, `.getDate()`, etc.), which reflect the viewer's device timezone.
 * - Saving a calendar-picker `Date` (+ optional time string) back to the database?
 *   Use `buildUKStoredString()` for the naive-mislabeled booking family, or
 *   `ukPickerDateToInstant()` for genuine `timestamptz` columns (task `due_date`,
 *   `resume_date`, etc.) — never `date.toISOString()`, which converts through the
 *   device's real UTC offset and silently shifts the day/hour for non-UK viewers.
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

/**
 * "Now"/"today" helpers for comparing against `bookings.date_time` etc.
 *
 * Unlike stored booking values (naive London digits mislabeled `+00:00`), the real
 * current instant genuinely does shift between GMT and BST. So `new Date()` cannot be
 * compared directly against `date_time` — during BST it's off by a real hour, and on
 * any viewer whose device timezone isn't UK, a naive "start of local day" is off by
 * many hours (e.g. midnight in Manila is 16:00 UTC the previous day).
 *
 * These helpers convert the real "now" to true UK wall-clock time (DST-aware, via
 * `Europe/London`) and re-stamp it with the same `+00:00` convention the stored data
 * uses, so the result is directly comparable to `date_time` / `end_date_time` values —
 * regardless of the viewer's or server's own timezone or the time of year.
 */
const ukNowParts = (): Record<string, string> => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const out: Record<string, string> = {};
  for (const p of parts) out[p.type] = p.value;
  // Some locales render midnight as "24" with hour12: false; normalise to "00".
  if (out.hour === '24') out.hour = '00';
  return out;
};

/** Real "now", as a `bookings.date_time`-style string (UK wall-clock + fake `+00:00`). */
export const getUKNowAsStoredString = (): string => {
  const p = ukNowParts();
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}+00:00`;
};

/**
 * Real "now" as a `Date` object safe to compare with `new Date(booking.date_time)`
 * (both have UTC-getter digits equal to UK wall-clock time).
 */
export const getUKNowAsStoredDate = (): Date => new Date(getUKNowAsStoredString());

/** UK "today" as `YYYY-MM-DD`, for date-range queries/filtering against booking dates. */
export const getUKTodayDateString = (): string => {
  const p = ukNowParts();
  return `${p.year}-${p.month}-${p.day}`;
};

/** Start/end-of-day boundaries for UK "today", directly comparable to `date_time`. */
export const getUKTodayRange = (): { start: string; end: string } => {
  const day = getUKTodayDateString();
  return { start: `${day}T00:00:00+00:00`, end: `${day}T23:59:59.999+00:00` };
};

/** UK weekday index (0=Sunday..6=Saturday) for "now", DST-aware. */
export const getUKNowWeekday = (): number => getUKNowAsStoredDate().getUTCDay();

/**
 * Real "now" as a `Date` whose *local* getters (`getFullYear`/`getMonth`/`getDate`/
 * `getHours`/`getMinutes`/`getSeconds`) equal the current UK wall-clock digits.
 *
 * Use this (instead of `new Date()`) when comparing against a calendar-picker `Date`
 * built the same way `NewBookingForm` builds its stored value — i.e. via local-style
 * Y/M/D/H/M getters representing the INTENDED UK date/time (not the viewer's own
 * timezone). Without this, a viewer whose device timezone isn't the UK's would get
 * the wrong "is this today" / "hours until cleaning" result relative to UK time.
 *
 * Contrast with `getUKNowAsStoredDate()`, whose *UTC* getters equal UK digits, for
 * comparison against parsed `booking.date_time` values instead.
 */
export const getUKNowAsLocalDate = (): Date => {
  const stored = getUKNowAsStoredDate();
  return new Date(
    stored.getUTCFullYear(),
    stored.getUTCMonth(),
    stored.getUTCDate(),
    stored.getUTCHours(),
    stored.getUTCMinutes(),
    stored.getUTCSeconds(),
  );
};

/**
 * Convert a stored booking value (`date_time`/`end_date_time` etc., or its local-getter
 * `Date` equivalent produced by `getUKStoredAsLocalDate()`) back into a "hydrated" `Date`
 * whose *local* getters equal the UK digits — i.e. safe to hand to a calendar `selected`
 * prop, or to read `.getHours()`/`.getMinutes()` on directly, without device-timezone
 * drift. This is the read-side counterpart to how `NewBookingForm` builds its payload.
 *
 * Do NOT do `new Date(booking.date_time)` and then call local getters (`.getHours()`,
 * `.getDate()`, etc.) directly on the result to populate an edit form — those are
 * device-timezone-local getters on a value whose UTC digits (not local digits) are the
 * meaningful ones, so a non-UK viewer gets the wrong hour/day.
 */
export const getUKStoredAsLocalDate = (value: DateInput): Date | null => asWallClockLocal(value);

/**
 * Build a `bookings.date_time`-style string (UK wall-clock digits + fake `+00:00`) from
 * a calendar-picker `Date` (whose *local* Y/M/D represent the day the user clicked — no
 * real timezone meaning, per `NewBookingForm`'s convention) plus a `HH:mm` (or `HH:mm:ss`)
 * time-of-day string. Use this instead of `date.toISOString()` when saving a booking-style
 * date/time from a picker — `.toISOString()` converts through the DEVICE's real UTC offset
 * and silently shifts the day/hour for any non-UK viewer.
 */
export const buildUKStoredString = (date: Date, time = '00:00:00'): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeParts = time.split(':');
  const hh = pad(Number(timeParts[0] ?? 0));
  const mm = pad(Number(timeParts[1] ?? 0));
  const ss = pad(Number(timeParts[2] ?? 0));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${hh}:${mm}:${ss}+00:00`;
};

/**
 * Convert a calendar-picker `Date` (local Y/M/D = the intended UK calendar day, no real
 * timezone meaning — same convention as `buildUKStoredString`) into the true, DST-aware
 * UTC instant for that UK day/time. Use this for GENUINE `timestamptz` columns that store
 * a real instant derived from a picked day (e.g. task `due_date`, recurring `resume_date`)
 * — as opposed to `buildUKStoredString()`, which is for the naive-mislabeled booking
 * `date_time` family. Do NOT use `date.toISOString()` for these either — same drift bug.
 */
export const ukPickerDateToInstant = (date: Date, time = '00:00:00'): Date | null =>
  toTrueUKInstant(buildUKStoredString(date, time));

/**
 * Convert a stored booking value (naive London digits + fake `+00:00`) into the true,
 * DST-aware UTC instant it represents. Use this before doing real elapsed-time math
 * relative to a booking (e.g. "reschedule this notification to N minutes after the
 * booking time"). Do NOT use this for display — display should stay pinned to
 * `timeZone: 'UTC'` (see module doc above); this is only for real instant arithmetic.
 */
export const toTrueUKInstant = (value: DateInput): Date | null => {
  const local = asWallClockLocal(value);
  if (!local) return null;
  // Treat the wall-clock digits as a UTC guess, then measure how far off true London
  // time is from that guess, and correct — this is DST-aware for the booking's own date
  // (not just "now"), since it's derived from the guessed instant itself.
  const guess = Date.UTC(
    local.getFullYear(), local.getMonth(), local.getDate(),
    local.getHours(), local.getMinutes(), local.getSeconds(), local.getMilliseconds(),
  );
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date(guess));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const hour = get('hour') === '24' ? 0 : Number(get('hour'));
  const londonAsIfUTC = Date.UTC(
    Number(get('year')), Number(get('month')) - 1, Number(get('day')),
    hour, Number(get('minute')), Number(get('second')),
  );
  const offsetMs = londonAsIfUTC - guess;
  return new Date(guess - offsetMs);
};

/**
 * Formatting for GENUINE real-UTC timestamps (`created_at`, `updated_at`, activity
 * logs, chat/SMS `created_at`, photo upload times, GPS tracking, export "generated on"
 * stamps, etc.) — as opposed to the naive-London-mislabeled `bookings.date_time` family
 * above. These columns are real, correct UTC instants, so to always display them as UK
 * time (regardless of the viewer's device timezone) we convert properly via the real
 * `Europe/London` IANA zone (DST-aware) — do NOT reuse `formatUK*`/`timeZone: 'UTC'`
 * here, that's specifically a workaround for the booking data's mislabeling quirk and
 * would NOT apply the GMT/BST offset a real timestamp actually needs.
 */
const asWallClockLondon = (value: DateInput): Date | null => {
  const d = toDate(value);
  if (!d) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const hour = get('hour') === '24' ? 0 : Number(get('hour'));
  return new Date(
    Number(get('year')), Number(get('month')) - 1, Number(get('day')),
    hour, Number(get('minute')), Number(get('second')), d.getMilliseconds(),
  );
};

/**
 * Returns a `Date` whose *local* getters (`getFullYear`/`getMonth`/`getDate`/
 * `getHours`/etc.) equal the real UK wall-clock digits (DST-aware) for a genuine
 * UTC timestamp. Useful when a plain date-fns helper (`format()`, `isSameDay()`,
 * etc.) needs to operate on UK wall-clock time directly, instead of going through
 * `formatLondon()`'s pattern-based formatting. Pair with `getUKNowAsLocalDate()`
 * (not `isToday`/`isYesterday`, which compare against the viewer's own device
 * clock) when you need a UK-anchored "is this today/yesterday" check.
 */
export const getLondonWallClockDate = (value: DateInput): Date | null => asWallClockLondon(value);

/** Format a real UTC timestamp with a date-fns pattern, in UK wall-clock time (DST-aware). */
export const formatLondon = (value: DateInput, pattern: string): string => {
  const local = asWallClockLondon(value);
  if (!local) return '';
  return fnsFormat(local, pattern);
};

/** Default: `dd MMM yyyy` (e.g. `10 Jul 2026`). */
export const formatLondonDate = (value: DateInput, pattern = 'dd MMM yyyy'): string =>
  formatLondon(value, pattern);

/** Default: `HH:mm` (24h, e.g. `08:00`). */
export const formatLondonTime = (value: DateInput, pattern = 'HH:mm'): string =>
  formatLondon(value, pattern);

/** Default: `dd MMM yyyy HH:mm`. */
export const formatLondonDateTime = (value: DateInput, pattern = 'dd MMM yyyy HH:mm'): string =>
  formatLondon(value, pattern);

/** Long form: `Friday, 10 July 2026`. */
export const formatLondonLong = (value: DateInput): string =>
  formatLondon(value, 'EEEE, d MMMM yyyy');

/** For toLocale*-style callers: same shape but locked to real UK wall clock (DST-aware). */
export const formatLondonLocale = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
  locale: string | string[] = 'en-GB',
): string => {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'Europe/London' }).format(d);
};

/**
 * `formatDistanceToNow`-style "2 minutes ago" relative labels are elapsed DURATIONS,
 * not wall-clock displays — they're already correct for every viewer regardless of
 * timezone (the gap between two real instants doesn't depend on either party's zone).
 * No UK-specific helper is needed for those; leave `date-fns`'s `formatDistanceToNow`
 * as-is.
 */
