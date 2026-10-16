import { LineItem, VatMode, InvoiceTotals } from '../types';
import { thaiBahtText } from './thaiBahtText';

/**
 * Rounds a number to exactly 2 decimal places (satang) to prevent floating-point inaccuracies.
 * Uses round-half-up.
 */
export function roundToSatang(amount: number): number {
  if (!isFinite(amount) || isNaN(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates a single line item total: quantity * unitPrice
 */
export function calculateLineTotal(quantity: number, unitPrice: number): number {
  const safeQty = isFinite(quantity) && quantity > 0 ? quantity : 0;
  const safePrice = isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0;
  return roundToSatang(safeQty * safePrice);
}

/**
 * Calculates invoice financial totals according to the selected VAT mode:
 * - Mode '0': No VAT
 * - Mode '+': VAT Added (unit prices exclude VAT)
 * - Mode '-': VAT Included (unit prices already include 7% VAT)
 */
export function calculateInvoiceTotals(lineItems: LineItem[], vatMode: VatMode): InvoiceTotals {
  // Sum of individual line totals
  const rawSum = lineItems.reduce((acc, item) => {
    const itemTotal = calculateLineTotal(item.quantity, item.unitPrice);
    return acc + itemTotal;
  }, 0);

  const roundedSum = roundToSatang(rawSum);

  let subtotal = 0;
  let vatAmount = 0;
  let netTotal = 0;
  const vatRate = vatMode === '0' ? 0 : 0.07;

  if (vatMode === '0') {
    // Mode A: No VAT
    subtotal = roundedSum;
    vatAmount = 0;
    netTotal = roundedSum;
  } else if (vatMode === '+') {
    // Mode B: VAT Added
    subtotal = roundedSum;
    vatAmount = roundToSatang(subtotal * 0.07);
    netTotal = roundToSatang(subtotal + vatAmount);
  } else if (vatMode === '-') {
    // Mode C: VAT Included
    const grossTotal = roundedSum;
    // Pre-tax subtotal = gross / 1.07
    subtotal = roundToSatang(grossTotal / 1.07);
    // VAT = gross - pre-tax subtotal (ensures mathematical reconciliation: subtotal + vat === netTotal)
    vatAmount = roundToSatang(grossTotal - subtotal);
    netTotal = grossTotal;
  }

  const bahtText = thaiBahtText(netTotal);

  return {
    subtotal,
    vatRate,
    vatAmount,
    netTotal,
    bahtText,
  };
}

/**
 * Formats a number to Thai currency format (#,##0.00)
 */
export function formatCurrency(amount: number): string {
  if (!isFinite(amount) || isNaN(amount)) {
    return '0.00';
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats quantity (supports integer or decimal up to 2 decimal places)
 */
export function formatQuantity(qty: number): string {
  if (!isFinite(qty) || isNaN(qty)) return '0';
  if (Number.isInteger(qty)) {
    return qty.toString();
  }
  return qty.toFixed(2).replace(/\.?0+$/, '');
}
