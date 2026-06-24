# Abandoned-Lead WhatsApp Follow-Up Automation

## Goal
When a visitor fills name + phone on the quote form but doesn't complete a booking, wait 15 minutes after their last activity, then send an SMS to **+447960612595** with a ready-to-tap WhatsApp link that opens a chat with that customer pre-filled with Silvia's check-in message. One SMS per lead, ever. The whole automation can be switched on/off from the admin UI.

> Note on WhatsApp Business: `wa.me` links open whichever WhatsApp app is the phone's default. Set WhatsApp Business as the default messaging app on your phone once (iPhone: Settings → Apps → Default Apps → Messaging; Android: long-press link → Open with → WhatsApp Business → Always) and every link from these SMS will open Business.

## How it will work

```text
Visitor types name + phone on /free-quote
        │  (already saved as quote_leads row via on-blur partial save)
        ▼
quote_leads.last_activity_at updated
        │
        ▼ every 5 min, pg_cron runs check-abandoned-leads edge function
        │
        ├─ skip if automation toggle is OFF
        ├─ find leads where:
        │     • first_name & phone present
        │     • last_activity_at between 15 and 180 min ago
        │     • no booking exists for that session_id / phone / email
        │     • abandoned_sms_sent_at IS NULL
        │
        ▼
build WhatsApp deep link:
  https://wa.me/<customer_phone_no_plus>?text=<encoded message>
        │
        ▼
send SMS to +447960612595 via existing Twilio function:
  "Lead abandoned: {first_name} ({phone}). Tap to WhatsApp: <wa.me link>"
        │
        ▼
mark quote_leads.abandoned_sms_sent_at = now()
```

When admin taps the SMS link → WhatsApp Business opens (because it's set as default) → message is pre-typed → just hit Send.

## What gets built

### 1. DB changes (one migration)
On `quote_leads`:
- `last_activity_at timestamptz` — updated by `track-funnel-event` on every partial save.
- `abandoned_sms_sent_at timestamptz` — set once when the follow-up SMS goes out (enforces one-per-lead).

New `automation_settings` table (key/value, admin-only):
- Row: `key='abandoned_lead_followup'`, `enabled boolean`, `delay_minutes int default 15`, `admin_phone text default '+447960612595'`, `message_template text`.
- RLS: only admins can read/update; service role full access.
- GRANTs included per platform rules.

### 2. Edge function: `check-abandoned-leads` (cron, no JWT)
Runs every 5 minutes. Steps:
1. Load automation settings; exit early if disabled.
2. Query `quote_leads` for candidates (filters above), limit 50 per run.
3. For each candidate, build message body from template, substituting `{first_name}`, `{wa_link}`.
4. Call existing `send-sms-notification` function (Twilio) with admin_phone as recipient.
5. Update `abandoned_sms_sent_at` to lock the lead.

Idempotency: `abandoned_sms_sent_at IS NULL` filter + per-row update prevents duplicate sends across cron runs.

### 3. pg_cron schedule
`select cron.schedule('check-abandoned-leads-every-5min', '*/5 * * * *', ...)` calling the edge function with the project anon key. Inserted via the data tool (contains URL + key).

### 4. Track activity timestamp
Small edit to `track-funnel-event`: when upserting `quote_leads`, also set `last_activity_at = now()`. No frontend changes needed — on-blur partial save already calls it.

### 5. Admin UI toggle
Small panel on `/admin-quote-leads`, top of the view:
- Switch: "Send WhatsApp follow-up SMS for abandoned leads (15 min delay)"
- Read-only display of admin phone, delay, message template.
- Writes to `automation_settings` via Supabase client (admin-gated by RLS).

No design changes elsewhere.

## Default SMS body sent to your phone
```
Abandoned lead: {first_name} ({phone}).
Tap to WhatsApp them:
https://wa.me/44XXXXXXXXXX?text=Hi%20{first_name}%2C%20I%20just%20noticed%20you%20were%20looking%20at%20a%20cleaning%20quote%20on%20our%20website%20earlier%20today.%20I%20wasn%27t%20sure%20whether%20you%20found%20the%20information%20you%20were%20looking%20for%2C%20so%20I%20thought%20I%27d%20quickly%20check%20in%20and%20see%20if%20there%27s%20anything%20I%20can%20help%20with.%20Silvia%2C%20S%26N%20Cleaning%20Services.
```

## Out of scope
- No quote form UI changes.
- No re-alerts after the first SMS.
- No in-UI template editor in v1 (editable via SQL).
- Booking detection by `session_id` match plus phone/email fallback.

## Technical notes
- WhatsApp link uses `wa.me/<digits>` (no `+`), message URL-encoded.
- Admin phone stored in DB, changeable without redeploy.
- Cron uses `pg_cron` + `pg_net` (already enabled in this project).
- Twilio SMS uses existing `send-sms-notification` — no new secret.
