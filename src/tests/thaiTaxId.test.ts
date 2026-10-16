import { describe, it, expect } from 'vitest';
import { validateThaiTaxId, cleanTaxId, formatThaiTaxId } from '../utils/thaiTaxId';

describe('Thai Tax ID / Citizen ID Validation', () => {
  it('validates a correct Thai tax identification number', () => {
    // 0105556108420
    const res = validateThaiTaxId('0105556108420');
    expect(res.isValid).toBe(true);
  });

  it('validates another valid Thai juristic tax ID', () => {
    // 0105561025782
    const res = validateThaiTaxId('0105561025782');
    expect(res.isValid).toBe(true);
  });

  it('rejects an invalid check digit', () => {
    const res = validateThaiTaxId('0105556108429'); // wrong check digit
    expect(res.isValid).toBe(false);
    expect(res.message).toContain('Check digit');
  });

  it('rejects inputs that do not have exactly 13 digits', () => {
    expect(validateThaiTaxId('12345').isValid).toBe(false);
    expect(validateThaiTaxId('').isValid).toBe(false);
  });

  it('rejects numbers with all identical digits', () => {
    expect(validateThaiTaxId('0000000000000').isValid).toBe(false);
    expect(validateThaiTaxId('1111111111111').isValid).toBe(false);
  });

  it('cleans non-numeric characters properly', () => {
    expect(cleanTaxId('0-1055-56108-42-0')).toBe('0105556108420');
  });

  it('formats 13-digit ID correctly as X-XXXX-XXXXX-XX-X', () => {
    expect(formatThaiTaxId('0105556108420')).toBe('0-1055-56108-42-0');
  });
});
