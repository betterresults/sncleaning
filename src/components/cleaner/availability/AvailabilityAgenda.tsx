import React, { useState } from 'react';
import { CalendarClock, AlertTriangle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { CleanerWorkingHour } from '@/hooks/useCleanerWorkingHours';
import type { CleanerUpcomingBooking } from '@/hooks/useCleanerUpcomingBookings';
import {
  formatBookingDay,
  formatBookingTime,
  getBookingEnd,
  timeToMinutes,
} from './availabilityUtils';

interface AvailabilityAgendaProps {
  bookings: CleanerUpcomingBooking[];
  savedBlocksByDay: Map<number, CleanerWorkingHour[]>;
  isLoading: boolean;
  onSelectBooking: (bookingId: number) => void;
  defaultOpen?: boolean;
}

const AvailabilityAgenda: React.FC<AvailabilityAgendaProps> = ({
  bookings,
  savedBlocksByDay,
  isLoading,
  onSelectBooking,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border border-border bg-card">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30">
        <div>
          <p className="text-sm font-semibold text-foreground">Agenda</p>
          <p className="text-xs text-muted-foreground">
            Upcoming jobs in the next 2 weeks — also shown on the grid above
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && bookings.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {bookings.length}
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t border-border px-4 py-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming jobs booked in the next 2 weeks.</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((booking) => {
              const start = new Date(booking.date_time);
              const end = getBookingEnd(booking);
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
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CalendarClock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {formatBookingDay(booking.date_time)} · {formatBookingTime(booking.date_time)}
                        {end ? ` – ${formatBookingTime(end.toISOString())}` : ''}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {service} · {customerName}
                      </p>
                    </div>
                  </div>

                  {!isCovered && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                      <AlertTriangle className="h-3 w-3" />
                      Outside hours
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AvailabilityAgenda;
