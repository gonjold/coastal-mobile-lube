# PASS 4 — Content Editor (Hero Copy) Publish Diagnosis

**Status:** Diagnosis only. No fix shipped in WO-29.
**Snapshot date:** 2026-04-22
**Symptom (reported by Jon):** edits saved in `/admin/hero-editor` ("Content Editor" in sidebar) do not appear on the homepage hero on the live site.

---

## 1. What the homepage hero reads

**File:** `src/app/page.tsx`
**Lines 79–84 — defaults:**

```ts
const HERO_DEFAULTS = {
  eyebrowLine1: "APOLLO BEACH · TAMPA BAY · SOUTH SHORE",
  eyebrowLine2: "Cars. Boats. RVs. Fleets.",
  headline: "We bring the shop. You keep your day.",
  subheadline: "Mobile oil changes, tires, brakes, marine, and RV service across Apollo Beach and Tampa. Factory-trained team. 12-month warranty on every job.",
};
```

**Lines 101–117 — runtime fetch:**

```ts
const [heroCopy, setHeroCopy] = useState(HERO_DEFAULTS);
useEffect(() => {
  getDoc(doc(db, "siteConfig", "heroCopy"))
    .then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setHeroCopy({
          eyebrowLine1: d.eyebrowLine1 || HERO_DEFAULTS.eyebrowLine1,
          eyebrowLine2: d.eyebrowLine2 || HERO_DEFAULTS.eyebrowLine2,
          headline: d.headline || HERO_DEFAULTS.headline,
          subheadline: d.subheadline || HERO_DEFAULTS.subheadline,
        });
      }
    })
    .catch(() => {});
}, []);
```

**Behavior:**
- Initial render uses `HERO_DEFAULTS` (so the page is never blank).
- Client-side, after mount, it tries to read `siteConfig/heroCopy` from Firestore as an **unauthenticated** request (no auth flow on the public site).
- On any error, the `.catch(() => {})` swallows it silently and the hero keeps `HERO_DEFAULTS`. **No console error, no UI signal.**

---

## 2. What the editor writes

**File:** `src/app/admin/hero-editor/page.tsx`
**Lines 47–51 — save:**

```ts
await setDoc(doc(db, "siteConfig", "heroCopy"), {
  ...form,
  updatedAt: serverTimestamp(),
});
```

**Behavior:**
- Writes to the same document the homepage reads from: `siteConfig/heroCopy`.
- Writes succeed because the admin user is authenticated (`request.auth != null`), and the catch-all rule (see §3) allows authed writes.
- The editor's own preview (lines 117–131) renders directly from local `form` state, so the admin sees their changes echoed back — confirming the save round-trip works inside the admin context. **This is misleading**, because admin reads succeed where public reads fail.

The editor itself works correctly. The data round-trips. The problem is on the read path for unauthenticated visitors.

---

## 3. Root cause — Firestore rules

**File:** `firestore.rules`

The full `siteConfig` collection is **not explicitly mentioned** in any rule block. It falls through to the catch-all at lines 69–73:

```
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

This means:
- Anonymous (public site) reads of `siteConfig/heroCopy` are **denied**.
- The denial throws inside the `getDoc()` promise.
- `.catch(() => {})` on `src/app/page.tsx:116` silently absorbs it.
- `setHeroCopy` is never called with the Firestore data.
- Hero stays on `HERO_DEFAULTS` forever, regardless of what the admin saves.

For comparison, every collection that *does* render publicly has an explicit `allow read: if true` rule:
- `services/{serviceId}` — line 20
- `serviceCategories/{categoryId}` — line 28
- `qrCodes/{id}` — line 36
- `settings/fees` — line 54

`siteConfig/*` is missing this allowance.

---

## 4. Secondary issue — sidebar label/route mismatch

**File:** `src/components/admin/AdminSidebar.tsx:104`

```ts
{ label: "Content Editor", href: "/admin/hero-editor" }
```

The sidebar implies a general content editor, but the route only edits the four hero fields (`eyebrowLine1`, `eyebrowLine2`, `headline`, `subheadline`). Anyone clicking "Content Editor" expecting to edit other site copy will be confused.

Not a bug per se, but it compounds the perception that "the CMS is broken" — the user thinks the editor controls more than it actually does.

---

## 5. Suggested fix path (separate work order)

### Step 1 — add a public-read rule for `siteConfig`

In `firestore.rules`, before the catch-all block:

```
// SITE CONFIG COLLECTION
// Public: can READ (homepage hero copy is fetched unauthenticated)
// Admin only: can WRITE
match /siteConfig/{docId} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

### Step 2 — deploy rules separately

Per the auto-memory note (`project_firestore_deploy_separate.md`): Netlify deploys do **not** push Firestore rules. Run:

```
firebase deploy --only firestore:rules
```

### Step 3 — verify

After the rules deploy:
1. In an incognito browser (no admin auth), open the live homepage.
2. DevTools → Network → filter `Firestore`. Confirm the `Listen` / `BatchGetDocuments` request to `siteConfig/heroCopy` returns 200, not 403/PERMISSION_DENIED.
3. Edit a hero field in `/admin/hero-editor`, save, hard-reload the homepage. The new copy should render.

### Step 4 — optional cleanup

- Rename the sidebar entry from "Content Editor" to "Hero Copy" (or rename the route to `/admin/content` and expand its scope), to remove the label/route mismatch in `src/components/admin/AdminSidebar.tsx:104`.
- Replace the silent `.catch(() => {})` on `src/app/page.tsx:116` with a `console.warn` so future Firestore read failures surface in DevTools instead of being invisible. (Don't surface to UI — defaults are a reasonable fallback for end users.)

---

## 6. Why the WO-29 hero copy still shipped correctly

WO-29 Pass 2 changed `HERO_DEFAULTS` directly in source. Since the Firestore read silently fails for public visitors, **the defaults are what every visitor actually sees**. So the hero copy is in fact live as of commit `9945604` — the CMS is not in the path. Until Pass 4's fix lands, the Content Editor remains effectively a no-op for public visitors.
