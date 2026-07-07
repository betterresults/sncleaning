import {
  corsHeaders,
  errorResponse,
  getAuthenticatedUser,
  getCleanerIdForUser,
  jsonResponse,
  syncAllActiveConnections,
  syncGoogleCalendarConnection,
} from '../_shared/googleCalendar.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, supabase } = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));

    if (body.syncAll === true) {
      const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
      if (role?.role !== 'admin') throw new Error('Admin access required');
      return jsonResponse({ results: await syncAllActiveConnections(supabase) });
    }

    const cleanerId = await getCleanerIdForUser(supabase, user.id);
    const { data: connection, error } = await supabase
      .from('cleaner_calendar_connections')
      .select('id')
      .eq('cleaner_id', cleanerId)
      .eq('provider', 'google')
      .maybeSingle();

    if (error) throw error;
    if (!connection) return jsonResponse({ synced: 0, skipped: 'No connected Google Calendar' });

    const result = await syncGoogleCalendarConnection(supabase, connection.id);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
