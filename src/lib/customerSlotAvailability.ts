import { format } from 'date-fns';
import { getUKNowAsLocalDate } from '@/lib/ukTime';
import {
  cleanerCoversTime,
  cleanerHasCalendarConflict,
  computeBookingTimeWindow,
  type BookingTimeWindow,
  type CalendarBusyBlock,
  type WorkingHourBlock,
} from '@/lib/cleanerAvailabilityMatch';
import { cleanerCoversArea } from '@/hooks/useCoverageAreas';
import { cleanerOffersService } from '@/hooks/useCleanerServiceTypes';

/** Default job length when a form has not yet computed hours (e.g. carpet). */
export const DEFAULT_SLOT_DURATION_HOURS = 2;

export interface AssignableCleanerCatalogEntry {
  id: number;
  serviceTypeKeys: string[];
  coverageAreaIds: string[];
  workingHours: WorkingHourBlock[];
  calendarBusyBlocks: CalendarBusyBlock[];
  offersService: boolean;
  coversArea: boolean;
}

export const parseSlotLabelToHour = (label: string): number | null => {
  const timeMatch = label.match(/(\d+):00\s*(AM|PM)/i);
  if (!timeMatch) return null;
  let hour = parseInt(timeMatch[1], 10);
  const isPM = timeMatch[2].toUpperCase() === 'PM';
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  return hour;
};

export const formatHourToSlotLabel = (hour: number): string => {
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
};

export const buildBookingDateTimeStr = (date: Date, slotLabel: string): string | null => {
  const hour = parseSlotLabelToHour(slotLabel);
  if (hour === null) return null;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:00`;
};

/**
 * Customer-facing hard-block predicate — stricter than admin assignment UIs.
 * Mirrors CleanerSelector.isAssignable for service/area/calendar, but unlike
 * assignment UIs we do NOT treat empty working_hours as a wildcard: a cleaner
 * must have configured availability before they can open a customer slot.
 */
export const isCleanerAssignableForWindow = (
  cleaner: AssignableCleanerCatalogEntry,
  window: BookingTimeWindow | null
): boolean => {
  if (!window) return true;
  if (cleaner.workingHours.length === 0) return false;
  return (
    cleaner.offersService &&
    cleaner.coversArea &&
    cleanerCoversTime(cleaner.workingHours, window) &&
    !cleanerHasCalendarConflict(cleaner.calendarBusyBlocks, window)
  );
};

export const hasAssignableCleanerForWindow = (
  cleaners: AssignableCleanerCatalogEntry[],
  window: BookingTimeWindow | null
): boolean => cleaners.some((cleaner) => isCleanerAssignableForWindow(cleaner, window));

export const buildSlotAvailabilityWindow = (
  selectedDate: Date,
  slotLabel: string,
  durationHours: number | null | undefined
): BookingTimeWindow | null => {
  const dateTimeStr = buildBookingDateTimeStr(selectedDate, slotLabel);
  if (!dateTimeStr) return null;
  const duration =
    durationHours && durationHours > 0 ? durationHours : DEFAULT_SLOT_DURATION_HOURS;
  return computeBookingTimeWindow(dateTimeStr, duration);
};

interface GenerateCandidateSlotsOptions {
  startHour: number;
  endHour: number;
  durationHours: number | null | undefined;
  selectedDate: Date | null;
}

/** Hour-based candidate arrival slots before cleaner-availability filtering. */
export const generateCandidateSlotLabels = ({
  startHour,
  endHour,
  durationHours,
  selectedDate,
}: GenerateCandidateSlotsOptions): string[] => {
  if (!selectedDate) return [];

  const duration =
    durationHours && durationHours > 0 ? durationHours : DEFAULT_SLOT_DURATION_HOURS;
  const lastStartHour = Math.floor(endHour - duration);

  const now = getUKNowAsLocalDate();
  const isToday =
    selectedDate.getDate() === now.getDate() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getFullYear() === now.getFullYear();

  let minHour = startHour;
  if (isToday) {
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    minHour = Math.max(startHour, twoHoursFromNow.getHours() + (twoHoursFromNow.getMinutes() > 0 ? 1 : 0));
  }

  const hours: number[] = [];
  for (let hour = minHour; hour <= lastStartHour; hour += 1) {
    hours.push(hour);
  }

  return hours.map(formatHourToSlotLabel);
};

export const filterSlotsByCleanerAvailability = (
  cleaners: AssignableCleanerCatalogEntry[],
  selectedDate: Date,
  slotLabels: string[],
  durationHours: number | null | undefined
): string[] =>
  slotLabels.filter((slotLabel) => {
    const window = buildSlotAvailabilityWindow(selectedDate, slotLabel, durationHours);
    return hasAssignableCleanerForWindow(cleaners, window);
  });

export const enrichAssignableCleanerCatalogEntry = (
  raw: {
    id: number;
    service_type_keys?: string[] | null;
    coverage_area_ids?: string[] | null;
    working_hours?: unknown;
    calendar_busy_blocks?: Array<{ starts_at: string; ends_at: string; is_all_day?: boolean }> | null;
  },
  serviceTypeKey: string | null,
  boroughId: string | null,
  toCalendarBusyBlock: (block: { starts_at: string; ends_at: string; is_all_day?: boolean }) => CalendarBusyBlock | null
): AssignableCleanerCatalogEntry => {
  const serviceTypeKeys = raw.service_type_keys || [];
  const coverageAreaIds = raw.coverage_area_ids || [];
  const workingHours = (raw.working_hours || []) as WorkingHourBlock[];
  const calendarBusyBlocks = (raw.calendar_busy_blocks || [])
    .map(toCalendarBusyBlock)
    .filter((block): block is CalendarBusyBlock => Boolean(block));

  return {
    id: raw.id,
    serviceTypeKeys,
    coverageAreaIds,
    workingHours,
    calendarBusyBlocks,
    offersService: cleanerOffersService(serviceTypeKeys, serviceTypeKey),
    coversArea: cleanerCoversArea(coverageAreaIds, boroughId),
  };
};

/** Convenience for logging/debug — ISO date key from a picker date. */
export const formatSelectedDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');
