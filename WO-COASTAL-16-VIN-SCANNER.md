# WO-COASTAL-16: VIN / Hull # Scanner Field

## Goal
Add an optional VIN or Hull # input field to the quote form (homepage and /book page) with mobile camera OCR scanning via Tesseract.js.

## Rules
- Interactive CC only. One change at a time.
- Do NOT rewrite entire files. Surgical edits only.
- Do NOT touch globals.css or tailwind.config.
- Read target files in full before editing.
- Build + deploy after completion.

## Important
This is a bigger change (new dependency + camera access + OCR). Take it slow. If the form component is shared between homepage and /book, the change only needs to happen once.

## Steps

1. **Install Tesseract.js:**
   ```bash
   cd ~/coastal-mobile-lube && npm install tesseract.js
   ```

2. **Find the quote/booking form component:**
   ```
   grep -r "quote.*form\|booking.*form\|QuoteForm\|BookingForm" src/ --include="*.tsx" -l
   ```
   Read it in full. Identify where form fields are rendered and where form state is managed.

3. **Add the VIN/Hull input field.** Place it AFTER the vehicle info fields (year/make/model) but BEFORE the notes/message textarea:
   - Label: "VIN or Hull # (optional)"
   - Text input with placeholder "Enter VIN or Hull # (optional)"
   - Same styling as other form inputs
   - Add a small camera icon button (`📷` or an SVG icon) to the right of the input, inside the input wrapper
   - Field name in form state: `vinOrHull`
   - Include this field value in the form submission (email/Firestore write) but mark it optional

4. **Camera/OCR button behavior (mobile only):**
   - On click, use `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })` to open rear camera
   - Show a small camera preview overlay (modal or inline expansion) with a "Capture" button
   - On capture, grab a frame from the video stream as a canvas image
   - Run Tesseract.js `recognize()` on the captured image
   - Extract the recognized text, clean it (strip whitespace, uppercase), and populate the VIN/Hull input
   - Close the camera preview
   - If camera access is denied or fails, show a brief toast/message: "Camera not available. Please type the VIN or Hull # manually."

5. **Desktop behavior:**
   - Hide the camera icon button on desktop (`hidden lg:hidden` or check `navigator.mediaDevices` support)
   - Or show it grayed out with a tooltip "Camera scanning available on mobile"
   - Text input always works for manual entry on all devices

6. **Keep it friction-free:**
   - The field must be clearly optional (the "(optional)" label is enough)
   - Do NOT make it required in form validation
   - Do NOT block form submission if this field is empty
   - The camera flow should be easy to dismiss (X button on the preview overlay)

7. **Build and deploy:**
   ```bash
   cd ~/coastal-mobile-lube && npm run build && npx netlify-cli deploy --prod --message="WO-16: VIN/Hull scanner field"
   ```

8. **Verify:**
   - Desktop: field visible, camera icon hidden or grayed out, form submits with and without VIN
   - Mobile: camera icon visible, tapping opens camera, OCR reads text from a VIN sticker photo (test with any printed text), populates field
   - Form submission includes VIN value when provided
