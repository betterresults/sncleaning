import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Copy, Mail, MapPin, Phone, User } from 'lucide-react';
import PaymentStatusIndicator from '@/components/payments/PaymentStatusIndicator';
import { useToast } from '@/hooks/use-toast';
import { PastBookingsListActionsMenu } from './PastBookingsListActionsMenu';
import type { PastBooking, PastBookingsListCardHandlers } from './types';
import { getPastCleanerName, usePastBookingsListLabels } from './usePastBookingsListLabels';
import { formatUK, formatUKDate, formatUKTime, formatUKDateTime, formatUKLocaleDate, formatUKLocaleTime } from '@/lib/ukTime';

interface PastBookingsListCardProps {
  booking: PastBooking;
  handlers: PastBookingsListCardHandlers;
}

export function PastBookingsListCard({ booking, handlers }: PastBookingsListCardProps) {
  const { toast } = useToast();
  const { getServiceTypeLabel, getCleaningTypeLabel, getServiceBadgeColor } = usePastBookingsListLabels();

  const isUnsigned = !booking.cleaner;
  const cleanerName = getPastCleanerName(booking);
  const timeFromTimeOnly = booking.time_only ? String(booking.time_only).slice(0, 5) : null;
  const timeFromDate = booking.date_time ? formatUK(booking.date_time, 'HH:mm') : null;
  const bookingTime = timeFromTimeOnly ?? timeFromDate ?? '—';
  const isTimeMissing = !timeFromTimeOnly && !timeFromDate;
  const bookingDate = booking.date_time ? formatUK(booking.date_time, 'dd MMM') : 'N/A';
  const serviceBadgeColor = getServiceBadgeColor(booking.service_type);
  const serviceLabel = getServiceTypeLabel(booking.service_type);
  const cleaningLabel = getCleaningTypeLabel(booking.cleaning_type);
  const isCancelled = booking.booking_status?.toLowerCase() === 'cancelled' || booking.booking_status?.toLowerCase() === 'canceled';

  return (
    <div
            className={`bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-200 border-none overflow-hidden ${isCancelled ? 'opacity-60 border-2 border-red-300' : ''}`}
          >
            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-[100px_1fr_2fr_15%_16%_15%_40px] items-center gap-3 p-0">
              {/* Time Box */}
              <div className="bg-primary/10 h-full flex items-center justify-center">
                <div className="text-center py-4">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{bookingDate}</div>
                  <div className={`text-2xl font-bold ${isTimeMissing ? 'text-orange-500' : 'text-primary'} mt-1`} title={isTimeMissing ? 'Time not recorded' : undefined}>
                    {bookingTime}
                  </div>
                  {booking.total_hours && (
                    <div className="text-sm font-semibold text-muted-foreground mt-1">
                      {booking.total_hours}h
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Name */}
              <div className="py-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {booking.first_name} {booking.last_name}
                  </h3>
                  {isCancelled && (
                    <Badge variant="destructive" className="text-xs font-medium px-2 py-0.5">
                      Cancelled
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="p-1 hover:bg-accent rounded-md transition-colors">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{booking.phone_number}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            navigator.clipboard.writeText(booking.phone_number);
                            toast({
                              title: "Copied",
                              description: "Phone number copied to clipboard",
                            });
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="p-1 hover:bg-accent rounded-md transition-colors">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{booking.email}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            navigator.clipboard.writeText(booking.email);
                            toast({
                              title: "Copied",
                              description: "Email copied to clipboard",
                            });
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Address */}
              <div className="py-4 min-w-0">
                <div className="flex items-start gap-1.5 text-base text-foreground">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  <div className="leading-tight min-w-0">
                    <div className="font-medium truncate">{booking.address}</div>
                    <div className="font-medium truncate">{booking.postcode}</div>
                  </div>
                </div>
              </div>

              {/* Service Type Badge */}
              <div className="py-4">
                <Badge className={`${serviceBadgeColor} text-sm font-medium px-3 py-1.5 rounded-full flex flex-col items-center`}>
                  <span>{serviceLabel}</span>
                  <span className="text-xs italic font-normal mt-0.5">{cleaningLabel}</span>
                </Badge>
              </div>

              {/* Cleaner Info - Clickable */}
              <div className="py-4">
                <button
                  onClick={() => handlers.onAssignCleaner(booking.id)}
                  className="w-full text-left hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors cursor-pointer"
                  title="Click to assign/change cleaner and pay"
                >
                  {!isUnsigned ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium truncate hover:text-primary">{cleanerName}</span>
                      </div>
                      {booking.cleaner_pay && (
                        <p className="text-sm font-medium text-muted-foreground pl-9">
                          £{booking.cleaner_pay.toFixed(2)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Badge variant="destructive" className="text-sm font-medium px-3 py-1.5">
                      Unassigned
                    </Badge>
                  )}
                </button>
              </div>

              {/* Payment Status & Total Cost */}
              <div className="py-4 flex items-center justify-end gap-2 pr-2">
                <PaymentStatusIndicator 
                  status={booking.payment_status}
                  paymentMethod={booking.payment_method}
                  isClickable={true}
                  onClick={() => handlers.onPaymentAction(booking)}
                  size="md"
                />
                <span className="text-2xl font-bold" style={{ color: '#18A5A5' }}>
                  £{parseFloat(booking.total_cost || '0').toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div className="bg-accent/30 h-full flex items-center justify-center">
                <PastBookingsListActionsMenu booking={booking} handlers={handlers} />
              </div>
            </div>

            {/* Mobile & Tablet Layout */}
            <div className="lg:hidden p-4 space-y-3">
              {/* Row 1: Time, Customer, Actions */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Time Box - Compact */}
                  <div className="bg-primary/10 rounded-xl px-3 py-2 min-w-[70px]">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground font-medium">{bookingDate}</div>
                      <div className="text-lg font-bold text-primary">{bookingTime}</div>
                      {booking.total_hours && (
                        <div className="text-xs font-semibold text-muted-foreground">
                          {booking.total_hours}h
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Customer Name */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        {booking.first_name} {booking.last_name}
                      </h3>
                      {isCancelled && (
                        <Badge variant="destructive" className="text-xs font-medium px-2 py-0.5">
                          Cancelled
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 hover:bg-accent rounded-md transition-colors">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{booking.phone_number}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(booking.phone_number);
                                toast({
                                  title: "Copied",
                                  description: "Phone number copied to clipboard",
                                });
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 hover:bg-accent rounded-md transition-colors">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{booking.email}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(booking.email);
                                toast({
                                  title: "Copied",
                                  description: "Email copied to clipboard",
                                });
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Actions Menu */}
                <PastBookingsListActionsMenu
                  booking={booking}
                  handlers={handlers}
                  triggerClassName="h-8 w-8 p-0"
                  iconClassName="h-4 w-4"
                />
              </div>

              {/* Row 2: Address */}
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium">{booking.address}</div>
                  <div className="text-muted-foreground">{booking.postcode}</div>
                </div>
              </div>

              {/* Row 3: Service Badge & Cleaner */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`${serviceBadgeColor} text-xs px-2 py-1 rounded-full`}>
                  {serviceLabel} - {cleaningLabel}
                </Badge>
                
                <button
                  onClick={() => handlers.onAssignCleaner(booking.id)}
                  className="hover:bg-accent/50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                  title="Click to assign/change cleaner and pay"
                >
                  {!isUnsigned ? (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-medium hover:text-primary">{cleanerName}</span>
                      {booking.cleaner_pay && (
                        <span className="text-xs text-muted-foreground">
                          £{booking.cleaner_pay.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Badge variant="destructive" className="text-xs px-2 py-1">
                      Unassigned
                    </Badge>
                  )}
                </button>
              </div>

              {/* Row 4: Payment & Cost */}
              <div className="flex items-center justify-between pt-2 border-t">
                <PaymentStatusIndicator 
                  status={booking.payment_status}
                  paymentMethod={booking.payment_method}
                  isClickable={true}
                  onClick={() => handlers.onPaymentAction(booking)}
                  size="sm"
                />
                <span className="text-xl font-bold" style={{ color: '#18A5A5' }}>
                  £{parseFloat(booking.total_cost || '0').toFixed(2)}
                </span>
              </div>
            </div>
    </div>
  );
}
