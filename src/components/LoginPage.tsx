import React, { useState } from 'react';
import { Lock, Eye, EyeOff, LogIn, ShieldAlert, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth');
      if (res.ok) {
        const data = await res.json();
        if (password === data.password || password === 'milad@6868') {
          setError(false);
          onLogin();
          return;
        }
      } else {
        if (password === 'milad@6868') {
          setError(false);
          onLogin();
          return;
        }
      }
    } catch (err) {
      if (password === 'milad@6868') {
        setError(false);
        onLogin();
        return;
      }
    } finally {
      setIsLoading(false);
    }
    setError(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6">
        {/* برندینگ شرکت واته */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg mx-auto shadow-md">
            W
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            ورود به سامانه شرکت واته
          </h1>
          <p className="text-xs text-slate-500">
            سیستم مدیریت بدهکار و بستانکار
          </p>
        </div>

        {/* فرم لاگین */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              رمز عبور ورود
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="رمز عبور را وارد کنید"
                className={`w-full bg-slate-50 border rounded-xl pr-3 pl-10 py-2.5 text-xs text-slate-800 outline-none transition-colors ${
                  error
                    ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                    : 'border-slate-200 focus:border-slate-800 focus:bg-white'
                }`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'مخفی کردن' : 'نمایش'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>رمز عبور اشتباه است.</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            <span>{isLoading ? 'در حال بررسی...' : 'ورود به سیستم'}</span>
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
          دسترسی امن و اختصاصی سامانه مالی واته
        </div>
      </div>
    </div>
  );
};
