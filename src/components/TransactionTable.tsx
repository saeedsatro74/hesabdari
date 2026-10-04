import React, { useState } from 'react';
import { Transaction, PriorityLevel, TransactionStatus } from '../types';
import { formatToman } from '../utils/numberToPersianWords';
import { formatShabaDisplay, getBankFromShaba } from '../utils/shaba';
import { calculateDueStatus } from '../utils/dateUtils';
import { PriorityBadge } from './PriorityBadge';
import { 
  Copy, 
  Check, 
  DollarSign, 
  Edit2, 
  Trash2, 
  Pin, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onRecordPayment: (t: Transaction) => void;
  onTogglePin: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onChangeStatus: (id: string, status: TransactionStatus) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
  onRecordPayment,
  onTogglePin,
  onMoveUp,
  onMoveDown,
  onChangeStatus,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, shaba: string) => {
    if (!shaba) return;
    navigator.clipboard.writeText(shaba);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="overflow-x-auto bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
      <table className="w-full text-xs text-right border-collapse">
        <thead>
          <tr className="bg-slate-950/80 text-slate-300 border-b border-slate-800 font-bold">
            <th className="p-3 text-center w-16">رتبه</th>
            <th className="p-3">طرف حساب / شرکت</th>
            <th className="p-3">شماره شبا و بانک</th>
            <th className="p-3 text-left">مبلغ کل (تومان)</th>
            <th className="p-3 text-left">مانده</th>
            <th className="p-3 text-center">سررسید</th>
            <th className="p-3 text-center">اولویت</th>
            <th className="p-3 text-center">وضعیت</th>
            <th className="p-3 text-center w-28">عملیات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {transactions.map((item, idx) => {
            const bank = getBankFromShaba(item.shabaNumber);
            const due = calculateDueStatus(item.dueDate);
            const remaining = item.amount - item.paidAmount;
            const isDebt = item.type === 'debt';

            return (
              <tr
                key={item.id}
                className={`hover:bg-slate-800/40 transition-colors ${
                  item.isPinnedTop ? 'bg-amber-500/5' : ''
                }`}
              >
                {/* رتبه و دکمه جابجایی */}
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] ${
                        item.isPinnedTop
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.priorityRank || idx + 1}
                    </span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => onMoveUp(item.id)}
                        disabled={idx === 0}
                        className="text-slate-500 hover:text-amber-400 disabled:opacity-20"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onMoveDown(item.id)}
                        disabled={idx === transactions.length - 1}
                        className="text-slate-500 hover:text-amber-400 disabled:opacity-20"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </td>

                {/* طرف حساب */}
                <td className="p-3">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{item.fullName}</span>
                    {item.isPinnedTop && (
                      <span className="text-[10px] px-1.5 rounded bg-amber-400 text-slate-950 font-bold">
                        اولویت ویژه
                      </span>
                    )}
                  </div>
                  {item.companyOrOrg && (
                    <div className="text-[11px] text-slate-400">{item.companyOrOrg}</div>
                  )}
                  {item.invoiceNumber && (
                    <div className="text-[10px] text-slate-500">سند: {item.invoiceNumber}</div>
                  )}
                </td>

                {/* شبا و بانک */}
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <span className="font-mono dir-ltr text-[11px] text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {formatShabaDisplay(item.shabaNumber)}
                    </span>
                    <button
                      onClick={() => handleCopy(item.id, item.shabaNumber)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="کپی شماره شبا"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {bank && (
                    <div className={`text-[10px] font-semibold mt-0.5 ${bank.color}`}>
                      {bank.name}
                    </div>
                  )}
                </td>

                {/* مبلغ کل */}
                <td className="p-3 text-left font-mono font-bold text-white">
                  {formatToman(item.amount)}
                </td>

                {/* مانده */}
                <td className="p-3 text-left font-mono font-bold">
                  <span className={isDebt ? 'text-rose-400' : 'text-emerald-400'}>
                    {formatToman(remaining)}
                  </span>
                </td>

                {/* سررسید */}
                <td className="p-3 text-center">
                  <div className="font-mono text-slate-200">{item.jalaliDueDate}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded inline-block mt-0.5 ${due.badgeClass}`}>
                    {due.badgeText}
                  </span>
                </td>

                {/* اولویت */}
                <td className="p-3 text-center">
                  <PriorityBadge
                    priority={item.priority}
                    rank={item.priorityRank}
                    isPinned={item.isPinnedTop}
                    onPinToggle={() => onTogglePin(item.id)}
                    interactive={true}
                  />
                </td>

                {/* وضعیت */}
                <td className="p-3 text-center">
                  <select
                    value={item.status}
                    onChange={(e) => onChangeStatus(item.id, e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 text-[11px] outline-none"
                  >
                    <option value="pending">در انتظار</option>
                    <option value="in_progress">اقساطی</option>
                    <option value="paid">تسویه کامل</option>
                  </select>
                </td>

                {/* دکمه‌های عملیات */}
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onRecordPayment(item)}
                      className="p-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                      title={isDebt ? 'ثبت پرداخت' : 'ثبت وصولی'}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onTogglePin(item.id)}
                      className={`p-1 rounded ${
                        item.isPinnedTop
                          ? 'bg-amber-400 text-slate-950'
                          : 'hover:bg-slate-800 text-slate-400 hover:text-amber-300'
                      }`}
                      title="اولویت با این است"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
