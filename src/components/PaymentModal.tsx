import React, { useState } from 'react';
import { Transaction, PaymentRecord } from '../types';
import { formatToman, numberToPersianWords } from '../utils/numberToPersianWords';
import { getTodayGregorian } from '../utils/dateUtils';
import { X, Check, DollarSign, Calendar, Hash, FileText } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onAddPayment: (transactionId: string, record: Omit<PaymentRecord, 'id'>) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onAddPayment,
}) => {
  if (!isOpen || !transaction) return null;

  const remaining = Math.max(0, transaction.amount - transaction.paidAmount);
  const [payAmountStr, setPayAmountStr] = useState(remaining.toString());
  const [date, setDate] = useState(getTodayGregorian());
  const [trackingCode, setTrackingCode] = useState('');
  const [note, setNote] = useState('');

  const rawPayAmount = parseInt(payAmountStr.replace(/[^0-9]/g, ''), 10) || 0;
  const isDebt = transaction.type === 'debt';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawPayAmount <= 0) {
      alert('لطفاً مبلغ پرداختی را به درستی وارد کنید.');
      return;
    }

    onAddPayment(transaction.id, {
      date,
      amount: rawPayAmount,
      trackingCode: trackingCode.trim() || undefined,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* هدر */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isDebt ? 'ثبت پرداخت بدهی شرکت واته' : 'ثبت وصولی طلب شرکت واته'}
              </h3>
              <p className="text-xs text-slate-400">طرف حساب: {transaction.fullName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* خلاصه حساب */}
        <div className="p-5 bg-slate-950/40 border-b border-slate-800/80">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1">کل مبلغ سند:</span>
              <span className="text-sm font-bold text-white">{formatToman(transaction.amount)} تومان</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1">مانده تا تسویه:</span>
              <span className="text-sm font-bold text-rose-300">{formatToman(remaining)} تومان</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                مبلغ پرداختی (تومان) <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setPayAmountStr(remaining.toString())}
                className="text-[11px] text-amber-400 hover:underline"
              >
                تسویه کامل مانده ({formatToman(remaining)} ت)
              </button>
            </div>
            <input
              type="text"
              required
              value={formatToman(rawPayAmount)}
              onChange={(e) => setPayAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-mono dir-ltr outline-none text-left"
            />
            {rawPayAmount > 0 && (
              <p className="text-xs text-amber-300/90 mt-1 font-medium bg-amber-500/5 px-2.5 py-1 rounded">
                {numberToPersianWords(rawPayAmount)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">تاریخ پرداخت</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">کد رهگیری بانکی / فیش</label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="مثلاً: TRK-9801"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pr-9 pl-3 py-2 text-xs text-white font-mono dir-ltr outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">یادداشت پرداخت</label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="مثلاً: واریز از حساب سپه شرکت واته توسط مدیر مالی..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pr-9 pl-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>ثبت قطعی پرداخت</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
