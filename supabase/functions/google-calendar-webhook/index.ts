import {
  corsHeaders,
  errorResponse,
  getSupabaseAdmin,
  jsonResponse,
  syncAllActiveConnections,
  syncGoogleCalendarConnection,
} from '../_shared/googleCalendar.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = getSupabaseAdmin();
    const channelId = req.headers.get('x-goog-channel-id');
    const resourceId = req.headers.get('x-goog-resource-id');

    if (channelId && resourceId) {
      const { data: connection, error } = await supabase
        .from('cleaner_calendar_connections')
        .select('id')
        .eq('channel_id', channelId)
        .eq('channel_resource_id', resourceId)
        .maybeSingle();
      if (error) throw error;
      if (connection) return jsonResponse(await syncGoogleCalendarConnection(supabase, connection.id));
    }

    return jsonResponse({ results: await syncAllActiveConnections(supabase) });
  } catch (error) {
    return errorResponse(error);
  }
});
