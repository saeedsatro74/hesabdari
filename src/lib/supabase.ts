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
