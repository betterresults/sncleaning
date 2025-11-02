import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AffectedBooking {
  id: number;
  date_time: string;
  address: string;
  cleaner_name: string;
}

interface UpdateBookingsCleanerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringServiceId: string;
  oldCleanerId: string | null;
  newCleanerId: string;
  newCleanerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function UpdateBookingsCleanerDialog({
  open,
  onOpenChange,
  recurringServiceId,
  oldCleanerId,
  newCleanerId,
  newCleanerName,
  onConfirm,
  onCancel,
}: UpdateBookingsCleanerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [affectedBookings, setAffectedBookings] = useState<AffectedBooking[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open && oldCleanerId && newCleanerId !== oldCleanerId) {
      fetchAffectedBookings();
    }
  }, [open, oldCleanerId, newCleanerId, recurringServiceId]);

  const fetchAffectedBookings = async () => {
    setLoading(true);
    try {
      // Get the recurring_group_id from the recurring service
      const { data: recurringService, error: recurringError } = await supabase
        .from('recurring_services')
        .select('recurring_group_id')
        .eq('id', parseInt(recurringServiceId))
        .maybeSingle();

      if (recurringError) throw recurringError;

      if (!recurringService?.recurring_group_id) {
        setAffectedBookings([]);
        setLoading(false);
        return;
      }

      // Find ALL upcoming bookings from this recurring group
      const now = new Date().toISOString();
      const { data: allBookings, error: allBookingsError } = await supabase
        .from('bookings')
        .select('id, date_time, address, cleaner')
        .eq('recurring_group_id', recurringService.recurring_group_id)
        .gte('date_time', now)
        .order('date_time', { ascending: true });

      if (allBookingsError) throw allBookingsError;

      // Filter bookings that have a cleaner different from the new one
      const bookingsWithDifferentCleaner = allBookings?.filter(
        (booking: any) => booking.cleaner && booking.cleaner !== parseInt(newCleanerId)
      ) || [];

      if (bookingsWithDifferentCleaner.length === 0) {
        setAffectedBookings([]);
        setLoading(false);
        return;
      }

      // Get cleaner details for these bookings
      const cleanerIds = [...new Set(bookingsWithDifferentCleaner.map((b: any) => b.cleaner))];
      const { data: cleaners, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name')
        .in('id', cleanerIds);

      if (cleanersError) throw cleanersError;

      const cleanerMap = new Map(cleaners?.map(c => [c.id, `${c.first_name} ${c.last_name}`]));

      const formatted = bookingsWithDifferentCleaner.map((booking: any) => ({
        id: booking.id,
        date_time: booking.date_time,
        address: booking.address,
        cleaner_name: cleanerMap.get(booking.cleaner) || 'Unknown',
      }));

      setAffectedBookings(formatted);
    } catch (error) {
      console.error('Error fetching affected bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to check for affected bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookings = async () => {
    setUpdating(true);
    try {
      // Get the new cleaner's rate to update cleaner_rate in bookings
      const { data: newCleaner, error: cleanerError } = await supabase
        .from('cleaners')
        .select('hourly_rate')
        .eq('id', parseInt(newCleanerId))
        .single();

      if (cleanerError) throw cleanerError;

      // Update all affected bookings
      const bookingIds = affectedBookings.map(b => b.id);
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          cleaner: parseInt(newCleanerId),
          cleaner_rate: newCleaner.hourly_rate 
        })
        .in('id', bookingIds);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: `Updated ${affectedBookings.length} upcoming booking${affectedBookings.length > 1 ? 's' : ''} with the new cleaner`,
      });

      onOpenChange(false);
      onConfirm();
    } catch (error) {
      console.error('Error updating bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bookings',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  // If no affected bookings, just close and proceed
  if (!loading && affectedBookings.length === 0) {
    if (open) {
      onConfirm();
    }
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Update Existing Bookings?</AlertDialogTitle>
          <AlertDialogDescription>
            {loading ? (
              <div className="py-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Checking for affected bookings...</p>
              </div>
            ) : (
              <>
                <p className="mb-4">
                  Found {affectedBookings.length} upcoming booking{affectedBookings.length > 1 ? 's' : ''} 
                  {' '}with a different cleaner. Would you like to update {affectedBookings.length > 1 ? 'them' : 'it'} to <strong>{newCleanerName}</strong>?
                </p>
                <div className="bg-muted p-4 rounded-md max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {affectedBookings.map((booking) => (
                      <div key={booking.id} className="text-sm border-b border-border pb-2 last:border-0">
                        <div className="font-medium">
                          {format(new Date(booking.date_time), 'PPP p')}
                        </div>
                        <div className="text-muted-foreground">{booking.address}</div>
                        <div className="text-xs text-muted-foreground">
                          Current cleaner: {booking.cleaner_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!loading && (
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={updating}
              onClick={() => {
                onOpenChange(false);
                onCancel();
              }}
            >
              No, Keep Current Cleaners
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateBookings} disabled={updating}>
              {updating ? 'Updating...' : 'Yes, Update All Bookings'}
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
