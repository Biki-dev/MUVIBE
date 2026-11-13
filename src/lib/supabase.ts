/**
 * src/lib/supabase.ts
 * ─────────────────────────────────────────────────────────────────
 * Supabase client singleton.
 * Uses AsyncStorage for session persistence so the user stays
 * logged in across app restarts.
 * ─────────────────────────────────────────────────────────────────
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project-ref') &&
  !SUPABASE_ANON_KEY.includes('your-anon-public-key')
);

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing or using placeholder values. ' +
      'Add your real Supabase keys to .env.'
  );
}

// Fallback to valid dummy URL format to prevent client constructor from crashing
const validUrl = SUPABASE_URL && SUPABASE_URL.startsWith('http')
  ? SUPABASE_URL
  : 'https://placeholder.supabase.co';
const validKey = SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(validUrl, validKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
