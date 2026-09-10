import { describe, expect, it, vi } from 'vitest';
import {
  buildSlotAvailabilityWindow,
  filterSlotsByCleanerAvailability,
  formatHourToSlotLabel,
  formatTimeOnlyToArrivalSlot,
  generateCandidateSlotLabels,
  isCleanerAssignableForWindow,
  parseSlotLabelToHour,
  type AssignableCleanerCatalogEntry,
} from '@/lib/customerSlotAvailability';
import type { WorkingHourBlock } from '@/lib/cleanerAvailabilityMatch';

vi.mock('@/lib/ukTime', () => ({
  getUKNowAsLocalDate: () => new Date(2026, 6, 9, 8, 0, 0),
}));

const tuesdayWorkingHours: WorkingHourBlock[] = [
  { day_of_week: 2, start_time: '09:00', end_time: '17:00' },
];

const baseCleaner = (
  overrides: Partial<AssignableCleanerCatalogEntry> = {}
): AssignableCleanerCatalogEntry => ({
  id: 23,
  serviceTypeKeys: ['domestic'],
  coverageAreaIds: ['borough-1'],
  workingHours: tuesdayWorkingHours,
  calendarBusyBlocks: [],
  offersService: true,
  coversArea: true,
  ...overrides,
});

describe('parseSlotLabelToHour / formatHourToSlotLabel', () => {
  it('parses AM and PM slot labels, including 1-hour windows', () => {
    expect(parseSlotLabelToHour('9:00 AM')).toBe(9);
    expect(parseSlotLabelToHour('12:00 PM')).toBe(12);
    expect(parseSlotLabelToHour('3:00 PM')).toBe(15);
    expect(parseSlotLabelToHour('11:00 AM – 12:00 PM')).toBe(11);
  });

  it('formats hours as 1-hour arrival windows', () => {
    expect(formatHourToSlotLabel(9)).toBe('9:00 AM – 10:00 AM');
    expect(formatHourToSlotLabel(11)).toBe('11:00 AM – 12:00 PM');
    expect(formatHourToSlotLabel(12)).toBe('12:00 PM – 1:00 PM');
    expect(formatHourToSlotLabel(15)).toBe('3:00 PM – 4:00 PM');
  });
});

describe('isCleanerAssignableForWindow', () => {
  const window = buildSlotAvailabilityWindow(new Date(2026, 6, 14), '9:00 AM', 2.5);

  it('rejects cleaners with empty working hours', () => {
    const cleaner = baseCleaner({ workingHours: [] });
    expect(isCleanerAssignableForWindow(cleaner, window)).toBe(false);
  });

  it('accepts cleaner with matching Tue 9–5 window for 2.5hr job at 9am', () => {
    expect(isCleanerAssignableForWindow(baseCleaner(), window)).toBe(true);
  });

  it('rejects when service or area flags are false', () => {
    expect(isCleanerAssignableForWindow(baseCleaner({ offersService: false }), window)).toBe(false);
    expect(isCleanerAssignableForWindow(baseCleaner({ coversArea: false }), window)).toBe(false);
  });

  it('rejects when calendar has a conflicting busy block', () => {
    const cleaner = baseCleaner({
      calendarBusyBlocks: [
        { dateKey: '2026-07-14', startMinutes: 9 * 60, endMinutes: 12 * 60 },
      ],
    });
    expect(isCleanerAssignableForWindow(cleaner, window)).toBe(false);
  });
});

describe('generateCandidateSlotLabels', () => {
  it('returns empty when no date selected', () => {
    expect(
      generateCandidateSlotLabels({
        startHour: 9,
        endHour: 17,
        durationHours: 2,
        selectedDate: null,
      })
    ).toEqual([]);
  });

  it('respects same-day minimum lead time (2 hours from mocked 8am now)', () => {
    const today = new Date(2026, 6, 9);
    const slots = generateCandidateSlotLabels({
      startHour: 9,
      endHour: 17,
      durationHours: 2,
      selectedDate: today,
    });
    expect(slots[0]).toBe('10:00 AM – 11:00 AM');
    expect(slots).not.toContain('9:00 AM – 10:00 AM');
  });

  it('includes 9am start on a future day with 2.5hr duration ending by 5pm', () => {
    const tuesday = new Date(2026, 6, 14);
    const slots = generateCandidateSlotLabels({
      startHour: 9,
      endHour: 17,
      durationHours: 2.5,
      selectedDate: tuesday,
    });
    expect(slots).toContain('9:00 AM – 10:00 AM');
    expect(slots[slots.length - 1]).toBe('2:00 PM – 3:00 PM');
  });
});

describe('formatTimeOnlyToArrivalSlot', () => {
  it('formats stored start times as 1-hour windows and treats null as Flexible', () => {
    expect(formatTimeOnlyToArrivalSlot('11:00:00')).toBe('11:00 AM – 12:00 PM');
    expect(formatTimeOnlyToArrivalSlot('09:00')).toBe('9:00 AM – 10:00 AM');
    expect(formatTimeOnlyToArrivalSlot(null)).toBe('Flexible');
  });
});

describe('filterSlotsByCleanerAvailability', () => {
  it('keeps only slots with at least one assignable cleaner', () => {
    const tuesday = new Date(2026, 6, 14);
    const cleaners = [baseCleaner()];
    const candidates = ['9:00 AM – 10:00 AM', '2:00 PM – 3:00 PM', '6:00 PM – 7:00 PM'];
    const filtered = filterSlotsByCleanerAvailability(cleaners, tuesday, candidates, 2.5);
    expect(filtered).toEqual(['9:00 AM – 10:00 AM', '2:00 PM – 3:00 PM']);
    expect(filtered).not.toContain('6:00 PM – 7:00 PM');
  });
});
