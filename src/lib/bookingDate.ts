const buildLocalDate = (year: number, month: number, day: number): Date | null => {
  const result = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    Number.isNaN(result.getTime()) ||
    result.getFullYear() !== year ||
    result.getMonth() !== month - 1 ||
    result.getDate() !== day
  ) {
    return null;
  }

  return result;
};

export const parseDatePreserveLocalDay = (value?: string | null): Date | null => {
  if (!value) return null;

  const trimmedValue = value.trim();

  const isoMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoMatch) {
    return buildLocalDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const dmyMatch = trimmedValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmyMatch) {
    const year = Number(dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3]);
    return buildLocalDate(year, Number(dmyMatch[2]), Number(dmyMatch[1]));
  }

  const parsed = new Date(trimmedValue);
  if (Number.isNaN(parsed.getTime())) return null;

  return buildLocalDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
};

export const formatDateForStorage = (value?: Date | string | null): string | null => {
  if (!value) return null;

  if (typeof value === 'string') {
    const parsed = parseDatePreserveLocalDay(value);
    return parsed ? formatDateForStorage(parsed) : null;
  }

  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};

export const normalizeTimeString = (timeValue?: string | null): string | null => {
  if (!timeValue) return null;

  let normalized = timeValue.includes(' - ') ? timeValue.split(' - ')[0].trim() : timeValue.trim();
  const timeMatch = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/);

  if (!timeMatch) return null;

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2] ?? '0');
  const period = timeMatch[3]?.toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const formatStoredTimeForDisplay = (timeValue?: string | null): string | null => {
  const normalized = normalizeTimeString(timeValue);
  if (!normalized) return timeValue ?? null;

  let [hours, minutes] = normalized.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';

  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }

  return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
};

export const combineLocalDateAndTime = (dateValue?: Date | null, timeValue?: string | null): Date | null => {
  if (!dateValue || !timeValue) return null;

  const normalizedTime = normalizeTimeString(timeValue);
  if (!normalizedTime) return null;

  const [hours, minutes] = normalizedTime.split(':').map(Number);
  return new Date(
    dateValue.getFullYear(),
    dateValue.getMonth(),
    dateValue.getDate(),
    hours,
    minutes,
    0,
    0,
  );
};