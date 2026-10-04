import React, { useState } from 'react';
import { Transaction, PriorityLevel, TransactionStatus } from '../types';
import { formatToman, numberToPersianWords } from '../utils/numberToPersianWords';
import { formatShabaDisplay, getBankFromShaba } from '../utils/shaba';
import { calculateDueStatus } from '../utils/dateUtils';
import { PriorityBadge } from './PriorityBadge';
import { 
  Copy, 
  Check, 
  Calendar, 
  Phone, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ArrowUp, 
  ArrowDown, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertOctagon,
  Edit2,
  Trash2,
  DollarSign,
  Pin
} from 'lucide-react';

interface TransactionCardProps {
  transaction: Transaction;
  index: number;
  totalInList: number;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onRecordPayment: (t: Transaction) => void;
  onTogglePin: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onChangePriority: (id: string, newPriority: PriorityLevel) => void;
  onChangeStatus: (id: string, newStatus: TransactionStatus) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  index,
  totalInList,
  onEdit,
  onDelete,
  onRecordPayment,
  onTogglePin,
  onMoveUp,
  onMoveDown,
  onChangePriority,
  onChangeStatus,
}) => {
  const [copiedShaba, setCopiedShaba] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const bank = getBankFromShaba(transaction.shabaNumber);
  const dueStatus = calculateDueStatus(transaction.dueDate);
  const remaining = Math.max(0, transaction.amount - transaction.paidAmount);
  const isPaid = transaction.status === 'paid' || remaining === 0;

  const handleCopyShaba = () => {
    if (!transaction.shabaNumber) return;
    navigator.clipboard.writeText(transaction.shabaNumber);
    setCopiedShaba(true);
    setTimeout(() => setCopiedShaba(false), 2000);
  };

  const isDebt = transaction.type === 'debt';

  return (
    <div
      className={`rounded-2xl transition-all duration-200 border ${
        transaction.isPinnedTop
          ? 'bg-slate-900/95 border-amber-500/70 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
          : isPaid
          ? 'bg-slate-900/60 border-slate-800/80 opacity-80'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* ردیف بالا: نام طرف حساب، رتبه اولویت و دکمه‌های اولویت‌بندی */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
          <div className="flex items-start gap-3">
            {/* شماره ردیف / اولویت */}
            <div className="flex flex-col items-center justify-center">
              <span
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold ${
                  transaction.isPinnedTop
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : transaction.priority === 'emergency'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {transaction.priorityRank || index + 1}
              </span>
              
              {/* دکمه‌های جابجایی دستی اولویت */}
              <div className="flex flex-col mt-1 gap-0.5">
                <button
                  type="button"
                  onClick={() => onMoveUp(transaction.id)}
                  disabled={index === 0}
                  className="p-0.5 rounded text-slate-500 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-20 disabled:hover:text-slate-500"
                  title="افزایش اولویت (انتقال به بالا)"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(transaction.id)}
                  disabled={index === totalInList - 1}
                  className="p-0.5 rounded text-slate-500 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-20 disabled:hover:text-slate-500"
                  title="کاهش اولویت (انتقال به پایین)"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {transaction.fullName}
                </h3>
                {transaction.companyOrOrg && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {transaction.companyOrOrg}
                  </span>
                )}
                {transaction.category && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-400">
                    {transaction.category}
                  </span>
                )}
              </div>

              {/* نشان اولویت و دکمه تعیین "اولویت با این است" */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <PriorityBadge
                  priority={transaction.priority}
                  rank={transaction.priorityRank}
                  isPinned={transaction.isPinnedTop}
                  onPinToggle={() => onTogglePin(transaction.id)}
                  interactive={true}
                />

                <button
                  onClick={() => onTogglePin(transaction.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 font-medium ${
                    transaction.isPinnedTop
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-500/60 hover:text-amber-300'
                  }`}
                  title="با این دکمه این شخص مستقیماً به صدر لیست منتقل شده و اولویت اول پرداخت قرار می‌گیرد"
                >
                  <Pin className={`w-3 h-3 ${transaction.isPinnedTop ? 'fill-current' : ''}`} />
                  <span>{transaction.isPinnedTop ? 'اولویت اول است' : 'اولویت با این باشد'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* اکشن‌های سریع سمت چپ: وضعیت و منوی ویرایش */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* انتخابگر وضعیت */}
            <select
              value={transaction.status}
              onChange={(e) => onChangeStatus(transaction.id, e.target.value as TransactionStatus)}
              className={`text-xs rounded-xl px-2.5 py-1.5 font-medium border outline-none bg-slate-950 transition-all ${
                transaction.status === 'paid'
                  ? 'border-emerald-500/50 text-emerald-300 bg-emerald-950/20'
                  : transaction.status === 'in_progress'
                  ? 'border-amber-500/50 text-amber-300 bg-amber-950/20'
                  : 'border-slate-700 text-slate-300'
              }`}
            >
              <option value="pending">در انتظار {isDebt ? 'پرداخت' : 'وصول'}</option>
              <option value="in_progress">در حال تسویه (اقساطی)</option>
              <option value="paid">تسویه کامل شده ✓</option>
            </select>

            <button
              onClick={() => onEdit(transaction)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="ویرایش اطلاعات"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(transaction.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="حذف این مورد"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* بدنه اصلی کارت: مبالغ، شماره شبا و سررسید */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-4">
          {/* ستون مبلغ (تومان و حروفی) */}
          <div className="md:col-span-5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>{isDebt ? 'مبلغ بدهی شرکت واته' : 'مبلغ طلب شرکت واته'}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${isDebt ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                {isDebt ? 'حساب پرداختنی' : 'حساب دریافتنی'}
              </span>
            </div>
            
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {formatToman(transaction.amount)}{' '}
              <span className="text-xs font-normal text-slate-400">تومان</span>
            </div>

            {/* نمایش حروفی به فارسی */}
            <div className="text-[11px] text-amber-300/90 mt-1 font-medium leading-relaxed bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
              {numberToPersianWords(transaction.amount)}
            </div>

            {/* وضعیت باقیمانده (در صورت پرداخت اقساطی) */}
            {transaction.paidAmount > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-xs flex items-center justify-between">
                <span className="text-slate-400">پرداخت شده: {formatToman(transaction.paidAmount)} ت</span>
                <span className="font-bold text-rose-300">مانده: {formatToman(remaining)} ت</span>
              </div>
            )}
          </div>

          {/* ستون شماره شبا و نام بانک */}
          <div className="md:col-span-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  شماره شبا بانکی
                </span>
                {bank && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${bank.badgeBg} ${bank.color}`}>
                    {bank.name}
                  </span>
                )}
              </div>

              {/* کادر شبا با قابلیت کپی */}
              <div className="mt-2 flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800 group">
                <span className="font-mono text-xs text-slate-200 tracking-wider dir-ltr select-all">
                  {transaction.shabaNumber ? formatShabaDisplay(transaction.shabaNumber) : 'شماره شبا ثبت نشده'}
                </span>
                {transaction.shabaNumber && (
                  <button
                    onClick={handleCopyShaba}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] px-2"
                    title="کپی کردن شماره شبا"
                  >
                    {copiedShaba ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی شبا</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {transaction.cardNumber && (
              <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-between">
                <span>شماره کارت:</span>
                <span className="dir-ltr text-slate-300">{transaction.cardNumber}</span>
              </div>
            )}
          </div>

          {/* ستون تاریخ پرداخت و سررسید */}
          <div className="md:col-span-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>موعد {isDebt ? 'پرداخت' : 'وصول'}</span>
              </div>
              <div className="text-base font-bold text-white mt-1.5 flex items-baseline gap-2">
                <span>{transaction.jalaliDueDate}</span>
                <span className="text-[11px] font-mono text-slate-400 font-normal">
                  ({transaction.dueDate})
                </span>
              </div>
            </div>

            <div className="mt-2">
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${dueStatus.badgeClass}`}>
                {dueStatus.badgeText}
              </span>
            </div>
          </div>
        </div>

        {/* نوار پایین کارت: ثبت تسویه و نمایش جزئیات */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            {transaction.phoneNumber && (
              <a
                href={`tel:${transaction.phoneNumber}`}
                className="flex items-center gap-1 hover:text-slate-200 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono dir-ltr">{transaction.phoneNumber}</span>
              </a>
            )}

            {transaction.invoiceNumber && (
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>سند: {transaction.invoiceNumber}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* دکمه ثبت پرداخت / قسط */}
            <button
              onClick={() => onRecordPayment(transaction)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold transition-all"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{isDebt ? 'ثبت پرداخت / تسویه' : 'ثبت وصولی طلب'}</span>
            </button>

            {/* دکمه باز و بسته کردن توضیحات و سوابق */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <span>{showDetails ? 'بستن جزئیات' : 'توضیحات و سوابق'}</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* محتوای جمع‌شونده: شرح بابت فاکتور و سوابق واریزی */}
        {showDetails && (
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-3 text-xs bg-slate-950/40 p-3 rounded-xl">
            {transaction.description && (
              <div>
                <span className="font-semibold text-slate-300 block mb-1">بابت / شرح:</span>
                <p className="text-slate-400 leading-relaxed">{transaction.description}</p>
              </div>
            )}

            {transaction.paymentRecords && transaction.paymentRecords.length > 0 ? (
              <div>
                <span className="font-semibold text-slate-300 block mb-1.5">تاریخچه واریزی‌ها:</span>
                <div className="space-y-1.5">
                  {transaction.paymentRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>مبلغ: {formatToman(rec.amount)} تومان</span>
                        {rec.note && <span className="text-slate-400">({rec.note})</span>}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px] flex items-center gap-2">
                        {rec.trackingCode && <span>پیگیری: {rec.trackingCode}</span>}
                        <span>تاریخ: {rec.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-[11px]">تاکنون هیچ پرداختی برای این سند ثبت نشده است.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
