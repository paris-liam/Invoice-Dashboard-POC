# Invoice Dashboard POC — project context

Early demo of a childcare billing product, headed for Figma files including states. Two Deck Component (`.dc.html`) pages:

- **`Draft Invoices.dc.html`** — the approval queue. Per-payor draft invoices, approve/deny with a review queue, invoice and family drawers.
- **`Payments.dc.html`** — issued invoices and their payment lifecycle. Invoice rows expand to payment rows; record/deposit/refund/delete payments, apply credits, chase past due and ACH failures. Replaced `Accounting Dashboard.dc.html`, which was deleted 2026-08-13.

Both were complete and browser-verified as of 2026-08-13. The two pages share the same grid machinery, drawer, menus and modal chrome — Payments was built by copying Draft Invoices.

**Read `Session Handoff.md` first** — full state, open threads, and how to serve. Also see `UX Review — Draft Invoices.md` (decisions written into each `Decision:` line), plus a design spec and implementation plan per page.

No test framework — verification is browser checks against `python3 -m http.server` (see gotchas below).

## `.dc.html` gotchas

Non-obvious constraints when editing these prototype files:

- **Must be served over HTTP.** `support.js` and the `_ds/` bundle load by relative path; `file://` fails.
- **Console errors of the form `<path> attribute d: Expected moveto path command` are benign** — one per templated `<path d="{{ … }}">`, from the browser parsing the raw template before hydration. Currently three in Draft Invoices. Any *other* error is real.
- **Every table row is its own grid**, so `max-content` column tracks drift row to row. Widths must be explicit numbers — Draft Invoices measures real strings with canvas `measureText` and remeasures on `document.fonts.ready`.
- `style-hover` / `style-*` attributes compile to generated CSS classes and only accept literal strings, not `{{ }}` objects.
- A `null` event handler is treated as no handler — that's how inert buttons are done.
- Popovers inside the scrolling grid get clipped; anchor them `position:fixed` from `getBoundingClientRect()` instead.
- Z-order that works: scrim 1150 → drawer 1151 → menus 1160 → modals 1200 → toast 1300. Menus must outrank the drawer or a menu opened inside it is unclickable; modals must outrank the scrim or its backdrop swallows their clicks. Both were real bugs.

## How Liam wants design work run

On design work, Liam asks for clarifying questions and UX guidance *before* building, then wants a spec, then an implementation plan, then execution. He answers batched multiple-choice questions readily and picks the recommended option most times. He prefers inline execution over subagents.

**Why:** he's iterating toward Figma files, so the reasoning behind each state matters as much as the built artefact — the docs are deliverables, not overhead.

**How to apply:** lead with a short, opinionated UX read (including pushback where a request conflicts with an earlier decision — he takes it well and sometimes reverses himself), then ask 3–4 tightly-scoped questions in one batch rather than one at a time. State judgement calls made on his behalf rather than asking about everything. He gives terse mid-flight corrections ("swap X and Y", "make it more opaque") and expects them applied without re-litigation.
