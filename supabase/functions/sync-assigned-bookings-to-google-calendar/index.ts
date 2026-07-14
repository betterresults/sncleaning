import {
  corsHeaders,
  errorResponse,
  getSupabaseAdmin,
  jsonResponse,
  syncBookingCalendarEvents,
} from '../_shared/googleCalendar.ts';
import {
  bookingStoredIsoDaysFromNow,
  nowAsBookingStoredIso,
} from '../_shared/ukBookingTime.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json().catch(() => ({}));
    // Compare against naive-London `date_time`, not real UTC `now` (BST skew).
    const nowIso = nowAsBookingStoredIso();
    const untilIso = bookingStoredIsoDaysFromNow(Number(body.daysAhead ?? 90));

    const { data: connections, error: connectionError } = await supabase
      .from('cleaner_calendar_connections')
      .select('cleaner_id')
      .eq('provider', 'google')
      .eq('status', 'connected');
    if (connectionError) throw connectionError;

    const connectedCleanerIds = [...new Set((connections ?? []).map((row) => Number(row.cleaner_id)).filter(Boolean))];
    if (connectedCleanerIds.length === 0) return jsonResponse({ synced: 0, skipped: 'No connected cleaners' });

    const bookingIds = new Set<number>();
    const addAssignment = (bookingId: unknown, cleanerId: unknown) => {
      const parsedBookingId = Number(bookingId);
      const parsedCleanerId = Number(cleanerId);
      if (!parsedBookingId || !parsedCleanerId || !connectedCleanerIds.includes(parsedCleanerId)) return;
      bookingIds.add(parsedBookingId);
    };

    const { data: primaryBookings, error: primaryError } = await supabase
      .from('bookings')
      .select('id, cleaner')
      .in('cleaner', connectedCleanerIds)
      .not('date_time', 'is', null)
      .gte('date_time', nowIso)
      .lte('date_time', untilIso);
    if (primaryError) throw primaryError;
    (primaryBookings ?? []).forEach((booking) => addAssignment(booking.id, booking.cleaner));

    const { data: paymentAssignments, error: paymentError } = await supabase
      .from('cleaner_payments')
      .select('booking_id, cleaner_id')
      .in('cleaner_id', connectedCleanerIds);
    if (paymentError) throw paymentError;

    const paymentBookingIds = [...new Set((paymentAssignments ?? []).map((row) => Number(row.booking_id)).filter(Boolean))];
    if (paymentBookingIds.length > 0) {
      const { data: assignedBookings, error: assignedBookingError } = await supabase
        .from('bookings')
        .select('id, date_time')
        .in('id', paymentBookingIds)
        .not('date_time', 'is', null)
        .gte('date_time', nowIso)
        .lte('date_time', untilIso);
      if (assignedBookingError) throw assignedBookingError;

      const eligibleBookingIds = new Set((assignedBookings ?? []).map((booking) => Number(booking.id)));
      (paymentAssignments ?? []).forEach((assignment) => {
        if (eligibleBookingIds.has(Number(assignment.booking_id))) {
          addAssignment(assignment.booking_id, assignment.cleaner_id);
        }
      });
    }

    const results = [];
    for (const bookingId of bookingIds) {
      try {
        results.push({
          bookingId,
          ...(await syncBookingCalendarEvents(supabase, bookingId)),
        });
      } catch (error) {
        results.push({
          bookingId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return jsonResponse({
      synced: results.reduce((total, result) => total + Number(result.synced ?? 0), 0),
      deleted: results.reduce((total, result) => total + Number(result.deleted ?? 0), 0),
      total: results.length,
      results,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
