import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, PriorityLevel, TransactionStatus } from '../types';
import { cleanShaba, getBankFromShaba } from '../utils/shaba';
import { formatToman, toEnglishDigits, numberToPersianWords } from '../utils/numberToPersianWords';
import { formatToJalali, getTodayGregorian } from '../utils/dateUtils';
import { X, Check } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'paymentRecords' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  editingTransaction?: Transaction | null;
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  defaultType = 'debt',
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [fullName, setFullName] = useState('');
  const [shabaNumber, setShabaNumber] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState(getTodayGregorian());
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [isPinnedTop, setIsPinnedTop] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setFullName(editingTransaction.fullName);
      setShabaNumber(editingTransaction.shabaNumber || '');
      setAmountStr(editingTransaction.amount ? String(editingTransaction.amount) : '');
      setDueDate(editingTransaction.dueDate || getTodayGregorian());
      setPriority(editingTransaction.priority || 'high');
      setIsPinnedTop(!!editingTransaction.isPinnedTop);
      setStatus(editingTransaction.status || 'pending');
      setErrorMsg('');
    } else {
      setType(defaultType);
      setFullName('');
      setShabaNumber(defaultType === 'debt' ? 'IR' : '');
      setAmountStr('');
      setDueDate(getTodayGregorian());
      setPriority('high');
      setIsPinnedTop(false);
      setStatus('pending');
      setErrorMsg('');
    }
  }, [editingTransaction, defaultType, isOpen]);

  if (!isOpen) return null;

  // استخراج ارقام خالص انگلیسی
  const cleanAmountDigits = toEnglishDigits(amountStr).replace(/[^0-9]/g, '');
  const rawAmount = cleanAmountDigits ? parseInt(cleanAmountDigits, 10) : 0;
  const isDebt = type === 'debt';
  const detectedBank = isDebt ? getBankFromShaba(shabaNumber) : null;

  // مدیریت ورود مبلغ با کیبورد فارسی و انگلیسی
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
      setErrorMsg('لطفاً نام و نام خانوادگی را وارد فرمایید.');
      return;
    }
    if (rawAmount <= 0) {
      setErrorMsg('لطفاً مبلغ بدهی یا طلب را به تومان وارد کنید.');
      return;
    }

    onSave(
      {
        type,
        fullName: fullName.trim(),
        shabaNumber: isDebt ? cleanShaba(shabaNumber) : '',
        bankName: isDebt ? detectedBank?.name : undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* هدر ساده */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800">
            {editingTransaction ? 'ویرایش اطلاعات' : isDebt ? 'ثبت بدهی جدید (بستانکار)' : 'ثبت طلب جدید'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          {/* انتخاب نوع */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('debt');
                if (!shabaNumber) setShabaNumber('IR');
              }}
              className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                type === 'debt'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              بدهی شرکت (بستانکار)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('credit');
                setShabaNumber('');
              }}
              className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                type === 'credit'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              طلب ما (بدهکار)
            </button>
          </div>

          {/* نام و نام خانوادگی */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              نام و نام خانوادگی <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="مثال: علی رضایی"
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 outline-none"
            />
          </div>

          {/* شماره شبا - فقط برای بدهی‌های شرکت (در طلب ما کاملاً مخفی است) */}
          {isDebt && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-600 font-medium">شماره شبا</label>
                {detectedBank && (
                  <span className="text-[11px] font-medium text-blue-600">
                    {detectedBank.name}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={shabaNumber}
                onChange={handleShabaChange}
                placeholder="IR000000000000000000000000"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 font-mono dir-ltr outline-none text-center"
              />
            </div>
          )}

          {/* مبلغ بدهی / طلب - با پشتیبانی کامل از صفحه کلید فارسی و انگلیسی */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 font-medium">
                مبلغ (تومان) <span className="text-rose-500">*</span>
              </label>
              {rawAmount > 0 && (
                <span className="text-[11px] text-slate-500 font-mono">
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
              placeholder="مثال: 15,000,000"
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 font-mono dir-ltr outline-none text-left"
            />
            {rawAmount > 0 && (
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                {numberToPersianWords(rawAmount)}
              </p>
            )}
          </div>

          {/* تاریخ پرداخت */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 font-medium">
                تاریخ پرداخت <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                شمسی: {formatToJalali(dueDate)}
              </span>
            </div>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-800 outline-none"
            />
          </div>

          {/* اولویت‌بندی بدون ستاره */}
          <div className="pt-1">
            <label className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <span className="font-bold text-slate-700">
                اولویت با این است (قرارگیری در صدر صف پرداخت/وصول)
              </span>
              <input
                type="checkbox"
                checked={isPinnedTop}
                onChange={(e) => setIsPinnedTop(e.target.checked)}
                className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* پیام خطا در صورت خالی بودن */}
          {errorMsg && (
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* دکمه‌ها */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingTransaction ? 'ذخیره' : 'ثبت'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
