import {
  corsHeaders,
  encryptToken,
  errorResponse,
  exchangeCodeForToken,
  getSupabaseAdmin,
  syncGoogleCalendarConnection,
  verifyOAuthState,
} from '../_shared/googleCalendar.ts';

const redirect = (url: string) => Response.redirect(url, 302);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const siteUrl = Deno.env.get('SITE_URL') ?? Deno.env.get('PUBLIC_SITE_URL') ?? 'http://localhost:8080';
  const fallback = `${siteUrl}/cleaner-availability`;

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const oauthError = url.searchParams.get('error');

    if (oauthError) return redirect(`${fallback}?google_calendar=error&reason=${encodeURIComponent(oauthError)}`);
    if (!code || !state) throw new Error('Missing Google OAuth callback parameters');

    const payload = await verifyOAuthState(state);
    const tokens = await exchangeCodeForToken(code);
    if (!tokens.refresh_token) {
      throw new Error('Google did not return a refresh token. Disconnect the app in Google and try again.');
    }

    const supabase = getSupabaseAdmin();
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    const { data: connection, error } = await supabase
      .from('cleaner_calendar_connections')
      .upsert(
        {
          cleaner_id: payload.cleanerId,
          provider: 'google',
          google_calendar_id: 'primary',
          access_token_ciphertext: await encryptToken(tokens.access_token),
          refresh_token_ciphertext: await encryptToken(tokens.refresh_token),
          token_expires_at: expiresAt,
          scopes: tokens.scope ? tokens.scope.split(' ') : [],
          status: 'connected',
          last_error: null,
        },
        { onConflict: 'cleaner_id,provider' },
      )
      .select('id')
      .single();

    if (error) throw error;

    await syncGoogleCalendarConnection(supabase, connection.id);

    const returnTo = payload.returnTo?.startsWith('/') ? payload.returnTo : '/cleaner-availability';
    return redirect(`${siteUrl}${returnTo}?google_calendar=connected`);
  } catch (error) {
    console.error('google-calendar-callback error', error);
    return redirect(`${fallback}?google_calendar=error&reason=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`);
  }
});
