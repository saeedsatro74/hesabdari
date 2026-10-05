import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import existsSync from 'fs';
import dotenv from 'dotenv';
import { supabase } from './src/lib/supabase.ts';
import { INITIAL_TRANSACTIONS, INITIAL_HISTORY } from './src/data/sampleData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');
const TRANSACTIONS_FILE = path.resolve(DATA_DIR, 'transactions.json');
const HISTORY_FILE = path.resolve(DATA_DIR, 'history.json');
const AUTH_FILE = path.resolve(DATA_DIR, 'auth.json');

// مقداردهی اولیه فایل‌های محلی پایگاه داده سرور
async function initStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    if (!existsSync.existsSync(TRANSACTIONS_FILE)) {
      await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(INITIAL_TRANSACTIONS, null, 2), 'utf-8');
    }
    if (!existsSync.existsSync(HISTORY_FILE)) {
      await fs.writeFile(HISTORY_FILE, JSON.stringify(INITIAL_HISTORY, null, 2), 'utf-8');
    }
    if (!existsSync.existsSync(AUTH_FILE)) {
      await fs.writeFile(AUTH_FILE, JSON.stringify({ username: 'admin', password: '123' }, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Storage initialization error:', err);
  }
}

async function readTransactionsFile(): Promise<any[]> {
  try {
    const data = await fs.readFile(TRANSACTIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

async function writeTransactionsFile(items: any[]): Promise<void> {
  await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

async function readHistoryFile(): Promise<any[]> {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return INITIAL_HISTORY;
  }
}

async function writeHistoryFile(items: any[]): Promise<void> {
  await fs.writeFile(HISTORY_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

async function readAuthFile(): Promise<{ username: string; password: string }> {
  try {
    const data = await fs.readFile(AUTH_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { username: 'admin', password: '123' };
  }
}

async function writeAuthFile(auth: { username: string; password: string }): Promise<void> {
  await fs.writeFile(AUTH_FILE, JSON.stringify(auth, null, 2), 'utf-8');
}

async function startServer() {
  await initStorage();

  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // --- API Routes ---

  // وضعیت سلامت پایگاه داده
  app.get('/api/status', async (req: Request, res: Response) => {
    try {
      const txs = await readTransactionsFile();
      const hist = await readHistoryFile();
      res.json({
        connected: true,
        storage: 'persistent-json-and-supabase',
        transactionsCount: txs.length,
        historyCount: hist.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      res.json({
        connected: true,
        storage: 'fallback-memory',
        error: String(err),
      });
    }
  });

  // وضعیت اتصال به سوپابیس
  app.get('/api/supabase/status', async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase.from('transactions').select('id').limit(1);
      if (error) {
        return res.json({
          connected: false,
          error: error.message,
          code: error.code,
          url: 'https://ikphskhacwewdjglqwny.supabase.co',
        });
      }

      res.json({
        connected: true,
        rlsStatus: 'open',
        url: 'https://ikphskhacwewdjglqwny.supabase.co',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.json({
        connected: false,
        error: message,
        url: 'https://ikphskhacwewdjglqwny.supabase.co',
      });
    }
  });

  // 1. احراز هویت و دریافت کلمه عبور
  app.get('/api/auth', async (req: Request, res: Response) => {
    try {
      // ابتدا تلاش برای خواندن از سوپابیس
      try {
        const { data: supaAuth, error: supaErr } = await supabase
          .from('system_auth')
          .select('*')
          .limit(1);

        if (!supaErr && supaAuth && supaAuth.length > 0) {
          const authData = {
            username: String(supaAuth[0].username || 'admin'),
            password: String(supaAuth[0].password || '123'),
          };
          await writeAuthFile(authData).catch(() => {});
          return res.json(authData);
        }
      } catch (e) {
        console.warn('Supabase auth read warning, fallback to file:', e);
      }

      const fileAuth = await readAuthFile();
      return res.json(fileAuth);
    } catch (err) {
      console.error('Error fetching auth credentials:', err);
      res.status(500).json({ error: 'Failed to fetch auth credentials' });
    }
  });

  // تغییر کلمه عبور و اطلاعات لاگین
  app.post('/api/auth/update', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // ۱. ذخیره در فایل سرور
      await writeAuthFile({ username: String(username), password: String(password) });

      // ۲. ذخیره در سوپابیس در پس‌زمینه
      supabase.from('system_auth').upsert({
        id: 1,
        username,
        password,
        updated_at: new Date().toISOString(),
      }).then(() => {}, (err) => console.warn('Supabase auth upsert warning:', err));

      res.json({ success: true, message: 'اطلاعات ورود با موفقیت ذخیره شد' });
    } catch (err) {
      console.error('Error updating auth credentials:', err);
      res.status(500).json({ error: 'Failed to update auth credentials' });
    }
  });

  // 2. دریافت تمام اسناد فعال (بدهی‌ها و طلب‌ها)
  app.get('/api/transactions', async (req: Request, res: Response) => {
    try {
      // تلاش اول: خواندن از سوپابیس
      try {
        const { data: supaRows, error: supaErr } = await supabase
          .from('transactions')
          .select('*');

        if (!supaErr && supaRows && supaRows.length > 0) {
          const mapped = supaRows.map((r: any) => {
            const rawStatus = r.status || 'pending';
            const isOfficial = rawStatus.includes('#official') || rawStatus.includes(':official') || Boolean(r.is_official ?? r.isOfficial);
            const cleanStatus = rawStatus.split('#')[0].split(':')[0] || 'pending';

            return {
              id: r.id,
              type: r.type,
              fullName: r.full_name || r.fullName,
              isOfficial,
              amount: Number(r.amount) || 0,
              shabaNumber: r.shaba_number || r.shabaNumber || null,
              bankName: r.bank_name || r.bankName || null,
              jalaliDueDate: r.jalali_due_date || r.jalaliDueDate || '',
              priority: Number(r.priority) || 1,
              isPinnedTop: Boolean(r.is_pinned_top || r.isPinnedTop),
              status: cleanStatus,
            };
          });
          await writeTransactionsFile(mapped).catch(() => {});
          return res.json(mapped);
        }
      } catch (e) {
        console.warn('Supabase read transactions error, falling back to file:', e);
      }

      // بک‌آپ مطمئن: خواندن از فایل دائمی سرور
      const fileData = await readTransactionsFile();
      res.json(fileData);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // ذخیره و همگام‌سازی کامل اسناد بدهی و طلب
  app.post('/api/transactions/sync', async (req: Request, res: Response) => {
    try {
      const items = req.body.transactions;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      // ۱. ذخیره فوری در دیتابیس فایل سرور (۱۰۰٪ بدون قطعی)
      await writeTransactionsFile(items);

      // ۲. همگام‌سازی با سوپابیس در پس‌زمینه
      try {
        if (items.length > 0) {
          const supaRows = items.map((t) => ({
            id: t.id,
            type: t.type,
            full_name: t.fullName,
            amount: Number(t.amount) || 0,
            shaba_number: t.shabaNumber || null,
            bank_name: t.bankName || null,
            jalali_due_date: t.jalaliDueDate || '',
            priority: Number(t.priorityRank) || (typeof t.priority === 'number' ? t.priority : 1),
            is_pinned_top: Boolean(t.isPinnedTop),
            status: `${t.status || 'pending'}#${t.isOfficial ? 'official' : 'unofficial'}`,
            updated_at: new Date().toISOString(),
          }));

          supabase
            .from('transactions')
            .upsert(supaRows, { onConflict: 'id' })
            .then(
              () => {},
              (err) => console.warn('Supabase transactions upsert warning:', err)
            );
        } else {
          supabase.from('transactions').delete().neq('id', '__none__').then(() => {}, () => {});
        }
      } catch (supaErr) {
        console.warn('Supabase sync transactions error:', supaErr);
      }

      res.json({ success: true, count: items.length });
    } catch (err) {
      console.error('Error syncing transactions:', err);
      res.status(500).json({ error: 'Failed to sync transactions' });
    }
  });

  // حذف قطعی تراکنش از دیتابیس
  app.delete('/api/transactions/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // ۱. حذف از فایل دائمی
      const current = await readTransactionsFile();
      const updated = current.filter((t: any) => t.id !== id);
      await writeTransactionsFile(updated);

      // ۲. حذف از سوپابیس
      supabase.from('transactions').delete().eq('id', id).then(() => {}, () => {});

      res.json({ success: true, id });
    } catch (err) {
      console.error('Error deleting transaction:', err);
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  });

  // 3. دریافت تاریخچه کامل (واریز، وصول، و بایگانی حذف‌شده‌ها)
  app.get('/api/history', async (req: Request, res: Response) => {
    try {
      // تلاش برای خواندن از سوپابیس
      try {
        const { data: supaHist, error: supaErr } = await supabase
          .from('history')
          .select('*');

        if (!supaErr && supaHist && supaHist.length > 0) {
          const mapped = supaHist.map((h: any) => ({
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
          await writeHistoryFile(mapped).catch(() => {});
          return res.json(mapped);
        }
      } catch (e) {
        console.warn('Supabase history read error, fallback to file:', e);
      }

      const fileHist = await readHistoryFile();
      res.json(fileHist);
    } catch (err) {
      console.error('Error fetching history:', err);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  // ذخیره و همگام‌سازی تاریخچه و بایگانی حذفیات
  app.post('/api/history/sync', async (req: Request, res: Response) => {
    try {
      const items = req.body.history;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      // ۱. ذخیره فوری در دیتابیس فایل سرور
      await writeHistoryFile(items);

      // ۲. همگام‌سازی با سوپابیس
      try {
        if (items.length > 0) {
          const supaRows = items.map((h) => ({
            id: h.id,
            action: h.action,
            action_title: h.actionTitle,
            timestamp: h.timestamp,
            day_of_week: h.dayOfWeek,
            jalali_date: h.jalaliDate,
            time: h.time,
            readable_full: h.readableFull,
            transaction_data: h.transaction || h.transactionData || {},
          }));

          supabase
            .from('history')
            .upsert(supaRows, { onConflict: 'id' })
            .then(() => {}, (err) => console.warn('Supabase history upsert warning:', err));
        }
      } catch (supaErr) {
        console.warn('Supabase history sync error:', supaErr);
      }

      res.json({ success: true, count: items.length });
    } catch (err) {
      console.error('Error syncing history:', err);
      res.status(500).json({ error: 'Failed to sync history' });
    }
  });

  // --- Vite Dev & Production Static Serving ---
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
