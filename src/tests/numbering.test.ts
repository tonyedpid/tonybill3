import { describe, it, expect } from 'vitest';
import {
  formatInvoiceNumber,
  getNextAvailableInvoiceNumber,
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
});
