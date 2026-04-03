# COASTAL-BADGE-AND-PHOTOS-WO.md
# Work Order: Oval Badge Placement + Van Wrap Photos
# Priority: Phase 1 / WO 2
# Date: 2026-04-03

---

## OBJECTIVE

Expand use of Jason's oval badge logo throughout the site. Upload the two real van wrap photos to Cloudinary and swap them into key locations, replacing AI-generated stock images.

---

## INSTRUCTIONS

### BEFORE YOU START

Read these files IN FULL before making any changes:
- `src/app/page.tsx` (homepage)
- `src/app/about/page.tsx`
- `src/app/services/page.tsx`
- `src/components/Footer.tsx`

Do NOT rewrite any file entirely. Make surgical edits only.
Do NOT touch globals.css or tailwind.config.ts.

---

## PART A: Upload Van Wrap Photos to Cloudinary

Upload these two images to Cloudinary (cloud: dgcdcqjrz) using the Cloudinary CLI or upload API:

1. **Oil_Van.png** — side view of the wrapped van (sunset graphics, car + boat, 813-722-LUBE)
2. **Tire_Oil_Van_.png** — three-quarter rear view of the wrapped van

If the Cloudinary CLI is not available, use curl:

```bash
curl -X POST https://api.cloudinary.com/v1_1/dgcdcqjrz/image/upload \
  -F "file=@/path/to/Oil_Van.png" \
  -F "upload_preset=ml_default" \
  -F "public_id=coastal-van-wrap-side"

curl -X POST https://api.cloudinary.com/v1_1/dgcdcqjrz/image/upload \
  -F "file=@/path/to/Tire_Oil_Van_.png" \
  -F "upload_preset=ml_default" \
  -F "public_id=coastal-van-wrap-rear"
```

If upload_preset doesn't work, check if unsigned uploads are enabled or use the API key/secret from the Cloudinary dashboard. If Cloudinary upload is not possible from CLI, skip this part and note it — Jon will upload manually.

Record the resulting Cloudinary URLs. They will follow this pattern:
- `https://res.cloudinary.com/dgcdcqjrz/image/upload/v{timestamp}/coastal-van-wrap-side.png`
- `https://res.cloudinary.com/dgcdcqjrz/image/upload/v{timestamp}/coastal-van-wrap-rear.png`

Use transforms: `w_1200,q_auto:good,f_auto` for hero/large usage, `w_600,q_auto:good,f_auto` for card/smaller usage.

---

## PART B: Oval Badge Logo Placement

The oval badge logo is already on Cloudinary at:
```
https://res.cloudinary.com/dgcdcqjrz/image/upload/w_200,q_auto:good,f_auto/v1774315498/Coastal_Lube_logo_v1_zbx9qs.png
```

Add this logo to these locations:

### 1. Homepage hero area
Add the oval badge to the left side of the hero (above or near the headline). Size: max-width 120px. Use `object-contain`. It should sit on the navy background, so it needs to work on dark. If the badge has a dark background itself, it will blend — add a subtle white glow/shadow if needed: `filter: drop-shadow(0 0 12px rgba(255,255,255,0.15))`.

### 2. About page
Add the oval badge near the top of the about page content area, centered or left-aligned above Jason's story section. Size: max-width 140px.

### 3. Footer
The badge is already in the footer. Leave it. Verify it renders correctly.

---

## PART C: Van Wrap Photo Swap

Replace AI-generated stock images with the real van wrap photos:

### 1. About page
Find the current van mockup image (Van_mockup_ln68oh.png) and replace with the side-view van wrap photo (`coastal-van-wrap-side`). Use `w_800,q_auto:good,f_auto` transform.

### 2. Homepage services section
If there is a van/service image visible in the services tab area or hero, swap it for the side-view van wrap. If the current image is a driveway service stock photo that works well contextually, leave it — use judgment.

### 3. Do NOT replace:
- Service-specific images (oil change close-up, tire service, marina) — these are contextual and should stay even though they're AI-generated, until Jason has real action shots
- Any fleet or marine specific imagery

---

## VALIDATION

- [ ] Oval badge appears on homepage hero area
- [ ] Oval badge appears on about page
- [ ] Oval badge still in footer
- [ ] Real van wrap photo on about page (not old mockup)
- [ ] Images load correctly with Cloudinary transforms
- [ ] No build errors
- [ ] Mobile: badge sizes are appropriate (not too large on small screens)

---

## FINISH

```bash
npm run build && git add -A && git commit -m "WO: Oval badge expansion + real van wrap photos" && git push origin main
```

---

*WO written by Jon Gold / Gold Co LLC — 2026-04-03*
