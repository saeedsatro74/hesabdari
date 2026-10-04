import React from 'react';
import { PriorityLevel, TransactionStatus } from '../types';
import { 
  Filter, 
  ArrowUpDown, 
  LayoutGrid, 
  Table, 
  Flame, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

interface FilterBarProps {
  statusFilter: TransactionStatus | 'all';
  setStatusFilter: (status: TransactionStatus | 'all') => void;
  priorityFilter: PriorityLevel | 'all';
  setPriorityFilter: (priority: PriorityLevel | 'all') => void;
  sortBy: 'priority' | 'dueDate' | 'amountDesc' | 'amountAsc' | 'newest';
  setSortBy: (sort: 'priority' | 'dueDate' | 'amountDesc' | 'amountAsc' | 'newest') => void;
  viewMode: 'cards' | 'table';
  setViewMode: (mode: 'cards' | 'table') => void;
  totalFiltered: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  totalFiltered,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
      {/* فیلتر وضعیت و فیلتر اولویت */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-400 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          <span>فیلترها:</span>
        </span>

        {/* فیلتر وضعیت */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
          className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-amber-500"
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="pending">در انتظار پرداخت / وصول</option>
          <option value="in_progress">در حال تسویه (اقساطی)</option>
          <option value="paid">تسویه شده کامل</option>
        </select>

        {/* فیلتر اولویت */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as PriorityLevel | 'all')}
          className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-amber-500"
        >
          <option value="all">همه سطوح اولویت</option>
          <option value="emergency">🔥 اضطراری و فوری</option>
          <option value="high">🔴 اولویت بالا</option>
          <option value="medium">🟡 اولویت متوسط</option>
          <option value="low">🟢 اولویت عادی</option>
        </select>

        <span className="text-[11px] text-slate-400 font-mono">
          ({totalFiltered} مورد یافت شد)
        </span>
      </div>

      {/* مرتب‌سازی و حالت نمایش */}
      <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
        <span className="text-slate-400 flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
          <span>مرتب‌سازی:</span>
        </span>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-amber-500"
        >
          <option value="priority">بر اساس اولویت (اولویت ۱ در بالا)</option>
          <option value="dueDate">بر اساس سررسید (نزدیک‌ترین موعد)</option>
          <option value="amountDesc">بیشترین مبلغ</option>
          <option value="amountAsc">کمترین مبلغ</option>
          <option value="newest">جدیدترین‌های ثبت شده</option>
        </select>

        {/* سوییچ نمایش کارتی / جدولی */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'cards'
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-slate-400 hover:text-white'
            }`}
            title="نمایش کارتی پرجزئیات"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'table'
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-slate-400 hover:text-white'
            }`}
            title="نمایش جدولی فشرده حسابداری"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
