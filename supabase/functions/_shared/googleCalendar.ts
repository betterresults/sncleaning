import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });

export const errorResponse = (error: unknown, status = 500) => {
  const message = error instanceof Error ? error.message : String(error);
  return jsonResponse({ error: message }, { status });
};

export const getSupabaseAdmin = () =>
  createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

export const getAuthenticatedUser = async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing authorization header');

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (error || !data.user) throw new Error('Unauthorized');
  return { user: data.user, supabase };
};

export const getCleanerIdForUser = async (supabase: ReturnType<typeof getSupabaseAdmin>, userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('cleaner_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.cleaner_id) throw new Error('No cleaner profile linked to this account');
  return Number(data.cleaner_id);
};

const encoder = new TextEncoder();

const base64UrlEncode = (value: Uint8Array | string) => {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const base64UrlDecode = (value: string) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const importHmacKey = async () =>
  crypto.subtle.importKey(
    'raw',
    encoder.encode(Deno.env.get('GOOGLE_OAUTH_STATE_SECRET') ?? ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );

export const createOAuthState = async (payload: { userId: string; cleanerId: number; returnTo?: string }) => {
  const secret = Deno.env.get('GOOGLE_OAUTH_STATE_SECRET');
  if (!secret) throw new Error('GOOGLE_OAUTH_STATE_SECRET is not configured');

  const statePayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 10 * 60,
    nonce: crypto.randomUUID(),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(statePayload));
  const signature = await crypto.subtle.sign('HMAC', await importHmacKey(), encoder.encode(encodedPayload));
  return `${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
};

export const verifyOAuthState = async (state: string) => {
  const [encodedPayload, encodedSignature] = state.split('.');
  if (!encodedPayload || !encodedSignature) throw new Error('Invalid OAuth state');

  const valid = await crypto.subtle.verify(
    'HMAC',
    await importHmacKey(),
    base64UrlDecode(encodedSignature),
    encoder.encode(encodedPayload),
  );
  if (!valid) throw new Error('Invalid OAuth state signature');

  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload))) as {
    userId: string;
    cleanerId: number;
    returnTo?: string;
    exp: number;
  };
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('OAuth state has expired');
  return payload;
};

const getRedirectUri = () => {
  const redirectUri = Deno.env.get('GOOGLE_CALENDAR_REDIRECT_URI');
  if (!redirectUri) throw new Error('GOOGLE_CALENDAR_REDIRECT_URI is not configured');
  return redirectUri;
};

export const buildGoogleAuthUrl = async (state: string) => {
  const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
  if (!clientId) throw new Error('GOOGLE_CALENDAR_CLIENT_ID is not configured');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string) => {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET') ?? '',
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  const body = await response.json();
  if (!response.ok) throw new Error(body.error_description || body.error || 'Failed to exchange Google code');
  return body as GoogleTokenResponse;
};

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

interface CalendarConnection {
  id: string;
  access_token_ciphertext: string | null;
  refresh_token_ciphertext: string | null;
  token_expires_at: string | null;
  google_calendar_id: string | null;
  channel_id: string | null;
  channel_resource_id: string | null;
  channel_expires_at: string | null;
}

const importAesKey = async () => {
  const raw = Deno.env.get('GOOGLE_TOKEN_ENCRYPTION_KEY');
  if (!raw) throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY is not configured');
  const bytes = Uint8Array.from(atob(raw), (char) => char.charCodeAt(0));
  if (![16, 24, 32].includes(bytes.byteLength)) {
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY must be base64 encoded 16, 24, or 32 bytes');
  }
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
};

export const encryptToken = async (token: string | null | undefined) => {
  if (!token) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await importAesKey(), encoder.encode(token));
  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(ciphertext))}`;
};

export const decryptToken = async (packed: string | null | undefined) => {
  if (!packed) return null;
  const [iv, ciphertext] = packed.split('.');
  if (!iv || !ciphertext) throw new Error('Invalid encrypted token');
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64UrlDecode(iv) },
    await importAesKey(),
    base64UrlDecode(ciphertext),
  );
  return new TextDecoder().decode(plaintext);
};

export const refreshAccessToken = async (refreshToken: string) => {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET') ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error_description || body.error || 'Failed to refresh Google token');
  return body as GoogleTokenResponse;
};

const getConnection = async (supabase: ReturnType<typeof getSupabaseAdmin>, connectionId: string) => {
  const { data, error } = await supabase
    .from('cleaner_calendar_connections')
    .select('*')
    .eq('id', connectionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Calendar connection not found');
  return data;
};

export const getValidAccessToken = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  connection: CalendarConnection,
) => {
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
  const existingAccessToken = await decryptToken(connection.access_token_ciphertext);

  if (existingAccessToken && expiresAt > Date.now() + 60_000) return existingAccessToken;

  const refreshToken = await decryptToken(connection.refresh_token_ciphertext);
  if (!refreshToken) throw new Error('Missing Google refresh token');

  const refreshed = await refreshAccessToken(refreshToken);
  await supabase
    .from('cleaner_calendar_connections')
    .update({
      access_token_ciphertext: await encryptToken(refreshed.access_token),
      token_expires_at: refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        : null,
      last_error: null,
      status: 'connected',
    })
    .eq('id', connection.id);

  return refreshed.access_token;
};

export const ensureGoogleWatchChannel = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  connection: CalendarConnection,
  accessToken: string,
) => {
  const webhookUrl = Deno.env.get('GOOGLE_CALENDAR_WEBHOOK_URL');
  if (!webhookUrl) return null;

  const currentExpiry = connection.channel_expires_at ? new Date(connection.channel_expires_at).getTime() : 0;
  if (connection.channel_id && connection.channel_resource_id && currentExpiry > Date.now() + 24 * 60 * 60 * 1000) {
    return { reused: true };
  }

  const calendarId = encodeURIComponent(connection.google_calendar_id || 'primary');
  const channelId = crypto.randomUUID();
  const expiration = Date.now() + 6 * 24 * 60 * 60 * 1000;
  const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/watch`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
      expiration,
    }),
  });

  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || 'Failed to watch Google Calendar');

  await supabase
    .from('cleaner_calendar_connections')
    .update({
      channel_id: body.id ?? channelId,
      channel_resource_id: body.resourceId ?? null,
      channel_expires_at: body.expiration ? new Date(Number(body.expiration)).toISOString() : new Date(expiration).toISOString(),
    })
    .eq('id', connection.id);

  return { watched: true };
};

interface GoogleEventDate {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

interface GoogleEvent {
  id: string;
  etag?: string;
  status?: string;
  summary?: string;
  transparency?: string;
  start?: GoogleEventDate;
  end?: GoogleEventDate;
}

const eventDateToInstant = (value?: GoogleEventDate, isEndAllDay = false) => {
  if (!value) return null;
  if (value.dateTime) return new Date(value.dateTime);
  if (value.date) {
    const suffix = isEndAllDay ? 'T00:00:00' : 'T00:00:00';
    return new Date(`${value.date}${suffix}`);
  }
  return null;
};

export const syncGoogleCalendarConnection = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  connectionId: string,
) => {
  const connection = await getConnection(supabase, connectionId);
  const accessToken = await getValidAccessToken(supabase, connection);
  await ensureGoogleWatchChannel(supabase, connection, accessToken).catch((error) => {
    console.warn('Google Calendar watch setup skipped/failed', error);
  });
  const calendarId = encodeURIComponent(connection.google_calendar_id || 'primary');

  const params = new URLSearchParams({
    singleEvents: 'true',
    showDeleted: 'true',
    maxResults: '2500',
  });

  if (connection.sync_token) {
    params.set('syncToken', connection.sync_token);
  } else {
    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    params.set('timeMin', timeMin);
    params.set('timeMax', timeMax);
  }

  const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 410) {
    await supabase.from('cleaner_calendar_busy_blocks').delete().eq('connection_id', connection.id);
    await supabase.from('cleaner_calendar_connections').update({ sync_token: null }).eq('id', connection.id);
    return syncGoogleCalendarConnection(supabase, connectionId);
  }

  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || 'Failed to sync Google Calendar');

  const items = (body.items ?? []) as GoogleEvent[];
  const upserts = items
    .filter((event) => event.status !== 'cancelled' && event.transparency !== 'transparent')
    .map((event) => {
      const isAllDay = Boolean(event.start?.date && event.end?.date);
      const startsAt = eventDateToInstant(event.start);
      const endsAt = eventDateToInstant(event.end, isAllDay);
      if (!startsAt || !endsAt || endsAt <= startsAt) return null;

      return {
        cleaner_id: connection.cleaner_id,
        connection_id: connection.id,
        google_event_id: event.id,
        google_event_etag: event.etag ?? null,
        summary: event.summary ?? 'Busy',
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        is_all_day: isAllDay,
        transparency: event.transparency ?? null,
        status: event.status ?? 'confirmed',
      };
    })
    .filter(Boolean);

  const cancelledIds = items.filter((event) => event.status === 'cancelled').map((event) => event.id);
  if (cancelledIds.length > 0) {
    await supabase
      .from('cleaner_calendar_busy_blocks')
      .delete()
      .eq('connection_id', connection.id)
      .in('google_event_id', cancelledIds);
  }

  if (upserts.length > 0) {
    const { error } = await supabase
      .from('cleaner_calendar_busy_blocks')
      .upsert(upserts, { onConflict: 'connection_id,google_event_id' });
    if (error) throw error;
  }

  const { error: updateError } = await supabase
    .from('cleaner_calendar_connections')
    .update({
      sync_token: body.nextSyncToken ?? connection.sync_token ?? null,
      last_synced_at: new Date().toISOString(),
      last_error: null,
      status: 'connected',
    })
    .eq('id', connection.id);
  if (updateError) throw updateError;

  return { synced: upserts.length, cancelled: cancelledIds.length };
};

export const syncAllActiveConnections = async (supabase: ReturnType<typeof getSupabaseAdmin>) => {
  const { data, error } = await supabase
    .from('cleaner_calendar_connections')
    .select('id')
    .eq('provider', 'google')
    .eq('status', 'connected');
  if (error) throw error;

  const results = [];
  for (const connection of data ?? []) {
    try {
      results.push({ connectionId: connection.id, ...(await syncGoogleCalendarConnection(supabase, connection.id)) });
    } catch (error) {
      await supabase
        .from('cleaner_calendar_connections')
        .update({ status: 'error', last_error: error instanceof Error ? error.message : String(error) })
        .eq('id', connection.id);
      results.push({ connectionId: connection.id, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
};

export const createOrUpdateBookingEvent = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  bookingId: number,
  cleanerId: number,
) => {
  const { data: connection, error: connectionError } = await supabase
    .from('cleaner_calendar_connections')
    .select('*')
    .eq('cleaner_id', cleanerId)
    .eq('provider', 'google')
    .eq('status', 'connected')
    .maybeSingle();
  if (connectionError) throw connectionError;
  if (!connection) return { skipped: 'Cleaner has no connected Google Calendar' };

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, date_time, end_date_time, total_hours, service_type, cleaning_type, address, postcode, first_name, last_name, booking_status')
    .eq('id', bookingId)
    .maybeSingle();
  if (bookingError) throw bookingError;
  if (!booking?.date_time) throw new Error('Booking has no start time');

  const accessToken = await getValidAccessToken(supabase, connection);
  const toGoogleLondonDateTime = (value: string) => value.slice(0, 19);
  const start = toGoogleLondonDateTime(booking.date_time);
  const endValue =
    booking.end_date_time ??
    new Date(new Date(booking.date_time).getTime() + Number(booking.total_hours || 1) * 60 * 60 * 1000).toISOString();
  const end = toGoogleLondonDateTime(endValue);
  const customerName = [booking.first_name, booking.last_name].filter(Boolean).join(' ') || 'Customer';
  const service = booking.service_type || booking.cleaning_type || 'Cleaning';
  const calendarId = encodeURIComponent(connection.google_calendar_id || 'primary');

  const eventBody = {
    summary: `SN Cleaning: ${service}`,
    location: [booking.address, booking.postcode].filter(Boolean).join(', '),
    description: `Booking #${booking.id}\nCustomer: ${customerName}`,
    start: { dateTime: start, timeZone: 'Europe/London' },
    end: { dateTime: end, timeZone: 'Europe/London' },
  };

  const { data: existing } = await supabase
    .from('booking_calendar_events')
    .select('*')
    .eq('booking_id', bookingId)
    .eq('cleaner_id', cleanerId)
    .maybeSingle();

  const method = existing?.google_event_id ? 'PATCH' : 'POST';
  const url = existing?.google_event_id
    ? `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/${encodeURIComponent(existing.google_event_id)}`
    : `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`;

  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(eventBody),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || 'Failed to sync booking to Google Calendar');

  await supabase.from('booking_calendar_events').upsert(
    {
      booking_id: bookingId,
      cleaner_id: cleanerId,
      connection_id: connection.id,
      google_event_id: body.id,
      google_event_link: body.htmlLink ?? null,
      last_synced_at: new Date().toISOString(),
      last_error: null,
    },
    { onConflict: 'booking_id,cleaner_id' },
  );

  return { synced: true, googleEventId: body.id };
};
