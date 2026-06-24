import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Camera,
  Copy,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from 'lucide-react';
import PaymentStatusIndicator from '@/components/payments/PaymentStatusIndicator';
import { AuthorizeRemainingAmountDialog } from '@/components/payments/AuthorizeRemainingAmountDialog';
import DomesticBookingDetails from '@/components/bookings/DomesticBookingDetails';
import { useToast } from '@/hooks/use-toast';
import { BookingsListActionsMenu } from './BookingsListActionsMenu';
import type { Booking, BookingsListCardHandlers } from './types';
import { getCleanerName, useBookingsListLabels } from './useBookingsListLabels';

interface BookingsListCardProps {
  booking: Booking;
  customerSourceMap: Record<number, string>;
  customersWithPaymentMethods: Set<number>;
  handlers: BookingsListCardHandlers;
}

export function BookingsListCard({
  booking,
  customerSourceMap,
  customersWithPaymentMethods,
  handlers,
}: BookingsListCardProps) {
  const { toast } = useToast();
  const { getServiceTypeLabel, getServiceBadgeColor } = useBookingsListLabels();

  const isUnsigned = !booking.cleaner;
  const cleanerName = getCleanerName(booking);
  const isFlexibleTime = !booking.time_only;
  const bookingTime = isFlexibleTime
    ? '⏰ Flexible'
    : booking.date_time
      ? format(new Date(booking.date_time), 'HH:mm')
      : 'N/A';
  const bookingDate = booking.date_time ? format(new Date(booking.date_time), 'dd MMM') : 'N/A';
  const bookingWeekday = booking.date_time ? format(new Date(booking.date_time), 'EEE') : '';
  const serviceBadgeColor = getServiceBadgeColor(booking.service_type);
  const serviceLabel = getServiceTypeLabel(booking.service_type);

  return (
          <div
            key={booking.id} 
            className={`rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-200 border-none overflow-hidden ${
              booking.same_day
                ? 'bg-gradient-to-br from-orange-50 to-red-50'
                : 'bg-card'
            }`}
          >
            {/* Desktop Layout - 5 Equal Columns */}
            <div className="hidden lg:block">
                {/* Main Row */}
                <div className="flex items-stretch">
                  {/* Date/Time Box - Larger, more prominent */}
                  <div className="bg-primary/10 w-32 flex-shrink-0 flex items-center justify-center py-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{booking.date_time ? format(new Date(booking.date_time), 'EEEE') : ''}</div>
                      <div className="text-base font-semibold text-foreground">{booking.date_time ? format(new Date(booking.date_time), 'd MMMM') : 'N/A'}</div>
                      <div className={`text-2xl font-bold mt-1 ${isFlexibleTime ? 'text-orange-500' : 'text-primary'}`} title={isFlexibleTime ? 'Flexible arrival' : undefined}>
                        {bookingTime}
                      </div>
                      {booking.total_hours && (
                        <div className="text-sm font-bold text-primary/80 mt-0.5">
                          {booking.total_hours}h
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Content - 5 Equal Columns */}
                  <div className="flex-1 grid grid-cols-5 items-center py-3 min-w-0">
                    {/* Column 1: Customer Info */}
                    <div className="px-4">
                      <h3 className="text-base font-bold text-foreground truncate">
                        {booking.first_name} {booking.last_name}
                      </h3>
                      {/* Icons row - all same size (w-4 h-4) */}
                      <div className="flex items-center gap-2 mt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="p-1 hover:bg-accent rounded transition-colors">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{booking.phone_number}</span>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(booking.phone_number); toast({ title: "Copied" }); }}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="p-1 hover:bg-accent rounded transition-colors">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{booking.email}</span>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(booking.email); toast({ title: "Copied" }); }}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                        {customersWithPaymentMethods.has(booking.customer) && (
                          <span title="Card on file" className="p-1">
                            <CreditCard className="w-4 h-4 text-green-600" />
                          </span>
                        )}
                        {booking.has_photos && (
                          <span title="Has photos" className="p-1">
                            <Camera className="w-4 h-4 text-green-600" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Address - Multiple lines, same style */}
                    <div className="px-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm text-foreground leading-snug">{booking.address}</div>
                          <div className="text-sm text-foreground">{booking.postcode}</div>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Service Type + Frequency */}
                    <div className="px-4">
                      <Badge className={`${serviceBadgeColor} text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap`}>
                        {serviceLabel}
                      </Badge>
                      {booking.frequently && (
                        <div className="text-sm text-muted-foreground mt-1.5 capitalize">
                          {booking.frequently.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>

                    {/* Column 4: Cleaner + Pay */}
                    <div className="px-4">
                      {!isUnsigned ? (
                        <button onClick={() => handlers.onAssignCleaner(booking.id)} className="flex items-center gap-2 hover:bg-accent/50 rounded-lg p-1.5 -m-1.5 transition-colors">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-left min-w-0">
                            <div className="text-sm font-medium truncate">{cleanerName}</div>
                            {(booking.cleaner_pay || booking.sub_cleaners_total_pay) ? (
                              <div className="text-sm text-muted-foreground">£{((booking.cleaner_pay || 0) + (booking.sub_cleaners_total_pay || 0)).toFixed(2)}</div>
                            ) : null}
                          </div>
                          {(booking.sub_cleaners_count ?? 0) > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">+{booking.sub_cleaners_count}</Badge>
                          )}
                        </button>
                      ) : (
                        <button onClick={() => handlers.onAssignCleaner(booking.id)} className="hover:opacity-80">
                          <Badge variant="destructive" className="text-xs font-medium px-2.5 py-1">Unassigned</Badge>
                        </button>
                      )}
                    </div>

                    {/* Column 5: Payment & Cost */}
                    <div className="px-4 flex items-center gap-3">
                      <PaymentStatusIndicator 
                        status={booking.payment_status}
                        paymentMethod={booking.payment_method}
                        isClickable={true}
                        onClick={() => handlers.onPaymentAction(booking)}
                        size="sm"
                      />
                      <span className="text-xl font-bold text-primary">
                        £{booking.total_cost?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Actions - Green area */}
                  <div className="w-10 flex-shrink-0 bg-accent/20 flex items-center justify-center">
                    <BookingsListActionsMenu booking={booking} handlers={handlers} />
                  </div>
                </div>
              
              {/* Expandable Domestic Booking Details */}
              <DomesticBookingDetails
                propertyDetails={booking.property_details}
                additionalDetails={booking.additional_details}
                ovenSize={booking.oven_size}
                access={booking.access}
                frequently={booking.frequently}
                serviceType={booking.service_type}
                cleaningType={booking.cleaning_type}
                totalHours={booking.total_hours}
                recommendedHours={booking.recommended_hours}
                hoursRequired={booking.hours_required}
                ironingHours={booking.ironing_hours}
                customerSource={customerSourceMap[booking.customer] || null}
                onSourceClick={() => {
                  handlers.onSetSource(booking)
                }}
              />
              
              {/* Hidden */}
              <div className="hidden">
                <AuthorizeRemainingAmountDialog booking={booking} onSuccess={handlers.onRefresh} />
              </div>
            </div>

            {/* Mobile & Tablet Layout */}
            <div className="lg:hidden p-4 space-y-3 overflow-hidden">
              {/* Row 1: Time, Customer, Actions */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Time Box - Larger, more prominent */}
                  <div className="bg-primary/10 rounded-xl px-3 py-2.5 min-w-[80px] flex-shrink-0">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground font-semibold uppercase">{bookingWeekday}</div>
                      <div className="text-sm text-foreground font-semibold">{bookingDate}</div>
                      <div className={`text-xl font-bold ${isFlexibleTime ? 'text-orange-500' : 'text-primary'} mt-0.5`} title={isFlexibleTime ? 'Flexible arrival' : undefined}>
                        {bookingTime}
                      </div>
                      {booking.total_hours && (
                        <div className="text-xs font-bold text-primary/80">
                          {booking.total_hours}h
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Customer Name */}
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-foreground truncate">
                      {booking.first_name} {booking.last_name}
                    </h3>
                    {/* Icons row - all same size, under name */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 hover:bg-accent rounded-md transition-colors">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{booking.phone_number}</span>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(booking.phone_number); toast({ title: "Copied" }); }}>
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
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(booking.email); toast({ title: "Copied" }); }}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {customersWithPaymentMethods.has(booking.customer) && (
                        <span title="Card on file" className="p-1">
                          <CreditCard className="w-4 h-4 text-green-600" />
                        </span>
                      )}
                      {booking.has_photos && (
                        <span title="Has photos" className="p-1">
                          <Camera className="w-4 h-4 text-green-600" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Menu */}
                <BookingsListActionsMenu
                  booking={booking}
                  handlers={handlers}
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

              {/* Row 3: Service Badge & Cleaner - Clickable */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Service badge - just service type, no cleaning type */}
                <Badge className={`${serviceBadgeColor} text-xs px-2 py-1 rounded-full`}>
                  {serviceLabel}
                </Badge>
                
                {!isUnsigned ? (
                  <button 
                    onClick={() => handlers.onAssignCleaner(booking.id)}
                    className="flex items-center gap-2 text-sm hover:bg-accent/50 rounded-lg px-2 py-1 -ml-2 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-medium">{cleanerName}</span>
                    {(booking.sub_cleaners_count ?? 0) > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        +{booking.sub_cleaners_count}
                      </Badge>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handlers.onAssignCleaner(booking.id)}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Badge variant="destructive" className="text-xs px-2 py-1 cursor-pointer">
                      Unassigned
                    </Badge>
                  </button>
                )}
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
                  £{booking.total_cost?.toFixed(2) || '0.00'}
                </span>
              </div>
              
              {/* Domestic Booking Details Section - Mobile */}
              <DomesticBookingDetails
                propertyDetails={booking.property_details}
                additionalDetails={booking.additional_details}
                ovenSize={booking.oven_size}
                access={booking.access}
                frequently={booking.frequently}
                serviceType={booking.service_type}
                cleaningType={booking.cleaning_type}
                totalHours={booking.total_hours}
                recommendedHours={booking.recommended_hours}
                hoursRequired={booking.hours_required}
                ironingHours={booking.ironing_hours}
                customerSource={customerSourceMap[booking.customer] || null}
                onSourceClick={() => {
                  handlers.onSetSource(booking)
                }}
              />
            </div>
          </div>
  );
}
