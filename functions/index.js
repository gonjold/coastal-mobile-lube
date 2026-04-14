const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

admin.initializeApp();
const firestoreDb = admin.firestore();

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
        to: "jon@jgoldco.com",
        subject: `New ${categoryLabel} Booking — ${booking.name || formattedPhone}`,
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
