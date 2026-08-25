# FMS Design System

A design system extracted from the **Modernized FMS Application** — the Franchise Management System used by The Goddard School / Goddard Systems Inc. to manage their network of franchise schools.

> "FMS — The Franchise Management System" (page title from the source app)

## Source

| Source | Path / URL |
| --- | --- |
| Codebase (read-only mount) | `fms-modernized-webapp/` |
| Stack | React 19 + Vite + TypeScript |
| Component library | IBM **Carbon Design System** (`@carbon/react`, `@carbon/icons-react`) heavily themed via CSS variable overrides |
| Shell | `@gsl/component-library` web components (Goddard Systems Library) — provides `<gsl-shell>` |
| Tables | AG-Grid Enterprise |
| Type | **Quicksand** (300 / 400 / 500 / 700) — used everywhere, including code/mono |
| Brand mark | `assets/fms-icon.svg` — circular monogram in `--blueberry-pie--500` |

## Product context

FMS is a multi-tenant operational web app that franchise school owners, directors, and back-office staff use day-to-day. Its surface area:

- **Home / Dashboard** — Leads activity (Last 7 Days), Tours, Tasks, Alert Center, Upcoming Events (birthdays, separations, anniversaries), Quick Links to sister apps (Lead Center, Family Center, iGoddard, Brand Connect, School Performance Hub, Wonder of Learning Hub).
- **Children / Bulk Update** — AG-Grid driven enrollment management; bulk action modals for enrollment dates, deactivation, classroom changes.
- **Document Tracker** — required-reading workflow: send forms, send reminders, ready-for-review state.
- **Enrollment** — form-heavy workflow built on Formik / react-hook-form + Yup.
- **Global Search** — search bar in the shell that surfaces leads, families, children, employees.
- **School Picker / User Menu** — top-of-shell controls baked into `gsl-shell`.

The user is always operating in the context of a **selected school** (`activeSchool`). Every API call passes `SchoolId`. Permissions and roles gate which Quick Links, modules, and actions appear (RBAC component, `permissions.json`).

## Design philosophy

The codebase ships a single design-system file (`global-styles.scss`) that:
1. Defines a **candy/dessert-themed color system** (Blueberry Pie, Cotton Candy, Toasted Marshmallow, Gummy Sharks, Icy Pop, Cool Mint) with full 50→950 scales.
2. Themes Carbon (`--cds-*` variables) so that off-the-shelf Carbon components render in the FMS palette.
3. Uses Quicksand for **everything** including code blocks (overrides `--cds-code-02-font-family`).

The result is a soft, friendly app for non-technical users (school directors, admins) on top of an enterprise-grade component foundation. Rounded corners (12–35px), pill-shaped buttons, and the warm Quicksand letterforms soften what is otherwise a dense data app.

## Index

| File / folder | What's in it |
| --- | --- |
| `colors_and_type.css` | Tokens — colors, type, spacing, radii, shadows + semantic element styles |
| `fonts/` | Quicksand woff2 (Light / Regular / Medium / Bold) |
| `assets/fms-icon.svg`, `assets/fms-logo-light.png` | Brand mark + wordmark |
| `assets/icons/` | Nav-bar SVGs (Home, Leads, Families, Class Lists, Employees, Events, Reporting, Accounting, Administration, School) + entity icons (child, family, employee, lead, clock) |
| `assets/illustrations/` | Decorative SVGs (badge, birthday, transition, cancel) |
| `preview/` | Design System tab cards (color swatches, type specimens, components) |
| `ui_kits/webapp/` | High-fidelity recreation of the FMS Home dashboard + components (Card, CardStatLink, Tabs, Buttons, Alerts, Shell) |
| `SKILL.md` | Agent Skills entry point |

## CONTENT FUNDAMENTALS

**Voice.** Short, direct, operational — never marketing. Copy is written **for** people who already know the domain (school directors, owners). Acronyms (FMS, FTE, RBAC) are used freely; concepts like "Tours," "Leads," "Registered," "No Shows" are not glossed.

**Tense & person.**
- Headers and section labels are **noun phrases**: "Leads Activity (Last 7 Calendar Days)", "Tasks", "Tours", "Alert Center", "Upcoming Events", "Quick Links".
- Action buttons are **verbs in imperative**: "Mark Read", "Mark Unread", "Submit", "Send Reminder".
- Confirmations are written **about the user's school in second person**: "Be aware if you own multiple schools, please verify that you are accessing the school you intended to visit when reaching {AppName}." → conversational, mildly cautioning.
- Error / status reads as **declarative third-person**: "School Changed. This page has been refreshed to the most recent school selected: **{schoolName}**."

**Casing.**
- **ALL CAPS** for the eyebrow / section labels above a card group: `DASHBOARD`, `QUICK LINKS`. Also for primary action buttons inside Quick Links: `LEAD CENTER`, `FAMILY CENTER`, `BRAND CONNECT`.
- **Title Case** for card titles and modal headings: "Alert Center", "System Alert", "School Changed".
- **Sentence case** for tab labels, helper text, body copy: "Unread", "Last 6 Months", "No new alerts", "No alerts found".

**Tone signature phrases.**
- "No new alerts" / "No alerts found" — empty states are bare and matter-of-fact.
- "(Last 7 Calendar Days)", "(needs update)" — clarifying parentheticals after a label, lowercase.
- "Be aware..." — warning copy is gently phrased, not bossy.

**Pronouns.** "You" appears only in confirmation/warning copy that addresses the user. Most UI text is third person about the data ("3 New Leads", "1 Past Due (needs update)").

**Emoji.** **None.** The codebase contains zero emoji in product copy. Iconography is handled by SVGs and the Carbon icon set — never emoji.

## VISUAL FOUNDATIONS

**Color vibe.** Deep navy + sky blue + warm cream. The primary brand color, **Blueberry Pie 500** (`#002857`), carries virtually all foreground type, primary buttons, modal headers, and focus rings. **Cotton Candy 500** (`#0276CF`) is the bright accent — links, the "tertiary" Carbon button, "active" stat colors. **Toasted Marshmallow 500** (cream `#F3E6CE`) is the only non-white card surface; it is reserved for the **Alert Center** to give it visual weight on the right rail. **Gummy Sharks** (mint) and **Icy Pop / Cool Mint** (pale cyan) appear sparingly as outline accents on dashboard stats — never as full surface colors.

**Type.** Single family — **Quicksand** — across every weight including monospace contexts. Headings are bold, slightly tight (`line-height: 1`–`1.15`); body is 14px, line-height 1.5. There is no serif anywhere. The CSS overrides Carbon's `--cds-body-compact-01-font-weight` to `600`, so even body labels in form components render semibold.

**Layout.** Dashboard is a **two-column grid**: a flexible left content column (`max 72rem`) holding the Dashboard tile row + Upcoming Events, and a right rail (`min/max 18-25rem`) holding the Alert Center. Below `66rem` the shell collapses to mobile (modals go full-screen, navigation shifts).

**Backgrounds.** Pages sit on near-white (`--gray-1`). Cards are white. There are **no full-bleed photos, gradients, hand-drawn illustrations, or repeating textures** in the product chrome. The marketing-adjacent illustration assets that do exist (`badge.svg`, `birthday.svg`, `transition.svg`, `cancel.svg`) are simple flat geometric icons used as state imagery (e.g. error screens, upcoming events).

**Cards.** Soft and tactile.
- White surface OR Toasted Marshmallow surface.
- `border-radius: 5px` (`--radius-sm`) — subtle, not pillowy.
- `box-shadow: 0 2px 4px rgb(0 0 0 / 10%)` — single layer, minimal.
- Header is a flex row with title in `--blueberry-pie--500`, optional collapse chevron.
- Optional `Loading` overlay covers content area when fetching.

**Buttons.**
- Pill shape: `border-radius: 35px`.
- **Primary** = Blueberry Pie 500 fill, white text, **bold Quicksand**, **uppercase content** for Quick Links.
- **Secondary** = Toasted Marshmallow 500 fill, primary blue text.
- **Tertiary** = Cotton Candy 500 fill, white text.
- **Danger** = Danger 500 fill, white text.
- Always include a **Shine3** sparkle SVG icon to the left of Quick Link button labels (`<Shine3 size={12} color="white" />`).
- Icon-left layout via `display: flex; align-items: center;` with `svg { margin-right: var(--space-xs); }`.

**Inputs.** Border `1px solid var(--blueberry-pie--500)`, `border-radius: 10px`, label is **bold + Blueberry Pie**, helper text is also Blueberry Pie. Carbon's underline-only style is overridden everywhere — every input is a fully-bordered rounded rectangle.

**Modals.** Header is a **solid Blueberry Pie 500 bar**, `padding: var(--space-lg)`, white heading text, white close button (`1px solid white`, circular, `var(--space-lg)` square). Content area is white. Footer right-aligned with two pill buttons, primary footer button uses Cotton Candy 500 (overrides Carbon's default). On mobile (≤650px), modals go fullscreen and footer stacks vertically.

**Borders & focus rings.** Border colors converge on Blueberry Pie 500 — even input borders use it, not a neutral gray. Focus outline: `2px solid var(--blueberry-pie--500)` with a `var(--space-xxs)` (4px) offset.

**Shadows.** Three explicit elevations: `--shadow-sm` (subtle, cards), `--shadow-md` (dropdowns, popovers), `--shadow-lg` (top-level overlays). Shadow color is always plain black at low alpha (10–20%) — no colored glows.

**Corner radii.** A clear hierarchy:
- 2px (`--radius-xs`) — scrollbar tracks, fine details.
- 5px (`--radius-sm`) — **cards**.
- 10px — text inputs (set inline as `--input-border-radius`).
- 12px (`--radius-md`) — minor surfaces, pickers.
- 30px (`--radius-lg`) — tabs.
- **35px** — buttons (pill).

**Animation.** Quiet. Three transition speeds: `--transition-fast: 0.1s`, `--transition-normal: 0.2s`, `--transition-slow: 0.3s`, all `ease`. No bounces, no springs, no scale-up keyframes. Hover = `opacity: 0.8` (`--opacity-hover`). Disabled = `opacity: 0.5` (`--opacity-disabled`). The only "flair" element is the `Shine3` sparkle SVG used on Quick Links buttons — purely decorative.

**Hover / press states.**
- Hover: opacity `0.8`, OR a one-step lighter color (e.g. `--cotton-candy--300` over `--cotton-candy--500` for primary modal buttons).
- Press / Active: same lighter color or a one-step darker token (`--blueberry-pie--300` for primary buttons).
- Disabled: gray-3 background, gray-6 text, `cursor: not-allowed`, `pointer-events: none`.

**Transparency & blur.** Used sparingly. Loading overlay is `position: absolute; z-index: 200` over a card. Dropdown shadows use rgba black, not backdrop blur. No glassmorphism.

**Card stat treatment.** Each stat (`<CardStatLink>`) is a button or anchor with a colored **outline ring** and a **giant number** in a semantic color. The ring color, value color, and label color are each independently themable via CSS custom properties (`--stat-value-color`, `--stat-label-color`, `--stat-outline-color`) — set inline by the parent tile.

**Imagery vibe.** What little imagery exists in the app is **flat, brand-blue, geometric**. The brand favicon is a stylized circular monogram in solid `--blueberry-pie--500`. There are no photographs.

## ICONOGRAPHY

The app uses **three coexisting icon systems**:

1. **Carbon Icons** (`@carbon/icons-react`) — the primary in-product icon set. Used for chevrons (`ChevronUp`, `ChevronDown`), close, search, controls, all Carbon component-internal icons. Stroke style: 2px IBM Carbon, optical sizes 16/20/24/32. Color: `--cds-icon-primary` → `--blueberry-pie--500`.

2. **Custom SVG nav icons** in `public/images/nav-bar-images/` (copied here to `assets/icons/`) — one per top-level shell module: Home, Leads, Families, Class Lists, Employees, Events, Reporting, Accounting, Administration. Used inside the `<gsl-shell>` left rail. These are flat 2-color SVGs in brand blue.

3. **"Shine" custom icons** (`src/assets/shine-icons.tsx`) — branded one-off SVGs (`Shine3`, `ExclamationTriangleIcon`, `ExclamationCircleIcon`) used to add a touch of personality, especially on Quick Links buttons. The `Shine3` sparkle is a recognizable FMS motif — repeat usage on every Quick Link button.

**Entity icons** (`assets/icons/`): `child.svg`, `family.svg`, `lead.svg`, `employee.svg`, `clock.svg` — flat brand-blue glyphs used on dashboard tiles and search results.

**Decorative illustrations** (`assets/illustrations/`): `badge.svg` (achievements), `birthday.svg` (Upcoming Events), `transition.svg`, `cancel.svg` (error screens, e.g. `error-screen-separation.png`). Use these sparingly — they appear only on empty states and event widgets.

**Emoji.** **None.** Do not introduce emoji into FMS surfaces.

**Unicode-as-icon.** The codebase uses HTML entities sparingly inside text: `&#40;` and `&#41;` for parentheses around tour ages — not as decorative icons. Avoid using unicode glyphs as icon substitutes.

**Icon weight + style.**
- Carbon Icons → IBM stroke (~1.5–2px), monochrome `currentColor`.
- Nav SVGs → flat 2-color illustration style.
- Shine icons → playful filled glyphs in white-on-color (used on dark/colored buttons).

**When in doubt:** prefer Carbon Icons React for any UI control or affordance icon. Use the custom SVGs only when matching the existing module-nav or dashboard look.

## CAVEATS / ASKS

- The **Shine3** sparkle and **ExclamationTriangle/Circle** "shine" icons live in a TSX file (`shine-icons.tsx`) — we did not extract their literal SVG paths into standalone files. The UI kit reproduces a close approximation. **If you can paste the contents of `shine-icons.tsx`, we'll wire the originals in.**
- Some illustrations are PNG (`error-screen-*.png`) and were not copied — the design system focuses on chrome, not error-state art.
- Carbon component theming is faithfully recreated in CSS, but we do not load `@carbon/styles` itself in the kit — components are rebuilt as static JSX.
