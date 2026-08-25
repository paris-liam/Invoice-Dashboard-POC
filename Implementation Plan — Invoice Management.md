# Invoice Management Implementation Plan

**Goal:** Extend `Payments.dc.html` per `Design Spec — Invoice Management.md`: a group-by control, four new/changed columns, and a static Invoice Analytics tab. Implements user stories 52724 and the applicable parts of 56066.

**Architecture:** Additive changes to the existing file. Port the group-by control and the analytics tab markup from `Draft Invoices.dc.html` (same patterns, new field names). New columns follow the existing measured-column machinery already in `Payments.dc.html` (`textWidth`, `cellMetrics`, `columnWidths`) — no new column mechanism needed.

**Tech Stack:** Deck Component runtime (`support.js`), FMS design system tokens, no build step.

## Global Constraints

- No test framework, no git. Verify with `python3 -m http.server 8754` and check `http://localhost:8754/Payments.dc.html` in a browser after every task.
- Console errors of the form `<path> attribute d: Expected moveto path command` are pre-existing baseline noise (one per templated `<path d="{{ … }}">`). Note the count at the start of Task 1; any new kind of error is a regression.
- `TODAY = '2026-08-13'`. Do not call `new Date()`.
- Money renders through `fmtMoney` only.
- Do not modify `Draft Invoices.dc.html`.
- Children rollup, Notes, and Enrollment Status are all **derived/mocked at data load**, not authored per-invoice by hand where avoidable — write a small helper and seed the minimum fields the helper needs.

---

## Task 1: Enrollment Status field + group-by control

**Files:** `Payments.dc.html`

**Interfaces:**
- Adds per invoice: `enrollmentStatus: 'Enrolled' | 'Waitlisted' | 'Withdrawn'`
- Adds state: `s.groupBy` (`'none' | 'family' | 'enrollment'`)
- Produces: `groupModes` render array (same shape as Draft Invoices'), group-header row insertion in `displayRows`

- [ ] **Step 1: Seed the field**
  Add `enrollmentStatus` to every object in `INVOICES`. Distribution should look real, not uniform — most `Enrolled`, a couple `Withdrawn` (e.g. give one to a family already carrying a past-due/failed-ACH invoice, so grouping by status surfaces something meaningful), one `Waitlisted`.

- [ ] **Step 2: Add `groupBy` state and the toolbar control**
  Port the `groupModes` button-row markup from `Draft Invoices.dc.html` (the `<sc-for list="{{ groupModes }}">` block and its containing div) into the Payments toolbar, ahead of the search field. Labels: `None`, `Family`, `Enrollment Status`. Port the corresponding `groupModes:` render-array construction from the Draft Invoices component logic, swapping the mode ids/labels.

- [ ] **Step 3: Group-header rows**
  When `s.groupBy !== 'none'`, insert a header row into `displayRows` before each new group (same navy/white treatment as Draft Invoices' family group headers), grouping by `family` or by `enrollmentStatus` respectively. Selection, expand/collapse, and existing filters (KPI tiles, search) all still apply per-invoice underneath the grouping — grouping only affects ordering/headers.

- [ ] **Checkpoint:** Load the page, cycle through all three group modes, confirm headers appear/disappear correctly and no existing filter or selection behavior regresses.

---

## Task 2: Payor Email, Children, Enrollment Status, and Notes columns

**Files:** `Payments.dc.html`

**Interfaces:**
- `COLUMNS` gains: `payorEmail`, `children`, `enrollmentStatus`, `notes` (inserted after `family`, before `dueDate`)
- Produces: `childrenOf(payor)`, `notesOf(inv)` pure helpers
- `PILL` gains entries for `Enrolled` / `Waitlisted` / `Withdrawn`

- [ ] **Step 1: Payor Email column**
  Copy the `payorEmail` column pattern from `Draft Invoices.dc.html` verbatim: `COLUMNS` entry, `cellMetrics` case, cell markup. Field already exists on every Payments invoice.

- [ ] **Step 2: `childrenOf(payor)` helper**
  Given a payor name, return every invoice in `INVOICES` sharing that `payor`, mapped to `{ child, amount }`. Single-invoice payors return a one-element array. Cell renders just the name for a one-element result (no rollup chrome for the common case); for multiple, render a compact `Name · Name` list, each with its amount if the measured width allows — measure the real rendered string with `textWidth`, same as every other column, so it doesn't drift row to row.

- [ ] **Step 3: Enrollment Status column**
  Add the three `PILL` entries. Column renders the pill exactly like the existing `statusLabel` column (reuse `pillStyle`).

- [ ] **Step 4: `notesOf(inv)` helper**
  Pure function on an invoice:
  - Count `payments` with `status === 'Failed'` → `"N failed ACH attempt(s)"` (singular/plural) if count > 0.
  - Else if `credits.length > 0` → summarize the most recent credit: `"Credit applied " + fmtMoney(-credit.amount)`.
  - Else `""`.
  Only one summary shown per invoice (failures take priority over credits — a failure is more actionable). Cell uses the same measured-width, capped-at-320px, ellipsis treatment as Draft Invoices' Notes column; empty string renders as blank, not a dash (nothing exceptional is the common case, unlike Draft Invoices where a dash was explicitly wrong for "no change").

- [ ] **Step 5: Column order + width recompute**
  Confirm `columnWidths(COLUMNS, all)` picks up all four new fields (it iterates `COLUMNS` generically, so no change needed there) and that `gridCols`/`fixedWidth` construction still lines up. Re-check the CSV export column list (`lines = ...`) — decide whether to add the new fields there too for consistency (recommended: yes, same order as the grid).

- [ ] **Checkpoint:** Load the page. Confirm all four columns render, widths don't drift between rows, a payor with siblings shows a real rollup, a payor without shows a bare name, and Notes is blank for the common case and populated for INV-1104 (seeded ACH failures) and any invoice with a seeded credit.

---

## Task 3: Invoice Analytics tab

**Files:** `Payments.dc.html`

**Interfaces:** Produces `#tab-btn-management` / `#tab-btn-analytics` and `#tab-management` / `#tab-analytics` toggling, ported unchanged from Draft Invoices.

- [ ] **Step 1: Port the tab switcher**
  Copy the two tab-button divs and their ids from Draft Invoices verbatim. Copy whatever inline script/behavior currently wires `tab-btn-management`/`tab-btn-analytics` clicks to toggling `#tab-management`/`#tab-analytics` display.

- [ ] **Step 2: Port the analytics tab markup**
  Copy the entire `#tab-analytics` block (KPI strip, pie chart + legend, aging bars, `Content to be added` placeholder) verbatim, including the "Static overview... Display-only, no data binding" comment. No value changes — same hardcoded numbers as Draft Invoices, since this is explicitly not wired to `INVOICES` in this pass.

- [ ] **Step 3: Wrap existing management-tab content**
  Wrap the current page body (toolbar, grid, everything) in `#tab-management`, matching Draft Invoices' `style="display:contents;"` wrapper, so the two tabs toggle correctly.

- [ ] **Checkpoint:** Load the page, switch to Invoice Analytics, confirm the KPI strip/pie/aging bars render identically to Draft Invoices' analytics tab, then switch back and confirm the management tab (grid, filters, selection) is unaffected.

---

## Task 4: Final verification pass

- [ ] Full click-through: group by each mode, search each category, sort each new column, open the invoice drawer from a grouped and ungrouped view, confirm selection scoping still excludes hidden rows under a filter + group combination.
- [ ] Confirm the console-error baseline from Task 1 hasn't grown.
- [ ] Confirm `Draft Invoices.dc.html` has no diff (untouched).
- [ ] Update `Session Handoff.md` with what shipped and any new open threads (e.g. Children column's width behavior with 3+ siblings, if it ever comes up).
