## Payment page rework (customer flow only)

Admin flow stays untouched throughout.

### 1. Charge-timing rules

- **More than 48 hours away** → no card collected, no Stripe charge today. Booking is created immediately on Confirm. Card will be requested/charged after the cleaning is completed (handled separately later — out of scope for this change).
- **Within 48 hours** → card is authorized now (existing Stripe redirect / saved-card flow). Capture still happens after the clean (existing behavior unchanged).

The 48h cutoff matches the existing `isUrgentBooking` memo and your 48h free-cancellation policy.

### 2. UI changes on `PaymentStep.tsx`

- **Header**: replace the "Pay" framing with a single H2 "Confirm your booking".
- **Back button**: replace the current full-width "Back" outline button with a small icon-only chevron-left button anchored to the left of the footer (still hidden in quote-link mode).
- **Primary button copy**:
  - >48h: `Confirm booking`
  - ≤48h with new card: `Authorize £X & confirm` (card is held, not captured)
  - ≤48h with saved card: `Authorize £X & confirm`
  - Admin / test modes: unchanged
- **>48h block** (new): replaces the Stripe Checkout notice / PaymentElement card entirely with a friendly panel:
  - Title: "Nothing to pay today"
  - Body: "Click Confirm to secure your booking — we'll assign a cleaner right away. You'll only be charged after your cleaning is completed. Free cancellation or rescheduling up to 48 hours before."
  - Small total summary line: "Total for this clean: £X.XX"
- **≤48h block**: keep current card-entry / saved-card UI but reword the helper text from "will be charged when you complete booking" to "will be authorized now and charged after your cleaning is completed".
- **Google reviews block** (new, above the footer): a 3-card horizontal grid with star row + quote + reviewer name. Hardcoded placeholders until you send real ones — clearly marked `TODO` so they're easy to swap.

### 3. Submit logic on `PaymentStep.tsx`

Add a branch at the top of `handleSubmit`:

```text
if (!isAdminMode && !isUrgentBooking) {
  → skip Stripe entirely
  → call create-public-booking with paymentStatus: 'deferred'
  → fire Meta Purchase event with value 0 (or omit) and existing meta_event_id
  → navigate to /booking-confirmation
}
```

Existing ≤48h path (Stripe Checkout redirect for new cards, SetupIntent confirm for saved cards) is unchanged.

### 4. Backend tweaks (minimal)

- `create-public-booking` edge function: accept `paymentStatus: 'deferred'` and persist it on the row. No new tables. No new columns required — `payment_status` already exists.
- `stripe-webhook`: no changes (the deferred path doesn't touch Stripe).
- Post-clean charging (taking the card later) is **out of scope** for this change — flagged as a follow-up.

### 5. Memory updates

Update `mem://payments/business-rules`: charge-immediately is no longer absolute. New rule: ">48h customer bookings defer payment until after the clean; ≤48h bookings authorize the card on confirmation."

### Files to edit

- `sn-cleaning-booking-forms-main/src/components/booking/steps/PaymentStep.tsx` (UI + submit branch)
- `supabase/functions/create-public-booking/index.ts` (accept `deferred` status)
- `mem://payments/business-rules` (and index)

### Still needed from you

- 2-3 real Google review quotes + reviewer first names to replace the placeholder cards.
