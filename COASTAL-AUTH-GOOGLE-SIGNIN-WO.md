# COASTAL-AUTH-GOOGLE-SIGNIN-WO.md
# Work Order: Swap to Google Sign-In + Fix Admin Email
# Priority: Phase 1 / Patch (runs after WO 3 and WO 4)
# Date: 2026-04-03

---

## OBJECTIVE

Two changes:
1. Replace the email/password login on /admin/login with Google Sign-In (one-click button)
2. Update the admin alert email in Cloud Functions from jonrgold@gmail.com to jon@jgoldco.com

---

## INSTRUCTIONS

### BEFORE YOU START

Read these files IN FULL before making any changes:
- `src/app/admin/login/page.tsx`
- `src/components/AdminAuthGuard.tsx`
- `src/app/admin/AdminSignOutButton.tsx` (or wherever sign out lives)
- `src/lib/firebase.ts`
- `functions/src/index.ts` (or wherever Cloud Functions are defined)

Do NOT rewrite any file entirely. Make surgical edits only.
Do NOT touch globals.css or tailwind.config.ts.

---

## PART A: Update Login Page to Google Sign-In

In `src/app/admin/login/page.tsx`:

1. **Remove** the email input, password input, and the `signInWithEmailAndPassword` logic entirely.

2. **Replace** with a single "Sign in with Google" button using Firebase Google Auth:

```typescript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const handleGoogleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    router.push('/admin');
  } catch (error: any) {
    setError('Sign in failed. Please try again.');
  }
};
```

3. **Style the button**: White background, 1px border #ddd, border-radius 8px, full width (max-width 400px), padding 12px 24px. Include a Google "G" icon (use an inline SVG or just text). Text: "Sign in with Google" in dark gray, font-weight 600.

4. **Keep** the navy background, centered card layout, "Admin Login" heading, and "Coastal Mobile Lube & Tire" subtext. Just swap the form contents.

5. **Keep** the error message display for failed sign-ins.

---

## PART B: Restrict Access to Authorized Emails Only

In `src/components/AdminAuthGuard.tsx`:

After checking that the user is authenticated, also check that their email is in an allowed list. This prevents any random Google account from accessing the admin.

Add an allowed emails array:

```typescript
const ALLOWED_ADMIN_EMAILS = [
  'jon@jgoldco.com',
  'coastalmobilelube@gmail.com',
];
```

In the `onAuthStateChanged` callback, after confirming `user` exists, add:

```typescript
if (user) {
  if (ALLOWED_ADMIN_EMAILS.includes(user.email || '')) {
    setAuthenticated(true);
  } else {
    // Not an authorized admin — sign them out and show error
    await signOut(auth);
    router.push('/admin/login?error=unauthorized');
  }
}
```

On the login page, check for the `unauthorized` URL param and show: "Access denied. This account is not authorized for admin access."

---

## PART C: Update Admin Alert Email in Cloud Functions

In the Cloud Functions source (likely `functions/src/index.ts` or `functions/index.js`):

Find any reference to `jonrgold@gmail.com` and replace with `jon@jgoldco.com`.

This should be in the `onNewBooking` function where it sends the admin alert email. The "to" address needs to change.

After editing, redeploy Cloud Functions:

```bash
cd functions
npm run build
firebase deploy --only functions
```

If the Gmail sending credentials (GMAIL_USER / GMAIL_APP_PASSWORD) are set to jonrgold@gmail.com for sending, leave those alone for now. The SENDING account can stay as jonrgold@gmail.com. Only the RECIPIENT address (where alerts are delivered) changes to jon@jgoldco.com.

---

## PART D: Firebase Console Manual Steps

CC cannot do these — Jon must do them manually:

1. **Enable Google Sign-In provider**: Go to Firebase Console > Authentication > Sign-in method > Add new provider > Google. Enable it. Set the project support email to jon@jgoldco.com.

2. **Email/Password provider**: Can leave enabled or disable it. Does not matter since the login page no longer uses it.

3. **No need to manually create users.** Google Sign-In creates user records automatically on first login. The AdminAuthGuard email allowlist handles authorization.

---

## VALIDATION

- [ ] /admin/login shows a "Sign in with Google" button (no email/password fields)
- [ ] Clicking the button opens Google sign-in popup
- [ ] Signing in with jon@jgoldco.com grants access to admin dashboard
- [ ] Signing in with coastalmobilelube@gmail.com grants access to admin dashboard
- [ ] Signing in with any other Google account shows "Access denied" and does NOT grant access
- [ ] Sign Out button still works and redirects to /admin/login
- [ ] Admin alert emails are now sent to jon@jgoldco.com (test by submitting a booking)
- [ ] No build errors

---

## FINISH

```bash
npm run build && git add -A && git commit -m "WO: Google Sign-In for admin + fix admin alert email to jon@jgoldco.com" && git push origin main
```

---

*WO written by Jon Gold / Gold Co LLC — 2026-04-03*
