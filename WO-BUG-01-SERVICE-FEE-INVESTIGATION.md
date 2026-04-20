# WO-BUG-01: Service Fee Rendering Investigation & Fix

## Goal

Diagnose why the "Mobile Service Fee" ($29.95) appears in the booking flow sidebar on Jon's cached/logged-in browser but does NOT appear in incognito sessions or on Jason's fresh browser. Fix the root cause.

## Critical Rules

- DIAGNOSE FIRST. Do not write any fix code until the root cause is identified and confirmed.
- Do NOT rewrite any existing files end-to-end. Surgical edits only.
- No em dashes, no emojis, TypeScript everywhere.
- Match existing code patterns and design system.

## Evidence from the field

**Screenshot evidence observed by Jon:**
- Details step on Jon's cached browser (logged-in admin session): "Mobile Service Fee $29.95" renders in the right sidebar, total $119.90
- Review step in incognito, fresh session: NO service fee shown, total $89.95 only
- Screenshot of DevTools Network tab in incognito filtered by "firestore" shows ZERO firestore requests during the entire booking flow through step 3 (Details)

This is a critical finding: if no Firestore requests are happening for fees in a fresh session, either:
1. The fee data isn't stored in Firestore at all (hardcoded somewhere that only loads conditionally)
2. The fee data is cached in browser storage (localStorage/sessionStorage) and never re-fetched
3. The fee data requires an authenticated user and the query is silently skipped
4. The fee is tied to a feature flag or admin-only code path

---

## Phase 0: Investigation (REQUIRED)

Before writing any fix, report back findings to Jon. DO NOT proceed to Phase 1 without explicit approval.

Investigate and answer these questions in a structured report:

### 1. Where is the "Mobile Service Fee" value defined?

Grep the entire codebase for:
- "Mobile Service Fee"
- "mobileServiceFee"
- "serviceFee" 
- "29.95"
- "2995"
- "fees" collection references
- "feeConfig"

Identify every file where this value appears or is loaded.

### 2. How is the fee being loaded in the booking flow?

Trace the full data path:
- Where does the booking flow component read the fee from?
- Is it Firestore? localStorage? A hardcoded constant? An environment variable? Fetched from an API?
- If Firestore, which collection and what are the read rules?
- If there's a React context or hook that provides it, trace where that context initializes.

### 3. Why does it conditionally render?

Examine the fee display component:
- Is there an `if` statement, ternary, or feature flag that controls visibility?
- Does it check user auth state?
- Does it check localStorage for anything?
- Does it check the current URL, vehicle type, or service type?

### 4. What's different between Jon's cached session and incognito?

Specifically investigate:
- Any use of `localStorage.getItem` or `sessionStorage.getItem` in the booking flow
- Any Firestore query that requires `auth.currentUser` to be truthy
- Any admin-only collection read being attempted in the public booking flow
- Any browser-cached service worker that might serve stale data

### 5. The Review step vs Details step discrepancy

In Jon's own cached session, the fee shows in the Details step but not the Review step even within the same session. This means the Review step component may not be properly reading/passing the fee from booking state. Investigate the Review component separately from the Details component.

---

## Phase 0 Deliverable

Report back to Jon with:

1. **Root cause identified** (or top 2-3 most likely causes if not conclusive)
2. **Exact file paths and line numbers** where the issue lives
3. **Proposed fix** (surgical, minimal — do not propose rewrites)
4. **Risk assessment**: will the fix affect any existing bookings / admin functionality?

Wait for Jon's explicit approval before starting Phase 1.

---

## Phase 1: Fix implementation (ONLY AFTER PHASE 0 APPROVAL)

Apply the approved fix. Surgical edits only.

The fix must ensure:
- Service fee appears consistently for all users regardless of auth state
- Fee appears in both Details step sidebar AND Review step summary
- Fee is included in the Estimated Total calculation in both steps
- Fee is captured on booking submission and stored with the booking doc for invoice/records

---

## Phase 2: Firestore rules check (if applicable)

If root cause is a Firestore rules issue:
- Identify the collection requiring public read
- Update `firestore.rules` with a surgical append (match pattern used for existing public booking data like services/categories)
- Deploy rules: `npx firebase deploy --only firestore:rules --project coastal-mobile-lube`

---

## Phase 3: Build, commit, push, deploy

```bash
npm run build
```

Fix any TypeScript errors before proceeding.

```bash
git add src/ firestore.rules
git commit -m "Fix service fee rendering for public booking flow"
git push origin main
npx netlify-cli deploy --prod
```

Do NOT use `git add -A`.
Do NOT pass `--dir` flag.

---

## Phase 4: Verification

Report these results to Jon:

1. Open incognito window on `https://coastal-mobile-lube.netlify.app`
2. Walk through booking: pick vehicle → pick service → fill details → review
3. Confirm "Mobile Service Fee $29.95" appears in BOTH Details step sidebar AND Review step breakdown
4. Confirm Estimated Total includes the fee
5. Submit a test booking
6. Check Firestore `bookings` collection for the new doc
7. Confirm the booking doc stored the fee in its line items / totals

Report screenshots or describe output for each step.

---

## Deferred / out of scope

- Changing the fee amount itself
- Making the fee variable by service type or region
- Adding admin UI to edit the fee (defer to future WO on fee configuration)
- Invoice template updates to show the fee as its own line

---

## Context

Jon's session today shipped the QR code system (QR-01, QR-02) and unified brand logo (LOGO-01). All working. This bug was discovered during end-of-session review. It is considered the #1 critical bug blocking real customer bookings because every booking is currently losing $29.95 silently in fresh-browser user sessions.
