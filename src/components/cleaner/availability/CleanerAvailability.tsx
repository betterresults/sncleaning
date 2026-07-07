import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DAYS_OF_WEEK,
  AVAILABILITY_PRESETS,
  useCleanerWorkingHours,
  useSaveWeeklyAvailability,
  type CleanerWorkingHour,
  type WeeklyBlockInput,
} from '@/hooks/useCleanerWorkingHours';
import { useBusinessHoursRange } from '@/hooks/useSchedulingRules';
import {
  useCleanerUpcomingBookings,
  useCleanerBookingsForWeek,
  type CleanerUpcomingBooking,
} from '@/hooks/useCleanerUpcomingBookings';
import BookingDetailsSheet from '../BookingDetailsSheet';
import AvailabilitySummaryHeader from './AvailabilitySummaryHeader';
import AvailabilityPresetsBar from './AvailabilityPresetsBar';
import AvailabilityLegend from './AvailabilityLegend';
import AvailabilityWeekGrid from './AvailabilityWeekGrid';
import AvailabilityDayGrid from './AvailabilityDayGrid';
import AvailabilityServicesPanel from './AvailabilityServicesPanel';
import AvailabilityAreasPanel from './AvailabilityAreasPanel';
import AvailabilityAgenda from './AvailabilityAgenda';
import AvailabilityLeaveDialog from './AvailabilityLeaveDialog';
import { useAvailabilityUnsavedGuard } from './useAvailabilityUnsavedGuard';
import {
  addDaysUTC,
  buildOpenHoursFromBlocks,
  countActiveDays,
  dayIndexForDayOfWeek,
  DESKTOP_ROW_HEIGHT_PX,
  emptyOpenHours,
  findFirstConflictBlock,
  findTodayIndexInWeek,
  formatBookingTime,
  getBookingEnd,
  MOBILE_ROW_HEIGHT_PX,
  pad,
  runsFromHourSet,
  startOfWeekUTC,
  timeToMinutes,
  weekOffsetForBooking,
} from './availabilityUtils';
import type { BookingBlock, OpenHoursByDay } from './types';
import { getUKNowAsStoredDate } from '@/lib/ukTime';

interface CleanerAvailabilityProps {
  cleanerId: number | null;
  isAdminViewing?: boolean;
  isMobileView?: boolean;
}

const buildBookingBlocksByDay = (
  weekBookings: CleanerUpcomingBooking[],
  savedBlocksByDay: Map<number, CleanerWorkingHour[]>,
  startHour: number,
  endHour: number,
  rowHeightPx: number
): Map<number, BookingBlock[]> => {
  const map = new Map<number, BookingBlock[]>();
  DAYS_OF_WEEK.forEach((day) => map.set(day.value, []));

  const gridStartMinutes = startHour * 60;
  const gridEndMinutes = endHour * 60;

  weekBookings.forEach((booking) => {
    const start = new Date(booking.date_time);
    const end = getBookingEnd(booking);
    const startMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
    const endMinutes = end ? end.getUTCHours() * 60 + end.getUTCMinutes() : startMinutes + 60;

    const clippedStart = Math.max(startMinutes, gridStartMinutes);
    const clippedEnd = Math.min(Math.max(endMinutes, clippedStart + 15), gridEndMinutes);
    if (clippedStart >= gridEndMinutes || clippedEnd <= gridStartMinutes) return;

    const dayBlocks = savedBlocksByDay.get(booking.day_of_week) || [];
    const isCovered = dayBlocks.some(
      (block) => timeToMinutes(block.start_time) <= startMinutes && timeToMinutes(block.end_time) >= endMinutes
    );

    const customerName = [booking.first_name, booking.last_name].filter(Boolean).join(' ') || 'Customer';
    const service = booking.service_type || booking.cleaning_type || 'Cleaning';

    map.get(booking.day_of_week)?.push({
      id: booking.id,
      dayOfWeek: booking.day_of_week,
      topPx: ((clippedStart - gridStartMinutes) / 60) * rowHeightPx,
      heightPx: ((clippedEnd - clippedStart) / 60) * rowHeightPx,
      label: `${service} · ${customerName}`,
      timeLabel: `${formatBookingTime(booking.date_time)}${end ? ` – ${formatBookingTime(end.toISOString())}` : ''}`,
      outsideHours: !isCovered,
    });
  });

  return map;
};

const CleanerAvailability: React.FC<CleanerAvailabilityProps> = ({
  cleanerId,
  isAdminViewing = false,
  isMobileView = false,
}) => {
  const { data: workingHours = [], isLoading } = useCleanerWorkingHours(cleanerId);
  const { data: upcomingBookings = [], isLoading: isLoadingBookings } = useCleanerUpcomingBookings(cleanerId);
  const { startHour, endHour, isLoading: isLoadingHours } = useBusinessHoursRange();
  const saveWeek = useSaveWeeklyAvailability();

  const [openHours, setOpenHours] = useState<OpenHoursByDay>(emptyOpenHours);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');
  const [highlightedBookingId, setHighlightedBookingId] = useState<number | null>(null);
  const gridCardRef = useRef<HTMLDivElement>(null);
  const navigationBlocker = useAvailabilityUnsavedGuard(isDirty);

  const today = useMemo(() => getUKNowAsStoredDate(), []);
  const currentWeekStart = useMemo(() => startOfWeekUTC(today), [today]);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => addDaysUTC(currentWeekStart, weekOffset * 7), [currentWeekStart, weekOffset]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysUTC(weekStart, i)), [weekStart]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(() => findTodayIndexInWeek(weekDates, today));

  useEffect(() => {
    setSelectedDayIndex(findTodayIndexInWeek(weekDates, today));
  }, [weekOffset, weekDates, today]);

  const { data: weekBookings = [], isLoading: isLoadingWeekBookings } = useCleanerBookingsForWeek(cleanerId, weekStart);

  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const selectedBooking = useMemo(
    () =>
      weekBookings.find((b) => b.id === selectedBookingId) ??
      upcomingBookings.find((b) => b.id === selectedBookingId) ??
      null,
    [weekBookings, upcomingBookings, selectedBookingId]
  );

  useEffect(() => {
    if (isLoading || isDirty) return;
    setOpenHours(buildOpenHoursFromBlocks(workingHours));
  }, [workingHours, isLoading, isDirty]);

  const savedBlocksByDay = useMemo(() => {
    const map = new Map<number, CleanerWorkingHour[]>();
    DAYS_OF_WEEK.forEach((day) => map.set(day.value, []));
    workingHours.forEach((wh) => map.get(wh.day_of_week)?.push(wh));
    return map;
  }, [workingHours]);

  const totalOpenHours = useMemo(
    () => [...openHours.values()].reduce((sum, set) => sum + set.size, 0),
    [openHours]
  );

  const activeDays = useMemo(() => countActiveDays(openHours, startHour, endHour), [openHours, startHour, endHour]);

  const rowHeightPx = isMobileView ? MOBILE_ROW_HEIGHT_PX : DESKTOP_ROW_HEIGHT_PX;

  const bookingBlocksByDay = useMemo(
    () => buildBookingBlocksByDay(weekBookings, savedBlocksByDay, startHour, endHour, rowHeightPx),
    [weekBookings, savedBlocksByDay, startHour, endHour, rowHeightPx]
  );

  const conflicts = useMemo(() => {
    let count = 0;
    bookingBlocksByDay.forEach((blocks) => {
      blocks.forEach((block) => {
        if (block.outsideHours) count += 1;
      });
    });
    return count;
  }, [bookingBlocksByDay]);

  const focusBookingOnGrid = useCallback(
    (booking: CleanerUpcomingBooking) => {
      setActiveTab('schedule');
      setWeekOffset(weekOffsetForBooking(booking.date_time, currentWeekStart));
      setSelectedDayIndex(dayIndexForDayOfWeek(booking.day_of_week));
      setHighlightedBookingId(booking.id);
      window.setTimeout(() => {
        gridCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    },
    [currentWeekStart]
  );

  const handleViewConflicts = useCallback(() => {
    const conflict = findFirstConflictBlock(bookingBlocksByDay);
    if (!conflict) return;

    setActiveTab('schedule');
    setSelectedDayIndex(dayIndexForDayOfWeek(conflict.dayOfWeek));
    setHighlightedBookingId(conflict.id);
    window.setTimeout(() => {
      gridCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }, [bookingBlocksByDay]);

  useEffect(() => {
    if (!highlightedBookingId) return;
    const timeout = window.setTimeout(() => setHighlightedBookingId(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [highlightedBookingId]);

  const mutateHours = (updater: (next: OpenHoursByDay) => void) => {
    setOpenHours((prev) => {
      const next = new Map<number, Set<number>>();
      prev.forEach((set, day) => next.set(day, new Set(set)));
      updater(next);
      return next;
    });
    setIsDirty(true);
  };

  const handleToggleCell = (day: number, hour: number) => {
    mutateHours((next) => {
      const set = next.get(day)!;
      if (set.has(hour)) set.delete(hour);
      else set.add(hour);
    });
  };

  const handleToggleDay = (day: number) => {
    mutateHours((next) => {
      const set = next.get(day)!;
      const isFullyOpen = Array.from({ length: endHour - startHour }, (_, i) => startHour + i).every((h) =>
        set.has(h)
      );
      if (isFullyOpen) {
        for (let h = startHour; h < endHour; h += 1) set.delete(h);
      } else {
        for (let h = startHour; h < endHour; h += 1) set.add(h);
      }
    });
  };

  const handleApplyPreset = (preset: (typeof AVAILABILITY_PRESETS)[number]) => {
    mutateHours((next) => {
      preset.days.forEach((day) => {
        const set = next.get(day)!;
        set.clear();
        for (let h = preset.startHour; h < preset.endHour; h += 1) set.add(h);
      });
    });
  };

  const handleClearWeek = () => {
    mutateHours((next) => {
      next.forEach((set) => set.clear());
    });
  };

  const handleCancelChanges = () => {
    setOpenHours(buildOpenHoursFromBlocks(workingHours));
    setIsDirty(false);
  };

  const handleSave = () => {
    if (!cleanerId) return;

    const blocks: WeeklyBlockInput[] = [];
    openHours.forEach((set, dayOfWeek) => {
      runsFromHourSet(set).forEach((run) => {
        blocks.push({
          dayOfWeek,
          startTime: `${pad(run.start)}:00`,
          endTime: `${pad(run.end)}:00`,
        });
      });
    });

    saveWeek.mutate({ cleanerId, blocks }, { onSuccess: () => setIsDirty(false) });
  };

  if (!cleanerId) {
    return (
      <p className="text-sm text-muted-foreground">
        {isAdminViewing
          ? 'Please select a cleaner above to view their availability.'
          : 'No cleaner profile linked to this account.'}
      </p>
    );
  }

  const ready = !isLoading && !isLoadingHours;

  const gridSharedProps = {
    openHours,
    startHour,
    endHour,
    weekDates,
    bookingBlocksByDay,
    today,
    highlightedBookingId,
    onToggleCell: handleToggleCell,
    onToggleDay: handleToggleDay,
    onSelectBooking: setSelectedBookingId,
  };

  return (
    <div className="space-y-4 pb-2">
      <AvailabilitySummaryHeader
        totalOpenHours={totalOpenHours}
        activeDays={activeDays}
        conflicts={conflicts}
        isDirty={isDirty}
        isSaving={saveWeek.isPending}
        ready={ready}
        onSave={handleSave}
        onCancel={handleCancelChanges}
        onViewConflicts={conflicts > 0 ? handleViewConflicts : undefined}
        showSaveButton={!isMobileView}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/70 p-1 sm:max-w-md">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="preferences">Services &amp; areas</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-0 space-y-4">
          {ready ? (
            <Card ref={gridCardRef} className="overflow-hidden shadow-sm">
              <AvailabilityPresetsBar
                weekStart={weekStart}
                weekOffset={weekOffset}
                onApplyPreset={handleApplyPreset}
                onClearWeek={handleClearWeek}
                onPrevWeek={() => setWeekOffset((w) => w - 1)}
                onNextWeek={() => setWeekOffset((w) => w + 1)}
                onToday={() => setWeekOffset(0)}
              />
              <AvailabilityLegend />
              {isMobileView ? (
                <div className="p-3">
                  <AvailabilityDayGrid
                    {...gridSharedProps}
                    selectedDayIndex={selectedDayIndex}
                    onSelectDayIndex={setSelectedDayIndex}
                  />
                </div>
              ) : (
                <AvailabilityWeekGrid {...gridSharedProps} />
              )}
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {ready && isLoadingWeekBookings && (
            <p className="text-xs text-muted-foreground">Loading bookings for this week...</p>
          )}

          <AvailabilityAgenda
            bookings={upcomingBookings}
            savedBlocksByDay={savedBlocksByDay}
            isLoading={isLoadingBookings}
            onSelectBooking={setSelectedBookingId}
            onViewBookingOnGrid={focusBookingOnGrid}
            defaultOpen={isMobileView && upcomingBookings.length > 0}
          />
        </TabsContent>

        <TabsContent value="preferences" className="mt-0 space-y-4">
          <Card className="p-4 shadow-sm">
            <AvailabilityServicesPanel cleanerId={cleanerId} />
          </Card>
          <Card className="p-4 shadow-sm">
            <AvailabilityAreasPanel cleanerId={cleanerId} />
          </Card>
        </TabsContent>
      </Tabs>

      {isMobileView && isDirty && (
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-40 border-t border-border bg-background/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
              Unsaved changes
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={handleCancelChanges} disabled={saveWeek.isPending}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saveWeek.isPending} className="min-w-[112px]">
                {saveWeek.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <BookingDetailsSheet
        open={!!selectedBookingId}
        onOpenChange={(open) => !open && setSelectedBookingId(null)}
        booking={selectedBooking}
      />

      <AvailabilityLeaveDialog
        open={navigationBlocker.state === 'blocked'}
        onStay={() => navigationBlocker.reset?.()}
        onLeave={() => navigationBlocker.proceed?.()}
      />
    </div>
  );
};

export default CleanerAvailability;
