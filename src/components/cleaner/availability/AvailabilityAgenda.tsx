import React, { useState } from 'react';
import { CalendarClock, AlertTriangle, ChevronDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import type { CleanerWorkingHour } from '@/hooks/useCleanerWorkingHours';
import type { CleanerUpcomingBooking } from '@/hooks/useCleanerUpcomingBookings';
import {
  formatBookingDay,
  formatBookingTime,
  getBookingEnd,
  isBookingOutsideSavedHours,
} from './availabilityUtils';

interface AvailabilityAgendaProps {
  bookings: CleanerUpcomingBooking[];
  savedBlocksByDay: Map<number, CleanerWorkingHour[]>;
  isLoading: boolean;
  onSelectBooking: (bookingId: number) => void;
  onViewBookingOnGrid?: (booking: CleanerUpcomingBooking) => void;
  defaultOpen?: boolean;
}

const AvailabilityAgenda: React.FC<AvailabilityAgendaProps> = ({
  bookings,
  savedBlocksByDay,
  isLoading,
  onSelectBooking,
  onViewBookingOnGrid,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const conflictCount = bookings.filter((booking) =>
    isBookingOutsideSavedHours(booking, savedBlocksByDay)
  ).length;

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
          {!isLoading && conflictCount > 0 && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              {conflictCount} outside hours
            </span>
          )}
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
              const end = getBookingEnd(booking);
              const isOutsideHours = isBookingOutsideSavedHours(booking, savedBlocksByDay);
              const customerName = [booking.first_name, booking.last_name].filter(Boolean).join(' ') || 'Customer';
              const service = booking.service_type || booking.cleaning_type || 'Cleaning';

              return (
                <div
                  key={booking.id}
                  className={cn(
                    'rounded-lg border border-border bg-background p-3',
                    isOutsideHours && 'border-amber-200/80 bg-amber-50/30'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectBooking(booking.id)}
                    className="flex w-full items-start gap-3 text-left transition-colors hover:opacity-90"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CalendarClock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {formatBookingDay(booking.date_time)} · {formatBookingTime(booking.date_time)}
                        {end ? ` – ${formatBookingTime(end.toISOString())}` : ''}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {service} · {customerName}
                      </p>
                    </div>
                  </button>

                  {isOutsideHours && onViewBookingOnGrid && (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/60 pt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        Outside your set hours
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 border-amber-200 bg-background text-xs text-amber-800 hover:bg-amber-50"
                        onClick={() => onViewBookingOnGrid(booking)}
                      >
                        <MapPin className="mr-1 h-3 w-3" />
                        View on grid
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AvailabilityAgenda;
