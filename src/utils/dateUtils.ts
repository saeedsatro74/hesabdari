/**
 * ابزارهای محاسباتی تقویم شمسی، روزهای هفته و ساعت دقیق
 */

// تبدیل میلادی به شمسی
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

const PERSIAN_MONTHS = [
  '',
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const PERSIAN_WEEKDAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
];

export function getPersianDayOfWeek(date: Date = new Date()): string {
  return PERSIAN_WEEKDAYS[date.getDay()];
}

export interface DetailedPersianDateTime {
  dayOfWeek: string; // شنبه، یکشنبه و...
  jalaliDate: string; // 1405/07/12
  time: string; // 15:42:10
  readableFull: string; // شنبه ۱۲ مهر ۱۴۰۵ - ساعت ۱۵:۴۲
}

export function getCurrentPersianDateTime(d: Date = new Date()): DetailedPersianDateTime {
  const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  
  const dayOfWeek = getPersianDayOfWeek(d);
  const jalaliDate = `${jy}/${pad(jm)}/${pad(jd)}`;
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  const time = `${hours}:${minutes}:${seconds}`;
  const monthName = PERSIAN_MONTHS[jm] || '';
  const readableFull = `${dayOfWeek} ${jd} ${monthName} ${jy} - ساعت ${hours}:${minutes}`;

  return {
    dayOfWeek,
    jalaliDate,
    time,
    readableFull,
  };
}

export function formatToJalali(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${jy}/${pad(jm)}/${pad(jd)}`;
  } catch {
    return dateStr;
  }
}

export function getTodayGregorian(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayJalali(): string {
  return formatToJalali(getTodayGregorian());
}

export interface DueCalculation {
  diffDays: number;
  isOverdue: boolean;
  isToday: boolean;
  badgeText: string;
  badgeClass: string;
}

export function calculateDueStatus(dueDateStr: string): DueCalculation {
  if (!dueDateStr) {
    return {
      diffDays: 0,
      isOverdue: false,
      isToday: false,
      badgeText: 'نامشخص',
      badgeClass: 'bg-slate-100 text-slate-600',
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      diffDays,
      isOverdue: true,
      isToday: false,
      badgeText: `${daysAgo} روز گذشته`,
      badgeClass: 'bg-rose-50 text-rose-700 font-bold',
    };
  }

  if (diffDays === 0) {
    return {
      diffDays: 0,
      isOverdue: false,
      isToday: true,
      badgeText: 'امروز سررسید است',
      badgeClass: 'bg-amber-100 text-amber-800 font-bold',
    };
  }

  if (diffDays <= 3) {
    return {
      diffDays,
      isOverdue: false,
      isToday: false,
      badgeText: `${diffDays} روز مانده`,
      badgeClass: 'bg-yellow-50 text-yellow-800',
    };
  }

  return {
    diffDays,
    isOverdue: false,
    isToday: false,
    badgeText: `${diffDays} روز مانده`,
    badgeClass: 'bg-slate-100 text-slate-700',
  };
}
