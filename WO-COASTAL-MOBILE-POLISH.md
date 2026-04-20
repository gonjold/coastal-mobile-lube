# WO-COASTAL-MOBILE-POLISH.md
# Coastal Mobile Lube & Tire -- Mobile Menu Polish + How It Works Copy Fix + Hero Whitespace

## Constraints
- Do NOT rewrite entire files. Surgical edits only.
- Read every target file IN FULL before making any changes.
- Use `perl -i -pe` instead of `sed` (macOS).
- No em dashes, no emojis anywhere.
- End with build, commit, push, deploy.

---

## TASK 1: Fix Mobile Menu

Read the Header component in full. Find the mobile drawer/menu panel. Make these changes:

### 1A: Full-width overlay
The mobile menu currently slides in from the right as a partial-width panel, leaving page content visible on the left. Change it to one of these approaches (pick whichever requires fewer changes):

**Option A (preferred):** Add a dark scrim/backdrop behind the panel. A `fixed inset-0 bg-black/60 z-[99]` div that renders when the menu is open, behind the panel (which stays at z-[100]). Clicking the scrim closes the menu.

**Option B:** Make the panel itself full-width (`w-full` instead of any partial width).

Either way, no page content should be visible when the menu is open.

### 1B: Add "Get a Quote" to the menu
Add a "Get a Quote" link to the mobile nav menu, between the nav links and the phone/Book Service buttons. It should trigger the same QuoteModal that the teal FAB button triggers. Look at how the FAB opens the modal (likely a state setter or context) and wire the same action to this menu link. Style it as a teal text link or teal outlined button to differentiate it from the orange "Book Service" button.

When "Get a Quote" is tapped, close the mobile menu first, then open the QuoteModal.

### 1C: Visual cleanup
- The nav link text should be white (not dark/black if that's happening)
- Ensure the X close button has sufficient contrast against the dark background
- The separator lines between nav links should be `border-white/10` (very subtle)

---

## TASK 2: Unify How It Works Copy (Mobile = Desktop)

Read the How It Works section in `src/app/page.tsx` (or wherever it lives). Right now the mobile and desktop branches render DIFFERENT text content. The mobile branch has old copy ("You book a time" / "We roll up ready" / "You never left your day") while the desktop branch has the correct copy.

Fix: Make both mobile and desktop use the SAME steps data. Define the steps array ONCE:

```
Step 1: title="Book in 60 seconds", description="Pick your service, choose a time. Or just call us."
Step 2: title="We show up", description="Our fully equipped van arrives at your location, on time, ready to work."
Step 3: title="Done. Go.", description="No waiting rooms. No ride to the shop. You never left your day."
```

Both the desktop card layout (lg+) and the mobile icon-left layout (below lg) should map over this same array. Do NOT duplicate the step content in two places.

Also update the section headline to match: "Three steps. That's it." (not "Three steps. Done.")

---

## TASK 3: Fix Hero Whitespace

Read the hero section in `src/app/page.tsx`. The hero currently uses a sticky/parallax scroll effect (`position: sticky; top: 0`) so the How It Works section slides up over it. This is causing a large blank navy gap below the hero content on desktop (visible as empty navy space between the hero and How It Works).

Diagnose the issue by checking:
1. Is there a spacer div or min-height on the hero wrapper that's taller than the content?
2. Is the hero section's height set to `100vh` or similar, leaving empty space below the actual content?
3. Is the sticky container's height not matching the content height?

The fix should ensure:
- The hero content fits snugly with reasonable padding (no massive empty gap)
- The sticky/parallax effect still works if possible, but NOT at the cost of dead space
- If the sticky effect is what's causing the gap, remove the sticky behavior entirely. A simple static hero that scrolls normally is better than one with a huge blank gap.
- On mobile, the hero should definitely NOT be sticky (mobile sticky heroes cause scroll jank)

---

## TASK 4: Build, Commit, Push, Deploy

```bash
npm run build
```

Fix all build errors before proceeding.

```bash
git add -A
git commit -m "fix: mobile menu full-width + get a quote link, unify HIW copy, fix hero whitespace"
git push origin main
npx netlify-cli deploy --prod
```

If Netlify CLI is not linked:
```bash
npx netlify-cli link --name coastal-mobile-lube
```
