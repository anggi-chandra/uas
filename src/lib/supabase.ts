import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

// Client reguler untuk operasi umum
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client dengan Service Role Key untuk bypass RLS jika diperlukan
// PERHATIAN: Gunakan ini hanya untuk operasi admin yang memerlukan bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);