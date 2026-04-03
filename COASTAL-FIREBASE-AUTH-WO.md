# COASTAL-FIREBASE-AUTH-WO.md
# Work Order: Firebase Auth on /admin
# Priority: Phase 1 / WO 3 — PRE-LAUNCH BLOCKER
# Date: 2026-04-03

---

## OBJECTIVE

Add Firebase Authentication to protect the /admin route. Currently anyone with the URL can access the full admin dashboard. After this WO, only authenticated users can access /admin. All unauthenticated visitors get redirected to a login page.

---

## INSTRUCTIONS

### BEFORE YOU START

Read these files IN FULL before making any changes:
- `src/app/admin/page.tsx`
- `src/lib/firebase.ts` (or wherever the Firebase config lives)
- `src/app/layout.tsx`
- Check if `firebase/auth` is already in package.json dependencies

Do NOT rewrite any file entirely. Make surgical edits only.
Do NOT touch globals.css or tailwind.config.ts.

---

## PART A: Enable Firebase Auth

### 1. Enable Authentication in Firebase Console

This step may need to be done manually by Jon if CLI access to Firebase Console is not available. But try:

```bash
firebase auth:enable-provider email
```

If that doesn't work, note it and Jon will enable Email/Password provider in the Firebase Console manually at:
https://console.firebase.google.com/project/coastal-mobile-lube/authentication/providers

### 2. Install Firebase Auth SDK (if not already installed)

Check package.json. If `firebase` is already installed (it should be), Auth is included. No additional install needed.

### 3. Add Auth to Firebase config

In the Firebase config file (likely `src/lib/firebase.ts`), add:

```typescript
import { getAuth } from 'firebase/auth';
```

And export the auth instance:

```typescript
export const auth = getAuth(app);
```

Do NOT remove or change any existing exports (db, app, etc.).

---

## PART B: Create Login Page

Create a new file: `src/app/admin/login/page.tsx`

This is a simple login form:

- Navy background (`#0B2040`) full-screen, centered card
- White card with border-radius 12px, max-width 400px, padding 32px
- Heading: "Admin Login" — navy, weight 800, size 24px
- Subtext: "Coastal Mobile Lube & Tire" — gray, size 14px
- Email input field
- Password input field
- "Sign In" button — orange `#E07B2D`, white text, full width, border-radius 8px
- Error message area (red text, shown on failed login)
- Use `signInWithEmailAndPassword` from `firebase/auth`
- On successful login, redirect to `/admin` using `next/navigation` router.push
- Style it to match the site's design system (Plus Jakarta Sans, consistent with admin dashboard look)

No sign-up form. No password reset. No social login. Just email + password.

---

## PART C: Protect /admin Route

### Option 1 (Preferred): Auth wrapper component

Create `src/components/AdminAuthGuard.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
      } else {
        router.push('/admin/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0B2040',
        color: 'white',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  if (!authenticated) return null;
  return <>{children}</>;
}
```

### Wrap the admin page

In `src/app/admin/page.tsx`, wrap the entire page content with `<AdminAuthGuard>`:

```typescript
import AdminAuthGuard from '@/components/AdminAuthGuard';

// ... existing component code ...

export default function AdminPage() {
  return (
    <AdminAuthGuard>
      {/* ALL existing admin page content goes here, unchanged */}
    </AdminAuthGuard>
  );
}
```

Do NOT restructure the admin page internals. Just wrap the outermost return in the guard.

---

## PART D: Add Sign Out Button

In the admin dashboard, add a "Sign Out" button. Place it in the admin header/stats bar area, right-aligned.

- Text: "Sign Out"
- Style: small, subtle — white text on navy bg with a slight border, or just a text link
- On click: call `signOut(auth)` from `firebase/auth`, then redirect to `/admin/login`
- Import auth from the firebase config

---

## PART E: Create Admin User

After deploying, Jon needs to create the admin user account. Add a note at the end of this WO's output reminding Jon to:

1. Go to Firebase Console > Authentication > Users
2. Click "Add user"
3. Email: jonrgold@gmail.com (Jon's account for now)
4. Set a password
5. Later, add Jason's email if he needs admin access

Alternatively, if Firebase CLI supports it:
```bash
# This may or may not work from CLI
firebase auth:create-user --email jonrgold@gmail.com --password TEMP_PASSWORD
```

---

## VALIDATION

- [ ] Visiting /admin without being logged in redirects to /admin/login
- [ ] Login page renders with email/password fields
- [ ] Incorrect credentials show an error message
- [ ] Correct credentials redirect to /admin dashboard
- [ ] All existing admin features work after login (bookings, calendar, customers, comms log)
- [ ] Sign Out button visible in admin header
- [ ] Sign Out redirects to /admin/login
- [ ] Login page does not show the main site header/footer (standalone page)
- [ ] No build errors

---

## FINISH

```bash
npm run build && git add -A && git commit -m "WO: Firebase Auth on /admin - pre-launch blocker" && git push origin main
```

After deploy, remind Jon:
> MANUAL STEP REQUIRED: Go to Firebase Console > Authentication > Users > Add user. Create account with jonrgold@gmail.com and a secure password. Email/Password provider must be enabled in Authentication > Sign-in method.

---

*WO written by Jon Gold / Gold Co LLC — 2026-04-03*
