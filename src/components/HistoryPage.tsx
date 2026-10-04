import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import { formatToman } from '../utils/numberToPersianWords';
import { formatShabaDisplay } from '../utils/shaba';
import { 
  History, 
  Trash2, 
  CheckCircle2, 
  RotateCcw, 
  Search, 
  Clock, 
  Archive 
} from 'lucide-react';

interface HistoryPageProps {
  history: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  mode: 'deleted' | 'settled';
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onRestore,
  mode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const isDeletedMode = mode === 'deleted';

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // تفکیک قطعی بر اساس مود صفحه
      if (isDeletedMode) {
        if (item.action !== 'deleted') return false;
      } else {
        if (item.action !== 'paid' && item.action !== 'collected') return false;
      }

      // فیلتر جستجو
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const matchName = item.transaction.fullName.toLowerCase().includes(s);
        const matchAmount = String(item.transaction.amount).includes(s);
        const matchShaba = item.transaction.shabaNumber?.toLowerCase().includes(s);
        const matchDay = item.dayOfWeek.toLowerCase().includes(s);
        const matchDate = item.jalaliDate.includes(s);
        const matchAction = item.actionTitle.toLowerCase().includes(s);

        if (!matchName && !matchAmount && !matchShaba && !matchDay && !matchDate && !matchAction) {
          return false;
        }
      }

      return true;
    });
  }, [history, searchTerm, isDeletedMode]);

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* نوار بالای صفحه ساده و بدون دکمه‌های تکراری */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-900 text-white">
            {isDeletedMode ? <Archive className="w-4 h-4 text-rose-300" /> : <History className="w-4 h-4 text-blue-300" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{isDeletedMode ? 'بایگانی اسناد حذف‌شده' : 'تاریخچه واریز و وصول'}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono border ${
                isDeletedMode
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {filteredHistory.length} مورد
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              {isDeletedMode
                ? 'سوابق کامل تمامی اسناد حذف‌شده با روز هفته، تاریخ، ساعت دقیق و امکان بازگردانی به لیست'
                : 'آرشیو دقیق مبالغ واریز شده و وصول شده با روز هفته و زمان دقیق'}
            </p>
          </div>
        </div>

        {/* فیلد جستجو در بالای جدول */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isDeletedMode ? 'جستجو در اسناد حذف‌شده...' : 'جستجو در واریز و وصول‌ها...'}
            className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-800 outline-none"
          />
        </div>
      </div>

      {/* جدول نمایش اسناد */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-xs text-right border-collapse">
          <thead>
            <tr className="bg-slate-50/90 text-slate-700 border-b border-slate-200 select-none font-bold">
              <th className="py-2.5 px-3 text-center w-36">نوع رویداد</th>
              <th className="py-2.5 px-3">طرف حساب</th>
              <th className="py-2.5 px-3 text-left">مبلغ (تومان)</th>
              <th className="py-2.5 px-3">شماره شبا و بانک</th>
              <th className="py-2.5 px-3 text-center">زمان دقیق رویداد</th>
              <th className="py-2.5 px-3 text-center w-28">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                  {isDeletedMode
                    ? 'هیچ موردی تا کنون حذف نشده است (بایگانی اسناد حذف‌شده خالی است).'
                    : 'هیچ تراکنش واریز یا وصولی ثبت نشده است.'}
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => {
                const isDeleted = item.action === 'deleted';
                const isPaid = item.action === 'paid';
                const isCollected = item.action === 'collected';
                const isDebt = item.transaction.type === 'debt';

                return (
                  <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isDeleted ? 'bg-rose-50/20' : ''}`}>
                    {/* نوع رویداد */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          isDeleted
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isPaid
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isDeleted && <Trash2 className="w-3 h-3 text-rose-600" />}
                        {isPaid && <CheckCircle2 className="w-3 h-3 text-blue-600" />}
                        {isCollected && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        <span>{item.actionTitle}</span>
                      </span>
                    </td>

                    {/* نام طرف حساب */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">
                        {item.transaction.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isDebt ? 'سند بستانکار (بدهی ما)' : 'سند بدهکار (طلب ما)'}
                      </div>
                    </td>

                    {/* مبلغ */}
                    <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-900">
                      {formatToman(item.transaction.amount)}
                    </td>

                    {/* شماره شبا */}
                    <td className="py-2.5 px-3">
                      {item.transaction.shabaNumber ? (
                        <div className="font-mono dir-ltr text-[11px] text-slate-700">
                          {formatShabaDisplay(item.transaction.shabaNumber)}
                          {item.transaction.bankName && (
                            <span className="text-[10px] text-slate-400 mr-1.5 font-sans">
                              ({item.transaction.bankName})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* زمان دقیق (روز هفته، تاریخ شمسی، ساعت) */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${isDeleted ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>
                          {item.dayOfWeek}
                        </span>
                        <span className="font-mono text-xs">{item.jalaliDate}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>ساعت {item.time}</span>
                      </div>
                    </td>

                    {/* عملیات (بازیابی سند به سیستم) */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRestore(item)}
                        className="flex items-center justify-center gap-1 w-full px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                        title="بازگرداندن به لیست جاری بدهی یا طلب"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-600" />
                        <span>بازگشت به لیست</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
