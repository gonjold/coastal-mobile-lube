# WO-COASTAL-HERO-POLISH.md

Read the following files in full before making any changes:
- src/app/page.tsx
- src/app/layout.tsx
- src/app/globals.css
- src/components/QuoteFAB.tsx
- src/components/QuoteModal.tsx

Do not rewrite entire files. Surgical edits only. Max 3-4 changes per file.

## FIX 1: HEADER CALL BUTTON GLASS TREATMENT

Find the header component (likely in src/app/layout.tsx or src/components/layout/Navbar.tsx or similar).

The "813-722-LUBE" button in the desktop header should match the hero call button style: frosted glass look. Change it from its current style to:
- bg-white/[0.08] backdrop-blur-[12px] border border-white/[0.18] text-white rounded-[8px] px-5 py-2.5 font-semibold
- Keep the phone icon left of text

Do NOT change the orange "Book Service" button in the header.

## FIX 2: HERO LAYOUT ADJUSTMENTS (DESKTOP)

In src/app/page.tsx, find the hero section.

A. Logo watermark: Find the element that renders the background watermark logo. Increase its size from whatever it currently is to background-size: 600px on desktop (md breakpoint and up). Keep it centered. Keep opacity at 0.06.

B. Left column text alignment: Change the left column from text-center to text-left for the headline (h1) and subheadline (p). Keep the eyebrow centered. Keep the CTA buttons centered (justify-center). Keep the trust capsule centered.

C. Spacing: Add more vertical spacing between elements on the left column:
- After eyebrow: mb-6 (was likely mb-4 or less)
- After headline: mb-5
- After subheadline: mb-8
- The overall left column should have more padding: pt-4

D. Sizing: Increase the frosted glass form width from w-[370px] to w-[400px]. Increase internal padding from p-[26px_22px] to p-[30px_26px].

E. Name input fix: Check the hero quote form. The first name and last name inputs should be in a flex row with gap-2. If they are wrapping or misaligned, make sure both inputs have flex-1 and min-w-0 so they share space equally.

## FIX 3: HERO LAYOUT ADJUSTMENTS (MOBILE)

A. Logo watermark: Increase background-size to 360px on mobile (up from 280px or whatever it is now).

B. Steps section (How It Works) mobile layout: Change from the current card layout to a simple numbered list. Remove the cards, remove the icon squares. Replace with:

For each step, render as a simple flex row:
```
<div className="flex items-start gap-3 mb-4">
  <span className="text-[#10B4B9] text-[15px] font-extrabold mt-[2px] shrink-0">1.</span>
  <div>
    <span className="text-[#0B2040] text-[15px] font-bold">You book a time</span>
    <span className="text-[#555] text-[13.5px] ml-1">Pick your service and a time that works. Takes about a minute.</span>
  </div>
</div>
```

So it reads as: "1. You book a time Pick your service..." with the number in teal and the title in bold navy inline with the description. No cards, no icons, no boxes. Just clean numbered text.

Keep the section heading ("HOW IT WORKS" eyebrow + "Three steps. Done." heading) centered above.

C. White space before footer: Find the bottom of the page and look for any empty section, extra padding, or orphaned div creating whitespace before the navy footer. Remove it. Check if there is an empty div with height or padding after the last content section and before the footer.

## FIX 4: QUOTE FAB IMPROVEMENTS

In src/components/QuoteFAB.tsx:

A. Desktop scroll threshold: The FAB currently uses IntersectionObserver on the hero. Change the threshold so the FAB appears when LESS THAN HALF of the hero is visible (threshold: 0.5 on the observer, or use rootMargin to trigger earlier). The goal: FAB fades in about halfway through scrolling past the hero, not after the hero is fully gone.

B. Size: Increase the FAB height from h-[48px] to h-[54px]. Increase border-radius to rounded-[27px]. Increase text to text-[15px]. Increase icon to 20px. Increase horizontal padding: px-[20px] pl-[16px].

C. Animation: Make the pulse more noticeable. Change the keyframes so the glow ring expands more:
```css
@keyframes fabPulse {
  0%, 100% { 
    box-shadow: 0 4px 16px rgba(13,138,143,0.5), 0 0 0 3px rgba(16,180,185,0.2); 
  }
  50% { 
    box-shadow: 0 6px 28px rgba(13,138,143,0.7), 0 0 0 10px rgba(16,180,185,0.12); 
  }
}
```
Also add a subtle scale: transform: scale(1) at 0%/100%, scale(1.06) at 50%.

D. On mobile: Same size and animation changes. Make sure bottom offset keeps it above the sticky bar.

## BUILD AND DEPLOY

After all fixes:

```bash
cd ~/projects/coastal-mobile-lube && npm run build && git add -A && git commit -m "fix: hero polish - layout, spacing, FAB threshold, mobile steps" && git push origin main && npx netlify-cli deploy --prod
```

If netlify-cli is not linked, just push. The GitHub push may auto-deploy if configured. Otherwise run `npx netlify-cli link --name coastal-mobile-lube` first.
