# WO-COASTAL-12: Cloud Functions Security

## Summary
Add basic security to the sendConfirmationEmail and sendInvoiceEmail Cloud Functions to prevent abuse.

## Pre-read
- functions/index.js (read in full)

## Changes

### 1. Rate Limiting on sendConfirmationEmail
- This function is called from the public booking form so it CANNOT require authentication
- Instead, add basic abuse prevention:
  - Check that all required fields are present (return 400 if not)
  - Add a simple rate limit: store a counter in Firestore (collection: "rateLimits", doc: "emailsSent") that tracks emails sent per hour
  - If more than 20 emails have been sent in the last hour, return 429 "Too many requests"
  - This is NOT bulletproof security -- it is basic abuse prevention

### 2. Auth Check on sendInvoiceEmail
- This function should ONLY be callable from the admin dashboard
- Add a check for a Firebase Auth token in the Authorization header
- If no valid token, return 401 "Unauthorized"
- Pattern:
  ```
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = authHeader.split('Bearer ')[1];
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  ```
- Make sure the admin dashboard sends the auth token when calling this function

### 3. CORS Tightening
- If CORS is currently set to allow all origins (*), restrict it to:
  - https://coastal-mobile-lube.netlify.app
  - https://coastalmobilelube.com
  - http://localhost:3000 (for local dev)

## Rules
- Do NOT break existing functionality. The booking form must still send confirmation emails.
- Test that the build succeeds before deploying.

## Deploy (Functions deploy is different from hosting)
```bash
cd ~/coastal-mobile-lube/functions && npm install && cd .. && npx firebase-tools deploy --only functions --project coastal-mobile-lube
```

Then deploy hosting too in case admin code changed:
```bash
npm run build && npx netlify-cli deploy --prod --message="WO-12: Cloud Functions security"
```

Then run: git add -A && git commit -m "WO-12: Cloud Functions security" && git push origin main
