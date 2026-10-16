/**
 * Reliable Thai Baht Text Conversion Utility
 * Converts numeric amounts (Baht and Satang) into standard Thai wording:
 * Examples:
 * - 0.00 => "ศูนย์บาทถ้วน"
 * - 1.00 => "หนึ่งบาทถ้วน"
 * - 11.00 => "สิบเอ็ดบาทถ้วน"
 * - 21.00 => "ยี่สิบเอ็ดบาทถ้วน"
 * - 101.00 => "หนึ่งร้อยเอ็ดบาทถ้วน"
 * - 551.00 => "ห้าร้อยห้าสิบเอ็ดบาทถ้วน"
 * - 551.25 => "ห้าร้อยห้าสิบเอ็ดบาทยี่สิบห้าสตางค์"
 * - 1000.50 => "หนึ่งพันบาทห้าสิบสตางค์"
 */

const DIGIT_WORDS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const POSITION_WORDS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

/**
 * Converts a 1-6 digit string to Thai text.
 */
function convertSixDigits(chunk: string): string {
  const len = chunk.length;
  let text = '';

  for (let i = 0; i < len; i++) {
    const digit = parseInt(chunk.charAt(i), 10);
    const pos = len - i - 1; // 0 for unit, 1 for tens, 2 for hundreds, etc.

    if (digit === 0) {
      continue;
    }

    if (pos === 0) {
      // Unit position
      if (digit === 1 && len > 1 && parseInt(chunk.charAt(len - 2), 10) !== 0) {
        // e.g. 11, 21, 101, 551 -> "เอ็ด"
        text += 'เอ็ด';
      } else if (digit === 1 && len > 1 && len > 2 && parseInt(chunk.slice(0, len - 1), 10) > 0) {
        text += 'เอ็ด';
      } else {
        text += DIGIT_WORDS[digit];
      }
    } else if (pos === 1) {
      // Tens position
      if (digit === 1) {
        text += 'สิบ';
      } else if (digit === 2) {
        text += 'ยี่สิบ';
      } else {
        text += DIGIT_WORDS[digit] + 'สิบ';
      }
    } else {
      text += DIGIT_WORDS[digit] + POSITION_WORDS[pos];
    }
  }

  return text;
}

/**
 * Converts a positive integer string into Thai words, handling arbitrary number of "ล้าน".
 */
function convertIntegerToThai(integerStr: string): string {
  // Trim leading zeros
  const trimmed = integerStr.replace(/^0+/, '');
  if (!trimmed) return 'ศูนย์';

  // Break into chunks of 6 digits from right to left
  const chunks: string[] = [];
  let current = trimmed;
  while (current.length > 0) {
    const start = Math.max(0, current.length - 6);
    chunks.unshift(current.slice(start));
    current = current.slice(0, start);
  }

  let result = '';
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = convertSixDigits(chunks[i]);
    const millionPower = chunks.length - 1 - i;

    if (chunkText) {
      result += chunkText;
      for (let m = 0; m < millionPower; m++) {
        result += 'ล้าน';
      }
    }
  }

  return result || 'ศูนย์';
}

/**
 * Main Thai Baht Text conversion function.
 * @param amount - number or numeric string (e.g. 551.25)
 * @returns Thai wording string, e.g. "ห้าร้อยห้าสิบเอ็ดบาทยี่สิบห้าสตางค์"
 */
export function thaiBahtText(amount: number | string): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'ศูนย์บาทถ้วน';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!isFinite(num)) {
    return 'จำนวนเงินไม่ถูกต้อง';
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Split into Baht and Satang using rounded 2-decimal satangs
  const totalSatangs = Math.round(absNum * 100);
  const baht = Math.floor(totalSatangs / 100);
  const satang = totalSatangs % 100;

  if (baht === 0 && satang === 0) {
    return 'ศูนย์บาทถ้วน';
  }

  let result = isNegative ? 'ลบ' : '';

  if (baht > 0) {
    result += convertIntegerToThai(baht.toString()) + 'บาท';
  }

  if (satang === 0) {
    result += 'ถ้วน';
  } else {
    // If baht was 0 but satang exists (e.g. 0.50 => ห้าสิบสตางค์)
    const satangStr = satang.toString();
    result += convertSixDigits(satangStr) + 'สตางค์';
  }

  return result;
}
