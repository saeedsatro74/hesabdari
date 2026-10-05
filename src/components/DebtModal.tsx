import React, { useState, useEffect } from 'react';
import { Transaction, PriorityLevel, TransactionStatus } from '../types';
import { cleanShaba, getBankFromShaba } from '../utils/shaba';
import { formatToman, toEnglishDigits, numberToPersianWords } from '../utils/numberToPersianWords';
import { formatToJalali, getTodayGregorian } from '../utils/dateUtils';
import { X, Check, CreditCard, AlertCircle, FileCheck2, FileText } from 'lucide-react';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'paymentRecords' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  editingTransaction?: Transaction | null;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
}) => {
  const [fullName, setFullName] = useState('');
  const [isOfficial, setIsOfficial] = useState(false);
  const [shabaNumber, setShabaNumber] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState(getTodayGregorian());
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [isPinnedTop, setIsPinnedTop] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingTransaction && editingTransaction.type === 'debt') {
      setFullName(editingTransaction.fullName);
      setIsOfficial(!!editingTransaction.isOfficial);
      setShabaNumber(editingTransaction.shabaNumber || '');
      setAmountStr(editingTransaction.amount ? String(editingTransaction.amount) : '');
      setDueDate(editingTransaction.dueDate || getTodayGregorian());
      setPriority(editingTransaction.priority || 'high');
      setIsPinnedTop(!!editingTransaction.isPinnedTop);
      setStatus(editingTransaction.status || 'pending');
      setErrorMsg('');
    } else {
      setFullName('');
      setIsOfficial(false);
      setShabaNumber('IR');
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
  const detectedBank = getBankFromShaba(shabaNumber);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const converted = toEnglishDigits(e.target.value);
    const digitsOnly = converted.replace(/[^0-9]/g, '');
    setAmountStr(digitsOnly);
    if (errorMsg) setErrorMsg('');
  };

  const handleShabaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = toEnglishDigits(e.target.value).toUpperCase();
    if (!val.startsWith('IR') && /^\d+$/.test(val)) {
      val = 'IR' + val;
    }
    setShabaNumber(val.slice(0, 26));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('لطفاً نام بستانکار را وارد فرمایید.');
      return;
    }
    if (rawAmount <= 0) {
      setErrorMsg('لطفاً مبلغ بدهی را به تومان مشخص نمایید.');
      return;
    }

    onSave(
      {
        type: 'debt',
        fullName: fullName.trim(),
        isOfficial,
        shabaNumber: cleanShaba(shabaNumber) === 'IR' ? '' : cleanShaba(shabaNumber),
        bankName: detectedBank?.name,
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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden">
        {/* سربرگ اختصاصی بدهی */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-l from-rose-50 to-white border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {editingTransaction ? 'ویرایش سند بدهی' : 'ثبت بدهی جدید (بستانکار)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                مشخصات کامل بستانکار و شماره شبا جهت واریز
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
          {/* انتخاب رسمی یا غیر رسمی */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              نوع سند مالی / فاکتور
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setIsOfficial(true)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  isOfficial
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>رسمی (فاکتور رسمی)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOfficial(false)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  !isOfficial
                    ? 'bg-white text-slate-800 shadow-xs border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>غیر رسمی (عادی / آزاد)</span>
              </button>
            </div>
          </div>

          {/* نام بستانکار */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              نام بستانکار (شخص یا شرکت) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="مثال: شرکت بازرگانی پارس / آقای احمدی"
              className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-800 outline-none transition-colors"
            />
          </div>

          {/* شماره شبا و بانک */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 font-bold">شماره شبا (IBAN)</label>
              {detectedBank && (
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {detectedBank.name}
                </span>
              )}
            </div>
            <input
              type="text"
              value={shabaNumber}
              onChange={handleShabaChange}
              placeholder="IR000000000000000000000000"
              className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-800 font-mono dir-ltr outline-none text-center transition-colors"
            />
          </div>

          {/* مبلغ بدهی */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 font-bold">
                مبلغ بدهی (تومان) <span className="text-rose-500">*</span>
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
              placeholder="مثال: 45,000,000"
              className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-800 font-mono dir-ltr outline-none text-left font-bold text-sm transition-colors"
            />
            {rawAmount > 0 && (
              <p className="text-[11px] text-rose-700 font-medium mt-1 bg-rose-50/60 p-2 rounded-lg border border-rose-100">
                {numberToPersianWords(rawAmount)}
              </p>
            )}
          </div>

          {/* تاریخ سررسید پرداخت */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 font-bold">
                تاریخ موعد پرداخت <span className="text-rose-500">*</span>
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
              className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 outline-none transition-colors"
            />
          </div>

          {/* اولویت برتر */}
          <div className="pt-1">
            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-rose-50/40 hover:border-rose-200 transition-colors">
              <div>
                <span className="font-bold text-slate-800 block">
                  اولویت اول پرداخت (سنجاق در صدر لیست)
                </span>
                <span className="text-[10px] text-slate-400">
                  این بدهی بالاتر از سایر موارد جهت تسویه فوری قرار می‌گیرد
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPinnedTop}
                onChange={(e) => setIsPinnedTop(e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
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
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingTransaction ? 'ذخیره تغییرات بدهی' : 'ثبت بدهی جدید'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
