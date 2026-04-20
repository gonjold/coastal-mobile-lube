# WO-COASTAL-HERO-SPACING-V2.md

Read the following files in full before making any changes:
- src/app/page.tsx
- src/app/layout.tsx (or wherever the header/navbar lives)
- src/app/globals.css

Do not rewrite entire files. Surgical edits only.

## FIX 1: REVERT BREAKPOINT BACK TO LG (1024px)

The previous WO changed the two-column hero from lg to xl breakpoint. Revert ALL of those changes. The two-column layout (copy left + form right) should activate at lg (1024px), not xl (1280px).

Find every xl: class that was changed from lg: in the hero section and change them back to lg:.

Also revert any QuoteFAB breakpoint changes back to 1024px.

## FIX 2: WIDEN THE CONTENT CONTAINER

The hero content is too narrow. Find the max-width constraint on the hero inner container (likely max-w-[1100px] or max-w-6xl or similar).

Change it to max-w-[1320px] or max-w-7xl. This gives the content more room to breathe on wider screens.

Also find the section-inner or container class used sitewide in globals.css. If there is a global max-width like max-w-[1100px], increase it to max-w-[1280px].

The hero section horizontal padding on desktop should be px-8 (32px) at minimum, px-12 (48px) preferred.

## FIX 3: LEFT COLUMN TEXT - ALL LEFT ALIGNED, BIGGER

Make sure the left column in the desktop hero is entirely left-aligned:
- Eyebrow: text-left
- Headline: text-left, text-[58px], font-extrabold, leading-[1.04], tracking-[-1px]
- Subheadline: text-left, text-[19px], leading-[1.55], max-w-[520px] (no mx-auto)
- CTA row: flex justify-start gap-3
- Trust capsule: justify-start (not centered)

The left column should NOT have text-center at any breakpoint on desktop.

## FIX 4: FROSTED GLASS HEADER WITH SCROLL COLOR SWAP

The header should be semi-transparent (frosted glass) and change color based on what section is behind it.

### Default state (on hero / navy sections):
- Background: bg-white/[0.12] backdrop-blur-[16px] saturate-[1.4] (frosted white glass, you can see the navy through it)
- Text: text-white for nav links, logo text white
- Phone button: border border-white/[0.2] text-white bg-white/[0.08] backdrop-blur-[8px]
- Book Service button: bg-[#E07B2D] text-white (orange, unchanged)
- Hamburger + phone icons on mobile: white
- Bottom border: border-b border-white/[0.08]

### Scrolled state (on light sections):
- Background: bg-[#0B2040]/[0.88] backdrop-blur-[16px] saturate-[1.4] (frosted navy glass, slightly see-through)
- Text: text-white for nav links (stays white since navy bg)
- Phone button: border border-white/[0.2] text-white bg-white/[0.08]
- Book Service button: bg-[#E07B2D] text-white (unchanged)
- Bottom border: border-b border-white/[0.06]

### Implementation:
Add state to the header component: `const [scrolledPastHero, setScrolledPastHero] = useState(false)`.

Use useEffect with an IntersectionObserver watching the element with id="hero-section" (already added in the hero rebuild WO). When the hero is intersecting (visible), set false (frosted white glass). When hero is NOT intersecting (scrolled past), set true (frosted navy glass).

If no element with id="hero-section" exists on the current page (like /about, /contact), default to the scrolled state (frosted navy).

Apply all background, text, and border colors conditionally based on this state. Use CSS transition on background-color and border-color: `transition-all duration-300 ease-in-out` so the swap is smooth.

The header should remain position sticky top-0 z-50.

## FIX 5: HERO PADDING REDUCTION

Reduce hero section vertical padding on desktop:
- Top: pt-10 (40px)
- Bottom: pb-10 (40px)

This was in the previous WO but confirm it is applied. The hero content should fill the viewport, not float in empty space.

## FIX 6: FORM COLUMN SIZING

The frosted glass form should be w-[420px] with p-[30px_26px] internal padding.

The gap between the left copy column and the right form column should be gap-12 (48px).

The left column should be flex-1 with no max-width so it fills remaining space.

## BUILD AND DEPLOY

```bash
cd ~/projects/coastal-mobile-lube && npm run build && git add -A && git commit -m "fix: hero layout v2 - revert breakpoint, widen container, white header, left-align" && git push origin main && npx netlify-cli deploy --prod
```
