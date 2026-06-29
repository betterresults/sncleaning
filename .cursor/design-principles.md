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
| `ShellWorkspace` | Master/detail grid (SMS inbox, live chat) — mobile list ↔ detail via `detailActive` |
| `ShellPane` | Flat bordered panel inside a workspace — replaces shadcn `Card` for tool panes |
| `ShellFilterBar` | Search + filters row under a section header — no Card wrapper |
| `ShellAlertBanner` | Inline alert row (unread counts, ops warnings) on the shell surface |

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

## Styling source of truth

- **Canonical:** Tailwind `className` + `tailwind.config.ts` shell tokens + `index.css` (`--shell-*`, shadcn vars, collapsed-sidebar tooltips).
- **Do not add** new shell CSS files. New UI uses Tailwind only.

## Shell chrome

- **Sidebar:** full viewport height, sticky; not nested inside padded frame.
- **Main content:** gutter on top, right, bottom (`--shell-gutter`); sidebar flush left.
- **Header actions:** `ShellIconButton`, `ShellIconBadge` for bell / SMS / sign out.

## Data display (current state)

Two patterns coexist during migration:

1. **Card rows** — bookings (`BookingsListCard`, `bookingListCardClass()`). Intentional exception until table unification.
2. **HTML tables** — users, payments, logs via shadcn `ui/table`. Still wrapped in legacy `Card` + `rounded-md border` inside feature components. **Do not restyle tables when redesigning page chrome** — table centralization is a separate pass.

## Buttons & filters

- Primary actions in section headers: `Button size="sm" variant="outline"` or `default` — match Dashboard “New Booking”.
- Filter bars: sit directly under section header or inside the feature component; no extra card wrapper.
- Pagination: prefer shell-styled prev/next (see `BookingsListPagination`) over unused shadcn `ui/pagination`.

## Mobile

- Stat grid: horizontal scroll strip on small screens.
- Section headers: stack title and action on narrow viewports (`ShellSectionHeader` flex-wrap).
- Segments: `ShellSegment` full-width on mobile.
- Booking cards: simplified mobile layout inside `BookingsListCard`; desktop keeps column grid.

## File map

| Area | Files | Status |
|------|-------|--------|
| Shell frame | `AppShell.tsx`, `ShellSidebar.tsx`, `ShellNav.tsx`, `ShellHeader.tsx` | **Tailwind** |
| In-page layout | `ShellDivideBlock.tsx`, `ShellList.tsx` | **Tailwind** |
| Workspace tools | `ShellWorkspace.tsx`, `ShellPane.tsx`, `ShellFilterBar.tsx`, `ShellAlertBanner.tsx` | **Tailwind** |
| React primitives | `ShellPage`, `ShellSection`, `ShellSegment`, etc. | **Tailwind** |
| Exemplar page | `src/pages/Dashboard.tsx` | **Tailwind** |
| Feature exemplar | `src/pages/Users.tsx`, `users/list/*` | **Tailwind** |
| SMS feature | `src/features/sms/*` | **Split module** (visual redesign in PR 3) |
| Design tokens | `src/index.css` + `tailwind.config.ts` | **Canonical** |

---

## Styling strategy (migration complete)

Shell CSS files are **deleted**. All layout and chrome live in Tailwind on shell React components.

| Layer | Where it lives |
|-------|----------------|
| **Tokens** | `src/index.css` `:root` + `tailwind.config.ts` `theme.extend.shell` |
| **Layout & components** | Tailwind `className` on shell React components and pages |
| **Global base** | `index.css` `@layer base` (resets, mobile token overrides) |
| **Pseudo-element tooltips** | `index.css` `@layer components` — collapsed sidebar `[data-tooltip]` only |

**Rule for all new work:** use Tailwind classes on JSX. Do not add new shell CSS files.

### Token reference

| CSS variable | Tailwind utility examples |
|--------------|-------------------------|
| `--shell-text` | `text-shell-text` |
| `--shell-text-muted` | `text-shell-muted` |
| `--shell-text-faint` | `text-shell-faint` |
| `--shell-tint` | `text-shell-brand`, `border-shell-brand` |
| `--shell-divider` | `border-shell-divider` |
| `--shell-stat-*-fg/bg` | `text-shell-stat-brand`, `bg-shell-stat-brand-bg` |
| `--shell-gutter` | `p-shell-gutter`, `gap-shell-gutter` |
| `--shell-block-gap` | `gap-shell-block` |
| `--shell-after-divider` | `pt-shell-section`, `mt-shell-section` |
| `--shell-card-radius` | `rounded-shell` |
| `--shell-page-max` | `max-w-shell-default` |

### Migration phases (all complete)

| Phase | Scope | Status |
|-------|--------|--------|
| 0 | Token consolidation (`index.css` + `tailwind.config.ts`) | **Done** |
| 1 | `ShellPage`, `ShellSection`, `ShellSegment`, `ShellLoading` | **Done** |
| 2 | `ShellDivideBlock`, `ShellList`, notifications, booking cards | **Done** |
| 3 | `AppShell`, sidebar, nav, header, `ShellIconButton` | **Done** |
| 4 | Delete `shell.css` / `shell-content.css`, verify no legacy BEM classes | **Done** |

Key shell chrome files: `AppShell.tsx`, `ShellAmbient.tsx`, `ShellSidebar.tsx`, `ShellNav.tsx`, `ShellHeader.tsx`, `ShellIconButton.tsx`.

---

## Migration checklist (new or redesigned page)

- [ ] Wrap in `ShellPage` with appropriate width
- [ ] Use `ShellSectionHeader` + `ShellDivideBlock` for each major section
- [ ] No nested `Card` wrappers for page sections
- [ ] Use **Tailwind + `tailwind.config` shell tokens** — not new CSS files
- [ ] Use `ShellSegment` instead of shadcn `Tabs` for in-page switching
- [ ] Master/detail tools: `ShellWorkspace` + `ShellPane` (not nested `Card` panes)
- [ ] Filter rows: `ShellFilterBar` under `ShellSectionHeader` (not inside a Card)
- [ ] Leave data tables/list innards unchanged until dedicated table pass

## Anti-patterns

- `Card` > `CardHeader` > `CardTitle` as the page layout structure
- `TabsList` with `grid w-full grid-cols-N` from shadcn defaults
- `space-y-6` + ad-hoc `max-w-*` on every page instead of `ShellPage`
- Duplicating shell header title as a second large heading
- Mixing legacy `rounded-3xl shadow-[0_8px_30px...]` with new flat shell sections on the same page
- Adding new shell CSS files instead of Tailwind + `shell.*` tokens
