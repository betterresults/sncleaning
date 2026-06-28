# Improve Meta CAPI Coverage for fbc / fbp

Meta is flagging low event-match quality because `fbc` and `fbp` are missing on many server-side (CAPI) events. This plan closes those gaps. No creative / image work.

---

## Current behavior (verified in code)

- `index.html` loads the Meta Pixel which auto-sets `_fbp` and `_fbc` cookies on first pageview.
- `src/components/FbclidCapture.tsx` rewrites `_fbc` on any SPA route change that contains `?fbclid=`.
- `src/lib/metaCapi.ts` reads `_fbc` / `_fbp` from cookies and forwards them to the `meta-capi-track` edge function.
- `supabase/functions/meta-capi-track/index.ts` passes them through to Meta.
- Offline `Purchase` events (WhatsApp / phone bookings, per `mem://marketing/offline-reporting`) currently have **no** `fbc` / `fbp` because those leads never carry browser cookies into the admin reporting flow.

## Gaps to fix

1. **Cookie loss across sessions / Safari ITP.** `_fbc` and `_fbp` can be cleared or blocked. Mirror both into `localStorage` whenever we see them, and read back from storage as a fallback in `metaCapi.ts`.
2. **Server-side `fbc` synthesis.** When the client sends no `fbc` but the request `event_source_url` or `Referer` contains `fbclid`, build `fb.1.<unix_ms>.<fbclid>` server-side.
3. **Server-side `fbp` generation.** If `fbp` is absent, generate `fb.1.<unix_ms>.<10-digit-random>` server-side (Meta-compliant format) and return it so the client can persist it for future events in the same session.
4. **Persist identifiers on the lead row.** Add `fbc`, `fbp`, `client_user_agent`, `client_ip` columns to `quote_leads`, and have `track-funnel-event` write them whenever a lead is upserted. This makes them available for later offline Purchase reporting.
5. **Offline Purchase reporting.** When sending Purchase for WhatsApp / phone bookings, look up the matching `quote_leads` row (by phone — most reliable for offline channels) and forward the stored `fbc` / `fbp` / UA / IP.
6. **Advanced-matching parity audit.** Make sure every `trackMetaEvent` call site passes `email`, `phone`, `first_name`, `last_name` when available (booking form, payment, confirmation). Boosts EMQ alongside fbc/fbp.

## Files to change

- `src/components/FbclidCapture.tsx` — mirror `_fbc` to localStorage.
- `src/lib/metaCapi.ts` — read `_fbc` / `_fbp` from cookie OR localStorage fallback; persist server-returned `fbp` back to both.
- `supabase/functions/meta-capi-track/index.ts` — synthesize missing `fbc` from URL/Referer `fbclid`; generate `fbp` if absent; return the values used in the response body.
- `supabase/functions/track-funnel-event/index.ts` — accept and persist `fbc`, `fbp`, `client_user_agent`, `client_ip` on `quote_leads` upserts.
- Whichever edge function emits offline Purchases (located during build) — look up `quote_leads` by phone and forward stored identifiers.
- Quick audit pass in `src/features/booking/**` + `src/pages/BookingConfirmation.tsx` for missing user fields on `trackMetaEvent` calls.

## Database migration

```sql
ALTER TABLE public.quote_leads
  ADD COLUMN IF NOT EXISTS fbc text,
  ADD COLUMN IF NOT EXISTS fbp text,
  ADD COLUMN IF NOT EXISTS client_user_agent text,
  ADD COLUMN IF NOT EXISTS client_ip text;
```

No new GRANTs needed — columns inherit existing `quote_leads` privileges.

## Verification

- Meta Events Manager → Test Events with a real `?fbclid=...` URL → confirm `fbc` and `fbp` appear on Lead, InitiateCheckout, AddPaymentInfo, and Purchase.
- Check Event Match Quality in Events Manager (should rise within 24–48h).

---

Ready to switch to build mode and ship this?
