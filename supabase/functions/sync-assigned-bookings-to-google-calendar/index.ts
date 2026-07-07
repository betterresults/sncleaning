import {
  corsHeaders,
  createOrUpdateBookingEvent,
  errorResponse,
  getSupabaseAdmin,
  jsonResponse,
} from '../_shared/googleCalendar.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json().catch(() => ({}));
    const nowIso = new Date().toISOString();
    const untilIso = new Date(Date.now() + Number(body.daysAhead ?? 90) * 24 * 60 * 60 * 1000).toISOString();

    const { data: connections, error: connectionError } = await supabase
      .from('cleaner_calendar_connections')
      .select('cleaner_id')
      .eq('provider', 'google')
      .eq('status', 'connected');
    if (connectionError) throw connectionError;

    const connectedCleanerIds = [...new Set((connections ?? []).map((row) => Number(row.cleaner_id)).filter(Boolean))];
    if (connectedCleanerIds.length === 0) return jsonResponse({ synced: 0, skipped: 'No connected cleaners' });

    const assignments = new Map<string, { bookingId: number; cleanerId: number }>();
    const addAssignment = (bookingId: unknown, cleanerId: unknown) => {
      const parsedBookingId = Number(bookingId);
      const parsedCleanerId = Number(cleanerId);
      if (!parsedBookingId || !parsedCleanerId || !connectedCleanerIds.includes(parsedCleanerId)) return;
      assignments.set(`${parsedBookingId}:${parsedCleanerId}`, {
        bookingId: parsedBookingId,
        cleanerId: parsedCleanerId,
      });
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
    for (const assignment of assignments.values()) {
      try {
        results.push({
          ...assignment,
          ...(await createOrUpdateBookingEvent(supabase, assignment.bookingId, assignment.cleanerId)),
        });
      } catch (error) {
        results.push({
          ...assignment,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return jsonResponse({
      synced: results.filter((result) => result.synced).length,
      total: results.length,
      results,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
