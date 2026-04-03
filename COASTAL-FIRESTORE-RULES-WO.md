# COASTAL-FIRESTORE-RULES-WO.md
# Work Order: Firestore Security Rules
# Priority: Phase 1 / WO 4 — PRE-LAUNCH BLOCKER
# Date: 2026-04-03

---

## OBJECTIVE

Replace the wide-open Firestore security rules (currently `allow read, write: if true`) with proper rules that protect customer data while still allowing public booking form submissions.

---

## INSTRUCTIONS

### BEFORE YOU START

Read these files IN FULL:
- `firestore.rules` (in project root, if it exists)
- `firebase.json` (to confirm rules file path)
- `src/lib/firebase.ts` (to understand the Firebase project config)

Check current deployed rules:
```bash
firebase firestore:rules:get
```

---

## THE RULES

Create or replace `firestore.rules` in the project root with:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // BOOKINGS COLLECTION
    // Public: can CREATE new bookings (form submissions)
    // Admin only: can READ, UPDATE, DELETE
    match /bookings/{bookingId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    // SERVICES COLLECTION (pricing map - future)
    // Public: can READ (for displaying pricing on site)
    // Admin only: can CREATE, UPDATE, DELETE
    match /services/{serviceId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }

    // CATCH-ALL: deny everything else
    // Any collection not explicitly defined above is locked down
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## WHAT THESE RULES DO

1. **bookings**: Anyone can submit a booking (create). Only logged-in admin can view, edit, or delete bookings. This means the homepage widget, /book form, fleet form, and marine form all continue to work without authentication. The admin dashboard requires login (handled by WO 3).

2. **services**: Anyone can read service/pricing data (for when we build the pricing map). Only admin can modify pricing. This future-proofs the pricing map WO.

3. **catch-all**: Everything else requires authentication. No unknown collections can be read or written by the public.

---

## DEPLOY

```bash
firebase deploy --only firestore:rules
```

Verify the rules deployed:
```bash
firebase firestore:rules:get
```

---

## VALIDATION

Test these scenarios (can be done in Firebase Console > Firestore > Rules Playground, or by testing the live site):

- [ ] Homepage quick quote widget: submit a test booking — should SUCCEED (public create)
- [ ] /book form: submit a test booking — should SUCCEED (public create)
- [ ] Fleet quote form: submit — should SUCCEED (public create)
- [ ] Marine quote form: submit — should SUCCEED (public create)
- [ ] Admin dashboard (logged in): can see all bookings — should SUCCEED (authenticated read)
- [ ] Admin dashboard (logged in): can update status, add notes — should SUCCEED (authenticated update)
- [ ] Admin dashboard (logged in): can delete a booking — should SUCCEED (authenticated delete)
- [ ] Direct Firestore read without auth (e.g., from browser console): should FAIL
- [ ] No build errors (rules deploy is separate from npm build)

---

## IMPORTANT NOTES

- This WO depends on WO 3 (Firebase Auth) being completed first. The rules reference `request.auth != null`, which requires Firebase Auth to be enabled and the admin to be logged in.
- If WO 3 has not been completed yet, DO NOT deploy these rules — they will lock the admin dashboard out since there is no login mechanism yet.
- The Cloud Functions (onNewBooking, sendConfirmationEmail) use the Admin SDK which bypasses security rules entirely. They will continue to work regardless of these rules.

---

## FINISH

```bash
firebase deploy --only firestore:rules && git add -A && git commit -m "WO: Firestore security rules - pre-launch blocker" && git push origin main
```

---

*WO written by Jon Gold / Gold Co LLC — 2026-04-03*
