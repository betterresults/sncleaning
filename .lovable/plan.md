
## Goal
Report this booking (Saiji@doctors.org.uk) — and future WhatsApp/phone conversions — to Meta as a **Purchase** so it shows up in Ads Manager and is matched back to the Facebook click that started the quote.

## How Meta will match it
Two matching signals are sent together so Meta can attribute the conversion:
1. **Hashed PII (Advanced Matching)** — email, phone, first name, last name, city, external_id. Strong match for users logged into Facebook.
2. **fbc / fbp cookies** — perfect match when present. Today we do NOT store `fbclid` on quote_leads, so for this specific customer we rely on PII only. We will start saving it from now on so future offline conversions match exactly.

`action_source` will be set to **`business_messaging`** (since the deal closed over WhatsApp) instead of `website` — this is the value Meta expects for offline/messaging conversions and unlocks the offline attribution window (up to 7 days post-click).

## What gets built

### 1. DB — capture fbclid on quote_leads (forward-looking)
- Add `fbclid text`, `fbc text`, `fbp text`, `landing_url text` to `public.quote_leads`.
- `FbclidCapture` / quote form already reads the cookies — extend it to also persist them onto the `quote_leads` row via `track-funnel-event`.

### 2. Edge function — `meta-capi-offline-purchase`
Admin-only function (verifies caller is admin via `has_role`). Input: `{ booking_id }`.

Steps:
1. Load booking + customer (`email`, `phone`, `first_name`, `last_name`, `city`, `total_cost`, `quote_session_id` if present).
2. Look up the matching `quote_leads` row (by `session_id` → fall back to email/phone) to recover `fbc`, `fbp`, `landing_url`, `utm_*`.
3. Build the CAPI payload:
   - `event_name: "Purchase"`
   - `event_id: "booking_<id>"` (idempotent — prevents double-counting if pressed twice or if the Pixel also fires later)
   - `action_source: "business_messaging"`
   - `event_source_url`: stored `landing_url` or the public site URL
   - `user_data`: hashed em / ph / fn / ln / ct / external_id + raw fbc/fbp when available
   - `custom_data`: `{ currency: "GBP", value: total_cost, content_name: service_type, content_category: "cleaning" }`
4. POST to `graph.facebook.com/v21.0/<PIXEL_ID>/events` using `META_PIXEL_ID` + `META_ADS_ACCESS_TOKEN` (already configured).
5. Record the send on the booking (`meta_capi_purchase_sent_at`, `meta_capi_event_id`) so the UI can show "Reported to Meta ✓" and block duplicate sends.

### 3. Admin UI — "Send to Meta Ads" button
On the booking detail page (admin only):
- Button visible when booking is paid/confirmed and not yet reported.
- Click → calls the edge function → toast success + shows the timestamp.
- Disabled / replaced with "Reported on <date>" once sent.

### 4. Backfill this specific customer
After the function is deployed, I'll trigger it once for Saiji@doctors.org.uk's booking from the admin UI (or via a one-off invoke) so Meta receives the Purchase event today.

## Out of scope
- No design changes.
- No change to the existing browser Pixel / `meta-capi-track` flow for online conversions.
- No automatic firing on booking creation yet — this is a manual admin action first; once we trust it we can wire it to fire automatically when a WhatsApp/manual booking is marked paid.

## Technical notes
- Same hashing rules as `meta-capi-track` (lowercase trim → SHA-256; phone digits only).
- Idempotency via deterministic `event_id` = `booking_<id>` (Meta dedups across sends).
- New columns are nullable; no data migration required.
- Standard GRANTs on the new columns are inherited from `quote_leads`; no new tables.
