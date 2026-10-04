import React, { useState, useMemo, useRef } from 'react';
import { Transaction, HistoryItem } from '../types';
import { formatToman } from '../utils/numberToPersianWords';
import { formatShabaDisplay } from '../utils/shaba';
import { getCurrentPersianDateTime } from '../utils/dateUtils';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import { 
  FileDown, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Printer
} from 'lucide-react';

interface BackupPageProps {
  transactions: Transaction[];
  history: HistoryItem[];
}

export const BackupPage: React.FC<BackupPageProps> = ({
  transactions,
  history,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // تاریخ و ساعت لحظه‌ای سند
  const reportDateTime = useMemo(() => getCurrentPersianDateTime(new Date()), []);

  // گزینه‌های انتخاب بخش‌های گزارش
  const [includeDebts, setIncludeDebts] = useState(true);
  const [includeCredits, setIncludeCredits] = useState(true);
  const [includeSettled, setIncludeSettled] = useState(true);
  const [includeDeleted, setIncludeDeleted] = useState(true);

  // بدهی‌های فعال
  const activeDebts = useMemo(() => {
    return transactions.filter((t) => t.type === 'debt' && t.status !== 'paid');
  }, [transactions]);

  // طلب‌های فعال
  const activeCredits = useMemo(() => {
    return transactions.filter((t) => t.type === 'credit' && t.status !== 'paid');
  }, [transactions]);

  // تراکنش‌های تسویه‌شده (واریز یا وصول)
  const settledHistory = useMemo(() => {
    return history.filter((h) => h.action === 'paid' || h.action === 'collected');
  }, [history]);

  // اسناد حذف‌شده
  const deletedHistory = useMemo(() => {
    return history.filter((h) => h.action === 'deleted');
  }, [history]);

  // محاسبات مالی
  const totalDebtsAmount = useMemo(() => {
    return activeDebts.reduce((sum, item) => sum + item.amount, 0);
  }, [activeDebts]);

  const totalCreditsAmount = useMemo(() => {
    return activeCredits.reduce((sum, item) => sum + item.amount, 0);
  }, [activeCredits]);

  const netBalance = totalCreditsAmount - totalDebtsAmount;

  const totalSettledAmount = useMemo(() => {
    return settledHistory.reduce((sum, item) => sum + item.transaction.amount, 0);
  }, [settledHistory]);

  const totalDeletedAmount = useMemo(() => {
    return deletedHistory.reduce((sum, item) => sum + item.transaction.amount, 0);
  }, [deletedHistory]);

  // چاپ مستقیم یا ذخیره با موتور مرورگر
  const handlePrint = () => {
    window.print();
  };

  // تولید و دانلود مستقیم فایل واقعی PDF با html-to-image و jsPDF
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setDownloadSuccess(false);

      const element = reportRef.current;

      // تبدیل المان به تصویر با پشتیبانی کامل از CSS نوین، فونت‌های فارسی و Tailwind v4
      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      // بارگذاری تصویر جهت محاسبه ابعاد دقیق
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('بارگذاری تصویر انجام نشد'));
      });

      // ساخت سند استاندارد PDF در ابعاد A4 عمودی
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210; // عرض A4 به میلی‌متر
      const pageHeight = 297; // ارتفاع A4 به میلی‌متر
      const imgWidth = pageWidth;
      const imgHeight = (img.height * imgWidth) / img.width;

      let heightLeft = imgHeight;
      let position = 0;

      // صفحه اول
      pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // صفحات بعدی در صورت طولانی بودن جداول
      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      // نام فایل خروجی با تاریخ شمسی
      const cleanDate = reportDateTime.jalaliDate.replace(/\//g, '-');
      const filename = `گزارش_جامع_مالی_شرکت_واته_${cleanDate}.pdf`;

      // روش دانلود مستقیم و مطمئن از طریق Blob
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.style.display = 'none';
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        if (downloadLink.parentNode) {
          downloadLink.parentNode.removeChild(downloadLink);
        }
      }, 1000);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: unknown) {
      console.error('Error generating PDF:', err);
      setErrorMessage('تولید تصویر PDF به مشکل خورد. می‌توانید از دکمه «چاپ / ذخیره مستقیم به عنوان PDF» در کنار آن استفاده کنید.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* نوار کنترل و دکمه دانلود PDF */}
      <div className="no-print bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-white">پشتیبان‌گیری کامل و صدور سند PDF</h2>
            </div>
            <p className="text-xs text-slate-400">
              دانلود یکپارچه و مرتب کل اطلاعات شامل بدهی‌ها، طلب‌ها، تراکنش‌ها و اسناد حذف شده به صورت مستقیم در قالب فایل PDF
            </p>
          </div>

          {/* دکمه‌های دانلود PDF و چاپ مستقیم */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-xs"
              title="چاپ مستقیم یا ذخیره به صورت وکتور با کیفیت نامحدود"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>چاپ مستقیم / ذخیره وکتور PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                isGenerating
                  ? 'bg-emerald-800 text-white opacity-80 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 hover:scale-102 active:scale-98'
              }`}
              title="تولید و دانلود مستقیم فایل PDF بر روی دستگاه شما"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>در حال ساخت و آماده‌سازی فایل PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>فایل PDF با موفقیت دانلود شد ✓</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>دانلود فایل PDF گزارش</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* پیام خطا در صورت وجود */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-900/40 border border-rose-700/60 rounded-xl text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* گزینه‌های شامل شدن در گزارش */}
        <div className="flex items-center justify-between flex-wrap gap-3 text-xs">
          <span className="text-slate-400">انتخاب بخش‌های مندرج در فایل PDF:</span>
          <div className="flex items-center gap-3.5 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeDebts}
                onChange={(e) => setIncludeDebts(e.target.checked)}
                className="rounded accent-emerald-500 cursor-pointer"
              />
              <span>بدهی‌های شرکت ({activeDebts.length})</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeCredits}
                onChange={(e) => setIncludeCredits(e.target.checked)}
                className="rounded accent-emerald-500 cursor-pointer"
              />
              <span>طلب‌های شرکت ({activeCredits.length})</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeSettled}
                onChange={(e) => setIncludeSettled(e.target.checked)}
                className="rounded accent-emerald-500 cursor-pointer"
              />
              <span>تراکنش‌های واریز و وصول ({settledHistory.length})</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                className="rounded accent-emerald-500 cursor-pointer"
              />
              <span>بایگانی اسناد حذف‌شده ({deletedHistory.length})</span>
            </label>
          </div>
        </div>
      </div>

      {/* برگه‌ی رسمی گزارش مالی و خروجی مستقیم PDF */}
      <div
        ref={reportRef}
        id="printable-backup-report"
        className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-slate-900"
      >
        {/* ۱. سربرگ رسمی سند */}
        <div className="border-b-2 border-slate-900 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
                W
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900">
                  شرکت واته (Waateh)
                </h1>
                <p className="text-xs text-slate-600 font-semibold">
                  گزارش جامع وضعیت مالی، تعهدات، مطالبات و پشتیبان اسناد
                </p>
              </div>
            </div>

            <div className="text-left font-mono text-xs space-y-0.5">
              <div className="font-bold text-slate-900">
                کد سند: WT-REP-{reportDateTime.jalaliDate.replace(/\//g, '')}
              </div>
              <div className="text-slate-600 text-[11px]">
                {reportDateTime.dayOfWeek} {reportDateTime.jalaliDate}
              </div>
              <div className="text-slate-600 text-[11px]">
                ساعت صدور: {reportDateTime.time}
              </div>
            </div>
          </div>
        </div>

        {/* ۲. خلاصه تراز و وضعیت کلی مالی شرکت */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
            <span className="text-slate-600 block text-[11px]">کل بدهی‌های جاری (بستانکاران)</span>
            <span className="text-sm font-black font-mono text-rose-700 block mt-1">
              {formatToman(totalDebtsAmount)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{activeDebts.length} مورد باز</span>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <span className="text-slate-600 block text-[11px]">کل طلب‌های جاری (بدهکاران)</span>
            <span className="text-sm font-black font-mono text-emerald-700 block mt-1">
              {formatToman(totalCreditsAmount)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{activeCredits.length} مورد باز</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-600 block text-[11px]">تراز نهایی (طلب منهای بدهی)</span>
            <span className={`text-sm font-black font-mono block mt-1 ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatToman(netBalance)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {netBalance >= 0 ? 'تراز مثبت (مازاد طلب)' : 'تراز منفی (مازاد بدهی)'}
            </span>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
            <span className="text-slate-600 block text-[11px]">تراکنش‌های تسویه‌شده</span>
            <span className="text-sm font-black font-mono text-blue-800 block mt-1">
              {formatToman(totalSettledAmount)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{settledHistory.length} تراکنش ثبت شده</span>
          </div>
        </div>

        {/* ۳. بخش بدهی‌های شرکت واته */}
        {includeDebts && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>فهرست بدهی‌های شرکت واته (بستانکاران ما)</span>
              </h3>
              <span className="text-xs font-mono font-bold text-rose-700">
                جمع کل: {formatToman(totalDebtsAmount)} تومان ({activeDebts.length} فقره)
              </span>
            </div>

            <table className="w-full text-[11px] text-right border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-1.5 px-2 text-center w-10 border border-slate-300">ردیف</th>
                  <th className="py-1.5 px-2 text-center w-14 border border-slate-300">اولویت</th>
                  <th className="py-1.5 px-2 border border-slate-300">طرف حساب</th>
                  <th className="py-1.5 px-2 text-left border border-slate-300">مبلغ (تومان)</th>
                  <th className="py-1.5 px-2 border border-slate-300">شماره شبا و بانک</th>
                  <th className="py-1.5 px-2 text-center w-24 border border-slate-300">سررسید</th>
                  <th className="py-1.5 px-2 text-center w-20 border border-slate-300">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {activeDebts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-3 text-center text-slate-400 border border-slate-300">
                      هیچ بدهی فعالی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  activeDebts.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="py-1.5 px-2 text-center font-mono border border-slate-300">{idx + 1}</td>
                      <td className="py-1.5 px-2 text-center border border-slate-300">
                        {item.isPinnedTop ? (
                          <span className="font-bold text-slate-900">اولویت ۱</span>
                        ) : (
                          <span className="font-mono">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 font-bold text-slate-900 border border-slate-300">{item.fullName}</td>
                      <td className="py-1.5 px-2 text-left font-mono font-bold text-slate-900 border border-slate-300">
                        {formatToman(item.amount)}
                      </td>
                      <td className="py-1.5 px-2 font-mono dir-ltr text-[10px] text-slate-700 border border-slate-300">
                        {item.shabaNumber ? `${formatShabaDisplay(item.shabaNumber)} ${item.bankName ? `(${item.bankName})` : ''}` : '—'}
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-700 border border-slate-300">
                        {item.jalaliDueDate}
                      </td>
                      <td className="py-1.5 px-2 text-center text-[10px] font-bold text-rose-700 border border-slate-300">
                        در انتظار پرداخت
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {activeDebts.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td colSpan={3} className="py-1.5 px-2 text-right border border-slate-300">جمع کل بدهی‌های شرکت:</td>
                    <td className="py-1.5 px-2 text-left font-mono font-black text-rose-700 border border-slate-300">
                      {formatToman(totalDebtsAmount)}
                    </td>
                    <td colSpan={3} className="border border-slate-300"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* ۴. بخش طلب‌های شرکت واته */}
        {includeCredits && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>فهرست طلب‌های شرکت واته (بدهکاران به ما)</span>
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-700">
                جمع کل: {formatToman(totalCreditsAmount)} تومان ({activeCredits.length} فقره)
              </span>
            </div>

            <table className="w-full text-[11px] text-right border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-1.5 px-2 text-center w-10 border border-slate-300">ردیف</th>
                  <th className="py-1.5 px-2 text-center w-14 border border-slate-300">اولویت</th>
                  <th className="py-1.5 px-2 border border-slate-300">طرف حساب</th>
                  <th className="py-1.5 px-2 text-left border border-slate-300">مبلغ (تومان)</th>
                  <th className="py-1.5 px-2 text-center w-24 border border-slate-300">سررسید</th>
                  <th className="py-1.5 px-2 text-center w-20 border border-slate-300">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {activeCredits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-3 text-center text-slate-400 border border-slate-300">
                      هیچ طلبی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  activeCredits.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="py-1.5 px-2 text-center font-mono border border-slate-300">{idx + 1}</td>
                      <td className="py-1.5 px-2 text-center border border-slate-300">
                        {item.isPinnedTop ? (
                          <span className="font-bold text-slate-900">اولویت ۱</span>
                        ) : (
                          <span className="font-mono">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 font-bold text-slate-900 border border-slate-300">{item.fullName}</td>
                      <td className="py-1.5 px-2 text-left font-mono font-bold text-slate-900 border border-slate-300">
                        {formatToman(item.amount)}
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-700 border border-slate-300">
                        {item.jalaliDueDate}
                      </td>
                      <td className="py-1.5 px-2 text-center text-[10px] font-bold text-emerald-700 border border-slate-300">
                        در انتظار وصول
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {activeCredits.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td colSpan={3} className="py-1.5 px-2 text-right border border-slate-300">جمع کل طلب‌های شرکت:</td>
                    <td className="py-1.5 px-2 text-left font-mono font-black text-emerald-700 border border-slate-300">
                      {formatToman(totalCreditsAmount)}
                    </td>
                    <td colSpan={2} className="border border-slate-300"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* ۵. بخش سوابق تراکنش‌های تسویه شده (واریز و وصول) */}
        {includeSettled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>سوابق تراکنش‌های تسویه‌شده (واریزها و وصولی‌ها)</span>
              </h3>
              <span className="text-xs font-mono font-bold text-blue-800">
                جمع کل: {formatToman(totalSettledAmount)} تومان ({settledHistory.length} فقره)
              </span>
            </div>

            <table className="w-full text-[11px] text-right border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-1.5 px-2 text-center w-10 border border-slate-300">ردیف</th>
                  <th className="py-1.5 px-2 text-center w-24 border border-slate-300">نوع عملیات</th>
                  <th className="py-1.5 px-2 border border-slate-300">طرف حساب</th>
                  <th className="py-1.5 px-2 text-left border border-slate-300">مبلغ (تومان)</th>
                  <th className="py-1.5 px-2 border border-slate-300">شماره شبا و بانک</th>
                  <th className="py-1.5 px-2 text-center w-40 border border-slate-300">زمان دقیق تسویه</th>
                </tr>
              </thead>
              <tbody>
                {settledHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-3 text-center text-slate-400 border border-slate-300">
                      هیچ تراکنش تسویه‌شده‌ای در سوابق موجود نیست.
                    </td>
                  </tr>
                ) : (
                  settledHistory.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="py-1.5 px-2 text-center font-mono border border-slate-300">{idx + 1}</td>
                      <td className="py-1.5 px-2 text-center font-bold border border-slate-300">
                        <span className={item.action === 'paid' ? 'text-blue-700' : 'text-emerald-700'}>
                          {item.actionTitle}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 font-bold text-slate-900 border border-slate-300">
                        {item.transaction.fullName}
                      </td>
                      <td className="py-1.5 px-2 text-left font-mono font-bold text-slate-900 border border-slate-300">
                        {formatToman(item.transaction.amount)}
                      </td>
                      <td className="py-1.5 px-2 font-mono dir-ltr text-[10px] text-slate-700 border border-slate-300">
                        {item.transaction.shabaNumber
                          ? `${formatShabaDisplay(item.transaction.shabaNumber)} ${item.transaction.bankName ? `(${item.transaction.bankName})` : ''}`
                          : '—'}
                      </td>
                      <td className="py-1.5 px-2 text-center text-[10px] text-slate-800 border border-slate-300">
                        <span className="font-bold">{item.dayOfWeek}</span> {item.jalaliDate} - ساعت {item.time}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ۶. بخش بایگانی اسناد حذف شده */}
        {includeDeleted && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>بایگانی اسناد حذف‌شده (سوابق حذفیات کل سیستم)</span>
              </h3>
              <span className="text-xs font-mono font-bold text-rose-700">
                جمع کل: {formatToman(totalDeletedAmount)} تومان ({deletedHistory.length} فقره)
              </span>
            </div>

            <table className="w-full text-[11px] text-right border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-1.5 px-2 text-center w-10 border border-slate-300">ردیف</th>
                  <th className="py-1.5 px-2 text-center w-24 border border-slate-300">نوع سند</th>
                  <th className="py-1.5 px-2 border border-slate-300">طرف حساب</th>
                  <th className="py-1.5 px-2 text-left border border-slate-300">مبلغ (تومان)</th>
                  <th className="py-1.5 px-2 border border-slate-300">شماره شبا و بانک</th>
                  <th className="py-1.5 px-2 text-center w-40 border border-slate-300">زمان دقیق حذف</th>
                </tr>
              </thead>
              <tbody>
                {deletedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-3 text-center text-slate-400 border border-slate-300">
                      هیچ سندی تا کنون حذف نشده است (بایگانی خالی است).
                    </td>
                  </tr>
                ) : (
                  deletedHistory.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="py-1.5 px-2 text-center font-mono border border-slate-300">{idx + 1}</td>
                      <td className="py-1.5 px-2 text-center text-rose-700 font-bold border border-slate-300">
                        {item.actionTitle}
                      </td>
                      <td className="py-1.5 px-2 font-bold text-slate-900 border border-slate-300">
                        {item.transaction.fullName}
                      </td>
                      <td className="py-1.5 px-2 text-left font-mono font-bold text-slate-900 border border-slate-300">
                        {formatToman(item.transaction.amount)}
                      </td>
                      <td className="py-1.5 px-2 font-mono dir-ltr text-[10px] text-slate-700 border border-slate-300">
                        {item.transaction.shabaNumber
                          ? `${formatShabaDisplay(item.transaction.shabaNumber)} ${item.transaction.bankName ? `(${item.transaction.bankName})` : ''}`
                          : '—'}
                      </td>
                      <td className="py-1.5 px-2 text-center text-[10px] text-slate-800 border border-slate-300">
                        <span className="font-bold">{item.dayOfWeek}</span> {item.jalaliDate} - ساعت {item.time}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ۷. امضاها و تأییدیه رسمی گزارش */}
        <div className="pt-6 border-t-2 border-slate-800 grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-6">
            <span className="block font-bold text-slate-900">تأییدیه واحد مالی و حسابداری:</span>
            <div className="border-b border-dashed border-slate-300 w-48 h-8"></div>
            <span className="block text-[10px] text-slate-400">محل امضا و مهر امور مالی</span>
          </div>

          <div className="space-y-6 text-left">
            <span className="block font-bold text-slate-900">تأییدیه مدیریت عامل:</span>
            <div className="border-b border-dashed border-slate-300 w-48 h-8 mr-auto"></div>
            <span className="block text-[10px] text-slate-400">محل امضا و مهر شرکت واته</span>
          </div>
        </div>

        {/* پاورقی سند */}
        <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-2">
          این گزارش نسخه پشتیبان رسمی و مکانیزه سامانه مدیریت مالی شرکت واته است و کلیه ارقام و سوابق مستند می‌باشند.
        </div>
      </div>
    </div>
  );
};
