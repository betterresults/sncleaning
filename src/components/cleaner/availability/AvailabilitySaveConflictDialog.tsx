import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CleanerUpcomingBooking } from '@/hooks/useCleanerUpcomingBookings';
import { formatBookingDay, formatBookingTime, getBookingEnd } from './availabilityUtils';

interface AvailabilitySaveConflictDialogProps {
  open: boolean;
  conflicts: CleanerUpcomingBooking[];
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const AvailabilitySaveConflictDialog: React.FC<AvailabilitySaveConflictDialogProps> = ({
  open,
  conflicts,
  isSaving,
  onCancel,
  onConfirm,
}) => {
  const count = conflicts.length;
  const preview = conflicts.slice(0, 3);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save with scheduling conflicts?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                {count} booked {count === 1 ? 'job' : 'jobs'} in the next 2 weeks fall outside the hours you&apos;re
                about to save. You can still save, but those jobs won&apos;t match your new weekly template.
              </p>
              {preview.length > 0 && (
                <ul className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-amber-900">
                  {preview.map((booking) => {
                    const end = getBookingEnd(booking);
                    const customerName =
                      [booking.first_name, booking.last_name].filter(Boolean).join(' ') || 'Customer';
                    const service = booking.service_type || booking.cleaning_type || 'Cleaning';

                    return (
                      <li key={booking.id} className="text-xs">
                        <span className="font-medium">
                          {formatBookingDay(booking.date_time)} · {formatBookingTime(booking.date_time)}
                          {end ? ` – ${formatBookingTime(end.toISOString())}` : ''}
                        </span>
                        <span className="text-amber-800/80">
                          {' '}
                          · {service} · {customerName}
                        </span>
                      </li>
                    );
                  })}
                  {count > preview.length && (
                    <li className="text-xs font-medium text-amber-800/80">+ {count - preview.length} more</li>
                  )}
                </ul>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isSaving}>
            Keep editing
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save anyway'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AvailabilitySaveConflictDialog;
