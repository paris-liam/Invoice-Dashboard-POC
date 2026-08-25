# Session Handoff

Last worked: 13 Aug 2026. Two pages are built and verified in a browser: `Draft Invoices.dc.html` and `Payments.dc.html`. `Accounting Dashboard.dc.html` has been deleted — the Payments page replaced it.

---

## How to pick this up

```
cd "/Users/liamparis/Desktop/Design iteration request"
python3 -m http.server 8752
```

Then open **http://localhost:8752/Draft%20Invoices.dc.html** or **http://localhost:8752/Payments.dc.html**

The page needs a server — `support.js` and the `_ds/` design-system bundle load by relative path, so `file://` won't work. Ctrl-C stops it.

**Expected console noise:** three errors of the form `<path> attribute d: Expected moveto path command`, one per templated `<path d="{{ … }}">`. The browser parses the raw template before the DC runtime hydrates it. Anything else is a real problem.

---

## Documents in this folder

| File | What it is |
|---|---|
| `UX Review — Draft Invoices.md` | The original review with your decisions written into each `**Decision:**` line. The source of truth for why the grid looks the way it does. |
| `Design Spec — Invoice Review Flow.md` | The agreed design for drawers, confirmations, and the ledger interstitial. |
| `Implementation Plan — Invoice Review Flow.md` | The 11-task build plan. All tasks executed; checkboxes were left unticked. |
| `Design Spec — Payments.md` | The agreed design for the Payments page. |
| `Implementation Plan — Payments.md` | Its 10-task build plan. All tasks executed. |
| `Session Handoff.md` | This file. |

---

## What's built — Draft Invoices

### Grid (from the UX review pass)

- **Running dollar total** in the grid footer: total shown, plus pending-approval subtotal. Both scoped to visible rows.
- **Two independent filter sets.** Approval (Draft / Accepted) and enrollment change (Enrolled / Deactivated / Transitioned) combine; clicking the active tile in a set clears that set only. The enrollment cluster is visually subordinate — it counts *children*, not invoices.
- **"All invoices" tile became a Clear filters affordance** (dashed, muted when nothing is filtered). Its count respects the Show denied toggle so it can't contradict the table. The toolbar Reset was removed so there's one clear-filters control. The enrollment cluster has its own Clear that touches only that filter.
- **Selection is scoped to visible rows.** Every filter change prunes hidden ids, so a batch action can never reach an invoice off screen.
- **Selection bar is always in the layout** at a fixed 44px — idle state holds the labelled "Select all 18 drafts" control, active state holds the actions. Checking a box never shifts the grid.
- **Row tint pulled back.** Draft rows are white; only Approved (faint) and Denied are tinted. The row-colour legend became a status *icon* legend.
- **Row actions live in a `⋯` overflow menu**, fixed-positioned so the scroll container can't clip it. Disabled on denied rows.
- **Notes column** carries the deny reason.
- **Enrollment change** column and group mode renamed; blanks read "No change".
- **Columns are content-sized.** Widths are measured with canvas `measureText` against the real strings — every row is its own grid, so `max-content` would drift. Actions takes the remainder at `minmax(92px, 1fr)`, its `⋯` left-aligned. Notes caps at 320px. Widths compute from all invoices, so filtering doesn't reflow.
- **Toolbar** is navy `--blueberry-pie--500`: group-by first, then a shortened search. Selected tab is `--cotton-candy--500`, all label text white, search field solid white with dark text.
- **Group header rows** are navy with white text.

### Invoice drawer

520px right overlay with scrim. Opens from the invoice-number button, or from a row inside the family drawer.

Header: invoice number, status pill, queue counter with `‹ ›`, close. Body: payor identity, split band, line items, total due, notes, activity. Actions sit **inline below Activity**, not pinned.

- **Line items are generated, not authored.** Adjustments live at child level in `ADJUSTMENTS`, are apportioned by each payor's share, and tuition is derived as the remainder — so every invoice's lines sum exactly to its stated amount. Ava's $50 late fee correctly becomes $30 on Marcus's invoice and $20 on Alicia's.
- **Two split variants.** Percentage splits show per-line detail (`60% of $1,033.33`). Fixed-dollar splits (`$800.00`-style) show the band only — there is no honest per-line percentage to quote.
- **Auto-advance.** Opening from the grid snapshots the ordered ids of every Draft in the current view. Approve or deny loads the next one, counter ticks. The snapshot deliberately does not recompute — otherwise approving under an active Draft filter reshuffles the list mid-review. End of queue shows "No drafts left to review".

### Family drawer

Same surface. Grouped by child with subtotals; each invoice row shows number, payor, share, amount, status icon. Read-only — rows link out to the invoice drawer, which is where decisions happen.

Opens from the family cell, the family group header, or the family name in the invoice drawer. An invoice opened this way gets a `‹ Johnson Family` back link and **no queue** — advancing would leave the back link above an invoice from a different family. Deciding on one returns you to the family with the new status visible.

Respects the Show denied toggle, so its totals can't contradict the grid.

### Confirmations

| Gesture | Treatment |
|---|---|
| Row `⋯` → Approve | Instant + undo toast |
| Drawer → Approve | Confirm modal, then advance |
| Batch → Approve selected | Confirm modal + undo toast |
| Deny (anywhere) | Reason modal, required. Only the drawer advances. |
| Return to draft | No modal, no advance, undo toast |

Never a modal *and* an undo for the same gesture — a confirmation that's also undoable teaches users the confirmation was theatre.

### Family ledger interstitial

Explainer, not a warning — no Cancel framing. "Invoices can't be edited… you'll need to generate a new invoice for the corrected amount." Has a "Don't show this again" checkbox that persists for the session. `Open family ledger` fires a stub toast.

### Layering

Drawer 1151 → modals 1200 → toast 1300. Escape unwinds exactly one layer per press, innermost first.

---

## Mock data

24 invoices. Enrollment split is **5 Enrolled / 4 Transitioned / 2 Deactivated / 13 No change** (invoice counts — the KPI tiles show *children*, which is fewer, because split-payor pairs share a child).

Two records were reassigned so two families have more than one child, without disturbing those counts: Maya Patel → **Eli Johnson** (Johnson Family), Sadie White → **Mia Smith** (Smith Family). Both already had `status: null`.

Adjustments seeded: Ava Johnson late pickup fee $50 (splits 60/40), Lucia Martinez late pickup fee $50, Cora Harris sibling discount −$62.50, Leo Fischer extra session $40.

---

## Open threads

- **The Notes column is nearly empty now.** Moving the fee/discount text into real line items means Notes only carries deny reasons. That's arguably its correct job, but the column looks bare. You may want a short summary back in it.
- **`fmtMoney` was fixed** to render `-$62.50` rather than `$-62.50`. Only surfaced once negative line items existed.
- **The family ledger itself is not designed** — the interstitial is the endpoint, behind a stub toast.

## Explicitly deferred (your calls, from the UX review)

Split reconciliation UI in the grid (§1), un-deny (§3c), denied-row auto-reveal on deny (§3d), the search category selector stays as-is (§6b), sort affordances (§6e), pagination model (§6f), and the §7 states pass: focus styles, focus traps, empty/loading/error states.

One deliberate exception was made to §7: Escape closes the drawer and modals. A drawer with no keyboard exit is a trap, not a polish item.

---

# Payments page

`Payments.dc.html` — issued invoices and their payment lifecycle. Built by copying Draft Invoices, so the grid machinery, drawer, menus, modal chrome and toast are shared. "Today" is the fixed constant `TODAY = '2026-08-13'`, so overdue arithmetic is deterministic.

## The model

One row per **invoice**, expandable to its **payments**. Invoice rows are grid rows; payment rows are indented flex rows, because payments have a different shape and would leave half the invoice columns empty.

Invoice status is **derived, never stored** — Paid / Partly paid / Overdue / Open, one per row. An invoice that's both partly paid and late reads "Partly paid" with the due date in red. AutoPay is a badge plus a `Scheduled` payment row, not a fifth status.

Money: a payment's effective amount is `amount − refundedAmount`, counted only when Successful or Partly refunded. Balance is `invoice − paid − credits`. Credits draw down a **family credit balance**, shown at the top of the family drawer.

## Actions

| Gesture | Treatment |
|---|---|
| Resend invoice, single | Instant + toast |
| Resend invoices, bulk | Confirm modal |
| Deposit, single or bulk | Always confirms — it moves money and stamps a shared batch reference (`DEP-2026-0813-1`) |
| Record payment | Form modal → toast. Overpayment goes to the family credit balance, and the form says so before you submit |
| Apply credit | Form modal → toast **with Undo**. Capped at the lesser of credit balance and invoice balance |
| Refund | Form modal, reason required → toast, no undo. Partial refunds allowed |
| Delete payment | Form modal, reason required → toast, no undo |

**Delete only appears on manually recorded offline payments** — cash, cheque, hand-keyed. An electronic payment that moved money can be refunded but never erased; the menu item is absent, not disabled.

Corrections (refund, delete, credit) live in the drawer only. Row menus carry the everyday actions.

## Selection

Bulk is limited to Resend invoices and Deposit payments, which act on different objects. Selection is **type-aware**: a row only gets a checkbox if a bulk action would accept it (invoices with a balance; payments that are settled and undeposited), and a mixed selection disables both actions and says why. The header checkbox selects outstanding invoices only. Collapsing an invoice deselects its payments.

## Layering

Scrim 1150 → drawer 1151 → **menus 1160** → modals 1200 → toast 1300. Menus sit above the drawer deliberately: the per-payment menu opens from inside it.

## Open threads

- No empty state. Filtering to "Awaiting deposit" after depositing everything leaves a blank grid — deferred with the rest of §7.
- Recorded payments get an id of the form `PMT-N1`; seeded ones are `PMT-90xx`.
- The family ledger is still a stub behind the immutability interstitial.
