# WO: New Lead Styling + Email Notifications via Firebase Cloud Functions
## Coastal Mobile Lube & Tire — 2026-03-24

This WO has THREE parts:
- Part A: New lead visual treatment in admin dashboard
- Part B: Firebase Cloud Function for email notifications
- Part C: Wire admin "Send Confirmation Email" button to the real Cloud Function

Read all target files IN FULL before making changes. Surgical edits only on existing files.

---

## PART A — New Lead Styling in Admin Dashboard

**File:** `src/app/admin/page.tsx`

### A1 — "NEW" badge on recent pending bookings
In the booking list (both list view and calendar view), add a "NEW" indicator for bookings that are:
- status === "pending" AND
- createdAt is within the last 2 hours (compare against Date.now())

Visual treatment in list view:
- Orange left border (4px solid #E07B2D) on the table row
- Small "NEW" badge (orange bg, white text, rounded-full, text-xs, px-2 py-0.5) next to the customer name
- Slightly bolder row background: bg-orange-50 or bg-[#FFF8F0]

Visual treatment in calendar view day panel:
- Same orange left border on the booking card
- "NEW" badge next to service name

### A2 — Sort pending bookings to top
In the list view, sort bookings with this priority:
1. NEW pending bookings (< 2 hours old, pending) — at the very top
2. Other pending bookings — next
3. Confirmed bookings — next
4. Completed bookings — last

Within each group, sort by createdAt descending (newest first).

### A3 — "Seen" tracking
When an admin expands a booking detail (clicks the row), update the Firestore doc:
- `lastViewedAt`: serverTimestamp()

Once `lastViewedAt` is set and is more recent than `createdAt`, the "NEW" badge can optionally fade to a subtler "Pending" badge (standard orange, no highlight row). This is nice-to-have — implement if straightforward, skip if complex.

---

## PART B — Firebase Cloud Function for Email Notifications

### B1 — Initialize Firebase Functions in the project

Run these commands in the project root (~/coastal-mobile-lube):

```bash
cd ~/coastal-mobile-lube
firebase init functions
```

When prompted:
- Language: JavaScript
- ESLint: No
- Install dependencies: Yes

This creates a `functions/` directory with `index.js` and `package.json`.

### B2 — Install Nodemailer

```bash
cd functions
npm install nodemailer
cd ..
```

### B3 — Set Gmail credentials as Firebase secrets

Use the SAME Gmail app password that ServiceFlow uses. The sender email is jonrgold@gmail.com.

```bash
firebase functions:secrets:set GMAIL_USER --project=coastal-mobile-lube
# Enter: jonrgold@gmail.com

firebase functions:secrets:set GMAIL_APP_PASSWORD --project=coastal-mobile-lube
# Enter: [the same app password from ServiceFlow — Jon knows this]
```

### B4 — Write the Cloud Function

**File:** `functions/index.js`

```javascript
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const nodemailer = require("nodemailer");

const gmailUser = defineSecret("GMAIL_USER");
const gmailAppPassword = defineSecret("GMAIL_APP_PASSWORD");

// Email sent to ADMIN when a new booking comes in
exports.onNewBooking = onDocumentCreated(
  {
    document: "bookings/{bookingId}",
    region: "us-east1",
    secrets: [gmailUser, gmailAppPassword],
  },
  async (event) => {
    const booking = event.data.data();
    const bookingId = event.params.bookingId;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser.value(),
        pass: gmailAppPassword.value(),
      },
    });

    // Determine source label
    const sourceLabels = {
      "homepage-widget": "Homepage Widget",
      "website": "Booking Page",
      "fleet-page": "Fleet Page",
      "marine-page": "Marine Page",
    };
    const sourceLabel = sourceLabels[booking.source] || booking.source || "Unknown";

    // Determine service category label
    const categoryLabels = {
      "automotive": "Automotive",
      "fleet": "Fleet",
      "marine": "Marine",
    };
    const categoryLabel = categoryLabels[booking.serviceCategory] || booking.serviceCategory || "Automotive";

    // Format phone
    const phone = booking.phone || "No phone";
    const formattedPhone = phone.length === 10
      ? `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
      : phone;

    // Admin notification email
    const adminHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0B2040; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">New Booking — ${categoryLabel}</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e8e8e8; border-top: none; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 140px;">Customer</td>
              <td style="padding: 8px 0; font-weight: 600;">${booking.name || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Phone</td>
              <td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #1A5FAC;">${formattedPhone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Email</td>
              <td style="padding: 8px 0;">${booking.email || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Contact Pref</td>
              <td style="padding: 8px 0;">${booking.contactPreference || "Not specified"}</td>
            </tr>
            <tr style="border-top: 1px solid #eee;">
              <td style="padding: 8px 0; color: #666;">Service</td>
              <td style="padding: 8px 0; font-weight: 600;">${booking.service || "General inquiry"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Category</td>
              <td style="padding: 8px 0;">${categoryLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Source</td>
              <td style="padding: 8px 0;">${sourceLabel}</td>
            </tr>
            ${booking.preferredDate ? `
            <tr style="border-top: 1px solid #eee;">
              <td style="padding: 8px 0; color: #666;">Preferred Date</td>
              <td style="padding: 8px 0; font-weight: 600;">${booking.preferredDate}${booking.datesFlexible ? ' (flexible)' : ''}</td>
            </tr>` : ''}
            ${booking.timeWindow ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Time Window</td>
              <td style="padding: 8px 0;">${booking.timeWindow}</td>
            </tr>` : ''}
            ${booking.address ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Address</td>
              <td style="padding: 8px 0;">${booking.address}</td>
            </tr>` : ''}
            ${booking.zip ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Zip Code</td>
              <td style="padding: 8px 0;">${booking.zip}</td>
            </tr>` : ''}
            ${booking.fleetSize ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Fleet Size</td>
              <td style="padding: 8px 0;">${booking.fleetSize}</td>
            </tr>` : ''}
            ${booking.engineType ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Engine Type</td>
              <td style="padding: 8px 0;">${booking.engineType} (${booking.engineCount || 'single'})</td>
            </tr>` : ''}
            ${booking.notes ? `
            <tr style="border-top: 1px solid #eee;">
              <td style="padding: 8px 0; color: #666;">Notes</td>
              <td style="padding: 8px 0;">${booking.notes}</td>
            </tr>` : ''}
          </table>
          <div style="margin-top: 20px; text-align: center;">
            <a href="https://coastal-mobile-lube.netlify.app/admin" 
               style="display: inline-block; background: #E07B2D; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View in Admin Dashboard
            </a>
          </div>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">
          Coastal Mobile Lube & Tire — Automated Notification
        </p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Coastal Mobile Lube" <${gmailUser.value()}>`,
        to: "jonrgold@gmail.com",
        subject: `New ${categoryLabel} Booking — ${booking.name || formattedPhone}`,
        html: adminHtml,
      });
      console.log(`Admin notification sent for booking ${bookingId}`);
    } catch (error) {
      console.error(`Failed to send admin notification for ${bookingId}:`, error);
    }
  }
);

// Email sent to CUSTOMER when admin confirms a booking
exports.sendConfirmationEmail = require("firebase-functions/v2/https").onCall(
  {
    region: "us-east1",
    secrets: [gmailUser, gmailAppPassword],
  },
  async (request) => {
    const { booking, bookingId } = request.data;

    if (!booking.email) {
      return { success: false, error: "No email address on file" };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser.value(),
        pass: gmailAppPassword.value(),
      },
    });

    const phone = booking.phone || "";
    const formattedPhone = phone.length === 10
      ? `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
      : phone;

    const customerHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0B2040; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Your Service is Confirmed</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e8e8e8; border-top: none;">
          <p style="font-size: 16px; color: #333; margin-top: 0;">
            Hi ${booking.name || 'there'},
          </p>
          <p style="color: #666; line-height: 1.6;">
            Your mobile service appointment has been confirmed. Here are your details:
          </p>
          <div style="background: #FAFBFC; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #666;">Service</td>
                <td style="padding: 6px 0; font-weight: 600;">${booking.service || "TBD"}</td>
              </tr>
              ${booking.preferredDate ? `
              <tr>
                <td style="padding: 6px 0; color: #666;">Date</td>
                <td style="padding: 6px 0; font-weight: 600;">${booking.preferredDate}</td>
              </tr>` : ''}
              ${booking.timeWindow ? `
              <tr>
                <td style="padding: 6px 0; color: #666;">Time</td>
                <td style="padding: 6px 0;">${booking.timeWindow}</td>
              </tr>` : ''}
              ${booking.address ? `
              <tr>
                <td style="padding: 6px 0; color: #666;">Location</td>
                <td style="padding: 6px 0;">${booking.address}</td>
              </tr>` : ''}
            </table>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Our technician will arrive at your location at the scheduled time with everything needed to complete your service. Most services take under an hour.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Need to reschedule or have questions? Call or text us:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="tel:8137225823" style="display: inline-block; background: #E07B2D; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Call 813-722-LUBE
            </a>
          </div>
        </div>
        <div style="background: #0B2040; padding: 16px 24px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="color: #ccc; font-size: 12px; margin: 0;">
            Coastal Mobile Lube & Tire — Tampa, FL<br>
            Mobile oil changes, tire service, and marine engine maintenance
          </p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Coastal Mobile Lube" <${gmailUser.value()}>`,
        to: booking.email,
        subject: `Service Confirmed — Coastal Mobile Lube & Tire`,
        html: customerHtml,
      });
      console.log(`Confirmation email sent to ${booking.email} for booking ${bookingId}`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to send confirmation to ${booking.email}:`, error);
      return { success: false, error: error.message };
    }
  }
);
```

### B5 — Deploy the Cloud Functions

```bash
cd ~/coastal-mobile-lube
firebase deploy --only functions --project=coastal-mobile-lube
```

---

## PART C — Wire Admin Dashboard to Call the Cloud Function

**File:** `src/app/admin/NotificationButtons.tsx`

### C1 — Import Firebase Functions
Add to the top of the file:
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
```

### C2 — Update "Send Confirmation Email" button
Replace the current mock behavior (which just logs a comms entry) with a real Cloud Function call:

```javascript
const functions = getFunctions(app, 'us-east1');
const sendConfirmationEmail = httpsCallable(functions, 'sendConfirmationEmail');

// In the button handler:
try {
  const result = await sendConfirmationEmail({ booking, bookingId: booking.id });
  if (result.data.success) {
    // Log comms entry (keep existing behavior)
    // Show toast: "Confirmation email sent to {email}"
  } else {
    // Show toast: "Failed to send email: {error}"
  }
} catch (error) {
  // Show toast: "Error sending email"
}
```

### C3 — Keep "Send Confirmation Text" as mock
Leave the text button as a comms logger only for now. Add a small "(Coming soon)" subtitle text under the button text so Jason knows it's on the roadmap.

---

## DEPLOY SEQUENCE

This WO requires TWO deploys:

**Deploy 1 — Cloud Functions:**
```bash
cd ~/coastal-mobile-lube
firebase deploy --only functions --project=coastal-mobile-lube
```

**Deploy 2 — Frontend (admin dashboard updates):**
```bash
npm run build && netlify deploy --prod && git add -A && git commit -m "feat: new lead styling, email notifications via Cloud Functions, admin alerts" && git push origin main
```

Run Deploy 1 first, then Deploy 2.
