# SN Cleaning — UI Design Principles

Reference for admin shell redesign and new page work. Read this before changing layout, spacing, or surface hierarchy.

## Core idea

**One surface.** The app shell provides a single white card (`shell-main`). Page content lives on that surface — not inside additional nested cards.

Flat sections are separated by **spacing, typography, and hairline dividers** — not boxes within boxes.

## Layout primitives

| Primitive | Use for |
|-----------|---------|
| `ShellPage` | Every in-shell page wrapper; set `width` (`default` \| `narrow` \| `wide` \| `full`) |
| `ShellSectionHeader` | Section title + optional description + optional action (right-aligned) |
| `shell-divide-block` | Vertical stack of a header + content; hairline between sibling blocks |
| `ShellStat` + `ShellStatGrid` | Inline metric row at top of dashboard-style pages (no stat cards) |
| `shell-split-grid` | Two-column sections on desktop (e.g. activity + chart) |
| `ShellSegment` | In-page tab switcher (customers / cleaners / office) — not shadcn `Tabs` |
| `shell-list` | Non-tabular row lists (notifications, recent activity) |

**Deprecated on new pages:** wrapping content in shadcn `Card` for page sections. `ShellCard` aliases exist but prefer flat sections.

## Typography & spacing

- Page title: shell header (`getShellRouteTitle`) — avoid duplicating the same H1 in the page body unless the header is hidden.
- Section title: `shell-section__title` — 17px, semibold, tight tracking.
- Section description: `shell-section__description` — 13px muted; inline after title with `·` separator when on same row.
- Dividers: `0.5px solid rgba(0, 0, 0, 0.06)` via `--shell-divider`.
- Section gap: `--shell-block-gap` (16px) inside blocks; `--shell-after-divider` (28px) between major blocks.

## Color & tone

- Brand accent: `#007aff` — use `text-shell-brand` / `bg-shell-brand` once Phase 0 tokens land in `tailwind.config.ts`.
- Success / warning / error: map to Tailwind `shell` or shadcn semantic colors — not new CSS files.
- Text: `text-shell`, `text-shell-muted`, `text-shell-faint` (target); today some still use `--shell-text-*` in CSS.
- Avoid heavy gradients and `rounded-3xl` shadow stacks on admin pages — legacy pattern being phased out.

## Styling source of truth (transitional)

- **Canonical (target):** Tailwind `className` + `tailwind.config.ts` shell tokens + `index.css` shadcn vars.
- **Legacy (phasing out):** `shell.css`, `shell-content.css` — see **CSS → Tailwind migration** in `.cursor/design-principles.md`.
- **Do not add** new rules to shell CSS files. New UI uses Tailwind only.

## Shell chrome

- **Sidebar:** full viewport height, sticky; not nested inside padded frame.
- **Main content:** gutter on top, right, bottom (`--shell-gutter`); sidebar flush left.
- **Header actions:** `shell-icon-btn`, `shell-icon-badge` for bell / SMS / avatar area.

## Data display (current state)

Two patterns coexist during migration:

1. **Card rows** — bookings (`BookingsListCard`, `.booking-list-card` in `shell-content.css`). Intentional exception until table unification.
2. **HTML tables** — users, payments, logs via shadcn `ui/table`. Still wrapped in legacy `Card` + `rounded-md border` inside feature components. **Do not restyle tables when redesigning page chrome** — table centralization is a separate pass.

## Buttons & filters

- Primary actions in section headers: `Button size="sm" variant="outline"` or `default` — match Dashboard “New Booking”.
- Filter bars: sit directly under section header or inside the feature component; no extra card wrapper.
- Pagination: prefer shell-styled prev/next (see `BookingsListPagination`) over unused shadcn `ui/pagination`.

## Mobile

- Stat grid: horizontal scroll strip on small screens.
- Section headers: stack title and action on narrow viewports (`shell-section__header` flex-wrap).
- Segments: `ShellSegment` full-width on mobile (`shell-segment--full`).
- Booking cards: simplified mobile layout inside `BookingsListCard`; desktop keeps column grid.

## File map (current — transitional)

| Area | Files | Migration status |
|------|-------|------------------|
| Shell frame | `src/layouts/shell/shell.css` | **CSS** — migrate in Phase 4 |
| In-page layout | `src/layouts/shell/shell-content.css` | **CSS** — migrate in Phases 2–3 |
| React primitives | `ShellPage`, `ShellSection`, `ShellSegment`, etc. | **Mixed** — classes in CSS today |
| Exemplar page | `src/pages/Dashboard.tsx` | Uses CSS utility classes |
| Feature exemplar | `src/pages/Users.tsx`, `users/list/*` | **Tailwind** — target pattern |
| Design tokens (global) | `src/index.css` + `tailwind.config.ts` | **Canonical** — single source of truth |

---

## Styling strategy: CSS → Tailwind migration

### Problem

We currently maintain design in **two places**:

1. **Tailwind** — `tailwind.config.ts`, `className` on components (shadcn, users page chrome).
2. **Shell CSS** — `shell.css` + `shell-content.css` with hundreds of `shell-*` BEM classes.

That creates duplicate tokens (`--shell-divider` vs `border-black/[0.06]`), inconsistent refactors (users page migrated, dashboard still on CSS), and harder discoverability for agents and developers.

### Target state

| Layer | Where it lives |
|-------|----------------|
| **Tokens** | `src/index.css` `:root` + `tailwind.config.ts` `theme.extend` (one mapping) |
| **Layout & components** | Tailwind `className` on shell React components and pages |
| **Global base only** | `index.css` `@layer base` (resets, font smoothing) — no feature CSS |
| **Deleted** | `shell.css`, `shell-content.css` once migration completes |

**Rule for all new work:** use Tailwind classes on JSX. **Do not add** new rules to `shell.css` or `shell-content.css`.

### What to put in `tailwind.config.ts` first

Extend the theme once so migrations do not scatter magic values:

```ts
// tailwind.config.ts — theme.extend (planned)
colors: {
  shell: {
    text: 'rgba(28, 28, 32, 0.92)',
    muted: 'rgba(28, 28, 32, 0.5)',
    faint: 'rgba(28, 28, 32, 0.38)',
    brand: '#007aff',
    divider: 'rgba(0, 0, 0, 0.06)',
  },
},
borderRadius: {
  shell: '26px',      // --shell-card-radius
  'shell-segment': '10px',
},
spacing: {
  'shell-gutter': '14px',
  'shell-block': '16px',
  'shell-section': '28px',
},
```

Use `text-shell-muted`, `border-shell-divider`, `gap-shell-block`, etc. in components instead of raw CSS vars or one-off `black/[0.06]`.

### Migration phases

#### Phase 0 — Token consolidation (no visual change)
- [ ] Add `shell.*` tokens to `tailwind.config.ts` from existing CSS variables.
- [ ] Mirror key vars in `index.css` only where shadcn needs HSL (keep one comment linking to Tailwind names).
- [ ] Document token names in this file (table above).

#### Phase 1 — Shell React primitives (low risk, high reuse)
Migrate **class strings into components**; delete corresponding CSS blocks when done.

| Component | CSS file today | Notes |
|-----------|----------------|-------|
| `ShellPage.tsx` | `shell.css` | `max-width` width variants |
| `ShellSection.tsx` | `shell-content.css` | `ShellSectionHeader`, `ShellStat`, `ShellStatGrid` |
| `ShellSegment.tsx` | `shell-content.css` | Segmented control |
| `ShellLoading.tsx` | `shell.css` | Spinner / message |

**Done:** Users list chrome (`UsersListFilters`, etc.) — use as reference.

#### Phase 2 — In-page patterns (medium risk)
Migrate CSS classes used directly in pages/features:

| Pattern | Used in | Target |
|---------|---------|--------|
| `shell-divide-block` | `Dashboard.tsx` | Wrapper component or `flex flex-col gap-4 border-t border-shell-divider pt-7` utility |
| `shell-list` | `NotificationBell`, `RecentActivity` | Tailwind on list items; consider `ShellList` component |
| `shell-notif-*` | `NotificationBell.tsx` | Tailwind in component |
| `booking-list-card` | `BookingsListCard.tsx` | Tailwind on card root |

#### Phase 3 — Shell chrome (higher risk — test visually)
Migrate frame layout last; sidebar blur, sticky, collapse, and mobile drawer need careful QA.

| Area | File | Complexity |
|------|------|------------|
| Ambient background | `shell.css` | Fixed gradient — may keep one `@layer` block or arbitrary `bg-[...]` |
| Sidebar + nav | `ShellSidebar.tsx`, `ShellNav.tsx` | Frosted glass, collapse, flyouts |
| Header + icon buttons | `ShellHeader.tsx`, badges | SMS, notifications, sign out |
| Main card + gutters | `AppShell.tsx` | `shell-main`, `shell-card` |

#### Phase 4 — Cleanup
- [ ] Remove `import './shell.css'` / `import './shell-content.css'` from `AppShell.tsx`.
- [ ] Delete empty or redundant CSS files.
- [ ] Grep for remaining `shell-` class names in `src/` — must be zero.
- [ ] Update this doc: remove “transitional” labels; file map points to Tailwind only.

### Per-PR workflow (during migration)

When touching any file that uses `shell-*` classes:

1. **Move** styles to Tailwind on that component (use `cn()` + config tokens).
2. **Remove** the unused CSS rules from `shell.css` / `shell-content.css` in the same PR.
3. **Do not** add new CSS rules elsewhere to compensate.
4. **Verify** desktop + mobile for shell layout pages affected.

### What stays in CSS permanently (acceptable)

- `index.css` — Tailwind directives, shadcn `:root` HSL variables, safe-area utilities.
- Optional: one `@layer components` block **only** for truly global effects that Tailwind cannot express cleanly (e.g. complex multi-stop `shell-ambient` gradient) — document why in a comment.

### Anti-patterns (styling)

- Adding new `shell-*` rules to `shell-content.css` or `shell.css`.
- Duplicating the same color/spacing in CSS and Tailwind.
- Inline one-off hex values when a `shell.*` token exists in config.
- Migrating tables/booking row internals before shell primitives are stable (finish Phases 1–2 first).

---

## Migration checklist (new or redesigned page)

- [ ] Wrap in `ShellPage` with appropriate width
- [ ] Use `ShellSectionHeader` + dividers for each major section (Tailwind inside primitives, not raw `shell-divide-block` long-term)
- [ ] No nested `Card` wrappers for page sections
- [ ] Use **Tailwind + `tailwind.config` shell tokens** — not new CSS files or `shell-*` classes
- [ ] Use `ShellSegment` instead of shadcn `Tabs` for in-page switching
- [ ] Leave data tables/list innards unchanged until dedicated table pass

## Anti-patterns

- `Card` > `CardHeader` > `CardTitle` as the page layout structure
- `TabsList` with `grid w-full grid-cols-N` from shadcn defaults
- `space-y-6` + ad-hoc `max-w-*` on every page instead of `ShellPage`
- Duplicating shell header title as a second large heading
- Mixing legacy `rounded-3xl shadow-[0_8px_30px...]` with new flat shell sections on the same page
- **Adding new styles to `shell.css` / `shell-content.css`** instead of Tailwind (during migration)
