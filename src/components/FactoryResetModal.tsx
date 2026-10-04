import React, { useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const FactoryResetModal: React.FC<FactoryResetModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [inputCode, setInputCode] = useState('');
  const CONFIRM_CODE = 'حذف';

  if (!isOpen) return null;

  const isMatched = inputCode.trim() === CONFIRM_CODE;

  const handleConfirm = () => {
    if (!isMatched) return;
    onConfirmReset();
    setInputCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl border border-rose-200 shadow-2xl overflow-hidden animate-in fade-in">
        {/* هدر هشدار */}
        <div className="flex items-center justify-between px-5 py-4 bg-rose-50 border-b border-rose-100">
          <div className="flex items-center gap-2 text-rose-700">
            <div className="p-1.5 bg-rose-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-sm font-bold">پنجره تأیید حذف کارخانه</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setInputCode('');
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* محتوای هشدار و کد امنیتی */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200/80 text-rose-900 leading-relaxed">
            <p className="font-bold mb-1">⚠️ تمام اطلاعات و تاریخچه تراکنش‌ها پاک و صفر خواهند شد:</p>
            <p className="text-slate-600">
              با این عملیات، تمامی سوابق بدهی‌ها، طلب‌ها و <strong>کل تاریخچه تراکنش‌ها</strong> به طور دائمی پاک شده و همه ارقام به صفر مطلق بازنشانی می‌شوند.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-700 font-semibold">
              برای تأیید، کلمه <span className="text-rose-600 font-black font-mono px-2 py-0.5 bg-rose-100 rounded border border-rose-200">{CONFIRM_CODE}</span> را در کادر زیر تایپ کنید:
            </label>
            <input
              type="text"
              autoFocus
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder={`کلمه «${CONFIRM_CODE}» را اینجا بنویسید`}
              className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 focus:bg-white rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none font-bold text-center"
            />
          </div>

          {/* دکمه‌های عملیات */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setInputCode('');
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={!isMatched}
              onClick={handleConfirm}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold transition-all cursor-pointer ${
                isMatched
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 active:scale-98'
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>تأیید و صفر کردن کامل همه چیز</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
