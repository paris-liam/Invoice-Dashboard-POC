# Payments Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `Payments.dc.html` per `Design Spec — Payments.md`, and retire `Accounting Dashboard.dc.html`.

**Architecture:** Start by copying `Draft Invoices.dc.html`, which already carries the grid machinery (measured columns, filters, selection, fixed-position menus), the drawer, the modal chrome, and the toast. Strip the draft-approval concepts, reshape the data around invoices-with-payments, then add the payment-management surfaces. Copying rather than writing fresh is what keeps the two pages reading as one product.

**Tech Stack:** Deck Component runtime (`support.js`), FMS design system tokens, no build step.

## Global Constraints

- **No test framework and no git.** Verification is a browser check against `python3 -m http.server 8754`; the page is `http://localhost:8754/Payments.dc.html`. Kill with `pkill -f "http.server 8754"`. "Checkpoint" steps replace commits — run no `git` commands.
- Console errors of the form `<path> attribute d: Expected moveto path command` are benign — one per templated `<path d="{{ … }}">`. Count them at the end of Task 1 and treat that number as the baseline; any error of a *different* kind is a regression.
- `TODAY = '2026-08-13'`. All overdue arithmetic and date defaults derive from it. Never call `new Date()` for current time.
- Money always renders through `fmtMoney`, which already handles negatives as `-$62.50`.
- All colour from design-system variables; no raw hex except `#fff` and existing `rgb(...)` literals.
- A `null` event handler means no handler — that is how inert controls are built.
- Invoices are **per payor**, matching Draft Invoices. An approved draft becomes one of these invoices.
- Copy is sentence case. An action keeps its name through the flow: `Record payment` produces `Payment recorded`.
- Do not modify `Draft Invoices.dc.html`.

---

## File Structure

| File | Responsibility |
|---|---|
| `Payments.dc.html` | The whole page. Same internal regions as Draft Invoices: helmet styles, `<main>` template, root-level overlays (drawer, menus, modals, toast), then module constants and the `Component` class. |
| `Accounting Dashboard.dc.html` | Deleted in Task 10. |

Within the script block, keep three helper groups separated so the file stays navigable: **money/status derivation** (pure functions on an invoice), **column measurement** (ported unchanged), and **`drawerVals()`** (everything the drawer renders).

---

### Task 1: Scaffold, data model, and the invoice grid

**Files:**
- Create: `Payments.dc.html` (copied from `Draft Invoices.dc.html`, then reshaped)

**Interfaces:**
- Produces: `TODAY`, `INVOICES`, `FAMILY_CREDIT`
- Produces per invoice: `{ id, payor, payorEmail, family, child, childId, dueDate, amount, autoPay, lineItems, credits, payments }`
- Produces per payment: `{ id, method, kind, reference, date, amount, status, refundedAmount, code, codeLabel, deposit }`
- Produces pure helpers: `effectiveAmount(p)`, `paidOf(inv)`, `creditsOf(inv)`, `balanceOf(inv)`, `statusOf(inv)`, `isPastDue(inv)`, `depositable(p)`

- [ ] **Step 1: Copy the file**

```bash
cd "/Users/liamparis/Desktop/Design iteration request"
cp "Draft Invoices.dc.html" "Payments.dc.html"
```

- [ ] **Step 2: Strip the draft-approval concepts**

Remove from the copy: `DRAFTS`, `ADJUSTMENTS`, `buildInvoices`, `INVOICES` (the old one), `NO_CHANGE`, `APPROVAL_ICON`, `ROW_TINT`, `distinctChildren`, the `showDenied` toggle and all its render values, the approval/enrollment KPI definitions, the `groupBy` state with its group-header rendering and `groupModes`, the queue state and `advanceQueue`, the approve and deny modals with their handlers, and `setApproval`.

Keep: the helmet styles and keyframes, the `h1`, the toolbar shell, the selection-bar shell, the grid shell with `columnWidths`/`cellMetrics`/`textWidth`/`queueArrowStyle`, `pillStyle`, `fmtMoney`, `round2`, the fixed-position row menu, the drawer shell with its scrim and Escape handling, the ledger interstitial, the toast with undo, `setFilters`, and `showToast`.

Change the `h1` to `Financial Dashboard — Payments`.

- [ ] **Step 3: Write the data model**

Replace the data block with:

```js
const TODAY = '2026-08-13';

/* Families carry a credit balance that invoices draw down. */
const FAMILY_CREDIT = {
  'Johnson Family': 0, 'Garcia Family': 0, 'Martinez Family': 0, 'Smith Family': 125,
  'Thompson Family': 0, 'Anderson Family': 0, 'Wilson Family': 0, 'Davis Family': 0,
  'Miller Family': 0, 'Taylor Family': 60, 'Harris Family': 0, 'Jackson Family': 0,
  'Lee Family': 0, 'Nguyen Family': 0, 'Brooks Family': 0, 'Fischer Family': 0,
};

const PAY = (o) => Object.assign({
  kind:'electronic', reference:'', refundedAmount:0, code:null, codeLabel:'',
  deposit:{ state:null, date:null, batch:null },
}, o);

/* Invoices are per payor, matching Draft Invoices — an approved draft becomes
   one of these. Billing period Jul 1–31, 2026; TODAY is 13 Aug 2026. */
const INVOICES = [
  { id:'INV-1101', payor:'Marcus Johnson', payorEmail:'m.johnson@email.com', family:'Johnson Family', child:'Ava Johnson', childId:'CH-101',
    dueDate:'2026-07-15', amount:650, autoPay:false,
    lineItems:[{ label:'Tuition, July', amount:620 }, { label:'Late pickup fee', amount:30 }],
    credits:[], payments:[ PAY({ id:'PMT-9001', method:'Card', reference:'····4242', date:'2026-07-12', amount:650, status:'Successful', deposit:{ state:'Deposited', date:'2026-07-13', batch:'DEP-2026-0713-1' } }) ] },

  { id:'INV-1102', payor:'Alicia Johnson', payorEmail:'a.johnson@email.com', family:'Johnson Family', child:'Ava Johnson', childId:'CH-101',
    dueDate:'2026-07-15', amount:433.33, autoPay:false,
    lineItems:[{ label:'Tuition, July', amount:413.33 }, { label:'Late pickup fee', amount:20 }],
    credits:[], payments:[ PAY({ id:'PMT-9002', method:'Check', kind:'offline', reference:'#1032', date:'2026-07-10', amount:200, status:'Successful', deposit:{ state:'Awaiting deposit', date:null, batch:null } }) ] },

  { id:'INV-1103', payor:'Elena Garcia', payorEmail:'elena.garcia@email.com', family:'Garcia Family', child:'Mateo Garcia', childId:'CH-102',
    dueDate:'2026-08-20', amount:825, autoPay:true,
    lineItems:[{ label:'Tuition, August', amount:825 }],
    credits:[], payments:[ PAY({ id:'PMT-9003', method:'ACH', reference:'····6789', date:'2026-08-20', amount:825, status:'Scheduled' }) ] },

  { id:'INV-1104', payor:'Rafael Martinez', payorEmail:'r.martinez@email.com', family:'Martinez Family', child:'Lucia Martinez', childId:'CH-103',
    dueDate:'2026-07-08', amount:950, autoPay:true,
    lineItems:[{ label:'Tuition, July', amount:900 }, { label:'Late pickup fee', amount:50 }],
    credits:[], payments:[
      PAY({ id:'PMT-9004', method:'ACH', reference:'····6789', date:'2026-07-08', amount:950, status:'Failed', code:'R01', codeLabel:'Insufficient funds' }),
      PAY({ id:'PMT-9005', method:'ACH', reference:'····6789', date:'2026-07-12', amount:950, status:'Failed', code:'R01', codeLabel:'Insufficient funds' }),
    ] },

  { id:'INV-1105', payor:'Dana Smith', payorEmail:'dana.smith@email.com', family:'Smith Family', child:'Noah Smith', childId:'CH-104',
    dueDate:'2026-07-05', amount:800, autoPay:false,
    lineItems:[{ label:'Tuition, July', amount:800 }],
    credits:[{ label:'Closure day, 4 Jul', amount:50, date:'2026-07-06' }],
    payments:[ PAY({ id:'PMT-9006', method:'Card', reference:'····1881', date:'2026-07-04', amount:750, status:'Successful', deposit:{ state:'Deposited', date:'2026-07-05', batch:'DEP-2026-0705-1' } }) ] },

  { id:'INV-1106', payor:'Kyle Smith', payorEmail:'kyle.smith@email.com', family:'Smith Family', child:'Noah Smith', childId:'CH-104',
    dueDate:'2026-07-05', amount:400, autoPay:false,
    lineItems:[{ label:'Tuition, July', amount:400 }],
    credits:[], payments:[] },

  { id:'INV-1107', payor:'Priya Thompson', payorEmail:'p.thompson@email.com', family:'Thompson Family', child:'Rohan Thompson', childId:'CH-105',
    dueDate:'2026-07-02', amount:475, autoPay:false,
    lineItems:[{ label:'Tuition, July', amount:475 }],
    credits:[], payments:[ PAY({ id:'PMT-9007', method:'Card', reference:'····9310', date:'2026-07-01', amount:475, status:'Refunded', refundedAmount:475, deposit:{ state:'Deposited', date:'2026-07-02', batch:'DEP-2026-0702-1' } }) ] },

  { id:'INV-1108', payor:'Owen Anderson', payorEmail:'o.anderson@email.com', family:'Anderson Family', child:'Ellie Anderson', childId:'CH-106',
    dueDate:'2026-08-15', amount:700, autoPay:false,
    lineItems:[{ label:'Tuition, August', amount:700 }],
    credits:[], payments:[] },

  { id:'INV-1109', payor:'Grace Wilson', payorEmail:'g.wilson@email.com', family:'Wilson Family', child:'Iris Wilson', childId:'CH-107',
    dueDate:'2026-07-22', amount:330, autoPay:false,
    lineItems:[{ label:'Tuition, July', amount:330 }],
    credits:[], payments:[ PAY({ id:'PMT-9008', method:'Cash', kind:'offline', reference:'Front desk', date:'2026-07-20', amount:330, status:'Successful', deposit:{ state:'Awaiting deposit', date:null, batch:null } }) ] },

  { id:'INV-1110', payor:'Ben Wilson', payorEmail:'ben.wilson@email.com', family:'Wilson Family', child:'Iris Wilson', childId:'CH-107',
    dueDate:'2026-07-22', amount:220, autoPay:false,
    lineItems:[{ label:'Tuition, July', amount:220 }],
    credits:[], payments:[ PAY({ id:'PMT-9009', method:'ACH', reference:'····4501', date:'2026-07-21', amount:220, status:'Pending' }) ] },

  { id:'INV-1111', payor:'Nina Davis', payorEmail:'nina.davis@email.com', family:'Davis Family', child:'Theo Davis', childId:'CH-108',
    dueDate:'2026-06-25', amount:875, autoPay:false,
    lineItems:[{ label:'Tuition, June', amount:875 }],
    credits:[], payments:[] },

  { id:'INV-1112', payor:'Carla Miller', payorEmail:'c.miller@email.com', family:'Miller Family', child:'June Miller', childId:'CH-109',
    dueDate:'2026-07-10', amount:450, autoPay:false,
    lineItems:[{ label:'Tuition, July', amount:450 }],
    credits:[], payments:[ PAY({ id:'PMT-9010', method:'Card', reference:'····7702', date:'2026-07-09', amount:450, status:'Partly refunded', refundedAmount:100, deposit:{ state:'Deposited', date:'2026-07-10', batch:'DEP-2026-0710-1' } }) ] },

  { id:'INV-1113', payor:'Sam Taylor', payorEmail:'sam.taylor@email.com', family:'Taylor Family', child:'Beau Taylor', childId:'CH-110',
    dueDate:'2026-08-18', amount:660, autoPay:true,
    lineItems:[{ label:'Tuition, August', amount:660 }],
    credits:[], payments:[ PAY({ id:'PMT-9011', method:'ACH', reference:'····2245', date:'2026-08-18', amount:660, status:'Scheduled' }) ] },

  { id:'INV-1114', payor:'Jess Taylor', payorEmail:'jess.taylor@email.com', family:'Taylor Family', child:'Beau Taylor', childId:'CH-110',
    dueDate:'2026-07-18', amount:440, autoPay:false,
    lineItems:[{ label:'Tuition, July', amount:440 }],
    credits:[], payments:[ PAY({ id:'PMT-9012', method:'Check', kind:'offline', reference:'#2088', date:'2026-07-16', amount:440, status:'Successful', deposit:{ state:'Awaiting deposit', date:null, batch:null } }) ] },

  { id:'INV-1115', payor:'Alan Harris', payorEmail:'a.harris@email.com', family:'Harris Family', child:'Cora Harris', childId:'CH-111',
    dueDate:'2026-07-12', amount:625, autoPay:false,
    lineItems:[{ label:'Tuition, July', amount:687.50 }, { label:'Sibling discount', amount:-62.50 }],
    credits:[], payments:[ PAY({ id:'PMT-9013', method:'ACH', reference:'····3390', date:'2026-07-12', amount:625, status:'Failed', code:'R02', codeLabel:'Account closed' }) ] },

  { id:'INV-1116', payor:'Renee Jackson', payorEmail:'r.jackson@email.com', family:'Jackson Family', child:'Malik Jackson', childId:'CH-112',
    dueDate:'2026-06-30', amount:775, autoPay:false,
    lineItems:[{ label:'Tuition, June', amount:775 }],
    credits:[{ label:'Goodwill credit', amount:75, date:'2026-07-02' }],
    payments:[ PAY({ id:'PMT-9014', method:'Card', reference:'····5560', date:'2026-07-02', amount:700, status:'Successful', deposit:{ state:'Deposited', date:'2026-07-03', batch:'DEP-2026-0703-1' } }) ] },

  { id:'INV-1117', payor:'Mei Lee', payorEmail:'mei.lee@email.com', family:'Lee Family', child:'Hana Lee', childId:'CH-113',
    dueDate:'2026-08-25', amount:475, autoPay:false,
    lineItems:[{ label:'Tuition, August', amount:475 }],
    credits:[], payments:[] },

  { id:'INV-1118', payor:'Linh Nguyen', payorEmail:'linh.nguyen@email.com', family:'Nguyen Family', child:'Zoe Nguyen', childId:'CH-116',
    dueDate:'2026-07-28', amount:540, autoPay:false,
    lineItems:[{ label:'Tuition, July', amount:540 }],
    credits:[], payments:[ PAY({ id:'PMT-9015', method:'Card', reference:'····8123', date:'2026-07-27', amount:540, status:'Successful', deposit:{ state:'Awaiting deposit', date:null, batch:null } }) ] },
];
```

This satisfies every case the spec's §11 requires: fully paid and deposited (1101), paid awaiting deposit (1118), partly paid by check (1102), past due with no payments (1111), two failed ACH retries (1104), AutoPay scheduled (1103, 1113), a refunded payment returning the invoice to outstanding (1107), credits applied (1105, 1116), a family carrying unapplied credit (Smith $125, Taylor $60), and an invoice with no payments (1106, 1108, 1117).

- [ ] **Step 4: Add the derivation helpers**

Place directly below the data, above the `Component` class:

```js
/* A refunded remainder still counts toward the invoice. */
function effectiveAmount(p) {
  if (p.status !== 'Successful' && p.status !== 'Partly refunded') return 0;
  return round2(p.amount - (p.refundedAmount || 0));
}
const paidOf    = (inv) => round2(inv.payments.reduce((a, p) => a + effectiveAmount(p), 0));
const creditsOf = (inv) => round2((inv.credits || []).reduce((a, c) => a + c.amount, 0));
const balanceOf = (inv) => round2(inv.amount - paidOf(inv) - creditsOf(inv));
const isPastDue = (inv) => balanceOf(inv) > 0 && inv.dueDate < TODAY;

/* One status per row. Partly-paid-and-late reads Partly paid; the due date
   carries the urgency instead of a second pill. */
function statusOf(inv) {
  const bal = balanceOf(inv);
  if (bal <= 0) return 'Paid';
  if (paidOf(inv) > 0 || creditsOf(inv) > 0) return 'Partly paid';
  return inv.dueDate < TODAY ? 'Overdue' : 'Open';
}

const depositable = (p) =>
  (p.status === 'Successful' || p.status === 'Partly refunded') && p.deposit.state === 'Awaiting deposit';

const fmtDate = (iso) => {
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [y, m, d] = iso.split('-');
  return Number(d) + ' ' + M[Number(m) - 1] + ' ' + y;
};
```

- [ ] **Step 5: Reshape the pill map and add the payment icon map**

```js
const PILL = {
  Paid:             { color:'var(--gummy-sharks--900)', background:'var(--gummy-sharks--100)' },
  'Partly paid':    { color:'var(--cotton-candy--700)', background:'var(--cotton-candy--50)' },
  Open:             { color:'var(--gray-6)',            background:'var(--gray-2)' },
  Overdue:          { color:'var(--danger-700)',        background:'rgb(238 191 193)' },
  Successful:       { color:'var(--gummy-sharks--900)', background:'var(--gummy-sharks--100)' },
  Pending:          { color:'rgb(145 116 16)',          background:'var(--warning-100)' },
  Failed:           { color:'var(--danger-700)',        background:'rgb(238 191 193)' },
  Refunded:         { color:'var(--gray-6)',            background:'var(--gray-2)' },
  'Partly refunded':{ color:'var(--gray-6)',            background:'var(--gray-2)' },
  Scheduled:        { color:'var(--cotton-candy--700)', background:'var(--cotton-candy--50)' },
};

/* Carbon icons on a 32px grid. */
const INVOICE_ICON = {
  Paid:          { color:'var(--gummy-sharks--900)', path:'M16 2A14 14 0 1 0 30 16 14 14 0 0 0 16 2ZM14 21.5l-5-4.96L10.59 15 14 18.35 21.41 11 23 12.58Z' },
  'Partly paid': { color:'var(--cotton-candy--700)', path:'M16 4A12 12 0 1 0 28 16 12 12 0 0 0 16 4Zm0 22V6a10 10 0 0 1 0 20Z' },
  Open:          { color:'var(--gray-5)',            path:'M16 4A12 12 0 1 0 28 16 12 12 0 0 0 16 4Zm0 22a10 10 0 1 1 10-10 10 10 0 0 1-10 10Z' },
  Overdue:       { color:'var(--danger-700)',        path:'M16 2A14 14 0 1 0 30 16 14 14 0 0 0 16 2Zm-1 7h2v10h-2Zm1 16a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 16 25Z' },
};
const PAYMENT_ICON = {
  Successful:       INVOICE_ICON.Paid,
  'Partly refunded':{ color:'var(--gray-5)',     path:'M16 2A14 14 0 1 0 30 16 14 14 0 0 0 16 2Zm0 26a12 12 0 1 1 12-12 12 12 0 0 1-12 12Z' },
  Refunded:         { color:'var(--gray-5)',     path:'M16 2A14 14 0 1 0 30 16 14 14 0 0 0 16 2Zm0 26a12 12 0 1 1 12-12 12 12 0 0 1-12 12Z' },
  Pending:          { color:'var(--warning-700)',path:'M16 4A12 12 0 1 0 28 16 12 12 0 0 0 16 4Zm0 22V6a10 10 0 0 1 0 20Z' },
  Scheduled:        { color:'var(--cotton-candy--700)', path:'M26 4h-4V2h-2v2h-8V2h-2v2H6a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 22H6V12h20ZM6 10V6h4v2h2V6h8v2h2V6h4v4Z' },
  Failed:           { color:'var(--danger-700)', path:'M16 2A14 14 0 1 0 30 16 14 14 0 0 0 16 2Zm5.41 19L16 17.41 10.59 21 9 21.41 12.59 16 9 10.59 10.59 9 16 14.59 21.41 9 23 10.59 19.41 16 23 21.41Z' },
};
```

- [ ] **Step 6: Reshape columns and cell metrics**

```js
const COLUMNS = [
  { field:'status',   label:'',          sortable:true, center:true },
  { field:'expand',   label:'',          sortable:false, center:true },
  { field:'id',       label:'Invoice #', sortable:true },
  { field:'payor',    label:'Payor',     sortable:true },
  { field:'family',   label:'Family',    sortable:true },
  { field:'dueDate',  label:'Due date',  sortable:true },
  { field:'amount',   label:'Amount',    sortable:true },
  { field:'paid',     label:'Paid',      sortable:true },
  { field:'balance',  label:'Balance',   sortable:true },
  { field:'statusLabel', label:'Status', sortable:true },
  { field:'actions',  label:'Actions',   sortable:false },
];
```

In `columnWidths`, give `status` a fixed 56 and `expand` a fixed 32; `actions` stays the `1fr` remainder. Rewrite `cellMetrics` for the new fields:

```js
function cellMetrics(field, inv) {
  switch (field) {
    case 'id':          return [inv.id, FONT_CELL_SEMI, 0];
    case 'payor':       return [inv.payor, FONT_CELL_BOLD, 0];
    case 'family':      return [inv.family, FONT_CELL, 0];
    case 'dueDate':     return [fmtDate(inv.dueDate), FONT_CELL, 0];
    case 'amount':      return [fmtMoney(inv.amount), FONT_CELL, 0];
    case 'paid':        return [fmtMoney(paidOf(inv)), FONT_CELL, 0];
    case 'balance':     return [fmtMoney(balanceOf(inv)), FONT_CELL_BOLD, 0];
    /* the pill adds 8px of padding either side, plus room for the AutoPay badge */
    case 'statusLabel': return [statusOf(inv), FONT_CELL_BOLD, inv.autoPay ? 78 : 16];
    default:            return ['', FONT_CELL, 0];
  }
}
```

- [ ] **Step 7: Render invoice rows**

Sorting is by derived value, so `filteredWith` sorts on computed fields:

```js
const SORT_VALUE = {
  paid: paidOf, balance: balanceOf, statusLabel: statusOf,
  id: (i) => i.id, payor: (i) => i.payor, family: (i) => i.family,
  dueDate: (i) => i.dueDate, amount: (i) => i.amount,
};
```

Row cells: checkbox (Task 4 adds the rule; render it always for now), status icon, chevron placeholder, invoice number button, payor, family, due date (in `--danger-700` when `isPastDue`), amount, paid, balance (bold), status pill plus `AutoPay` badge when `inv.autoPay`, and an actions cell holding a disabled `⋯` for now.

Footer: `Total shown $X` and `$Y outstanding`, both over visible rows.

- [ ] **Step 8: Verify**

```bash
cd "/Users/liamparis/Desktop/Design iteration request" && python3 -m http.server 8754
```

Load the page. Expect 18 rows. Spot-check three:

| Invoice | Amount | Paid | Balance | Status |
|---|---|---|---|---|
| INV-1101 | $650.00 | $650.00 | $0.00 | Paid |
| INV-1102 | $433.33 | $200.00 | $233.33 | Partly paid |
| INV-1105 | $800.00 | $750.00 | $0.00 | Paid (a $50 credit closes it) |
| INV-1107 | $475.00 | $0.00 | $475.00 | Overdue (refund returned the balance) |
| INV-1112 | $450.00 | $350.00 | $100.00 | Partly paid ($100 partly refunded) |

Footer total shown should be **$10,623.33**; outstanding **$6,538.33**.

- [ ] **Step 9: Checkpoint**

Record the console-error count as the baseline. Confirm column alignment is identical across all rows.

---

### Task 2: Payment rows and expansion

**Files:** Modify `Payments.dc.html` — template row loop, `renderVals()`

**Interfaces:**
- Produces state: `expanded: [invoiceId]`
- Produces per display row: `isInvoice` / `isPayment` discriminator, `onToggleExpand`, `chevronStyle`

- [ ] **Step 1: Build the display list**

In `renderVals()`, flatten filtered invoices into display rows: each invoice, followed by its payments when `expanded` contains its id. Payment rows carry `parentId`.

- [ ] **Step 2: Render payment rows as indented flex rows**

```html
<sc-if value="{{ row.isPayment }}" hint-placeholder-val="{{ false }}">
  <div style="{{ row.style }}">
    <div style="width:44px; display:flex; align-items:center; justify-content:center;">
      <sc-if value="{{ row.selectable }}" hint-placeholder-val="{{ false }}">
        <input type="checkbox" checked="{{ row.checked }}" onChange="{{ row.onToggle }}" aria-label="{{ row.selectLabel }}" style="width:15px; height:15px; accent-color:var(--blueberry-pie--200); cursor:pointer;">
      </sc-if>
    </div>
    <span style="width:40px;"></span>
    <span style="{{ row.iconStyle }}"><svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="{{ row.iconPath }}"></path></svg></span>
    <span style="font-size:var(--font-size-xs); font-weight:700; white-space:nowrap;">{{ row.method }}</span>
    <span style="font-size:var(--font-size-xs); font-weight:600; color:var(--gray-5); white-space:nowrap;">{{ row.reference }}</span>
    <span style="font-size:var(--font-size-xs); font-weight:600; color:var(--gray-6); white-space:nowrap;">{{ row.date }}</span>
    <span style="font-size:var(--font-size-xs); font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap;">{{ row.amount }}</span>
    <span style="{{ row.statusStyle }}">{{ row.statusLabel }}</span>
    <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:var(--font-size-xs); font-weight:600; color:var(--gray-6);">{{ row.detail }}</span>
    <button onClick="{{ row.onOpenMenu }}" aria-label="{{ row.menuLabel }}" style="{{ row.menuBtnStyle }}"><svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><circle cx="16" cy="8" r="2"></circle><circle cx="16" cy="16" r="2"></circle><circle cx="16" cy="24" r="2"></circle></svg></button>
  </div>
</sc-if>
```

Row style: `display:flex; align-items:center; gap:var(--space-sm); height:38px; background:var(--gray-1); border-bottom:1px solid rgb(0 40 85 / 10%);`.

`detail` reads `Deposited 13 Jul 2026 · DEP-2026-0713-1`, or `Awaiting deposit`, or `R01 Insufficient funds`, or `$450.00, $100.00 refunded`, or empty.

- [ ] **Step 3: Wire the chevron**

Only render it when `inv.payments.length > 0`. Rotate −90° when collapsed. Clicking toggles `expanded`.

- [ ] **Step 4: Verify**

Expand INV-1104: two failed ACH rows, both `R01 Insufficient funds`. Expand INV-1112: one row reading `$450.00, $100.00 refunded`. INV-1106 has no chevron. Collapse all; row count returns to 18.

- [ ] **Step 5: Checkpoint**

---

### Task 3: KPIs and filters

**Files:** Modify `Payments.dc.html` — KPI template, `filteredWith`, `renderVals()`

**Interfaces:**
- Produces state: `invoiceFilter: '' | 'Outstanding' | 'Past due' | 'Paid'`, `exceptionFilter: '' | 'ACH failures' | 'Awaiting deposit'`

- [ ] **Step 1: Filter predicates**

```js
const MATCH = {
  'Outstanding':      (i) => balanceOf(i) > 0,
  'Past due':         (i) => isPastDue(i),
  'Paid':             (i) => balanceOf(i) <= 0,
  'ACH failures':     (i) => i.payments.some(p => p.status === 'Failed' && p.method === 'ACH'),
  'Awaiting deposit': (i) => i.payments.some(depositable),
};
```

`filteredWith` applies `invoiceFilter` then `exceptionFilter`, both through `MATCH`.

- [ ] **Step 2: Two radio clusters**

Left cluster `MONEY OWED`, three tiles with dollar totals: Outstanding (sum of positive balances), Past due (sum of past-due balances), Paid (count). Right cluster `NEEDS ATTENTION`, subordinate styling, two tiles: ACH failures (count of invoices), Awaiting deposit (sum of depositable payment amounts).

Port `queueKpiStyle` and `changeKpiStyle` unchanged. Port the dashed `Clear filters` chip and the per-cluster `Clear`.

- [ ] **Step 3: Verify**

Click Past due → 8 invoices (1102, 1104, 1106, 1107, 1110, 1111, 1112, 1115). Add ACH failures → 2 (1104, 1115). Paid alone → 6 (1101, 1105, 1109, 1114, 1116, 1118). Clear filters restores 18. Awaiting deposit alone → 4 (1102, 1109, 1114, 1118).

- [ ] **Step 4: Checkpoint**

---

### Task 4: Type-aware selection

**Files:** Modify `Payments.dc.html` — selection bar, row checkboxes, `setFilters`

**Interfaces:**
- Changes state: `selected` becomes `{ invoices: [id], payments: [id] }`

- [ ] **Step 1: Selectability rules**

Invoice checkbox renders only when `balanceOf(inv) > 0`. Payment checkbox renders only when `depositable(p)`. Header checkbox selects every selectable *invoice* in view; label `Select all N outstanding invoices`.

- [ ] **Step 2: Type-aware bar**

Three states at one fixed height of 44px:

```
■ 3 invoices selected · $2,425.00                 [Resend invoices]  [Clear]
■ 5 payments selected · $3,150.00                 [Deposit payments] [Clear]
■ 3 invoices + 5 payments selected · Select one kind to act on them
                                    [Resend ✗] [Deposit ✗]          [Clear]
```

Mixed state: both action buttons at `opacity:.5`, `cursor:not-allowed`, `onClick:null`.

- [ ] **Step 3: Pruning**

`setFilters` prunes both lists to what is visible. Collapsing an invoice prunes its payment ids from `selected.payments`.

- [ ] **Step 4: Verify**

Select two invoices → bar offers Resend only. Expand INV-1109, select its payment → bar reports mixed and disables both. Clear invoices → Deposit enables. Collapse INV-1109 → selection empties.

- [ ] **Step 5: Checkpoint**

---

### Task 5: Row menus, resend, and deposit

**Files:** Modify `Payments.dc.html` — menu items, new confirm modal, `renderVals()`

**Interfaces:**
- Produces state: `confirm: null | { kind, ids, heading, body, cta, tone }`
- Produces: `depositBatchRef()`

- [ ] **Step 1: Menu contents**

Invoice `⋯`: `Record payment…` (Task 6 wires it; toast stub here) · `Resend invoice` · `View invoice` (Task 7). Payment `⋯`: `Deposit…` when `depositable`, `Resend receipt` when status is Successful or Partly refunded.

- [ ] **Step 2: Generic confirm modal**

Port the approve-modal chrome into one reusable confirm driven by `state.confirm`: heading, body, cancel, and a CTA whose colour comes from `tone` (`brand` → cotton candy, `danger` → danger-500).

- [ ] **Step 3: Resend**

Single resend fires immediately with a toast (`Invoice resent to Marcus Johnson`), no undo — low stakes, high frequency. Bulk resend opens the confirm: `Resend 3 invoices?` with the count and combined balance.

- [ ] **Step 4: Deposit**

Always confirms, single or bulk, because it moves money and stamps a batch:

```js
depositBatchRef() {
  this.batchSeq = (this.batchSeq || 0) + 1;
  return 'DEP-' + TODAY.replace(/-/g, '').replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2$3') + '-' + this.batchSeq;
}
```

Submitting sets each payment's `deposit` to `{ state:'Deposited', date:TODAY, batch:ref }` and toasts `5 payments deposited · DEP-2026-0813-1`.

- [ ] **Step 5: Verify**

Deposit one payment from its row menu → confirm → row detail becomes `Deposited 13 Aug 2026 · DEP-2026-0813-1`, checkbox disappears, Awaiting-deposit KPI drops. Bulk deposit four → one shared batch reference. Single resend shows no modal; bulk resend does.

- [ ] **Step 6: Checkpoint**

---

### Task 6: Record payment

**Files:** Modify `Payments.dc.html` — new form modal, `renderVals()`

- [ ] **Step 1: Form modal**

Fields: amount (defaults to the invoice balance), method (`Cash` · `Check` · `Other`, segmented), date (defaults to `TODAY`), reference (optional). CTA `Record payment`, disabled while amount ≤ 0.

- [ ] **Step 2: Overpayment notice**

When the entered amount exceeds the balance, show inline beneath the field, in `--cotton-candy--700`:

`$75.00 over the balance will be added to the Smith Family credit balance.`

- [ ] **Step 3: Submit**

Appends a payment with `kind:'offline'`, `status:'Successful'`, `deposit:{ state:'Awaiting deposit' }`; adds any excess to `FAMILY_CREDIT` state; auto-expands the parent invoice; toasts `Payment recorded for INV-1106`. No undo — Delete is the correction path.

- [ ] **Step 4: Verify**

Record $400 cash on INV-1106 → status Paid, balance $0.00, new payment row awaiting deposit. Record $500 on it instead → notice appears, and after submitting, Smith credit balance rises by $100.

- [ ] **Step 5: Checkpoint**

---

### Task 7: Invoice drawer

**Files:** Modify `Payments.dc.html` — drawer body, `drawerVals()`

- [ ] **Step 1: Reshape the drawer body**

Keep identity, line items, total. Replace the split band with an `AutoPay` note when applicable. Add, in order: `PAYMENTS` (one row per payment with its own `⋯`), `CREDITS` (label, date, negative amount), a `Balance due` line, then `ACTIVITY`.

`No payments recorded` shows in the payments section when the list is empty — the section is never omitted.

- [ ] **Step 2: Inline actions**

Below the content, per the Draft Invoices pattern: `Record payment` · `Apply credit` · `Resend invoice`, then `Print` · `Download PDF` · `View family ledger →`. Print and Download stay toast stubs; the ledger link keeps the interstitial and its session suppression.

- [ ] **Step 3: Per-payment menu inside the drawer**

Fixed-positioned like the grid menu. Items: `Refund…` always when there is a refundable remainder; `Delete…` **only when `p.kind === 'offline'`** — absent, not disabled, on electronic payments.

- [ ] **Step 4: Verify**

Open INV-1105: one payment, one credit reading `Closure day, 4 Jul` at `-$50.00`, and `Balance due $0.00`. Open INV-1106: `No payments recorded`. Open the menu on INV-1101's card payment: no `Delete…`. On INV-1102's check payment: `Delete…` present.

- [ ] **Step 5: Checkpoint**

---

### Task 8: Apply credit and the family drawer

**Files:** Modify `Payments.dc.html` — credit modal, family drawer

- [ ] **Step 1: Apply credit modal**

Shows `Available credit $125.00` and `Invoice balance $233.33`. Amount input capped at the lesser, with the cap stated. Optional note. CTA `Apply credit`.

- [ ] **Step 2: Submit with undo**

Appends to `inv.credits`, decrements `FAMILY_CREDIT`, toasts `$50.00 credit applied to INV-1102` **with Undo** — reversible, and undo restores both figures.

- [ ] **Step 3: Family drawer**

Port from Draft Invoices. Add a `Credit balance` line at the top beside the meta line, in `--cotton-candy--700` when non-zero and `--gray-5` when zero. Invoice rows show balance and status rather than share.

- [ ] **Step 4: Verify**

Smith Family drawer shows `Credit balance $125.00`. Apply $50 to INV-1102 → Johnson has no credit, so the modal states `No credit available` and disables the CTA. Apply against a Smith invoice instead → balance falls to $75.00; Undo restores it.

- [ ] **Step 5: Checkpoint**

---

### Task 9: Refund and delete payment

**Files:** Modify `Payments.dc.html` — two form modals

- [ ] **Step 1: Refund modal**

Amount defaults to `amount − refundedAmount`, editable down. Reason required. Body states the money returns to the original method. CTA `Refund` in danger tone.

Submitting sets `refundedAmount` and moves status to `Refunded` or `Partly refunded`; the invoice balance rises and its status recomputes. Toast, no undo.

- [ ] **Step 2: Delete modal**

Reason required. Body: `Deleting removes this payment from the invoice and from all totals. Use it only for a payment recorded in error — to return money that actually moved, refund instead.` CTA `Delete payment`, danger tone.

- [ ] **Step 3: Activity**

Both write into the invoice's activity list: `Refunded $100.00 on 13 Aug 2026 — duplicate charge`.

- [ ] **Step 4: Verify**

Refund $200 of INV-1101's $650 card payment → status `Partly refunded`, detail `$650.00, $200.00 refunded`, invoice balance $200.00, status `Partly paid`. Delete INV-1102's check payment → payment gone, balance back to $433.33, status `Overdue`.

- [ ] **Step 5: Checkpoint**

---

### Task 10: Retire the old page and run the full flow

**Files:** Delete `Accounting Dashboard.dc.html`

- [ ] **Step 1: Delete the old page**

```bash
cd "/Users/liamparis/Desktop/Design iteration request" && rm "Accounting Dashboard.dc.html"
```

- [ ] **Step 2: Collections walk**

Past due + ACH failures → INV-1104 and INV-1115 → expand 1104, see both retries → open the drawer → record a $950 check → invoice flips to Paid, drops out of the filter.

- [ ] **Step 3: Deposit walk**

Awaiting deposit → select all payments → deposit → one batch reference, KPI falls to zero, tile empties.

- [ ] **Step 4: Correction walk**

Open INV-1112 → refund the remaining $350 → status `Refunded`, invoice `Overdue` → apply a credit from the family balance → balance falls.

- [ ] **Step 5: Layering and regressions**

Scrim under drawer under modal under toast. Escape unwinds one layer per press. Column alignment identical across rows. Filters combine. Selection prunes.

- [ ] **Step 6: Screenshot the states**

Grid default, invoice expanded, mixed selection, invoice drawer with payments and credits, record-payment modal, refund modal, family drawer with credit balance.

---

## Deferred

Family ledger screen, focus styles and traps, empty/loading/error states, pagination, dunning schedules and automated retries, bulk refund, bulk delete, bulk credit.
