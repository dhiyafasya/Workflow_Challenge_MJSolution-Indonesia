import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured in .env');
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:3000',
  supabaseAnonKey || 'placeholder'
);
