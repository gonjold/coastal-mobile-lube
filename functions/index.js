const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const firestoreDb = admin.firestore();

const gmailUser = defineSecret("GMAIL_USER");
const gmailAppPassword = defineSecret("GMAIL_APP_PASSWORD");
const qbClientId = defineSecret("QB_CLIENT_ID");
const qbClientSecret = defineSecret("QB_CLIENT_SECRET");

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
      await transporter.sendMail({
        from: `"Coastal Mobile Lube" <${gmailUser.value()}>`,
        to: "jon@jgoldco.com",
        bcc: "9492926686@txt.att.net",
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
  "https://coastal-mobile-lube.netlify.app",
  "https://coastalmobilelube.com",
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
          <a href="tel:+18132775500" style="color:#1A5FAC;font-weight:600;text-decoration:none;">(813) 277-5500</a>
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
        cc: "info@coastalmobilelube.com",
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
    doc.text('For questions about this invoice, call or text us at (813) 277-5500.', 66, y + 42);

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

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser.value(),
        pass: gmailAppPassword.value(),
      },
    });

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
  const qbDoc = await firestoreDb.collection("settings").doc("quickbooks").get();
  if (!qbDoc.exists) throw new Error("QuickBooks not connected");

  const qbData = qbDoc.data();
  const now = new Date();
  const expiresAt = new Date(qbData.accessTokenExpiresAt);

  // If token expires within 5 minutes, refresh it
  if (now >= new Date(expiresAt.getTime() - 5 * 60 * 1000)) {
    const tokenResponse = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${qbClientId.value()}:${qbClientSecret.value()}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: qbData.refreshToken,
      }),
    });

    const tokens = await tokenResponse.json();
    if (tokens.error) throw new Error(`Token refresh failed: ${tokens.error}`);

    await firestoreDb.collection("settings").doc("quickbooks").update({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString(),
    });

    return { accessToken: tokens.access_token, realmId: qbData.realmId };
  }

  return { accessToken: qbData.accessToken, realmId: qbData.realmId };
}

// ─── QuickBooks: Customer sync helper ─────────────────────────────

const QB_BASE = "sandbox-quickbooks.api.intuit.com";

async function syncCustomerToQB(customerData) {
  const { accessToken, realmId } = await getQBAccessToken();
  const baseUrl = `https://${QB_BASE}/v3/company/${realmId}`;

  // Check if customer already exists by email
  if (customerData.email) {
    const queryResponse = await fetch(
      `${baseUrl}/query?query=${encodeURIComponent(`SELECT * FROM Customer WHERE PrimaryEmailAddr = '${customerData.email}'`)}&minorversion=75`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
    );
    const queryResult = await queryResponse.json();
    if (queryResult.QueryResponse?.Customer?.[0]) {
      return queryResult.QueryResponse.Customer[0].Id;
    }
  }

  // Create new customer
  const qbCustomer = {
    DisplayName: `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim() || customerData.name || "Customer",
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

  return created.Customer.Id;
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
      IncomeAccountRef: { name: "Services", value: "1" },
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

      // 1. Sync customer to QB (or find existing)
      let qbCustomerId;

      if (customerId) {
        const customerDoc = await firestoreDb.collection("customers").doc(customerId).get();
        if (customerDoc.exists && customerDoc.data().qbCustomerId) {
          qbCustomerId = customerDoc.data().qbCustomerId;
        }
      }

      if (!qbCustomerId) {
        qbCustomerId = await syncCustomerToQB({
          firstName: customerName?.split(" ")[0] || "",
          lastName: customerName?.split(" ").slice(1).join(" ") || "",
          email: customerEmail,
          phone: customerPhone,
          address: customerAddress,
        });

        if (customerId) {
          await firestoreDb.collection("customers").doc(customerId).update({ qbCustomerId });
        }
      }

      // 2. Create QB invoice
      const serviceItemId = await getOrCreateQBServiceItem(accessToken, realmId);

      const qbLineItems = (lineItems || []).map((item) => ({
        DetailType: "SalesItemLineDetail",
        Amount: (item.quantity || 1) * parseFloat(item.unitPrice || item.price || 0),
        Description: item.serviceName || item.description || item.name || "Service",
        SalesItemLineDetail: {
          ItemRef: { value: serviceItemId },
          UnitPrice: parseFloat(item.unitPrice || item.price || 0),
          Qty: item.quantity || 1,
        },
      }));

      // Add convenience fee as a line item if present
      if (convenienceFee && parseFloat(convenienceFee) > 0) {
        qbLineItems.push({
          DetailType: "SalesItemLineDetail",
          Amount: parseFloat(convenienceFee),
          Description: "Mobile Service Fee",
          SalesItemLineDetail: {
            ItemRef: { value: serviceItemId },
            UnitPrice: parseFloat(convenienceFee),
            Qty: 1,
          },
        });
      }

      const qbInvoice = {
        CustomerRef: { value: qbCustomerId },
        Line: qbLineItems,
        DocNumber: invoiceNumber,
        BillEmail: { Address: customerEmail },
        AllowOnlineCreditCardPayment: true,
        AllowOnlineACHPayment: true,
        DueDate: dueDate || undefined,
        CustomerMemo: { value: vehicle ? `Vehicle: ${vehicle}` : "Thank you for your business!" },
        EmailStatus: "NotSet",
      };

      const invoiceResponse = await fetch(`${baseUrl}/invoice?minorversion=75`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(qbInvoice),
      });

      const invoiceResult = await invoiceResponse.json();
      if (invoiceResult.Fault) {
        throw new Error(`QB invoice create failed: ${JSON.stringify(invoiceResult.Fault)}`);
      }

      const qbInvoiceId = invoiceResult.Invoice.Id;

      // 3. Get the payment link
      const linkResponse = await fetch(
        `${baseUrl}/invoice/${qbInvoiceId}?minorversion=75&include=invoiceLink`,
        { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
      );

      const linkResult = await linkResponse.json();
      const paymentLink = linkResult.Invoice?.InvoiceLink || "";

      // 4. Save QB invoice ID and payment link to Coastal invoice doc
      if (invoiceId) {
        await firestoreDb.collection("invoices").doc(invoiceId).update({
          qbInvoiceId,
          qbPaymentLink: paymentLink,
          status: "sent",
          sentDate: new Date().toISOString(),
        });
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
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:right;padding:8px 16px;">
              <span style="font-size:11px;color:#888;text-transform:uppercase;">Total Due</span>
              <span style="font-size:24px;font-weight:700;color:#E07B2D;margin-left:16px;">$${parseFloat(total).toFixed(2)}</span>
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
              <p style="font-size:13px;color:#666;margin:2px 0;">For questions, call or text us at <a href="tel:+18132775500" style="color:#1A5FAC;text-decoration:none;font-weight:600;">(813) 277-5500</a>.</p>
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

      await transporter.sendMail({
        from: `"Coastal Mobile Lube" <${gmailUser.value()}>`,
        to: customerEmail,
        cc: "info@coastalmobilelube.com",
        subject: `Invoice ${invoiceNumber} - Coastal Mobile Lube & Tire`,
        html: htmlEmail,
      });

      res.status(200).json({
        success: true,
        qbInvoiceId,
        paymentLink,
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
      await transporter.sendMail({
        from: `"Coastal Mobile Lube" <${gmailUser.value()}>`,
        to: customerEmail,
        cc: "info@coastalmobilelube.com",
        bcc: "9492926686@txt.att.net",
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
    secrets: [qbClientId, qbClientSecret, gmailUser, gmailAppPassword],
  },
  async (req, res) => {
    // Respond immediately
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

                  await transporter.sendMail({
                    from: `"Coastal Mobile Lube" <${gmailUser.value()}>`,
                    to: "info@coastalmobilelube.com",
                    bcc: "9492926686@txt.att.net",
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
