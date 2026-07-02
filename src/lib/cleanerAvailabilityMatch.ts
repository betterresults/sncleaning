// Shared logic for matching a booking's date/time window against a cleaner's
// configured weekly working hours (see cleaner_working_hours + CleanerAvailability.tsx).
// Mirrors the soft-match helpers in useCleanerServiceTypes.ts / useCoverageAreas.ts, but
// time is enforced as a hard block (see cleanerAvailabilityMatch usage in assignment UIs)
// since "cleaner is free at this exact time" is a real scheduling constraint, not a
// preference signal like service type or area.

export interface WorkingHourBlock {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface BookingTimeWindow {
  dayOfWeek: number; // 0=Sunday .. 6=Saturday
  startMinutes: number;
  endMinutes: number;
}

export const timeToMinutes = (value: string): number => {
  const [h, m] = value.slice(0, 5).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minutesToLabel = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = ((minutes % 60) + 60) % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = ((h + 11) % 12) + 1;
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ParsedWallClock {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
}

/**
 * Extracts the literal "Y-M-D H:M" digits from a timestamp string, ignoring any
 * trailing seconds/timezone offset (e.g. "2026-07-06T09:00:00+00:00" -> 09:00).
 *
 * Booking date_times are always written and read back as "wall-clock time tagged
 * as UTC" (see the comment above the dateTimeStr build in NewBookingForm.tsx) -
 * i.e. the digits ARE the intended time, regardless of what offset is attached.
 * Parsing this way - instead of `new Date(...)` + `.getHours()`/`.getDay()` -
 * sidesteps the browser/server's local timezone entirely, so this always matches
 * the same wall-clock hour that was picked in the booking form no matter where
 * the admin, cleaner, or customer viewing it happens to be.
 */
const parseWallClock = (value: string): ParsedWallClock | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  return { year: Number(y), month: Number(mo), day: Number(d), hour: Number(h), minute: Number(mi) };
};

// Date.UTC is used purely as a calendar calculator here (to get day-of-week from
// a Y/M/D triple) - it never touches wall-clock hours/minutes, so it can't
// reintroduce a timezone offset.
const dayOfWeekFor = (p: ParsedWallClock): number => new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
const daysBetween = (a: ParsedWallClock, b: ParsedWallClock): number =>
  Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86400000);

/**
 * Derives the day-of-week + start/end minute window for a booking from its
 * date_time (start) and either an explicit end_date_time or a total_hours duration.
 * Returns null if the booking has no date_time or no way to determine an end time.
 */
export const computeBookingTimeWindow = (
  dateTime: string | null | undefined,
  totalHours: number | null | undefined,
  endDateTime?: string | null
): BookingTimeWindow | null => {
  if (!dateTime) return null;
  const start = parseWallClock(dateTime);
  if (!start) return null;

  const startMinutes = start.hour * 60 + start.minute;
  let endMinutes: number;

  if (endDateTime) {
    const end = parseWallClock(endDateTime);
    if (end) {
      // Express the end as minutes-past-midnight-of-the-start-day so an overnight
      // job (end on a later calendar day) still compares sanely against same-day
      // working-hour blocks, instead of wrapping back around to a small number.
      endMinutes = end.hour * 60 + end.minute + daysBetween(start, end) * 24 * 60;
    } else {
      endMinutes = startMinutes;
    }
  } else if (totalHours && totalHours > 0) {
    endMinutes = startMinutes + totalHours * 60;
  } else {
    // Unknown duration - treat as a point-in-time check only.
    endMinutes = startMinutes;
  }

  return {
    dayOfWeek: dayOfWeekFor(start),
    startMinutes,
    endMinutes,
  };
};

/**
 * Whether a cleaner's configured working-hour blocks fully cover the given booking
 * time window. Cleaners with NO working hours configured at all are treated as a
 * wildcard (always available), consistent with the service-type/area soft filters.
 * Once a cleaner HAS configured hours, the requested day + time range must fit
 * entirely within one of their blocks for that day - this is enforced as a hard
 * block in assignment UIs (a job can't run past the end of a shift).
 */
export const cleanerCoversTime = (
  workingHours: WorkingHourBlock[],
  window: BookingTimeWindow | null
): boolean => {
  if (workingHours.length === 0) return true;
  if (!window) return true;

  const dayBlocks = workingHours.filter((b) => b.day_of_week === window.dayOfWeek);
  if (dayBlocks.length === 0) return false;

  return dayBlocks.some((block) => {
    const blockStart = timeToMinutes(block.start_time);
    const blockEnd = timeToMinutes(block.end_time);
    return blockStart <= window.startMinutes && blockEnd >= window.endMinutes;
  });
};

/** Short human label for a booking window, e.g. "Mon 9:00 AM - 5:00 PM". */
export const describeTimeWindow = (window: BookingTimeWindow): string =>
  `${DAY_LABELS[window.dayOfWeek]} ${minutesToLabel(window.startMinutes)} - ${minutesToLabel(window.endMinutes)}`;
