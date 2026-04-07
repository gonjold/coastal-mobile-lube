# WO-COASTAL-13: Logo in Navigation Bar

## Goal
Add the Coastal oval badge logo to the top-left of the nav bar, next to the existing "Coastal Mobile / LUBE & TIRE" text. Show on both desktop and mobile.

## Rules
- Interactive CC only. One change at a time.
- Do NOT rewrite entire files. Surgical edits only.
- Do NOT touch globals.css or tailwind.config.
- Read target files in full before editing.
- Build + deploy after completion.

## Steps

1. **Read the nav component in full.** It's likely at `src/components/Navbar.tsx` or `src/components/layout/Navbar.tsx`. Find the exact file path first:
   ```
   find src -name "*Nav*" -o -name "*nav*" -o -name "*Header*" | head -20
   ```

2. **Find the logo on Cloudinary.** The cloud name is `dgcdcqjrz`. The asset is named something like `Coastal_Lube_logo`. The Cloudinary URL pattern is:
   ```
   https://res.cloudinary.com/dgcdcqjrz/image/upload/v1/[path]/Coastal_Lube_logo
   ```
   Search the codebase for existing Cloudinary references to find the exact path/folder structure:
   ```
   grep -r "cloudinary\|dgcdcqjrz" src/ --include="*.tsx" --include="*.ts" -l
   ```
   Then check those files for the URL pattern used.

3. **Add the logo image to the nav.** Insert an `<img>` tag to the left of the text logo/brand element:
   - `h-10` on desktop, `h-8` on mobile (adjust if nav height differs)
   - `object-contain`
   - `mr-2` spacing before the text
   - `alt="Coastal Mobile Lube & Tire"`
   - If the text brand is inside an `<a>` or `<Link>`, put the img inside the same wrapper

4. **Verify on mobile nav too.** If there's a separate mobile menu / hamburger layout, ensure the logo appears there as well (same sizing or slightly smaller).

5. **Build and deploy:**
   ```bash
   cd ~/coastal-mobile-lube && npm run build && npx netlify-cli deploy --prod --message="WO-13: nav logo"
   ```

6. **Verify on live site** -- desktop and mobile. Logo should appear next to text, not cut off or oversized.
