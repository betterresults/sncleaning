# Smoke test checklist

Run after significant changes or before a release. Target: complete in ~30 minutes.

**Prerequisites:** `npm i`, copy `.env.example` → `.env`, `npm run dev` (http://localhost:8080).

---

## Public (no login)

- [ ] `/` — login page loads; no console errors
- [ ] `/domestic` — domestic booking form loads; can advance past step 1
- [ ] `/airbnb` — Airbnb booking form loads
- [ ] `/coverage` — coverage map/postcode check loads
- [ ] `/free-quote` — quote landing page loads

---

## Admin (`role: admin`)

Log in as an admin user.

- [ ] Redirects to `/dashboard`
- [ ] Today's bookings list loads on dashboard
- [ ] `/upcoming-bookings` — list loads, filters work
- [ ] `/admin-add-booking` — form opens
- [ ] `/users` — user tables load
- [ ] `/admin-payment-management` — page loads
- [ ] Sign out returns to login

---

## Sales agent (`role: sales_agent`)

- [ ] Redirects to `/dashboard`
- [ ] Payment / profit nav items are hidden or blocked (no financial pages)
- [ ] Can view upcoming bookings

---

## Cleaner (`role: user` + `cleaner_id` set)

- [ ] Desktop: redirects to `/cleaner-dashboard`
- [ ] Mobile width (<768px) or Capacitor app: redirects to `/cleaner-today`
- [ ] Today's bookings list loads
- [ ] `/cleaner-available-bookings` — page loads
- [ ] `/cleaner-earnings` — page loads

---

## Customer (`role: guest` + `customer_id` set)

- [ ] Redirects to `/customer-dashboard`
- [ ] Upcoming bookings section loads
- [ ] `/customer-settings` — profile/settings load
- [ ] `/customer-add-booking` — service selection loads

---

## Build

- [ ] `npm run build` completes without errors
- [ ] `npm run lint` — optional; main app (`src/`) has known pre-existing lint debt (subprojects excluded in eslint config)

---

## Notes

| Role in DB | UI label   | Default redirect        |
|------------|------------|-------------------------|
| `admin`    | Admin      | `/dashboard`            |
| `sales_agent` | Sales agent | `/dashboard`         |
| `user`     | Cleaner    | `/cleaner-today` or `/cleaner-dashboard` |
| `guest`    | Customer   | `/customer-dashboard`   |

Record failures with: role, URL, browser, and console/network errors.
