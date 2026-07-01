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
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = ((h + 11) % 12) + 1;
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const start = new Date(dateTime);
  if (Number.isNaN(start.getTime())) return null;

  let end: Date;
  if (endDateTime) {
    end = new Date(endDateTime);
    if (Number.isNaN(end.getTime())) end = start;
  } else if (totalHours && totalHours > 0) {
    end = new Date(start.getTime() + totalHours * 60 * 60 * 1000);
  } else {
    // Unknown duration - treat as a point-in-time check only.
    end = start;
  }

  return {
    dayOfWeek: start.getDay(),
    startMinutes: start.getHours() * 60 + start.getMinutes(),
    endMinutes: end.getHours() * 60 + end.getMinutes(),
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
