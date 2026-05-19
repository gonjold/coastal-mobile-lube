/* A3e PRIORITY-1: single canonical phone-number formatter for the ops app.
 *
 * Consolidates the two pre-A3e implementations (apps/ops/lib/customerTypes.ts
 * and apps/ops/app/(app)/customers/page.tsx) and patches the long tail of
 * surfaces that previously rendered raw 10-digit strings.
 *
 * Standard display format: (XXX) XXX-XXXX.
 *
 * Edge cases:
 * - Missing / undefined / empty input -> returns the supplied placeholder
 *   (default: empty string). Callers that want a dash can pass '—'.
 * - Already-formatted input (contains parens, dashes, spaces): if the
 *   underlying 10 digits match the standard shape, it's reformatted to
 *   canonical to handle minor variants. If the digits don't form a US
 *   10-digit number, the original is returned as-is.
 * - 11-digit input with leading 1 (e.g. "18134005566"): treated as US
 *   country-code-prefixed and rendered without the +1.
 * - Anything else (international, short codes, invalid): returned as-is.
 */
export function formatPhone(phone: string | null | undefined, placeholder = ''): string {
  if (phone == null) return placeholder;
  const trimmed = String(phone).trim();
  if (trimmed.length === 0) return placeholder;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return trimmed;
}

/** Builds a tel: URL from a raw phone string. Returns null when input is
 * missing or can't be normalized. Use as the href on click-to-call links. */
export function telHref(phone: string | null | undefined): string | null {
  if (phone == null) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `tel:+${digits}`;
  return null;
}
