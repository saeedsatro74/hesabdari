import { createClient } from '@supabase/supabase-js';

// مقادیر پیش‌فرض پایگاه داده برای اتصال امن کلاینت و سرور
const DEFAULT_URL = 'https://ikphskhacwewdjglqwny.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable__L5eIBhk1xW9i4nYuM19sA_EzLZ2CRe';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  DEFAULT_URL;

const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_KEY) ||
  DEFAULT_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// توابع کمکی برای ذخیره امن در سوپابیس با پشتیبانی خودکار از وجود یا عدم وجود ستون‌های اختیاری (is_official یا description)
export async function safeSupabaseUpsertTransactions(rows: any[]) {
  if (!rows || rows.length === 0) return { error: null };
  const { error } = await supabase.from('transactions').upsert(rows, { onConflict: 'id' });
  if (error && (error.code === 'PGRST204' || error.message?.includes('is_official') || error.message?.includes('description'))) {
    let fallbackRows = rows;
    if (error.message?.includes('description')) {
      fallbackRows = fallbackRows.map(({ description, ...rest }) => rest);
    }
    if (error.message?.includes('is_official')) {
      fallbackRows = fallbackRows.map(({ is_official, ...rest }) => rest);
    }
    // اگر هنوز خطایی بود و مشخص نبود چه ستونی است، هر دو را برمی‌داریم
    if (fallbackRows === rows) {
      fallbackRows = rows.map(({ description, is_official, ...rest }) => rest);
    }
    return await supabase.from('transactions').upsert(fallbackRows, { onConflict: 'id' });
  }
  return { error };
}

export async function safeSupabaseInsertTransaction(row: any) {
  const { error } = await supabase.from('transactions').insert(row);
  if (error && (error.code === 'PGRST204' || error.message?.includes('is_official') || error.message?.includes('description'))) {
    let fallbackRow = { ...row };
    if (error.message?.includes('description')) {
      delete fallbackRow.description;
    }
    if (error.message?.includes('is_official')) {
      delete fallbackRow.is_official;
    }
    if (fallbackRow.description !== undefined && fallbackRow.is_official !== undefined) {
      delete fallbackRow.description;
    }
    return await supabase.from('transactions').insert(fallbackRow);
  }
  return { error };
}
