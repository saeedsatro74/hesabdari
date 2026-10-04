import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import { systemAuth, transactions, history } from './src/db/schema.ts';
import { supabase } from './src/lib/supabase.ts';
import { eq } from 'drizzle-orm';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // --- API Routes ---

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

      // بررسی وضعیت RLS با تست یک عملیات آزمایشی
      let rlsStatus = 'active';
      const testInsert = await supabase
        .from('system_auth')
        .insert({ username: '__test__', password: '__test__' });

      if (testInsert.error && testInsert.error.code === '42501') {
        rlsStatus = 'rls_restricted'; // RLS مانع نوشتن است و نیاز به اعمال پالیسی یا disable rls دارد
      } else if (!testInsert.error) {
        rlsStatus = 'open';
        // حذف رکورد تستی
        await supabase.from('system_auth').delete().eq('username', '__test__');
      }

      res.json({
        connected: true,
        rlsStatus,
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
          return res.json({
            username: supaAuth[0].username,
            password: supaAuth[0].password,
          });
        }
      } catch (e) {
        console.warn('Could not read auth from Supabase, checking local DB:', e);
      }

      // در غیر این صورت خواندن از دیتابیس لوکال
      const records = await db.select().from(systemAuth).limit(1);
      if (records.length > 0) {
        res.json({
          username: records[0].username,
          password: records[0].password,
        });
      } else {
        await db.insert(systemAuth).values({ username: 'admin', password: 'milad@6868' });
        res.json({ username: 'admin', password: 'milad@6868' });
      }
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

      // ۱. ذخیره در سوپابیس
      try {
        await supabase.from('system_auth').upsert({
          id: 1,
          username,
          password,
          updated_at: new Date().toISOString(),
        });
      } catch (supaErr) {
        console.warn('Supabase auth update warning:', supaErr);
      }

      // ۲. ذخیره در دیتابیس لوکال
      const existing = await db.select().from(systemAuth).limit(1);
      if (existing.length > 0) {
        await db
          .update(systemAuth)
          .set({ username, password, updatedAt: new Date() })
          .where(eq(systemAuth.id, existing[0].id));
      } else {
        await db.insert(systemAuth).values({ username, password });
      }

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
          const mapped = supaRows.map((r: any) => ({
            id: r.id,
            type: r.type,
            fullName: r.full_name || r.fullName,
            amount: Number(r.amount) || 0,
            shabaNumber: r.shaba_number || r.shabaNumber || null,
            bankName: r.bank_name || r.bankName || null,
            jalaliDueDate: r.jalali_due_date || r.jalaliDueDate || '',
            priority: Number(r.priority) || 1,
            isPinnedTop: Boolean(r.is_pinned_top || r.isPinnedTop),
            status: r.status || 'pending',
          }));
          return res.json(mapped);
        }
      } catch (e) {
        console.warn('Supabase read transactions error, falling back:', e);
      }

      // بک‌آپ: خواندن از دیتابیس لوکال
      const rows = await db.select().from(transactions);
      const mapped = rows.map((r) => ({
        id: r.id,
        type: r.type,
        fullName: r.fullName,
        amount: r.amount,
        shabaNumber: r.shabaNumber,
        bankName: r.bankName,
        jalaliDueDate: r.jalaliDueDate,
        priority: r.priority,
        isPinnedTop: r.isPinnedTop,
        status: r.status,
      }));
      res.json(mapped);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // ذخیره و همگام‌سازی کامل اسناد بدهی و طلب در سوپابیس و لوکال
  app.post('/api/transactions/sync', async (req: Request, res: Response) => {
    try {
      const items = req.body.transactions;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      // ۱. همگام‌سازی با سوپابیس
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
            priority: Number(t.priority) || 1,
            is_pinned_top: Boolean(t.isPinnedTop),
            status: t.status || 'pending',
            updated_at: new Date().toISOString(),
          }));

          // ارسال امن به سوپابیس با upsert
          const { error: upsertErr } = await supabase
            .from('transactions')
            .upsert(supaRows, { onConflict: 'id' });

          if (upsertErr) {
            console.warn('Supabase transactions upsert warning:', upsertErr.message);
          }
        }
      } catch (supaErr) {
        console.warn('Supabase sync transactions error:', supaErr);
      }

      // ۲. ذخیره در پایگاه داده لوکال
      try {
        await db.delete(transactions);
        if (items.length > 0) {
          const insertRows = items.map((t) => ({
            id: t.id,
            type: t.type,
            fullName: t.fullName,
            amount: Number(t.amount) || 0,
            shabaNumber: t.shabaNumber || null,
            bankName: t.bankName || null,
            jalaliDueDate: t.jalaliDueDate || '',
            priority: Number(t.priorityRank) || (typeof t.priority === 'number' ? t.priority : 1),
            isPinnedTop: Boolean(t.isPinnedTop),
            status: t.status || 'pending',
            updatedAt: new Date(),
          }));
          await db.insert(transactions).values(insertRows);
        }
      } catch (dbErr) {
        console.warn('Local database sync warning for transactions:', dbErr);
      }

      res.json({ success: true, count: items.length });
    } catch (err) {
      console.error('Error syncing transactions:', err);
      res.status(500).json({ error: 'Failed to sync transactions' });
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
          return res.json(mapped);
        }
      } catch (e) {
        console.warn('Supabase history read error, fallback to local DB:', e);
      }

      const rows = await db.select().from(history);
      const mapped = rows.map((h) => ({
        id: h.id,
        action: h.action,
        actionTitle: h.actionTitle,
        timestamp: h.timestamp,
        dayOfWeek: h.dayOfWeek,
        jalaliDate: h.jalaliDate,
        time: h.time,
        readableFull: h.readableFull,
        transaction: h.transactionData,
      }));
      res.json(mapped);
    } catch (err) {
      console.error('Error fetching history:', err);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  // ذخیره و همگام‌سازی تاریخچه و بایگانی حذفیات در سوپابیس و لوکال
  app.post('/api/history/sync', async (req: Request, res: Response) => {
    try {
      const items = req.body.history;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      // ۱. همگام‌سازی با سوپابیس
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
            transaction_data: h.transaction,
          }));

          const { error: upsertErr } = await supabase
            .from('history')
            .upsert(supaRows, { onConflict: 'id' });

          if (upsertErr) {
            console.warn('Supabase history upsert warning:', upsertErr.message);
          }
        }
      } catch (supaErr) {
        console.warn('Supabase history sync error:', supaErr);
      }

      // ۲. ذخیره در پایگاه داده لوکال
      try {
        await db.delete(history);
        if (items.length > 0) {
          const insertRows = items.map((h) => ({
            id: h.id || `hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            action: h.action || 'paid',
            actionTitle: h.actionTitle || '',
            timestamp: h.timestamp || new Date().toISOString(),
            dayOfWeek: h.dayOfWeek || '',
            jalaliDate: h.jalaliDate || '',
            time: h.time || '',
            readableFull: h.readableFull || '',
            transactionData: h.transaction || h.transactionData || {},
          }));
          await db.insert(history).values(insertRows);
        }
      } catch (dbErr) {
        console.warn('Local database sync warning for history:', dbErr);
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
