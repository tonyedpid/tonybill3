import { InvoiceNumberConfig } from '../types';
import { parseIsoDate, toBuddhistEraYear } from './thaiDate';

export const DEFAULT_NUMBER_CONFIG: InvoiceNumberConfig = {
  prefix: 'TK',
  yearFormat: 'be_2',
  separator: ' ',
  sequenceWidth: 3,
  nextSequence: 1,
};

/**
 * Generates an invoice number string from configuration and an issue date.
 * e.g., config { prefix: 'TK', yearFormat: 'be_2', separator: ' ', sequenceWidth: 3, nextSequence: 21 }
 * with year 2026 (BE 2569) => "TK69 021"
 */
export function formatInvoiceNumber(
  config: InvoiceNumberConfig,
  sequenceNum: number,
  isoDateString?: string
): string {
  const parts: string[] = [];

  const prefix = (config.prefix || '').trim();
  const sep = config.separator ?? ' ';

  const parsedDate = isoDateString ? parseIsoDate(isoDateString) : null;
  const now = new Date();
  const year = parsedDate ? parsedDate.year : now.getFullYear();
  const beYear = toBuddhistEraYear(year);

  let yearStr = '';
  switch (config.yearFormat) {
    case 'be_2':
      yearStr = String(beYear).slice(-2);
      break;
    case 'be_4':
      yearStr = String(beYear);
      break;
    case 'ad_2':
      yearStr = String(year).slice(-2);
      break;
    case 'ad_4':
      yearStr = String(year);
      break;
    case 'none':
    default:
      yearStr = '';
      break;
  }

  const prefixWithYear = prefix ? `${prefix}${yearStr}` : yearStr;
  if (prefixWithYear) {
    parts.push(prefixWithYear);
  }

  const paddedSeq = String(Math.max(1, sequenceNum)).padStart(config.sequenceWidth || 3, '0');
  parts.push(paddedSeq);

  return parts.join(sep);
}

/**
 * Extracts sequence number from an invoice number string.
 * For example: "TK69 021" => 21, "INV-2569/005" => 5
 */
export function extractSequenceNumber(invoiceNumber: string): number | null {
  if (!invoiceNumber || typeof invoiceNumber !== 'string') return null;
  const match = invoiceNumber.match(/(\d+)(?!.*\d)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Finds the next available non-colliding invoice number given existing numbers in the local database.
 * Automatically increments past the highest existing sequence number.
 */
export function getNextAvailableInvoiceNumber(
  config: InvoiceNumberConfig,
  existingNumbers: string[],
  isoDateString?: string
): { invoiceNumber: string; sequence: number } {
  const existingSet = new Set(existingNumbers.map((n) => n.trim().toLowerCase()));

  // Find the highest sequence number in existing records
  let maxExistingSeq = 0;
  for (const numStr of existingNumbers) {
    const parsed = extractSequenceNumber(numStr);
    if (parsed !== null && parsed > maxExistingSeq) {
      maxExistingSeq = parsed;
    }
  }

  // Next sequence starts from max of config.nextSequence or (maxExistingSeq + 1)
  let seq = Math.max(1, config.nextSequence || 1, maxExistingSeq > 0 ? maxExistingSeq + 1 : 1);

  while (seq < 999999) {
    const candidate = formatInvoiceNumber(config, seq, isoDateString);
    if (!existingSet.has(candidate.trim().toLowerCase())) {
      return { invoiceNumber: candidate, sequence: seq };
    }
    seq++;
  }

  const fallback = `INV-${Date.now().toString().slice(-6)}`;
  return { invoiceNumber: fallback, sequence: seq };
}

/**
 * Generates the next sequential invoice number by incrementing the numeric portion of the latest invoice.
 * Examples:
 * - "TK69 021" => "TK69 022"
 * - "TK69-001" => "TK69-002"
 * - "INV2569/009" => "INV2569/010"
 * If no latest invoice or formatting pattern is unrecognized, falls back to getNextAvailableInvoiceNumber.
 */
export function getNextInvoiceNumberFromLatest(
  latestInvoiceNumber: string | undefined,
  config: InvoiceNumberConfig,
  existingNumbers: string[],
  isoDateString?: string
): { invoiceNumber: string; sequence: number } {
  const existingSet = new Set(existingNumbers.map((n) => n.trim().toLowerCase()));

  if (latestInvoiceNumber && latestInvoiceNumber.trim()) {
    // Match trailing digits: prefix + digits + suffix
    const match = latestInvoiceNumber.match(/^(.*?)(\d+)([^\d]*)$/);
    if (match) {
      const prefix = match[1];
      const digitsStr = match[2];
      const suffix = match[3];
      const width = digitsStr.length;
      let nextVal = parseInt(digitsStr, 10) + 1;

      // Ensure no collision with any existing invoices
      for (let i = 0; i < 1000; i++) {
        const candidateDigits = String(nextVal).padStart(width, '0');
        const candidate = `${prefix}${candidateDigits}${suffix}`;
        if (!existingSet.has(candidate.trim().toLowerCase())) {
          return { invoiceNumber: candidate, sequence: nextVal };
        }
        nextVal++;
      }
    }
  }

  // Fallback to standard config-based sequence generation
  return getNextAvailableInvoiceNumber(config, existingNumbers, isoDateString);
}

/**
 * Increments the trailing sequence of digits in an invoice number string by +1.
 * Preserves leading zero padding and any prefix/suffix.
 * Examples:
 * - "01" => "02"
 * - "09" => "10"
 * - "99" => "100"
 * - "TK69 001" => "TK69 002"
 * - "INV-2026-001" => "INV-2026-002"
 * - "1" => "2"
 */
export function incrementInvoiceNumber(numStr: string): string {
  if (!numStr || !numStr.trim()) return '';
  const trimmed = numStr.trim();
  const match = trimmed.match(/^(.*?)(\d+)([^\d]*)$/);
  if (match) {
    const prefix = match[1];
    const digitsStr = match[2];
    const suffix = match[3];
    const width = digitsStr.length;
    const nextVal = parseInt(digitsStr, 10) + 1;
    const candidateDigits = String(nextVal).padStart(width, '0');
    return `${prefix}${candidateDigits}${suffix}`;
  }
  return trimmed;
}
