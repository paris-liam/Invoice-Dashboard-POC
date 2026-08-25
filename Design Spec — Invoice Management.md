temp change

# Design Spec — Invoice Management

Scope: additions to `Payments.dc.html` implementing user stories **52724** (Invoice List) and the applicable parts of **56066** (Header Section). Adds a grouping control, three columns, and a static Invoice Analytics tab. Does not touch `Draft Invoices.dc.html`.

Prototype context: early demo, converting to Figma files including states.

---

## 1. Decisions carried in from review

- **Children column is a display-only rollup, not a data merge.** Invoices stay one-per-payor-per-child, exactly as today. The column groups a payor's sibling invoices (same `payor`, same billing period) for display; it does not change `INVOICES`, payment math, balances, or the family drawer.
- **Payments-only.** `Draft Invoices.dc.html` keeps its existing grouping (None/Family/Enrollment change) and column set, untouched.
- **Enrollment Status is a new field**, distinct from Draft Invoices' "enrollment change" delta. Values: `Enrolled`, `Waitlisted`, `Withdrawn` — a snapshot of the child's current state, not a period-over-period change.
- **Notes is computed, not authored.** It surfaces a real, derived payment-exception summary per invoice (ACH failure count, most recent credit) — never a free-text field, and never blank-by-default the way Draft Invoices' pre-Notes-column state was.
- **Analytics tab is copied from Draft Invoices as-is** — same static KPI strip, pie chart, and aging bars, same "display-only, no data binding" framing. Numbers are not computed from `INVOICES`. The Approval Queue cluster is **not** part of this — it lives in Draft Invoices' management-tab header, not its analytics tab, and has no equivalent concept in Payments (no draft/approval state exists here).

---

## 2. Group-by control

Toolbar gains the same `groupModes` control pattern as Draft Invoices: **None / Family / Enrollment Status**.

- `None` — flat list, current behavior.
- `Family` — group header rows (navy, white text, same treatment as Draft Invoices), subtotaled by balance.
- `Enrollment Status` — group header per status (`Enrolled` / `Waitlisted` / `Withdrawn`), invoices with no children left in the program obviously trend `Withdrawn`; this is a per-invoice snapshot field, not derived from anything else on the invoice.

Grouping only reorders/headers the existing flat row set — it does not change which rows are selectable or how bulk actions scope (still visible-rows-only, per the existing rule).

---

## 3. New columns

Inserted into `COLUMNS`, after `family` and before `dueDate` unless noted:

| Column | Field | Content | Notes |
|---|---|---|---|
| Payor Email | `payorEmail` | e.g. `m.johnson@email.com` | Data already exists on every invoice; column is new. Same measured-width treatment as Draft Invoices' `payorEmail` column. |
| Children | `children` (derived) | Single child: just the name. Multiple: `Ava (60%) · Eli (40%)`-style compact list, or stacked names with a small $ each if width allows — resolve at build time against real string widths. | Built by grouping all invoices sharing the same `payor` in the current data set. A payor with one invoice shows one name, no rollup chrome — the column should not look different for the common case. |
| Enrollment Status | `enrollmentStatus` | Pill: `Enrolled` (green-tinted) / `Waitlisted` (neutral) / `Withdrawn` (muted/red-tinted), matching the existing `PILL` style-object pattern | New mock field on every invoice. |
| Notes | `notes` (derived) | `""` (nothing exceptional), `"2 ACH failures"`, `"Credit applied –$50"`, `"1 failed ACH attempt"` | Computed once per invoice from its `payments`/`credits` arrays — never stored as authored text. Same measured-width, ellipsis, capped-width treatment as Draft Invoices' Notes column. |

`Actions` remains last, `minmax(92px, 1fr)`, unchanged.

---

## 4. Invoice Analytics tab

Ported wholesale from Draft Invoices:

- Tab switcher: `Invoice Management` / `Invoice Analytics`, identical markup and behavior.
- KPI strip: Total Outstanding A/R, Open Invoices, Past Due Invoices, Due This Week, ACH Failures — same five tiles, same icons, same hardcoded values and deltas as Draft Invoices. Not computed from `INVOICES`, matching the source.
- Invoice Status pie chart and legend — same SVG stroke-dasharray construction, same status set and hardcoded values.
- Aging Analysis bars — same five buckets, same hardcoded dollar figures.
- The `Content to be added` placeholder block stays as-is.

No wiring to Payments' real `Outstanding`/`Past due`/`ACH failures` math in this pass, even though that math already exists in the management tab — keeping the analytics tab uniformly static avoids a half-real, half-fake tile strip. Revisit if/when the whole tab gets wired.

---

## 5. Explicitly out of scope

- Real multi-child invoice consolidation (single invoice object spanning children) — a data-model change, not requested by this pass.
- AG Grid — both pages are hand-rolled CSS-grid prototypes; not adopting a grid framework for a `.dc.html` file.
- Wiring the analytics tab's numbers to live data.
- Bulk "Resend receipt" — story 52724's action list has resend invoice and resend receipt; receipt resend already exists as a single-row menu action (successful/partly-refunded payments only) and stays single-row only.
- Retrofitting any of this into `Draft Invoices.dc.html`.
