import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, User, Phone, Home, Info, Key, Car, Users, Briefcase, Timer } from 'lucide-react';
import { useServiceTypes, useCleaningTypes, getServiceTypeLabel, getCleaningTypeLabel } from '@/hooks/useCompanySettings';
import {
  formatPropertyDetails,
  formatAdditionalDetails,
  normalizeCleaningTypeKey,
  normalizeServiceTypeKey,
  correctBookingTypes,
} from '@/utils/bookingFormatters';
import type { CleanerUpcomingBooking } from '@/hooks/useCleanerUpcomingBookings';

interface BookingDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: CleanerUpcomingBooking | null;
}

const getStatusBadge = (status: string | null) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>;
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>;
    case 'completed':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Confirmed</Badge>;
  }
};

// Formats an ISO date string as the London wall-clock time it was stored with —
// see the timezone note in useCleanerUpcomingBookings.ts.
const formatUTC = (dateStr: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(dateStr).toLocaleString(undefined, { ...opts, timeZone: 'UTC' });

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon,
  title,
  children,
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      {icon}
      {title}
    </div>
    <div className="space-y-2 pl-6">{children}</div>
  </div>
);

const BookingDetailsSheet: React.FC<BookingDetailsSheetProps> = ({ open, onOpenChange, booking }) => {
  const { data: serviceTypes = [] } = useServiceTypes();
  const { data: cleaningTypes = [] } = useCleaningTypes();

  if (!booking) return null;

  const { serviceType: correctedServiceType, cleaningType: correctedCleaningType } = correctBookingTypes(booking);
  const serviceTypeLabel = getServiceTypeLabel(normalizeServiceTypeKey(correctedServiceType), serviceTypes);
  const cleaningTypeLabel = getCleaningTypeLabel(normalizeCleaningTypeKey(correctedCleaningType), cleaningTypes);
  const formattedPropertyDetails = formatPropertyDetails(booking.property_details);
  const formattedAdditionalDetails = formatAdditionalDetails(booking.additional_details);

  const startLabel = formatUTC(booking.date_time, { hour: 'numeric', minute: '2-digit' });
  const endLabel = booking.end_date_time ? formatUTC(booking.end_date_time, { hour: 'numeric', minute: '2-digit' }) : null;
  const dayLabel = formatUTC(booking.date_time, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const customerName = [booking.first_name, booking.last_name].filter(Boolean).join(' ') || 'Customer';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Booking Details
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <div className="font-semibold text-foreground">{dayLabel}</div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {startLabel}
                  {endLabel && ` – ${endLabel}`}
                </div>
              </div>
            </div>
            {getStatusBadge(booking.booking_status)}
          </div>

          <Section icon={<User className="h-4 w-4 text-primary" />} title="Customer">
            <p className="text-sm font-medium text-foreground">{customerName}</p>
            {booking.phone_number && (
              <a href={`tel:${booking.phone_number}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                <Phone className="h-3.5 w-3.5" />
                {booking.phone_number}
              </a>
            )}
          </Section>

          <Separator />

          <Section icon={<MapPin className="h-4 w-4 text-primary" />} title="Property">
            {booking.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.postcode || booking.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1.5 text-sm text-primary hover:underline"
              >
                <Home className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  {booking.address}
                  {booking.postcode && <span className="block text-muted-foreground">{booking.postcode}</span>}
                </span>
              </a>
            )}
            {booking.occupied && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Occupancy: {booking.occupied}
              </p>
            )}
          </Section>

          <Separator />

          <Section icon={<Briefcase className="h-4 w-4 text-primary" />} title="Service">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {serviceTypeLabel && (
                <div>
                  <p className="text-xs text-muted-foreground">Service Type</p>
                  <p className="font-medium text-foreground">{serviceTypeLabel}</p>
                </div>
              )}
              {cleaningTypeLabel && (
                <div>
                  <p className="text-xs text-muted-foreground">Cleaning Type</p>
                  <p className="font-medium text-foreground">{cleaningTypeLabel}</p>
                </div>
              )}
              {booking.total_hours && (
                <div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Timer className="h-3 w-3" /> Duration
                  </p>
                  <p className="font-medium text-foreground">{booking.total_hours} hours</p>
                </div>
              )}
              {booking.frequently && (
                <div>
                  <p className="text-xs text-muted-foreground">Frequency</p>
                  <p className="font-medium text-foreground">{booking.frequently}</p>
                </div>
              )}
            </div>
          </Section>

          {(formattedAdditionalDetails || formattedPropertyDetails || booking.exclude_areas || booking.extras) && (
            <>
              <Separator />
              <Section icon={<Info className="h-4 w-4 text-primary" />} title="Additional Information">
                {formattedAdditionalDetails && (
                  <div>
                    <p className="text-xs text-muted-foreground">Additional Details</p>
                    <p className="whitespace-pre-wrap rounded bg-muted/40 p-2 text-sm text-foreground">
                      {formattedAdditionalDetails}
                    </p>
                  </div>
                )}
                {formattedPropertyDetails && (
                  <div>
                    <p className="text-xs text-muted-foreground">Property Details</p>
                    <p className="whitespace-pre-wrap rounded bg-muted/40 p-2 text-sm text-foreground">
                      {formattedPropertyDetails}
                    </p>
                  </div>
                )}
                {booking.exclude_areas && (
                  <div>
                    <p className="text-xs text-muted-foreground">Areas to Exclude</p>
                    <p className="rounded bg-muted/40 p-2 text-sm text-foreground">{booking.exclude_areas}</p>
                  </div>
                )}
                {booking.extras && (
                  <div>
                    <p className="text-xs text-muted-foreground">Extras</p>
                    <p className="rounded bg-muted/40 p-2 text-sm text-foreground">{booking.extras}</p>
                  </div>
                )}
              </Section>
            </>
          )}

          {(booking.key_collection || booking.access || booking.parking_details) && (
            <>
              <Separator />
              <Section icon={<Key className="h-4 w-4 text-primary" />} title="Access & Parking">
                {booking.key_collection && (
                  <div>
                    <p className="text-xs text-muted-foreground">Key Collection</p>
                    <p className="rounded bg-muted/40 p-2 text-sm text-foreground">{booking.key_collection}</p>
                  </div>
                )}
                {booking.access && (
                  <div>
                    <p className="text-xs text-muted-foreground">Access Instructions</p>
                    <p className="rounded bg-muted/40 p-2 text-sm text-foreground">{booking.access}</p>
                  </div>
                )}
                {booking.parking_details && (
                  <div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Car className="h-3 w-3" /> Parking Details
                    </p>
                    <p className="rounded bg-muted/40 p-2 text-sm text-foreground">{booking.parking_details}</p>
                  </div>
                )}
              </Section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingDetailsSheet;
