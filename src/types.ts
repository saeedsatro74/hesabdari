export type TransactionType = 'debt' | 'credit';

export type PriorityLevel = 'emergency' | 'high' | 'medium' | 'low';

export type TransactionStatus = 'pending' | 'paid' | 'overdue' | 'in_progress';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  trackingCode?: string;
  note?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType; // 'debt' = بدهی شرکت واته (بستانکاران ما), 'credit' = طلب شرکت واته (بدهکاران به ما)
  fullName: string; // نام و نام خانوادگی طرف حساب
  companyOrOrg?: string; // شرکت یا سازمان مربوطه
  shabaNumber: string; // شماره شبا IR...
  cardNumber?: string; // شماره کارت ۱۶ رقمی (اختیاری)
  bankName?: string; // نام بانک استخراج شده
  amount: number; // مبلغ کل (تومان)
  paidAmount: number; // مبلغ پرداخت شده تا الان (برای تسویه اقساطی/جزئی)
  dueDate: string; // تاریخ پرداخت یا وصول (YYYY-MM-DD)
  jalaliDueDate: string; // تاریخ شمسی معادل مثلاً 1403/08/15
  priority: PriorityLevel; // سطح اولویت
  priorityRank: number; // رتبه عددی جهت اولویت‌بندی دستی (۱ بالاترین)
  isPinnedTop?: boolean; // آیا در اولویت فوری تثبیت شده
  isOfficial?: boolean; // رسمی (فاکتور رسمی) یا غیررسمی (عادی/آزاد)
  status: TransactionStatus;
  category?: string; // دسته‌بندی
  description?: string; // بابت / توضیحات
  invoiceNumber?: string; // شماره فاکتور یا سند
  phoneNumber?: string; // شماره تماس طرف حساب
  paymentRecords: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export type HistoryActionType = 'deleted' | 'paid' | 'collected' | 'created';

export interface HistoryItem {
  id: string;
  action: HistoryActionType;
  actionTitle: string; // مثلاً: «حذف شده (طلب ما)»، «واریز شد»، «وصول شد»
  transaction: Transaction; // رونوشت کامل اطلاعات سند
  timestamp: string; // زمان ایزو
  dayOfWeek: string; // شنبه، یکشنبه و...
  jalaliDate: string; // تاریخ شمسی دقیق
  time: string; // ساعت، دقیقه، ثانیه
  readableFull: string; // مثلاً: شنبه ۱۲ مهر ۱۴۰۵ - ساعت ۱۵:۴۲
}

export interface SummaryStats {
  totalDebts: number;
  totalCredits: number;
  netBalance: number;
  pendingDebtsCount: number;
  pendingCreditsCount: number;
  overdueDebtsCount: number;
  emergencyDebtsCount: number;
  totalDebtsRemaining: number;
  totalCreditsRemaining: number;
}
