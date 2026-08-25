# Invoice Review Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approve/deny confirmation flow, the invoice detail drawer, the family drawer, and the family-ledger interstitial into `Draft Invoices.dc.html`, per `Design Spec — Invoice Review Flow.md`.

**Architecture:** One Deck Component file. The `<x-dc>` block holds the template; the `<script data-dc-script>` block holds a `Component extends DCLogic` class whose `renderVals()` returns a flat object the template interpolates. Drawers and modals render as siblings of `<main>` at the root of the component, positioned `fixed`, gated by `sc-if`. Line items are precomputed once at module load, not per render.

**Tech Stack:** Deck Component runtime (`support.js`), FMS design system tokens (`_ds/.../colors_and_type.css`), no build step, no framework beyond the DC runtime's React bridge.

## Global Constraints

- **No test framework and no git in this project.** Every task's verification is a browser check against a local server. "Checkpoint" steps replace commits — do not run `git` commands.
- Serve with `python3 -m http.server 8752` from the project root; the page is `http://localhost:8752/Draft%20Invoices.dc.html`. Kill the server when done: `pkill -f "http.server 8752"`.
- Console errors of the form `<path> attribute d: Expected moveto path command` are expected on every load — one per templated `<path d="{{ … }}">` in the file. They come from the browser parsing the raw template before hydration. The baseline is 2 before Task 8 and 3 after it. Any error of a *different* kind is a real regression.
- All styling uses design-system CSS variables. No raw hex except `#fff` and existing `rgb(...)` literals already in the file.
- Every `style` attribute in the template either is a literal CSS string or interpolates a single `{{ }}` style object built in `renderVals()`. Never mix the two on one element.
- Buttons that must be inert are given `onClick: null` and a `cursor:'not-allowed'` style — the runtime treats a null handler as no handler.
- Copy is sentence case. An action keeps its name through the flow: a button that says "Approve" produces a toast that says "approved".
- Money is always rendered through `fmtMoney`.
- Do not touch: the grid's column-measurement code (`columnWidths`, `cellMetrics`, `textWidth`), the selection-scoping logic (`setFilters`), or the toolbar.

---

## File Structure

Single file: `Draft Invoices.dc.html`.

| Region | Responsibility |
|---|---|
| `<helmet>` `<style>` | Global resets. Gains one keyframe for the drawer slide-in. |
| Template — `<main>` | Existing header, KPIs, toolbar, selection bar, grid. Gains click handlers on the family cell and group header. |
| Template — root siblings after `</main>` | Row action menu (exists), toast (exists), deny modal (exists), approve modal (exists). Gains: drawer + scrim, ledger interstitial. |
| Script — module constants | `DRAFTS`, `ADJUSTMENTS`, `CATEGORIES`, `COLUMNS`, icon/pill/tint maps, measurement helpers. Gains `buildInvoices()` and the precomputed `INVOICES`. |
| Script — `Component` class | State, filter/derive helpers, `renderVals()`. Gains drawer state, queue logic, and a `drawerVals()` helper so `renderVals()` doesn't grow unbounded. |

`renderVals()` is already long. Each task that adds drawer output puts it in `drawerVals()` and spreads the result, keeping the two concerns separable.

---

### Task 1: Line items and mock data

**Files:**
- Modify: `Draft Invoices.dc.html` — `DRAFTS` array, and new constants directly below it

**Interfaces:**
- Produces: `INVOICES` — the seed array with line items attached. Every later task reads `INVOICES`, never `DRAFTS`.
- Produces per invoice: `lineItems: [{ label, amount, full }]`, `share: {type:'pct',value:Number} | {type:'fixed'} | null`, `childTotal: Number`, `createdAt: String`
- Produces: `ADJUSTMENTS` — child-level adjustments keyed by `childId`

- [ ] **Step 1: Reassign two records so two families have two children**

In `DRAFTS`, replace the `DRF-2058` line with:

```js
  { id:'DRF-2058', childId:'CH-114', child:'Mia Smith',      payor:'Dana Smith',      payorEmail:'dana.smith@email.com',  family:'Smith Family',    amount:900,  split:false, splitValue:null,      status:null,           approval:'Draft' },
```

and the `DRF-2063` line with:

```js
  { id:'DRF-2063', childId:'CH-118', child:'Eli Johnson',    payor:'Marcus Johnson',  payorEmail:'m.johnson@email.com',   family:'Johnson Family',  amount:610,  split:false, splitValue:null,      status:null,           approval:'Draft' },
```

Both already carried `status: null`, so the 5 Enrolled / 4 Transitioned / 2 Deactivated / 13 No change split is unchanged.

- [ ] **Step 2: Remove the three `note` strings from `DRAFTS`**

Delete `, note:'Late pickup fee added — $50.00'` from `DRF-2044`, `, note:'Sibling discount applied — 10%'` from `DRF-2055`, and `, note:'Extra session added — $40.00'` from `DRF-2064`. They become real money in the next step. `noteOf()` keeps working — it returns `''` when `note` is absent.

- [ ] **Step 3: Add adjustments and the invoice builder**

Insert directly below the `DRAFTS` array:

```js
/* Adjustments live at child level and are apportioned across that child's
   payors. Tuition is whatever is left, so every invoice's lines sum to its
   stated amount rather than drifting from it. */
const ADJUSTMENTS = {
  'CH-101': [{ label:'Late pickup fee',  full:50 }],
  'CH-103': [{ label:'Late pickup fee',  full:50 }],
  'CH-111': [{ label:'Sibling discount', full:-62.50 }],
  'CH-119': [{ label:'Extra session',    full:40 }],
};

const round2 = (n) => Math.round(n * 100) / 100;

function buildInvoices(seed) {
  const childTotals = {};
  seed.forEach(i => { childTotals[i.childId] = round2((childTotals[i.childId] || 0) + i.amount); });

  return seed.map(inv => {
    const childTotal = childTotals[inv.childId];
    const pctMatch = inv.splitValue && /^(\d+(?:\.\d+)?)%$/.exec(inv.splitValue);
    const share = !inv.split ? null
      : pctMatch ? { type:'pct', value: Number(pctMatch[1]) / 100 }
      : { type:'fixed' };

    /* A fixed-dollar split is not apportioned per line, so it takes the
       whole-invoice ratio only to size its own lines. */
    const ratio = share && share.type === 'pct' ? share.value : inv.amount / childTotal;

    const adjustments = (ADJUSTMENTS[inv.childId] || []).map(a => ({
      label: a.label,
      full: a.full,
      amount: round2(a.full * ratio),
    }));

    const adjTotal = adjustments.reduce((a, l) => a + l.amount, 0);
    const adjFull = adjustments.reduce((a, l) => a + l.full, 0);
    const tuition = {
      label: 'Tuition, August',
      full: round2(childTotal - adjFull),
      amount: round2(inv.amount - adjTotal),
    };

    return Object.assign({}, inv, {
      childTotal,
      share,
      lineItems: [tuition].concat(adjustments),
      createdAt: '1 Aug 2026',
      deniedAt: inv.approval === 'Denied' ? '28 Jul 2026' : undefined,
    });
  });
}

const INVOICES = buildInvoices(DRAFTS);
```

- [ ] **Step 4: Point state at `INVOICES`**

In `state = {`, change:

```js
    invoices: DRAFTS.map(d => Object.assign({}, d)),
```

to:

```js
    invoices: INVOICES.map(d => Object.assign({}, d)),
```

- [ ] **Step 5: Verify in the browser**

Serve and load the page, then in the console:

```js
const rows = [...document.querySelectorAll('div')].filter(d => d.style.display === 'grid' && d.style.height === '42px');
rows.length  // 23
```

Expected on screen: Notes column reads `—` for every row (the three note strings are gone), the Johnson and Smith families each show a second child's invoice, and the footer still reads `Total shown $13,823.33`. The KPI tiles still read Draft 19 / Accepted 4, and the enrollment tiles still read 3 / 2 / 3 children.

- [ ] **Step 6: Checkpoint**

Confirm exactly two console errors. Confirm the grid renders 23 rows and column alignment is unchanged.

---

### Task 2: Drawer shell — open, close, scrim, Escape

**Files:**
- Modify: `Draft Invoices.dc.html` — `state`, `componentDidMount`, `renderVals()`, template root

**Interfaces:**
- Consumes: `INVOICES` (Task 1)
- Produces state: `drawer: null | { view:'invoice'|'family', invoiceId:String|null, familyName:String|null, backTo:String|null }`
- Produces methods: `openInvoice(id, backTo)`, `openFamily(name)`, `closeDrawer()`
- Produces render values: `drawerOpen`, `drawerIsInvoice`, `drawerIsFamily`, `drawerStyle`, `scrimStyle`, `onCloseDrawer`, `drawerTitle`, `drawerStatusStyle`, `drawerStatus`

- [ ] **Step 1: Add drawer state**

In `state = {`, add after `menu:null,`:

```js
    drawer:null, queue:null, ledgerOpen:false, ledgerSuppressed:false,
```

- [ ] **Step 2: Add the slide-in keyframe**

In the `<style>` block inside `<helmet>`, append:

```css
  @keyframes dc-drawer-in { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
```

- [ ] **Step 3: Add open/close methods and the Escape handler**

Add these methods to the class, directly above `filteredWith(s)`:

```js
  openInvoice(id, backTo) {
    this.setState({ drawer: { view:'invoice', invoiceId:id, familyName:null, backTo: backTo || null }, menu:null });
  }

  openFamily(name) {
    this.setState({ drawer: { view:'family', invoiceId:null, familyName:name, backTo:null }, menu:null, queue:null });
  }

  closeDrawer() {
    this.setState({ drawer:null, queue:null });
  }
```

Replace the existing `componentDidMount` with:

```js
  componentDidMount() {
    /* Column widths are measured with canvas; remeasure once Quicksand is live. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.forceUpdate());
    /* Escape unwinds one layer at a time: modal first, then drawer. */
    this.onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      const s = this.state;
      if (s.ledgerOpen) return this.setState({ ledgerOpen:false });
      if (s.deny) return this.setState({ deny:null, denyReason:'' });
      if (s.approve) return this.setState({ approve:null });
      if (s.menu) return this.setState({ menu:null });
      if (s.drawer) return this.closeDrawer();
    };
    document.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown);
  }
```

- [ ] **Step 4: Add the drawer template**

Insert directly after the `</sc-if>` that closes the row action menu, before the toast `sc-if`:

```html
  <sc-if value="{{ drawerOpen }}" hint-placeholder-val="{{ false }}">
    <div onClick="{{ onCloseDrawer }}" style="position:fixed; inset:0; z-index:1150; background:rgb(0 0 0 / 40%);"></div>
    <aside role="dialog" aria-modal="true" aria-label="{{ drawerTitle }}" style="{{ drawerStyle }}">
      <div style="display:flex; align-items:center; gap:var(--space-xs); padding:var(--space-md); background:var(--blueberry-pie--500); color:#fff;">
        <span style="font-size:var(--font-size-lg); font-weight:700;">{{ drawerTitle }}</span>
        <sc-if value="{{ drawerIsInvoice }}" hint-placeholder-val="{{ true }}">
          <span style="{{ drawerStatusStyle }}">{{ drawerStatus }}</span>
        </sc-if>
        <button onClick="{{ onCloseDrawer }}" aria-label="Close" style="display:grid; place-items:center; width:28px; height:28px; margin-left:auto; padding:0; border:1px solid rgb(255 255 255 / 60%); border-radius:var(--radius-xs-plus); background:transparent; color:#fff; font-size:12px; line-height:1; cursor:pointer;" style-hover="background:rgb(255 255 255 / 18%);">&#10005;</button>
      </div>
      <div style="flex:1; min-height:0; overflow:auto; padding:var(--space-md);">
        <sc-if value="{{ drawerIsInvoice }}" hint-placeholder-val="{{ true }}">
          <div>Invoice body</div>
        </sc-if>
        <sc-if value="{{ drawerIsFamily }}" hint-placeholder-val="{{ false }}">
          <div>Family body</div>
        </sc-if>
      </div>
    </aside>
  </sc-if>
```

The `Invoice body` / `Family body` placeholders are replaced in Tasks 3 and 8. They exist so this task is independently verifiable.

- [ ] **Step 5: Add the render values**

Add to the returned object in `renderVals()`, directly above `menuOpen:`:

```js
      drawerOpen: !!s.drawer,
      drawerIsInvoice: !!(s.drawer && s.drawer.view === 'invoice'),
      drawerIsFamily: !!(s.drawer && s.drawer.view === 'family'),
      drawerTitle: !s.drawer ? '' : s.drawer.view === 'family' ? s.drawer.familyName : s.drawer.invoiceId,
      drawerStatus: drawerInv ? drawerInv.approval : '',
      drawerStatusStyle: drawerInv ? pillStyle(drawerInv.approval) : {},
      drawerStyle: {
        position:'fixed', top:0, right:0, bottom:0, zIndex:1151,
        display:'flex', flexDirection:'column', width:'min(520px, 100vw)',
        background:'#fff', color:'var(--blueberry-pie--500)',
        boxShadow:'var(--shadow-lg)', animation:'dc-drawer-in var(--transition-normal)',
      },
      onCloseDrawer: () => this.closeDrawer(),
```

And define `drawerInv` next to the other locals, directly below the `const menuInv = ...` line:

```js
    const drawerInv = s.drawer && s.drawer.invoiceId ? all.find(i => i.id === s.drawer.invoiceId) : null;
```

- [ ] **Step 6: Wire the invoice-number button**

In the row mapping, replace:

```js
        onSelect: () => this.showToast('Invoice detail for ' + inv.id + ' — coming next'),
```

with:

```js
        onSelect: () => this.openInvoice(inv.id, null),
```

- [ ] **Step 7: Verify in the browser**

Reload. Click `DRF-2041`. Expected: scrim dims the grid, a 520px panel slides in from the right with a navy header reading `DRF-2041`, a `Draft` pill, and a close button; body reads `Invoice body`. Press Escape — it closes. Re-open, click the scrim — it closes. Confirm still exactly two console errors.

- [ ] **Step 8: Checkpoint**

Drawer opens, closes three ways (✕, scrim, Escape), and the grid underneath is unchanged.

---

### Task 3: Invoice drawer body

**Files:**
- Modify: `Draft Invoices.dc.html` — drawer template body, `renderVals()`

**Interfaces:**
- Consumes: `drawerInv` (Task 2), `INVOICES` line items (Task 1)
- Produces render values: `drawerPayor`, `drawerEmail`, `drawerFamily`, `drawerChild`, `drawerPeriod`, `drawerHasSplit`, `drawerSplitLabel`, `drawerLines`, `drawerTotal`, `drawerHasNote`, `drawerNote`, `drawerNoteStyle`, `drawerNoteLabel`, `drawerActivity`, `onOpenFamilyFromInvoice`

- [ ] **Step 1: Replace the invoice-body placeholder**

Replace `<div>Invoice body</div>` with:

```html
          <div>
            <div style="font-size:var(--font-size-lg); font-weight:700;">{{ drawerPayor }}</div>
            <div style="font-size:var(--font-size-xs); font-weight:600; color:var(--gray-6);">{{ drawerEmail }}</div>
            <div style="display:flex; align-items:center; gap:6px; padding-top:var(--space-xxs); font-size:var(--font-size-xs); font-weight:600;">
              <button onClick="{{ onOpenFamilyFromInvoice }}" style="padding:0; border:none; background:none; font-family:inherit; font-size:inherit; font-weight:700; color:var(--cotton-candy--500); cursor:pointer;" style-hover="text-decoration:underline;">{{ drawerFamily }}</button>
              <span style="color:var(--gray-5);">&middot;</span>
              <span style="color:var(--gray-6);">{{ drawerChild }}</span>
            </div>
            <div style="padding-top:var(--space-xxs); font-size:var(--font-size-xs); font-weight:600; color:var(--gray-6);">Billing period <span style="color:var(--blueberry-pie--500); font-weight:700;">{{ drawerPeriod }}</span></div>

            <sc-if value="{{ drawerHasSplit }}" hint-placeholder-val="{{ false }}">
              <div style="margin-top:var(--space-md); padding:var(--space-xs) var(--space-sm); border-left:3px solid var(--cotton-candy--500); background:var(--cotton-candy--50); font-size:var(--font-size-xs); font-weight:700;">{{ drawerSplitLabel }}</div>
            </sc-if>

            <div style="margin-top:var(--space-md); font-size:var(--font-size-xxs); font-weight:700; letter-spacing:.08em; color:var(--gray-5);">CHARGES</div>
            <sc-for list="{{ drawerLines }}" as="line" hint-placeholder-count="2">
              <div style="display:flex; align-items:flex-start; gap:var(--space-sm); padding:var(--space-xs) 0; border-bottom:1px solid var(--gray-2);">
                <div style="flex:1; min-width:0;">
                  <div style="font-size:var(--font-size-xs); font-weight:700;">{{ line.label }}</div>
                  <sc-if value="{{ line.hasDetail }}" hint-placeholder-val="{{ false }}">
                    <div style="font-size:var(--font-size-xxs); font-weight:600; color:var(--gray-5);">{{ line.detail }}</div>
                  </sc-if>
                </div>
                <div style="{{ line.amountStyle }}">{{ line.amount }}</div>
              </div>
            </sc-for>
            <div style="display:flex; align-items:center; gap:var(--space-sm); padding:var(--space-xs) 0;">
              <div style="flex:1; font-size:var(--font-size-base); font-weight:700;">Total due</div>
              <div style="font-size:var(--font-size-base); font-weight:700; font-variant-numeric:tabular-nums;">{{ drawerTotal }}</div>
            </div>

            <sc-if value="{{ drawerHasNote }}" hint-placeholder-val="{{ false }}">
              <div style="{{ drawerNoteStyle }}">
                <div style="font-size:var(--font-size-xxs); font-weight:700; letter-spacing:.08em;">{{ drawerNoteLabel }}</div>
                <div style="padding-top:4px; font-size:var(--font-size-xs); font-weight:600;">{{ drawerNote }}</div>
              </div>
            </sc-if>

            <div style="margin-top:var(--space-md); font-size:var(--font-size-xxs); font-weight:700; letter-spacing:.08em; color:var(--gray-5);">ACTIVITY</div>
            <div style="padding-top:var(--space-xxs); font-size:var(--font-size-xs); font-weight:600; color:var(--gray-6);">{{ drawerActivity }}</div>
          </div>
```

- [ ] **Step 2: Add a `drawerVals()` helper**

Add this method directly above `renderVals()`. It keeps `renderVals()` from growing further.

```js
  /* Everything the invoice drawer renders. Returns {} when no invoice is open
     so the spread is a no-op. */
  drawerVals(inv) {
    if (!inv) return {};
    const pct = inv.share && inv.share.type === 'pct';
    const note = noteOf(inv);
    const activity = ['Created ' + inv.createdAt + ' · Billing run 2026-08']
      .concat(inv.approvedAt ? ['Approved ' + inv.approvedAt] : [])
      .concat(inv.deniedAt ? ['Denied ' + inv.deniedAt] : []);

    return {
      drawerPayor: inv.payor,
      drawerEmail: inv.payorEmail,
      drawerFamily: inv.family,
      drawerChild: inv.child,
      drawerPeriod: 'Aug 1 – 31, 2026',
      drawerHasSplit: !!inv.share,
      drawerSplitLabel: !inv.share ? ''
        : pct ? Math.round(inv.share.value * 100) + '% of ' + inv.child + '’s charges'
        : 'Fixed share of ' + fmtMoney(inv.amount) + ' of ' + inv.child + '’s charges',
      drawerLines: inv.lineItems.map(l => ({
        label: l.label,
        /* Per-line detail is only honest for percentage splits. A fixed-dollar
           split has no per-line percentage to quote. */
        hasDetail: pct,
        detail: pct ? Math.round(inv.share.value * 100) + '% of ' + fmtMoney(l.full) : '',
        amount: fmtMoney(l.amount),
        amountStyle: {
          fontSize:'var(--font-size-xs)', fontWeight:700, fontVariantNumeric:'tabular-nums',
          color: l.amount < 0 ? 'var(--danger-700)' : 'var(--blueberry-pie--500)',
        },
      })),
      drawerTotal: fmtMoney(inv.amount),
      drawerHasNote: !!note,
      drawerNote: note,
      drawerNoteLabel: inv.approval === 'Denied' ? 'REASON FOR DENIAL' : 'NOTE',
      drawerNoteStyle: {
        marginTop:'var(--space-md)', padding:'var(--space-xs) var(--space-sm)',
        borderLeft:'3px solid ' + (inv.approval === 'Denied' ? 'var(--danger-500)' : 'var(--gray-4)'),
        background: inv.approval === 'Denied' ? 'rgb(238 191 193 / 45%)' : 'var(--gray-1)',
        color: inv.approval === 'Denied' ? 'var(--danger-700)' : 'var(--gray-6)',
      },
      drawerActivity: activity.join(' · '),
      onOpenFamilyFromInvoice: () => this.openFamily(inv.family),
    };
  }
```

- [ ] **Step 3: Spread it into the return**

In `renderVals()`, change the return statement's opening from:

```js
    return {
      billingPeriodLabel: 'Aug 1 – 31, 2026',
```

to:

```js
    return Object.assign(this.drawerVals(drawerInv), {
      billingPeriodLabel: 'Aug 1 – 31, 2026',
```

and change the closing `};` of that return to `});`.

- [ ] **Step 4: Verify percentage split**

Reload, click `DRF-2041`. Expected exactly:

```
Marcus Johnson
m.johnson@email.com
Johnson Family · Ava Johnson
Billing period Aug 1 – 31, 2026
[ 60% of Ava Johnson’s charges ]
CHARGES
Tuition, August        $620.00
  60% of $1,033.33
Late pickup fee         $30.00
  60% of $50.00
Total due              $650.00
ACTIVITY
Created 1 Aug 2026 · Billing run 2026-08
```

- [ ] **Step 5: Verify fixed split and non-split**

Click `DRF-2045` (fixed split): band reads `Fixed share of $800.00 of Noah Smith’s charges`, one line `Tuition, August $800.00` with **no** sub-text, total `$800.00`.

Click `DRF-2055` (non-split with discount): no band, lines `Tuition, August $687.50` and `Sibling discount -$62.50` in red, total `$625.00`.

Turn on Show denied, click `DRF-2051`: red-bordered `REASON FOR DENIAL` block reads `Child withdrew before the billing period started.`, activity reads `Created 1 Aug 2026 · Billing run 2026-08 · Denied 28 Jul 2026`.

- [ ] **Step 6: Checkpoint**

All three split variants render, every drawer's lines sum to the row's Amount, negative amounts are red.

---

### Task 4: Drawer footer

**Files:**
- Modify: `Draft Invoices.dc.html` — drawer template, `drawerVals()`

**Interfaces:**
- Produces render values: `drawerIsDraft`, `drawerIsApproved`, `onDrawerApprove`, `onDrawerDeny`, `onDrawerRevert`, `onPrint`, `onDownload`, `onOpenLedger`
- Note: `onDrawerApprove` / `onDrawerDeny` are wired to real behaviour in Tasks 5 and 6. This task stubs them with toasts so the footer is verifiable on its own.

- [ ] **Step 1: Add the footer to the drawer template**

Insert directly before the closing `</aside>`:

```html
      <div style="display:flex; flex-direction:column; gap:var(--space-xs); padding:var(--space-md); border-top:1px solid var(--gray-3); background:var(--gray-1);">
        <sc-if value="{{ drawerIsDraft }}" hint-placeholder-val="{{ true }}">
          <div style="display:flex; align-items:center; gap:var(--space-xs);">
            <button onClick="{{ onDrawerApprove }}" style="flex:1; padding:10px 18px; border:none; border-radius:35px; font-family:inherit; font-size:var(--font-size-base); font-weight:700; color:#fff; background:var(--blueberry-pie--500); cursor:pointer;" style-hover="background:var(--blueberry-pie--300);">Approve</button>
            <button onClick="{{ onDrawerDeny }}" style="flex:1; padding:10px 18px; border:1px solid var(--danger-500); border-radius:35px; font-family:inherit; font-size:var(--font-size-base); font-weight:700; color:var(--danger-700); background:#fff; cursor:pointer;" style-hover="background:rgb(238 191 193 / 45%);">Deny</button>
          </div>
        </sc-if>
        <sc-if value="{{ drawerIsApproved }}" hint-placeholder-val="{{ false }}">
          <button onClick="{{ onDrawerRevert }}" style="padding:10px 18px; border:1px solid var(--gray-4); border-radius:35px; font-family:inherit; font-size:var(--font-size-base); font-weight:700; color:var(--blueberry-pie--500); background:#fff; cursor:pointer;" style-hover="background:var(--gray-2);">Return to draft</button>
        </sc-if>
        <div style="display:flex; align-items:center; gap:var(--space-md);">
          <button onClick="{{ onPrint }}" style="display:flex; align-items:center; gap:6px; padding:0; border:none; background:none; font-family:inherit; font-size:var(--font-size-xs); font-weight:700; color:var(--gray-6); cursor:pointer;" style-hover="color:var(--blueberry-pie--500);">
            <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M28 9h-3V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v5H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5h3a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2ZM9 5h14v4H9Zm14 22H9v-8h14Zm5-7h-3v-3H7v3H4v-9h24Z"></path></svg>
            Print
          </button>
          <button onClick="{{ onDownload }}" style="display:flex; align-items:center; gap:6px; padding:0; border:none; background:none; font-family:inherit; font-size:var(--font-size-xs); font-weight:700; color:var(--gray-6); cursor:pointer;" style-hover="color:var(--blueberry-pie--500);">
            <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M26 24v4H6v-4H4v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-4Z"></path><path d="M26 14l-1.41-1.41L17 20.17V2h-2v18.17l-7.59-7.58L6 14l10 10 10-10z"></path></svg>
            Download PDF
          </button>
          <button onClick="{{ onOpenLedger }}" style="margin-left:auto; padding:0; border:none; background:none; font-family:inherit; font-size:var(--font-size-xs); font-weight:700; color:var(--cotton-candy--500); cursor:pointer;" style-hover="text-decoration:underline;">View family ledger &rarr;</button>
        </div>
      </div>
```

- [ ] **Step 2: Add the footer values**

Add to the object returned by `drawerVals(inv)`:

```js
      drawerIsDraft: inv.approval === 'Draft',
      drawerIsApproved: inv.approval === 'Approved',
      onDrawerApprove: () => this.showToast('Approve — wired in Task 5'),
      onDrawerDeny: () => this.showToast('Deny — wired in Task 6'),
      onDrawerRevert: () => this.showToast('Return to draft — wired in Task 7'),
      onPrint: () => this.showToast('Preparing invoice PDF…'),
      onDownload: () => this.showToast('Preparing invoice PDF…'),
      onOpenLedger: () => this.showToast('Family ledger — wired in Task 10'),
```

- [ ] **Step 3: Verify footer by status**

`DRF-2041` (Draft): Approve and Deny side by side, plus Print / Download PDF / View family ledger.
`DRF-2043` (Approved): single `Return to draft` button, no Approve/Deny.
`DRF-2051` (Denied, Show denied on): no primary buttons at all, secondary row still present.

Click Print — toast reads `Preparing invoice PDF…`. Toast renders above the drawer, not behind it.

- [ ] **Step 4: Checkpoint**

Three footer variants correct; toast z-order above the drawer (toast is `z-index:1200`, drawer `1151`).

---

### Task 5: Approve from the drawer — confirm modal and auto-advance

**Files:**
- Modify: `Draft Invoices.dc.html` — `state`, approve modal template, `renderVals()`, `drawerVals()`

**Interfaces:**
- Changes shape: `state.approve` becomes `null | { ids:[String], source:'batch'|'drawer' }` (was a bare array). Every reader must be updated in this task.
- Produces methods: `buildQueue(rows)`, `advanceQueue()`
- Produces state: `queue: null | { ids:[String], index:Number }`
- Produces render values: `drawerHasQueue`, `drawerQueueLabel`, `onQueuePrev`, `onQueueNext`, `drawerQueuePrevStyle`, `drawerQueueNextStyle`, `queueExhausted`

- [ ] **Step 1: Migrate `state.approve` to an object**

In `renderVals()`, replace:

```js
    const approveTargets = s.approve || [];
```

with:

```js
    const approveTargets = s.approve ? s.approve.ids : [];
    const approveSource = s.approve ? s.approve.source : null;
```

Replace the batch handler:

```js
      onBatchApprove: () => this.setState({ approve: selectedIds.slice() }),
```

with:

```js
      onBatchApprove: () => this.setState({ approve: { ids: selectedIds.slice(), source:'batch' } }),
```

- [ ] **Step 2: Build the queue when the drawer opens from the grid**

Replace `openInvoice` with:

```js
  openInvoice(id, backTo) {
    /* The queue is snapshotted on open. It deliberately does not recompute as
       invoices change status — otherwise approving under an active Draft filter
       reshuffles the list mid-review and "next" becomes unpredictable. */
    const drafts = this.filtered().filter(i => i.approval === 'Draft').map(i => i.id);
    const index = drafts.indexOf(id);
    this.setState({
      drawer: { view:'invoice', invoiceId:id, familyName:null, backTo: backTo || null },
      queue: index === -1 ? null : { ids: drafts, index },
      menu: null,
    });
  }
```

- [ ] **Step 3: Add `advanceQueue`**

Add directly below `closeDrawer()`:

```js
  /* Called after a decision. Walks the snapshot forward; when it runs out the
     drawer shows its exhausted state rather than closing under the user. */
  advanceQueue() {
    this.setState(st => {
      if (!st.queue) return { drawer:null };
      const next = st.queue.index + 1;
      if (next >= st.queue.ids.length) {
        return { queue: Object.assign({}, st.queue, { index: next }), drawer: Object.assign({}, st.drawer, { invoiceId: null }) };
      }
      return { queue: Object.assign({}, st.queue, { index: next }), drawer: Object.assign({}, st.drawer, { invoiceId: st.queue.ids[next] }) };
    });
  }
```

- [ ] **Step 4: Add the queue counter to the drawer header**

In the drawer header, insert directly before the close button:

```html
        <sc-if value="{{ drawerHasQueue }}" hint-placeholder-val="{{ false }}">
          <span style="display:flex; align-items:center; gap:2px; margin-left:auto;">
            <button onClick="{{ onQueuePrev }}" aria-label="Previous draft" style="{{ drawerQueuePrevStyle }}"><svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" style="transform:rotate(90deg);"><path d="M16 22L6 12l1.4-1.4 8.6 8.6 8.6-8.6L26 12z"></path></svg></button>
            <span style="font-size:var(--font-size-xs); font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap;">{{ drawerQueueLabel }}</span>
            <button onClick="{{ onQueueNext }}" aria-label="Next draft" style="{{ drawerQueueNextStyle }}"><svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" style="transform:rotate(-90deg);"><path d="M16 22L6 12l1.4-1.4 8.6 8.6 8.6-8.6L26 12z"></path></svg></button>
          </span>
        </sc-if>
```

Remove `margin-left:auto;` from the close button's style so the counter owns the spacer.

- [ ] **Step 5: Add the exhausted state**

In the drawer body, wrap the existing invoice body `sc-if` so the exhausted state can take its place. Change `<sc-if value="{{ drawerIsInvoice }}"` on the **body** block to `<sc-if value="{{ drawerShowInvoice }}"`, and add directly after that block:

```html
        <sc-if value="{{ queueExhausted }}" hint-placeholder-val="{{ false }}">
          <div style="display:flex; flex-direction:column; align-items:center; gap:var(--space-sm); padding:var(--space-2xl) var(--space-md); text-align:center;">
            <span style="display:grid; place-items:center; width:48px; height:48px; border-radius:50%; background:var(--gummy-sharks--100); color:var(--gummy-sharks--900);"><svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M13 24 4 15l1.4-1.4L13 21.2 26.6 7.6 28 9z"></path></svg></span>
            <span style="font-size:var(--font-size-lg); font-weight:700;">No drafts left to review</span>
            <span style="font-size:var(--font-size-xs); font-weight:600; color:var(--gray-6);">You've worked through every draft in this view.</span>
            <button onClick="{{ onCloseDrawer }}" style="margin-top:var(--space-xs); padding:10px 28px; border:none; border-radius:35px; font-family:inherit; font-size:var(--font-size-base); font-weight:700; color:#fff; background:var(--blueberry-pie--500); cursor:pointer;" style-hover="background:var(--blueberry-pie--300);">Close</button>
          </div>
        </sc-if>
```

The header's status pill and the footer must also hide in this state: change `drawerIsInvoice` to `drawerShowInvoice` on the header pill `sc-if`, and on the footer's `drawerIsDraft` / `drawerIsApproved` blocks nothing changes (both are false when no invoice is loaded), but wrap the secondary Print/Download/ledger row in `<sc-if value="{{ drawerShowInvoice }}" hint-placeholder-val="{{ true }}">`.

- [ ] **Step 6: Add the queue render values**

Add to `renderVals()`'s returned object, beside the other drawer values:

```js
      drawerShowInvoice: !!(s.drawer && s.drawer.view === 'invoice' && s.drawer.invoiceId),
      queueExhausted: !!(s.drawer && s.drawer.view === 'invoice' && !s.drawer.invoiceId),
      drawerHasQueue: !!(s.queue && s.drawer && s.drawer.invoiceId),
      drawerQueueLabel: s.queue ? (s.queue.index + 1) + ' of ' + s.queue.ids.length : '',
      onQueuePrev: s.queue && s.queue.index > 0
        ? () => this.setState(st => ({ queue: Object.assign({}, st.queue, { index: st.queue.index - 1 }), drawer: Object.assign({}, st.drawer, { invoiceId: st.queue.ids[st.queue.index - 1] }) }))
        : null,
      onQueueNext: s.queue && s.queue.index < s.queue.ids.length - 1
        ? () => this.setState(st => ({ queue: Object.assign({}, st.queue, { index: st.queue.index + 1 }), drawer: Object.assign({}, st.drawer, { invoiceId: st.queue.ids[st.queue.index + 1] }) }))
        : null,
      drawerQueuePrevStyle: queueArrowStyle(!!(s.queue && s.queue.index > 0)),
      drawerQueueNextStyle: queueArrowStyle(!!(s.queue && s.queue.index < s.queue.ids.length - 1)),
```

Add this module-level helper directly below `pillStyle`:

```js
function queueArrowStyle(enabled) {
  return {
    display:'grid', placeItems:'center', width:'24px', height:'24px', padding:0,
    border:'none', borderRadius:'var(--radius-xs-plus)', background:'transparent', color:'#fff',
    opacity: enabled ? 1 : 0.35,
    cursor: enabled ? 'pointer' : 'not-allowed',
  };
}
```

- [ ] **Step 7: Wire drawer approve to the modal**

In `drawerVals(inv)`, replace the stub:

```js
      onDrawerApprove: () => this.showToast('Approve — wired in Task 5'),
```

with:

```js
      onDrawerApprove: () => this.setState({ approve: { ids:[inv.id], source:'drawer' } }),
```

- [ ] **Step 8: Update the approve modal copy and submit**

Replace `approveHeading` and `approveBody` with:

```js
      approveHeading: approveTargets.length > 1 ? 'Approve ' + approveTargets.length + ' invoices' : 'Approve invoice',
      approveBody: approveTargets.length > 1
        ? 'Approve ' + approveTargets.length + ' draft invoices, totalling '
          + fmtMoney(all.filter(i => approveTargets.indexOf(i.id) !== -1).reduce((a, i) => a + i.amount, 0))
          + '? Approved invoices are queued for the next send and can no longer be edited.'
        : 'Approve ' + approveTargets[0] + ' for '
          + fmtMoney((all.find(i => i.id === approveTargets[0]) || { amount:0 }).amount)
          + '? Approved invoices are queued for the next send and can no longer be edited.',
```

Replace `onSubmitApprove` with:

```js
      onSubmitApprove: () => {
        const targets = approveTargets.slice();
        const n = targets.length;
        const fromDrawer = approveSource === 'drawer';
        this.setApproval(targets, 'Approved');
        this.setState({ approve: null });
        if (fromDrawer) {
          this.showToast(targets[0] + ' approved');
          this.advanceQueue();
        } else {
          this.showToast(n + ' invoice' + (n !== 1 ? 's' : '') + ' approved', () => this.setApproval(targets, 'Draft'));
        }
      },
```

Confirmed actions do not also offer undo — the modal was the checkpoint.

- [ ] **Step 9: Record the approval date**

In `setApproval`, replace the mapping line with:

```js
      invoices: st.invoices.map(i => ids.indexOf(i.id) === -1 ? i : Object.assign({}, i, {
        approval,
        denyReason: approval === 'Denied' ? reason : undefined,
        approvedAt: approval === 'Approved' ? '13 Aug 2026' : undefined,
        deniedAt: approval === 'Denied' ? '13 Aug 2026' : i.deniedAt,
      })),
```

- [ ] **Step 10: Verify the queue**

Reload. Click `DRF-2041`. Header reads `1 of 19`. Click `Approve` → modal reads `Approve DRF-2041 for $650.00?` → confirm. Expected: toast `DRF-2041 approved` with **no** Undo button, header now reads `2 of 19` showing `DRF-2042`, and the grid behind shows DRF-2041 with a green check.

Click `›` repeatedly to the end, then approve the last one: body swaps to `No drafts left to review`, header pill and footer buttons gone, Close works.

Batch approve still shows the plural modal and still offers Undo.

- [ ] **Step 11: Checkpoint**

Queue advances, counter accurate, exhausted state renders, batch path unchanged.

---

### Task 6: Deny from the drawer

**Files:**
- Modify: `Draft Invoices.dc.html` — `state`, `renderVals()`, `drawerVals()`

**Interfaces:**
- Changes shape: `state.deny` becomes `null | { ids:[String], source:'batch'|'row'|'drawer' }` (was a bare array)

- [ ] **Step 1: Migrate `state.deny` to an object**

In `renderVals()`, replace:

```js
    const denyTargets = s.deny || [];
```

with:

```js
    const denyTargets = s.deny ? s.deny.ids : [];
    const denySource = s.deny ? s.deny.source : null;
```

Update the three existing setters:

```js
      onBatchDeny: () => this.setState({ deny: { ids: selectedIds.slice(), source:'batch' }, denyReason:'' }),
```

In the row overflow menu items:

```js
          { label:'Deny…', style: menuItemStyle('danger'), onPick: () => this.setState({ deny:{ ids:[menuInv.id], source:'row' }, denyReason:'', menu:null }) },
```

- [ ] **Step 2: Wire drawer deny**

In `drawerVals(inv)`, replace the stub:

```js
      onDrawerDeny: () => this.showToast('Deny — wired in Task 6'),
```

with:

```js
      onDrawerDeny: () => this.setState({ deny: { ids:[inv.id], source:'drawer' }, denyReason:'' }),
```

- [ ] **Step 3: Advance after a drawer denial**

Replace `onSubmitDeny` with:

```js
      onSubmitDeny: () => {
        if (!s.denyReason.trim()) return;
        const n = denyTargets.length;
        const fromDrawer = denySource === 'drawer';
        this.setApproval(denyTargets, 'Denied', s.denyReason.trim());
        this.setState({ deny: null, denyReason:'' });
        this.showToast(n + ' invoice' + (n !== 1 ? 's' : '') + ' denied');
        if (fromDrawer) this.advanceQueue();
      },
```

- [ ] **Step 4: Raise the modal above the drawer**

The deny and approve modal overlays are `z-index:1000`, below the drawer's `1151`. Change both modal overlay `z-index:1000` values to `z-index:1200`, and the toast from `1200` to `1300`, so the stack is drawer → modal → toast.

- [ ] **Step 5: Verify**

Open `DRF-2042`, click Deny. Modal appears **over** the drawer. Submit without a reason — button is disabled. Enter `Split percentage is wrong`, submit. Expected: toast `1 invoice denied`, drawer advances to the next draft, and the denied invoice's Notes cell in the grid reads the reason in red once Show denied is on.

Row-menu deny and batch deny both still work and do **not** advance anything.

- [ ] **Step 6: Checkpoint**

Deny works from three sources; only the drawer source advances; modal sits above the drawer.

---

### Task 7: Return to draft from the drawer

**Files:**
- Modify: `Draft Invoices.dc.html` — `drawerVals()`

- [ ] **Step 1: Wire it**

Replace the stub:

```js
      onDrawerRevert: () => this.showToast('Return to draft — wired in Task 7'),
```

with:

```js
      /* Reversible and not a queue decision: no modal, no advance. */
      onDrawerRevert: () => {
        this.setApproval([inv.id], 'Draft');
        this.showToast(inv.id + ' returned to draft', () => this.setApproval([inv.id], 'Approved'));
      },
```

- [ ] **Step 2: Verify**

Open `DRF-2043` (Approved) from the grid. Footer shows only `Return to draft`. Click it. Expected: no modal; toast `DRF-2043 returned to draft` with an Undo button; the drawer stays on DRF-2043 and its header pill flips to `Draft`, footer flips to Approve / Deny. Click Undo — pill returns to `Approved`.

- [ ] **Step 3: Checkpoint**

No modal, no advance, undo restores.

---

### Task 8: Family drawer

**Files:**
- Modify: `Draft Invoices.dc.html` — drawer template, `renderVals()`, grid row family cell, group header

**Interfaces:**
- Consumes: `openFamily(name)` (Task 2)
- Produces render values: `familyMeta`, `familyChildren`, `onOpenLedgerFamily`

- [ ] **Step 1: Replace the family-body placeholder**

Replace `<div>Family body</div>` with:

```html
          <div>
            <div style="font-size:var(--font-size-xs); font-weight:700; color:var(--gray-6);">{{ familyMeta }}</div>
            <sc-for list="{{ familyChildren }}" as="kid" hint-placeholder-count="2">
              <div style="margin-top:var(--space-md);">
                <div style="display:flex; align-items:baseline; gap:var(--space-xs); padding-bottom:var(--space-xxs); border-bottom:1px solid var(--gray-3);">
                  <span style="font-size:var(--font-size-base); font-weight:700;">{{ kid.name }}</span>
                  <span style="font-size:var(--font-size-xxs); font-weight:600; color:var(--gray-5);">{{ kid.childId }}</span>
                  <span style="margin-left:auto; font-size:var(--font-size-base); font-weight:700; font-variant-numeric:tabular-nums;">{{ kid.total }}</span>
                </div>
                <sc-for list="{{ kid.invoices }}" as="row" hint-placeholder-count="2">
                  <button onClick="{{ row.onOpen }}" style="display:flex; align-items:center; gap:var(--space-xs); width:100%; padding:var(--space-xs) var(--space-xxs); border:none; border-bottom:1px solid var(--gray-2); background:transparent; font-family:inherit; text-align:left; cursor:pointer;" style-hover="background:var(--gray-1);">
                    <span style="{{ row.iconStyle }}"><svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="{{ row.iconPath }}"></path></svg></span>
                    <span style="font-size:var(--font-size-xs); font-weight:700; color:var(--cotton-candy--500); white-space:nowrap;">{{ row.id }}</span>
                    <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:var(--font-size-xs); font-weight:600;">{{ row.payor }}</span>
                    <span style="font-size:var(--font-size-xxs); font-weight:700; color:var(--gray-5); white-space:nowrap;">{{ row.share }}</span>
                    <span style="font-size:var(--font-size-xs); font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap;">{{ row.amount }}</span>
                    <svg width="12" height="12" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" style="transform:rotate(-90deg); color:var(--gray-5);"><path d="M16 22L6 12l1.4-1.4 8.6 8.6 8.6-8.6L26 12z"></path></svg>
                  </button>
                </sc-for>
              </div>
            </sc-for>
          </div>
```

- [ ] **Step 2: Add a footer branch for the family view**

In the drawer footer, wrap the secondary row's ledger link so it appears in both views. Add directly after the `drawerShowInvoice` secondary block:

```html
        <sc-if value="{{ drawerIsFamily }}" hint-placeholder-val="{{ false }}">
          <button onClick="{{ onOpenLedgerFamily }}" style="padding:0; border:none; background:none; font-family:inherit; font-size:var(--font-size-xs); font-weight:700; color:var(--cotton-candy--500); text-align:left; cursor:pointer;" style-hover="text-decoration:underline;">View family ledger &rarr;</button>
        </sc-if>
```

- [ ] **Step 3: Build the family values**

Add to `renderVals()`'s returned object:

```js
      familyMeta: (() => {
        if (!s.drawer || s.drawer.view !== 'family') return '';
        /* Denied invoices appear here only when the grid is showing them, so
           the drawer's totals can never contradict the grid's. */
        const list = all.filter(i => i.family === s.drawer.familyName && (s.showDenied || i.approval !== 'Denied'));
        const kids = [];
        list.forEach(i => { if (kids.indexOf(i.childId) === -1) kids.push(i.childId); });
        return kids.length + (kids.length === 1 ? ' child · ' : ' children · ')
          + list.length + ' invoice' + (list.length !== 1 ? 's' : '') + ' · '
          + fmtMoney(list.reduce((a, i) => a + i.amount, 0));
      })(),
      familyChildren: (() => {
        if (!s.drawer || s.drawer.view !== 'family') return [];
        const list = all.filter(i => i.family === s.drawer.familyName && (s.showDenied || i.approval !== 'Denied'));
        const ids = [];
        list.forEach(i => { if (ids.indexOf(i.childId) === -1) ids.push(i.childId); });
        return ids.map(cid => {
          const kidRows = list.filter(i => i.childId === cid);
          return {
            name: kidRows[0].child,
            childId: cid,
            total: fmtMoney(kidRows.reduce((a, i) => a + i.amount, 0)),
            invoices: kidRows.map(i => ({
              id: i.id,
              payor: i.payor,
              share: i.splitValue || '—',
              amount: fmtMoney(i.amount),
              iconPath: (APPROVAL_ICON[i.approval] || {}).path,
              iconStyle: { display:'grid', placeItems:'center', width:'16px', height:'16px', color:(APPROVAL_ICON[i.approval] || {}).color },
              onOpen: () => this.openInvoice(i.id, s.drawer.familyName),
            })),
          };
        });
      })(),
      onOpenLedgerFamily: () => this.showToast('Family ledger — wired in Task 10'),
```

- [ ] **Step 4: Make the family cell open the drawer**

In the row template, replace the family cell:

```html
                      <div style="{{ row.familyCellStyle }}">{{ row.family }}</div>
```

with:

```html
                      <div style="{{ row.familyCellStyle }}"><button onClick="{{ row.onOpenFamily }}" style="padding:0; border:none; background:none; font-family:inherit; font-size:inherit; font-weight:inherit; color:inherit; text-align:left; cursor:pointer;" style-hover="text-decoration:underline;">{{ row.family }}</button></div>
```

and add to the row mapping, beside `onSelect`:

```js
        onOpenFamily: () => this.openFamily(inv.family),
```

- [ ] **Step 5: Make the family group header open the drawer**

In the group header template, replace:

```html
                      <span>{{ row.groupLabel }}</span>
```

with:

```html
                      <button onClick="{{ row.onOpenGroup }}" style="padding:0; border:none; background:none; font-family:inherit; font-size:inherit; font-weight:inherit; color:inherit; text-align:left; cursor:{{ row.groupCursor }};" style-hover="text-decoration:underline;">{{ row.groupLabel }}</button>
```

and add to the group row object built in the grouping loop:

```js
          onOpenGroup: s.groupBy === 'family' && fam !== 'Other' ? () => this.openFamily(fam) : null,
          groupCursor: s.groupBy === 'family' && fam !== 'Other' ? 'pointer' : 'default',
```

Grouping by enrollment change produces group labels that are not families, so those headers stay inert.

- [ ] **Step 6: Verify**

Click `Johnson Family` in any row. Expected header `Johnson Family`, meta `2 children · 3 invoices · $1,693.33`, then `Ava Johnson CH-101 $1,083.33` with DRF-2041 (60%) and DRF-2042 (40%) beneath it, then `Eli Johnson CH-118 $610.00` with DRF-2063.

Click `Smith Family`: `2 children · 3 invoices`, Noah Smith with two fixed-split invoices, Mia Smith with one.

Group by Family, click a group header label — same drawer opens. Click the chevron instead — it still collapses, without opening the drawer.

- [ ] **Step 7: Checkpoint**

Family drawer opens from three places, totals match the grid, denied invoices respect the toggle.

---

### Task 9: Family ↔ invoice navigation

**Files:**
- Modify: `Draft Invoices.dc.html` — drawer header template, `renderVals()`

**Interfaces:**
- Consumes: `drawer.backTo` (Task 2), `openInvoice(id, backTo)` (Task 5)
- Produces render values: `drawerHasBack`, `drawerBackLabel`, `onDrawerBack`

- [ ] **Step 1: Add the back link**

In the drawer header, insert directly before the title `<span>`:

```html
        <sc-if value="{{ drawerHasBack }}" hint-placeholder-val="{{ false }}">
          <button onClick="{{ onDrawerBack }}" style="display:flex; align-items:center; gap:4px; padding:0; border:none; background:none; font-family:inherit; font-size:var(--font-size-xs); font-weight:700; color:#fff; cursor:pointer;" style-hover="text-decoration:underline;">
            <svg width="12" height="12" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" style="transform:rotate(90deg);"><path d="M16 22L6 12l1.4-1.4 8.6 8.6 8.6-8.6L26 12z"></path></svg>
            {{ drawerBackLabel }}
          </button>
        </sc-if>
```

Wrap the title and back link in a column so the header reads as two lines when a back link is present: change the header's outer `div` style from `display:flex; align-items:center; gap:var(--space-xs);` to `display:flex; align-items:center; flex-wrap:wrap; gap:var(--space-xs) var(--space-sm);` and give the back-link `sc-if` block `width:100%` on its button.

- [ ] **Step 2: Add the values**

```js
      drawerHasBack: !!(s.drawer && s.drawer.backTo),
      drawerBackLabel: s.drawer && s.drawer.backTo ? s.drawer.backTo : '',
      onDrawerBack: s.drawer && s.drawer.backTo ? () => this.openFamily(s.drawer.backTo) : null,
```

- [ ] **Step 3: Verify**

Open `Johnson Family` → click DRF-2042 → invoice drawer shows `‹ Johnson Family` above the title. Click it → back to the family drawer. Open DRF-2042 directly from the grid → **no** back link, and a queue counter instead.

Note: an invoice opened from the family drawer has no queue, so approving it closes the drawer (`advanceQueue` with a null queue). Confirm that happens and does not error.

- [ ] **Step 4: Checkpoint**

Back link appears only on the family→invoice path; grid→invoice keeps the queue counter.

---

### Task 10: Family ledger interstitial

**Files:**
- Modify: `Draft Invoices.dc.html` — new modal at template root, `renderVals()`, `drawerVals()`

**Interfaces:**
- Consumes: `state.ledgerOpen`, `state.ledgerSuppressed` (Task 2)
- Produces render values: `ledgerOpen`, `ledgerSuppressChecked`, `onToggleLedgerSuppress`, `onOpenLedgerConfirm`, `onCloseLedger`

- [ ] **Step 1: Add the modal**

Insert directly after the approve-modal `sc-if` block at the template root:

```html
  <sc-if value="{{ ledgerOpen }}" hint-placeholder-val="{{ false }}">
    <div style="position:fixed; inset:0; z-index:1200; display:flex; align-items:center; justify-content:center; background:rgb(0 0 0 / 50%);">
      <div role="dialog" aria-modal="true" style="width:min(34rem, 92vw); padding:var(--space-lg); border-radius:10px; background:var(--blueberry-pie--500);">
        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:var(--space-xs);">
          <h2 style="margin:0; font-size:var(--font-size-xl); font-weight:700; color:#fff;">Invoices can't be edited</h2>
          <button onClick="{{ onCloseLedger }}" aria-label="Close" style="display:grid; place-items:center; width:var(--space-lg); height:var(--space-lg); padding:0; border:1px solid #fff; background:transparent; color:#fff; font-size:12px; line-height:1; cursor:pointer;">&#10005;</button>
        </div>
        <div style="background:#fff; padding:var(--space-md); display:flex; flex-direction:column; gap:var(--space-sm);">
          <p style="margin:0; font-size:var(--font-size-base); line-height:1.5; color:var(--gray-6);">The family ledger is the source of truth for charges and credits. Changes you make there won't alter an invoice that's already been generated — you'll need to generate a new invoice for the corrected amount.</p>
          <label style="display:flex; align-items:center; gap:var(--space-xs); font-size:var(--font-size-xs); font-weight:700; color:var(--blueberry-pie--500); cursor:pointer;">
            <input type="checkbox" checked="{{ ledgerSuppressChecked }}" onChange="{{ onToggleLedgerSuppress }}" style="width:15px; height:15px; accent-color:var(--blueberry-pie--200); cursor:pointer;">
            Don't show this again
          </label>
        </div>
        <div style="display:flex; justify-content:flex-end; align-items:center; gap:var(--space-md); padding:1rem 0 0;">
          <button onClick="{{ onCloseLedger }}" style="height:2rem; padding:0 2rem; border:none; border-radius:35px; font-family:inherit; font-size:var(--font-size-base); font-weight:700; color:var(--blueberry-pie--500); background:var(--toasted-marshmallow--500); cursor:pointer;" style-hover="background:var(--toasted-marshmallow--700);">Back to invoice</button>
          <button onClick="{{ onOpenLedgerConfirm }}" style="height:2rem; padding:0 2rem; border:none; border-radius:35px; font-family:inherit; font-size:var(--font-size-base); font-weight:700; color:#fff; background:var(--cotton-candy--500); cursor:pointer;" style-hover="background:var(--cotton-candy--300);">Open family ledger</button>
        </div>
      </div>
    </div>
  </sc-if>
```

- [ ] **Step 2: Add the handler and values**

Add this method directly below `closeDrawer()`:

```js
  /* Suppressed, the link goes straight through to the (stubbed) ledger. */
  requestLedger() {
    if (this.state.ledgerSuppressed) return this.showToast('Family ledger — coming next');
    this.setState({ ledgerOpen: true });
  }
```

Add to `renderVals()`'s returned object:

```js
      ledgerOpen: s.ledgerOpen,
      ledgerSuppressChecked: s.ledgerSuppressed,
      onToggleLedgerSuppress: (e) => this.setState({ ledgerSuppressed: e.target.checked }),
      onCloseLedger: () => this.setState({ ledgerOpen:false }),
      onOpenLedgerConfirm: () => { this.setState({ ledgerOpen:false }); this.showToast('Family ledger — coming next'); },
```

- [ ] **Step 3: Point both ledger links at it**

In `drawerVals(inv)`:

```js
      onOpenLedger: () => this.requestLedger(),
```

In `renderVals()`:

```js
      onOpenLedgerFamily: () => this.requestLedger(),
```

- [ ] **Step 4: Verify**

Open any invoice → `View family ledger →` → modal appears over the drawer, no Cancel-style framing, `Back to invoice` returns you with the drawer intact. Re-open, tick `Don't show this again`, click `Open family ledger` → toast. Click the link again → toast fires directly, no modal. Open the family drawer's ledger link → same behaviour.

- [ ] **Step 5: Checkpoint**

Modal appears from both drawers, suppression persists for the session, both buttons behave.

---

### Task 11: Full-flow pass

**Files:** none — verification only.

- [ ] **Step 1: Walk the primary flow**

Reload with a clean state. Click `DRF-2041` → read line items → Approve → confirm → lands on DRF-2042 at `2 of 19` → Deny with a reason → lands on DRF-2044 at `3 of 19`. Close. Grid shows DRF-2041 approved, DRF-2042 gone (denied, toggle off), footer totals reduced accordingly.

- [ ] **Step 2: Walk the family flow**

Click `Smith Family` → click DRF-2046 (Approved) → back link reads `‹ Smith Family` → Return to draft → no modal, undo toast, still on DRF-2046 → click back link → family drawer shows it as Draft.

- [ ] **Step 3: Check layering**

With the drawer open, confirm: scrim over grid, modal over drawer, toast over everything. Escape closes exactly one layer per press, innermost first.

- [ ] **Step 4: Check the grid is unregressed**

Filters still combine across the two radio sets. Selection still prunes on filter change. Column alignment unchanged. Group-by Family and Enrollment change both still render. Exactly two console errors.

- [ ] **Step 5: Screenshot the states**

Capture: invoice drawer (percentage split), invoice drawer (denied), family drawer, approve confirm modal, ledger interstitial, queue-exhausted state. These are the handoff artefacts for the Figma pass.

---

## Deferred (unchanged from the spec)

Split reconciliation UI in the grid, un-deny, denied-row auto-reveal, sort affordances, pagination, focus styles and focus traps, empty/loading/error states, and the family ledger screen itself.
