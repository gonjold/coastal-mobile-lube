# WO: Confirmation Screen Polish + Footer Logo Fix
## Coastal Mobile Lube & Tire — 2026-03-24

Read every file mentioned below IN FULL before making changes. Surgical edits only.

---

## CHANGE 1 — Confirmation screen: dynamic contact method + formatted phone

**File:** `src/app/book/BookingForm.tsx`

Find the confirmation/success screen (shows after successful form submission — "You're all set!" section).

Currently it says something like: "Our team will call you at 9492926686 within 2 hours to confirm your appointment."

Fix three things:

### 1a — Format the phone number
Display the phone as (XXX) XXX-XXXX format, not raw digits. Use this formatter:
```javascript
const formatPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  return phone;
};
```

### 1b — Dynamic contact method based on preference
Replace "call you" with the appropriate verb based on the contactPreference state:
- contactPreference === "call" → "We'll call you at (XXX) XXX-XXXX"
- contactPreference === "text" → "We'll text you at (XXX) XXX-XXXX"  
- contactPreference === "email" → "We'll email you at {email address}"

### 1c — Change "call" to "contact" in generic references
If there's any other text that says "Our team will call you" or similar, change "call" to "contact" unless the specific contact preference is known.

---

## CHANGE 2 — Footer logo sizing and placement

**File:** `src/components/Footer.tsx` (or wherever the footer is defined)

The footer currently shows Jason's oval badge logo from Cloudinary. Check if it's properly sized and centered in its container. The logo should be:
- Max width: 180px
- Properly centered or left-aligned in the footer column
- Not stretched or distorted (maintain aspect ratio with object-contain)
- Has some margin/padding below it before the tagline text

If the logo image tag is missing width/height constraints or proper sizing classes, add them.

---

## BUILD AND DEPLOY

```
npm run build && netlify deploy --prod && git add -A && git commit -m "polish: confirmation screen contact pref + phone formatting, footer logo sizing" && git push origin main
```
