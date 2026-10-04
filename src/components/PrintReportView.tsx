import React from 'react';
import { Transaction, SummaryStats } from '../types';
import { formatToman } from '../utils/numberToPersianWords';
import { formatShabaDisplay } from '../utils/shaba';
import { getTodayJalali } from '../utils/dateUtils';
import { Building2, X, Printer } from 'lucide-react';

interface PrintReportViewProps {
  debts: Transaction[];
  credits: Transaction[];
  stats: SummaryStats;
  onClose: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  debts,
  credits,
  stats,
  onClose,
}) => {
  const today = getTodayJalali();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 p-4 sm:p-8 animate-in fade-in">
      <div className="max-w-5xl mx-auto bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
        {/* نوار کنترل خروج و پرینت در بالای صفحه (پنهان در پرینت) */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="text-sm font-bold text-slate-700">
            پیش‌نمایش پرینت گزارش رسمی شرکت واته
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فوری (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* سربرگ رسمی شرکت واته */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xl">
              W
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">شرکت واته (WAATEH Co.)</h1>
              <p className="text-xs text-slate-600">گزارش رسمی تراز بدهکاران، بستانکاران و اولویت‌بندی مالی</p>
            </div>
          </div>

          <div className="text-left text-xs space-y-1 font-mono">
            <div><strong>تاریخ گزارش:</strong> {today}</div>
            <div><strong>وضعیت حساب‌ها:</strong> به‌روزرسانی شده</div>
          </div>
        </div>

        {/* خلاصه تراز مالی */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
          <div>
            <span className="text-slate-500 block mb-1">مجموع بدهی‌های شرکت (بستانکاران):</span>
            <span className="text-base font-bold text-rose-700 font-mono">
              {formatToman(stats.totalDebtsRemaining)} تومان
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">مجموع طلب‌های شرکت (مطالبات):</span>
            <span className="text-base font-bold text-emerald-700 font-mono">
              {formatToman(stats.totalCreditsRemaining)} تومان
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">تراز خالص نقدینگی شرکت واته:</span>
            <span className={`text-base font-bold font-mono ${stats.netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {stats.netBalance >= 0 ? '+' : ''}{formatToman(stats.netBalance)} تومان
            </span>
          </div>
        </div>

        {/* جدول بدهی‌های شرکت واته */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <span>بدهی‌های شرکت واته (بستانکاران ما - به ترتیب اولویت پرداخت)</span>
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-2.5 text-center">اولویت</th>
                  <th className="p-2.5">طرف حساب / شرکت</th>
                  <th className="p-2.5">شماره شبا و بانک</th>
                  <th className="p-2.5 text-left">مبلغ کل (تومان)</th>
                  <th className="p-2.5 text-left">مانده بدهی</th>
                  <th className="p-2.5 text-center">سررسید</th>
                  <th className="p-2.5 text-center">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {debts.map((item, idx) => (
                  <tr key={item.id} className={item.isPinnedTop ? 'bg-amber-50 font-medium' : ''}>
                    <td className="p-2.5 text-center font-mono font-bold">
                      {item.isPinnedTop ? '★ اولویت ۱' : `#${idx + 1}`}
                    </td>
                    <td className="p-2.5">
                      <div className="font-bold text-slate-900">{item.fullName}</div>
                      {item.companyOrOrg && <div className="text-[11px] text-slate-500">{item.companyOrOrg}</div>}
                    </td>
                    <td className="p-2.5">
                      <div className="font-mono dir-ltr text-left text-[11px]">{formatShabaDisplay(item.shabaNumber)}</div>
                      <div className="text-[11px] text-slate-600">{item.bankName || '—'}</div>
                    </td>
                    <td className="p-2.5 text-left font-mono">{formatToman(item.amount)}</td>
                    <td className="p-2.5 text-left font-mono font-bold text-rose-700">
                      {formatToman(item.amount - item.paidAmount)}
                    </td>
                    <td className="p-2.5 text-center font-mono">{item.jalaliDueDate}</td>
                    <td className="p-2.5 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {item.status === 'paid' ? 'تسویه شده' : item.status === 'in_progress' ? 'قسطی' : 'در انتظار'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* جدول طلب‌های شرکت واته */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>مطالبات و طلب‌های شرکت واته (بدهکاران به ما)</span>
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-2.5 text-center">ردیف</th>
                  <th className="p-2.5">طرف حساب / کارفرما</th>
                  <th className="p-2.5">شماره شبا و بانک</th>
                  <th className="p-2.5 text-left">مبلغ کل (تومان)</th>
                  <th className="p-2.5 text-left">مانده وصولی</th>
                  <th className="p-2.5 text-center">سررسید وصول</th>
                  <th className="p-2.5 text-center">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {credits.map((item, idx) => (
                  <tr key={item.id} className={item.isPinnedTop ? 'bg-amber-50 font-medium' : ''}>
                    <td className="p-2.5 text-center font-mono font-bold">
                      {item.isPinnedTop ? '★ اولویت ۱' : `#${idx + 1}`}
                    </td>
                    <td className="p-2.5">
                      <div className="font-bold text-slate-900">{item.fullName}</div>
                      {item.companyOrOrg && <div className="text-[11px] text-slate-500">{item.companyOrOrg}</div>}
                    </td>
                    <td className="p-2.5">
                      <div className="font-mono dir-ltr text-left text-[11px]">{formatShabaDisplay(item.shabaNumber)}</div>
                      <div className="text-[11px] text-slate-600">{item.bankName || '—'}</div>
                    </td>
                    <td className="p-2.5 text-left font-mono">{formatToman(item.amount)}</td>
                    <td className="p-2.5 text-left font-mono font-bold text-emerald-700">
                      {formatToman(item.amount - item.paidAmount)}
                    </td>
                    <td className="p-2.5 text-center font-mono">{item.jalaliDueDate}</td>
                    <td className="p-2.5 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {item.status === 'paid' ? 'تسویه شده' : item.status === 'in_progress' ? 'وصول جزئی' : 'در انتظار'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* امضا و تأییدیه مالی شرکت واته */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 text-center text-xs text-slate-600">
          <div>
            <p className="font-bold text-slate-900 mb-8">امضا و تأیید مدیر مالی شرکت واته</p>
            <div className="border-t border-dashed border-slate-300 w-40 mx-auto"></div>
          </div>
          <div>
            <p className="font-bold text-slate-900 mb-8">امضا و تأیید مدیر عامل شرکت واته</p>
            <div className="border-t border-dashed border-slate-300 w-40 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
