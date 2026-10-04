import React from 'react';
import { 
  Building2, 
  PlusCircle, 
  Printer, 
  Download, 
  Calendar, 
  Search,
  SlidersHorizontal,
  Flame,
  ArrowDownLeft,
  ArrowUpRight,
  ListOrdered
} from 'lucide-react';
import { getTodayJalali } from '../utils/dateUtils';
import { TransactionType } from '../types';

interface HeaderProps {
  activeTab: 'debts' | 'credits' | 'priorities';
  setActiveTab: (tab: 'debts' | 'credits' | 'priorities') => void;
  onOpenNewModal: (type: TransactionType) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onPrint: () => void;
  onExportCSV: () => void;
  debtsCount: number;
  creditsCount: number;
  emergencyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewModal,
  searchTerm,
  setSearchTerm,
  onPrint,
  onExportCSV,
  debtsCount,
  creditsCount,
  emergencyCount,
}) => {
  const todayJalali = getTodayJalali();

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {/* نوار بالا: لوگو شرکت واته و دکمه‌های عملیات اصلی */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* برندینگ و تاریخ */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-lg shadow-amber-500/20 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>شرکت واته</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    WAATEH Co.
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>سیستم جامع مدیریت بدهکار، بستانکار و اولویت‌بندی پرداخت‌ها</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>امروز: {todayJalali}</span>
                </span>
              </p>
            </div>
          </div>

          {/* اکشن‌های سریع */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => onOpenNewModal('debt')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all hover:scale-[1.02] shadow-sm active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4 text-rose-400" />
              <span>+ ثبت بدهی ما (بستانکار)</span>
            </button>

            <button
              onClick={() => onOpenNewModal('credit')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all hover:scale-[1.02] shadow-sm active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>+ ثبت طلب ما (بدهکار)</span>
            </button>

            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block mx-1" />

            <button
              onClick={onPrint}
              className="p-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors"
              title="چاپ و پرینت گزارش مالی شرکت واته"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onExportCSV}
              className="p-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors"
              title="خروجی فایل اکسل و CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* نوار تب‌ها و جستجو */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* دکمه‌های تب */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('debts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'debts'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
              <span>بدهی‌های شرکت (بستانکاران)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-950/60 border border-rose-800 text-rose-200">
                {debtsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('credits')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'credits'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>صفحه طلب ما (مطالبات)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950/60 border border-emerald-800 text-emerald-200">
                {creditsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('priorities')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'priorities'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
              <span>اولویت‌بندی و صف پرداخت</span>
              {emergencyCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5 fill-current" />
                  {emergencyCount}
                </span>
              )}
            </button>
          </div>

          {/* فیلد جستجوی سریع */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در نام، شماره شبا، شرکت..."
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/60 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
