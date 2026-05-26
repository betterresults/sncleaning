## What's happening

Looking at booking **111136** (£46, customer `management@thestgroup.co.uk`, scheduled May 26 09:00):

- `payment_status = 'failed'`, `invoice_id = NULL`
- Every Stripe row in your screenshot ("Authorization for booking 111136") is from our system retrying the same card every hour.
- After the first decline, Stripe **Radar** starts auto-blocking every subsequent attempt on that card → that's why you see "Blocked Blocked Blocked…".

## Root cause (in `stripe-process-payments` + `system-payment-action`)

1. The hourly cron `process-stripe-payments-hourly` queries:
   ```ts
   .in('payment_status', ['Unpaid', 'pending', 'failed'])
   .is('invoice_id', null)
   ```
   So any `failed` booking with no invoice_id is retried **every hour, forever**.

2. In `system-payment-action` (authorize branch), when Stripe returns an error or a non-`requires_capture` status, the code sets `payment_status = 'failed'` but **never stores the failed PaymentIntent id**. So the booking re-enters the retry pool on the next cron tick.

3. Each retry creates a brand-new PaymentIntent on the same card. Stripe Radar's "block if prior PI was blocked/declined" rule then blocks all follow-ups → snowball of "Blocked" entries.

This started "yesterday" because the card had one legitimate decline and the loop took over from there.

## Fix

### 1. Stop the infinite retry in `stripe-process-payments`
Remove `'failed'` from the authorization payment_status filter. Only retry truly untouched bookings: `['Unpaid', 'pending']`.

### 2. Add an attempt cap + record last attempt
Add `payment_attempt_count` and `last_payment_attempt_at` columns to `bookings`. In `system-payment-action`:
- Increment counter on every authorize attempt.
- Refuse to retry if `payment_attempt_count >= 3` (mark `payment_status = 'failed_permanent'` / `requires_manual`).
- Store the failed PaymentIntent id in `invoice_id` (or a new `last_failed_invoice_id` column) so the cron's `invoice_id is null` filter naturally excludes it.

### 3. Add a minimum back-off
In the cron query, also exclude bookings whose `last_payment_attempt_at` is within the last 6 hours, so even retries that do happen don't hammer the card.

### 4. Clean up booking 111136 manually
- Set `payment_status = 'requires_manual'` (or similar) so the cron leaves it alone.
- Reach out to the customer to update the card — Stripe Radar will keep blocking the existing one for a while.

### 5. (Optional) Surface in admin UI
Add a small badge / filter "Payment failed – manual action needed" so these don't disappear silently.

## Files to change

- `supabase/functions/stripe-process-payments/index.ts` — narrow filter, add back-off check.
- `supabase/functions/system-payment-action/index.ts` — attempt counter, persist failed PI id, stop retrying past cap.
- New migration: add `payment_attempt_count int default 0`, `last_payment_attempt_at timestamptz`, and a `failed_permanent` status convention on `bookings` (and same on `past_bookings`).
- Admin bookings list: optional badge for the new status.

## Why this is safe

- No change to successful authorize/capture paths.
- Existing 'authorized' / 'paid' bookings untouched.
- Cron still picks up genuinely new unpaid bookings within the 24h window.
- Stops creating new PaymentIntents on cards Stripe has already flagged.

Want me to proceed with all 4 code changes + the migration, or just the urgent fix (#1 + cleanup of 111136) first?
