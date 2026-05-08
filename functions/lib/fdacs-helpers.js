// Shared helpers for FDACS rendering (PDF + email templates).
// Extracted from fdacs-template.js (Path A) so the email template can reuse
// the exact same formatters — keeps PDF and email content one-to-one.

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtCurrency(n) {
  if (n === null || n === undefined || isNaN(n)) return '$0.00';
  return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtVehicleLine(v) {
  if (!v) return '';
  const parts = [v.year, v.make, v.model, v.trim].filter(Boolean);
  return parts.join(' ');
}

// Render a Firestore Timestamp (or Date / ISO string / {_seconds}) as readable Eastern time.
function fmtEastern(ts) {
  if (!ts) return '';
  let d;
  if (ts.toDate) {
    d = ts.toDate();
  } else if (typeof ts === 'object' && typeof ts._seconds === 'number') {
    d = new Date(ts._seconds * 1000);
  } else if (typeof ts === 'object' && typeof ts.seconds === 'number') {
    d = new Date(ts.seconds * 1000);
  } else {
    d = new Date(ts);
  }
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

module.exports = {
  escapeHtml,
  fmtCurrency,
  fmtVehicleLine,
  fmtEastern,
};
