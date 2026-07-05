import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CustomerLookupResult } from '../types';
import { formatUK, formatUKDate, formatUKTime, formatUKDateTime, formatUKLocaleDate, formatUKLocaleTime } from '@/lib/ukTime';

interface CustomerLookupContentProps {
  lookupResult: CustomerLookupResult;
}

export function CustomerLookupContent({ lookupResult }: CustomerLookupContentProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {lookupResult.customer ? (
        <div className="rounded-lg border bg-muted/30 p-4">
          <h4 className="mb-3 flex items-center gap-2 font-semibold">
            <User className="h-4 w-4" />
            Customer Found
          </h4>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Name:</strong>{' '}
              {lookupResult.customer.full_name ||
                `${lookupResult.customer.first_name || ''} ${lookupResult.customer.last_name || ''}`.trim() ||
                'N/A'}
            </p>
            <p>
              <strong>Email:</strong> {lookupResult.customer.email || 'N/A'}
            </p>
            <p>
              <strong>Phone:</strong> {lookupResult.customer.phone || 'N/A'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigate(`/admin-customers?id=${lookupResult.customer?.id}`)}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              View Customer
            </Button>
          </div>
        </div>
      ) : lookupResult.quoteLead ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
            <User className="h-4 w-4" />
            Quote Lead Found
          </h4>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Name:</strong>{' '}
              {`${lookupResult.quoteLead.first_name || ''} ${lookupResult.quoteLead.last_name || ''}`.trim() ||
                'N/A'}
            </p>
            <p>
              <strong>Email:</strong> {lookupResult.quoteLead.email || 'N/A'}
            </p>
            <p>
              <strong>Phone:</strong> {lookupResult.quoteLead.phone || 'N/A'}
            </p>
            {lookupResult.quoteLead.address && (
              <p>
                <strong>Address:</strong> {lookupResult.quoteLead.address},{' '}
                {lookupResult.quoteLead.postcode}
              </p>
            )}
            <div className="mt-3 border-t border-amber-200 pt-3 dark:border-amber-800">
              <p className="mb-2 text-xs text-muted-foreground">Quote Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="font-medium">{lookupResult.quoteLead.service_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Frequency</p>
                  <p className="font-medium">{lookupResult.quoteLead.frequency || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hours</p>
                  <p className="font-medium">{lookupResult.quoteLead.recommended_hours || 'N/A'}h</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quote</p>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    £{lookupResult.quoteLead.calculated_quote?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>
              {lookupResult.quoteLead.selected_date && (
                <p className="mt-2 text-sm">
                  <strong>Preferred Date:</strong>{' '}
                  {format(new Date(lookupResult.quoteLead.selected_date), 'EEE, dd MMM yyyy')}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant={
                    lookupResult.quoteLead.status === 'converted' ? 'default' : 'secondary'
                  }
                >
                  {lookupResult.quoteLead.status || 'pending'}
                </Badge>
                {lookupResult.quoteLead.created_at && (
                  <span className="text-xs text-muted-foreground">
                    Created {format(new Date(lookupResult.quoteLead.created_at), 'dd MMM yyyy')}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigate('/admin-dashboard?tab=leads')}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              View Quote Leads
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/20 p-4">
          <p className="text-center text-sm text-muted-foreground">
            No customer or quote lead found with this phone number
          </p>
        </div>
      )}

      <div>
        <h4 className="mb-3 flex items-center gap-2 font-semibold">
          <Calendar className="h-4 w-4" />
          Booking History ({lookupResult.bookings.length})
        </h4>

        {lookupResult.bookings.length > 0 ? (
          <div className="space-y-3">
            {lookupResult.bookings.map((booking) => (
              <div key={booking.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          booking.booking_status === 'completed'
                            ? 'default'
                            : booking.booking_status === 'active'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {booking.booking_status || 'Unknown'}
                      </Badge>
                      <span className="text-sm font-medium">
                        {booking.service_type || 'Cleaning'}
                      </span>
                    </div>

                    {booking.date_time && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatUK(booking.date_time, 'EEE, dd MMM yyyy HH:mm')}
                      </p>
                    )}

                    {(booking.address || booking.postcode) && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[booking.address, booking.postcode].filter(Boolean).join(', ')}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-4 text-sm">
                      {booking.total_hours && <span>{booking.total_hours}h</span>}
                      {booking.total_cost && (
                        <span className="font-medium">£{booking.total_cost}</span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => navigate(`/admin-bookings?booking=${booking.id}`)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/20 p-4">
            <p className="text-center text-sm text-muted-foreground">
              No bookings found for this number
            </p>
          </div>
        )}
      </div>

      <div>
        <h4 className="mb-3 flex items-center gap-2 font-semibold">
          <MessageCircle className="h-4 w-4" />
          SMS History ({lookupResult.smsConversations.length})
        </h4>

        {lookupResult.smsConversations.length > 0 ? (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {lookupResult.smsConversations.map((sms) => (
              <div
                key={sms.id}
                className={`rounded-lg p-2 text-sm ${
                  sms.direction === 'outgoing'
                    ? 'ml-4 bg-shell-stat-brand-bg'
                    : 'mr-4 bg-black/[0.05]'
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">
                    {sms.direction === 'outgoing' ? 'Sent' : 'Received'}
                  </span>
                  <span>•</span>
                  <span>{format(new Date(sms.created_at), 'dd MMM yyyy HH:mm')}</span>
                  {sms.direction === 'outgoing' && (
                    <>
                      <span>•</span>
                      <span className={sms.status === 'delivered' ? 'text-green-600' : ''}>
                        {sms.status}
                      </span>
                    </>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words">{sms.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/20 p-4">
            <p className="text-center text-sm text-muted-foreground">No SMS history found</p>
          </div>
        )}
      </div>

      <div>
        <h4 className="mb-3 flex items-center gap-2 font-semibold">
          <Mail className="h-4 w-4" />
          Email History ({lookupResult.emails.length})
        </h4>

        {lookupResult.emails.length > 0 ? (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {lookupResult.emails.map((email) => (
              <div key={email.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{email.subject}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(email.created_at), 'dd MMM yyyy HH:mm')}</span>
                      <span>•</span>
                      <Badge
                        variant={
                          email.status === 'sent' || email.status === 'delivered'
                            ? 'default'
                            : email.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="text-xs"
                      >
                        {email.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/20 p-4">
            <p className="text-center text-sm text-muted-foreground">No email history found</p>
          </div>
        )}
      </div>
    </div>
  );
}
