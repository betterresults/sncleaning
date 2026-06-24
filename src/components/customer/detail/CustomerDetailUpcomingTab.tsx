import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import type { CustomerDetailUpcomingTabProps } from './types';

export function CustomerDetailUpcomingTab({ bookings }: CustomerDetailUpcomingTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Bookings ({bookings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(booking.date_time).toLocaleDateString('en-GB')} at{' '}
                        {new Date(booking.date_time).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <Badge variant="outline">{booking.booking_status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {booking.cleaning_type} - {booking.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cleaner: {booking.cleaner_name}
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
          <div className="text-center py-4 text-muted-foreground">No upcoming bookings</div>
        )}
      </CardContent>
    </Card>
  );
}
