/**
 * Thai Tax Identification / Citizen ID (13 digits) Validation & Formatting
 * Uses the official Thai Revenue Department / Registration Administration MOD 11 Checksum:
 * Sum = Sum(digit[i] * (13 - i)) for i = 0 to 11
 * Check digit = (11 - (Sum % 11)) % 10
 */

export function cleanTaxId(id: string): string {
  if (!id) return '';
  return id.replace(/\D/g, '').slice(0, 13);
}

export function validateThaiTaxId(id: string): { isValid: boolean; message: string } {
  const cleaned = cleanTaxId(id);

  if (!cleaned) {
    return { isValid: false, message: 'กรุณาระบุเลขประจำตัวผู้เสียภาษี 13 หลัก' };
  }

  if (cleaned.length !== 13) {
    return { 
      isValid: false, 
      message: `ต้องมี 13 หลัก (ปัจจุบันมี ${cleaned.length} หลัก)` 
    };
  }

  // All identical digits check (e.g. 0000000000000 or 1111111111111)
  if (/^(\d)\1{12}$/.test(cleaned)) {
    return { isValid: false, message: 'เลขประจำตัวผู้เสียภาษีไม่ถูกต้องตามแบบแผน' };
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;
  const lastDigit = parseInt(cleaned.charAt(12), 10);

  if (checkDigit !== lastDigit) {
    return { 
      isValid: false, 
      message: 'เลขตรวจสอบหลักสุดท้าย (Check digit) ไม่ถูกต้อง' 
    };
  }

  return { isValid: true, message: 'เลขประจำตัวผู้เสียภาษีถูกต้อง' };
}

export function formatThaiTaxId(id: string): string {
  const cleaned = cleanTaxId(id);
  if (cleaned.length !== 13) return id;
  // Format: X-XXXX-XXXXX-XX-X
  return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12, 13)}`;
}
