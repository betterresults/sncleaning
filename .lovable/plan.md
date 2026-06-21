
## Goal

Send 7 funnel events to Meta Conversions API (CAPI) from the server, deduplicated against the browser‑side Meta Pixel.

## Secrets

- **Access token**: reuse existing `META_ADS_ACCESS_TOKEN` (no new secret created).
- `META_PIXEL_ID`: already saved (`1958256531561607`).

## What gets built

### 1. Edge function `supabase/functions/meta-capi-track/index.ts`

- Public POST endpoint (CORS enabled, no JWT required — needed from landing pages).
- Zod-validated body:
  ```json
  {
    "event_name": "Lead|ViewContent|Schedule|InitiateCheckout|AddPaymentInfo|SubscribedButtonClick|Purchase",
    "event_id": "uuid matching pixel eventID",
    "event_source_url": "https://.../free-quote",
    "user": { "email","phone","first_name","last_name","city","external_id","fbc","fbp","client_user_agent","client_ip" },
    "custom_data": { "currency":"GBP", "value": 189.0, "content_name": "..." },
    "test_event_code": "optional"
  }
  ```
- Hashes `email/phone/first_name/last_name/city/external_id` with SHA-256 (lowercase + trim; phone digits-only) via Web Crypto. Leaves `fbc`, `fbp`, `client_user_agent`, `client_ip_address` raw.
- Falls back to `x-forwarded-for` and `user-agent` headers when client doesn't supply them.
- POSTs to `https://graph.facebook.com/v21.0/{PIXEL_ID}/events?access_token=…` with `action_source: "website"`.
- Logs Meta's response; returns `{ ok, meta }` or `502` with Meta's error body.

### 2. Client helper `src/lib/metaCapi.ts`

- `trackMetaEvent(eventName, { user, customData, eventId?, isCustomEvent? })`
  - Generates UUID `event_id` if not supplied.
  - Reads `_fbc` / `_fbp` cookies + `navigator.userAgent` automatically; auto-builds `_fbc` from `fbclid` query param on first landing if missing.
  - **Pixel call**:
    - Standard events (`Lead`, `ViewContent`, `Schedule`, `InitiateCheckout`, `AddPaymentInfo`, `Purchase`) → `fbq('track', name, customData, { eventID })`.
    - `SubscribedButtonClick` → `fbq('trackCustom', 'SubscribedButtonClick', customData, { eventID })` (custom event, per your instruction).
  - Then POSTs the same `event_id` to the edge function so Meta dedupes browser + server.
  - Returns the `event_id` so callers can persist or reuse it.

### 3. Schema change

- Migration: add `meta_event_id text` column to `bookings` (nullable). Stores the browser-generated id for `SubscribedButtonClick`/`Purchase` so the server-side `Purchase` (fired from booking-confirmation flow) can reuse the same id for dedup.

### 4. Wiring into the funnel (file-by-file, after foundation is in)

| Event | Location |
|---|---|
| `Lead` | `/free-quote` form on successful `quote_leads` insert |
| `ViewContent` | Price reveal step of booking flow |
| `Schedule` | Date/time selection step |
| `InitiateCheckout` | Payment page mount |
| `AddPaymentInfo` | Stripe card element `complete: true` |
| `SubscribedButtonClick` | Confirm Booking click (before charge), id persisted to `bookings.meta_event_id` |
| `Purchase` | Server-side, from the existing booking-confirmation flow, reusing `meta_event_id` |

I'll identify exact components for each step as I wire them and report back if any are ambiguous.

## Out of scope

- Offline/CRM events, backfill of historical bookings, customer-match audiences.
