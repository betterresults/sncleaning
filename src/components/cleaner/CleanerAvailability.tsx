import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, CalendarClock, AlertTriangle, Eraser, Check, Sparkles, Wrench, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import BookingDetailsSheet from './BookingDetailsSheet';
import { useServiceTypes } from '@/hooks/useCompanySettings';
import { useCleanerServiceTypes, useSaveCleanerServiceTypes } from '@/hooks/useCleanerServiceTypes';
import {
  useCoverageAreaOptions,
  useCleanerCoverageAreas,
  useSaveCleanerCoverageAreas,
} from '@/hooks/useCoverageAreas';

type OpenHoursByDay = Map<number, Set<number>>;

const timeToMinutes = (value: string) => {
  const [h, m] = value.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

const emptyOpenHours = (): OpenHoursByDay => {
  const map = new Map<number, Set<number>>();
  DAYS_OF_WEEK.forEach((day) => map.set(day.value, new Set<number>()));
  return map;
};

const buildOpenHoursFromBlocks = (blocks: CleanerWorkingHour[]): OpenHoursByDay => {
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

// Collapse a day's selected hours into contiguous start/end blocks, e.g. {9,10,11,15,16} -> [9-12, 15-17]
const runsFromHourSet = (hours: Set<number>): Array<{ start: number; end: number }> => {
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

const formatHourLabel = (hour: number) => {
  const h = ((hour + 11) % 12) + 1;
  const period = hour >= 12 && hour < 24 ? 'PM' : 'AM';
  return `${h} ${period}`;
};

const pad = (n: number) => String(n).padStart(2, '0');

const ROW_HEIGHT_PX = 32; // matches the `h-8` cell height used for each hour row

// All week/date math here is deliberately UTC-anchored rather than using the viewer's local
// timezone: `bookings.date_time` is written as naive London wall-clock time with a hardcoded
// "+00:00" suffix (see NewBookingForm), so calendar dates must be derived/compared the same
// way everywhere, regardless of what timezone the cleaner's or admin's device is set to.
const startOfWeekUTC = (date: Date): Date => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  return start;
};

const addDaysUTC = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const isSameUTCDate = (a: Date, b: Date): boolean =>
  a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();

const formatDateNumber = (date: Date) => date.getUTCDate();

const formatWeekRangeLabel = (weekStart: Date): string => {
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

interface BookingBlock {
  id: number;
  dayOfWeek: number;
  topPx: number;
  heightPx: number;
  label: string;
  timeLabel: string;
  outsideHours: boolean;
}

interface AvailabilityGridProps {
  cleanerId: number;
  openHours: OpenHoursByDay;
  startHour: number;
  endHour: number;
  weekDates: Date[];
  bookingBlocksByDay: Map<number, BookingBlock[]>;
  today: Date;
  onToggleCell: (day: number, hour: number) => void;
  onToggleDay: (day: number) => void;
  onSelectBooking: (bookingId: number) => void;
}

const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  openHours,
  startHour,
  endHour,
  weekDates,
  bookingBlocksByDay,
  today,
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
    <div className="overflow-x-auto rounded-xl border border-border">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-border bg-muted/40">
          <div />
          {DAYS_OF_WEEK.map((day, index) => {
            const set = openHours.get(day.value) ?? new Set<number>();
            const totalHours = hours.length;
            const openCount = hours.filter((h) => set.has(h)).length;
            const isFullyOpen = openCount === totalHours;
            const date = weekDates[index];
            const isToday = date ? isSameUTCDate(date, today) : false;

            return (
              <div
                key={day.value}
                className={cn(
                  'flex flex-col items-center gap-1 border-l border-border px-2 py-2',
                  isToday && 'bg-primary/5'
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggleDay(day.value)}
                  title="Toggle whole day"
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border transition-colors',
                    isFullyOpen ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-input bg-background text-transparent'
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <p className="text-xs font-semibold uppercase text-foreground">{day.short}</p>
                <p
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                    isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  )}
                >
                  {date ? formatDateNumber(date) : ''}
                </p>
                <p className={cn('text-[11px]', openCount > 0 ? 'text-emerald-600' : 'text-muted-foreground')}>
                  {openCount > 0 ? `${openCount}h open` : 'Off'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-border last:border-b-0">
              <div className="flex items-center justify-end px-2 py-1.5 text-[11px] text-muted-foreground">
                {formatHourLabel(hour)}
              </div>
              {DAYS_OF_WEEK.map((day) => {
                const isOpen = openHours.get(day.value)?.has(hour) ?? false;
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => onToggleCell(day.value, hour)}
                    className={cn(
                      'h-8 border-l border-border transition-colors',
                      isOpen ? 'bg-emerald-200 hover:bg-emerald-300' : 'bg-background hover:bg-muted'
                    )}
                    aria-label={`${day.label} ${formatHourLabel(hour)}`}
                  />
                );
              })}
            </div>
          ))}

          {/* Booking blocks overlay — purely visual, sits on top of the toggleable cells and
              doesn't intercept clicks except on the blocks themselves. */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-[70px_repeat(7,1fr)]">
            <div />
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="relative border-l border-transparent">
                {(bookingBlocksByDay.get(day.value) ?? []).map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => onSelectBooking(block.id)}
                    title={`${block.timeLabel} · ${block.label}${block.outsideHours ? ' (outside set hours)' : ''} — click for details`}
                    className={cn(
                      'pointer-events-auto absolute inset-x-0.5 overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight text-white shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                      block.outsideHours ? 'bg-amber-500/90 hover:bg-amber-500' : 'bg-sky-500/90 hover:bg-sky-500'
                    )}
                    style={{ top: block.topPx, height: Math.max(block.heightPx, 16) }}
                  >
                    <p className="truncate">{block.timeLabel}</p>
                    <p className="truncate opacity-90">{block.label}</p>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// `date_time`/`end_date_time` are written as naive London wall-clock time with a hardcoded
// "+00:00" suffix (see NewBookingForm's dateTimeStr construction), not real UTC. Formatting
// with the viewer's local timezone (the `toLocaleDateString`/`toLocaleTimeString` default)
// would shift the displayed — and compared — time by the viewer's device offset instead of
// showing the business's actual London clock, so we pin formatting to `timeZone: 'UTC'`.
const formatBookingDay = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

const formatBookingTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });

const getBookingEnd = (booking: CleanerUpcomingBooking): Date | null => {
  if (booking.end_date_time) return new Date(booking.end_date_time);
  if (booking.total_hours != null) {
    return new Date(new Date(booking.date_time).getTime() + booking.total_hours * 60 * 60 * 1000);
  }
  return null;
};

interface UpcomingBookingsPanelProps {
  bookings: CleanerUpcomingBooking[];
  savedBlocksByDay: Map<number, CleanerWorkingHour[]>;
  onSelectBooking: (bookingId: number) => void;
}

const UpcomingBookingsPanel: React.FC<UpcomingBookingsPanelProps> = ({ bookings, savedBlocksByDay, onSelectBooking }) => {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No upcoming jobs booked in the next 2 weeks.</p>;
  }

  return (
    <div className="space-y-2">
      {bookings.map((booking) => {
        const start = new Date(booking.date_time);
        const end = getBookingEnd(booking);
        // Use UTC getters, not local ones — see formatBookingTime comment above.
        const startMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
        const endMinutes = end ? end.getUTCHours() * 60 + end.getUTCMinutes() : startMinutes;

        const dayBlocks = savedBlocksByDay.get(booking.day_of_week) || [];
        const isCovered = dayBlocks.some(
          (block) => timeToMinutes(block.start_time) <= startMinutes && timeToMinutes(block.end_time) >= endMinutes
        );

        const customerName = [booking.first_name, booking.last_name].filter(Boolean).join(' ') || 'Customer';
        const service = booking.service_type || booking.cleaning_type || 'Cleaning';

        return (
          <button
            key={booking.id}
            type="button"
            onClick={() => onSelectBooking(booking.id)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <CalendarClock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formatBookingDay(booking.date_time)} · {formatBookingTime(booking.date_time)}
                  {end ? ` – ${formatBookingTime(end.toISOString())}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {service} · {customerName}
                </p>
              </div>
            </div>

            {!isCovered && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                Outside set hours
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

interface MyServicesPanelProps {
  cleanerId: number;
}

const MyServicesPanel: React.FC<MyServicesPanelProps> = ({ cleanerId }) => {
  const { data: serviceTypes = [], isLoading: isLoadingServiceTypes } = useServiceTypes();
  const { data: myServiceKeys = [], isLoading: isLoadingMyServices } = useCleanerServiceTypes(cleanerId);
  const saveServiceTypes = useSaveCleanerServiceTypes();

  const isLoading = isLoadingServiceTypes || isLoadingMyServices;
  const offersEverything = myServiceKeys.length === 0;

  const handleToggle = (key: string) => {
    const next = myServiceKeys.includes(key)
      ? myServiceKeys.filter((k) => k !== key)
      : [...myServiceKeys, key];
    saveServiceTypes.mutate({ cleanerId, serviceTypeKeys: next });
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Services I work on
          </h3>
          <p className="text-xs text-muted-foreground">
            Only jobs matching what you select here will be shown as a good match for you — leave everything
            unchecked to be considered for every job type.
          </p>
        </div>
        {!isLoading && (
          <Badge
            variant="outline"
            className={cn(
              'w-fit gap-1 text-xs',
              offersEverything
                ? 'border-sky-200 bg-sky-50 text-sky-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            )}
          >
            <Sparkles className="h-3 w-3" />
            {offersEverything ? 'Open to all services' : `${myServiceKeys.length} service${myServiceKeys.length === 1 ? '' : 's'} selected`}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {serviceTypes.map((st) => {
            const checked = myServiceKeys.includes(st.key);
            return (
              <label
                key={st.key}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                  checked
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    : 'border-border bg-background text-foreground hover:bg-muted/60'
                )}
              >
                <Checkbox
                  checked={checked}
                  disabled={saveServiceTypes.isPending}
                  onCheckedChange={() => handleToggle(st.key)}
                />
                {st.label}
              </label>
            );
          })}
        </div>
      )}
    </Card>
  );
};

interface MyAreasPanelProps {
  cleanerId: number;
}

const MyAreasPanel: React.FC<MyAreasPanelProps> = ({ cleanerId }) => {
  const { data: areaOptions = [], isLoading: isLoadingAreaOptions } = useCoverageAreaOptions();
  const { data: myAreaIds = [], isLoading: isLoadingMyAreas } = useCleanerCoverageAreas(cleanerId);
  const saveAreas = useSaveCleanerCoverageAreas();
  const [filter, setFilter] = useState('');

  const isLoading = isLoadingAreaOptions || isLoadingMyAreas;
  const coversEverywhere = myAreaIds.length === 0;

  const visibleOptions = filter.trim()
    ? areaOptions.filter((a) => a.label.toLowerCase().includes(filter.trim().toLowerCase()))
    : areaOptions;

  const handleToggle = (boroughId: string) => {
    const next = myAreaIds.includes(boroughId)
      ? myAreaIds.filter((id) => id !== boroughId)
      : [...myAreaIds, boroughId];
    saveAreas.mutate({ cleanerId, boroughIds: next });
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Areas I cover
          </h3>
          <p className="text-xs text-muted-foreground">
            Only jobs in the areas you select here will be shown as a good match for you — leave everything
            unchecked to be considered for every area.
          </p>
        </div>
        {!isLoading && (
          <Badge
            variant="outline"
            className={cn(
              'w-fit gap-1 text-xs',
              coversEverywhere
                ? 'border-sky-200 bg-sky-50 text-sky-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            )}
          >
            <Sparkles className="h-3 w-3" />
            {coversEverywhere ? 'Open to all areas' : `${myAreaIds.length} area${myAreaIds.length === 1 ? '' : 's'} selected`}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-2">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter areas, e.g. Camden, Essex..."
            className="h-8 max-w-xs text-sm"
          />
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
            {visibleOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No areas match "{filter}"</p>
            ) : (
              visibleOptions.map((area) => {
                const checked = myAreaIds.includes(area.boroughId);
                return (
                  <label
                    key={area.boroughId}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                      checked
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                        : 'border-border bg-background text-foreground hover:bg-muted/60'
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={saveAreas.isPending}
                      onCheckedChange={() => handleToggle(area.boroughId)}
                    />
                    {area.label}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

interface CleanerAvailabilityProps {
  cleanerId: number | null;
}

const CleanerAvailability: React.FC<CleanerAvailabilityProps> = ({ cleanerId }) => {
  const { data: workingHours = [], isLoading } = useCleanerWorkingHours(cleanerId);
  const { data: upcomingBookings = [], isLoading: isLoadingBookings } = useCleanerUpcomingBookings(cleanerId);
  const { startHour, endHour, isLoading: isLoadingHours } = useBusinessHoursRange();
  const saveWeek = useSaveWeeklyAvailability();

  const [openHours, setOpenHours] = useState<OpenHoursByDay>(emptyOpenHours);
  const [isDirty, setIsDirty] = useState(false);

  const today = useMemo(() => new Date(), []);
  const currentWeekStart = useMemo(() => startOfWeekUTC(today), [today]);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => addDaysUTC(currentWeekStart, weekOffset * 7), [currentWeekStart, weekOffset]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysUTC(weekStart, i)), [weekStart]);

  const { data: weekBookings = [], isLoading: isLoadingWeekBookings } = useCleanerBookingsForWeek(cleanerId, weekStart);

  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const selectedBooking = useMemo(
    () => weekBookings.find((b) => b.id === selectedBookingId) ?? upcomingBookings.find((b) => b.id === selectedBookingId) ?? null,
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

  const bookingBlocksByDay = useMemo(() => {
    const map = new Map<number, BookingBlock[]>();
    DAYS_OF_WEEK.forEach((day) => map.set(day.value, []));

    const gridStartMinutes = startHour * 60;
    const gridEndMinutes = endHour * 60;

    weekBookings.forEach((booking) => {
      const start = new Date(booking.date_time);
      const end = getBookingEnd(booking);
      const startMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
      const endMinutes = end ? end.getUTCHours() * 60 + end.getUTCMinutes() : startMinutes + 60;

      // Clip to the visible hour range so a job starting before/ending after the grid's
      // configured business hours still renders (rather than disappearing or overflowing).
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
        topPx: ((clippedStart - gridStartMinutes) / 60) * ROW_HEIGHT_PX,
        heightPx: ((clippedEnd - clippedStart) / 60) * ROW_HEIGHT_PX,
        label: `${service} · ${customerName}`,
        timeLabel: `${formatBookingTime(booking.date_time)}${end ? ` – ${formatBookingTime(end.toISOString())}` : ''}`,
        outsideHours: !isCovered,
      });
    });

    return map;
  }, [weekBookings, savedBlocksByDay, startHour, endHour]);

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
      const totalHours = endHour - startHour;
      const isFullyOpen = set.size === totalHours;
      if (isFullyOpen) {
        set.clear();
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

    saveWeek.mutate(
      { cleanerId, blocks },
      {
        onSuccess: () => setIsDirty(false),
      }
    );
  };

  if (!cleanerId) {
    return <p className="text-sm text-muted-foreground">No cleaner profile linked to this account.</p>;
  }

  const ready = !isLoading && !isLoadingHours;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">My Availability</h2>
          <p className="text-sm text-muted-foreground">
            Tap the hours you're free to work — this repeats every week. Browse weeks below to see your booked jobs
            as blocks on the grid.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ready && (
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              <Clock className="h-3.5 w-3.5" />
              {totalOpenHours}h open / week
            </span>
          )}
          <Button size="sm" onClick={handleSave} disabled={!isDirty || saveWeek.isPending}>
            Save changes
          </Button>
        </div>
      </div>

      <MyServicesPanel cleanerId={cleanerId} />
      <MyAreasPanel cleanerId={cleanerId} />

      {ready && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Presets:</span>
            {AVAILABILITY_PRESETS.map((preset) => (
              <Button key={preset.id} variant="outline" size="sm" onClick={() => handleApplyPreset(preset)}>
                {preset.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearWeek}
              className="gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear week
            </Button>
            {isDirty && <span className="text-xs text-amber-600">Unsaved changes — click Save changes to apply</span>}
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((w) => w - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[150px] text-center text-sm font-medium text-foreground">
              {formatWeekRangeLabel(weekStart)}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((w) => w + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {weekOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
                Today
              </Button>
            )}
          </div>
        </div>
      )}

      {ready ? (
        <AvailabilityGrid
          cleanerId={cleanerId}
          openHours={openHours}
          startHour={startHour}
          endHour={endHour}
          weekDates={weekDates}
          bookingBlocksByDay={bookingBlocksByDay}
          today={today}
          onToggleCell={handleToggleCell}
          onToggleDay={handleToggleDay}
          onSelectBooking={setSelectedBookingId}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
      {ready && isLoadingWeekBookings && (
        <p className="text-xs text-muted-foreground">Loading bookings for this week...</p>
      )}

      <Card className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground">Upcoming bookings</h3>
          <p className="text-xs text-muted-foreground">
            Real jobs already on your schedule, for context while you set your hours.
          </p>
        </div>
        {isLoadingBookings ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <UpcomingBookingsPanel
            bookings={upcomingBookings}
            savedBlocksByDay={savedBlocksByDay}
            onSelectBooking={setSelectedBookingId}
          />
        )}
      </Card>

      <BookingDetailsSheet
        open={!!selectedBookingId}
        onOpenChange={(open) => !open && setSelectedBookingId(null)}
        booking={selectedBooking}
      />
    </div>
  );
};

export default CleanerAvailability;
