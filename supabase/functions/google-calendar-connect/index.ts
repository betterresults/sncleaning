import {
  buildGoogleAuthUrl,
  corsHeaders,
  createOAuthState,
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
    const { returnTo } = await req.json().catch(() => ({}));
    const state = await createOAuthState({ userId: user.id, cleanerId, returnTo });
    const authUrl = await buildGoogleAuthUrl(state);

    return jsonResponse({ authUrl });
  } catch (error) {
    return errorResponse(error);
  }
});
