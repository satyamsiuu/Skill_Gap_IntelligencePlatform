# Skill Gap Intelligence Platform (SGIP)

## Document 4 — Frontend Specification Document

**Version:** 0.1 (Founding Architecture Draft)
**Companion to:** Document 2 (Technical Architecture), Document 1 (PRD)

---

## 1. Design Philosophy

The source brief asks for "Linear, Stripe Dashboard, Vercel, Notion, Apple Intelligence" as inspirations while explicitly rejecting glassmorphism, neumorphism, claymorphism, and "crypto dashboard" aesthetics. Taken together, these references converge on one underlying principle that we adopt as SGIP's design thesis:

> **The interface should feel like an instrument, not a poster.** Every screen exists to answer "where do I stand, and what do I do next" — so density, hierarchy, and restraint matter more than ornamentation. The one place SGIP is allowed to feel "alive" is the **readiness score** itself — the platform's single most important number — which becomes the signature visual element (Section 3.4).

This has direct consequences:

- **Data and numbers are typographically distinct from prose** (Section 4.3) — this is how Stripe and Linear signal "this is a measurement, trust it" without extra chrome.
- **Color is functional before it is decorative.** The only place SGIP uses a multi-color gradient ("aurora," per the brief) is tied to the readiness score and a few hero/empty-state moments — never as generic page background texture, which is the most common way "AI SaaS" UIs start to look templated and is explicitly what the brief warns against.
- **Motion is confirmatory, not decorative** (Section 17) — it tells the user "your change was registered" (e.g., the readiness ring animating to its new value), never "look how smooth this app is."

---

## 2. Design System Recommendations

**Foundation**: ShadCN UI (per source brief) on top of Tailwind CSS, with a **customized theme layer** — using ShadCN's default theme out of the box is the single fastest way to look like "a college project built from a template," which the brief explicitly rejects. The customization is concentrated in:

1. A bespoke **color token set** (Section 3) replacing ShadCN's default slate/zinc palette.
2. A **type scale and font pairing** (Section 4) not used by ShadCN's default demos.
3. A small set of **signature custom components** (Section 9) that no ShadCN install ships with — the Readiness Ring, the Skill Proficiency Chip, and the Gap Report Matrix — which is where SGIP's visual identity actually lives.

Everything else (buttons, inputs, dialogs, tables, tabs, dropdowns) uses ShadCN primitives with the token overrides applied, which keeps implementation velocity high (the brief's "implementation-ready" goal) while still producing a distinctive result.

---

## 3. Color System

### 3.1 Why Not the Default "Near-Black + One Bright Accent" Look

A near-black background with a single neon accent is the most common pattern for "AI dashboard" UIs right now, to the point of being a visual cliché. SGIP's brief asks for "subtle aurora gradients" (plural colors) and explicitly cites Notion and Apple Intelligence — both of which use **warmer, slightly desaturated darks** and **multi-hue but low-saturation accents**, not pure black with neon. We follow that direction, and additionally give the palette a _functional_ reason to use more than one accent: **the readiness-band semantic colors are core to the product**, not decoration, so the palette is built around them from the start.

### 3.2 Neutral / Surface Scale (Dark Mode — Default Theme)

| Token              | Hex       | Usage                                              |
| ------------------ | --------- | -------------------------------------------------- |
| `--canvas`         | `#0B0D10` | App background                                     |
| `--surface`        | `#13161B` | Cards, panels, sidebar                             |
| `--surface-raised` | `#1B1F26` | Modals, popovers, dropdowns, hover states on cards |
| `--border-subtle`  | `#22262E` | Hairline dividers, card borders                    |
| `--border-strong`  | `#343B47` | Input borders, focus-adjacent borders              |
| `--text-primary`   | `#F2F4F7` | Headings, primary content                          |
| `--text-secondary` | `#9AA4B2` | Supporting text, labels                            |
| `--text-tertiary`  | `#646E7C` | Placeholder, disabled, metadata timestamps         |

### 3.3 Accent / Brand

| Token               | Hex                       | Usage                                               |
| ------------------- | ------------------------- | --------------------------------------------------- |
| `--accent`          | `#6E6AF6` (indigo-violet) | Primary buttons, active nav item, links, focus ring |
| `--accent-hover`    | `#857FFF`                 | Hover state for accent elements                     |
| `--accent-muted-bg` | `#6E6AF6` at 12% opacity  | Selected-row backgrounds, subtle highlights         |

### 3.4 The Aurora Gradient — Tied to a Signature Element, Not Page Backgrounds

| Token      | Stops                                                  | Usage                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--aurora` | `#6E6AF6 → #9F6BFF → #4FD1C5` (indigo → violet → teal) | **Reserved for**: (a) the Readiness Ring's progress arc at high scores, (b) the empty-state/onboarding hero illustration background (very low opacity, ~6–10%), (c) the login/register page background wash. **Never** used as a generic card background or repeated across every page — this restraint is what keeps it "subtle" per the brief rather than becoming visual noise. |

### 3.5 Semantic / Readiness-Band Colors

These are **functional first** — they encode the gap-report classification (Document 2 §4.5: MATCHED / PARTIAL / MISSING) and the readiness score bands. Chosen for AA contrast against `--surface` and `--canvas`, and distinguishable for the most common forms of color vision deficiency (avoiding a pure red/green pairing as the _only_ signal — paired with icons/text per Section 16).

| Token                 | Hex                                                                                     | Meaning                                    | Pairing          |
| --------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------- |
| `--status-strong`     | `#3DD68C` (emerald)                                                                     | Readiness ≥ 75 / `MATCHED`                 | Checkmark icon   |
| `--status-developing` | `#F2B84B` (amber)                                                                       | Readiness 40–74 / `PARTIAL`                | Half-circle icon |
| `--status-attention`  | `#F2706B` (coral-red, slightly warmer than pure red to fit the dark-warm neutral scale) | Readiness < 40 / `MISSING`                 | X / dash icon    |
| `--status-neutral`    | `#646E7C`                                                                               | Not yet assessed / no target role selected | Dash icon        |

### 3.6 Light Mode

Source brief specifies "dark mode first," not "dark mode only." A light theme is **recommended for MVP** (not deferred) because institutional/placement-office users (PRD Persona "Mr. Rao") often present dashboards on shared screens/projectors where light mode is preferred, and because accessibility audits (Section 16) are easier to pass with a light theme available as an alternative for low-vision users sensitive to dark UIs. The light theme is a **direct token inversion** (surfaces lighten, text darkens, accent and semantic hues are slightly deepened for contrast on light backgrounds) — not a separate design effort, keeping cost low while meeting both the brief's primary directive and a real usability need.

---

## 4. Typography System

### 4.1 Font Pairing

| Role                                                      | Typeface                                       | Rationale                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Display / Headings**                                    | **Geist Sans**                                 | A geometric, slightly condensed sans with strong presence at large sizes — ties directly to the Vercel reference point in the brief without being a literal Inter clone (avoiding the "every AI SaaS uses Inter for everything" sameness).                                                                                                                                                                           |
| **Body / UI text**                                        | **Inter**                                      | Best-in-class legibility at small sizes (13–15px), the de facto standard for Linear/Notion-style dense UIs — used here specifically for body copy, table cells, and form labels where legibility matters more than character.                                                                                                                                                                                        |
| **Data / Numeric (scores, percentages, IDs, timestamps)** | **Geist Mono** (or JetBrains Mono as fallback) | **This is the signature typographic decision.** Rendering the readiness score, proficiency numbers, and table-cell numerics in a monospace face gives them a "measured instrument" quality — consistent with Stripe's dashboard treatment of financial figures — and visually separates "facts the system computed" from "text a human wrote," reinforcing the deterministic-score trust message from Document 1 §1. |

### 4.2 Type Scale

| Token        | Size / Line-height | Weight           | Usage                                              |
| ------------ | ------------------ | ---------------- | -------------------------------------------------- |
| `display-lg` | 40px / 48px        | 600 (Geist)      | Hero headline (landing, onboarding)                |
| `display-md` | 28px / 36px        | 600 (Geist)      | Page titles ("Your Roadmap: Full Stack Developer") |
| `heading-md` | 20px / 28px        | 600 (Geist)      | Section headings, card titles                      |
| `heading-sm` | 16px / 24px        | 600 (Geist)      | Sub-section headings, table group headers          |
| `body-md`    | 14px / 22px        | 400 (Inter)      | Default body text                                  |
| `body-sm`    | 13px / 20px        | 400 (Inter)      | Secondary text, helper text                        |
| `caption`    | 12px / 16px        | 500 (Inter)      | Labels, badges, metadata                           |
| `data-lg`    | 36px / 40px        | 500 (Geist Mono) | Readiness score (hero number)                      |
| `data-md`    | 18px / 24px        | 500 (Geist Mono) | In-table scores, proficiency values, percentages   |
| `data-sm`    | 12px / 16px        | 500 (Geist Mono) | Timestamps, IDs in admin tables                    |

### 4.3 Numeric Formatting Convention

All readiness scores, percentages, and proficiency values render in `Geist Mono` with **tabular figures enabled** (`font-variant-numeric: tabular-nums`) so columns of numbers in tables (admin cohort views, Section 9.5) align vertically — a small detail that strongly signals "enterprise data tool" rather than "marketing site."

---

## 5. Layout System

- **Base spacing unit**: 4px, with a primary working scale of 8/12/16/24/32/48/64px (Tailwind's default scale aligns well — no custom spacing scale needed, reducing config overhead).
- **Grid**: 12-column responsive grid for dashboard/admin pages; content max-width of 1440px on ultra-wide displays (cards reflow to additional columns rather than stretching indefinitely — important for the cohort/admin views which are the most likely to be viewed on large external monitors).
- **Card system**: all data containers (`--surface` background, `--border-subtle` 1px border, 12px border-radius — moderate, **not** the very large radii common in "playful" or neumorphic UIs, consistent with the brief's restraint). Internal padding 24px desktop / 16px mobile.
- **Persistent layout shell**: left sidebar (Section 7) + top bar + main content area, consistent across all student and admin authenticated routes — matches the Linear/Vercel dashboard convention the brief calls out.

---

## 6. Responsive Strategy

| Breakpoint | Width    | Layout Behavior                                                                                        |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `sm`       | ≥ 640px  | Single-column content; sidebar becomes a slide-over drawer triggered by a top-bar menu icon            |
| `md`       | ≥ 768px  | Two-column where applicable (e.g., gap report table + roadmap side panel collapses to stacked)         |
| `lg`       | ≥ 1024px | Persistent collapsed icon-rail sidebar (72px) appears; main dashboard shows 2–3 card columns           |
| `xl`       | ≥ 1280px | Full sidebar (260px) by default; 3–4 card columns; admin tables show full column sets                  |
| `2xl`      | ≥ 1536px | Content max-width caps at 1440px, centered, with increased card gutters rather than additional density |

**Mobile-specific note**: the Readiness Ring (Section 9.1) and Gap Report Matrix (Section 9.2) are the two components most at risk of becoming illegible on narrow screens. The Ring scales down to a compact "pill" variant (score + label inline) below `md`; the Matrix becomes a **vertically grouped list** (one card per requirement, grouped by MATCHED/PARTIAL/MISSING) rather than a horizontally-scrolling table — horizontal scroll on a primary data view is treated as a layout failure, not an acceptable fallback.

---

## 7. Navigation Architecture

### 7.1 Student Shell

- **Left sidebar** (full at ≥1280px, icon-rail at 1024–1279px, drawer below 1024px):
  - Dashboard
  - My Skills
  - Target Roles
  - Documents (Resume / Certificates / Projects)
  - Progress (readiness history)
  - — divider —
  - Settings / Profile
- **Top bar**: contextual page title (left), global skill/role search (center — opens a command-palette-style search, ⌘K, consistent with Linear's pattern and a strong fit for "search canonical skills/roles" being a frequent action), notification bell (async job completions — "Resume processed, 6 skills suggested"), avatar/account menu (right).
- **Within "Target Roles"**: selecting a role navigates to a role-scoped sub-view (`/roles/[roleId]`) with its own secondary tab bar: **Overview** (readiness + gap report) / **Roadmap** / **History**.

### 7.2 Admin Shell

- Same shell pattern, different sidebar items, to reinforce "one product" rather than "bolted-on admin panel" (a common tell of non-premium platforms):
  - Dashboard (platform health)
  - Normalization Queue _(badge showing pending count — this is the single most important admin call-to-action, per PRD Document 1 §7 Success Metrics)_
  - Skills (taxonomy)
  - Roles & Requirements (taxonomy)
  - Users
  - Audit Log
  - AI Usage
  - Settings
- **Breadcrumb bar** appears for nested admin views (e.g., Roles & Requirements → "Full Stack Developer" → Requirement Set v3) — admin data has more depth than student-facing pages, so breadcrumbs are an admin-only navigation element, not duplicated in the student shell where it would be unnecessary chrome.

---

## 8. Page Hierarchy

| Route                                                     | Purpose                                                    | Primary Components                                                                                                 |
| --------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/login`, `/register`, `/verify-email`, `/reset-password` | Auth flows                                                 | Auth form, aurora-wash hero panel (Section 3.4)                                                                    |
| `/onboarding`                                             | First-run wizard (profile → skills → resume → target role) | Multi-step wizard, progress indicator                                                                              |
| `/dashboard`                                              | Student home — summary across all target roles             | Readiness Ring(s) (one per active target role, up to 3 per PRD Open Q3), recent activity, roadmap progress summary |
| `/skills`                                                 | Manage skill list                                          | Skill Proficiency Chips, add-skill search/autocomplete                                                             |
| `/roles`                                                  | Browse/select target roles                                 | Role cards with embedded mini readiness preview                                                                    |
| `/roles/[roleId]` (Overview)                              | Gap report for one role                                    | Readiness Ring (large), Gap Report Matrix, AI explanation panel                                                    |
| `/roles/[roleId]/roadmap`                                 | Roadmap for one role                                       | Roadmap Timeline (Section 9.3)                                                                                     |
| `/roles/[roleId]/history`                                 | Readiness trend                                            | Trend line chart, snapshot list                                                                                    |
| `/documents`                                              | Resumes, certificates, projects                            | Upload cards, processing-status indicators                                                                         |
| `/profile`                                                | Profile & account settings                                 | Form, session management (Document 3 §5)                                                                           |
| `/admin/dashboard`                                        | Platform health                                            | KPI cards, AI usage summary, queue depth                                                                           |
| `/admin/normalization-queue`                              | Review pending skill/role candidates                       | Review Card (Section 9.4)                                                                                          |
| `/admin/skills`, `/admin/roles`                           | Taxonomy CRUD                                              | Data tables, alias managers                                                                                        |
| `/admin/roles/[roleId]/requirements`                      | Requirement set editor (versioned)                         | Requirement table editor, version history                                                                          |
| `/admin/users`                                            | User management                                            | Data table, user detail drawer                                                                                     |
| `/admin/audit-log`                                        | Audit trail                                                | Filterable data table                                                                                              |
| `/admin/settings`                                         | PlatformConfig, AI provider config                         | Settings form groups                                                                                               |

---

## 9. Component Inventory

### 9.1 Readiness Ring (Signature Component)

A circular progress indicator (SVG arc) showing the readiness score (0–100). The arc fill uses the semantic band color (Section 3.5) for solid bands, transitioning to the **aurora gradient** (Section 3.4) only when score ≥ 90 — a small "delight" moment reserved for genuinely high achievement, not handed out for every score, which keeps it meaningful. Center displays the score in `data-lg` (Geist Mono). Below the ring: role name + "as of [date]" timestamp. Always paired with a text label of the band ("Developing," "Strong," etc.) — never color alone (Section 16).

### 9.2 Gap Report Matrix

Replaces a plain table for the matched/partial/missing breakdown (Document 2 §4.5). Grouped into three collapsible sections (Required / Important / Nice-to-Have — matching `RoleRequirement.importance`), each row showing: skill name, status icon + label (Section 3.5), target proficiency vs. current proficiency (shown as two small marks on a 1–5 segmented bar — a compact, scannable proficiency-gap visualization), and a "View resources" link into the Roadmap if the item is PARTIAL/MISSING.

### 9.3 Roadmap Timeline

A vertically-ordered list (priority order per Document 2 §4.5's roadmap prioritization), each item a card with: skill name, current status (TODO/IN_PROGRESS/DONE — a ShadCN `Badge`), AI-suggested resources (when available — see "AI Insight" treatment, Section 9.6) or curated-default resources (fallback), and a status-change control. Completing an item opens a small confirmation dialog ("Update your React proficiency to Intermediate?") — never a silent auto-update, per FR-ROADMAP-03.

### 9.4 Normalization Review Card (Admin)

Shows: the candidate text (skill or role), the proposed canonical match with similarity score (visualized as a horizontal bar, not just a number — admins scanning a queue benefit from a quick visual sense of "close call" vs. "clear miss"), optional AI disambiguation note (Section 9.6 treatment), and three primary actions: **Approve as new**, **Merge as alias**, **Reject** (Document 2 §6.3 Step 5). Bulk-select + bulk-reject supported for queue-management at scale (Document 3 T3 mitigation).

### 9.5 Standard Data Table (Admin)

ShadCN `Table` + TanStack Table for sorting/pagination/column visibility. All numeric columns right-aligned, `data-md`/`data-sm` Geist Mono (Section 4.3). Row-level actions in a trailing kebab menu. Used for: Skills, Roles, Users, Audit Log.

### 9.6 "AI Insight" Treatment (Cross-Cutting Pattern)

Any content generated asynchronously by the AI Gateway (score explanations, roadmap resource suggestions, normalization disambiguation notes — Document 2 §7) is visually distinguished with: a small `--accent`-colored "AI" label/icon in the corner of the content block, and a **subtle left border accent** (2px, `--accent`) rather than a full background fill — so it reads as "an annotation on top of real data," never as if the AI generated the underlying fact. While the job is pending, the space shows a **skeleton shimmer scoped only to that block** (Section 14) — the surrounding deterministic content (score, gap report) is fully interactive immediately, reinforcing Document 2 §7.3's "deterministic-first, AI-as-enhancement" pattern visually, not just architecturally.

### 9.7 Skill Proficiency Chip

A small pill component: skill name + a 5-segment proficiency indicator (filled segments = proficiency level) + a source indicator (small icon distinguishing `SELF` vs `AI_CONFIRMED` per FR-SKILL-03 — transparency about provenance). Clicking opens an inline editor (segmented control for proficiency 1–5, remove action).

### 9.8 Standard ShadCN Primitives (Themed)

Button, Input, Select, Combobox/Command (search/autocomplete — heavily used given the taxonomy-search-centric nature of the product), Dialog, Sheet (mobile drawers), Tabs, Badge, Tooltip, Toast (for async-job notifications), Progress, Skeleton, Avatar, DropdownMenu, Form (with `react-hook-form` + `zod` integration matching Document 2's schema-validation approach end-to-end).

---

## 10. Dashboard Design (Student `/dashboard`)

**Layout (desktop, 3-column grid)**:

- **Row 1**: One Readiness Ring card per active target role (up to 3 — PRD Open Question #3), each clickable through to `/roles/[roleId]`. If zero target roles selected, this row is replaced by an empty-state (Section 15) prompting role selection.
- **Row 2, left (2 cols)**: "Continue your roadmap" — top 3 highest-priority TODO/IN_PROGRESS roadmap items across all target roles, each a compact card with a direct action.
- **Row 2, right (1 col)**: "Recent activity" feed — skill added, resume processed, snapshot recalculated, roadmap item completed — timestamped (`data-sm` Geist Mono timestamps).
- **Row 3 (full width)**: Readiness trend chart (multi-line, one line per target role) over the last 90 days — uses Recharts, line colors matching each role's assigned accent from a small rotating palette derived from `--accent` variants (not the semantic status colors, to avoid implying the _line color itself_ represents a score band).

**Admin Dashboard (`/admin/dashboard`)** mirrors this structure with platform-scoped KPIs: total students, normalization queue depth (with direct link — Section 7.2), AI usage/cost summary (last 24h, with circuit-breaker status indicator per Document 2 §7.1), and recent audit log entries.

---

## 11. State Management Strategy (Frontend-Specific Summary)

Covered architecturally in Document 2 §8.2 (TanStack Query for server state, scoped Zustand for multi-step flows, no optimistic updates on the readiness score itself). From a UI-spec perspective, the practical implication is: **every component that displays a number derived from `ReadinessSnapshot` subscribes directly to the relevant TanStack Query cache entry** — there is no local "copy" of the score held in component state that could drift from the server value, even momentarily during a re-render.

---

## 12. API Integration Strategy (Frontend-Specific Summary)

Per Document 2 §8.3, a generated typed client provides request/response types. UI-relevant convention: **every data-fetching component declares its loading, error, and empty states as three separate, explicitly-designed render branches** (Sections 14–16) — "just don't render anything" is not an acceptable fourth state for any component that fetches data, including small widgets (e.g., a Skill Proficiency Chip's inline editor still has a loading state while saving).

---

## 13. Loading States

- **Page-level navigation**: Next.js route-level `loading.tsx` skeleton screens that mirror the target page's card layout (not a generic full-page spinner) — e.g., navigating to `/roles/[roleId]` shows a skeleton Readiness Ring + skeleton Gap Report Matrix rows, so the layout doesn't "pop" once data arrives.
- **In-place data refresh** (e.g., after adding a skill, the readiness score recalculates): the Readiness Ring shows a brief (≤400ms minimum, to avoid flicker on fast responses) **pulse/glow** on its border while TanStack Query refetches — distinct from the skeleton pattern, signaling "updating," not "first load."
- **AI-enhancement loading** (Section 9.6): scoped skeleton shimmer on the specific AI-insight block only, never blocking the surrounding deterministic content.

---

## 14. Error States

- **Form-level errors**: field-level messages directly beneath the input (red text, `--status-attention`, with an icon — per Document 3 §9's field-level validation errors), plus a summary banner at the top of long forms (e.g., the requirement-set editor) listing all errors with anchor links — important for the admin's data-entry-heavy screens.
- **Page-level errors** (API failure, e.g., 500): a dedicated error component (not a raw error/stack trace) with: a plain-language message ("We couldn't load your roadmap right now"), a retry button, and — for AI-dependent content specifically — a **distinct, calmer message** ("AI suggestions are temporarily unavailable — your readiness score and gap report are unaffected") to actively reinforce the platform's AI-independence guarantee (Document 1 §6 NFR) at the moment it's most relevant to a user's trust.
- **403/permission errors**: redirect to an "Access restricted" page rather than a raw error — relevant given Document 3's resource-ownership checks may produce 403s for legitimate users hitting stale links (e.g., a deactivated target role).

---

## 15. Empty States

Per the frontend-design guidance, empty states are "an invitation to act," not a dead end:

| Context                                                              | Empty State Treatment                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No skills added yet                                                  | Illustration + "Add your first skill to start building your profile" + prominent search/add control — this is the very first empty state a new user sees and should feel inviting, using the aurora wash (Section 3.4) sparingly here                  |
| No target role selected                                              | "Choose a role to see your readiness score" + role search, possibly with 2–3 "popular roles" quick-select chips (admin-curated list)                                                                                                                   |
| Gap Report Matrix with zero MISSING/PARTIAL items (i.e., 100% ready) | A genuinely celebratory but **restrained** state — not confetti/animation-heavy (brief: avoid "excessive animations") — a single subtle aurora accent + "You meet all requirements for [Role]. Consider a new target role to keep growing." with a CTA |
| Normalization queue empty (admin)                                    | "Nothing pending review — the taxonomy is up to date" — reinforces to admins that an empty queue is a _good_ state, not a broken page                                                                                                                  |
| No documents uploaded                                                | Upload prompt with brief explanation of what each document type is used for (resume → AI skill suggestions; certificates → evidence tags)                                                                                                              |

---

## 16. Accessibility Requirements

- **WCAG 2.1 AA minimum** (Document 1 NFR). Concretely:
  - All semantic status colors (Section 3.5) meet ≥4.5:1 contrast against their typical background (`--surface`/`--canvas`) and are **never the sole indicator** — every status uses an icon + text label in addition to color (Sections 9.1, 9.2).
  - Visible keyboard focus rings on all interactive elements, using `--accent` at full opacity with sufficient offset to be visible against both `--surface` and `--surface-raised`.
  - The Readiness Ring (SVG) includes an `aria-label` with the full textual readout ("Readiness for Full Stack Developer: 68 out of 100, Developing") — the visual ring is decorative from a screen-reader perspective; the label carries the information.
  - The command-palette search (⌘K, Section 7.1) is fully keyboard-operable and announces result counts to screen readers.
  - Skeleton/loading states use `aria-busy` and `aria-live="polite"` regions for async-content arrival (e.g., AI insight appearing) so screen reader users aren't surprised by content changing without an announcement.
- **Reduced motion**: all animations (Section 17) respect `prefers-reduced-motion: reduce` — ring-fill animations and pulse/glow effects become instant state changes rather than being removed entirely (the _information_ — "this updated" — should still be conveyed, just not via motion; e.g., a brief border-color flash instead of a pulse animation).

---

## 17. Animation Guidelines

Per the brief's "avoid excessive animations" and "elegant motion design," animation in SGIP is restricted to a short, deliberate list — anything not on this list should default to **no animation**:

1. **Readiness Ring fill animation**: on initial load and on score change, the arc animates from its previous value to its new value over ~600ms with an ease-out curve — this is the platform's single most important "feels alive" moment and is reserved for this component.
2. **Page transitions**: none beyond Next.js's default — no custom route-transition animations (a common "AI SaaS" tell that the brief implicitly warns against via "crypto dashboard aesthetics").
3. **Hover micro-interactions**: subtle (150ms) background/border color transitions on interactive cards and table rows — standard, not novel, intentionally unremarkable.
4. **Toast notifications** (async job completions): slide-in/fade, standard ShadCN/Radix defaults — no custom choreography.
5. **AI-insight arrival** (Section 9.6): a brief (~300ms) cross-fade from skeleton to content — communicates "this just arrived" without drawing excessive attention.

No scroll-triggered reveals, no parallax, no animated gradient backgrounds (the aurora gradient, per Section 3.4, is static or appears only on the small set of components listed — it does not shift/animate continuously, which would read as "ambient decoration" rather than the restrained, functional use the brief calls for).
