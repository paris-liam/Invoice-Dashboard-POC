# UX Review — Draft Invoices

Review of `Draft Invoices.dc.html`. Prototype context: early demo, will be converted to Figma files including states.

**How to use this doc:** each item has a `**Decision:**` line. Write your answer there — `yes` / `no` / `later` / free text. Anything you leave blank I'll treat as undecided and ask about.

Line references point at `Draft Invoices.dc.html`.

---

## 1. The page doesn't help with the thing it exists for

Draft invoices need human approval mainly because **splits can be wrong**. The design gives you almost no way to see that.

- Split data is spread across two columns that fight each other: `Split Payor` = Y/N, `Split Amount` = sometimes `60%`, sometimes `$800.00` (lines 226–234). Mixed units in one column can't be scanned or compared — which is presumably why it's the one column marked `sortable:false` (line 261).
- Split siblings are separate rows with no visual link. Johnson is 60/40 on one child; Wilson is 60/40; Nguyen is 50/50. If one were 60/50, nothing on this page would tell you.
- Grouping offers None / Family / Recent Event — but splits live at the **child** level (`childId`), not family. Family grouping conflates children and hides the unit you actually need to verify.

**Proposal:** group by child (or "invoice group"), collapse split siblings into one visual unit with a share total, and flag anything that doesn't reconcile to 100% / the child's full amount.

**Decision:** ignore this, the split payors are not ever going to be the problem here, the problem will be if a invoice needs to be altered with an extra charge or a discount

### 1b. No dollar total anywhere

KPIs count invoices and children. Before approving a run, the number a finance lead wants is "$X pending approval."

**Proposal:** put money in the Draft tile (count + dollars), and show a running total in the grid footer.

**Decision:** show a running total in the grid footer

---

## 2. Two KPI rows look independent but aren't

`activeKpi` is a single value shared by both clusters (`kpiClick`, line 351). Clicking **Deactivated** silently clears **Draft**. But the two rows are visually presented as separate facet groups — different label, divider between them, different tile styling. Users will expect "Draft + Deactivated" to combine, and they never will.

**Proposal:** either make them one obvious radio set, or make them genuinely combinable filter chips. The current middle ground teaches the wrong model.

**Decision:** they should be separate radio sets, when deactivated is pressed, draft or accepted can be pressed

### 2b. Mismatched units, matched styling

Left tiles count invoices; right tiles count *distinct children*. Same size, same big-number treatment, side by side. "12 Pending" and "3 Children" read as comparable. Worse: clicking a children-count tile filters an invoice table, so the tile number will never match the row count below it.

**Proposal:** make both sides count invoices, or visually subordinate the right cluster so it doesn't read as a peer metric.

**Decision:** visually subordinate the right cluster

### 2c. "All Invoices" disagrees with the table on load

The tile counts `all.length` (24) but the table hides Denied by default (23 rows). Two numbers on screen that contradict each other before the user touches anything.

**Decision:** the count should be all minus denied on load

### 2d. "All Invoices" isn't a metric, it's a Reset

It's styled as the third peer tile but functions as clear-filters — and there's already a Reset button in the toolbar.

**Proposal:** drop the tile, or restyle it as a filter-clear affordance.

**Decision:** restyle as a filter clear

---

## 3. Approve/Deny model is inconsistent

**Approve is reversible** (the button flips to revert, line 500) **but gets a confirmation modal. Deny is irreversible but the denied row disappears.** Backwards on both counts.

### 3a. Drop the modal for single-row approve

Use a toast with **Undo** instead. Keep the modal for *batch* approve, where blast radius justifies it. Someone clearing 200 drafts should not click twice per row.

**Decision:** use a toast with an undo

### 3b. Revert button is labelled "Draft"

It sits one column from a status pill that also says "Draft."

**Proposal:** "Undo" or "Return to draft."

**Decision:** return to draft

### 3c. No un-deny path

Denied rows have both buttons disabled with no route back. Denials get contested.

**Proposal:** Denied rows can return to Draft.

**Decision:** ignore this 

### 3d. Denying makes the row vanish

Show Denied is off by default, so after denying, the row disappears while the toast says "1 invoice denied." Reads as deletion — which contradicts the modal copy promising the record is kept.

**Proposal:** default the toggle on, or auto-enable it when a denial happens.

**Decision:** ignore this 

### 3e. Mandatory deny reason is hidden

The reason is required, then only surfaced as a `title` tooltip on the icon (line 484). If it's required, show it.

**Decision:** we should have a notes column 

---

## 4. Selection can act on rows you can't see

`onBatchApprove` / `onBatchDeny` use `selectedIds` with no regard for the active filter or search (lines 614–615). Select 10 → change the filter → "Approve Selected" approves invoices not on screen. Reset clears selection, but filtering doesn't.

**Proposal:** scope selection to visible rows, or have the selection bar warn "4 of 10 selected are hidden by current filters."

**Decision:** selection should only be on the visible row 

### 4b. Header checkbox selects drafts only, silently

Correct behavior (line 604), invisible reasoning.

**Proposal:** label it — "Select all 18 drafts."

**Decision:** add the label

### 4c. Selection bar shifts the table

It's inserted into flow (line 108), so the whole table jumps down the first time you check a box.

**Proposal:** reserve the space, or float the bar over the grid.

**Decision:** reserve the space 

---

## 5. Colour is doing too much work

Approval state is encoded three times: row tint, icon column, and button configuration. Since Draft is the *default* state, the majority of the grid is washed in warning-yellow — alerting you to normalcy. It also drowns the Recent Event pills, which are the genuinely exceptional signal.

There's a "ROW COLOR" legend on the page. Needing a legend is the tell.

**Proposal:** white rows for Draft; tint only exceptions (Denied, maybe Approved). Keep the icon column, drop tint-as-primary-signal. That frees colour for enrollment events and split-mismatch flags.

**Decision:** tint exceptions, keep the icon column, and drop the tint-as-primary-signal 

---

## 6. Smaller items

### 6a. 48 saturated buttons at rest
Every row carries a green Approve and a red Deny at equal weight. The queue's happy path is approval.

**Proposal:** demote Deny to low-emphasis or an overflow menu.

**Decision:** put both in an overflow menu 

### 6b. Search category selector probably doesn't earn its place
"ALL" already searches id + payor + family (line 320). You're asking for a scoping decision before every search on a screen where search-everything works.

**Proposal:** cut it, or make it a post-search refinement.

**Decision:** keep it there since this is still just to demonstrate screens 

### 6c. Toolbar contrast
White text on `rgb(255 255 255 / 15%)` for the search field, 12% for inactive Group-by segments and Reset. Placeholder text will fail WCAG. This is a screen someone reads for hours.

**Decision:** make it more opaque to cover the issue 

### 6d. "Recent Event" is vague and its empty state is wrong
Values are enrollment changes; 6 rows render `—`, which actually means "no change this period" — the normal case, displayed as missing data.

**Proposal:** rename the column, and say "No change."

**Decision:** go with your proposal 

### 6e. Sort affordance
The chevron only appears on the active column, so nothing signals the other 8 are sortable.

**Decision:** ignore this for now

### 6f. Pagination is decorative
Lines 162–165. Fine for a demo, but the model needs deciding: at real volume, paging interacts badly with select-all and batch approve. Virtualized infinite scroll keeps "select all drafts" honest.

**Decision:** ignore this for now

### 6g. Dark navy toolbar outweighs the h1
A filter bar is currently the visual anchor of the page.

**Proposal:** lighten the toolbar.

**Decision:** go with proposal 

---

## 7. For the Figma states pass

Not bugs — gaps that will show up as soon as you enumerate states.

- No focus styles defined anywhere (only `style-hover`).
- Modals have no Escape handling or focus trap.
- Category dropdown doesn't close on outside click.
- Toast auto-dismisses at 2.8s with no action; no Undo anywhere.
- No empty state (no results from search/filter), no loading state, no error state.

**Decision:** ignore for now 

---

## Suggested order of work

1. Child-level grouping + split reconciliation (§1)
2. Approve without a modal + Undo, and un-deny (§3)
3. Collapse the two KPI clusters into one coherent filter model, with dollars (§1b, §2)
4. Pull back the row tint (§5)

**Decision / reorder:** go in your suggested order
