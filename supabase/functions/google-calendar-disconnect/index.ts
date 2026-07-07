import {
  corsHeaders,
  decryptToken,
  errorResponse,
  getAuthenticatedUser,
  getCleanerIdForUser,
  jsonResponse,
} from '../_shared/googleCalendar.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, supabase } = await getAuthenticatedUser(req);
    const cleanerId = await getCleanerIdForUser(supabase, user.id);

    const { data: connection, error } = await supabase
      .from('cleaner_calendar_connections')
      .select('*')
      .eq('cleaner_id', cleanerId)
      .eq('provider', 'google')
      .maybeSingle();
    if (error) throw error;
    if (!connection) return jsonResponse({ disconnected: true });

    const accessToken = await decryptToken(connection.access_token_ciphertext);
    if (accessToken) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }).catch(() => null);
    }

    await supabase.from('cleaner_calendar_busy_blocks').delete().eq('connection_id', connection.id);
    await supabase
      .from('cleaner_calendar_connections')
      .update({
        status: 'disconnected',
        access_token_ciphertext: null,
        refresh_token_ciphertext: null,
        sync_token: null,
        channel_id: null,
        channel_resource_id: null,
        channel_expires_at: null,
      })
      .eq('id', connection.id);

    return jsonResponse({ disconnected: true });
  } catch (error) {
    return errorResponse(error);
  }
});
