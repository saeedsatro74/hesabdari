import React from 'react';
import { SummaryStats } from '../types';
import { formatToman } from '../utils/numberToPersianWords';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Scale, 
  Flame, 
  AlertCircle,
  Clock
} from 'lucide-react';

interface StatCardsProps {
  stats: SummaryStats;
  onFilterEmergency?: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, onFilterEmergency }) => {
  const isNetPositive = stats.netBalance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-5">
      {/* بدهی‌های شرکت واته (بستانکاران) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/20 p-4 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-rose-300/90 flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4 text-rose-400" />
            بدهی‌های شرکت (بستانکاران)
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-rose-500/10 text-rose-300 border border-rose-500/20">
            {stats.pendingDebtsCount} مورد فعال
          </span>
        </div>
        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {formatToman(stats.totalDebtsRemaining)} <span className="text-xs font-normal text-slate-400">تومان</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>کل تعهدات: {formatToman(stats.totalDebts)} ت</span>
            {stats.overdueDebtsCount > 0 && (
              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" />
                {stats.overdueDebtsCount} سررسید گذشته
              </span>
            )}
          </div>
        </div>
      </div>

      {/* طلب‌های شرکت واته (بدهکاران به ما) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 p-4 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-emerald-300/90 flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            طلب‌های شرکت (مطالبات ما)
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {stats.pendingCreditsCount} مورد وصولی
          </span>
        </div>
        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {formatToman(stats.totalCreditsRemaining)} <span className="text-xs font-normal text-slate-400">تومان</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>کل مطالبات ثبت شده: {formatToman(stats.totalCredits)} ت</span>
            <span className="text-emerald-400 text-[10px]">در انتظار وصول</span>
          </div>
        </div>
      </div>

      {/* تراز مالی خالص (Net Position) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-4 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-400" />
            تراز خالص نقدینگی واته
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              isNetPositive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {isNetPositive ? 'مازاد مطالبات (+)' : 'کسری نقدینگی (-)'}
          </span>
        </div>
        <div className="mt-2.5">
          <div
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isNetPositive ? '+' : ''}{formatToman(stats.netBalance)} <span className="text-xs font-normal text-slate-400">تومان</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>{isNetPositive ? 'طلب‌های ما از بدهی‌ها بیشتر است' : 'میزان بدهی‌های شرکت بیشتر از مطالبات است'}</span>
          </div>
        </div>
      </div>

      {/* اولویت‌های نیازمند اقدام فوری */}
      <div 
        onClick={onFilterEmergency}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 p-4 shadow-md cursor-pointer hover:border-amber-500/60 transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20 group-hover:scale-110 transition-transform" />
            اولویت‌های اقدام فوری
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            صف پرداخت
          </span>
        </div>
        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight flex items-baseline gap-2">
            <span>{stats.emergencyDebtsCount}</span>
            <span className="text-xs font-normal text-slate-300">مورد با اولویت بالا و فوری</span>
          </div>
          <div className="text-[11px] text-amber-200/80 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>نیاز به تخصیص سریع بودجه یا پیگیری</span>
          </div>
        </div>
      </div>
    </div>
  );
};
