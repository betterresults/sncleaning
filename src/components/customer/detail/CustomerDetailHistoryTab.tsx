import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import type { CustomerDetailHistoryTabProps } from './types';
import { formatUK, formatUKDate, formatUKTime, formatUKDateTime, formatUKLocaleDate, formatUKLocaleTime } from '@/lib/ukTime';

export function CustomerDetailHistoryTab({ bookings }: CustomerDetailHistoryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Booking History ({bookings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bookings.map((booking) => (
              <div key={booking.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatUKLocaleDate(booking.date_time)}
                      </span>
                      <Badge
                        variant={booking.payment_status === 'paid' ? 'default' : 'destructive'}
                      >
                        {booking.payment_status || 'unpaid'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {booking.cleaning_type} - {booking.address}
                    </p>
                  </div>
                  <div className="font-semibold">
                    £{parseFloat(booking.total_cost?.toString() || '0').toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">No booking history</div>
        )}
      </CardContent>
    </Card>
  );
}
