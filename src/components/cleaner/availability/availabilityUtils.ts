import { DAYS_OF_WEEK } from '@/hooks/useCleanerWorkingHours';
import type { CleanerWorkingHour } from '@/hooks/useCleanerWorkingHours';
import type { CleanerUpcomingBooking } from '@/hooks/useCleanerUpcomingBookings';
import type { OpenHoursByDay } from './types';

export const DESKTOP_ROW_HEIGHT_PX = 38;
export const MOBILE_ROW_HEIGHT_PX = 48;

export const timeToMinutes = (value: string) => {
  const [h, m] = value.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

export const emptyOpenHours = (): OpenHoursByDay => {
  const map = new Map<number, Set<number>>();
  DAYS_OF_WEEK.forEach((day) => map.set(day.value, new Set<number>()));
  return map;
};

export const buildOpenHoursFromBlocks = (blocks: CleanerWorkingHour[]): OpenHoursByDay => {
  const map = emptyOpenHours();
  blocks.forEach((block) => {
    const startHour = Math.floor(timeToMinutes(block.start_time) / 60);
    const endHour = Math.ceil(timeToMinutes(block.end_time) / 60);
    const set = map.get(block.day_of_week);
    if (!set) return;
    for (let h = startHour; h < endHour; h += 1) set.add(h);
  });
  return map;
};

export const runsFromHourSet = (hours: Set<number>): Array<{ start: number; end: number }> => {
  const sorted = [...hours].sort((a, b) => a - b);
  const runs: Array<{ start: number; end: number }> = [];
  sorted.forEach((hour) => {
    const lastRun = runs[runs.length - 1];
    if (lastRun && lastRun.end === hour) {
      lastRun.end = hour + 1;
    } else {
      runs.push({ start: hour, end: hour + 1 });
    }
  });
  return runs;
};

export const formatHourLabel = (hour: number) => {
  const h = ((hour + 11) % 12) + 1;
  const period = hour >= 12 && hour < 24 ? 'PM' : 'AM';
  return `${h} ${period}`;
};

const formatCompactHour = (hour: number) => {
  const normalized = ((hour % 24) + 24) % 24;
  const h = ((normalized + 11) % 12) + 1;
  const period = normalized >= 12 ? 'PM' : 'AM';
  return { hour: h, period };
};

export const formatHourRangeLabel = (hour: number) => {
  const start = formatCompactHour(hour);
  const end = formatCompactHour(hour + 1);

  if (start.period === end.period) {
    return `${start.hour}-${end.hour} ${start.period}`;
  }

  return `${start.hour} ${start.period}-${end.hour} ${end.period}`;
};

export const pad = (n: number) => String(n).padStart(2, '0');

export const startOfWeekUTC = (date: Date): Date => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  return start;
};

export const addDaysUTC = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const isSameUTCDate = (a: Date, b: Date): boolean =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

export const formatDateNumber = (date: Date) => date.getUTCDate();

export const formatWeekRangeLabel = (weekStart: Date): string => {
  const weekEnd = addDaysUTC(weekStart, 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  const startLabel = weekStart.toLocaleDateString(undefined, opts);
  const endLabel = weekEnd.toLocaleDateString(undefined, {
    ...opts,
    year: weekStart.getUTCFullYear() === weekEnd.getUTCFullYear() ? undefined : 'numeric',
  });
  const year = weekEnd.getUTCFullYear();
  return `${startLabel} – ${endLabel}, ${year}`;
};

export const formatBookingDay = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

export const formatBookingTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });

export const getBookingEnd = (booking: CleanerUpcomingBooking): Date | null => {
  if (booking.end_date_time) return new Date(booking.end_date_time);
  if (booking.total_hours != null) {
    return new Date(new Date(booking.date_time).getTime() + booking.total_hours * 60 * 60 * 1000);
  }
  return null;
};

export const countActiveDays = (openHours: OpenHoursByDay, startHour: number, endHour: number): number => {
  let count = 0;
  openHours.forEach((set) => {
    const openInRange = [...set].filter((h) => h >= startHour && h < endHour).length;
    if (openInRange > 0) count += 1;
  });
  return count;
};

export const findTodayIndexInWeek = (weekDates: Date[], today: Date): number => {
  const idx = weekDates.findIndex((d) => isSameUTCDate(d, today));
  return idx >= 0 ? idx : 0;
};
