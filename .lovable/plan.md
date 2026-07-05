## Problem

Bookings are stored as London wall-clock time with a hardcoded `+00:00` suffix (e.g. an 08:00 London booking is saved as `2026-07-10T08:00:00+00:00`). Right now:

- The **admin/customer/cleaner UI** formats these values with `new Date(...).toLocaleString(...)` **without a timezone**, so the displayed time follows the viewer's device timezone. A user in Bulgaria sees `10:00` (or `11:00` in DST) for an 08:00 London booking.
- **Edge functions** (running in UTC) also format without a pinned timezone, so notifications currently show the correct London wall-clock — this is what creates the mismatch the user reported between the app UI and the emails/SMS.
- A couple of components (`CleanerAvailability`, `BookingDetailsSheet`) already pin `timeZone: 'UTC'` and are correct.

Goal: every date/time derived from `bookings.date_time` / `end_date_time` (and the equivalent columns on `past_bookings`, `quote_leads`, `recurring_services`) must show UK time for every viewer, regardless of their device timezone, and must match what customers/cleaners receive in emails and SMS.

## Approach

1. **New utility `src/lib/ukTime.ts`** with a single source of truth for booking time formatting. Because the stored value already contains the London wall-clock digits under a `+00:00` suffix, all formatters pin `timeZone: 'UTC'`, which preserves those digits verbatim for every viewer. Exposed helpers (thin wrappers over `Intl.DateTimeFormat` and `date-fns`):
   - `formatUKDate(value, pattern?)` — default `dd MMM yyyy`
   - `formatUKTime(value)` — `HH:mm`
   - `formatUKDateTime(value, pattern?)` — default `dd MMM yyyy HH:mm`
   - `formatUKLong(value)` — `EEEE, d MMMM yyyy`
   - `ukDateParts(value)` — `{ date, time, weekday }` for composed strings
   - Internally uses `date-fns-tz`'s `formatInTimeZone(value, 'Europe/London', ...)` on the raw string (bypasses the misleading `+00:00`) so future data written with a real timezone offset is still handled correctly.

2. **Refactor every UI usage tied to booking `date_time` / `end_date_time`** to call the new helpers instead of raw `new Date(...).toLocale*` or `format(new Date(...), ...)`. Files include (non-exhaustive, from grep):
   - Dashboard: `UpcomingBookings`, `RecentActivity`, `PerformanceChart`, `PhotoManagementDialog`, `ManualEmailDialog`, `EditBookingDialog`, `EditPastBookingDialog`, `DuplicateBookingDialog`, `AssignCleanerDialog`, `DayBookingsDialog`, `AssignCleanerToPastBookingDialog`
   - Admin: `BookingsTable`, `ActivityLogsView`, `AdminAddCleanerPayment`, `BulkEditBookings`
   - Customer: `CustomerDashboard`, `CustomerUpcomingBookings`, `CustomerPastBookings`, `CustomerBookingPaymentDialog`, `EditBookingDialog`, `DuplicateBookingDialog`, `BulkPaymentDialog`, `AddressManager`, `detail/*Tab.tsx`
   - Cleaner: `ViewBookingDialog`, `CleaningPhotosUploadDialog`, `BookingDetailsSheet` (align to helper)
   - Bookings: `BookingInvoiceDialog`, `BookingsPDF`, `BookingConfirmation`
   - Payments: `CleanerPaymentsManager`, `StripePaymentsDashboard`, `ProfitTrackingTable`
   - SMS/Chat: `WhatsAppMessageList`, `CustomerLookupContent`
   - Recurring: `UpdateBookingsCleanerDialog`, `AddRecurringBooking`
   - Photos: `CleaningPhotosViewDialog`, `CustomerPhotos`, `CleanerChecklist`

3. **Notifications (edge functions)** — even though these coincidentally produce London digits today, pin the timezone explicitly so it stays correct if Supabase ever changes runtime TZ or the stored format is normalized:
   - `process-scheduled-notifications`: `booking_date` / `booking_time` formatted with `timeZone: 'UTC'` (matches wall-clock) and `time_only` used as-is.
   - `manual-authorize-booking`, `stripe-authorize-payment`, `stripe-collect-payment-method`, `check-incomplete-payments`, `stripe-webhook`, `auto-photo-notification`, `send-photo-notification`, `send-admin-quote-email`, `send-quote-email`, `invoiless-auto-invoice`: same pin.
   - Add a small shared helper `supabase/functions/_shared/ukTime.ts` (imported per-function since edge functions can't share modules across folders — copy the tiny helper into each function to keep the "no subfolders" rule).

4. **Do not touch** stored data, date-picker inputs (`selectedDate` is a local Date the user picks), or unrelated visual/layout code. Business logic and pricing stay untouched per project rules.

## Verification

- Run `tsgo` (typecheck) after the refactor.
- Open the preview at `/admin` upcoming bookings and confirm the displayed time matches the value shown in a customer confirmation email for the same booking.
- Spot-check `CustomerUpcomingBookings` and cleaner `ViewBookingDialog` for the same booking — all three surfaces should show the identical UK time regardless of device timezone.

## Out of scope

- Changing how `date_time` is stored (still London wall-clock + `+00:00`).
- Redesigning any component; only the formatting call changes.
- Non-booking timestamps like `activity_logs.timestamp` or `sms.created_at`, which are real UTC and correctly shown in viewer-local time — unless the user later asks to force them to UK too.
