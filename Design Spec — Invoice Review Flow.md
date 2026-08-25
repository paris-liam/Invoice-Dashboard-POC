# Design Spec — Invoice Review Flow

Scope: approve/deny confirmation, the invoice detail drawer, the family drawer, and the family-ledger interstitial. Builds on `Draft Invoices.dc.html` as it stands after the UX review pass.

Prototype context: early demo, converting to Figma files including states.

---

## 1. Principles this flow follows

**Confirm before irreversible, undo after reversible.** Never both for the same gesture. A modal that also produces an undoable toast teaches users the confirmation was theatre.

**One decision surface.** Line items are the reason a human approves an invoice, so approving with intent happens where line items are visible — the drawer. The grid keeps its fast path for someone clearing an obviously-fine queue.

**Drawers orient; drawers don't duplicate the grid.** The family drawer exists to answer "who is this family and what do they owe," not to become a second grid with its own action menus.

---

## 2. Approve and deny confirmation

Three approve gestures, three treatments:

| Gesture | Treatment | Rationale |
|---|---|---|
| Row `⋯` → Approve | Instant + undo toast (6s) | Preserves UX review decision 3a. 19 drafts × 2 clicks is the cost of a modal here. |
| Drawer → Approve | Confirm modal | The user has read the invoice. A modal reads as sign-off, and costs one click on a considered action. |
| Selection bar → Approve selected | Confirm modal (existing) | Blast radius. Already built. |

Deny always opens the existing reason modal, from any entry point — it is a form, not a confirmation. Reason remains required and lands in the Notes column.

Return to draft (from row menu or drawer) gets no modal and no auto-advance: it is reversible, low-stakes, and not a queue decision. Undo toast only.

### Single-invoice approve modal

Reuses existing modal chrome (navy header, white body, pill buttons).

- Heading: `Approve invoice`
- Body: `Approve DRF-2041 for $650.00? Approved invoices are queued for the next send and can no longer be edited.`
- Actions: `Cancel` (marshmallow) · `Approve` (cotton candy)

Batch modal keeps its current count-and-total copy.

---

## 3. Invoice drawer

### Presentation

Right-side overlay, 520px wide, full height, with a scrim over the grid at `rgb(0 0 0 / 40%)`. Escape or scrim click closes. Only one drawer on screen at a time.

### Open triggers

- Invoice-number button in a grid row (replaces the current "coming next" toast)
- An invoice row inside the family drawer

### Anatomy

```
┌─────────────────────────────────────────────┐
│ DRF-2041          ◐ Draft         ‹ 1/19 ›  ✕│
├─────────────────────────────────────────────┤
│ Marcus Johnson                              │
│ m.johnson@email.com                         │
│ Johnson Family · Ava Johnson                │   ← family name links to family drawer
│ Billing period  Aug 1 – 31, 2026            │
│                                             │
│ ┌ Split payor ─────────────────────────────┐│
│ │ 60% of Ava Johnson's charges             ││
│ └──────────────────────────────────────────┘│
│                                             │
│ CHARGES                                     │
│ Tuition, August                     $620.00 │
│   60% of $1,033.33                          │
│ Late pickup fee                      $30.00 │
│   60% of $50.00                             │
│ ─────────────────────────────────────────── │
│ Total due                           $650.00 │
│                                             │
│ ACTIVITY                                    │
│ Created 1 Aug 2026 · Billing run 2026-08    │
├─────────────────────────────────────────────┤
│ [ Approve ]  [ Deny ]      ⎙ Print  ⤓ PDF   │
│ View family ledger →                        │
└─────────────────────────────────────────────┘
```

**Header.** Invoice number, status pill (reuses `PILL`), queue position with `‹ ›` arrows, close.

**Identity block.** Payor name, payor email, family · child, billing period. Family name is a link that swaps the drawer to the family drawer.

**Split band.** Only on split invoices. Two variants, because the seed data has two kinds of split:
- Percentage split (`splitValue` is `60%`): band reads `60% of Ava Johnson's charges`, and every line item carries per-line sub-text.
- Fixed-amount split (`splitValue` is `$800.00`): band reads `Fixed share of $800.00 of Noah Smith's charges`, and line items show **no** sub-text — a fixed-dollar split is not apportioned per line, so inventing a percentage per line would be a lie.

**Charges.** One row per line item: description left, this payor's amount right, tabular numerals. Percentage-split invoices add sub-text under each description in `--gray-5`: `60% of $1,033.33`. Discounts render negative in `--danger-700`. Rule below the last line, then `Total due` in bold — always equal to the row's `amount`.

**Notes block.** Above Activity, only when the invoice has a note or a deny reason. Denied invoices show the reason in a red-bordered block: `Denied — Child withdrew before the billing period started.`

**Activity.** Created date and billing run. Once acted on, appends `Approved 13 Aug 2026` / `Denied 13 Aug 2026`. Seeded denials carry a static date.

**Actions.** Not pinned to the bottom of the drawer — they sit inline directly below Activity, separated by a hairline rule, so they read as the end of the invoice rather than as drawer chrome. The family drawer's ledger link sits inline the same way, below the last child.

**Actions, by status:**

| Status | Primary | Secondary |
|---|---|---|
| Draft | `Approve` · `Deny` | Print · Download · View family ledger |
| Approved | `Return to draft` | Print · Download · View family ledger |
| Denied | none (reason shown above) | Print · Download · View family ledger |

Print and Download are stubs: both fire a toast (`Preparing invoice PDF…`).

### Auto-advance

When the drawer opens, it snapshots the ordered ids of every **Draft** in the current filtered/sorted view. This snapshot does not recompute as invoices change status — otherwise approving under an active Draft filter reshuffles the list mid-review and "next" becomes unpredictable.

- Approve (after confirm) or Deny (after reason) → drawer loads the next id in the snapshot, counter ticks `2 of 19`
- `‹ ›` walk the same snapshot manually
- Return to draft does **not** advance
- End of snapshot → drawer body replaced with `No drafts left to review` and a `Close` button
- Opening the drawer on a non-draft invoice: no snapshot, no counter, no arrows
- Opening an invoice **from the family drawer**: no snapshot either. Advancing would leave the `‹ Johnson Family` back link above an invoice belonging to a different family. Deciding on one of these returns to the family drawer instead, with the new status visible in the list.

---

## 4. Family drawer

Same drawer surface, same scrim. Read-only.

### Open triggers

- Family cell in a grid row
- Family group header when grouped by Family
- Family name in the invoice drawer's identity block

### Anatomy

```
┌─────────────────────────────────────────────┐
│ Johnson Family                             ✕│
│ 2 children · 3 invoices · $1,693.33         │
├─────────────────────────────────────────────┤
│ Ava Johnson                CH-101 $1,083.33 │
│  DRF-2041 Marcus Johnson  60%  $650.00 ◐  › │
│  DRF-2042 Alicia Johnson  40%  $433.33 ◐  › │
│                                             │
│ Eli Johnson                CH-118   $610.00 │
│  DRF-2063 Marcus Johnson   —   $610.00 ◐  › │
├─────────────────────────────────────────────┤
│ View family ledger →                        │
└─────────────────────────────────────────────┘
```

Grouped by child, child subtotal on the right. Each invoice row: number, payor, share, amount, status icon, chevron. Clicking a row swaps the drawer to that invoice, with a `‹ Johnson Family` back link in the invoice drawer header. Back returns to the family drawer; the invoice drawer opened from the grid has no back link.

Respects the Show denied toggle: denied invoices appear here only when the toggle is on, so the drawer's totals never contradict the grid.

---

## 5. Family ledger interstitial

Fires from `View family ledger` in either drawer. Not styled as a warning — there is no wrong branch, the user is being told a policy.

> **Invoices can't be edited**
>
> The family ledger is the source of truth for charges and credits. Changes you make there won't alter an invoice that's already been generated — you'll need to generate a new invoice for the corrected amount.
>
> ☐ Don't show this again
>
> `Open family ledger` · `Back to invoice`

`Open family ledger` fires a stub toast (`Family ledger — coming next`). The checkbox suppresses the modal for the rest of the session; suppressed, the link fires the toast directly.

---

## 6. Data model additions

Per invoice:

- `lineItems: [{ label, amount, full }]` — `amount` is this payor's figure, `full` the child-level charge behind it. `full` is only rendered for percentage splits.
- `share: { type: 'pct', value: 0.6 } | { type: 'fixed' } | null`
- `childTotal` — sum of the child's charges across payors
- `createdAt`, `approvedAt`, `deniedAt`

Line items are generated, not hand-authored: adjustments are declared at child level in an `ADJUSTMENTS` map, apportioned by each payor's share, and tuition is derived as the remainder so every invoice's lines sum exactly to its existing `amount`. Existing `note` strings become real adjustment lines — the late pickup fee and sibling discount stop being text and start being money.

Adjustments to seed:
- Ava Johnson (CH-101): late pickup fee `$50.00` → Marcus `$30.00`, Alicia `$20.00`
- Lucia Martinez (CH-103): late pickup fee `$50.00` (non-split)
- Cora Harris (CH-111): sibling discount `-$62.50` (non-split)
- Leo Fischer (CH-119): extra session `$40.00` (non-split)

### Mock data change

No family currently has more than one child, which leaves the family drawer with nothing to show. Two records are reassigned rather than added, so invoice count (24), approval counts, and the specified enrollment counts (5 Enrolled / 4 Transitioned / 2 Deactivated / 13 No change) all stay intact — both records already carry `status: null`:

- `DRF-2063` Maya Patel → **Eli Johnson** (CH-118), payor Marcus Johnson, Johnson Family
- `DRF-2058` Sadie White → **Mia Smith** (CH-114), payor Dana Smith, Smith Family

Result: Johnson Family = 2 children / 3 invoices (one split pair), Smith Family = 2 children / 3 invoices (one split pair, fixed-amount type).

---

## 7. State inventory for the Figma pass

Drawer: invoice/Draft · invoice/Approved · invoice/Denied · invoice/queue-exhausted · invoice/with-back-link · family · family/multi-child.

Modals: approve confirm (single) · approve confirm (batch, existing) · deny reason (existing) · ledger interstitial · ledger interstitial suppressed.

Toasts: row approve + Undo · return to draft + Undo · deny confirmation · print stub · download stub · ledger stub.

---

## 8. Explicitly out of scope

Carried forward from the UX review: split reconciliation UI in the grid (§1), un-deny (§3c), denied-row visibility on deny (§3d), sort affordances (§6e), pagination model (§6f), focus styles / focus traps / empty / loading / error states (§7).

One deliberate exception: Escape closes the drawer and any open modal. A drawer with no keyboard exit is a trap, not a deferred polish item.

The family ledger itself is not being designed. It is a stub toast behind the interstitial.
