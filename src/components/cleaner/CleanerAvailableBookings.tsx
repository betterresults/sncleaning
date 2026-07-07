import React, { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarClock,
  MapPin,
  User,
  Banknote,
  UserPlus,
  AlertTriangle,
  Sparkles,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAdditionalDetails } from '@/utils/bookingFormatters';
import { useServiceTypes, getServiceTypeLabel, type ServiceType } from '@/hooks/useCompanySettings';
import { useCleanerServiceTypes, cleanerOffersService, normalizeServiceTypeKey } from '@/hooks/useCleanerServiceTypes';
import { useCleanerCoverageAreas, usePostcodePrefixIndex, cleanerCoversArea } from '@/hooks/useCoverageAreas';
import { matchPostcodeToBorough, isAreaUnverified, type PostcodePrefixEntry } from '@/lib/postcodeCoverage';
import { useCleanerWorkingHours, type CleanerWorkingHour } from '@/hooks/useCleanerWorkingHours';
import {
  computeBookingTimeWindow,
  cleanerCoversTime,
  describeTimeWindow,
  type BookingTimeWindow,
} from '@/lib/cleanerAvailabilityMatch';
import { formatUK, formatUKTime, getUKNowAsStoredString } from '@/lib/ukTime';
import { Booking } from './types';

type EnrichedBooking = Booking & {
  normalizedServiceType: string | null;
  matchesMyServices: boolean;
  matchesMyArea: boolean;
  matchesMyTime: boolean;
  timeWindow: BookingTimeWindow | null;
  areaName: string | null;
  areaUnverified: boolean;
  isGoodMatch: boolean;
};

const estimatePay = (booking: { total_hours?: number | null; total_cost?: number | null }) => {
  if (booking.total_hours && booking.total_hours > 0) {
    return (booking.total_hours * 15).toFixed(2);
  }
  if (booking.total_cost) {
    return (booking.total_cost * 0.75).toFixed(2);
  }
  return '0.00';
};

const enrichBookings = (
  rawBookings: Booking[],
  serviceTypes: ServiceType[],
  myServiceTypeKeys: string[],
  myAreaIds: string[],
  prefixIndex: PostcodePrefixEntry[],
  myWorkingHours: CleanerWorkingHour[]
): EnrichedBooking[] =>
  [...rawBookings]
    .map((booking) => {
      const normalizedServiceType = normalizeServiceTypeKey(booking.service_type, serviceTypes);
      const resolvedArea = matchPostcodeToBorough(booking.postcode, prefixIndex);
      const areaName = resolvedArea
        ? resolvedArea.boroughName === 'General'
          ? resolvedArea.regionName
          : resolvedArea.boroughName
        : null;
      const timeWindow = computeBookingTimeWindow(
        booking.date_time,
        booking.total_hours ?? null,
        booking.end_date_time ?? null
      );
      const areaUnverified = myAreaIds.length > 0 && isAreaUnverified(booking.postcode, resolvedArea);
      const matchesMyServices = cleanerOffersService(myServiceTypeKeys, normalizedServiceType);
      const matchesMyArea = cleanerCoversArea(myAreaIds, resolvedArea?.boroughId ?? null);
      const matchesMyTime = cleanerCoversTime(myWorkingHours, timeWindow);

      return {
        ...booking,
        normalizedServiceType,
        matchesMyServices,
        matchesMyArea,
        matchesMyTime,
        timeWindow,
        areaName,
        areaUnverified,
        isGoodMatch: matchesMyServices && matchesMyArea && matchesMyTime,
      };
    })
    .sort(
      (a, b) =>
        Number(b.isGoodMatch) - Number(a.isGoodMatch) ||
        Number(b.matchesMyServices) +
          Number(b.matchesMyArea) +
          Number(b.matchesMyTime) -
          (Number(a.matchesMyServices) + Number(a.matchesMyArea) + Number(a.matchesMyTime))
    );

interface MatchBadgeProps {
  show: boolean;
  label: string;
  tone?: 'amber' | 'muted';
}

const MatchBadge: React.FC<MatchBadgeProps> = ({ show, label, tone = 'amber' }) => {
  if (!show) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tone === 'amber'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-border bg-muted/50 text-muted-foreground'
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {label}
    </span>
  );
};

interface AvailableBookingCardProps {
  booking: EnrichedBooking;
  serviceTypes: ServiceType[];
  isAssigning: boolean;
  onAssign: (bookingId: number) => void;
}

const AvailableBookingCard: React.FC<AvailableBookingCardProps> = ({
  booking,
  serviceTypes,
  isAssigning,
  onAssign,
}) => {
  const customerName = [booking.first_name, booking.last_name].filter(Boolean).join(' ') || 'Customer';
  const serviceLabel =
    getServiceTypeLabel(booking.normalizedServiceType, serviceTypes) || booking.cleaning_type || 'Cleaning';

  return (
    <Card
      className={cn(
        'overflow-hidden rounded-xl border-border shadow-sm transition-shadow hover:shadow-md',
        booking.isGoodMatch && 'border-primary/20 ring-1 ring-primary/10',
        !booking.isGoodMatch && 'opacity-90'
      )}
    >
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                booking.isGoodMatch ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              <CalendarClock className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{customerName}</p>
                {booking.isGoodMatch && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <Sparkles className="h-3 w-3" />
                    Good match
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {booking.date_time ? formatUK(booking.date_time, 'EEE d MMM yyyy') : 'No date'} ·{' '}
                {booking.date_time ? formatUKTime(booking.date_time) : 'No time'}
                {booking.total_hours ? ` · ${booking.total_hours}h` : ''}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-sm font-semibold text-primary">
            <Banknote className="h-3.5 w-3.5" />
            £{estimatePay(booking)}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <MatchBadge
            show={!booking.matchesMyServices}
            label={`Not in your services${
              booking.normalizedServiceType
                ? ` (${getServiceTypeLabel(booking.normalizedServiceType, serviceTypes)})`
                : ''
            }`}
          />
          <MatchBadge
            show={!booking.matchesMyArea}
            label={`Outside your area${booking.areaName ? ` (${booking.areaName})` : ''}`}
          />
          <MatchBadge
            show={!!booking.areaUnverified}
            label="Area not verified for this postcode"
            tone="muted"
          />
          <MatchBadge show={!booking.matchesMyTime} label="Outside your working hours" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-medium text-foreground">{booking.address}</p>
              {booking.postcode && <p className="text-muted-foreground">{booking.postcode}</p>}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                {serviceLabel}
              </span>
            </div>
            {(booking.email || booking.phone_number) && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <User className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  {booking.email && <p className="truncate">{booking.email}</p>}
                  {booking.phone_number && <p>{booking.phone_number}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {booking.additional_details && (
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <p className="mb-1 font-medium text-foreground">Additional details</p>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {formatAdditionalDetails(booking.additional_details)}
            </p>
          </div>
        )}

        <div className="flex justify-end border-t border-border pt-3">
          <Button
            onClick={() => onAssign(booking.id)}
            disabled={isAssigning || !booking.matchesMyTime}
            title={!booking.matchesMyTime ? "This job is outside the working hours you've set" : undefined}
            size="sm"
            className="min-w-[120px]"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {isAssigning ? 'Getting job...' : !booking.matchesMyTime ? 'Outside your hours' : 'Get job'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const CleanerAvailableBookings = () => {
  const { cleanerId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: serviceTypes = [] } = useServiceTypes();
  const { data: myServiceTypeKeys = [] } = useCleanerServiceTypes(cleanerId ?? null);
  const { data: myAreaIds = [] } = useCleanerCoverageAreas(cleanerId ?? null);
  const { data: prefixIndex = [] } = usePostcodePrefixIndex();
  const { data: myWorkingHours = [] } = useCleanerWorkingHours(cleanerId ?? null);

  const fetchAvailableBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .is('cleaner', null)
      .neq('booking_status', 'cancelled')
      .gte('date_time', getUKNowAsStoredString())
      .order('date_time', { ascending: true });

    if (error) throw error;
    return data;
  };

  const { data: rawBookings = [], isLoading, error, refetch } = useQuery({
    queryKey: ['available-bookings'],
    queryFn: fetchAvailableBookings,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const bookings = useMemo(
    () => enrichBookings(rawBookings, serviceTypes, myServiceTypeKeys, myAreaIds, prefixIndex, myWorkingHours),
    [rawBookings, serviceTypes, myServiceTypeKeys, myAreaIds, prefixIndex, myWorkingHours]
  );

  const goodMatchCount = useMemo(() => bookings.filter((booking) => booking.isGoodMatch).length, [bookings]);

  useEffect(() => {
    const channel = supabase
      .channel('available-bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const assignBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      if (!cleanerId) {
        throw new Error('Cleaner ID is required to assign a booking.');
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({ cleaner: cleanerId })
        .eq('id', bookingId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Booking assigned successfully',
        description: 'You have successfully assigned this booking to yourself.',
      });
      queryClient.invalidateQueries({ queryKey: ['available-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['cleaner-bookings'] });
    },
    onError: () => {
      toast({
        title: 'Error assigning booking',
        description: 'There was an error assigning the booking. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleAssignBooking = (bookingId: number) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking && !booking.matchesMyTime) {
      toast({
        title: 'Outside your working hours',
        description: `This job${
          booking.timeWindow ? ` runs ${describeTimeWindow(booking.timeWindow)}` : ''
        }, which is outside the hours you've set on your availability page.`,
        variant: 'destructive',
      });
      return;
    }
    assignBookingMutation.mutate(bookingId);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading available bookings...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">Error: {error.message}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Available Bookings</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Unassigned jobs you can pick up. Good matches line up with your services, areas, and set working hours.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Briefcase className="h-3.5 w-3.5" />
            {bookings.length} available
          </span>
          {goodMatchCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {goodMatchCount} good {goodMatchCount === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card className="rounded-xl border-dashed shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <UserPlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No available bookings</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              All jobs are currently assigned. Check back later for new opportunities.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <AvailableBookingCard
              key={booking.id}
              booking={booking}
              serviceTypes={serviceTypes}
              isAssigning={assignBookingMutation.isPending}
              onAssign={handleAssignBooking}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CleanerAvailableBookings;
