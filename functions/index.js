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
  const location = booking.address || (booking.zip ? `${booking.zip}, Tampa, FL` : "Tampa, FL");
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

exports.sendConfirmationEmail = onRequest(
  {
    region: "us-east1",
    secrets: [gmailUser, gmailAppPassword],
    cors: true,
  },
  async (req, res) => {
    const { booking, bookingId } = req.body;

    if (!booking || !booking.email) {
      res.json({ success: false, error: "No email address on file" });
      return;
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
    const locationDisplay = booking.address || (booking.zip ? `${booking.zip}, Tampa, FL` : null);

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
