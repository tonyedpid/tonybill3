/**
 * Thai Buddhist Era Date Utilities
 * Ensures unambiguous ISO calendar dates without UTC/local timezone shifts
 */

export const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
] as const;

export const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
] as const;

/**
 * Parses YYYY-MM-DD string into year, month (1-12), day without Date timezone shift.
 */
export function parseIsoDate(isoDateString: string): { year: number; month: number; day: number } | null {
  if (!isoDateString || typeof isoDateString !== 'string') return null;
  const match = isoDateString.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/**
 * Returns Thai Buddhist Era year (BE = CE + 543)
 */
export function toBuddhistEraYear(ceYear: number): number {
  return ceYear + 543;
}

/**
 * Formats ISO date string to Thai display string, e.g. "4 กันยายน 2569"
 */
export function formatThaiDate(
  isoDateString: string,
  style: 'full' | 'short' | 'slash' = 'full'
): string {
  const parsed = parseIsoDate(isoDateString);
  if (!parsed) return isoDateString || '-';

  const beYear = toBuddhistEraYear(parsed.year);
  const monthIndex = parsed.month - 1;

  if (style === 'short') {
    return `${parsed.day} ${THAI_MONTHS_SHORT[monthIndex]} ${beYear}`;
  }

  if (style === 'slash') {
    const padDay = String(parsed.day).padStart(2, '0');
    const padMonth = String(parsed.month).padStart(2, '0');
    return `${padDay}/${padMonth}/${beYear}`;
  }

  return `${parsed.day} ${THAI_MONTHS_FULL[monthIndex]} ${beYear}`;
}

/**
 * Returns today's ISO date string: YYYY-MM-DD
 */
export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
