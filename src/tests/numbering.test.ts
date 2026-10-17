import { describe, it, expect } from 'vitest';
import {
  formatInvoiceNumber,
  getNextAvailableInvoiceNumber,
  getNextInvoiceNumberFromLatest,
} from '../utils/numbering';
import { InvoiceNumberConfig } from '../types';

describe('Invoice Numbering System', () => {
  it('formats invoice number correctly with TK prefix, 2-digit BE year, and 3-digit sequence: "TK69 021"', () => {
    const config: InvoiceNumberConfig = {
      prefix: 'TK',
      yearFormat: 'be_2',
      separator: ' ',
      sequenceWidth: 3,
      nextSequence: 21,
    };

    // Using year 2026 (BE 2569 => "69")
    const result = formatInvoiceNumber(config, 21, '2026-09-04');
    expect(result).toBe('TK69 021');
  });

  it('supports 4-digit BE year with slash separator, e.g. "INV-2569/001"', () => {
    const config: InvoiceNumberConfig = {
      prefix: 'INV-',
      yearFormat: 'be_4',
      separator: '/',
      sequenceWidth: 3,
      nextSequence: 1,
    };

    const result = formatInvoiceNumber(config, 1, '2026-01-15');
    expect(result).toBe('INV-2569/001');
  });

  it('finds next available number avoiding collisions in existing saved database', () => {
    const config: InvoiceNumberConfig = {
      prefix: 'TK',
      yearFormat: 'be_2',
      separator: ' ',
      sequenceWidth: 3,
      nextSequence: 1,
    };

    const existing = ['TK69 001', 'TK69 002'];
    const next = getNextAvailableInvoiceNumber(config, existing, '2026-10-16');

    expect(next.invoiceNumber).toBe('TK69 003');
    expect(next.sequence).toBe(3);
  });

  it('increments sequence past highest sequence in existing invoices (e.g. latest TK69 005 gives TK69 006)', () => {
    const config: InvoiceNumberConfig = {
      prefix: 'TK',
      yearFormat: 'be_2',
      separator: ' ',
      sequenceWidth: 3,
      nextSequence: 1, // config might say 1, but existing has 005
    };

    const existing = ['TK69 001', 'TK69 005'];
    const next = getNextAvailableInvoiceNumber(config, existing, '2026-10-16');

    expect(next.invoiceNumber).toBe('TK69 006');
    expect(next.sequence).toBe(6);
  });

  it('runs invoice number up from the latest invoice correctly', () => {
    const config: InvoiceNumberConfig = {
      prefix: 'TK',
      yearFormat: 'be_2',
      separator: ' ',
      sequenceWidth: 3,
      nextSequence: 1,
    };

    // Case: latest invoice was TK69 021 -> should run up to TK69 022
    const next1 = getNextInvoiceNumberFromLatest('TK69 021', config, ['TK69 021'], '2026-10-16');
    expect(next1.invoiceNumber).toBe('TK69 022');

    // Case: custom format like INV-2569/009 -> should run up to INV-2569/010
    const next2 = getNextInvoiceNumberFromLatest('INV-2569/009', config, ['INV-2569/009'], '2026-10-16');
    expect(next2.invoiceNumber).toBe('INV-2569/010');

    // Case: hyphenated number TK69-099 -> should run up to TK69-100
    const next3 = getNextInvoiceNumberFromLatest('TK69-099', config, ['TK69-099'], '2026-10-16');
    expect(next3.invoiceNumber).toBe('TK69-100');

    // Case: undefined latest invoice (no saved invoices yet) -> falls back to config
    const next4 = getNextInvoiceNumberFromLatest(undefined, config, [], '2026-10-16');
    expect(next4.invoiceNumber).toBe('TK69 001');
  });

  it('increments custom numbers directly (+1), e.g. "01" -> "02"', async () => {
    const { incrementInvoiceNumber } = await import('../utils/numbering');
    expect(incrementInvoiceNumber('01')).toBe('02');
    expect(incrementInvoiceNumber('02')).toBe('03');
    expect(incrementInvoiceNumber('09')).toBe('10');
    expect(incrementInvoiceNumber('1')).toBe('2');
    expect(incrementInvoiceNumber('TK69 021')).toBe('TK69 022');
    expect(incrementInvoiceNumber('INV-005')).toBe('INV-006');
  });
});
