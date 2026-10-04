import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ikphskhacwewdjglqwny.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable__L5eIBhk1xW9i4nYuM19sA_EzLZ2CRe';

export const supabase = createClient(supabaseUrl, supabaseKey);
