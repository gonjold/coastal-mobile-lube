const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const crypto = require("crypto");

const { buildFdacsHtml } = require("./lib/fdacs-template");
const { buildDisclosures } = require("./lib/disclosures");
const { generatePdfFromHtml } = require("./lib/pdf");
const { renderFdacsEmailHtml } = require("./lib/fdacs-email-template");
const { mirrorInvoiceToDrive: mirrorInvoiceToDriveHelper } = require("./lib/drive-mirror");

admin.initializeApp();
const firestoreDb = admin.firestore();

const gmailUser = defineSecret("GMAIL_USER");
const gmailAppPassword = defineSecret("GMAIL_APP_PASSWORD");
const qbClientId = defineSecret("QB_CLIENT_ID");
const qbClientSecret = defineSecret("QB_CLIENT_SECRET");
const qbWebhookVerifierToken = defineSecret("QB_WEBHOOK_VERIFIER_TOKEN");

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
            ${(booking.vehicleYear || booking.vehicleMake || booking.vehicleModel) ? `
            <tr style="border-top: 1px solid #eee;">
              <td style="padding: 8px 0; color: #666;">Vehicle</td>
              <td style="padding: 8px 0; font-weight: 600;">${[booking.vehicleYear, booking.vehicleMake, booking.vehicleModel].filter(Boolean).join(' ')}${booking.fuelType ? ' (' + booking.fuelType + ')' : ''}</td>
            </tr>` : ''}
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
          ${booking.needsConfirmation ? `
          <p style="color: #92400E; font-size: 12px; text-align: center; margin-top: 12px;">
            Heads up: some details to confirm on the call.
          </p>` : ''}
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">
          Coastal Mobile Lube & Tire — Automated Notification
        </p>
      </div>
    `;

    try {
      // TODO: Customer SMS notifications removed 2026-05-06 - email-to-SMS gateways are dead.
      // Replacing with proper Twilio integration in T2 work order.
      await transporter.sendMail({
        from: `"Coastal Mobile Lube" <${gmailUser.value()}>`,
        to: "jon@jgoldco.com",
        subject: `New ${categoryLabel} Booking — ${booking.name || formattedPhone}`,
        text: `New booking: ${booking.name || "Unknown"} - ${booking.service || "General"}. ${formattedPhone}. Check admin.${booking.needsConfirmation ? ' Heads up: some details to confirm on the call.' : ''}`,
        html: adminHtml,
      });
      console.log(`Admin notification sent for booking ${bookingId}`);
    } catch (error) {
      console.error(`Failed to send admin notification for ${bookingId}:`, error);
    }
  }
);

// ─── Helpers for confirmation emails ────────────────────────────

function formatDateNice(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${d}, ${y}`;
}

function parseArrivalWindow(window) {
  if (!window) return null;
  const match = window.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let [, sh, sm, eh, em, period] = match;
  sh = parseInt(sh); sm = parseInt(sm); eh = parseInt(eh); em = parseInt(em);
  const isPM = period.toUpperCase() === "PM";
  if (isPM && sh < 12) sh += 12;
  if (isPM && eh < 12) eh += 12;
  if (!isPM && sh === 12) sh = 0;
  if (!isPM && eh === 12) eh = 0;
  return { startHour: sh, startMin: sm, endHour: eh, endMin: em };
}

function buildGoogleCalendarUrl(booking) {
  const date = booking.confirmedDate || booking.preferredDate;
  if (!date) return null;
  const title = `Coastal Mobile - ${booking.service || "Service Appointment"}`;
  const location = booking.address || (booking.zip ? `${booking.zip}, Apollo Beach, FL` : "Apollo Beach, FL");
  const description = `Service: ${booking.service || "TBD"}\n\nNeed to reschedule? Call 813-722-LUBE`;
  const parsed = parseArrivalWindow(booking.confirmedArrivalWindow);
  const dateClean = date.replace(/-/g, "");
  let startDT, endDT;
  if (parsed) {
    const pad = (n) => String(n).padStart(2, "0");
    startDT = `${dateClean}T${pad(parsed.startHour)}${pad(parsed.startMin)}00`;
    endDT = `${dateClean}T${pad(parsed.endHour)}${pad(parsed.endMin)}00`;
  } else {
    startDT = dateClean;
    endDT = dateClean;
  }
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startDT}/${endDT}`,
    location,
    details: description,
  });
  return `https://calendar.google.com/calendar/event?${params.toString()}`;
}

// Email sent to CUSTOMER when admin confirms a booking
const { onRequest } = require("firebase-functions/v2/https");

const allowedOrigins = [
  // Marketing origins (original).
  "https://coastal-mobile-lube.netlify.app",
  "https://coastalmobilelube.com",
  // Ops origins (A3d STEP 7 follow-up). The ops Send-invoice flow on
  // /invoices/[id] POSTs to these Cloud Functions from the browser; without
  // these entries the preflight rejects with "Failed to fetch". Preview
  // deploy URLs follow the pattern {hash}--coastal-ops.netlify.app so a
  // regex is needed alongside the production app + default Netlify origin.
  "https://app.coastalmobilelube.com",
  "https://coastal-ops.netlify.app",
  /^https:\/\/[a-z0-9]+--coastal-ops\.netlify\.app$/,
  "http://localhost:3000",
];

exports.sendConfirmationEmail = onRequest(
  {
    region: "us-east1",
    secrets: [gmailUser, gmailAppPassword],
    cors: allowedOrigins,
  },
  async (req, res) => {
    const { booking, bookingId } = req.body;

    // Required fields check
    if (!booking || !bookingId || !booking.email || !booking.name) {
      res.status(400).json({ success: false, error: "Missing required fields" });
      return;
    }

    // Rate limiting: max 20 emails per hour
    try {
      const rateLimitRef = firestoreDb.collection("rateLimits").doc("emailsSent");
      const rateLimitDoc = await rateLimitRef.get();
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      if (rateLimitDoc.exists) {
        const data = rateLimitDoc.data();
        const timestamps = (data.timestamps || []).filter((t) => t > oneHourAgo);
        if (timestamps.length >= 20) {
          res.status(429).json({ success: false, error: "Too many requests" });
          return;
        }
        await rateLimitRef.update({ timestamps: [...timestamps, now] });
      } else {
        await rateLimitRef.set({ timestamps: [now] });
      }
    } catch (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError);
      // Allow the email to send if rate limiting fails — don't block legitimate requests
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

    // Compute display values — prefer confirmed details over original request
    const displayDate = booking.confirmedDate
      ? formatDateNice(booking.confirmedDate)
      : (booking.preferredDate ? (formatDateNice(booking.preferredDate) || booking.preferredDate) : null);
    const displayTime = booking.confirmedArrivalWindow || booking.timeWindow || null;
    const displayDuration = booking.estimatedDuration || null;
    const calendarUrl = buildGoogleCalendarUrl(booking);
    const locationDisplay = booking.address || (booking.zip ? `${booking.zip}, Apollo Beach, FL` : null);

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
          <div style="background: #FAFBFC; border: 1px solid #e8e8e8; border-radius: 8px; padding: 20px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px; vertical-align: top;">Service</td>
                <td style="padding: 8px 0; font-weight: 600; color: #0B2040;">${booking.service || "TBD"}</td>
              </tr>
              ${displayDate ? `
              <tr>
                <td style="padding: 8px 0; color: #666; vertical-align: top;">Date</td>
                <td style="padding: 8px 0; font-weight: 700; color: #0B2040; font-size: 15px;">${displayDate}</td>
              </tr>` : ''}
              ${displayTime ? `
              <tr>
                <td style="padding: 8px 0; color: #666; vertical-align: top;">Arrival Window</td>
                <td style="padding: 8px 0; font-weight: 700; color: #0B2040; font-size: 15px;">${displayTime}</td>
              </tr>` : ''}
              ${displayDuration ? `
              <tr>
                <td style="padding: 8px 0; color: #666; vertical-align: top;">Est. Duration</td>
                <td style="padding: 8px 0; font-weight: 600;">${displayDuration}</td>
              </tr>` : ''}
              ${locationDisplay ? `
              <tr>
                <td style="padding: 8px 0; color: #666; vertical-align: top;">Location</td>
                <td style="padding: 8px 0;">${locationDisplay}</td>
              </tr>` : ''}
            </table>
          </div>
          ${calendarUrl ? `
          <div style="text-align: center; margin: 16px 0 24px;">
            <a href="${calendarUrl}" target="_blank"
               style="display: inline-block; background: #E07B2D; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Add to Your Calendar
            </a>
          </div>` : ''}
          <p style="color: #666; line-height: 1.6;">
            Our technician will arrive at your location during the scheduled window with everything needed to complete your service.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Need to reschedule or have questions? Call or text us:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="tel:8137225823" style="display: inline-block; background: #0B2040; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
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
        bcc: "info@coastalmobilelube.com",
        subject: `Service Confirmed — Coastal Mobile Lube & Tire`,
        html: customerHtml,
      });
      console.log(`Confirmation email sent to ${booking.email} for booking ${bookingId}`);
      res.json({ success: true });
    } catch (error) {
      console.error(`Failed to send confirmation to ${booking.email}:`, error);
      res.json({ success: false, error: error.message });
    }
  }
);

// ─── Booking confirmation with .ics calendar invite ──────────────

exports.sendBookingConfirmation = onRequest(
  {
    region: "us-east1",
    memory: "512MiB",
    secrets: [gmailUser, gmailAppPassword],
    cors: allowedOrigins,
  },
  async (req, res) => {
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
      res.status(400).json({ success: false, error: "Missing required fields" });
      return;
    }

    // Parse the arrival window to get start time
    // confirmedTime is like "9:00 AM - 10:00 AM"
    const startTimeStr = confirmedTime.split(" - ")[0].trim();
    const durationMin = parseInt(estimatedDuration) || 60;

    // Build Date objects for .ics
    const dateObj = new Date(confirmedDate + "T00:00:00");
    const [timeStr, ampm] = startTimeStr.split(/(AM|PM)/i);
    const timeParts = timeStr.trim().split(":");
    let hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1] || "0");
    if (ampm && ampm.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (ampm && ampm.toUpperCase() === "AM" && hours === 12) hours = 0;

    const startDate = new Date(dateObj);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

    // Format dates for .ics (YYYYMMDDTHHMMSS)
    const formatICS = (d) => {
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    };

    const serviceList = Array.isArray(services) ? services.join(", ") : services || "Service appointment";
    const formattedDate = formatDateNice(confirmedDate) || confirmedDate;

    // Generate .ics file
    const uid = `coastal-${bookingId || Date.now()}@coastalmobilelube.com`;
    const now = formatICS(new Date());
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Coastal Mobile Lube & Tire//Booking//EN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatICS(startDate)}`,
      `DTEND:${formatICS(endDate)}`,
      `SUMMARY:Coastal Mobile Lube - ${serviceList}`,
      `DESCRIPTION:Service: ${serviceList}\\nVehicle: ${vehicle || "Not specified"}\\nAddress: ${address || "Not specified"}\\nPhone: ${customerPhone || ""}\\nNotes: ${notes || "None"}`,
      `LOCATION:${address || "Customer location (mobile service)"}`,
      `ORGANIZER;CN=Coastal Mobile Lube:mailto:info@coastalmobilelube.com`,
      `ATTENDEE;CN=${customerName}:mailto:${customerEmail}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT1H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Coastal Mobile Lube appointment in 1 hour",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    // Build HTML email
    const htmlEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="background:#0B2040;padding:28px 32px;text-align:center;">
        <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:700;">Coastal Mobile Lube & Tire</h1>
        <p style="color:#6BA3E0;font-size:13px;margin:6px 0 0 0;letter-spacing:1px;">APPOINTMENT CONFIRMED</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="font-size:16px;color:#1a1a1a;margin:0 0 20px 0;">
          Hi ${customerName},
        </p>
        <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 24px 0;">
          Your appointment has been confirmed. We will arrive at your location during the scheduled window below.
        </p>
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
                </tr>` : ""}
                ${address ? `
                <tr>
                  <td style="padding:12px 0;">
                    <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;">Location</p>
                    <p style="font-size:15px;color:#333;margin:0;">${address}</p>
                  </td>
                </tr>` : ""}
              </table>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
          <tr>
            <td style="text-align:center;">
              <p style="font-size:13px;color:#666;margin:0 0 8px 0;">A calendar invite is attached to this email.</p>
              <p style="font-size:13px;color:#888;margin:0;">Open the attachment to add this appointment to your calendar.</p>
            </td>
          </tr>
        </table>
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
        <p style="font-size:14px;color:#666;line-height:1.6;margin:0;">
          Need to reschedule or have questions? Call us at
          <a href="tel:+18137225823" style="color:#1A5FAC;font-weight:600;text-decoration:none;">(813) 722-5823</a>
          or reply to this email.
        </p>
      </td>
    </tr>
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
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser.value(),
        pass: gmailAppPassword.value(),
      },
    });

    try {
      await transporter.sendMail({
        from: `"Coastal Mobile Lube & Tire" <${gmailUser.value()}>`,
        to: customerEmail,
        bcc: "info@coastalmobilelube.com",
        subject: `Appointment Confirmed - ${formattedDate}, ${confirmedTime}`,
        html: htmlEmail,
        icalEvent: {
          method: "REQUEST",
          filename: "appointment.ics",
          content: icsContent,
        },
      });
      console.log(`Booking confirmation sent to ${customerEmail} for booking ${bookingId}`);
      res.json({ success: true });
    } catch (error) {
      console.error(`Failed to send booking confirmation to ${customerEmail}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ─── VIN Decoder proxy (avoids CORS from browser) ────────────────

exports.decodeVIN = onRequest(
  {
    region: "us-east1",
    cors: true,
  },
  async (req, res) => {
    const action = req.query.action || "decode";
    const vin = req.query.vin;
    const year = req.query.year;
    const make = req.query.make;

    try {
      let url;
      if (action === "decode") {
        if (!vin || vin.length !== 17) {
          res.status(400).json({ error: "Invalid VIN length" });
          return;
        }
        url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
      } else if (action === "makes") {
        const types = ["car", "truck", "motorcycle"];
        const results = await Promise.all(
          types.map(async (type) => {
            const r = await fetch(
              `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/${type}?format=json`
            );
            if (!r.ok) return [];
            const json = await r.json();
            return (json.Results || []).map((r) => r.MakeName);
          })
        );
        const all = [...new Set(results.flat().filter(Boolean))].sort((a, b) =>
          a.localeCompare(b)
        );
        res.json({ Results: all });
        return;
      } else if (action === "models") {
        if (!year || !make) {
          res.status(400).json({ error: "year and make are required" });
          return;
        }
        url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${encodeURIComponent(year)}?format=json`;
      } else {
        res.status(400).json({ error: "Invalid action" });
        return;
      }

      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch from NHTSA API" });
    }
  }
);

// ─── PDF generation helper ─────────────────────────────────────────

function generateInvoicePDF(invoiceData) {
  return new Promise((resolve, reject) => {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50,
      info: {
        Title: `Invoice ${invoiceData.invoiceNumber}`,
        Author: 'Coastal Mobile Lube & Tire',
      },
    });

    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const navy = '#0B2040';
    const blue = '#1A5FAC';
    const orange = '#E07B2D';
    const gray = '#666666';
    const lightGray = '#F7F8FA';
    const pageWidth = 512; // 612 - 50*2 margins

    // --- HEADER ---
    // Navy bar across top
    doc.rect(0, 0, 612, 100).fill(navy);

    // Company name
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#ffffff')
      .text('Coastal Mobile Lube & Tire', 50, 30);
    doc.font('Helvetica').fontSize(10).fillColor('#6BA3E0')
      .text('We come to you.', 50, 55);

    // Invoice number + date (right side of header)
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
      .text(invoiceData.invoiceNumber, 350, 30, { width: 212, align: 'right' });
    doc.font('Helvetica').fontSize(10).fillColor('#6BA3E0')
      .text(`Issued: ${invoiceData.issuedDate || 'N/A'}`, 350, 50, { width: 212, align: 'right' });
    if (invoiceData.dueDate) {
      doc.text(`Due: ${invoiceData.dueDate}`, 350, 64, { width: 212, align: 'right' });
    }

    // --- BILL TO ---
    let y = 120;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(gray)
      .text('BILL TO', 50, y);
    y += 16;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(navy)
      .text(invoiceData.customerName || 'Customer', 50, y);
    y += 16;
    if (invoiceData.customerEmail) {
      doc.font('Helvetica').fontSize(10).fillColor(gray)
        .text(invoiceData.customerEmail, 50, y);
      y += 14;
    }
    if (invoiceData.customerPhone) {
      doc.font('Helvetica').fontSize(10).fillColor(gray)
        .text(invoiceData.customerPhone, 50, y);
      y += 14;
    }
    if (invoiceData.customerAddress) {
      doc.font('Helvetica').fontSize(10).fillColor(gray)
        .text(invoiceData.customerAddress, 50, y);
      y += 14;
    }

    // --- VEHICLE (if available) ---
    if (invoiceData.vehicle) {
      y += 6;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(gray)
        .text('VEHICLE', 50, y);
      y += 14;
      doc.font('Helvetica').fontSize(10).fillColor(navy)
        .text(invoiceData.vehicle, 50, y);
      y += 14;
    }

    // --- LINE ITEMS TABLE ---
    y += 20;

    // Table header
    doc.rect(50, y, pageWidth, 28).fill(navy);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.text('SERVICE', 58, y + 8, { width: 260 });
    doc.text('QTY', 320, y + 8, { width: 50, align: 'center' });
    doc.text('PRICE', 375, y + 8, { width: 80, align: 'right' });
    doc.text('TOTAL', 460, y + 8, { width: 94, align: 'right' });
    y += 28;

    // Table rows
    const lineItems = invoiceData.lineItems || [];
    lineItems.forEach((item, i) => {
      const rowHeight = 30;
      // Alternate row background
      if (i % 2 === 0) {
        doc.rect(50, y, pageWidth, rowHeight).fill(lightGray);
      }

      const qty = item.quantity || 1;
      const price = parseFloat(item.unitPrice || item.price || 0);
      const total = qty * price;

      doc.font('Helvetica').fontSize(10).fillColor(navy);
      doc.text(item.serviceName || item.description || item.name || 'Service', 58, y + 9, { width: 260 });
      doc.fillColor(gray);
      doc.text(String(qty), 320, y + 9, { width: 50, align: 'center' });
      doc.text(`$${price.toFixed(2)}`, 375, y + 9, { width: 80, align: 'right' });
      doc.font('Helvetica-Bold').fillColor(navy);
      doc.text(`$${total.toFixed(2)}`, 460, y + 9, { width: 94, align: 'right' });

      y += rowHeight;
    });

    // --- TOTALS ---
    y += 8;
    doc.moveTo(350, y).lineTo(562, y).strokeColor('#e4e4e4').lineWidth(1).stroke();
    y += 12;

    // Subtotal
    if (invoiceData.subtotal != null) {
      doc.font('Helvetica').fontSize(10).fillColor(gray)
        .text('Subtotal', 350, y, { width: 110, align: 'right' });
      doc.font('Helvetica').fillColor(navy)
        .text(`$${parseFloat(invoiceData.subtotal).toFixed(2)}`, 460, y, { width: 94, align: 'right' });
      y += 18;
    }

    // Tax
    if (invoiceData.taxAmount != null && parseFloat(invoiceData.taxAmount) > 0) {
      doc.font('Helvetica').fontSize(10).fillColor(gray)
        .text('Tax', 350, y, { width: 110, align: 'right' });
      doc.font('Helvetica').fillColor(navy)
        .text(`$${parseFloat(invoiceData.taxAmount).toFixed(2)}`, 460, y, { width: 94, align: 'right' });
      y += 18;
    }

    // Total Due line
    y += 4;
    doc.moveTo(350, y).lineTo(562, y).strokeColor(navy).lineWidth(2).stroke();
    y += 12;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(navy)
      .text('Total Due', 350, y, { width: 110, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(16).fillColor(orange)
      .text(`$${parseFloat(invoiceData.total).toFixed(2)}`, 440, y - 2, { width: 114, align: 'right' });

    // --- PAYMENT INSTRUCTIONS ---
    y += 40;
    doc.rect(50, y, pageWidth, 70).fill('#FFF8EE');
    doc.rect(50, y, 3, 70).fill(orange);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(navy)
      .text('Payment Instructions', 66, y + 12);
    doc.font('Helvetica').fontSize(10).fillColor(gray)
      .text('We accept cash, check, Venmo, Zelle, and all major credit cards.', 66, y + 28);
    doc.text('For questions about this invoice, call or text us at (813) 722-5823.', 66, y + 42);

    // --- FOOTER ---
    const footerY = 720;
    doc.moveTo(50, footerY).lineTo(562, footerY).strokeColor('#e4e4e4').lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(9).fillColor('#999')
      .text('Coastal Mobile Lube & Tire | Apollo Beach, FL | coastalmobilelube.com', 50, footerY + 10, {
        width: pageWidth,
        align: 'center',
      });
    doc.text('Thank you for your business!', 50, footerY + 24, {
      width: pageWidth,
      align: 'center',
    });

    doc.end();
  });
}

// ─── Invoice email sent to CUSTOMER from admin invoicing page ───────

exports.sendInvoiceEmail = onRequest(
  {
    region: "us-east1",
    memory: "512MiB",
    secrets: [gmailUser, gmailAppPassword],
    cors: allowedOrigins,
  },
  async (req, res) => {
    // Auth check — admin only
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

    const {
      invoiceId,
      customerEmail, customerName, customerPhone, customerAddress,
      invoiceNumber, lineItems, subtotal, taxAmount, total, notes,
      vehicle, invoiceDate, dueDate,
    } = req.body;

    if (!customerEmail) {
      res.status(400).json({ success: false, error: "customerEmail is required" });
      return;
    }
    if (!invoiceNumber) {
      res.status(400).json({ success: false, error: "invoiceNumber is required" });
      return;
    }

    // Source-branch lookup: if an invoiceId is provided AND the invoice doc has
    // source === 'tech_completion', deliver the FDACS-compliant email body +
    // attached FDACS PDF instead of the legacy template. Missing invoiceId or
    // any other source value falls through to the legacy path unchanged.
    let fdacsInvoice = null;
    if (invoiceId) {
      try {
        const snap = await firestoreDb.collection("invoices").doc(invoiceId).get();
        if (snap.exists && snap.data().source === 'tech_completion') {
          fdacsInvoice = snap.data();
        }
      } catch (lookupErr) {
        console.error('[D-EMAIL] sendInvoiceEmail invoice lookup failed; falling back to legacy:', lookupErr);
      }
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser.value(),
        pass: gmailAppPassword.value(),
      },
    });

    if (fdacsInvoice) {
      try {
        await sendFdacsCustomerEmail({
          invoiceId,
          invoice: { ...fdacsInvoice, customerEmail },
          paymentLink: fdacsInvoice.qbPaymentLink || "",
          recipientEmail: customerEmail,
          transporter,
          fromAddr: `"Coastal Mobile Lube" <${gmailUser.value()}>`,
        });
        await firestoreDb.collection("invoices").doc(invoiceId).update({
          status: "sent",
          sentDate: new Date().toISOString(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[D-EMAIL] FDACS email sent (non-QB path) to ${customerEmail} for ${invoiceNumber}`);
        res.json({ success: true, mode: "fdacs" });
      } catch (err) {
        console.error(`[D-EMAIL] FDACS send failed for ${customerEmail}:`, err);
        res.status(500).json({ success: false, error: err.message });
      }
      return;
    }

    // Build line items table rows
    const items = Array.isArray(lineItems) ? lineItems : [];
    const lineItemRows = items
      .map(
        (li) =>
          `<tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8; color: #333;">${li.serviceName || ""}</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8; text-align: center; color: #333;">${li.quantity || 1}</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8; text-align: right; color: #333;">$${(li.unitPrice || 0).toFixed(2)}</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8; text-align: right; font-weight: 600; color: #0B2040;">$${(li.lineTotal || 0).toFixed(2)}</td>
          </tr>`
      )
      .join("");

    const formattedTotal = typeof total === "number" ? total.toFixed(2) : "0.00";

    const invoiceHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0B2040; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Invoice ${invoiceNumber}</h1>
          <p style="color: #ccc; margin: 4px 0 0; font-size: 13px;">Coastal Mobile Lube &amp; Tire</p>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e8e8e8; border-top: none;">
          <p style="font-size: 16px; color: #333; margin-top: 0;">
            Hi ${customerName || "there"},
          </p>
          <p style="color: #666; line-height: 1.6;">
            Here is your invoice for recent services. Please review the details below.
          </p>

          <!-- Line Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #FAFBFC;">
                <th style="padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; color: #888; border-bottom: 2px solid #e8e8e8;">Service</th>
                <th style="padding: 10px 14px; text-align: center; font-size: 12px; text-transform: uppercase; color: #888; border-bottom: 2px solid #e8e8e8;">Qty</th>
                <th style="padding: 10px 14px; text-align: right; font-size: 12px; text-transform: uppercase; color: #888; border-bottom: 2px solid #e8e8e8;">Price</th>
                <th style="padding: 10px 14px; text-align: right; font-size: 12px; text-transform: uppercase; color: #888; border-bottom: 2px solid #e8e8e8;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemRows}
            </tbody>
          </table>

          <!-- Total -->
          <div style="text-align: right; border-top: 2px solid #0B2040; padding-top: 12px; margin-top: 4px;">
            <span style="font-size: 14px; color: #666; margin-right: 16px;">Total Due:</span>
            <span style="font-size: 24px; font-weight: 800; color: #0B2040;">$${formattedTotal}</span>
          </div>

          ${notes ? `
          <div style="background: #FAFBFC; border: 1px solid #e8e8e8; border-radius: 8px; padding: 16px; margin-top: 20px;">
            <p style="font-size: 12px; text-transform: uppercase; color: #888; margin: 0 0 6px; font-weight: 600;">Notes</p>
            <p style="color: #333; margin: 0; line-height: 1.5;">${notes}</p>
          </div>` : ""}

          <!-- PDF notice -->
          <div style="padding: 16px 0 0 0; text-align: center;">
            <p style="font-size: 13px; color: #666; margin: 0 0 12px 0;">A PDF copy of this invoice is attached to this email.</p>
          </div>

          <!-- Payment Instructions -->
          <div style="margin-top: 24px; padding: 20px; background: #FFF8F0; border: 1px solid #f0dcc4; border-radius: 8px;">
            <p style="font-weight: 700; color: #0B2040; margin: 0 0 8px; font-size: 15px;">Payment Instructions</p>
            <p style="color: #555; line-height: 1.6; margin: 0;">
              We accept cash, check, Venmo, Zelle, and all major credit cards.<br>
              For questions about this invoice, call or text us at
              <a href="tel:8137225823" style="color: #1A5FAC; font-weight: 600;">813-722-LUBE</a>.
            </p>
          </div>

          <p style="color: #888; font-size: 13px; margin-top: 20px; line-height: 1.5;">
            Thank you for choosing Coastal Mobile Lube &amp; Tire. We appreciate your business!
          </p>
        </div>
        <div style="background: #0B2040; padding: 16px 24px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="color: #ccc; font-size: 12px; margin: 0;">
            Coastal Mobile Lube &amp; Tire — Tampa, FL<br>
            Mobile oil changes, tire service, and marine engine maintenance
          </p>
        </div>
      </div>
    `;

    try {
      // Generate PDF attachment
      const issuedDate = invoiceDate
        ? new Date(invoiceDate + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const dueDateFormatted = dueDate
        ? new Date(dueDate + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

      const pdfBuffer = await generateInvoicePDF({
        invoiceNumber,
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        customerAddress: customerAddress || '',
        vehicle: vehicle || '',
        lineItems: items,
        subtotal: subtotal,
        taxAmount: taxAmount,
        total: total,
        issuedDate,
        dueDate: dueDateFormatted,
      });

      await transporter.sendMail({
        from: `"Coastal Mobile Lube" <${gmailUser.value()}>`,
        to: customerEmail,
        bcc: "info@coastalmobilelube.com",
        replyTo: "info@coastalmobilelube.com",
        subject: `Invoice ${invoiceNumber} — Coastal Mobile Lube & Tire`,
        html: invoiceHtml,
        attachments: [
          {
            filename: `${invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      console.log(`Invoice email sent to ${customerEmail} for ${invoiceNumber}`);
      res.json({ success: true });
    } catch (error) {
      console.error(`Failed to send invoice to ${customerEmail}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ─── QuickBooks OAuth: Start ──────────────────────────────────────

exports.qbOAuthStart = onRequest(
  {
    region: "us-east1",
    secrets: [qbClientId, qbClientSecret],
  },
  async (req, res) => {
    const redirectUri = "https://us-east1-coastal-mobile-lube.cloudfunctions.net/qbOAuthCallback";
    const state = crypto.randomBytes(16).toString("hex");

    await firestoreDb.collection("settings").doc("qbOAuthState").set({
      state,
      createdAt: new Date().toISOString(),
    });

    console.log('QB OAuth redirect, client_id present:', !!qbClientId.value(), 'redirect_uri:', redirectUri);

    const authUrl =
      `https://appcenter.intuit.com/connect/oauth2?` +
      `client_id=${qbClientId.value()}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=com.intuit.quickbooks.accounting` +
      `&state=${state}`;

    res.redirect(authUrl);
  }
);

// ─── QuickBooks OAuth: Callback ───────────────────────────────────

exports.qbOAuthCallback = onRequest(
  {
    region: "us-east1",
    secrets: [qbClientId, qbClientSecret],
  },
  async (req, res) => {
    const { code, state, realmId } = req.query;

    console.log('QB OAuth callback received, code present:', !!code, 'realmId:', realmId);

    // Verify state parameter
    const stateDoc = await firestoreDb.collection("settings").doc("qbOAuthState").get();
    if (!stateDoc.exists || stateDoc.data().state !== state) {
      res.status(403).send("Invalid state parameter");
      return;
    }

    const redirectUri = "https://us-east1-coastal-mobile-lube.cloudfunctions.net/qbOAuthCallback";

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${qbClientId.value()}:${qbClientSecret.value()}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      res.status(400).send(`OAuth error: ${tokens.error}`);
      return;
    }

    // Store tokens in Firestore
    await firestoreDb.collection("settings").doc("quickbooks").set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString(),
      realmId: realmId,
      connectedAt: new Date().toISOString(),
    });

    // Clean up state doc
    await firestoreDb.collection("settings").doc("qbOAuthState").delete();

    // Redirect back to admin with success
    res.redirect("https://coastal-mobile-lube.netlify.app/admin?qb=connected");
  }
);

// ─── QuickBooks: Token refresh helper ─────────────────────────────

async function getQBAccessToken() {
  const tokenRef = firestoreDb.collection("settings").doc("quickbooks");

  // First read outside the transaction — if token is fresh, no transaction needed.
  const initialSnap = await tokenRef.get();
  if (!initialSnap.exists) throw new Error("QuickBooks not connected");

  const initialData = initialSnap.data();
  const initialExpiresAt = new Date(initialData.accessTokenExpiresAt);
  const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (initialExpiresAt > fiveMinFromNow) {
    return { accessToken: initialData.accessToken, realmId: initialData.realmId };
  }

  // Token needs refresh — do it inside a transaction so concurrent invocations
  // don't both call Intuit and rotate the refresh token out from under each other.
  // Note: the HTTP call lives inside the transaction. Firestore retries the txn
  // body on contention, which could double-call Intuit. In practice Intuit's
  // rotation is idempotent enough that a duplicate refresh just produces another
  // valid token — the "lose the refresh token" failure mode this fixes is much
  // worse. Revisit if we see retry storms.
  return await firestoreDb.runTransaction(async (tx) => {
    const snap = await tx.get(tokenRef);
    if (!snap.exists) throw new Error("QuickBooks not connected during refresh");

    const fresh = snap.data();
    const freshExpiresAt = new Date(fresh.accessTokenExpiresAt);

    // Another invocation may have already refreshed while we were waiting.
    if (freshExpiresAt > fiveMinFromNow) {
      return { accessToken: fresh.accessToken, realmId: fresh.realmId };
    }

    const tokenResponse = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${qbClientId.value()}:${qbClientSecret.value()}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: fresh.refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      throw new Error(`QB token refresh failed: ${tokenResponse.status} ${errBody}`);
    }

    const tokens = await tokenResponse.json();
    if (tokens.error) throw new Error(`Token refresh failed: ${tokens.error}`);

    tx.update(tokenRef, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString(),
      lastRefreshedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { accessToken: tokens.access_token, realmId: fresh.realmId };
  });
}

// ─── QuickBooks: Customer sync helper ─────────────────────────────

const QB_BASE = process.env.QB_BASE || "quickbooks.api.intuit.com";

async function syncCustomerToQB(customerData) {
  const { accessToken, realmId } = await getQBAccessToken();
  const baseUrl = `https://${QB_BASE}/v3/company/${realmId}`;

  async function writeBack(qbCustomerId) {
    const writes = [];
    if (customerData.firestoreCustomerId) {
      writes.push(
        firestoreDb
          .collection("customers")
          .doc(customerData.firestoreCustomerId)
          .set({ qbCustomerId }, { merge: true })
      );
    }
    if (customerData.firestoreInvoiceId) {
      writes.push(
        firestoreDb
          .collection("invoices")
          .doc(customerData.firestoreInvoiceId)
          .set({ qbCustomerId }, { merge: true })
      );
    }
    if (writes.length) {
      try {
        await Promise.all(writes);
      } catch (writeErr) {
        console.error("Non-fatal: writeback to Firestore failed:", writeErr.message);
      }
    }
    return qbCustomerId;
  }

  // 1. Check if customer already exists by email
  if (customerData.email) {
    const queryResponse = await fetch(
      `${baseUrl}/query?query=${encodeURIComponent(`SELECT * FROM Customer WHERE PrimaryEmailAddr = '${customerData.email}'`)}&minorversion=75`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
    );
    const queryResult = await queryResponse.json();
    if (queryResult.QueryResponse?.Customer?.[0]) {
      return await writeBack(queryResult.QueryResponse.Customer[0].Id);
    }
  }

  // 2. DisplayName fallback: if email lookup missed, try matching on customer name
  // before creating a new QB customer (avoids "Duplicate Name Exists" code 6240).
  const displayName = (
    customerData.name ||
    `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim()
  ).trim();

  if (displayName) {
    const escapedName = displayName.replace(/'/g, "\\'");
    const nameQueryResponse = await fetch(
      `${baseUrl}/query?query=${encodeURIComponent(
        `SELECT * FROM Customer WHERE DisplayName = '${escapedName}'`
      )}&minorversion=75`,
      {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      }
    );
    const nameQueryResult = await nameQueryResponse.json();
    const matchedByName = nameQueryResult.QueryResponse?.Customer?.[0];
    if (matchedByName) {
      console.log(
        `QB customer matched by DisplayName: ${displayName} -> id ${matchedByName.Id}`
      );

      // Update QB customer's email to current invoice email if different
      if (
        customerData.email &&
        matchedByName.PrimaryEmailAddr?.Address?.toLowerCase() !==
          customerData.email.toLowerCase()
      ) {
        try {
          await fetch(`${baseUrl}/customer?minorversion=75`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              Id: matchedByName.Id,
              SyncToken: matchedByName.SyncToken,
              sparse: true,
              PrimaryEmailAddr: { Address: customerData.email },
            }),
          });
          console.log(`QB customer email updated to ${customerData.email}`);
        } catch (updateErr) {
          console.error(
            "Non-fatal: QB customer email update failed:",
            updateErr.message
          );
        }
      }

      return await writeBack(matchedByName.Id);
    }
  }

  // 3. Create new customer
  const qbCustomer = {
    DisplayName: displayName || customerData.name || "Customer",
    GivenName: customerData.firstName || "",
    FamilyName: customerData.lastName || "",
    PrimaryEmailAddr: customerData.email ? { Address: customerData.email } : undefined,
    PrimaryPhone: customerData.phone ? { FreeFormNumber: customerData.phone } : undefined,
    BillAddr: customerData.address
      ? {
          Line1: customerData.address,
          City: customerData.city || "",
          CountrySubDivisionCode: customerData.state || "FL",
          PostalCode: customerData.zip || "",
        }
      : undefined,
  };

  const createResponse = await fetch(`${baseUrl}/customer?minorversion=75`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(qbCustomer),
  });

  const created = await createResponse.json();
  if (created.Fault) throw new Error(`QB customer create failed: ${JSON.stringify(created.Fault)}`);

  return await writeBack(created.Customer.Id);
}

// ─── QuickBooks: Get or create Service item helper ────────────────

async function getOrCreateQBServiceItem(accessToken, realmId) {
  const baseUrl = `https://${QB_BASE}/v3/company/${realmId}`;

  const queryResponse = await fetch(
    `${baseUrl}/query?query=${encodeURIComponent("SELECT * FROM Item WHERE Name = 'Service'")}&minorversion=75`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
  );
  const queryResult = await queryResponse.json();
  if (queryResult.QueryResponse?.Item?.[0]) {
    return queryResult.QueryResponse.Item[0].Id;
  }

  // Create Service item
  const createResponse = await fetch(`${baseUrl}/item?minorversion=75`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      Name: "Service",
      Type: "Service",
      IncomeAccountRef: { name: "Services", value: "7" },
    }),
  });
  const created = await createResponse.json();
  if (created.Fault) throw new Error(`QB item create failed: ${JSON.stringify(created.Fault)}`);
  return created.Item.Id;
}

// ─── QuickBooks: Send invoice with payment link ───────────────────

exports.sendInvoiceWithQBPayment = onRequest(
  {
    region: "us-east1",
    memory: "512MiB",
    secrets: [qbClientId, qbClientSecret, gmailUser, gmailAppPassword],
    cors: allowedOrigins,
  },
  async (req, res) => {
    // Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const token = authHeader.split("Bearer ")[1];
      await admin.auth().verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const {
      invoiceId,
      invoiceNumber,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerId,
      lineItems,
      subtotal,
      tax,
      convenienceFee,
      total,
      vehicle,
      dueDate,
    } = req.body;

    try {
      const { accessToken, realmId } = await getQBAccessToken();
      const baseUrl = `https://${QB_BASE}/v3/company/${realmId}`;

      // Fetch existing invoice doc once (used by resend path AND by source-branch
      // logic at the email step). May be null for create-only flows that don't
      // have an invoiceId yet.
      let existingData = null;
      if (invoiceId) {
        const existingSnap = await firestoreDb.collection("invoices").doc(invoiceId).get();
        existingData = existingSnap.exists ? existingSnap.data() : null;
      }
      const isFdacs = existingData?.source === 'tech_completion';

      // 0. Resend path: if this Coastal invoice already has a QB invoice...
      if (invoiceId && existingData?.qbInvoiceId) {
        // FDACS resend: bypass QB's /invoice/{Id}/send (which would deliver QB's
        // generic template). Re-render the FDACS body + PDF and deliver via our
        // own SMTP path using the stored qbPaymentLink.
        if (isFdacs) {
          const sendTo = customerEmail || existingData.customerEmail || "";
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: gmailUser.value(), pass: gmailAppPassword.value() },
          });
          const fromAddr = `"Coastal Mobile Lube" <${gmailUser.value()}>`;
          const fdacsResendInvoice = { ...existingData, customerEmail: sendTo };

          await sendFdacsCustomerEmail({
            invoiceId,
            invoice: fdacsResendInvoice,
            paymentLink: existingData.qbPaymentLink || "",
            recipientEmail: sendTo,
            transporter,
            fromAddr,
          });

          await firestoreDb.collection("invoices").doc(invoiceId).update({
            status: "sent",
            sentDate: new Date().toISOString(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // WO-FDACS-E — upload Attachable on resend if the QB invoice is
          // missing it (covers invoices created before E shipped).
          const resendInvoiceRef = firestoreDb.collection("invoices").doc(invoiceId);
          const resendAttach = await uploadFdacsPdfToQb({
            invoice: fdacsResendInvoice,
            invoiceId,
            qbInvoiceId: existingData.qbInvoiceId,
            accessToken,
            realmId,
            invoiceRef: resendInvoiceRef,
          });

          return res.status(200).json({
            success: true,
            action: "resent",
            mode: "fdacs",
            qbInvoiceId: existingData.qbInvoiceId,
            qbAttachableId: resendAttach?.attachableId || existingData.qbAttachableId,
          });
        }

        // Legacy resend: keep QB's /invoice/{Id}/send (preserves existing
        // manual_admin behavior — generic QB template, no PDF attachment).
        const sendTo = customerEmail || existingData.customerEmail || "";
        const sendResponse = await fetch(
          `${baseUrl}/invoice/${existingData.qbInvoiceId}/send?sendTo=${encodeURIComponent(sendTo)}&minorversion=75`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );

        if (!sendResponse.ok) {
          const errBody = await sendResponse.text();
          console.error("QB resend failed:", errBody);
          throw new Error(`QB resend failed: ${sendResponse.status}`);
        }

        await firestoreDb.collection("invoices").doc(invoiceId).update({
          status: "sent",
          sentDate: new Date().toISOString(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(200).json({
          success: true,
          action: "resent",
          qbInvoiceId: existingData.qbInvoiceId,
        });
      }

      // 1. Sync customer to QB (or find existing)
      // Idempotent: if invoice or customer doc already has qbCustomerId, reuse it.
      let qbCustomerId;

      if (existingData?.qbCustomerId) {
        qbCustomerId = existingData.qbCustomerId;
      }

      if (!qbCustomerId && customerId) {
        const customerDoc = await firestoreDb.collection("customers").doc(customerId).get();
        if (customerDoc.exists && customerDoc.data().qbCustomerId) {
          qbCustomerId = customerDoc.data().qbCustomerId;
        }
      }

      if (!qbCustomerId) {
        qbCustomerId = await syncCustomerToQB({
          name: customerName,
          firstName: customerName?.split(" ")[0] || "",
          lastName: customerName?.split(" ").slice(1).join(" ") || "",
          email: customerEmail,
          phone: customerPhone,
          address: customerAddress,
          firestoreCustomerId: customerId,
          firestoreInvoiceId: invoiceId,
        });
      }

      // 2. Create QB invoice
      const serviceItemId = await getOrCreateQBServiceItem(accessToken, realmId);

      // Per-line TaxCodeRef drives Automated Sales Tax in Coastal's QB:
      // "TAX" → AST applies the customer-address rate; "NON" → excluded from tax.
      // Default missing item.taxable to false (safe — never tax labor unintentionally).
      const qbLineItems = (lineItems || []).map((item) => ({
        DetailType: "SalesItemLineDetail",
        Amount: (item.quantity || 1) * parseFloat(item.unitPrice || item.price || 0),
        Description: item.serviceName || item.description || item.name || "Service",
        SalesItemLineDetail: {
          ItemRef: { value: serviceItemId },
          UnitPrice: parseFloat(item.unitPrice || item.price || 0),
          Qty: item.quantity || 1,
          TaxCodeRef: { value: item.taxable ? "TAX" : "NON" },
        },
      }));

      // Convenience fee is a service charge — non-taxable in FL.
      if (convenienceFee && parseFloat(convenienceFee) > 0) {
        qbLineItems.push({
          DetailType: "SalesItemLineDetail",
          Amount: parseFloat(convenienceFee),
          Description: "Mobile Service Fee",
          SalesItemLineDetail: {
            ItemRef: { value: serviceItemId },
            UnitPrice: parseFloat(convenienceFee),
            Qty: 1,
            TaxCodeRef: { value: "NON" },
          },
        });
      }

      // WO-FDACS-E — FDACS-gated QB metadata: Vehicle Custom Field, CustomerMemo
      // (regulatory disclosures), PrivateNote (customer complaint).
      // DefinitionId '1' = SalesCustomName1 "Vehicle" (confirmed via QB Preferences).
      const VEHICLE_CUSTOM_FIELD_ID = "1";
      let fdacsCustomFields = null;
      let fdacsCustomerMemo = null;
      let fdacsPrivateNote = null;
      let fdacsBooking = null;

      if (isFdacs) {
        const v = existingData?.vehicleInfo || {};
        let vehicleString = [v.year, v.make, v.model].filter(Boolean).map(String).join(" ").trim();
        if (!vehicleString) {
          vehicleString = [existingData?.vehicleYear, existingData?.vehicleMake, existingData?.vehicleModel]
            .filter(Boolean).map(String).join(" ").trim();
        }
        if (vehicleString) {
          fdacsCustomFields = [{
            DefinitionId: VEHICLE_CUSTOM_FIELD_ID,
            Type: "StringType",
            Name: "Vehicle",
            StringValue: vehicleString.substring(0, 31), // QB string custom-field hard limit
          }];
        }

        try {
          const businessSnap = await firestoreDb.doc("settings/business").get();
          const businessSettings = businessSnap.exists ? businessSnap.data() : {};
          const disclosureInvoice = existingData?.lineItems
            ? existingData
            : { lineItems: lineItems || [] };
          const d = buildDisclosures(disclosureInvoice, businessSettings);
          const memoText = [d.warranty, d.shopSupplies, d.tireFee, d.batteryFee]
            .filter(Boolean)
            .join("\n\n");
          if (memoText) {
            fdacsCustomerMemo = memoText.length > 950
              ? memoText.substring(0, 947) + "..."
              : memoText;
          }
        } catch (memoErr) {
          console.warn("[E] disclosure build failed; falling back to legacy memo:", memoErr.message || memoErr);
        }

        if (existingData?.bookingId) {
          try {
            const bSnap = await firestoreDb.collection("bookings").doc(existingData.bookingId).get();
            fdacsBooking = bSnap.exists ? bSnap.data() : null;
            if (fdacsBooking?.customerComplaint) {
              fdacsPrivateNote = `Customer complaint: ${String(fdacsBooking.customerComplaint).substring(0, 950)}`;
            }
          } catch (e) {
            console.warn("[E] booking fetch for PrivateNote failed:", e.message || e);
          }
        }
      }

      const legacyMemoText = vehicle ? `Vehicle: ${vehicle}` : "Thank you for your business!";

      const qbInvoice = {
        CustomerRef: { value: qbCustomerId },
        Line: qbLineItems,
        // Coastal QB has Custom Transaction Numbers ON, so admin's CMLT-YYYY-NNN
        // takes precedence and customers see the same number across all systems.
        DocNumber: invoiceNumber,
        BillEmail: { Address: customerEmail },
        AllowOnlineCreditCardPayment: true,
        AllowOnlineACHPayment: true,
        DueDate: dueDate || undefined,
        CustomerMemo: { value: fdacsCustomerMemo || legacyMemoText },
        EmailStatus: "NotSet",
        ...(fdacsCustomFields ? { CustomField: fdacsCustomFields } : {}),
        ...(fdacsPrivateNote ? { PrivateNote: fdacsPrivateNote } : {}),
      };

      async function postInvoice(payload) {
        const r = await fetch(`${baseUrl}/invoice?minorversion=75`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        return await r.json();
      }

      let invoiceResult = await postInvoice(qbInvoice);
      // WO-FDACS-E points 16/17: if QB rejects the payload, retry once with FDACS
      // metadata stripped (Custom Field, FDACS memo, PrivateNote). Don't block the
      // send for a metadata field.
      if (invoiceResult.Fault && isFdacs && (fdacsCustomFields || fdacsCustomerMemo || fdacsPrivateNote)) {
        console.warn("[E] QB rejected FDACS metadata; retrying without:",
          JSON.stringify(invoiceResult.Fault));
        const retryPayload = { ...qbInvoice };
        delete retryPayload.CustomField;
        delete retryPayload.PrivateNote;
        retryPayload.CustomerMemo = { value: legacyMemoText };
        invoiceResult = await postInvoice(retryPayload);
      }
      if (invoiceResult.Fault) {
        throw new Error(`QB invoice create failed: ${JSON.stringify(invoiceResult.Fault)}`);
      }

      const qbInvoiceId = invoiceResult.Invoice?.Id;
      const qbDocNumber = invoiceResult.Invoice?.DocNumber;

      // QB-authoritative totals after AST has computed tax.
      // TotalAmt is the grand total; TxnTaxDetail.TotalTax is the calculated tax;
      // subtotal = TotalAmt - TotalTax (rounded to cents to avoid float drift).
      const qbTotalAmount =
        invoiceResult.Invoice?.TotalAmt != null
          ? parseFloat(invoiceResult.Invoice.TotalAmt)
          : null;
      const qbTaxAmount =
        invoiceResult.Invoice?.TxnTaxDetail?.TotalTax != null
          ? parseFloat(invoiceResult.Invoice.TxnTaxDetail.TotalTax)
          : 0;
      const qbSubtotal =
        qbTotalAmount != null
          ? Math.round((qbTotalAmount - qbTaxAmount) * 100) / 100
          : null;

      // 3. Early writeback: persist qbInvoiceId and core qb* fields IMMEDIATELY
      // after QB create-success. Doing this BEFORE the link fetch ensures a
      // link-fetch failure (timeout, transient 5xx) cannot leave us with a QB
      // invoice that Firestore has no reference to. The link can be re-fetched;
      // losing qbInvoiceId cannot be recovered automatically.
      if (invoiceId) {
        const earlyUpdate = {
          status: "sent",
          sentDate: new Date().toISOString(),
        };
        if (qbInvoiceId !== undefined) earlyUpdate.qbInvoiceId = qbInvoiceId;
        if (qbDocNumber !== undefined) earlyUpdate.qbDocNumber = qbDocNumber;
        if (qbTotalAmount != null) earlyUpdate.qbTotalAmount = qbTotalAmount;
        if (qbSubtotal != null) earlyUpdate.qbSubtotal = qbSubtotal;
        earlyUpdate.qbTaxAmount = qbTaxAmount;

        try {
          await firestoreDb.collection("invoices").doc(invoiceId).update(earlyUpdate);
          console.log(
            `[QB] Early writeback success for invoice ${invoiceId}, qbInvoiceId=${qbInvoiceId}`
          );
        } catch (writebackErr) {
          console.error(
            `[QB] CRITICAL: Early writeback FAILED for invoice ${invoiceId} (qbInvoiceId=${qbInvoiceId}):`,
            writebackErr
          );
          throw writebackErr;
        }
      }

      // 4. Best-effort link fetch — qbInvoiceId is already saved, so a failure
      // here is recoverable separately. Never throw from this block.
      let paymentLink = "";
      try {
        const linkResponse = await fetch(
          `${baseUrl}/invoice/${qbInvoiceId}?minorversion=75&include=invoiceLink`,
          { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
        );
        const linkResult = await linkResponse.json();
        paymentLink = linkResult.Invoice?.InvoiceLink || "";

        if (invoiceId && paymentLink) {
          await firestoreDb
            .collection("invoices")
            .doc(invoiceId)
            .update({ qbPaymentLink: paymentLink });
        }
      } catch (linkErr) {
        console.error(
          `[QB] Link fetch failed for invoice ${invoiceId} (qbInvoiceId=${qbInvoiceId}, but core fields ARE saved):`,
          linkErr
        );
      }

      // 5. Send branded email with payment link
      const lineItemsHTML = (lineItems || [])
        .map((item) => {
          const qty = item.quantity || 1;
          const price = parseFloat(item.unitPrice || item.price || 0);
          const itemTotal = qty * price;
          return `<tr>
          <td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px;">${item.serviceName || item.description || item.name || "Service"}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">${qty}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #eee;text-align:right;font-size:14px;">$${price.toFixed(2)}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:700;">$${itemTotal.toFixed(2)}</td>
        </tr>`;
        })
        .join("");

      // Email totals pull from QB authoritative values when present, else fall
      // back to admin-computed inputs (e.g. when QB sync is disabled).
      const emailTotal = qbTotalAmount != null ? qbTotalAmount : parseFloat(total || 0);
      const emailSubtotal =
        qbSubtotal != null ? qbSubtotal : parseFloat(subtotal != null ? subtotal : total || 0);
      const emailTax = qbTaxAmount != null ? qbTaxAmount : parseFloat(tax || 0);
      const taxRowHTML =
        emailTax > 0
          ? `<tr>
              <td style="text-align:right;padding:4px 16px;font-size:13px;color:#666;">Tax</td>
              <td style="text-align:right;padding:4px 16px;font-size:13px;width:120px;">$${emailTax.toFixed(2)}</td>
            </tr>`
          : "";

      const payButtonHTML = paymentLink
        ? `
      <tr>
        <td style="padding:24px 32px;text-align:center;">
          <a href="${paymentLink}" style="display:inline-block;padding:14px 40px;background:#E07B2D;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">
            Pay Now
          </a>
          <p style="font-size:12px;color:#888;margin:10px 0 0 0;">Secure payment powered by QuickBooks</p>
        </td>
      </tr>`
        : "";

      const htmlEmail = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="background:#0B2040;padding:28px 32px;text-align:center;">
        <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:700;">Coastal Mobile Lube & Tire</h1>
        <p style="color:#6BA3E0;font-size:13px;margin:6px 0 0 0;letter-spacing:1px;">INVOICE ${invoiceNumber}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="font-size:16px;color:#1a1a1a;margin:0 0 20px 0;">Hi ${customerName},</p>
        <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 24px 0;">Here is your invoice for recent services. Please review the details below.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
          <tr>
            <th style="background:#0B2040;color:white;padding:10px 16px;font-size:10px;text-transform:uppercase;text-align:left;">Service</th>
            <th style="background:#0B2040;color:white;padding:10px 16px;font-size:10px;text-transform:uppercase;text-align:center;">Qty</th>
            <th style="background:#0B2040;color:white;padding:10px 16px;font-size:10px;text-transform:uppercase;text-align:right;">Price</th>
            <th style="background:#0B2040;color:white;padding:10px 16px;font-size:10px;text-transform:uppercase;text-align:right;">Total</th>
          </tr>
          ${lineItemsHTML}
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
          <tr>
            <td style="text-align:right;padding:4px 16px;font-size:13px;color:#666;">Subtotal</td>
            <td style="text-align:right;padding:4px 16px;font-size:13px;width:120px;">$${emailSubtotal.toFixed(2)}</td>
          </tr>
          ${taxRowHTML}
          <tr>
            <td style="text-align:right;padding:10px 16px 0 16px;border-top:1px solid #ddd;">
              <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Total Due</span>
            </td>
            <td style="text-align:right;padding:10px 16px 0 16px;border-top:1px solid #ddd;">
              <span style="font-size:24px;font-weight:700;color:#E07B2D;">$${emailTotal.toFixed(2)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${payButtonHTML}
    <tr>
      <td style="padding:0 32px 24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8EE;border-left:3px solid #E07B2D;border-radius:0 8px 8px 0;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="font-size:13px;font-weight:700;color:#0B2040;margin:0 0 6px 0;">Payment Instructions</p>
              <p style="font-size:13px;color:#666;margin:2px 0;">We accept cash, check, Venmo, Zelle, and all major credit cards.</p>
              <p style="font-size:13px;color:#666;margin:2px 0;">For questions, call or text us at <a href="tel:+18137225823" style="color:#1A5FAC;text-decoration:none;font-weight:600;">(813) 722-5823</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px 32px;">
        <p style="font-size:14px;color:#666;margin:0;">Thank you for choosing Coastal Mobile Lube & Tire. We appreciate your business!</p>
      </td>
    </tr>
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

      // Send email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser.value(), pass: gmailAppPassword.value() },
      });
      const fromAddr = `"Coastal Mobile Lube" <${gmailUser.value()}>`;

      let createdAttachableId = null;
      if (isFdacs && invoiceId) {
        // FDACS first-send: re-fetch invoice so the email body sees the just-written
        // qb totals + invoiceId (early writeback above happened on this same doc).
        const freshSnap = await firestoreDb.collection("invoices").doc(invoiceId).get();
        const freshInvoice = freshSnap.exists
          ? { ...freshSnap.data(), customerEmail }
          : { ...existingData, customerEmail, invoiceNumber, qbTotalAmount, qbTaxAmount, qbSubtotal };

        await sendFdacsCustomerEmail({
          invoiceId,
          invoice: freshInvoice,
          paymentLink,
          recipientEmail: customerEmail,
          transporter,
          fromAddr,
        });

        // WO-FDACS-E — upload the FDACS PDF as a QB Attachable. Best-effort:
        // QB invoice is already created and customer email is already sent.
        const createInvoiceRef = firestoreDb.collection("invoices").doc(invoiceId);
        const attachRes = await uploadFdacsPdfToQb({
          invoice: freshInvoice,
          invoiceId,
          qbInvoiceId,
          accessToken,
          realmId,
          invoiceRef: createInvoiceRef,
        });
        createdAttachableId = attachRes?.attachableId || null;
      } else {
        await transporter.sendMail({
          from: fromAddr,
          to: customerEmail,
          bcc: "info@coastalmobilelube.com",
          replyTo: "info@coastalmobilelube.com",
          subject: `Invoice ${invoiceNumber} - Coastal Mobile Lube & Tire`,
          html: htmlEmail,
        });
      }

      res.status(200).json({
        success: true,
        mode: isFdacs ? "fdacs" : "legacy",
        qbInvoiceId,
        qbDocNumber,
        qbTotalAmount,
        qbTaxAmount,
        qbSubtotal,
        paymentLink,
        ...(createdAttachableId ? { qbAttachableId: createdAttachableId } : {}),
      });
    } catch (err) {
      console.error("QB invoice error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── Cancellation email sent to CUSTOMER when admin cancels a booking ───

exports.sendCancellationEmail = onRequest(
  {
    region: "us-east1",
    secrets: [gmailUser, gmailAppPassword],
    cors: allowedOrigins,
  },
  async (req, res) => {
    const { bookingId } = req.body;

    if (!bookingId) {
      res.status(400).json({ success: false, error: "bookingId is required" });
      return;
    }

    // Read booking from Firestore
    let booking;
    try {
      const bookingDoc = await firestoreDb.collection("bookings").doc(bookingId).get();
      if (!bookingDoc.exists) {
        res.status(404).json({ success: false, error: "Booking not found" });
        return;
      }
      booking = bookingDoc.data();
    } catch (err) {
      console.error("Failed to read booking:", err);
      res.status(500).json({ success: false, error: "Failed to read booking" });
      return;
    }

    const customerEmail = booking.email || booking.customerEmail;
    if (!customerEmail) {
      console.log(`No email on file for booking ${bookingId}, skipping cancellation email`);
      res.json({ success: true, skipped: true, reason: "No customer email" });
      return;
    }

    const customerName = booking.name || booking.customerName || "there";
    const serviceName = booking.service || "your scheduled service";

    // Build date/time display if the booking was confirmed
    const displayDate = booking.confirmedDate
      ? formatDateNice(booking.confirmedDate)
      : (booking.preferredDate ? (formatDateNice(booking.preferredDate) || booking.preferredDate) : null);
    const displayTime = booking.confirmedArrivalWindow || booking.timeWindow || null;

    const appointmentBlock = (displayDate || displayTime) ? `
      <div style="background: #FFF5F5; border: 1px solid #FED7D7; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="font-size: 12px; text-transform: uppercase; color: #E53E3E; font-weight: 600; margin: 0 0 8px; letter-spacing: 0.5px;">Cancelled Appointment</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #666; width: 100px;">Service</td>
            <td style="padding: 4px 0; font-weight: 600; color: #0B2040;">${serviceName}</td>
          </tr>
          ${displayDate ? `
          <tr>
            <td style="padding: 4px 0; color: #666;">Date</td>
            <td style="padding: 4px 0; font-weight: 600; color: #0B2040;">${displayDate}</td>
          </tr>` : ""}
          ${displayTime ? `
          <tr>
            <td style="padding: 4px 0; color: #666;">Time</td>
            <td style="padding: 4px 0; font-weight: 600; color: #0B2040;">${displayTime}</td>
          </tr>` : ""}
        </table>
      </div>` : "";

    const cancellationHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0B2040; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Appointment Cancelled</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e8e8e8; border-top: none;">
          <p style="font-size: 16px; color: #333; margin-top: 0;">
            Hi ${customerName},
          </p>
          <p style="color: #666; line-height: 1.6;">
            We're sorry to see this appointment cancelled. We wanted to let you know that your upcoming service has been removed from our schedule.
          </p>
          ${appointmentBlock}
          <p style="color: #666; line-height: 1.6;">
            We'd love to help you in the future. Whenever you're ready, you can book a new appointment online — it only takes a minute.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://coastalmobilelube.com/book"
               style="display: inline-block; background: #E07B2D; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Book Again
            </a>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Questions? Call or text us anytime:
          </p>
          <div style="text-align: center; margin: 16px 0;">
            <a href="tel:8137225823" style="display: inline-block; background: #0B2040; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
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

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser.value(),
        pass: gmailAppPassword.value(),
      },
    });

    try {
      // TODO: Customer SMS notifications removed 2026-05-06 - email-to-SMS gateways are dead.
      // Replacing with proper Twilio integration in T2 work order.
      await transporter.sendMail({
        from: `"Coastal Mobile Lube" <${gmailUser.value()}>`,
        to: customerEmail,
        bcc: "info@coastalmobilelube.com",
        subject: "Your Coastal Mobile Lube appointment has been cancelled",
        text: `Cancelled: ${customerName} - ${serviceName}. Check admin dashboard.`,
        html: cancellationHtml,
      });
      console.log(`Cancellation email sent to ${customerEmail} for booking ${bookingId}`);
      res.json({ success: true });
    } catch (error) {
      console.error(`Failed to send cancellation email to ${customerEmail}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ─── QuickBooks: Webhook listener (payment received) ──────────────

exports.qbWebhook = onRequest(
  {
    region: "us-east1",
    secrets: [qbClientId, qbClientSecret, gmailUser, gmailAppPassword, qbWebhookVerifierToken],
  },
  async (req, res) => {
    // Verify Intuit webhook signature against the RAW request body before
    // trusting the payload. Intuit signs the unparsed body with HMAC-SHA256
    // using the verifier token configured in the developer dashboard.
    const verifier = qbWebhookVerifierToken.value();
    if (!verifier) {
      console.error("QB_WEBHOOK_VERIFIER_TOKEN not configured");
      res.status(500).send("verifier not configured");
      return;
    }

    const rawBody = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body || {});
    const sig = req.get("intuit-signature") || "";
    const expected = crypto.createHmac("sha256", verifier).update(rawBody).digest("base64");

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);

    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      console.error("QB webhook signature mismatch");
      res.status(401).send("invalid signature");
      return;
    }

    // Respond immediately after verification — Intuit retries non-2xx responses.
    res.status(200).send("OK");

    const notifications = req.body?.eventNotifications || [];

    for (const notification of notifications) {
      const entities = notification?.dataChangeEvent?.entities || [];

      for (const entity of entities) {
        if (entity.name === "Payment" && entity.operation === "Create") {
          try {
            const { accessToken, realmId } = await getQBAccessToken();

            const paymentResponse = await fetch(
              `https://${QB_BASE}/v3/company/${realmId}/payment/${entity.id}?minorversion=75`,
              { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
            );
            const paymentResult = await paymentResponse.json();
            const payment = paymentResult.Payment;

            if (!payment) continue;

            // Find linked invoice(s)
            const linkedInvoices = (payment.Line || [])
              .filter((line) => line.LinkedTxn)
              .flatMap((line) => line.LinkedTxn)
              .filter((txn) => txn.TxnType === "Invoice");

            for (const linkedInvoice of linkedInvoices) {
              const qbInvoiceId = linkedInvoice.TxnId;

              const coastalInvoices = await firestoreDb
                .collection("invoices")
                .where("qbInvoiceId", "==", qbInvoiceId)
                .get();

              if (!coastalInvoices.empty) {
                const coastalInvoice = coastalInvoices.docs[0];
                const invoiceData = coastalInvoice.data();

                await coastalInvoice.ref.update({
                  status: "paid",
                  paidDate: new Date().toISOString(),
                  paidAmount: payment.TotalAmt,
                  qbPaymentId: payment.Id,
                });

                // Send admin payment notification email
                try {
                  const paidAmount = parseFloat(payment.TotalAmt || 0).toFixed(2);
                  const invoiceNumber = invoiceData.invoiceNumber || `QB-${qbInvoiceId}`;
                  const customerName = invoiceData.customerName || "Unknown";
                  const paidDate = new Date().toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  });

                  const paymentHtml = `
                    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <div style="background: #0B2040; padding: 20px 24px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 20px;">Payment Received</h1>
                      </div>
                      <div style="background: white; padding: 24px; border: 1px solid #e8e8e8; border-top: none; border-radius: 0 0 8px 8px;">
                        <div style="background: #F0FFF4; border: 1px solid #C6F6D5; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                          <p style="font-size: 24px; font-weight: 800; color: #22543D; margin: 0; text-align: center;">$${paidAmount}</p>
                          <p style="font-size: 13px; color: #276749; margin: 4px 0 0; text-align: center;">Payment received via QuickBooks</p>
                        </div>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #666; width: 120px;">Invoice</td>
                            <td style="padding: 8px 0; font-weight: 600; color: #0B2040;">${invoiceNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666;">Customer</td>
                            <td style="padding: 8px 0; font-weight: 600; color: #0B2040;">${customerName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666;">Amount</td>
                            <td style="padding: 8px 0; font-weight: 600; color: #0B2040;">$${paidAmount}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666;">Date</td>
                            <td style="padding: 8px 0; color: #0B2040;">${paidDate}</td>
                          </tr>
                        </table>
                        <div style="margin-top: 16px; text-align: center;">
                          <a href="https://coastal-mobile-lube.netlify.app/admin/invoicing"
                             style="display: inline-block; background: #E07B2D; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">
                            View in Admin
                          </a>
                        </div>
                      </div>
                      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 12px;">
                        Coastal Mobile Lube & Tire — Automated Notification
                      </p>
                    </div>
                  `;

                  const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                      user: gmailUser.value(),
                      pass: gmailAppPassword.value(),
                    },
                  });

                  // TODO: Customer SMS notifications removed 2026-05-06 - email-to-SMS gateways are dead.
                  // Replacing with proper Twilio integration in T2 work order.
                  await transporter.sendMail({
                    from: `"Coastal Mobile Lube" <${gmailUser.value()}>`,
                    to: "info@coastalmobilelube.com",
                    subject: `Payment received — ${invoiceNumber}`,
                    text: `Payment: $${paidAmount} from ${customerName}. Invoice ${invoiceNumber}. Check admin.`,
                    html: paymentHtml,
                  });
                  console.log(`Payment notification sent for ${invoiceNumber} ($${paidAmount})`);
                } catch (emailErr) {
                  console.error("Failed to send payment notification email:", emailErr);
                }
              }
            }
          } catch (err) {
            console.error("QB webhook processing error:", err);
          }
        }
      }
    }
  }
);

// ─── WO-FDACS-D3: PDF generation on tech_completion invoice creation ─────────

function fmtSignedAt(ts) {
  if (!ts) return '';
  if (ts.toDate) return ts.toDate().toISOString();
  if (ts._seconds != null) return new Date(ts._seconds * 1000).toISOString();
  return String(ts);
}

async function buildAndStoreFdacsPdf(invoiceId, invoice) {
  if (!invoice.bookingId) {
    throw new Error('tech_completion invoice missing bookingId');
  }
  const bookingSnap = await firestoreDb.collection('bookings').doc(invoice.bookingId).get();
  if (!bookingSnap.exists) {
    throw new Error(`booking ${invoice.bookingId} not found`);
  }

  const businessSnap = await firestoreDb.doc('settings/business').get();
  if (!businessSnap.exists) {
    throw new Error('settings/business doc not found — run scripts/seed-fdacs-business-settings.js');
  }
  const business = businessSnap.data();

  const disclosures = buildDisclosures(invoice, business);
  const html = buildFdacsHtml(invoice, business, disclosures, {
    documentType: 'INVOICE',
    signatureBase64:
      invoice.customerCompletionSignatureUrl ||
      invoice.customerSignatureUrl ||
      null,
    signedAt: fmtSignedAt(invoice.customerCompletionSignedAt),
  });

  const pdfBuffer = await generatePdfFromHtml(html);

  const path = `fdacs-pdfs/${invoiceId}/${Date.now()}.pdf`;
  const token = crypto.randomUUID();
  const bucket = admin.storage().bucket();
  await bucket.file(path).save(pdfBuffer, {
    contentType: 'application/pdf',
    metadata: {
      metadata: {
        firebaseStorageDownloadTokens: token,
        invoiceId,
        generatedBy: 'D3',
      },
    },
  });

  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  return { url, path };
}

exports.generateFdacsInvoicePdfOnCreate = onDocumentCreated(
  {
    document: 'invoices/{invoiceId}',
    region: 'us-east1',
    memory: '1GiB',
    timeoutSeconds: 120,
  },
  async (event) => {
    const invoiceId = event.params.invoiceId;
    const invoice = event.data.data();

    if (invoice.source !== 'tech_completion') {
      console.log(`[D3] skip ${invoiceId}: source=${invoice.source} (not tech_completion)`);
      return;
    }
    if (invoice.customerInvoicePdfUrl) {
      console.log(`[D3] skip ${invoiceId}: customerInvoicePdfUrl already present`);
      return;
    }

    try {
      const { url, path } = await buildAndStoreFdacsPdf(invoiceId, invoice);
      await event.data.ref.update({
        customerInvoicePdfUrl: url,
        customerInvoicePdfPath: path,
        customerInvoicePdfGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        customerInvoicePdfError: admin.firestore.FieldValue.delete(),
      });
      console.log(`[D3] generated PDF for ${invoiceId} at ${path}`);
    } catch (err) {
      console.error(`[D3] failed for ${invoiceId}:`, err);
      await event.data.ref
        .update({
          customerInvoicePdfError: err.message || String(err),
        })
        .catch((e) => console.error('[D3] failed to write error field:', e));
      // Do NOT re-throw — retry-loop on a structurally bad invoice is worse than a silent skip.
    }
  }
);

exports.regenerateFdacsInvoicePdf = onCall(
  {
    region: 'us-east1',
    memory: '1GiB',
    timeoutSeconds: 120,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required');
    }
    const userSnap = await firestoreDb.collection('users').doc(request.auth.uid).get();
    if (!userSnap.exists) {
      throw new HttpsError('permission-denied', 'Admin role required');
    }
    const userData = userSnap.data() || {};
    if (userData.role !== 'admin' || userData.isActive !== true) {
      throw new HttpsError('permission-denied', 'Admin role required');
    }

    const invoiceId = request.data?.invoiceId;
    if (!invoiceId || typeof invoiceId !== 'string') {
      throw new HttpsError('invalid-argument', 'invoiceId required');
    }

    const invoiceRef = firestoreDb.collection('invoices').doc(invoiceId);
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists) {
      throw new HttpsError('not-found', 'Invoice not found');
    }
    const invoice = invoiceSnap.data();

    if (invoice.source !== 'tech_completion') {
      throw new HttpsError(
        'failed-precondition',
        'Only tech_completion invoices have FDACS PDFs'
      );
    }

    const { url, path } = await buildAndStoreFdacsPdf(invoiceId, invoice);
    await invoiceRef.update({
      customerInvoicePdfUrl: url,
      customerInvoicePdfPath: path,
      customerInvoicePdfGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      customerInvoicePdfError: admin.firestore.FieldValue.delete(),
    });

    return { ok: true, customerInvoicePdfUrl: url, customerInvoicePdfPath: path };
  }
);

module.exports.buildAndStoreFdacsPdf = buildAndStoreFdacsPdf;

// Attempt to attach the FDACS PDF to a customer invoice email.
// Tries Storage download first; on failure (or missing path), tries one
// regen via buildAndStoreFdacsPdf. Returns the attachments array (possibly
// empty) plus an attach error string if the PDF could not be sourced.
async function attachFdacsPdf(invoiceId, invoice, invoiceRef) {
  const attachments = [];
  const filename = `Coastal-Invoice-${invoice.invoiceNumber || invoiceId}.pdf`;
  const bucket = admin.storage().bucket();

  async function downloadAt(path) {
    const [buf] = await bucket.file(path).download();
    return buf;
  }

  try {
    if (invoice.customerInvoicePdfPath) {
      const buf = await downloadAt(invoice.customerInvoicePdfPath);
      attachments.push({ filename, content: buf, contentType: 'application/pdf' });
      return { attachments, pdfErr: null };
    }
    throw new Error('customerInvoicePdfPath missing on invoice');
  } catch (err) {
    console.error('[D-EMAIL] failed to download FDACS PDF, attempting regen:', err.message || err);
    try {
      const { path } = await buildAndStoreFdacsPdf(invoiceId, invoice);
      const buf = await downloadAt(path);
      attachments.push({ filename, content: buf, contentType: 'application/pdf' });
      if (invoiceRef) {
        await invoiceRef.update({
          customerInvoicePdfAttachError: admin.firestore.FieldValue.delete(),
        }).catch((e) => console.error('[D-EMAIL] failed clearing attach-error field:', e));
      }
      return { attachments, pdfErr: null };
    } catch (regenErr) {
      console.error('[D-EMAIL] regen-on-attach also failed:', regenErr.message || regenErr);
      const msg = regenErr.message || String(regenErr);
      if (invoiceRef) {
        await invoiceRef.update({
          customerInvoicePdfAttachError: msg,
        }).catch((e) => console.error('[D-EMAIL] failed writing attach-error field:', e));
      }
      return { attachments: [], pdfErr: msg };
    }
  }
}

// WO-FDACS-E — Upload the FDACS PDF as a QB Attachable on a tech_completion
// invoice's QB record. Idempotent (skips if invoice.qbAttachableId is set).
// Failure is logged + persisted to invoice.qbAttachableError but never thrown
// — the QB invoice and customer email path must not block on metadata.
async function uploadFdacsPdfToQb({
  invoice,
  invoiceId,
  qbInvoiceId,
  accessToken,
  realmId,
  invoiceRef,
}) {
  if (!qbInvoiceId) return { skipped: true, reason: "missing qbInvoiceId" };
  if (invoice?.qbAttachableId) {
    return { skipped: true, reason: "already attached", attachableId: invoice.qbAttachableId };
  }
  try {
    const bucket = admin.storage().bucket();
    let pdfBuffer;
    try {
      if (!invoice.customerInvoicePdfPath) throw new Error("customerInvoicePdfPath missing");
      [pdfBuffer] = await bucket.file(invoice.customerInvoicePdfPath).download();
    } catch (downloadErr) {
      console.warn("[E] PDF download failed, attempting regen:", downloadErr.message || downloadErr);
      const { path } = await buildAndStoreFdacsPdf(invoiceId, invoice);
      [pdfBuffer] = await bucket.file(path).download();
    }

    const filename = `Coastal-Invoice-${invoice.invoiceNumber || invoiceId}.pdf`;
    const metadataJson = JSON.stringify({
      AttachableRef: [{
        EntityRef: { type: "Invoice", value: String(qbInvoiceId) },
        // Customer already gets the PDF via our D-EMAIL path; don't duplicate
        // by letting QB attach it on its own send too.
        IncludeOnSend: false,
      }],
      FileName: filename,
      ContentType: "application/pdf",
    });

    // Build the multipart body manually as a Buffer. The form-data library +
    // global fetch combo trips QB's parser ("Could find no Content-Disposition
    // header within part"); a hand-rolled body with a fixed Content-Length is
    // more reliable for QB's strict /upload endpoint.
    const boundary = `----CoastalFDACSAttach${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    const CRLF = "\r\n";
    const part1 = Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="file_metadata_0"${CRLF}` +
      `Content-Type: application/json${CRLF}${CRLF}` +
      metadataJson + CRLF
    );
    const part2Header = Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="file_content_0"; filename="${filename}"${CRLF}` +
      `Content-Type: application/pdf${CRLF}${CRLF}`
    );
    const part2Footer = Buffer.from(`${CRLF}--${boundary}--${CRLF}`);
    const multipartBody = Buffer.concat([part1, part2Header, pdfBuffer, part2Footer]);

    const uploadRes = await fetch(
      `https://${QB_BASE}/v3/company/${realmId}/upload?minorversion=75`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": String(multipartBody.length),
        },
        body: multipartBody,
      }
    );

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      throw new Error(`QB Attachable upload failed: ${uploadRes.status} ${errBody}`);
    }

    const uploadJson = await uploadRes.json();
    const attachableId = uploadJson.AttachableResponse?.[0]?.Attachable?.Id;
    if (!attachableId) {
      throw new Error(`QB Attachable response missing ID: ${JSON.stringify(uploadJson)}`);
    }

    await invoiceRef.update({
      qbAttachableId: attachableId,
      qbAttachableUploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      qbAttachableError: admin.firestore.FieldValue.delete(),
    });
    console.log(`[E] Attached PDF to QB invoice ${qbInvoiceId} as Attachable ${attachableId}`);
    return { ok: true, attachableId };
  } catch (err) {
    console.error("[E] Attachable upload failed:", err);
    try {
      await invoiceRef.update({ qbAttachableError: err.message || String(err) });
    } catch (writeErr) {
      console.error("[E] Failed to write qbAttachableError:", writeErr);
    }
    return { ok: false, error: err.message || String(err) };
  }
}

module.exports.uploadFdacsPdfToQb = uploadFdacsPdfToQb;

// Build + send the FDACS-compliant customer invoice email (HTML body + PDF
// attachment). Used by both QB and non-QB send paths whenever
// invoice.source === 'tech_completion'. Throws on send failure so callers can
// surface a 500. Returns { attachments, pdfErr }.
async function sendFdacsCustomerEmail({
  invoiceId,
  invoice,
  paymentLink,
  recipientEmail,
  transporter,
  fromAddr,
}) {
  const invoiceRef = firestoreDb.collection('invoices').doc(invoiceId);

  const bookingSnap = invoice.bookingId
    ? await firestoreDb.collection('bookings').doc(invoice.bookingId).get()
    : null;
  const booking = bookingSnap && bookingSnap.exists ? bookingSnap.data() : {};

  const businessSnap = await firestoreDb.doc('settings/business').get();
  const business = businessSnap.exists ? businessSnap.data() : {};

  const html = renderFdacsEmailHtml(invoice, booking, business, paymentLink || '');
  const { attachments, pdfErr } = await attachFdacsPdf(invoiceId, invoice, invoiceRef);

  await transporter.sendMail({
    from: fromAddr,
    to: recipientEmail || invoice.customerEmail,
    bcc: 'info@coastalmobilelube.com',
    replyTo: 'info@coastalmobilelube.com',
    subject: `Invoice ${invoice.invoiceNumber} - Coastal Mobile Lube & Tire`,
    html,
    attachments,
  });

  return { attachments, pdfErr };
}

// WO-DRIVE-MIRROR — auto-mirror sent FDACS invoices to Coastal Operations Shared Drive.
// Runtime SA pinned to firebase-adminsdk-fbsvc (the SA Jon added as Content Manager
// on the Shared Drive); the project default compute SA does not have Drive access.
const DRIVE_MIRROR_RUNTIME_SA = 'firebase-adminsdk-fbsvc@coastal-mobile-lube.iam.gserviceaccount.com';

exports.mirrorInvoiceToDriveOnSent = onDocumentUpdated(
  {
    document: 'invoices/{invoiceId}',
    region: 'us-east1',
    memory: '512MiB',
    timeoutSeconds: 180,
    serviceAccount: DRIVE_MIRROR_RUNTIME_SA,
  },
  async (event) => {
    const invoiceId = event.params.invoiceId;
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status === 'sent' || after.status !== 'sent') {
      return;
    }
    if (after.source !== 'tech_completion') {
      console.log(`[DRIVE-MIRROR] skip ${invoiceId}: source=${after.source}`);
      return;
    }
    if (after.driveMirrorAt) {
      console.log(`[DRIVE-MIRROR] skip ${invoiceId}: already mirrored`);
      return;
    }

    try {
      let booking = null;
      if (after.bookingId) {
        const bkSnap = await firestoreDb.collection('bookings').doc(after.bookingId).get();
        if (bkSnap.exists) booking = bkSnap.data();
      }

      const result = await mirrorInvoiceToDriveHelper(invoiceId, after, booking);

      const update = {
        driveJobFolderId: result.driveJobFolderId,
        driveJobFolderUrl: result.driveJobFolderUrl,
        drivePdfFileId: result.drivePdfFileId,
        drivePdfUrl: result.drivePdfUrl,
        driveMirrorAt: admin.firestore.FieldValue.serverTimestamp(),
        driveMirrorError: admin.firestore.FieldValue.delete(),
      };
      if (result.partial) {
        update.driveMirrorPartial = true;
      } else {
        update.driveMirrorPartial = admin.firestore.FieldValue.delete();
      }
      await event.data.after.ref.update(update);

      console.log(`[DRIVE-MIRROR] mirrored ${invoiceId} to ${result.driveJobFolderUrl}`);
    } catch (err) {
      console.error(`[DRIVE-MIRROR] failed for ${invoiceId}:`, err);
      await event.data.after.ref
        .update({ driveMirrorError: err.message || String(err) })
        .catch((e) => console.error('[DRIVE-MIRROR] failed to write error field:', e));
    }
  }
);

exports.mirrorInvoiceToDriveCallable = onCall(
  {
    region: 'us-east1',
    memory: '512MiB',
    timeoutSeconds: 180,
    serviceAccount: DRIVE_MIRROR_RUNTIME_SA,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required');
    }
    const userSnap = await firestoreDb.collection('users').doc(request.auth.uid).get();
    if (!userSnap.exists) {
      throw new HttpsError('permission-denied', 'Admin role required');
    }
    const userData = userSnap.data() || {};
    if (userData.role !== 'admin' || userData.isActive !== true) {
      throw new HttpsError('permission-denied', 'Admin role required');
    }

    const invoiceId = request.data?.invoiceId;
    if (!invoiceId || typeof invoiceId !== 'string') {
      throw new HttpsError('invalid-argument', 'invoiceId required');
    }

    const invoiceRef = firestoreDb.collection('invoices').doc(invoiceId);
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists) {
      throw new HttpsError('not-found', 'Invoice not found');
    }
    const invoice = invoiceSnap.data();

    if (invoice.source !== 'tech_completion') {
      throw new HttpsError(
        'failed-precondition',
        'Only tech_completion invoices mirror to Drive'
      );
    }

    let booking = null;
    if (invoice.bookingId) {
      const bkSnap = await firestoreDb.collection('bookings').doc(invoice.bookingId).get();
      if (bkSnap.exists) booking = bkSnap.data();
    }

    const result = await mirrorInvoiceToDriveHelper(invoiceId, invoice, booking);

    const update = {
      driveJobFolderId: result.driveJobFolderId,
      driveJobFolderUrl: result.driveJobFolderUrl,
      drivePdfFileId: result.drivePdfFileId,
      drivePdfUrl: result.drivePdfUrl,
      driveMirrorAt: admin.firestore.FieldValue.serverTimestamp(),
      driveMirrorError: admin.firestore.FieldValue.delete(),
    };
    if (result.partial) {
      update.driveMirrorPartial = true;
    } else {
      update.driveMirrorPartial = admin.firestore.FieldValue.delete();
    }
    await invoiceRef.update(update);

    return {
      ok: true,
      driveJobFolderUrl: result.driveJobFolderUrl,
      drivePdfUrl: result.drivePdfUrl,
      partial: result.partial,
    };
  }
);

// =====================================================================
// A1 — syncTeamConsistency (scheduled job)
// Daily reconciliation between users/{uid}.role + team/coastal.members[]
// =====================================================================

const { onSchedule } = require('firebase-functions/v2/scheduler');

exports.syncTeamConsistency = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'us-east1',
    timeZone: 'America/New_York',
  },
  async () => {
    const db = admin.firestore();

    const usersSnap = await db.collection('users').get();
    const usersByUid = new Map();
    usersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.isActive !== false) {
        usersByUid.set(doc.id, {
          uid: doc.id,
          email: data.email || null,
          displayName: data.displayName || null,
          role: data.role || null,
          isActive: data.isActive !== false,
        });
      }
    });

    const teamRef = db.collection('team').doc('coastal');
    const teamSnap = await teamRef.get();
    const currentMembers = (teamSnap.data() && teamSnap.data().members) || [];

    const canonicalMembers = Array.from(usersByUid.values()).map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      active: u.isActive,
    }));

    const drift = [];
    const currentByUid = new Map(currentMembers.map((m) => [m.uid, m]));
    for (const c of canonicalMembers) {
      const existing = currentByUid.get(c.uid);
      if (!existing) drift.push({ uid: c.uid, type: 'missing_from_team' });
      else if (existing.role !== c.role)
        drift.push({ uid: c.uid, type: 'role_mismatch', current: existing.role, canonical: c.role });
      else if (existing.active !== c.active)
        drift.push({ uid: c.uid, type: 'active_mismatch' });
    }
    for (const m of currentMembers) {
      if (!usersByUid.has(m.uid) && m.active !== false) {
        drift.push({ uid: m.uid, type: 'orphan_in_team' });
      }
    }

    await teamRef.set(
      {
        members: canonicalMembers,
        lastConsistencyCheckAt: admin.firestore.FieldValue.serverTimestamp(),
        lastConsistencyDrift: drift,
      },
      { merge: true }
    );

    console.log(
      `syncTeamConsistency: ${canonicalMembers.length} members, ${drift.length} drift entries`
    );
    return null;
  }
);
