/**
 * تبدیل اعداد مالی به حروف فارسی (برای جلوگیری از خطای حسابداری در مبالغ میلیونی و میلیاردی)
 */

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = [
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
];
const TENS = ['', 'ده', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = [
  '',
  'صد',
  'دویست',
  'سیصد',
  'چهارصد',
  'پانصد',
  'ششصد',
  'هفتصد',
  'هشتصد',
  'نهصد',
];

const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

function convertThreeDigits(num: number): string {
  const parts: string[] = [];

  const h = Math.floor(num / 100);
  const remainder = num % 100;
  const t = Math.floor(remainder / 10);
  const o = remainder % 10;

  if (h > 0) {
    parts.push(HUNDREDS[h]);
  }

  if (remainder >= 10 && remainder < 20) {
    parts.push(TEENS[remainder - 10]);
  } else {
    if (t > 0) parts.push(TENS[t]);
    if (o > 0) parts.push(ONES[o]);
  }

  return parts.join(' و ');
}

/**
 * تبدیل ارقام فارسی و عربی به ارقام انگلیسی
 */
export function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

export function numberToPersianWords(amount: number | string): string {
  const cleanStr = toEnglishDigits(String(amount)).replace(/[^0-9]/g, '');
  const num = parseInt(cleanStr, 10);
  if (!num || isNaN(num) || num === 0) return 'صفر تومان';

  const chunks: number[] = [];
  let temp = Math.abs(num);

  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const words: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk > 0) {
      const chunkWord = convertThreeDigits(chunk);
      const scale = SCALES[i];
      words.push(scale ? `${chunkWord} ${scale}` : chunkWord);
    }
  }

  const result = words.join(' و ');
  return `${result} تومان`;
}

/**
 * جداسازی ۳ رقمی ارقام با کاما
 */
export function formatToman(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '۰';
  return new Intl.NumberFormat('fa-IR').format(amount);
}

/**
 * تبدیل ارقام انگلیسی به فارسی
 */
export function toPersianDigits(n: number | string): string {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n
    .toString()
    .replace(/[0-9]/g, (w) => farsiDigits[+w]);
}
