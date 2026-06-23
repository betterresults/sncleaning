# SN Cleaning — architecture overview

Frontend operations platform for a UK cleaning business: public booking funnels, admin console, cleaner field app, and customer portal. Backend is Supabase (Postgres, Auth, Storage, Edge Functions).

---

## Repository layout

| Path | Purpose |
|------|---------|
| `src/` | Main React app (Vite) — **primary codebase** |
| `sn-cleaning-booking-forms-main/` | Booking funnel forms (imported into `src/pages/*`; merge planned in Phase 2) |
| `supabase/` | Migrations and edge functions |
| `android/` | Capacitor native shell for cleaner app |
| `wp-sn-cleaning-page-plugin/` | WordPress marketing site (separate deploy) |

---

## Tech stack

- **React 18** + **TypeScript** + **Vite 5**
- **UI:** shadcn/ui (Radix), Tailwind CSS
- **Routing:** react-router-dom v6 — flat route table in `src/App.tsx`
- **Server state:** TanStack React Query (partial adoption; most pages use `useEffect` + Supabase directly)
- **Auth & DB:** `@supabase/supabase-js` with generated types in `src/integrations/supabase/types.ts`
- **Payments:** Stripe (`@stripe/react-stripe-js`)
- **Mobile:** Capacitor 7 (PWA + native Android)

---

## Application entry

```
main.tsx → App.tsx
  ├── QueryClientProvider
  ├── AuthProvider
  ├── AdminCustomerProvider / AdminCleanerProvider
  └── BrowserRouter (~90 routes)
```

Dev server: `npm run dev` → http://localhost:8080

---

## User roles

Roles are stored in Postgres (`profiles.role`, `user_roles.role`) and exposed via `AuthContext` as `userRole`.

| DB / code value | UI label | `profiles` links | Default redirect after login |
|-----------------|----------|------------------|------------------------------|
| `admin` | Admin | — | `/dashboard` |
| `sales_agent` | Sales agent | `assigned_sources` optional | `/dashboard` (restricted nav) |
| `user` | Cleaner | `cleaner_id` → `cleaners` | `/cleaner-today` (mobile/Capacitor) or `/cleaner-dashboard` (desktop) |
| `guest` | Customer | `customer_id` → `customers` | `/customer-dashboard` |

### Important naming quirks

- **`guest` = customer** — not an anonymous visitor. Public booking pages do not require login.
- **`user` = cleaner** — not a generic logged-in user. Cleaners are identified by `cleanerId` on the profile; redirect logic often checks `cleanerId` rather than role alone.
- **Role resolution** (`AuthContext`): `user_roles.role` takes precedence over `profiles.role`; fallback is `guest`.

### Access control

- **Real security:** Supabase Row Level Security (RLS) and edge functions.
- **Frontend:** Nested route groups in `src/routes/AppRoutes.tsx` using `ProtectedRoute` presets (`StaffRoute`, `AdminRoute`, `CleanerRoute`, `CustomerRoute`, etc.).
- **Role constants:** `src/lib/roles.ts` maps DB values to readable labels (`guest` → Customer, `user` → Cleaner).

### Navigation by role

Defined in `src/lib/navigationItems.ts`:

- `adminNavigation` — full admin menu
- `salesAgentNavigation` — bookings, users, coverage; no payment/profit sections
- `cleanerNavigation` — bookings, earnings, settings
- `getCustomerNavigation(hasLinenAccess)` — dashboard, bookings, optional linen

---

## Route groups

### Public (no auth)

| Route | Page |
|-------|------|
| `/`, `/auth` | Login |
| `/domestic`, `/domestic-cleaning`, `/domestic-booking` | Domestic booking |
| `/airbnb`, `/airbnb-cleaning` | Airbnb booking |
| `/end-of-tenancy`, `/end-of-tenancy-cleaning` | End of tenancy |
| `/carpet-cleaning` | Carpet cleaning |
| `/linen-order` | Linen order |
| `/coverage` | Postcode coverage check |
| `/free-quote`, `/lp`, `/get-quote` | Marketing / quote funnels |
| `/b/:shortCode` | Short link resolver |
| `/apply` | Job applications |
| `/booking-confirmation`, `/payment-failed` | Post-checkout |

### Staff (`admin`, `sales_agent`)

`/dashboard`, `/upcoming-bookings`, `/past-bookings`, `/users`, `/admin-*`, etc.

### Cleaner (`user` + `cleaner_id`)

`/cleaner-today`, `/cleaner-dashboard`, `/cleaner-checklist/:bookingId`, `/cleaner-earnings`, …

### Customer (`guest` + `customer_id`)

`/customer-dashboard`, `/customer-settings`, `/customer-add-booking`, …

Admins can impersonate customers via `AdminCustomerContext` on customer-facing pages.

---

## Data flow

```
React component
  → supabase.from('table').select()   (most pages)
  → supabase.functions.invoke('fn')   (payments, emails, SMS)
  → fetch(edge function URL)          (funnel tracking, some public flows)
```

Generated types: `Database['public']['Tables']` in `src/integrations/supabase/types.ts`.

---

## Booking forms (temporary split)

Public and admin booking pages are thin wrappers that import from `sn-cleaning-booking-forms-main/`:

```tsx
// src/pages/DomesticBooking.tsx
import DomesticBookingForm from '../../sn-cleaning-booking-forms-main/src/components/booking/DomesticBookingForm';
```

Forms use the `@/` alias (resolves to `src/`), so they depend on the main app. Phase 2 will move these into `src/features/booking/`.

---

## Environment variables

Copy `.env.example` to `.env`:

| Variable | Required | Used by |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase client, storage URLs |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase client (anon key) |
| `VITE_SUPABASE_PROJECT_ID` | Optional | Reference / tooling |

The Supabase client (`src/integrations/supabase/client.ts`) reads these at build time. Never commit `.env` or service-role keys.

---

## Mobile / PWA

- **Capacitor** app ID: `com.sncleaning.cleaners`
- **Offline photos:** `src/utils/photoQueue.ts`, `syncQueue.ts`
- **Install prompts:** `InstallPrompt`, `PWAInstallButton`

---

## Related docs

- [Smoke test checklist](./SMOKE_TEST.md) — manual QA per role
- [README](../README.md) — Lovable setup and local dev

---

## Improvement roadmap (summary)

| Phase | Focus |
|-------|--------|
| 0 | Baseline docs, env, CI, debug log cleanup ✅ |
| 1 | `ProtectedRoute`, consistent auth ✅ |
| 2 | Merge booking forms into `src/` |
| 3 | React Query data layer |
| 4 | Split large components |
| 5 | Tests on critical paths |
