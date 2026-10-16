import { describe, it, expect } from 'vitest';
import { formatThaiDate, toBuddhistEraYear } from '../utils/thaiDate';

describe('Thai Date Formatting', () => {
  it('converts 2026 to Buddhist Era year 2569 (CE + 543)', () => {
    expect(toBuddhistEraYear(2026)).toBe(2569);
  });

  it('formats exact prompt example "4 กันยายน 2569"', () => {
    const formatted = formatThaiDate('2026-09-04', 'full');
    expect(formatted).toBe('4 กันยายน 2569');
  });

  it('formats short Thai date', () => {
    const formatted = formatThaiDate('2026-09-04', 'short');
    expect(formatted).toBe('4 ก.ย. 2569');
  });

  it('formats slash Thai date', () => {
    const formatted = formatThaiDate('2026-09-04', 'slash');
    expect(formatted).toBe('04/09/2569');
  });

  it('handles invalid dates safely without throwing', () => {
    expect(formatThaiDate('')).toBe('-');
    expect(formatThaiDate('not-a-date')).toBe('not-a-date');
  });
});
