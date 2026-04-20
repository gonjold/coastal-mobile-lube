# WO-23: Twilio SMS (Replaces Dead Carrier Email Gateway)

**Goal:** AT&T shut down their email-to-SMS gateway in 2023. The `9492926686@txt.att.net` bounces with a DNS "no MX records" error. Replace all email-to-carrier SMS with Twilio API calls. Keep the email alert pipeline untouched.

**Prerequisite:** Twilio account setup (see "Before Running" below). This WO cannot run without Twilio credentials.

**Expected execution time:** 20-30 minutes.
**Monthly cost:** ~$1.15 for phone number + ~$0.008 per text. At 100 bookings/mo with 3 notifications each = ~$3.50 total.

---

## Before Running: Twilio Account Setup

**Jon does this, not CC. Takes ~5 minutes.**

1. Go to https://www.twilio.com/try-twilio
2. Sign up with `jgsystems@icloud.com` (or your business email — this is a Coastal business account, not a Kath account)
3. Verify your phone number (may be your cell, (949) 292-6686)
4. In the console, buy a phone number:
   - Twilio Console → Phone Numbers → Buy a Number
   - Select US, toggle SMS capability on
   - Pick any local area code for Tampa (813, 727) or Apollo Beach (941). Look for a number ending in a pattern that's memorable — optional.
   - ~$1.15/month
5. From the Twilio Console dashboard, copy these three values to your Bitwarden:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal — sensitive)
   - **Twilio Phone Number** (the number you just bought, format `+18135551234`)
6. Store in Bitwarden as a new item:
   - Name: `Coastal Twilio`
   - Username: Account SID
   - Password: Auth Token
   - Notes: Phone number, purchase date

Once those three values are in Bitwarden, you're ready to run the WO.

---

## Step 1: Install Twilio SDK in Firebase Functions

```bash
cd ~/coastal-mobile-lube/functions
npm install twilio
```

Verify it's added to `functions/package.json` dependencies.

## Step 2: Configure Twilio secrets in Firebase

Twilio credentials live in Firebase Functions secrets, not in code.

```bash
cd ~/coastal-mobile-lube

# Pipe the values in (Firebase CLI interactive prompts don't accept piped text nicely, use echo piped)
echo "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" | firebase functions:secrets:set TWILIO_ACCOUNT_SID --project coastal-mobile-lube
echo "your-auth-token-here" | firebase functions:secrets:set TWILIO_AUTH_TOKEN --project coastal-mobile-lube
echo "+18135551234" | firebase functions:secrets:set TWILIO_FROM_NUMBER --project coastal-mobile-lube
```

Note to Jon: paste the actual SID, token, and number from Bitwarden when running these commands.

Verify:
```bash
firebase functions:secrets:access TWILIO_ACCOUNT_SID --project coastal-mobile-lube
# Should print the SID (full value, this is expected in admin context)
```

## Step 3: Refactor notification code to use Twilio

Read `functions/index.js` in full. Find every place that currently sends to a carrier email gateway. Common patterns to search for:

```bash
cd ~/coastal-mobile-lube/functions
grep -n "txt.att.net\|vtext.com\|tmomail.net\|messaging.sprintpcs.com\|mms.att.net" index.js
```

Expect to find these in:
- `onNewBooking` — new booking SMS to Jon and eventually Jason
- `sendCancellationEmail` — cancellation SMS
- `qbWebhook` payment handler — payment received SMS

For each location, replace the carrier-email send with a Twilio send.

### Twilio send helper

Near the top of `functions/index.js`, import Twilio and create a helper function:

```javascript
const { defineSecret } = require('firebase-functions/params');
const TWILIO_ACCOUNT_SID = defineSecret('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = defineSecret('TWILIO_AUTH_TOKEN');
const TWILIO_FROM_NUMBER = defineSecret('TWILIO_FROM_NUMBER');

async function sendSms(toNumber, body) {
  const twilio = require('twilio');
  const client = twilio(TWILIO_ACCOUNT_SID.value(), TWILIO_AUTH_TOKEN.value());
  try {
    const message = await client.messages.create({
      body: body,
      from: TWILIO_FROM_NUMBER.value(),
      to: toNumber
    });
    console.log('Twilio SMS sent:', message.sid, 'to', toNumber);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('Twilio SMS failed:', error.message, 'to', toNumber);
    return { success: false, error: error.message };
  }
}
```

### Update each function's secret bindings

For each Cloud Function that sends SMS, register the secrets in the function's `runWith` or inline config. Example:

```javascript
exports.onNewBooking = onDocumentCreated({
  document: 'bookings/{bookingId}',
  secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER]
}, async (event) => {
  // ... existing email send ...

  // Replace the carrier email send with:
  const smsBody = `Coastal: New ${vehicle.year} ${vehicle.make} ${vehicle.model} booking from ${customer.firstName} ${customer.lastName}. ${needsConfirmation ? 'VEHICLE UNCONFIRMED - call customer. ' : ''}Phone: ${customer.phone}`;
  await sendSms('+19492926686', smsBody);  // Jon
  // Future: also send to Jason when ready
  // await sendSms('+14436758401', smsBody);
});
```

Apply the same pattern to `sendCancellationEmail` and `qbWebhook` payment handler.

### Phone number format

Twilio requires E.164 format: `+` followed by country code and number, no spaces or dashes.

- Jon: `+19492926686`
- Jason (when ready): `+14436758401`

## Step 4: Keep SMS body under 160 characters per message

Each `sendSms()` body field should be one SMS segment. Trim the messages:

- **New booking:** `Coastal: New {year} {make} {model} booking from {first} {last}. Phone: {phone}` — stays under 160
- **Cancellation:** `Coastal: Booking cancelled by {first} {last} for {date}. Was {service}.` — stays under 160
- **Payment received:** `Coastal: Payment received. ${amount} from {first} {last}. Invoice {invoiceNum}.` — stays under 160
- **Vehicle unconfirmed prefix:** add `VEHICLE UNCONFIRMED - ` to the front of new-booking SMS when `needsConfirmation === true`. May push it over 160 on long names, that's fine — Twilio auto-splits.

## Step 5: Remove the dead carrier email sends

After confirming Twilio sends are in place, remove the lines that built carrier gateway email addresses (`9492926686@txt.att.net` etc.) and the email send calls for those. The regular admin email to `info@coastalmobilelube.com` stays — that's working.

## Step 6: Deploy

```bash
cd ~/coastal-mobile-lube
firebase deploy --only functions --project coastal-mobile-lube
```

Watch for:
- Build success
- Deployment success on each function
- Any secrets access errors (usually means a secret wasn't bound to a function — add it to the `secrets` array)

## Step 7: Test with a real booking

1. Open https://coastal-mobile-lube.netlify.app/book on your phone
2. Complete a test booking with real contact info
3. **Start a 60-second timer**
4. Check phone for SMS

Expected: you get a real SMS from the Twilio number within 30 seconds. Ideal.

If no SMS:
- Firebase console → Functions → Logs → look for `onNewBooking` run
- Search logs for `Twilio SMS sent` (success) or `Twilio SMS failed` (error with message)
- Most common errors:
  - `21211` invalid "to" number — fix the phone format (needs E.164)
  - `21608` from number not SMS capable — buy a different Twilio number
  - `21610` message from Twilio blocked — your number opted out, check Twilio console

## Step 8: Commit

```bash
cd ~/coastal-mobile-lube
git add functions/
git commit -m "WO-23: Twilio SMS replaces dead AT&T email-to-SMS gateway

- Adds twilio npm dependency to functions
- Configures TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER secrets
- New sendSms() helper with error handling
- Replaces carrier email gateway in onNewBooking, sendCancellationEmail, qbWebhook
- Each SMS under 160 chars, VEHICLE UNCONFIRMED prefix when applicable
- Admin email alerts to info@coastalmobilelube.com untouched"
git push origin main
```

## Known limitations

- **A2P 10DLC registration:** US carriers started requiring business SMS to be registered for Application-to-Person messaging in 2023. For low volume (< 3,000 msgs/day), Twilio's default "sole proprietor" lane works without full registration. If you see `30034` error codes in logs, register a brand and campaign in Twilio Console → Messaging → Regulatory Compliance.
- **Toll-free verification:** If the Twilio number is toll-free (8XX), you'd need toll-free verification. Stick to local numbers (813, 727, 941) to avoid this.
- **Daily send limits:** Unregistered sole prop campaigns cap at ~200 texts/day, plenty for Coastal right now.

## Do NOT

- Do NOT commit API keys to git. Secrets are stored in Firebase, not in code.
- Do NOT add `TWILIO_AUTH_TOKEN` to any `.env` file committed to the repo. If an `.env` has secrets in it, run `git rm --cached .env` and add `.env` to `.gitignore`.
- Do NOT use Twilio to send marketing/promo SMS without opt-in. Each outbound in this WO is transactional (booking confirmations, payment receipts) which is allowed under standard TCPA rules since the customer initiated contact.
- Do NOT change the admin email logic. The `info@coastalmobilelube.com` send is the authoritative record and must continue working.
