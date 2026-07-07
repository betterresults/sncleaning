import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DAYS_OF_WEEK } from '@/hooks/useCleanerWorkingHours';
import {
  MOBILE_ROW_HEIGHT_PX,
  formatDateNumber,
  formatHourRangeLabel,
  isSameUTCDate,
} from './availabilityUtils';
import type { AvailabilityGridSharedProps } from './types';
import AvailabilityBookingOverlay from './AvailabilityBookingOverlay';

interface AvailabilityDayGridProps extends AvailabilityGridSharedProps {
  selectedDayIndex: number;
  onSelectDayIndex: (index: number) => void;
}

const AvailabilityDayGrid: React.FC<AvailabilityDayGridProps> = ({
  openHours,
  startHour,
  endHour,
  weekDates,
  bookingBlocksByDay,
  today,
  highlightedBookingId,
  selectedDayIndex,
  onSelectDayIndex,
  onToggleCell,
  onToggleDay,
  onSelectBooking,
}) => {
  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = startHour; h < endHour; h += 1) arr.push(h);
    return arr;
  }, [startHour, endHour]);

  const selectedDay = DAYS_OF_WEEK[selectedDayIndex];
  const selectedDate = weekDates[selectedDayIndex];
  const dayValue = selectedDay.value;
  const set = openHours.get(dayValue) ?? new Set<number>();
  const openCount = hours.filter((h) => set.has(h)).length;
  const isFullyOpen = hours.length > 0 && hours.every((h) => set.has(h));
  const isToday = selectedDate ? isSameUTCDate(selectedDate, today) : false;

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {DAYS_OF_WEEK.map((day, index) => {
          const date = weekDates[index];
          const dayIsToday = date ? isSameUTCDate(date, today) : false;
          const isSelected = index === selectedDayIndex;
          const daySet = openHours.get(day.value) ?? new Set<number>();
          const dayOpenCount = hours.filter((h) => daySet.has(h)).length;

          return (
            <button
              key={day.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectDayIndex(index)}
              className={cn(
                'flex min-w-[3.4rem] flex-col items-center rounded-xl border px-2 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                  : 'border-border bg-background hover:bg-muted/50',
                dayIsToday && !isSelected && 'border-primary/30'
              )}
            >
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">{day.short}</span>
              <span
                className={cn(
                  'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                  dayIsToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                )}
              >
                {date ? formatDateNumber(date) : ''}
              </span>
              <span className={cn('mt-0.5 text-[10px] font-medium', dayOpenCount > 0 ? 'text-primary' : 'text-muted-foreground')}>
                {dayOpenCount > 0 ? `${dayOpenCount}h` : 'Off'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{selectedDay.label}</p>
          <p className="text-xs text-muted-foreground">
            {openCount > 0 ? `${openCount} hours open` : 'No hours set'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggleDay(dayValue)}
          aria-pressed={isFullyOpen}
          title="Toggle whole day"
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
            isFullyOpen
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background text-foreground hover:border-primary/50'
          )}
        >
          <Check className="h-3.5 w-3.5" />
          {isFullyOpen ? 'All day' : 'Set all day'}
        </button>
      </div>

      <div className={cn('relative overflow-hidden rounded-xl border border-border bg-card', isToday && 'ring-1 ring-primary/20')}>
        {hours.map((hour) => {
          const isOpen = set.has(hour);
          return (
            <button
              key={hour}
              type="button"
              aria-pressed={isOpen}
              onClick={() => onToggleCell(dayValue, hour)}
              className={cn(
                'flex w-full items-center border-b border-border/70 last:border-b-0 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/40',
                isOpen
                  ? 'bg-primary/20 ring-1 ring-inset ring-primary/25 hover:bg-primary/30'
                  : 'bg-background hover:bg-muted/50'
              )}
              style={{ height: MOBILE_ROW_HEIGHT_PX }}
              aria-label={`${selectedDay.label} ${formatHourRangeLabel(hour)}`}
            >
              <span className="flex w-24 shrink-0 flex-col text-left">
                <span className="text-sm font-semibold text-foreground">{formatHourRangeLabel(hour)}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">1 hour</span>
              </span>
              <span
                className={cn(
                  'ml-auto rounded-full px-2.5 py-1 text-xs font-medium',
                  isOpen ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                )}
              >
                {isOpen ? 'Available' : 'Off'}
              </span>
            </button>
          );
        })}

        <div className="pointer-events-none absolute inset-0 pl-28">
          <div className="relative h-full">
            <AvailabilityBookingOverlay
              blocks={bookingBlocksByDay.get(dayValue) ?? []}
              highlightedBookingId={highlightedBookingId}
              onSelectBooking={onSelectBooking}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityDayGrid;
