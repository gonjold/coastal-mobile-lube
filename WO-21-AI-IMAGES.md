# WO-21: AI Image Generation for Services Overview + How It Works

**Goal:** Replace the placeholder boxes from WO-20 with real AI-generated environmental photography (no people, no fake branded vehicles — just scene-setting imagery ready for the site). Use whichever API key is already available on the Mac Mini. Save to the Coastal repo's `public/images/` folder so they deploy with Netlify, no runtime CDN dependency.

**Prerequisite:** WO-20 must be deployed first (placeholder div structure must exist).
**Expected execution time:** 15-25 minutes.
**Estimated cost:** ~$0.40-0.80 depending on provider (5 HD images).

---

## Step 0: API Key Discovery

Search the Mac Mini for any API key that supports image generation. Print each found key with ONLY the first 4 and last 4 characters visible (e.g. `sk-p...Xa92`) — never log full keys.

```bash
# OpenClaw config
cat ~/openclaw/openclaw.json 2>/dev/null | grep -iE "api_key|apikey|openai|openrouter|fal|replicate|stability" | head -20
cat ~/.openclaw/openclaw.json 2>/dev/null | grep -iE "api_key|apikey|openai|openrouter|fal|replicate|stability" | head -20
find ~/openclaw ~/.openclaw ~/.config/openclaw 2>/dev/null -name "*.json" -o -name "*.env" | head -10

# Shell env
cat ~/.zshrc ~/.bashrc ~/.zprofile 2>/dev/null | grep -iE "OPENAI|OPENROUTER|FAL_KEY|REPLICATE|STABILITY|CLOUDINARY" | grep -v "^#"

# Coastal project env
cat ~/coastal-mobile-lube/.env.local 2>/dev/null
cat ~/coastal-mobile-lube/.env 2>/dev/null

# Other project envs that might have keys
find ~/projects ~/coastal-mobile-lube ~/hireflow ~/synergy-station 2>/dev/null -maxdepth 3 -name ".env*" | head -10

# Check current shell env
env | grep -iE "OPENAI|OPENROUTER|FAL|REPLICATE|STABILITY|CLOUDINARY" | sed 's/=.*/=****/'
```

Report back which keys were found. Priority order:

1. `OPENAI_API_KEY` → DALL-E 3 HD (best quality, $0.08/image)
2. `OPENROUTER_API_KEY` → OpenRouter image routing (google/gemini-2.0-flash-exp or others)
3. `FAL_KEY` or `FAL_API_KEY` → Flux Pro via fal.ai ($0.05/image)
4. `REPLICATE_API_TOKEN` → Flux or SDXL via Replicate
5. `STABILITY_API_KEY` → Stable Diffusion 3

Pick the highest-priority available key. If none of the above exist, STOP and print a clear error: `No image generation API key found. Add OPENAI_API_KEY, OPENROUTER_API_KEY, FAL_KEY, REPLICATE_API_TOKEN, or STABILITY_API_KEY to ~/.zshrc or ~/openclaw/openclaw.json and rerun.`

## Step 1: Define the image specs

5 images needed. All environmental, no people, no branded vehicles with visible logos.

| Slot | Aspect | Filename | Prompt |
|------|--------|----------|--------|
| 1 | 4:3 | `automotive.jpg` | Photorealistic wide shot of a residential driveway in a Florida suburb during golden hour morning light. Palm trees in the background. Modern suburban home. A clean generic white commercial service van with no logos or text is parked on the driveway. Professional commercial photography style, shallow depth of field, warm natural lighting, sharp focus. No people visible. 4:3 aspect ratio. |
| 2 | 4:3 | `marine.jpg` | Photorealistic wide shot of a small Florida marina at sunrise. Several motorboats and small fishing boats tied at wooden docks. Calm water reflecting warm morning light. Palm trees visible in background. A clean generic white service van with no logos parked at the entrance of the dock. Professional commercial photography, cinematic composition, golden hour lighting. No people visible. 4:3 aspect ratio. |
| 3 | 4:3 | `rv.jpg` | Photorealistic wide shot of a Florida RV park at morning. A large Class A motorhome parked at a wooded campsite. Florida pine trees and palmettos in the surrounding area. Warm sunlight filtering through trees. A clean generic white service van parked nearby, no logos. Professional commercial photography style, warm natural lighting, shallow depth of field. No people visible. 4:3 aspect ratio. |
| 4 | 4:3 | `fleet.jpg` | Photorealistic wide shot of a small commercial yard in Florida with a row of 4 to 5 identical plain white commercial cargo vans parked in a line on clean asphalt. No logos or text on any vehicles. Morning light, clean industrial setting, professional commercial photography, warm golden hour tones. No people visible. 4:3 aspect ratio. |
| 5 | 16:10 | `van-arriving.jpg` | Photorealistic cinematic wide shot of a suburban Florida home with a driveway visible from the street. A clean generic white commercial service van with no logos is just arriving at the driveway. Palm trees, modern two-story house, morning sunny day. Warm natural lighting, shallow depth of field, professional commercial photography, magazine quality. No people visible. 16:10 aspect ratio. |

Resolution per provider:
- **DALL-E 3 HD:** 1024x1024, 1792x1024 (landscape), or 1024x1792 (portrait). Use 1792x1024 for 16:10 slot. Use 1024x1024 and crop for 4:3 slots, or use "natural" style at 1792x1024 and center-crop.
- **Flux/Replicate:** specify exact dimensions (1024x768 for 4:3, 1792x1120 for 16:10)
- **Stability SD3:** 1024x1024 with aspect_ratio parameter

## Step 2: Generate images

Use the chosen provider's API. Example for DALL-E 3:

```bash
cd ~/coastal-mobile-lube
mkdir -p public/images/services
mkdir -p public/images/how-it-works

# Load the key from wherever Step 0 found it
export OPENAI_API_KEY="..."  # use the key that was discovered

# Generate each image (use curl or a small node script)
```

Recommended: write a one-off Node script at `~/coastal-mobile-lube/scripts/generate-images.js` that loops the 5 prompts, calls the API, and downloads the returned image URLs to disk. Do NOT commit this script to the repo — add it to `.gitignore` or delete after use.

Example script pattern (DALL-E 3, adapt to other providers):

```js
// scripts/generate-images.js
const fs = require('fs');
const https = require('https');

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const prompts = [
  { file: 'public/images/services/automotive.jpg', size: '1792x1024', prompt: '...' },
  { file: 'public/images/services/marine.jpg',     size: '1792x1024', prompt: '...' },
  { file: 'public/images/services/rv.jpg',         size: '1792x1024', prompt: '...' },
  { file: 'public/images/services/fleet.jpg',      size: '1792x1024', prompt: '...' },
  { file: 'public/images/how-it-works/van-arriving.jpg', size: '1792x1024', prompt: '...' }
];

async function generate(p) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: 'dall-e-3', prompt: p.prompt, size: p.size, quality: 'hd', n: 1 })
  });
  const data = await res.json();
  const imgUrl = data.data[0].url;
  // download the returned URL to p.file
  // ...
}

for (const p of prompts) await generate(p);
```

Run the script, confirm all 5 files land on disk. Each should be several hundred KB to ~1 MB.

## Step 3: Optimize for web

Images from image gen APIs are usually PNG or high-quality JPEG. Convert to efficient JPEG:

```bash
# If sharp-cli or imagemagick is available:
for f in public/images/services/*.jpg public/images/how-it-works/*.jpg; do
  # Target: ~150-250 KB each at 1792x1024
  magick "$f" -quality 82 -strip "$f"
done
```

If neither is installed, leave the files as-is. Next.js Image component will handle optimization at runtime.

## Step 4: Wire images into the components

### Services Overview page (`src/app/services-overview/page.tsx`)

Find each of the 4 placeholder div blocks from WO-20. Replace the placeholder content with a Next.js Image component:

```tsx
// BEFORE (from WO-20)
<div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-[#0B2040] to-[#132E54] flex items-center justify-center">
  <div className="absolute inset-0 opacity-10" style={{...}} />
  <div className="relative text-center px-6">
    <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Photo coming soon</div>
    <div className="text-white/80 text-sm font-medium">[Service photo: ...]</div>
  </div>
</div>

// AFTER
import Image from 'next/image';

<div className="relative aspect-[4/3] rounded-xl overflow-hidden">
  <Image
    src="/images/services/automotive.jpg"  // or marine/rv/fleet
    alt="Mobile automotive service in a Florida driveway"
    fill
    sizes="(min-width: 768px) 50vw, 100vw"
    className="object-cover"
    priority={false}
  />
</div>
```

Do this for all 4 cards with appropriate filenames and alt text:
- Automotive: `/images/services/automotive.jpg` · alt: "Mobile automotive service in a Florida driveway"
- Marine: `/images/services/marine.jpg` · alt: "Mobile marine service at a Florida marina"
- RV: `/images/services/rv.jpg` · alt: "Mobile RV service at a Florida campsite"
- Fleet: `/images/services/fleet.jpg` · alt: "Mobile fleet service for commercial vehicles"

### How It Works page (`src/app/how-it-works/page.tsx`)

Replace the Step 2 placeholder (the one that was the van illustration, now a placeholder div):

```tsx
<div className="relative aspect-[16/10] rounded-xl overflow-hidden">
  <Image
    src="/images/how-it-works/van-arriving.jpg"
    alt="Service van arriving at a Florida home"
    fill
    sizes="(min-width: 768px) 50vw, 100vw"
    className="object-cover"
    priority={false}
  />
</div>
```

Steps 1 and 3 illustrations (phone mockup + car/invoice/warranty) stay untouched.

## Step 5: Add images to git, build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube

# Delete the generation script before committing (don't ship API usage scripts)
rm scripts/generate-images.js

# Verify the images are the only new files
git status

# Stage images + component changes
git add public/images/services/ public/images/how-it-works/
git add src/app/services-overview/page.tsx src/app/how-it-works/page.tsx

# Build to catch any Image component errors
npm run build

# Commit and deploy
git commit -m "WO-21: AI-generated environmental imagery for services and how-it-works

- 4 service card images: automotive, marine, rv, fleet
- 1 how-it-works Step 2 image: van arriving at home
- Saved to public/images/ for Netlify static serving
- Replaces placeholder divs from WO-20
- Next.js Image component with proper alt text and sizes"

git push origin main
npx netlify-cli deploy --prod
```

## Step 6: Verification

1. https://coastal-mobile-lube.netlify.app/services-overview — 4 cards show real photography, no placeholders. Images load crisp on both desktop and mobile.
2. https://coastal-mobile-lube.netlify.app/how-it-works — Step 2 shows a real photo of a van arriving at a house. Steps 1 and 3 unchanged.
3. Right-click any image → "Open image in new tab" → confirm it's served from `/images/...` path on the coastal domain (not an external URL).
4. Lighthouse performance check on /services-overview — images should not regress LCP (should still be under 2.5s).

## Critical rules

- **Never commit the generation script.** It contains prompt-crafting logic but also is a vector for credential leakage if it's accidentally edited to hardcode a key. Delete it before `git add`.
- **Never print full API keys in tmux/chat output.** Mask everything: first 4 + last 4 characters only.
- **Never add `.env` files to git.** Verify `.gitignore` already excludes them before committing.
- **Do NOT use `git add -A`.** Use the explicit `git add public/images/ src/app/...` pattern shown above.
- **Do NOT regenerate images that already exist** on a re-run. Check `fs.existsSync()` first. Saves cost if the WO is run twice.
- **If an image comes out weird** (text artifacts, body-horror hands from AI weirdness, lens distortion on the van), regenerate just that one image with a tweaked prompt. Don't ship broken imagery.

## Do NOT

- Do NOT generate images with people, real faces, or fake technicians.
- Do NOT add logos to the van (visible Coastal Mobile logos on an AI-generated van reads as fake when the real van is different).
- Do NOT use these for the homepage hero — that deserves real photography once Jason does a photo shoot.
- Do NOT upload to Cloudinary in this WO. Static files in `public/` is cleaner for this use case.
