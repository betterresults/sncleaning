import {
  corsHeaders,
  createOrUpdateBookingEvent,
  errorResponse,
  getAuthenticatedUser,
  jsonResponse,
} from '../_shared/googleCalendar.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, supabase } = await getAuthenticatedUser(req);
    const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (role?.role !== 'admin') throw new Error('Admin access required');

    const { bookingId, cleanerId } = await req.json();
    if (!bookingId || !cleanerId) throw new Error('bookingId and cleanerId are required');

    return jsonResponse(await createOrUpdateBookingEvent(supabase, Number(bookingId), Number(cleanerId)));
  } catch (error) {
    return errorResponse(error);
  }
});
