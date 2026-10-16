import { describe, it, expect } from 'vitest';
import {
  calculateInvoiceTotals,
  calculateLineTotal,
  roundToSatang,
  formatCurrency,
} from '../utils/calculations';
import { LineItem } from '../types';

describe('VAT & Financial Calculations', () => {
  it('Deterministic Test 1: No VAT (Mode 0) with 551.00 THB', () => {
    const lineItems: LineItem[] = [
      {
        id: '1',
        description: 'ค่าบริการทดสอบ',
        quantity: 1,
        unitPrice: 551.0,
        total: 551.0,
      },
    ];

    const result = calculateInvoiceTotals(lineItems, '0');

    expect(result.subtotal).toBe(551.0);
    expect(result.vatRate).toBe(0);
    expect(result.vatAmount).toBe(0.0);
    expect(result.netTotal).toBe(551.0);
    expect(result.bahtText).toBe('ห้าร้อยห้าสิบเอ็ดบาทถ้วน');
  });

  it('Deterministic Test 2: VAT Added (Mode +) with 551.00 THB pre-tax', () => {
    const lineItems: LineItem[] = [
      {
        id: '1',
        description: 'สินค้าแยกภาษี',
        quantity: 1,
        unitPrice: 551.0,
        total: 551.0,
      },
    ];

    const result = calculateInvoiceTotals(lineItems, '+');

    expect(result.subtotal).toBe(551.0);
    expect(result.vatRate).toBe(0.07);
    expect(result.vatAmount).toBe(38.57); // 551 * 0.07 = 38.57
    expect(result.netTotal).toBe(589.57); // 551 + 38.57 = 589.57
    expect(result.bahtText).toBe('ห้าร้อยแปดสิบเก้าบาทห้าสิบเจ็ดสตางค์');
  });

  it('Deterministic Test 3: VAT Included (Mode -) with 1,070.00 THB gross total', () => {
    const lineItems: LineItem[] = [
      {
        id: '1',
        description: 'สินค้ารวมภาษี',
        quantity: 1,
        unitPrice: 1070.0,
        total: 1070.0,
      },
    ];

    const result = calculateInvoiceTotals(lineItems, '-');

    expect(result.subtotal).toBe(1000.0); // 1070 / 1.07 = 1000.00
    expect(result.vatAmount).toBe(70.0); // 1070 - 1000 = 70.00
    expect(result.netTotal).toBe(1070.0);
    // Subtotal + VAT must exactly equal net total
    expect(roundToSatang(result.subtotal + result.vatAmount)).toBe(result.netTotal);
    expect(result.bahtText).toBe('หนึ่งพันเจ็ดสิบบาทถ้วน');
  });

  it('handles multiple line items with decimal quantities and prices', () => {
    const lineItems: LineItem[] = [
      {
        id: '1',
        description: 'งานที่ปรึกษา',
        quantity: 2.5,
        unitPrice: 1200.5,
        total: 3001.25, // 2.5 * 1200.5 = 3001.25
      },
      {
        id: '2',
        description: 'ค่าอุปกรณ์',
        quantity: 3,
        unitPrice: 450.75,
        total: 1352.25, // 3 * 450.75 = 1352.25
      },
    ];

    // Subtotal = 3001.25 + 1352.25 = 4353.50
    const result = calculateInvoiceTotals(lineItems, '+');
    expect(result.subtotal).toBe(4353.5);
    // VAT = 4353.50 * 0.07 = 304.745 => rounded to 304.75
    expect(result.vatAmount).toBe(304.75);
    // Net total = 4353.50 + 304.75 = 4658.25
    expect(result.netTotal).toBe(4658.25);
  });

  it('handles zero-value invoices safely', () => {
    const lineItems: LineItem[] = [];
    const result = calculateInvoiceTotals(lineItems, '+');
    expect(result.subtotal).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.netTotal).toBe(0);
    expect(result.bahtText).toBe('ศูนย์บาทถ้วน');
  });

  it('handles invalid or non-finite numeric inputs without crashing', () => {
    expect(calculateLineTotal(NaN, 100)).toBe(0);
    expect(calculateLineTotal(5, -50)).toBe(0);
    expect(calculateLineTotal(Infinity, 10)).toBe(0);
    expect(formatCurrency(NaN)).toBe('0.00');
  });

  it('formats currency correctly with two decimal places and commas', () => {
    expect(formatCurrency(1234567.89)).toBe('1,234,567.89');
    expect(formatCurrency(0)).toBe('0.00');
    expect(formatCurrency(551)).toBe('551.00');
    expect(formatCurrency(1000.5)).toBe('1,000.50');
  });
});
