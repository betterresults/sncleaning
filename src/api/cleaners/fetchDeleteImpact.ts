import { supabase } from '@/integrations/supabase/client';

export interface CleanerDeleteImpact {
  upcomingBookings: number;
  pastBookings: number;
  payments: number;
  photos: number;
  recurringServices: number;
  hasLoginAccount: boolean;
  loginEmail: string | null;
}

/** Counts rows that block or accompany deleting a cleaner profile. */
export async function fetchCleanerDeleteImpact(
  cleanerId: number
): Promise<CleanerDeleteImpact> {
  // Note: `booking_cleaners` was renamed to `cleaner_payments` — do not query the old name.
  const [
    upcomingRes,
    pastRes,
    paymentsRes,
    photosRes,
    recurringRes,
    profileRes,
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('cleaner', cleanerId),
    supabase
      .from('past_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('cleaner', cleanerId),
    supabase
      .from('cleaner_payments')
      .select('*', { count: 'exact', head: true })
      .eq('cleaner_id', cleanerId),
    supabase
      .from('cleaning_photos')
      .select('*', { count: 'exact', head: true })
      .eq('cleaner_id', cleanerId),
    supabase
      .from('recurring_services')
      .select('*', { count: 'exact', head: true })
      .eq('cleaner', cleanerId),
    supabase
      .from('profiles')
      .select('user_id, email')
      .eq('cleaner_id', cleanerId)
      .maybeSingle(),
  ]);

  const errors = [
    upcomingRes.error,
    pastRes.error,
    paymentsRes.error,
    photosRes.error,
    recurringRes.error,
    profileRes.error,
  ].filter(Boolean);
  if (errors.length > 0) {
    throw errors[0];
  }

  return {
    upcomingBookings: upcomingRes.count || 0,
    pastBookings: pastRes.count || 0,
    payments: paymentsRes.count || 0,
    photos: photosRes.count || 0,
    recurringServices: recurringRes.count || 0,
    hasLoginAccount: !!profileRes.data?.user_id,
    loginEmail: profileRes.data?.email ?? null,
  };
}

/** True when FK NO ACTION rows would block `cleaners` delete. */
export function cleanerDeleteIsBlocked(impact: CleanerDeleteImpact): boolean {
  return (
    impact.upcomingBookings > 0 ||
    impact.pastBookings > 0 ||
    impact.payments > 0 ||
    impact.photos > 0 ||
    impact.recurringServices > 0
  );
}
