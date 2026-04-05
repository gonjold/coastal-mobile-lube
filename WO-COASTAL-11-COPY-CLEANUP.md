# WO-COASTAL-11: Copy Cleanup

## Summary
Remove all em dashes from copy across the entire site and do a final text quality pass.

## Pre-read
- Run this to find all em dashes in the codebase:
  grep -rn "—" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"
- Note every file and line number

## Changes

### 1. Remove All Em Dashes
- Find every em dash character (—) in all source files under src/
- Replace with either:
  - A regular hyphen with spaces around it ( - ) for separating clauses
  - A comma or period if that reads more naturally
  - Just remove it if the sentence works without
- Use your judgment on which replacement reads best for each instance
- Do NOT use en dashes either -- regular hyphens only

### 2. Text Quality Check
While you are in each file removing em dashes, also check for and fix:
- Any remaining "AI-sounding" phrases (e.g. "leveraging", "utilizing", "comprehensive suite", "cutting-edge", "seamless")
- Double spaces
- Inconsistent capitalization in headings
- Any placeholder text like "Lorem ipsum" or "TODO" visible to public users
- Phone number consistency: should always be "813-722-LUBE" (not "813-722-5823" in customer-facing text, though tel: links should use the numeric version)

### 3. Verify Key Info Is Correct
Spot check these values are consistent across all pages:
- Phone: 813-722-LUBE
- Service area: Tampa Bay
- Business name: Coastal Mobile Lube & Tire (not "and Tire" or "Lube and Tire" or any other variation)

## Rules
- Do NOT rewrite entire files. Surgical find-and-replace only.
- Do NOT touch globals.css or tailwind config.
- Do NOT change any code logic, only text content strings.

## Deploy
```bash
npm run build && npx netlify-cli deploy --prod --message="WO-11: Copy cleanup - em dashes removed, text quality pass"
```

Then run: git add -A && git commit -m "WO-11: Copy cleanup" && git push origin main
