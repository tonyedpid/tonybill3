import { describe, it, expect } from 'vitest';
import { thaiBahtText } from '../utils/thaiBahtText';

describe('Thai Baht Text Conversion', () => {
  it('converts exact example 551.00', () => {
    expect(thaiBahtText(551.0)).toBe('ห้าร้อยห้าสิบเอ็ดบาทถ้วน');
  });

  it('converts exact example 551.25', () => {
    expect(thaiBahtText(551.25)).toBe('ห้าร้อยห้าสิบเอ็ดบาทยี่สิบห้าสตางค์');
  });

  it('converts exact example 1,000.50', () => {
    expect(thaiBahtText(1000.5)).toBe('หนึ่งพันบาทห้าสิบสตางค์');
  });

  it('converts 0 to ศูนย์บาทถ้วน', () => {
    expect(thaiBahtText(0)).toBe('ศูนย์บาทถ้วน');
    expect(thaiBahtText('0.00')).toBe('ศูนย์บาทถ้วน');
  });

  it('handles numbers ending in 1 and correct use of เอ็ด', () => {
    expect(thaiBahtText(1)).toBe('หนึ่งบาทถ้วน');
    expect(thaiBahtText(11)).toBe('สิบเอ็ดบาทถ้วน');
    expect(thaiBahtText(21)).toBe('ยี่สิบเอ็ดบาทถ้วน');
    expect(thaiBahtText(101)).toBe('หนึ่งร้อยเอ็ดบาทถ้วน');
    expect(thaiBahtText(1001)).toBe('หนึ่งพันเอ็ดบาทถ้วน');
  });

  it('handles tens and twenties correctly', () => {
    expect(thaiBahtText(10)).toBe('สิบบาทถ้วน');
    expect(thaiBahtText(20)).toBe('ยี่สิบบาทถ้วน');
    expect(thaiBahtText(25)).toBe('ยี่สิบห้าบาทถ้วน');
    expect(thaiBahtText(30)).toBe('สามสิบบาทถ้วน');
  });

  it('handles satang fractions correctly', () => {
    expect(thaiBahtText(0.25)).toBe('ยี่สิบห้าสตางค์');
    expect(thaiBahtText(0.01)).toBe('หนึ่งสตางค์');
    expect(thaiBahtText(0.5)).toBe('ห้าสิบสตางค์');
    expect(thaiBahtText(0.75)).toBe('เจ็ดสิบห้าสตางค์');
  });

  it('handles large millions amounts', () => {
    expect(thaiBahtText(1000000)).toBe('หนึ่งล้านบาทถ้วน');
    expect(thaiBahtText(12345678.9)).toBe(
      'สิบสองล้านสามแสนสี่หมื่นห้าพันหกร้อยเจ็ดสิบแปดบาทเก้าสิบสตางค์'
    );
  });

  it('handles negative numbers safely without crashing', () => {
    expect(thaiBahtText(-500)).toBe('ลบห้าร้อยบาทถ้วน');
  });

  it('handles null, empty or invalid strings gracefully', () => {
    expect(thaiBahtText('')).toBe('ศูนย์บาทถ้วน');
    expect(thaiBahtText('abc')).toBe('จำนวนเงินไม่ถูกต้อง');
  });
});
