# Design Spec — Payments

Scope: a new page for managing payments on issued invoices — recording payments, applying credits, depositing, chasing past due and ACH failures, resending invoices, refunding and deleting payments, individually and in bulk.

Replaces `Accounting Dashboard.dc.html`, which is deleted once this page covers it. Built on the patterns established in `Draft Invoices.dc.html` and `Design Spec — Invoice Review Flow.md`.

Prototype context: early demo, converting to Figma files including states.

---

## 1. Principles carried forward

**Confirm before irreversible, undo after reversible.** Never both for one gesture.

**The drawer is where you change money.** The grid's row menus carry the everyday, high-frequency actions. Corrections — refund, delete, credit — require opening the invoice, where the thing being corrected is visible.

**A row is selectable only if it is actionable in bulk.** No checkbox appears on a row that a bulk action would reject. This replaces "select freely, then discover what's invalid".

**Selection is scoped to visible rows.** Every filter change, and every collapse of an expanded invoice, prunes what is no longer on screen.

---

## 2. Page identity

- File: `Payments.dc.html`
- Title: `Financial Dashboard — Payments`
- "Today" is the fixed constant `TODAY = '2026-08-13'`. All overdue arithmetic and default dates derive from it, so the demo is deterministic.

---

## 3. Row model

Two row types in one grid.

**Invoice rows** are grid rows using the same measured-column treatment as Draft Invoices (canvas `measureText`, explicit tracks, actions column taking the remainder).

**Payment rows are indented flex rows, not grid peers.** Payments have a different shape — method, reference, deposit state — and forcing them into invoice tracks would leave half the columns empty on every payment row. They are tinted `--gray-1`, indented 40px, and read as detail belonging to the row above. This is how group headers already work in the Draft Invoices grid.

```
☐ ◐ ▸ INV-1019  Martinez Family  12 May  $950.00  $0.00    $950.00  Overdue     ⋯
☐ ⊘   ↳ ACH ····6789   12 May  $950.00  Failed · R01 Insufficient funds     ⋯
☐ ⊘   ↳ ACH ····6789   08 May  $950.00  Failed · R01 Insufficient funds     ⋯

☐ ✓ ▸ INV-1015  Thompson Family  02 May  $475.00  $475.00  $0.00    Paid        ⋯
☐ ✓   ↳ Card ····4242   02 May  $475.00  Successful · Deposited 03 May       ⋯

☐ ◐ ▸ INV-1023  Johnson Family   15 May  $650.00  $200.00  $450.00  Partly paid ⋯
☐ ✓   ↳ Check #1032    10 May  $200.00  Successful · Awaiting deposit       ⋯
```

An invoice with no payments has no chevron and cannot expand.

### Invoice columns

| Column | Notes |
|---|---|
| checkbox | Present only when balance > 0 (see §6) |
| status icon | Derived invoice status, same icon-column treatment as the approval column |
| chevron | Expand/collapse; absent when the invoice has no payments |
| Invoice # | Opens the invoice drawer |
| Family | Opens the family drawer |
| Due date | |
| Amount | Invoice total |
| Paid | Sum of effective payments (see §9) |
| Balance | Amount − paid − credits applied |
| Status | Pill |
| Actions | `⋯` menu, left-aligned in the remaining space |

Payment Status and Deposit Status are deliberately **not** invoice columns — they belong to payment rows. Balance replaces them as the column that says whether an invoice is finished.

### Payment row contents

Checkbox (only when depositable), status icon, method and masked reference, date, amount, deposit state or failure reason, `⋯` menu.

---

## 4. Statuses

**Invoice status is derived, never stored:**

| Status | Rule |
|---|---|
| Paid | balance = 0 |
| Partly paid | 0 < paid, balance > 0 |
| Overdue | balance > 0 and due date < TODAY and nothing paid |
| Open | balance > 0 and due date ≥ TODAY and nothing paid |

An invoice that is partly paid *and* past due shows **Partly paid** with the due date in `--danger-700`. One status per row; the date carries the urgency.

**AutoPay** is a boolean on the invoice, not a status. It renders as a small `AutoPay` badge beside the status pill, and the scheduled charge appears as a payment row with status `Scheduled`.

**Payment status:** `Successful` · `Pending` · `Failed` (carries a return code and plain-language label, e.g. `R01 Insufficient funds`) · `Partly refunded` · `Refunded` · `Scheduled`.

A payment refunded in full reads `Refunded`. A payment refunded in part reads `Partly refunded` and shows both figures — `$475.00, $100.00 refunded` — because the remainder still counts toward the invoice.

**Deposit state** applies only to Successful payments: `Awaiting deposit` → `Deposited` (with date and batch reference).

---

## 5. KPIs and filters

Two radio sets that combine, mirroring the approval/enrollment pair on Draft Invoices. Clicking the active tile in a set clears that set only.

- **Invoice state:** `Outstanding` ($ + count) · `Past due` ($ + count) · `Paid` (count)
- **Payment exceptions:** `ACH failures` (count) · `Awaiting deposit` ($ + count)

The exception cluster is visually subordinate, as the enrollment cluster is today — it filters on payment-level conditions, matching invoices that *have* such a payment. Past due + ACH failures in two clicks is the collections view.

A dashed `Clear filters` affordance sits with the first cluster; the exception cluster has its own `Clear` that touches only that filter. Search keeps the category selector (invoice #, family).

Grid footer: `Total shown $X` and `$Y outstanding`.

**Group by is dropped.** Payment expansion is already a hierarchy; family group headers on top would make three levels and two disclosure mechanisms in one grid.

---

## 6. Selection and bulk

Bulk is limited to **Resend invoices** and **Deposit payments**. Everything else is single-row.

Checkboxes appear only on rows a bulk action can accept:

- Invoice rows: balance > 0. A paid invoice has no checkbox.
- Payment rows: status Successful or Partly refunded, and not yet deposited. A failed, pending, scheduled, fully refunded, or already-deposited payment has no checkbox.

The header checkbox selects **all selectable invoices only** and is labelled `Select all 12 outstanding invoices`.

The selection bar is type-aware and always present at fixed height:

```
■ 3 invoices selected · $2,425.00                    [Resend invoices]  [Clear]

■ 5 payments selected · $3,150.00                    [Deposit payments] [Clear]

■ 3 invoices + 5 payments selected
  Select one kind to act on them          [Resend ✗] [Deposit ✗]       [Clear]
```

Mixed selection disables both actions and says why. Collapsing an expanded invoice deselects its payment rows.

---

## 7. Row menus

**Invoice `⋯`:** `Record payment…` · `Resend invoice` · `View invoice`
**Payment `⋯`:** `Deposit…` (only when depositable) · `Resend receipt` (only when Successful)

Refund, delete, and apply credit are not in row menus.

---

## 8. Invoice drawer

Reuses the Draft Invoices drawer entirely: 520px right overlay, scrim, Escape, queue-free, actions inline beneath the content, back link when opened from the family drawer. Line items come across unchanged — these are the same invoices, now issued.

Body order: identity → line items → total → **payments** → **credits** → balance due → activity → actions.

```
PAYMENTS
  ✓ Card ····4242   02 May   $475.00   Successful · Deposited 03 May   ⋯
  ⊘ ACH  ····6789   08 May   $950.00   Failed · R01                    ⋯

CREDITS
  Closure day, 4 May                                        -$50.00

──────────────────────────────────────────────────────────
Balance due                                                $425.00
```

Per-payment `⋯` inside the drawer: `Refund…` and `Delete…`, subject to the rules in §10.

Inline actions below: `Record payment` · `Apply credit` · `Resend invoice`, then `Print` · `Download PDF` · `View family ledger →`. Print and Download remain toast stubs; the ledger link keeps the immutability interstitial and its session-level "don't show again".

An invoice with no payments shows `No payments recorded` in the payments section rather than omitting it.

---

## 9. Money arithmetic

- A payment's **effective amount** is `amount − refundedAmount`, counted only when status is `Successful` or `Partly refunded`.
- **Paid** = sum of effective amounts across the invoice's payments.
- **Balance** = `invoice amount − paid − sum(credits applied)`.
- Refunding raises the balance and can flip an invoice out of Paid.
- Deleting a payment removes it from the arithmetic entirely.

**Credits** draw from a family-level credit balance. Applying a credit reduces that balance and the invoice balance by the same amount. The amount is capped at the lesser of the available balance and the invoice balance. **The family drawer gains a `Credit balance` line** at the top, beside the children/invoices summary.

---

## 10. Actions in detail

| Action | Where | Treatment |
|---|---|---|
| Record payment | Invoice row menu, drawer | Form modal → toast, no undo. The correction path is Delete. |
| Resend invoice (single) | Invoice row menu, drawer | Instant → toast, no undo. Low stakes, high frequency. |
| Resend invoice (bulk) | Selection bar | Confirm modal with count → toast |
| Resend receipt | Payment row menu | Instant → toast |
| Deposit (single or bulk) | Payment row menu, selection bar | Confirm modal with count and total → toast. Always confirms: it moves money and stamps a batch reference. |
| Apply credit | Drawer | Form modal → toast **with Undo** — reversible, restores both balances |
| Refund | Drawer, per payment | Form modal, reason required → toast, no undo |
| Delete payment | Drawer, per payment | Form modal, reason required → toast, no undo |

**Delete is offered only on manually recorded offline payments** — cash, check, or hand-keyed entries. An electronic payment that actually moved money can be refunded but never deleted; offering delete there would let staff erase money from the record. On electronic payments the menu item is absent, not disabled.

**Refund** defaults to the payment's full remaining amount and is editable down to a partial refund. Reason required. Copy states that the money returns to the original method.

**Record payment** form: amount (defaults to the invoice balance), method (`Cash` · `Check` · `Other`), date (defaults to TODAY), reference (optional, e.g. check number). Amount may exceed the balance — the excess accrues to the family credit balance, and the modal says so before submitting.

**Deposit** marks each selected payment `Deposited`, stamps TODAY, and generates a shared batch reference of the form `DEP-2026-0813-1`, shown in the toast and in each payment's activity.

Every correction's reason is written into the invoice's Activity.

---

## 11. Mock data

Roughly 18 invoices across the families already used in Draft Invoices, so the two pages read as one product. Must include at least one of each:

- Fully paid and deposited
- Fully paid, awaiting deposit
- Partly paid by check, balance outstanding
- Past due, no payments
- Past due with two failed ACH attempts, same return code
- AutoPay scheduled with a `Scheduled` payment row
- A refunded payment, invoice returned to outstanding
- An invoice with a credit applied
- A family carrying a credit balance with nothing applied yet
- An invoice with no payments at all

Invoice numbers continue the `INV-` series from the Accounting Dashboard.

---

## 12. State inventory for the Figma pass

Grid: default · invoice expanded · exception filters active · empty selection bar · invoice selection · payment selection · mixed selection.

Drawer: invoice with payments · invoice with no payments · invoice with credits · payment menu open (offline vs electronic).

Modals: record payment · apply credit · refund · delete payment · resend bulk confirm · deposit confirm · ledger interstitial.

Toasts: payment recorded · credit applied (+ Undo) · refunded · payment deleted · invoice resent · receipt resent · deposited (with batch reference).

---

## 13. Out of scope

The family ledger itself remains a stub behind the interstitial. No focus styles, focus traps, empty, loading, or error states — the same deferrals as Draft Invoices, with the same single exception: Escape closes the drawer and any open modal.

No pagination model. No dunning schedule or automated retry logic — failures are displayed, not managed. No bulk refund, bulk delete, or bulk credit.
