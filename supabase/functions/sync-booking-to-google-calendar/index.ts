import {
  corsHeaders,
  createOrUpdateBookingEvent,
  deleteAllBookingCalendarEvents,
  deleteBookingCalendarEvent,
  errorResponse,
  getAuthenticatedUser,
  jsonResponse,
  syncBookingCalendarEvents,
} from '../_shared/googleCalendar.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, supabase } = await getAuthenticatedUser(req);
    const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();

    const { bookingId, cleanerId, action } = await req.json();
    if (!bookingId) throw new Error('bookingId is required');

    if (role?.role !== 'admin') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('cleaner_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profileError) throw profileError;

      const ownsCleanerEvent = cleanerId && Number(profile?.cleaner_id) === Number(cleanerId);
      if (action !== 'delete' || !ownsCleanerEvent) throw new Error('Admin access required');
    }

    if (action === 'delete') {
      if (cleanerId) {
        return jsonResponse(await deleteBookingCalendarEvent(supabase, Number(bookingId), Number(cleanerId)));
      }
      return jsonResponse(await deleteAllBookingCalendarEvents(supabase, Number(bookingId)));
    }

    if (cleanerId) {
      return jsonResponse(await createOrUpdateBookingEvent(supabase, Number(bookingId), Number(cleanerId)));
    }

    return jsonResponse(await syncBookingCalendarEvents(supabase, Number(bookingId)));
  } catch (error) {
    return errorResponse(error);
  }
});
