import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, TransactionType, TransactionStatus, HistoryItem } from './types';
import { INITIAL_TRANSACTIONS, INITIAL_HISTORY } from './data/sampleData';
import { formatToman } from './utils/numberToPersianWords';
import { formatShabaDisplay, getBankFromShaba } from './utils/shaba';
import { calculateDueStatus, getCurrentPersianDateTime } from './utils/dateUtils';
import { DebtModal } from './components/DebtModal';
import { CreditModal } from './components/CreditModal';
import { LoginPage } from './components/LoginPage';
import { LogoutModal } from './components/LogoutModal';
import { HistoryPage } from './components/HistoryPage';
import { BackupPage } from './components/BackupPage';
import { supabase, safeSupabaseUpsertTransactions, safeSupabaseInsertTransaction } from './lib/supabase';
import { 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Search, 
  ChevronUp, 
  ChevronDown, 
  LogOut, 
  History, 
  Archive,
  FileDown,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Wallet,
  FileCheck2,
  FileText,
  BarChart3,
  X 
} from 'lucide-react';

const STORAGE_KEY = 'waateh_simple_v3';
const HISTORY_KEY = 'waateh_history_v1';
const AUTH_KEY = 'waateh_auth_v1';

type ActiveView = 'dashboard' | 'history' | 'deleted' | 'backup';
type SortField = 'priority' | 'fullName' | 'shaba' | 'amount' | 'dueDate' | 'status';
type SortDirection = 'asc' | 'desc';

export default function App() {
  // وضعیت لاگین
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleLogin = () => {
    try {
      localStorage.setItem(AUTH_KEY, 'true');
    } catch {}
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {}
    setIsAuthenticated(false);
  };

  // داده‌های تراکنش‌های فعال
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const isInitialLoadDone = useRef(false);

  // بارگذاری داده‌ها از پایگاه‌داده و سوپابیس در بدو اجرای برنامه
  useEffect(() => {
    async function loadDataFromDB() {
      let loadedTransactions: Transaction[] | null = null;
      let loadedHistory: HistoryItem[] | null = null;

      // روش ۱: فراخوانی از API سرور (در محیط‌هایی که سرور نود فعال است)
      try {
        const [txRes, histRes] = await Promise.all([
          fetch('/api/transactions').catch(() => null),
          fetch('/api/history').catch(() => null),
        ]);

        if (txRes && txRes.ok) {
          const contentType = txRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const dbTx = await txRes.json();
            if (Array.isArray(dbTx)) {
              loadedTransactions = dbTx;
            }
          }
        }

        if (histRes && histRes.ok) {
          const contentType = histRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const dbHist = await histRes.json();
            if (Array.isArray(dbHist)) {
              loadedHistory = dbHist;
            }
          }
        }
      } catch (err) {
        console.warn('Server API not responding, using direct Supabase fallback:', err);
      }

      // روش ۲: اتصال مستقیم به سوپابیس (حیاتی برای تمام دامنه‌ها از جمله ورسل)
      if (loadedTransactions === null) {
        try {
          const { data: supaTx, error: supaTxErr } = await supabase
            .from('transactions')
            .select('*');

          if (!supaTxErr && Array.isArray(supaTx)) {
            loadedTransactions = supaTx.map((t: any) => {
              const rawStatus = t.status || 'pending';
              const isOfficial = rawStatus.includes('#official') || rawStatus.includes(':official') || Boolean(t.is_official ?? t.isOfficial);
              const cleanStatus = (rawStatus.split('#')[0].split(':')[0] || 'pending') as TransactionStatus;

              return {
                id: t.id,
                type: t.type,
                fullName: t.full_name || t.fullName,
                isOfficial,
                amount: Number(t.amount) || 0,
                paidAmount: Number(t.paid_amount) || Number(t.paidAmount) || 0,
                shabaNumber: t.shaba_number || t.shabaNumber || '',
                cardNumber: t.card_number || t.cardNumber || '',
                bankName: t.bank_name || t.bankName || '',
                dueDate: t.due_date || t.dueDate || '',
                jalaliDueDate: t.jalali_due_date || t.jalaliDueDate || '',
                priority: (Number(t.priority) === 1 || t.priority === 'emergency' || t.priority === 'high') ? 'emergency' : t.priority === 3 ? 'low' : 'medium',
                priorityRank: Number(t.priority) || 1,
                isPinnedTop: Boolean(t.is_pinned_top ?? t.isPinnedTop),
                status: cleanStatus,
                paymentRecords: t.payment_records || t.paymentRecords || [],
                createdAt: t.created_at || t.createdAt || new Date().toISOString(),
                updatedAt: t.updated_at || t.updatedAt || new Date().toISOString(),
              };
            });
          }
        } catch (supaErr) {
          console.warn('Direct Supabase fetch error:', supaErr);
        }
      }

      if (loadedHistory === null) {
        try {
          const { data: supaHist, error: supaHistErr } = await supabase
            .from('history')
            .select('*');

          if (!supaHistErr && Array.isArray(supaHist)) {
            loadedHistory = supaHist.map((h: any) => ({
              id: h.id,
              action: h.action,
              actionTitle: h.action_title || h.actionTitle,
              timestamp: h.timestamp,
              dayOfWeek: h.day_of_week || h.dayOfWeek,
              jalaliDate: h.jalali_date || h.jalaliDate,
              time: h.time,
              readableFull: h.readable_full || h.readableFull,
              transaction: h.transaction_data || h.transactionData || h.transaction,
            }));
          }
        } catch (supaErr) {
          console.warn('Direct Supabase history fetch error:', supaErr);
        }
      }

      if (loadedTransactions !== null) {
        setTransactions(loadedTransactions);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedTransactions));
        } catch {}
      }

      if (loadedHistory !== null) {
        setHistory(loadedHistory);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(loadedHistory));
        } catch {}
      }
    }

    loadDataFromDB().finally(() => {
      isInitialLoadDone.current = true;
    });
  }, []);

  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }

    // ۱. ارسال به سرور لوکال
    fetch('/api/transactions/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions }),
    }).catch(() => {});

    // ۲. ارسال مستقیم و همگام‌سازی لحظه‌ای با سوپابیس
    if (transactions.length > 0) {
      const supaRows = transactions.map((t) => ({
        id: t.id,
        type: t.type,
        full_name: t.fullName,
        is_official: Boolean(t.isOfficial),
        amount: Number(t.amount) || 0,
        shaba_number: t.shabaNumber || null,
        bank_name: t.bankName || null,
        jalali_due_date: t.jalaliDueDate || '',
        priority:
          Number(t.priorityRank) ||
          (t.priority === 'emergency' || t.priority === 'high'
            ? 1
            : t.priority === 'low'
            ? 3
            : 2),
        is_pinned_top: Boolean(t.isPinnedTop),
        status: `${t.status || 'pending'}#${t.isOfficial ? 'official' : 'unofficial'}`,
        updated_at: new Date().toISOString(),
      }));

      safeSupabaseUpsertTransactions(supaRows).then(
        ({ error }) => {
          if (error) console.error('Supabase transactions upsert error:', error);
        }
      );
    } else {
      // اگر تمام تراکنش‌ها پاک شدند
      supabase
        .from('transactions')
        .delete()
        .neq('id', '__none__')
        .then(() => {}, () => {});
    }
  }, [transactions]);

  // داده‌های تاریخچه رویدادها و اسناد
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }

    // ۱. ارسال به سرور لوکال
    fetch('/api/history/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history }),
    }).catch(() => {});

    // ۲. ارسال مستقیم به سوپابیس برای همگام‌سازی تاریخچه
    if (history.length > 0) {
      const supaRows = history.map((h) => ({
        id: h.id,
        action: h.action,
        action_title: h.actionTitle,
        timestamp: h.timestamp,
        day_of_week: h.dayOfWeek,
        jalali_date: h.jalaliDate,
        time: h.time,
        readable_full: h.readableFull,
        transaction_data: h.transaction,
      }));
      supabase
        .from('history')
        .upsert(supaRows, { onConflict: 'id' })
        .then(() => {}, () => {});
    }
  }, [history]);

  // نمای فعال: صفحه اصلی دو ستونه، تاریخچه واریز و وصول، سطل زباله، یا پشتیبان‌گیری
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // پنجره‌های اختصاصی داخل برنامه
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);

  // مرتب‌سازی ستون‌ها
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleHeaderClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'amount' ? 'desc' : 'asc');
    }
  };

  // ثبت در تاریخچه با تاریخ، ساعت و روز هفته دقیق
  const addToHistory = (action: HistoryItem['action'], actionTitle: string, item: Transaction) => {
    const dt = getCurrentPersianDateTime(new Date());
    const newLog: HistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action,
      actionTitle,
      transaction: { ...item },
      timestamp: new Date().toISOString(),
      dayOfWeek: dt.dayOfWeek,
      jalaliDate: dt.jalaliDate,
      time: dt.time,
      readableFull: dt.readableFull,
    };
    setHistory((prev) => [newLog, ...prev]);
  };

  // محاسبه ارقام بالا
  const { totalDebts, totalCredits, netBalance } = useMemo(() => {
    let debts = 0;
    let credits = 0;
    transactions.forEach((t) => {
      if (t.status !== 'paid') {
        if (t.type === 'debt') debts += t.amount;
        else credits += t.amount;
      }
    });
    return {
      totalDebts: debts,
      totalCredits: credits,
      netBalance: credits - debts,
    };
  }, [transactions]);

  const deletedCount = useMemo(() => history.filter((h) => h.action === 'deleted').length, [history]);
  const settledCount = useMemo(() => history.filter((h) => h.action === 'paid' || h.action === 'collected').length, [history]);

  // لیست بستانکارها (بدهی‌های ما)
  const debtList = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'debt' && t.status !== 'paid')
      .filter((t) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          t.fullName.toLowerCase().includes(s) ||
          (t.shabaNumber && t.shabaNumber.toLowerCase().includes(s)) ||
          String(t.amount).includes(s) ||
          (t.jalaliDueDate && t.jalaliDueDate.includes(s))
        );
      })
      .sort((a, b) => {
        let compare = 0;
        if (sortField === 'amount') {
          compare = a.amount - b.amount;
        } else if (sortField === 'dueDate') {
          compare = (a.jalaliDueDate || '').localeCompare(b.jalaliDueDate || '');
        } else if (sortField === 'fullName') {
          compare = a.fullName.localeCompare(b.fullName, 'fa');
        } else if (sortField === 'shaba') {
          compare = (a.shabaNumber || '').localeCompare(b.shabaNumber || '');
        } else {
          if (a.isPinnedTop && !b.isPinnedTop) return -1;
          if (!a.isPinnedTop && b.isPinnedTop) return 1;
          compare = (a.priorityRank || 0) - (b.priorityRank || 0);
        }
        return sortDirection === 'asc' ? compare : -compare;
      });
  }, [transactions, search, sortField, sortDirection]);

  // لیست طلب‌های ما (بدهکاران)
  const creditList = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'credit' && t.status !== 'paid')
      .filter((t) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          t.fullName.toLowerCase().includes(s) ||
          String(t.amount).includes(s) ||
          (t.jalaliDueDate && t.jalaliDueDate.includes(s))
        );
      })
      .sort((a, b) => {
        let compare = 0;
        if (sortField === 'amount') {
          compare = a.amount - b.amount;
        } else if (sortField === 'dueDate') {
          compare = (a.jalaliDueDate || '').localeCompare(b.jalaliDueDate || '');
        } else if (sortField === 'fullName') {
          compare = a.fullName.localeCompare(b.fullName, 'fa');
        } else {
          if (a.isPinnedTop && !b.isPinnedTop) return -1;
          if (!a.isPinnedTop && b.isPinnedTop) return 1;
          compare = (a.priorityRank || 0) - (b.priorityRank || 0);
        }
        return sortDirection === 'asc' ? compare : -compare;
      });
  }, [transactions, search, sortField, sortDirection]);

  // تنظیم اولویت برتر
  const handleSetTopPriority = (id: string) => {
    setTransactions((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;

      if (target.isPinnedTop) {
        return prev.map((t) => (t.id === id ? { ...t, isPinnedTop: false } : t));
      }

      return prev.map((t) => {
        if (t.id === id) {
          return { ...t, isPinnedTop: true, priorityRank: 1 };
        }
        return {
          ...t,
          isPinnedTop: false,
          priorityRank: t.type === target.type ? (t.priorityRank || 1) + 1 : t.priorityRank,
        };
      });
    });
  };

  // جابجایی ترتیبی به بالا در همان دسته
  const handleMoveUp = (id: string) => {
    setTransactions((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      const sameTypeList = prev.filter((t) => t.type === target.type && t.status !== 'paid');
      const idx = sameTypeList.findIndex((t) => t.id === id);
      if (idx <= 0) return prev;

      const prevItem = sameTypeList[idx - 1];
      const targetRank = target.priorityRank || idx + 1;
      const prevRank = prevItem.priorityRank || idx;

      return prev.map((t) => {
        if (t.id === target.id) return { ...t, priorityRank: prevRank };
        if (t.id === prevItem.id) return { ...t, priorityRank: targetRank };
        return t;
      });
    });
  };

  // جابجایی ترتیبی به پایین در همان دسته
  const handleMoveDown = (id: string) => {
    setTransactions((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      const sameTypeList = prev.filter((t) => t.type === target.type && t.status !== 'paid');
      const idx = sameTypeList.findIndex((t) => t.id === id);
      if (idx === -1 || idx >= sameTypeList.length - 1) return prev;

      const nextItem = sameTypeList[idx + 1];
      const targetRank = target.priorityRank || idx + 1;
      const nextRank = nextItem.priorityRank || idx + 2;

      return prev.map((t) => {
        if (t.id === target.id) return { ...t, priorityRank: nextRank };
        if (t.id === nextItem.id) return { ...t, priorityRank: targetRank };
        return t;
      });
    });
  };

  // کپی شماره شبا
  const handleCopyShaba = (id: string, shaba: string) => {
    if (!shaba) return;
    navigator.clipboard.writeText(shaba);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // ثبت تسویه (واریز یا وصول) و انتقال مستقیم به تاریخچه تراکنش‌ها
  const handleSettleItem = async (id: string) => {
    const item = transactions.find((t) => t.id === id);
    if (!item) return;

    const action = item.type === 'debt' ? 'paid' : 'collected';
    const actionTitle = item.type === 'debt' ? 'واریز شد (بدهی ما)' : 'وصول شد (طلب ما)';

    // انتقال به تاریخچه با روز، تاریخ و ساعت دقیق
    addToHistory(action, actionTitle, { ...item, status: 'paid' });

    // خارج کردن از لیست بازها
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // حذف قطعی از سوپابیس و سرور
    supabase.from('transactions').delete().eq('id', id).then(() => {}, () => {});
    fetch(`/api/transactions/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  // ذخیره سند جدید یا ویرایش شده
  const handleSave = async (
    data: Omit<Transaction, 'id' | 'paymentRecords' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const now = new Date().toISOString();
    const priorityRank =
      Number(data.priorityRank) ||
      (data.priority === 'emergency' || data.priority === 'high'
        ? 1
        : data.priority === 'low'
        ? 3
        : 2);

    if (id) {
      const existing = transactions.find((t) => t.id === id);
      const updatedItem: Transaction = {
        ...data,
        id,
        priorityRank,
        paymentRecords: existing?.paymentRecords || [],
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      setTransactions((prev) => prev.map((t) => (t.id === id ? updatedItem : t)));

      // ارسال مستقیم به سوپابیس
      try {
        await safeSupabaseUpsertTransactions([
          {
            id,
            type: updatedItem.type,
            full_name: updatedItem.fullName,
            is_official: Boolean(updatedItem.isOfficial),
            amount: Number(updatedItem.amount) || 0,
            shaba_number: updatedItem.shabaNumber || null,
            bank_name: updatedItem.bankName || null,
            jalali_due_date: updatedItem.jalaliDueDate || '',
            priority: priorityRank,
            is_pinned_top: Boolean(updatedItem.isPinnedTop),
            status: `${updatedItem.status || 'pending'}#${updatedItem.isOfficial ? 'official' : 'unofficial'}`,
            updated_at: now,
          }
        ]);
      } catch (err) {
        console.warn('Supabase direct update error:', err);
      }
    } else {
      const newId = `tx-${Date.now()}`;
      const newItem: Transaction = {
        ...data,
        id: newId,
        priorityRank,
        paymentRecords: [],
        createdAt: now,
        updatedAt: now,
      };

      if (data.isPinnedTop) {
        setTransactions((prev) => [
          newItem,
          ...prev.map((t) => ({ ...t, isPinnedTop: false, priorityRank: (t.priorityRank || 1) + 1 })),
        ]);
      } else {
        setTransactions((prev) => [...prev, newItem]);
      }

      // ارسال مستقیم به سوپابیس
      try {
        await safeSupabaseInsertTransaction({
          id: newId,
          type: newItem.type,
          full_name: newItem.fullName,
          is_official: Boolean(newItem.isOfficial),
          amount: Number(newItem.amount) || 0,
          shaba_number: newItem.shabaNumber || null,
          bank_name: newItem.bankName || null,
          jalali_due_date: newItem.jalaliDueDate || '',
          priority: priorityRank,
          is_pinned_top: Boolean(newItem.isPinnedTop),
          status: `${newItem.status || 'pending'}#${newItem.isOfficial ? 'official' : 'unofficial'}`,
          created_at: now,
          updated_at: now,
        });
      } catch (err) {
        console.warn('Supabase direct insert error:', err);
      }
    }
  };

  // حذف مورد انتخابی با ثبت دائمی در تاریخچه
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete.id;

    // ثبت در تاریخچه به عنوان حذف شده با روز، تاریخ و ساعت دقیق
    const actionTitle = itemToDelete.type === 'debt' ? 'حذف شده (بدهی ما)' : 'حذف شده (طلب ما)';
    addToHistory('deleted', actionTitle, itemToDelete);

    // حذف از لیست جاری
    setTransactions((prev) => prev.filter((t) => t.id !== targetId));
    setItemToDelete(null);

    // حذف فوری و قطعی از سوپابیس و سرور
    try {
      await supabase.from('transactions').delete().eq('id', targetId);
      await fetch(`/api/transactions/${targetId}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {
      console.warn('Delete transaction error:', e);
    }
  };

  // بازیابی سند از تاریخچه به لیست فعال
  const handleRestoreFromHistory = async (historyItem: HistoryItem) => {
    const newId = `tx-restored-${Date.now()}`;
    const restoredItem: Transaction = {
      ...historyItem.transaction,
      id: newId,
      status: 'pending',
    };
    setTransactions((prev) => [restoredItem, ...prev]);
    setActiveView('dashboard');

    const priorityRank = Number(restoredItem.priorityRank) || 1;
    // ارسال به سوپابیس
    try {
      await safeSupabaseInsertTransaction({
        id: newId,
        type: restoredItem.type,
        full_name: restoredItem.fullName,
        is_official: Boolean(restoredItem.isOfficial),
        amount: Number(restoredItem.amount) || 0,
        shaba_number: restoredItem.shabaNumber || null,
        bank_name: restoredItem.bankName || null,
        jalali_due_date: restoredItem.jalaliDueDate || '',
        priority: priorityRank,
        is_pinned_top: Boolean(restoredItem.isPinnedTop),
        status: `${restoredItem.status || 'pending'}#${restoredItem.isOfficial ? 'official' : 'unofficial'}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase restore insert error:', e);
    }
  };

  // انتقال تراکنش از واریز/وصول به سطل زباله (اسناد حذف‌شده)
  const handleMoveHistoryToTrash = (historyId: string) => {
    setHistory((prev) =>
      prev.map((h) => {
        if (h.id === historyId) {
          const actionTitle = h.transaction.type === 'debt' ? 'حذف شده (واریز شده بود)' : 'حذف شده (وصول شده بود)';
          return {
            ...h,
            action: 'deleted',
            actionTitle,
          };
        }
        return h;
      })
    );
  };

  // حذف قطعی و دائمی یک سند از سطل زباله و سوپابیس
  const handlePermanentDeleteHistory = async (historyId: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== historyId));
    try {
      await supabase.from('history').delete().eq('id', historyId);
      await fetch(`/api/history/${historyId}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {
      console.warn('Supabase permanent delete history error:', e);
    }
  };

  // تخلیه کامل تمام موارد داخل سطل زباله
  const handleEmptyTrash = async () => {
    setHistory((prev) => prev.filter((h) => h.action !== 'deleted'));
    try {
      await supabase.from('history').delete().eq('action', 'deleted');
      await fetch('/api/history-trash/clear', { method: 'DELETE' }).catch(() => {});
    } catch (e) {
      console.warn('Supabase empty trash error:', e);
    }
  };

  // آیکون مرتب‌سازی ستون
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <span className="inline-block opacity-0 group-hover:opacity-40 transition-opacity mr-1">
          <ChevronDown className="w-3.5 h-3.5 inline" />
        </span>
      );
    }
    return (
      <span className="inline-block text-blue-600 font-bold mr-1">
        {sortDirection === 'asc' ? (
          <ChevronUp className="w-3.5 h-3.5 inline" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 inline" />
        )}
      </span>
    );
  };

  // اگر لاگین نکرده بود
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 p-4 sm:p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* بالای صفحه: عنوان، خلاصه تراز، دکمه‌های کم‌کاربرد در گوشه، و دکمه خروج */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              W
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                شرکت واته (Waateh)
              </h1>
            </div>
          </div>

          {/* خلاصه ارقام تراز مالی در یک نگاه */}
          <div className="flex items-center gap-4 text-xs bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
            <div>
              <span className="text-slate-500">بدهی ما (بستانکاران): </span>
              <span className="font-bold text-rose-600 font-mono">{formatToman(totalDebts)}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-300" />
            <div>
              <span className="text-slate-500">طلب ما (بدهکاران): </span>
              <span className="font-bold text-emerald-600 font-mono">{formatToman(totalCredits)}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-300" />
            <div>
              <span className="text-slate-500">تراز کل: </span>
              <span className={`font-bold font-mono ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatToman(netBalance)}
              </span>
            </div>
          </div>

          {/* گوشه ابزارها: ۳ دکمه کم‌کاربرد (تراکنش‌ها، سطل زباله، پشتیبان) و خروج */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveView('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeView === 'history'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="تاریخچه تراکنش‌های واریز و وصول"
              >
                <History className="w-3.5 h-3.5 text-blue-600" />
                <span>تراکنش‌ها</span>
                {settledCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-mono">
                    {settledCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveView('deleted')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeView === 'deleted'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="سطل زباله اسناد حذف‌شده"
              >
                <Archive className="w-3.5 h-3.5 text-rose-600" />
                <span>حذف شده‌ها</span>
                {deletedCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-mono">
                    {deletedCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveView('backup')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeView === 'backup'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="پشتیبان‌گیری و پایگاه‌داده"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-600" />
                <span>پشتیبان</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs transition-colors cursor-pointer"
              title="خروج از سامانه"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {/* نمایش صفحات فرعی (پشتیبان‌گیری، تاریخچه، یا سطل زباله) */}
        {activeView === 'backup' ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به میز کار (صفحه اصلی بستانکاران و طلب‌ها)</span>
            </button>
            <BackupPage transactions={transactions} history={history} />
          </div>
        ) : activeView === 'history' || activeView === 'deleted' ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به میز کار (صفحه اصلی بستانکاران و طلب‌ها)</span>
            </button>
            <HistoryPage
              history={history}
              onRestore={handleRestoreFromHistory}
              onMoveToTrash={handleMoveHistoryToTrash}
              onPermanentDelete={handlePermanentDeleteHistory}
              onEmptyTrash={handleEmptyTrash}
              mode={activeView === 'deleted' ? 'deleted' : 'settled'}
            />
          </div>
        ) : (
          /* صفحه اصلی: میز کار دو ستونه (بستانکاران یک طرف و طلب‌ها طرف دیگر) */
          <div className="space-y-4">
            {/* نوار جستجو و راهنمای مرتب‌سازی */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="relative w-full sm:w-96">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجو در بین بستانکاران و طلب‌ها (نام، شبا، مبلغ، سررسید)..."
                  className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span>روی عنوان هر ستون (اولویت، نام، مبلغ، سررسید) کلیک کنید تا مرتب شود.</span>
                {sortField !== 'priority' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSortField('priority');
                      setSortDirection('asc');
                    }}
                    className="text-blue-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>بازگشت به اولویت دستی</span>
                  </button>
                )}
              </div>
            </div>

            {/* دو تیکه کردن صفحه: بستانکارها در یک ستون و طلب‌های ما در ستون دیگر */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
              
              {/* ستون اول: بستانکاران (بدهی‌های شرکت واته) */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                    <div>
                      <h2 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                        <span>بستانکارها (بدهی‌های ما)</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white text-rose-700 font-mono border border-rose-200">
                          {debtList.length} سند
                        </span>
                      </h2>
                      <div className="text-left font-mono font-bold text-rose-600 text-xs sm:text-sm mt-0.5">
                        مجموع: {formatToman(totalDebts)} تومان
                      </div>
                    </div>
                  </div>

                  {/* دکمه بزرگتر ثبت بدهی */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setIsDebtModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ ثبت بدهی جدید</span>
                  </button>
                </div>

                {/* جدول بستانکاران با هدرهای کلیک‌پذیر جهت مرتب‌سازی */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 text-slate-700 border-b border-slate-200 select-none text-[11px] font-bold">
                        {/* ستون اولویت */}
                        <th
                          onClick={() => handleHeaderClick('priority')}
                          className={`py-2.5 px-2 text-center w-20 cursor-pointer hover:bg-slate-100 transition-colors group ${
                            sortField === 'priority' ? 'bg-slate-100 text-slate-900 font-bold' : ''
                          }`}
                          title="کلیک برای مرتب‌سازی بر اساس اولویت"
                        >
                          <div className="flex items-center justify-center gap-0.5">
                            <span>اولویت</span>
                            {renderSortIndicator('priority')}
                          </div>
                        </th>

                        {/* ستون بستانکار و شماره شبا */}
                        <th
                          onClick={() => handleHeaderClick('fullName')}
                          className={`py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors group ${
                            sortField === 'fullName' ? 'bg-slate-100 text-slate-900 font-bold' : ''
                          }`}
                          title="کلیک برای مرتب‌سازی بر اساس نام"
                        >
                          <div className="flex items-center gap-0.5">
                            <span>بستانکار و شماره شبا</span>
                            {renderSortIndicator('fullName')}
                          </div>
                        </th>

                        {/* ستون مبلغ */}
                        <th
                          onClick={() => handleHeaderClick('amount')}
                          className={`py-2.5 px-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group ${
                            sortField === 'amount' ? 'bg-slate-100 text-slate-900 font-bold' : ''
                          }`}
                          title="کلیک برای مرتب‌سازی بر اساس مبلغ"
                        >
                          <div className="flex items-center justify-end gap-0.5">
                            <span>مبلغ (تومان)</span>
                            {renderSortIndicator('amount')}
                          </div>
                        </th>

                        {/* ستون سررسید */}
                        <th
                          onClick={() => handleHeaderClick('dueDate')}
                          className={`py-2.5 px-2 text-center w-28 cursor-pointer hover:bg-slate-100 transition-colors group ${
                            sortField === 'dueDate' ? 'bg-slate-100 text-slate-900 font-bold' : ''
                          }`}
                          title="کلیک برای مرتب‌سازی بر اساس تاریخ پرداخت"
                        >
                          <div className="flex items-center justify-center gap-0.5">
                            <span>سررسید</span>
                            {renderSortIndicator('dueDate')}
                          </div>
                        </th>

                        <th className="py-2.5 px-2 text-center w-20">تسویه</th>
                        <th className="py-2.5 px-2 text-center w-14">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {debtList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                            هیچ بدهی بازی ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        debtList.map((item, idx) => {
                          const bank = getBankFromShaba(item.shabaNumber);
                          const due = calculateDueStatus(item.dueDate);

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-rose-50/20 transition-colors ${
                                item.isPinnedTop ? 'bg-amber-50/40' : ''
                              }`}
                            >
                              {/* اولویت */}
                              <td className="py-2.5 px-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSetTopPriority(item.id)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                      item.isPinnedTop
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                    title={item.isPinnedTop ? 'برداشتن اولویت ۱' : 'تعیین به عنوان اولویت اول'}
                                  >
                                    {item.isPinnedTop ? 'اولویت ۱' : `#${idx + 1}`}
                                  </button>
                                  <div className="flex flex-col">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveUp(item.id)}
                                      disabled={idx === 0}
                                      className="text-slate-300 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                      title="جابجایی به بالا"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveDown(item.id)}
                                      disabled={idx === debtList.length - 1}
                                      className="text-slate-300 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                      title="جابجایی به پایین"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* بستانکار و شبا */}
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                  <span>{item.fullName}</span>
                                  {item.isOfficial ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200" title="فاکتور رسمی">
                                      <FileCheck2 className="w-2.5 h-2.5 text-blue-600" />
                                      <span>رسمی</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200" title="سند عادی / غیررسمی">
                                      <FileText className="w-2.5 h-2.5 text-slate-400" />
                                      <span>غیررسمی</span>
                                    </span>
                                  )}
                                  {item.isPinnedTop && (
                                    <span className="text-[9px] bg-slate-900 text-white font-bold px-1 py-0.2 rounded">
                                      اولویت اول
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="font-mono dir-ltr text-[10px] text-slate-600 select-all">
                                    {formatShabaDisplay(item.shabaNumber) || '—'}
                                  </span>
                                  {item.shabaNumber && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyShaba(item.id, item.shabaNumber)}
                                      className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                                      title="کپی شماره شبا"
                                    >
                                      {copiedId === item.id ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                  {bank && (
                                    <span className="text-[10px] text-slate-400">
                                      ({bank.name})
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* مبلغ */}
                              <td className="py-2.5 px-3 text-left font-mono font-bold text-rose-600 text-xs">
                                {formatToman(item.amount)}
                              </td>

                              {/* سررسید */}
                              <td className="py-2.5 px-2 text-center">
                                <div className="font-mono text-slate-700 text-[11px]">{item.jalaliDueDate || '—'}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{due.badgeText}</div>
                              </td>

                              {/* تسویه (واریز شد) */}
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleSettleItem(item.id)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-2xs"
                                  title="ثبت واریز و انتقال مستقیم به تاریخچه"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>واریز شد</span>
                                </button>
                              </td>

                              {/* عملیات */}
                              <td className="py-2.5 px-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingItem(item);
                                      setIsDebtModalOpen(true);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                                    title="ویرایش"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setItemToDelete(item)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    title="حذف و انتقال به سطل زباله"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ستون دوم: طلب‌های ما (بدهکاران به شرکت واته) */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <h2 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                        <span>طلب‌های ما (بدهکاران)</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white text-emerald-700 font-mono border border-emerald-200">
                          {creditList.length} سند
                        </span>
                      </h2>
                      <div className="text-left font-mono font-bold text-emerald-600 text-xs sm:text-sm mt-0.5">
                        مجموع: {formatToman(totalCredits)} تومان
                      </div>
                    </div>
                  </div>

                  {/* دکمه بزرگتر ثبت طلب */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setIsCreditModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ ثبت طلب جدید</span>
                  </button>
                </div>

                {/* جدول طلب‌ها با هدرهای کلیک‌پذیر جهت مرتب‌سازی */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 text-slate-700 border-b border-slate-200 select-none text-[11px] font-bold">
                        {/* ستون اولویت */}
                        <th
                          onClick={() => handleHeaderClick('priority')}
                          className={`py-2.5 px-2 text-center w-20 cursor-pointer hover:bg-slate-100 transition-colors group ${
                            sortField === 'priority' ? 'bg-slate-100 text-slate-900 font-bold' : ''
                          }`}
                          title="کلیک برای مرتب‌سازی بر اساس اولویت"
                        >
                          <div className="flex items-center justify-center gap-0.5">
                            <span>اولویت</span>
                            {renderSortIndicator('priority')}
                          </div>
                        </th>

                        {/* ستون نام بدهکار */}
                        <th
                          onClick={() => handleHeaderClick('fullName')}
                          className={`py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors group ${
                            sortField === 'fullName' ? 'bg-slate-100 text-slate-900 font-bold' : ''
                          }`}
                          title="کلیک برای مرتب‌سازی بر اساس نام"
                        >
                          <div className="flex items-center gap-0.5">
                            <span>نام بدهکار (طرف حساب)</span>
                            {renderSortIndicator('fullName')}
                          </div>
                        </th>

                        {/* ستون مبلغ */}
                        <th
                          onClick={() => handleHeaderClick('amount')}
                          className={`py-2.5 px-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group ${
                            sortField === 'amount' ? 'bg-slate-100 text-slate-900 font-bold' : ''
                          }`}
                          title="کلیک برای مرتب‌سازی بر اساس مبلغ"
                        >
                          <div className="flex items-center justify-end gap-0.5">
                            <span>مبلغ (تومان)</span>
                            {renderSortIndicator('amount')}
                          </div>
                        </th>

                        {/* ستون سررسید */}
                        <th
                          onClick={() => handleHeaderClick('dueDate')}
                          className={`py-2.5 px-2 text-center w-28 cursor-pointer hover:bg-slate-100 transition-colors group ${
                            sortField === 'dueDate' ? 'bg-slate-100 text-slate-900 font-bold' : ''
                          }`}
                          title="کلیک برای مرتب‌سازی بر اساس تاریخ وصول"
                        >
                          <div className="flex items-center justify-center gap-0.5">
                            <span>سررسید</span>
                            {renderSortIndicator('dueDate')}
                          </div>
                        </th>

                        <th className="py-2.5 px-2 text-center w-20">تسویه</th>
                        <th className="py-2.5 px-2 text-center w-14">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {creditList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                            هیچ طلب باز یا بدهکاری ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        creditList.map((item, idx) => {
                          const due = calculateDueStatus(item.dueDate);

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-emerald-50/20 transition-colors ${
                                item.isPinnedTop ? 'bg-amber-50/40' : ''
                              }`}
                            >
                              {/* اولویت */}
                              <td className="py-2.5 px-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSetTopPriority(item.id)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                      item.isPinnedTop
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                    title={item.isPinnedTop ? 'برداشتن اولویت ۱' : 'تعیین به عنوان اولویت اول'}
                                  >
                                    {item.isPinnedTop ? 'اولویت ۱' : `#${idx + 1}`}
                                  </button>
                                  <div className="flex flex-col">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveUp(item.id)}
                                      disabled={idx === 0}
                                      className="text-slate-300 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                      title="جابجایی به بالا"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveDown(item.id)}
                                      disabled={idx === creditList.length - 1}
                                      className="text-slate-300 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                      title="جابجایی به پایین"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* طرف حساب */}
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                  <span>{item.fullName}</span>
                                  {item.isOfficial ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200" title="فاکتور رسمی">
                                      <FileCheck2 className="w-2.5 h-2.5 text-blue-600" />
                                      <span>رسمی</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200" title="سند عادی / غیررسمی">
                                      <FileText className="w-2.5 h-2.5 text-slate-400" />
                                      <span>غیررسمی</span>
                                    </span>
                                  )}
                                  {item.isPinnedTop && (
                                    <span className="text-[9px] bg-slate-900 text-white font-bold px-1 py-0.2 rounded">
                                      اولویت اول
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  سند طلب شرکت واته
                                </div>
                              </td>

                              {/* مبلغ */}
                              <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-600 text-xs">
                                {formatToman(item.amount)}
                              </td>

                              {/* سررسید */}
                              <td className="py-2.5 px-2 text-center">
                                <div className="font-mono text-slate-700 text-[11px]">{item.jalaliDueDate || '—'}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{due.badgeText}</div>
                              </td>

                              {/* تسویه (وصول شد) */}
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleSettleItem(item.id)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100 shadow-2xs"
                                  title="ثبت وصولی و انتقال مستقیم به تاریخچه"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                  <span>وصول شد</span>
                                </button>
                              </td>

                              {/* عملیات */}
                              <td className="py-2.5 px-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingItem(item);
                                      setIsCreditModalOpen(true);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                                    title="ویرایش"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setItemToDelete(item)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    title="حذف و انتقال به سطل زباله"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* پایین صفحه ساده */}
        <div className="no-print flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>شرکت واته • مدیریت هوشمند مالی و تاریخچه</span>
        </div>
      </div>

      {/* پنجره اختصاصی ثبت و ویرایش بدهی */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        editingTransaction={editingItem}
      />

      {/* پنجره اختصاصی ثبت و ویرایش طلب */}
      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => {
          setIsCreditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        editingTransaction={editingItem}
      />


      {/* پنجره تأیید خروج از حساب */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={handleLogout}
      />

      {/* پنجره تأیید حذف یک مورد با توضیح ذخیره در تاریخچه */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 bg-rose-50 border-b border-rose-100">
              <span className="text-xs font-bold text-rose-700">تأیید حذف سند</span>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                آیا از حذف اطلاعات <strong className="text-slate-900">{itemToDelete.fullName}</strong> به مبلغ <strong className="text-rose-600">{formatToman(itemToDelete.amount)} تومان</strong> اطمینان دارید؟
              </p>
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                💡 این سند پس از حذف به همراه روز، تاریخ و ساعت دقیق در بخش <strong>«تاریخچه تراکنش‌ها»</strong> بایگانی شده و قابل بازیابی خواهد بود.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteItem}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  حذف و انتقال به تاریخچه
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
