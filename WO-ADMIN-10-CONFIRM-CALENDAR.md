# WO-ADMIN-10: Confirm Booking with Calendar Invites

## Context
This WO upgrades the booking confirmation flow. When the admin confirms a booking, the customer receives a branded email with a .ics calendar attachment that auto-adds the appointment to their phone/desktop calendar. This is the same pattern used in HireFlow (sendInterviewInvite Cloud Function) adapted for Coastal branding and workflow.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4 / Firebase Cloud Functions
**Deploy:** Netlify (frontend) + Firebase (functions)
**Firebase project:** coastal-mobile-lube (us-east1)
**Email sender:** info@coastalmobilelube.com (Google Workspace, app password in Firebase secrets)

## IMPORTANT RULES
- Read EVERY file mentioned in full BEFORE making any changes
- Surgical edits only. Do NOT rewrite entire files
- Do NOT touch globals.css, tailwind.config, or AdminSidebar.tsx
- Build, commit, push, deploy BOTH frontend (Netlify) and functions (Firebase) at the end
- Do NOT skip any steps

---

## STEP 0: Read all target files first

Read these files IN FULL before touching anything:

```
src/components/admin/ScheduleDetailPanel.tsx
src/app/admin/schedule/page.tsx
functions/src/index.ts (or functions/index.js -- check which exists)
functions/package.json
```

Note:
- How the current "Confirm" button works in ScheduleDetailPanel
- What fields exist on the booking object (confirmedDate, confirmedArrivalWindow, estimatedDuration, etc.)
- What the existing sendConfirmationEmail Cloud Function does and how it sends email
- What email transport is used (nodemailer + Gmail app password, or something else)
- What Firebase secrets are set (GMAIL_USER, GMAIL_APP_PASSWORD or similar)

---

## STEP 1: Upgrade the Confirm Flow in ScheduleDetailPanel.tsx

**File:** `src/components/admin/ScheduleDetailPanel.tsx`

The current Confirm button either directly confirms or expands an inline appointment setter. Replace this with a clean confirm mini-section that appears inside the modal when "Confirm" is clicked.

**Find the Confirm button and its handler.** Replace the confirm flow with this pattern:

1. Add state for the confirm form:
```typescript
const [showConfirmForm, setShowConfirmForm] = useState(false);
const [confirmDate, setConfirmDate] = useState('');
const [confirmTime, setConfirmTime] = useState('');
const [confirmDuration, setConfirmDuration] = useState('60');
const [confirmSending, setConfirmSending] = useState(false);
```

2. When "Confirm" is clicked and status is "pending": `setShowConfirmForm(true)` instead of immediately confirming.

3. Pre-fill the date from the booking's preferred date if it exists:
```typescript
useEffect(() => {
  if (showConfirmForm && booking) {
    const preferred = booking.preferredDate || booking.date || '';
    if (preferred) setConfirmDate(preferred);
    const preferredTime = booking.confirmedArrivalWindow || booking.timeWindow || booking.time || '';
    if (preferredTime) setConfirmTime(preferredTime);
  }
}, [showConfirmForm, booking]);
```

4. Render the confirm form when `showConfirmForm` is true. Place this ABOVE the existing action buttons area, inside a bordered section:

```tsx
{showConfirmForm && (
  <div className="mx-6 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
    <p className="text-sm font-semibold text-[#0B2040] mb-3">Confirm Appointment</p>

    <div className="grid grid-cols-2 gap-3 mb-3">
      {/* Date */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
        <input
          type="date"
          value={confirmDate}
          onChange={(e) => setConfirmDate(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Time */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Arrival Window</label>
        <select
          value={confirmTime}
          onChange={(e) => setConfirmTime(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select time</option>
          <option value="7:00 AM - 8:00 AM">7:00 AM - 8:00 AM</option>
          <option value="8:00 AM - 9:00 AM">8:00 AM - 9:00 AM</option>
          <option value="9:00 AM - 10:00 AM">9:00 AM - 10:00 AM</option>
          <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
          <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
          <option value="12:00 PM - 1:00 PM">12:00 PM - 1:00 PM</option>
          <option value="1:00 PM - 2:00 PM">1:00 PM - 2:00 PM</option>
          <option value="2:00 PM - 3:00 PM">2:00 PM - 3:00 PM</option>
          <option value="3:00 PM - 4:00 PM">3:00 PM - 4:00 PM</option>
          <option value="4:00 PM - 5:00 PM">4:00 PM - 5:00 PM</option>
        </select>
      </div>
    </div>

    {/* Duration */}
    <div className="mb-3">
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estimated Duration</label>
      <select
        value={confirmDuration}
        onChange={(e) => setConfirmDuration(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
      >
        <option value="30">30 minutes</option>
        <option value="60">1 hour</option>
        <option value="90">1.5 hours</option>
        <option value="120">2 hours</option>
        <option value="180">3 hours</option>
        <option value="240">4+ hours</option>
      </select>
    </div>

    {/* Action buttons */}
    <div className="flex gap-2">
      <button
        onClick={handleConfirmBooking}
        disabled={!confirmDate || !confirmTime || confirmSending}
        className="flex-1 py-2 bg-[#1A5FAC] text-white rounded-lg text-sm font-semibold hover:bg-[#164d8f] disabled:opacity-50"
      >
        {confirmSending ? 'Sending...' : 'Confirm & Send Invite'}
      </button>
      <button
        onClick={() => setShowConfirmForm(false)}
        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  </div>
)}
```

5. Write the handleConfirmBooking function:

```typescript
const handleConfirmBooking = async () => {
  if (!booking?.id || !confirmDate || !confirmTime) return;
  setConfirmSending(true);

  try {
    // 1. Update booking in Firestore
    await updateDoc(doc(db, 'bookings', booking.id), {
      status: 'confirmed',
      confirmedDate: confirmDate,
      confirmedArrivalWindow: confirmTime,
      estimatedDuration: confirmDuration,
      confirmedAt: new Date().toISOString(),
    });

    // 2. Get customer email
    const customerEmail = booking.email || booking.customerEmail || '';
    const customerName = booking.customer || booking.name || '';
    const customerPhone = booking.phone || '';

    // 3. Call Cloud Function to send confirmation email with .ics
    if (customerEmail) {
      try {
        const response = await fetch(
          'https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendBookingConfirmation',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName,
              customerEmail,
              customerPhone,
              services: booking.services || [booking.service] || [],
              vehicle: booking.vehicle || '',
              address: booking.address || '',
              confirmedDate: confirmDate,
              confirmedTime: confirmTime,
              estimatedDuration: confirmDuration,
              division: booking.division || 'automotive',
              notes: booking.notes || '',
              bookingId: booking.id,
            }),
          }
        );
        if (!response.ok) {
          console.error('Confirmation email failed:', await response.text());
        }
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr);
        // Don't block the confirm -- booking is already updated
      }
    }

    // 4. Close confirm form
    setShowConfirmForm(false);
    setConfirmSending(false);

  } catch (err) {
    console.error('Failed to confirm booking:', err);
    setConfirmSending(false);
  }
};
```

6. **Hide the old "Confirm" button when the confirm form is showing.** The "Confirm" button in the action bar should not be visible when `showConfirmForm` is true. Conditionally hide it:
```tsx
{!showConfirmForm && booking.status === 'pending' && (
  <button onClick={() => setShowConfirmForm(true)} className="...">Confirm</button>
)}
```

---

## STEP 2: Create the sendBookingConfirmation Cloud Function

**Directory:** `functions/`

Check if the functions directory uses TypeScript (`functions/src/index.ts`) or JavaScript (`functions/index.js`). Follow the same pattern.

**Add this new Cloud Function** in the functions entry file (alongside the existing onNewBooking and sendConfirmationEmail):

The function should:
1. Accept a POST request with booking details
2. Generate a .ics calendar file string
3. Send a branded HTML email with the .ics attached
4. CC the business email (info@coastalmobilelube.com)

**If the functions use JavaScript (functions/index.js):**

```javascript
const cors = require('cors')({ origin: true });

exports.sendBookingConfirmation = functions.region('us-east1').https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      services,
      vehicle,
      address,
      confirmedDate,
      confirmedTime,
      estimatedDuration,
      division,
      notes,
      bookingId,
    } = req.body;

    if (!customerEmail || !confirmedDate || !confirmedTime) {
      res.status(400).send('Missing required fields');
      return;
    }

    // Parse the arrival window to get start time
    // confirmedTime is like "9:00 AM - 10:00 AM"
    const startTimeStr = confirmedTime.split(' - ')[0].trim();
    const durationMin = parseInt(estimatedDuration) || 60;

    // Build Date objects for .ics
    const dateObj = new Date(confirmedDate + 'T00:00:00');
    const [timeStr, ampm] = startTimeStr.split(/(AM|PM)/i);
    const timeParts = timeStr.trim().split(':');
    let hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1] || '0');
    if (ampm && ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;

    const startDate = new Date(dateObj);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

    // Format dates for .ics (YYYYMMDDTHHMMSS)
    const formatICS = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    };

    const serviceList = Array.isArray(services) ? services.join(', ') : services || 'Service appointment';
    const formattedDate = new Date(confirmedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generate .ics file
    const uid = `coastal-${bookingId || Date.now()}@coastalmobilelube.com`;
    const now = formatICS(new Date());
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Coastal Mobile Lube & Tire//Booking//EN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatICS(startDate)}`,
      `DTEND:${formatICS(endDate)}`,
      `SUMMARY:Coastal Mobile Lube - ${serviceList}`,
      `DESCRIPTION:Service: ${serviceList}\\nVehicle: ${vehicle || 'Not specified'}\\nAddress: ${address || 'Not specified'}\\nPhone: ${customerPhone || ''}\\nNotes: ${notes || 'None'}`,
      `LOCATION:${address || 'Customer location (mobile service)'}`,
      `ORGANIZER;CN=Coastal Mobile Lube:mailto:info@coastalmobilelube.com`,
      `ATTENDEE;CN=${customerName}:mailto:${customerEmail}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Coastal Mobile Lube appointment in 1 hour',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    // Build HTML email
    const htmlEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <tr>
      <td style="background:#0B2040;padding:28px 32px;text-align:center;">
        <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:700;">Coastal Mobile Lube & Tire</h1>
        <p style="color:#6BA3E0;font-size:13px;margin:6px 0 0 0;letter-spacing:1px;">APPOINTMENT CONFIRMED</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:32px;">
        <p style="font-size:16px;color:#1a1a1a;margin:0 0 20px 0;">
          Hi ${customerName},
        </p>
        <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 24px 0;">
          Your appointment has been confirmed. We will arrive at your location during the scheduled window below.
        </p>

        <!-- Appointment Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;border-radius:12px;margin:0 0 24px 0;">
          <tr>
            <td style="padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 12px 0;border-bottom:1px solid #e4e4e4;">
                    <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;">Date</p>
                    <p style="font-size:16px;color:#0B2040;font-weight:700;margin:0;">${formattedDate}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e4;">
                    <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;">Arrival Window</p>
                    <p style="font-size:16px;color:#0B2040;font-weight:700;margin:0;">${confirmedTime}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e4;">
                    <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;">Service</p>
                    <p style="font-size:15px;color:#333;font-weight:600;margin:0;">${serviceList}</p>
                  </td>
                </tr>
                ${vehicle ? `
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e4;">
                    <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;">Vehicle</p>
                    <p style="font-size:15px;color:#333;margin:0;">${vehicle}</p>
                  </td>
                </tr>` : ''}
                ${address ? `
                <tr>
                  <td style="padding:12px 0;">
                    <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;">Location</p>
                    <p style="font-size:15px;color:#333;margin:0;">${address}</p>
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>
        </table>

        <!-- Add to Calendar CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
          <tr>
            <td style="text-align:center;">
              <p style="font-size:13px;color:#666;margin:0 0 8px 0;">A calendar invite is attached to this email.</p>
              <p style="font-size:13px;color:#888;margin:0;">Open the attachment to add this appointment to your calendar.</p>
            </td>
          </tr>
        </table>

        <!-- What to Expect -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
          <tr>
            <td style="padding:20px;background:#EBF4FF;border-radius:10px;">
              <p style="font-size:14px;font-weight:700;color:#0B2040;margin:0 0 8px 0;">What to expect</p>
              <p style="font-size:14px;color:#333;line-height:1.6;margin:0;">
                Our technician will arrive at your location during the scheduled window. Please make sure the vehicle is accessible and parked on a flat surface. We bring all tools and supplies needed to complete the service.
              </p>
            </td>
          </tr>
        </table>

        <!-- Contact -->
        <p style="font-size:14px;color:#666;line-height:1.6;margin:0;">
          Need to reschedule or have questions? Call us at
          <a href="tel:+18132775500" style="color:#1A5FAC;font-weight:600;text-decoration:none;">(813) 277-5500</a>
          or reply to this email.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#0B2040;padding:24px 32px;text-align:center;">
        <p style="color:#6BA3E0;font-size:13px;margin:0;">Coastal Mobile Lube & Tire</p>
        <p style="color:#ffffff60;font-size:12px;margin:6px 0 0 0;">Apollo Beach, FL | Mon-Fri 8AM-5PM</p>
        <p style="color:#ffffff40;font-size:11px;margin:8px 0 0 0;">We come to you.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send email with .ics attachment
    const nodemailer = require('nodemailer');

    // Get secrets -- check how existing functions access them
    // It may be functions.config().gmail or process.env or defineSecret
    // Match whatever pattern the existing sendConfirmationEmail uses
    const gmailUser = process.env.GMAIL_USER || functions.config()?.gmail?.user;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || functions.config()?.gmail?.password;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    const mailOptions = {
      from: `"Coastal Mobile Lube & Tire" <${gmailUser}>`,
      to: customerEmail,
      cc: 'info@coastalmobilelube.com',
      subject: `Appointment Confirmed - ${formattedDate}, ${confirmedTime}`,
      html: htmlEmail,
      icalEvent: {
        method: 'REQUEST',
        filename: 'appointment.ics',
        content: icsContent,
      },
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  });
});
```

**If the functions use TypeScript**, convert the above to TypeScript syntax (add types, use `import` instead of `require`, etc.) and match the patterns in the existing code.

**IMPORTANT:** Check how the existing sendConfirmationEmail function accesses Gmail credentials. Use the EXACT same pattern for this new function. It might be:
- `functions.config().gmail.user` (Firebase config)
- `process.env.GMAIL_USER` (environment variable)
- `defineSecret('GMAIL_USER')` (Firebase secrets v2)
- Something else entirely

Read the existing function code and replicate the auth pattern exactly.

---

## STEP 3: Install nodemailer if not already installed

Check `functions/package.json` for nodemailer. If it's already there, skip this step.

If it's NOT there:
```bash
cd ~/coastal-mobile-lube/functions
npm install nodemailer
```

If using TypeScript, also install types:
```bash
npm install --save-dev @types/nodemailer
```

---

## STEP 4: Update CORS for the new function

Check if the `cors` package is already in functions/package.json. If not:
```bash
cd ~/coastal-mobile-lube/functions
npm install cors
```

---

## STEP 5: Build and Deploy

**Deploy Cloud Functions first:**
```bash
cd ~/coastal-mobile-lube/functions
npm install
cd ~/coastal-mobile-lube
firebase deploy --only functions --project coastal-mobile-lube
```

Verify the function deployed by checking the output for `sendBookingConfirmation`.

**Then build and deploy frontend:**
```bash
cd ~/coastal-mobile-lube
npm run build
git add src/ functions/
git commit -m "WO-10: Confirm booking with .ics calendar invite email"
git push origin main
npx netlify-cli deploy --prod --message="WO-10: Booking confirmation with calendar invites"
```

---

## STEP 6: Verify

Test the full flow:
1. Go to /admin/schedule
2. Find a pending booking with an email address
3. Click the row to open the modal
4. Click "Confirm"
5. The confirm form should appear with date/time/duration fields
6. Set a date, time, and duration
7. Click "Confirm & Send Invite"
8. Booking status should change to "confirmed" in Firestore
9. Check the customer's email for:
   - Branded HTML email with appointment details
   - .ics calendar attachment
   - Correct date, time, service, and location

If the email fails but the Firestore update succeeds, the booking is still confirmed. The email failure is logged to console but does not block the confirmation.

---

*End of WO-ADMIN-10*
