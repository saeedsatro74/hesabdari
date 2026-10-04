import React, { useState } from 'react';
import { Transaction, PriorityLevel } from '../types';
import { formatToman, numberToPersianWords } from '../utils/numberToPersianWords';
import { formatShabaDisplay, getBankFromShaba } from '../utils/shaba';
import { calculateDueStatus } from '../utils/dateUtils';
import { PriorityBadge } from './PriorityBadge';
import { 
  Flame, 
  ArrowUp, 
  ArrowDown, 
  Pin, 
  CreditCard, 
  CheckCircle2, 
  DollarSign, 
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';

interface PriorityManagerViewProps {
  transactions: Transaction[];
  onTogglePin: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onSetRank: (id: string, newRank: number) => void;
  onChangePriority: (id: string, priority: PriorityLevel) => void;
  onRecordPayment: (transaction: Transaction) => void;
  onPinAsTopOne: (id: string) => void;
}

export const PriorityManagerView: React.FC<PriorityManagerViewProps> = ({
  transactions,
  onTogglePin,
  onMoveUp,
  onMoveDown,
  onChangePriority,
  onRecordPayment,
  onPinAsTopOne,
}) => {
  const [filterType, setFilterType] = useState<'debt' | 'credit'>('debt');

  const filtered = transactions
    .filter((t) => t.type === filterType && t.status !== 'paid')
    .sort((a, b) => {
      // پین شده‌ها در اولویت اول
      if (a.isPinnedTop && !b.isPinnedTop) return -1;
      if (!a.isPinnedTop && b.isPinnedTop) return 1;

      // ترتیب براساس رتبه اولویت عددی
      if (a.priorityRank !== b.priorityRank) {
        return a.priorityRank - b.priorityRank;
      }

      // سطوح اولویت
      const priorityWeight: Record<PriorityLevel, number> = {
        emergency: 1,
        high: 2,
        medium: 3,
        low: 4,
      };
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    });

  const totalPriorityAmount = filtered.reduce(
    (acc, t) => acc + (t.amount - t.paidAmount),
    0
  );

  const isDebt = filterType === 'debt';

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* بنر راهنمای اولویت‌بندی شرکت واته */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-slate-900 border border-amber-500/30 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-base">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            <span>مدیریت صف و اولویت‌بندی اختصاصی شرکت واته</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            شما می‌توانید با دکمه <strong className="text-amber-400">«اولویت با این است»</strong> هر بدهی یا طلب را بلافاصله در رتبه ۱ صف قرار دهید، یا با فلش‌های بالا و پایین ترتیب پرداخت را دقیقاً بر اساس نقدینگی شرکت مشخص کنید.
          </p>
        </div>

        <div className="bg-slate-950/80 px-4 py-3 rounded-xl border border-amber-500/30 text-left sm:text-right flex-shrink-0">
          <span className="text-[11px] text-slate-400 block mb-0.5">
            مجموع مبالغ در صف {isDebt ? 'پرداخت' : 'وصول'}:
          </span>
          <div className="text-lg font-black text-amber-400 font-mono">
            {formatToman(totalPriorityAmount)} <span className="text-xs text-slate-400 font-normal">تومان</span>
          </div>
        </div>
      </div>

      {/* سوییچ بین صف بدهی‌ها و صف طلب‌ها */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterType('debt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterType === 'debt'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-rose-400" />
            <span>صف اولویت پرداخت بدهی‌ها (بستانکاران)</span>
          </button>

          <button
            onClick={() => setFilterType('credit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterType === 'credit'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span>صف اولویت وصول مطالبات (طلب‌های ما)</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          تعداد در صف: {filtered.length} مورد
        </span>
      </div>

      {/* لیست رتبه‌بندی شده موارد با اولویت */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">هیچ موردی در این صف وجود ندارد</h4>
          <p className="text-xs text-slate-400">تمام موارد تسویه شده‌اند یا هنوز ثبتی انجام نشده است.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => {
            const bank = getBankFromShaba(item.shabaNumber);
            const due = calculateDueStatus(item.dueDate);
            const remaining = item.amount - item.paidAmount;

            return (
              <div
                key={item.id}
                className={`relative rounded-2xl p-4 transition-all border ${
                  item.isPinnedTop
                    ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/40'
                    : idx === 0
                    ? 'bg-slate-900 border-amber-500/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* ردیف اول: نشانگر رتبه و مشخصات طرف حساب */}
                  <div className="flex items-start gap-3.5">
                    {/* شماره رتبه اولویت ۱، ۲، ۳... */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md font-mono ${
                          item.isPinnedTop
                            ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                            : idx === 0
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{idx + 1}
                      </div>

                      {/* دکمه‌های جابجایی رتبه */}
                      <div className="flex items-center gap-1 mt-1.5">
                        <button
                          type="button"
                          onClick={() => onMoveUp(item.id)}
                          disabled={idx === 0}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 disabled:opacity-20"
                          title="افزایش رتبه (یک پله بالاتر)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveDown(item.id)}
                          disabled={idx === filtered.length - 1}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 disabled:opacity-20"
                          title="کاهش رتبه (یک پله پایین‌تر)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-white tracking-tight">
                          {item.fullName}
                        </h4>
                        {item.companyOrOrg && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {item.companyOrOrg}
                          </span>
                        )}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${due.badgeClass}`}>
                          {due.badgeText} ({item.jalaliDueDate})
                        </span>
                      </div>

                      {/* شماره شبا و بانک */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-slate-400">
                        <span className="font-mono dir-ltr select-all text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {formatShabaDisplay(item.shabaNumber)}
                        </span>
                        {bank && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${bank.badgeBg} ${bank.color}`}>
                            {bank.name}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ردیف دوم: مبلغ، اولویت و دکمه‌های اولویت دادن */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    {/* مبلغ با حروف */}
                    <div className="text-right sm:text-left">
                      <div className="text-lg font-black text-white font-mono">
                        {formatToman(remaining)}{' '}
                        <span className="text-xs font-normal text-slate-400">تومان</span>
                      </div>
                      <div className="text-[11px] text-amber-300/80 font-medium">
                        {numberToPersianWords(remaining)}
                      </div>
                    </div>

                    {/* دکمه مستقیم اولویت ۱ کردن */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPinAsTopOne(item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          item.isPinnedTop
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 ring-1 ring-amber-300'
                            : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                        }`}
                        title="تنظیم به عنوان اولویت شماره یک پرداخت شرکت واته"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{item.isPinnedTop ? 'اولویت اول است' : 'اولویت با این باشد'}</span>
                      </button>

                      {/* دکمه ثبت پرداخت */}
                      <button
                        onClick={() => onRecordPayment(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isDebt ? 'پرداخت' : 'وصول'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
