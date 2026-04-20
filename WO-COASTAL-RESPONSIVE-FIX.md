# WO-COASTAL-RESPONSIVE-FIX.md
# Coastal Mobile Lube & Tire -- Mobile Menu + Breakpoint Standardization + Mobile Steps Fix

## Constraints
- Do NOT rewrite entire files. Surgical edits only.
- Read every target file IN FULL before making any changes.
- Use `perl -i -pe` instead of `sed` (macOS).
- No em dashes, no emojis anywhere.
- End with build, commit, push, deploy.

---

## TASK 0: Audit Current Breakpoints

Before changing anything, read the following files in full and report what responsive breakpoint each one uses for its mobile/desktop switch:

1. The Header component (likely `src/components/Header.tsx` or similar)
2. The Hero section on the homepage
3. The How It Works section on the homepage
4. The Services section on the homepage
5. The Footer
6. The sticky mobile bottom bar
7. The FloatingQuoteBar
8. The MobileQuickQuote (if it still exists)

For each component, find every Tailwind responsive prefix (`sm:`, `md:`, `lg:`, `xl:`) and list them. Specifically note which breakpoint controls the mobile-to-desktop layout switch (e.g., `hidden lg:flex` vs `hidden md:flex` vs `block lg:hidden`).

Print a summary table like this before proceeding:

```
Component              | Mobile/Desktop Switch | Notes
-----------------------|-----------------------|------
Header nav links       | ???                   |
Header hamburger       | ???                   |
Hero layout            | ???                   |
How It Works columns   | ???                   |
Services grid          | ???                   |
Footer grid            | ???                   |
Sticky bottom bar      | ???                   |
FloatingQuoteBar       | ???                   |
MobileQuickQuote       | ???                   |
```

---

## TASK 1: Fix Mobile Menu Background

The hamburger menu opens on mobile but has NO background behind the nav links. The links render directly on top of page content, making it unreadable and unusable.

Find the mobile menu/drawer component in the Header file. It should be the element that renders when the hamburger is toggled open. Apply these fixes:

- The open menu overlay must have a solid or frosted navy background: `bg-[#0A1628]/95 backdrop-blur-md` or similar dark navy with slight transparency and blur
- It must cover the full viewport: `fixed inset-0 z-50` (or at minimum cover from below the header to the bottom of the screen)
- Nav links inside must be white text, large enough to tap (min 48px touch targets), with clear spacing between them
- There must be a way to close it (either tapping the hamburger again, an X button, or tapping outside)
- Body scroll should be locked when the menu is open (check if this is already handled)
- The menu should slide in or fade in, not just appear instantly. A simple `transition-all duration-300` is fine.

Do NOT restructure the header component. Only fix the mobile drawer/overlay styling.

---

## TASK 2: Standardize All Breakpoints to a Consistent System

Based on the audit from Task 0, standardize EVERY component to use this breakpoint system:

| Range | Label | Behavior |
|-------|-------|----------|
| 0 - 767px | Mobile | Single column, stacked layouts, hamburger nav |
| 768px - 1023px | Tablet | Can show 2-column grids where appropriate, still hamburger nav |
| 1024px+ (lg) | Desktop | Full desktop layout, horizontal nav, multi-column grids |

The critical rule: **The header's mobile/desktop nav switch and every section's layout switch must ALL use `lg:` (1024px)**. No component should switch to desktop layout at `md:` (768px) while the header is still showing hamburger. That mismatch is the core bug.

Specific changes to make:
- If any component uses `md:` for its primary layout switch (e.g., `hidden md:flex`, `md:grid-cols-3`), change those to `lg:` equivalents
- If any component uses `xl:` for its primary layout switch, change to `lg:`
- For tablet-specific tweaks (768-1023px), you can ADD `md:` classes that provide intermediate layouts (e.g., `md:grid-cols-2 lg:grid-cols-3`) but the full desktop layout must be at `lg:`
- Check the sticky bottom bar: it should be visible on mobile and tablet, hidden at desktop. Should be `lg:hidden`, not `md:hidden`
- Check FloatingQuoteBar: desktop only, should use `hidden lg:block`

Search the ENTIRE codebase for `md:grid-cols-3`, `md:flex`, `md:hidden`, `hidden md:` and evaluate each one. Not all need changing (some `md:` classes are fine for intermediate tablet layouts), but any that control the PRIMARY mobile-to-desktop switch must become `lg:`.

---

## TASK 3: Fix Mobile How It Works Steps Layout

The How It Works section on mobile needs this specific layout for each step:

```
+--------+  1. Book in 60 seconds        <-- teal number, bold navy title, same line
| icon   |  Pick your service, choose     <-- gray description text, starts at
| square |  a time. Or just call us.          same left edge as the title
+--------+
```

Requirements:
- Each step is a horizontal flex row on mobile (below lg breakpoint)
- Left side: a 52px navy gradient square (`bg-gradient-to-br from-[#0A1628] to-[#1a3a5c]`) with the white icon inside, rounded-xl
- Right side: flex-col
  - Top line: teal number ("1.") in `text-[#0891B2] font-bold` followed by the title in `font-bold text-[#0A1628]` on the same line
  - Below: description in `text-gray-500 text-sm`
- Gap between icon square and text: `gap-4`
- Gap between steps: `gap-6`
- No card borders or backgrounds on mobile. Clean and minimal.

On desktop (lg+), the existing 3-column card layout with centered content should remain unchanged.

The three steps are:
1. Icon: Calendar or similar booking icon. Title: "Book in 60 seconds". Description: "Pick your service, choose a time. Or just call us."
2. Icon: Truck/van icon. Title: "We show up". Description: "Our fully equipped van arrives at your location, on time, ready to work."
3. Icon: CheckCircle or thumbs-up icon. Title: "Done. Go." Description: "No waiting rooms. No ride to the shop. You never left your day."

---

## TASK 4: Build, Commit, Push, Deploy

```bash
npm run build
```

If the build fails, fix all errors before proceeding. Do not skip type errors or warnings that would prevent deployment.

```bash
git add -A
git commit -m "fix: mobile menu bg, standardize breakpoints to lg, fix mobile steps layout"
git push origin main
npx netlify-cli deploy --prod
```

If the Netlify CLI is not linked, run this first:
```bash
npx netlify-cli link --name coastal-mobile-lube
```

---

## CC Prompt

```
Read this work order and execute all tasks in sequence. Start with Task 0 (audit) and print the breakpoint table before making any changes. Then do Tasks 1, 2, 3, and 4 in order. Read every file you plan to edit IN FULL before touching it. Do not rewrite entire files. Make surgical, targeted edits only.

cat ~/projects/coastal-mobile-lube/WO-COASTAL-RESPONSIVE-FIX.md
```
