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
 * Finds the next available non-colliding invoice number given existing numbers in the local database.
 */
export function getNextAvailableInvoiceNumber(
  config: InvoiceNumberConfig,
  existingNumbers: string[],
  isoDateString?: string
): { invoiceNumber: string; sequence: number } {
  const existingSet = new Set(existingNumbers.map((n) => n.trim().toLowerCase()));
  let seq = Math.max(1, config.nextSequence || 1);

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
