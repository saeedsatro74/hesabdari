import React, { useState, useEffect } from 'react';
import { Transaction, PriorityLevel, TransactionStatus } from '../types';
import { formatToman, toEnglishDigits, numberToPersianWords } from '../utils/numberToPersianWords';
import { formatToJalali, getTodayGregorian } from '../utils/dateUtils';
import { X, Check, Wallet, AlertCircle } from 'lucide-react';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'paymentRecords' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  editingTransaction?: Transaction | null;
}

export const CreditModal: React.FC<CreditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
}) => {
  const [fullName, setFullName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState(getTodayGregorian());
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [isPinnedTop, setIsPinnedTop] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingTransaction && editingTransaction.type === 'credit') {
      setFullName(editingTransaction.fullName);
      setAmountStr(editingTransaction.amount ? String(editingTransaction.amount) : '');
      setDueDate(editingTransaction.dueDate || getTodayGregorian());
      setPriority(editingTransaction.priority || 'high');
      setIsPinnedTop(!!editingTransaction.isPinnedTop);
      setStatus(editingTransaction.status || 'pending');
      setErrorMsg('');
    } else {
      setFullName('');
      setAmountStr('');
      setDueDate(getTodayGregorian());
      setPriority('high');
      setIsPinnedTop(false);
      setStatus('pending');
      setErrorMsg('');
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const cleanAmountDigits = toEnglishDigits(amountStr).replace(/[^0-9]/g, '');
  const rawAmount = cleanAmountDigits ? parseInt(cleanAmountDigits, 10) : 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const converted = toEnglishDigits(e.target.value);
    const digitsOnly = converted.replace(/[^0-9]/g, '');
    setAmountStr(digitsOnly);
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('لطفاً نام بدهکار (طرف حساب) را وارد فرمایید.');
      return;
    }
    if (rawAmount <= 0) {
      setErrorMsg('لطفاً مبلغ طلب را به تومان مشخص نمایید.');
      return;
    }

    onSave(
      {
        type: 'credit',
        fullName: fullName.trim(),
        shabaNumber: '',
        amount: rawAmount,
        paidAmount: editingTransaction ? editingTransaction.paidAmount : 0,
        dueDate,
        jalaliDueDate: formatToJalali(dueDate),
        priority,
        priorityRank: isPinnedTop ? 1 : 2,
        isPinnedTop,
        status,
      },
      editingTransaction?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden">
        {/* سربرگ اختصاصی طلب */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-l from-emerald-50 to-white border-b border-emerald-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {editingTransaction ? 'ویرایش سند طلب' : 'ثبت طلب جدید (بدهکاران)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                مشخصات کامل بدهکار و موعد پیگیری وصول
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* نام بدهکار (طرف حساب) */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              نام بدهکار (طرف حساب) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="مثال: آقای کریمی / فروشگاه مرکزی"
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-800 outline-none transition-colors"
            />
          </div>

          {/* مبلغ طلب */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 font-bold">
                مبلغ طلب (تومان) <span className="text-rose-500">*</span>
              </label>
              {rawAmount > 0 && (
                <span className="text-[11px] text-slate-600 font-mono font-bold">
                  {formatToman(rawAmount)} تومان
                </span>
              )}
            </div>
            <input
              type="text"
              inputMode="numeric"
              required
              value={rawAmount > 0 ? rawAmount.toLocaleString('en-US') : cleanAmountDigits}
              onChange={handleAmountChange}
              placeholder="مثال: 25,000,000"
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-800 font-mono dir-ltr outline-none text-left font-bold text-sm transition-colors"
            />
            {rawAmount > 0 && (
              <p className="text-[11px] text-emerald-800 font-medium mt-1 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                {numberToPersianWords(rawAmount)}
              </p>
            )}
          </div>

          {/* تاریخ موعد وصول */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 font-bold">
                تاریخ موعد وصول <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                تاریخ شمسی: {formatToJalali(dueDate)}
              </span>
            </div>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 outline-none transition-colors"
            />
          </div>

          {/* اولویت برتر وصول */}
          <div className="pt-1">
            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-emerald-50/40 hover:border-emerald-200 transition-colors">
              <div>
                <span className="font-bold text-slate-800 block">
                  اولویت اول وصول (سنجاق در صدر لیست)
                </span>
                <span className="text-[10px] text-slate-400">
                  این طلب در بالاترین اولویت پیگیری و وصول قرار خواهد گرفت
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPinnedTop}
                onChange={(e) => setIsPinnedTop(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* پیام خطا */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* دکمه‌های ثبت و انصراف */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingTransaction ? 'ذخیره تغییرات طلب' : 'ثبت طلب جدید'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
