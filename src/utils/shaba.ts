/**
 * ابزار اعتبارسنجی و تشخیص نام بانک از روی شماره شبا
 */

export interface BankInfo {
  code: string;
  name: string;
  color: string;
  badgeBg: string;
}

export const IRAN_BANKS: Record<string, { name: string; color: string; badgeBg: string }> = {
  '010': { name: 'بانک مرکزی', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/30' },
  '011': { name: 'صنعت و معدن', color: 'text-yellow-400', badgeBg: 'bg-yellow-500/10 border-yellow-500/30' },
  '012': { name: 'بانک ملت', color: 'text-red-400', badgeBg: 'bg-red-500/10 border-red-500/30' },
  '013': { name: 'رفاه کارگران', color: 'text-purple-400', badgeBg: 'bg-purple-500/10 border-purple-500/30' },
  '014': { name: 'بانک مسکن', color: 'text-orange-400', badgeBg: 'bg-orange-500/10 border-orange-500/30' },
  '015': { name: 'بانک سپه', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/30' },
  '016': { name: 'بانک کشاورزی', color: 'text-green-400', badgeBg: 'bg-green-500/10 border-green-500/30' },
  '017': { name: 'بانک ملی ایران', color: 'text-sky-400', badgeBg: 'bg-sky-500/10 border-sky-500/30' },
  '018': { name: 'بانک تجارت', color: 'text-blue-400', badgeBg: 'bg-blue-500/10 border-blue-500/30' },
  '019': { name: 'بانک صادرات ایران', color: 'text-blue-300', badgeBg: 'bg-blue-600/10 border-blue-500/30' },
  '020': { name: 'توسعه صادرات', color: 'text-teal-400', badgeBg: 'bg-teal-500/10 border-teal-500/30' },
  '021': { name: 'پست بانک ایران', color: 'text-green-300', badgeBg: 'bg-green-600/10 border-green-500/30' },
  '022': { name: 'توسعه تعاون', color: 'text-blue-400', badgeBg: 'bg-blue-500/10 border-blue-500/30' },
  '051': { name: 'موسسه توسعه', color: 'text-purple-400', badgeBg: 'bg-purple-500/10 border-purple-500/30' },
  '053': { name: 'بانک کارآفرین', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/30' },
  '054': { name: 'بانک پارسیان', color: 'text-red-300', badgeBg: 'bg-red-500/10 border-red-500/30' },
  '055': { name: 'بانک اقتصاد نوین', color: 'text-purple-400', badgeBg: 'bg-purple-500/10 border-purple-500/30' },
  '056': { name: 'بانک سامان', color: 'text-cyan-400', badgeBg: 'bg-cyan-500/10 border-cyan-500/30' },
  '057': { name: 'بانک پاسارگاد', color: 'text-amber-300', badgeBg: 'bg-amber-500/10 border-amber-500/30' },
  '058': { name: 'بانک سرمایه', color: 'text-blue-400', badgeBg: 'bg-blue-500/10 border-blue-500/30' },
  '059': { name: 'بانک سینا', color: 'text-orange-400', badgeBg: 'bg-orange-500/10 border-orange-500/30' },
  '060': { name: 'قرض‌الحسنه مهر ایران', color: 'text-teal-300', badgeBg: 'bg-teal-500/10 border-teal-500/30' },
  '061': { name: 'بانک شهر', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/30' },
  '062': { name: 'بانک آینده', color: 'text-amber-400', badgeBg: 'bg-amber-600/10 border-amber-500/30' },
  '064': { name: 'بانک گردشگری', color: 'text-lime-400', badgeBg: 'bg-lime-500/10 border-lime-500/30' },
  '066': { name: 'بانک دی', color: 'text-orange-300', badgeBg: 'bg-orange-500/10 border-orange-500/30' },
  '069': { name: 'بانک ایران زمین', color: 'text-purple-300', badgeBg: 'bg-purple-500/10 border-purple-500/30' },
  '070': { name: 'قرض‌الحسنه رسالت', color: 'text-sky-300', badgeBg: 'bg-sky-500/10 border-sky-500/30' },
  '078': { name: 'بانک خاورمیانه', color: 'text-indigo-400', badgeBg: 'bg-indigo-500/10 border-indigo-500/30' },
};

/**
 * پاکسازی شماره شبا از فاصله و خط تیره
 */
export function cleanShaba(input: string): string {
  if (!input) return '';
  let cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned.startsWith('IR') && /^\d+$/.test(cleaned)) {
    cleaned = 'IR' + cleaned;
  }
  return cleaned;
}

/**
 * تشخیص بانک از روی شماره شبا
 */
export function getBankFromShaba(rawShaba: string): BankInfo | null {
  const cleaned = cleanShaba(rawShaba);
  if (cleaned.length < 7) return null;
  // در شماره شبا (IR + 2 رقم کنترل + 3 رقم کد بانک)
  const bankCode = cleaned.substring(4, 7);
  const found = IRAN_BANKS[bankCode];
  if (found) {
    return {
      code: bankCode,
      name: found.name,
      color: found.color,
      badgeBg: found.badgeBg,
    };
  }
  return {
    code: bankCode,
    name: 'بانک متفرقه / معتبر',
    color: 'text-slate-300',
    badgeBg: 'bg-slate-700/50 border-slate-600',
  };
}

/**
 * فرمت‌بندی زیبا شماره شبا: IR00-0000-0000-0000-0000-0000-00
 */
export function formatShabaDisplay(rawShaba: string): string {
  const cleaned = cleanShaba(rawShaba);
  if (!cleaned) return '';
  
  // دسته‌بندی ۴ رقمی
  const chunks: string[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    chunks.push(cleaned.slice(i, i + 4));
  }
  return chunks.join(' - ');
}

/**
 * بررسی فرمت صحیح شبا (طول ۲۶ کاراکتر)
 */
export function isValidShabaFormat(rawShaba: string): boolean {
  const cleaned = cleanShaba(rawShaba);
  return /^IR\d{24}$/.test(cleaned);
}
