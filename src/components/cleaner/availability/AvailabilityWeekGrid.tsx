import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DAYS_OF_WEEK } from '@/hooks/useCleanerWorkingHours';
import {
  DESKTOP_ROW_HEIGHT_PX,
  formatDateNumber,
  formatHourRangeLabel,
  isSameUTCDate,
} from './availabilityUtils';
import type { AvailabilityGridSharedProps } from './types';
import AvailabilityBookingOverlay from './AvailabilityBookingOverlay';

const AvailabilityWeekGrid: React.FC<AvailabilityGridSharedProps> = ({
  openHours,
  startHour,
  endHour,
  weekDates,
  bookingBlocksByDay,
  today,
  highlightedBookingId,
  onToggleCell,
  onToggleDay,
  onSelectBooking,
}) => {
  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = startHour; h < endHour; h += 1) arr.push(h);
    return arr;
  }, [startHour, endHour]);

  return (
    <div className="max-h-[min(70vh,680px)] overflow-auto bg-gradient-to-b from-background to-muted/20">
      <div className="min-w-[760px]">
        <div className="sticky top-0 z-20 grid grid-cols-[88px_repeat(7,1fr)] border-b border-border bg-card shadow-sm">
          <div className="sticky left-0 z-30 bg-card" />
          {DAYS_OF_WEEK.map((day, index) => {
            const set = openHours.get(day.value) ?? new Set<number>();
            const openCount = hours.filter((h) => set.has(h)).length;
            const isFullyOpen = hours.length > 0 && hours.every((h) => set.has(h));
            const date = weekDates[index];
            const isToday = date ? isSameUTCDate(date, today) : false;

            return (
              <div
                key={day.value}
                className={cn(
                  'flex flex-col items-center gap-0.5 border-l border-border px-2 py-2.5',
                  isToday && 'border-l-primary/40 bg-primary/5'
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggleDay(day.value)}
                  aria-pressed={isFullyOpen}
                  title="Toggle whole day"
                  className={cn(
                    'mb-0.5 flex h-6 w-6 items-center justify-center rounded-full border transition-colors',
                    isFullyOpen
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background text-transparent hover:border-primary/50'
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{day.short}</p>
                <p
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                    isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                  )}
                >
                  {date ? formatDateNumber(date) : ''}
                </p>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                    openCount > 0 ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
                  )}
                >
                  {openCount > 0 ? `${openCount}h` : 'Off'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative">
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[88px_repeat(7,1fr)] border-b border-border/70 last:border-b-0"
              style={{ height: DESKTOP_ROW_HEIGHT_PX }}
            >
              <div className="sticky left-0 z-10 flex items-center justify-end border-r border-border/70 bg-card px-2 text-[11px] font-medium text-muted-foreground">
                {formatHourRangeLabel(hour)}
              </div>
              {DAYS_OF_WEEK.map((day, index) => {
                const isOpen = openHours.get(day.value)?.has(hour) ?? false;
                const date = weekDates[index];
                const isToday = date ? isSameUTCDate(date, today) : false;

                return (
                  <button
                    key={day.value}
                    type="button"
                    aria-pressed={isOpen}
                    onClick={() => onToggleCell(day.value, hour)}
                    className={cn(
                      'h-full border-l border-border/70 transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/40',
                      isOpen
                        ? 'bg-primary/20 ring-1 ring-inset ring-primary/25 hover:bg-primary/30'
                        : 'bg-background/70 hover:bg-muted/60',
                      isToday && !isOpen && 'bg-primary/[0.03]'
                    )}
                    aria-label={`${day.label} ${formatHourRangeLabel(hour)}`}
                  />
                );
              })}
            </div>
          ))}

          <div className="pointer-events-none absolute inset-0 grid grid-cols-[88px_repeat(7,1fr)]">
            <div />
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="relative border-l border-transparent">
                <AvailabilityBookingOverlay
                  blocks={bookingBlocksByDay.get(day.value) ?? []}
                  highlightedBookingId={highlightedBookingId}
                  onSelectBooking={onSelectBooking}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityWeekGrid;
