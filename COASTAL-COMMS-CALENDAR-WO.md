# WO: Comms Log + Google Calendar + Notification Buttons
## Coastal Mobile Lube & Tire — 2026-03-24

Read `src/app/admin/page.tsx` IN FULL before making any changes. This WO only modifies the admin page. Surgical edits — do not rewrite the entire file.

---

## CHANGE 1 — Comms Log on each booking

In the expanded booking detail section (the card that shows when you click a row), add a "Communication Log" section BELOW the Admin Notes section.

### Data structure
Each booking document in Firestore will have a `commsLog` array field. Each entry:
```javascript
{
  id: crypto.randomUUID(),       // unique ID
  type: "call" | "text" | "email" | "note",  // type of communication
  direction: "outbound" | "inbound",  // did we contact them or did they contact us
  summary: "string",             // what happened (free text)
  createdAt: new Date().toISOString(),  // when this log entry was created
  createdBy: "admin"             // who logged it (hardcoded for now, no auth)
}
```

### UI: Log entry form
Below the Admin Notes textarea and Save Notes button, add:

**Section header:** "Communication Log" (navy, weight 700, 18px)

**New entry form** (compact, inline):
- Row 1: 
  - Type selector: four small pill buttons — "Call" | "Text" | "Email" | "Note" (default "Call" selected, use icon + text: phone icon for Call, message icon for Text, mail icon for Email, pencil icon for Note). Selected pill gets navy bg + white text.
  - Direction toggle: "Outbound" | "Inbound" (two small toggle buttons, default "Outbound")
- Row 2:
  - Text input: placeholder "What happened?" (full width)
  - "Log" button (navy, compact) at the end

On clicking "Log":
1. Read the current `commsLog` array from the booking doc (or default to [])
2. Push the new entry to the array
3. Write back to Firestore: `updateDoc(doc(db, 'bookings', id), { commsLog: arrayUnion(newEntry) })`
4. Clear the input, show the new entry in the log below

### UI: Log history
Below the form, show all previous log entries in reverse chronological order (newest first):

Each entry as a compact row:
```
[Call icon] Outbound — "Called customer, left voicemail"          Mar 24, 3:45 PM
[Text icon] Outbound — "Sent confirmation text"                   Mar 24, 3:30 PM  
[Email icon] Outbound — "Sent quote to jonrgold@gmail.com"        Mar 24, 3:15 PM
```

- Icon matches the type (use simple SVG or unicode: phone, message bubble, envelope, pencil)
- Direction shown as badge or prefix
- Summary text in regular weight
- Timestamp right-aligned, gray, small
- If no entries yet, show "No communication logged yet" in gray italic

---

## CHANGE 2 — Google Calendar integration

### 2a — "Add to Calendar" button on confirmed bookings
In the expanded booking detail, add an "Add to Google Calendar" button. Show this button when status is "confirmed" or when the admin clicks "Confirm".

The button generates a Google Calendar URL and opens it in a new tab:

```javascript
function generateGCalUrl(booking) {
  const title = encodeURIComponent(`Coastal Mobile - ${booking.service || 'Service'} - ${booking.name || 'Customer'}`);
  
  // Use preferredDate if available, otherwise use tomorrow
  const dateStr = booking.preferredDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  // Default to 9 AM - 10 AM in the booking's time window
  let startHour = '09';
  if (booking.timeWindow === 'midday') startHour = '11';
  if (booking.timeWindow === 'afternoon') startHour = '14';
  
  const startDate = dateStr.replace(/-/g, '') + 'T' + startHour + '0000';
  const endDate = dateStr.replace(/-/g, '') + 'T' + (parseInt(startHour) + 1).toString().padStart(2, '0') + '0000';
  
  const details = encodeURIComponent(
    `Service: ${booking.service || 'TBD'}\\n` +
    `Customer: ${booking.name || 'N/A'}\\n` +
    `Phone: ${booking.phone || 'N/A'}\\n` +
    `Email: ${booking.email || 'N/A'}\\n` +
    `Contact Pref: ${booking.contactPreference || 'N/A'}\\n` +
    `Source: ${booking.source || 'N/A'}\\n` +
    `Notes: ${booking.notes || 'None'}\\n` +
    `Admin: https://coastal-mobile-lube.netlify.app/admin`
  );
  
  const location = encodeURIComponent(booking.address || booking.zip || 'Tampa, FL');
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}
```

**Button styling:** 
- White background, navy border, navy text
- Google Calendar icon (use a simple calendar SVG icon)
- Text: "Add to Google Calendar"
- Opens in new tab: `window.open(url, '_blank')`

### 2b — Auto-prompt calendar after confirming
When the admin clicks the "Confirm" button on a booking:
1. Update status to "confirmed" (existing behavior)
2. Show a small toast/banner: "Booking confirmed! [Add to Calendar]" with the calendar link
3. Also auto-log a comms entry: `{ type: "note", direction: "outbound", summary: "Booking confirmed", ... }`

---

## CHANGE 3 — Notification action buttons

In the expanded booking detail, add a "Send Notification" section BETWEEN the booking details grid and the Admin Notes section.

### UI: Two action buttons side by side

**Button 1: "Send Confirmation Email"**
- Blue background, white text, envelope icon
- Only enabled if booking has an email address
- Disabled state: grayed out with tooltip "No email on file"
- On click:
  1. Show a confirmation modal/dialog: "Send confirmation email to {email}?" with the email content preview
  2. If confirmed, log a comms entry: `{ type: "email", direction: "outbound", summary: "Confirmation email sent to {email}" }`
  3. Show success toast: "Email logged. (Email delivery coming soon)"
  4. Note: actual email sending will be wired up post-pitch. For now, it logs the action.

**Button 2: "Send Confirmation Text"**  
- Green background, white text, message icon
- Only enabled if booking has a phone number
- On click:
  1. Show confirmation: "Send confirmation text to {formatted phone}?"
  2. If confirmed, log a comms entry: `{ type: "text", direction: "outbound", summary: "Confirmation text sent to {phone}" }`
  3. Show success toast: "Text logged. (SMS delivery coming soon)"
  4. Note: actual SMS sending will be wired up post-pitch with Twilio. For now, it logs the action.

**Button 3: "Call Customer"**
- Orange background, white text, phone icon
- Clickable as a `tel:` link (opens phone dialer)
- Also logs a comms entry on click: `{ type: "call", direction: "outbound", summary: "Initiated call to {phone}" }`

### Layout
Three buttons in a row, equal width, with spacing between them. On mobile, stack vertically.

---

## CHANGE 4 — Toast notification system

Add a simple toast notification component to the admin page. When actions happen (confirm booking, log comms, save notes, etc.), show a toast in the bottom-right corner:

- Slide in from right, auto-dismiss after 3 seconds
- Green background for success, blue for info
- White text, rounded-8, shadow-lg
- Small "x" to dismiss early
- Stack multiple toasts vertically if needed

Implementation: simple React state array of toast messages, rendered as fixed-position elements.

---

## IMPORTANT: File size management

The admin page.tsx is getting large. If it's already over 500 lines, consider extracting these into separate components in a `src/app/admin/` directory:
- `src/app/admin/CommsLog.tsx` — the comms log form + history
- `src/app/admin/NotificationButtons.tsx` — the three notification action buttons  
- `src/app/admin/Toast.tsx` — the toast notification component
- `src/app/admin/CalendarView.tsx` — the calendar grid (if not already extracted)

Import them into page.tsx. This prevents the file from becoming too large for reliable editing.

---

## BUILD AND DEPLOY

```
npm run build && netlify deploy --prod && git add -A && git commit -m "feat: comms log, google calendar link, notification buttons, toast system" && git push origin main
```
