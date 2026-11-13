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

/**
 * Expo prerenders web routes in Node when app.json sets
 * web.output to "static". There is no `window` there, and AsyncStorage's
 * web build reaches for it as soon as supabase-js tries to recover a
 * session, which crashed the dev server with
 * "ReferenceError: window is not defined".
 *
 * Detect that pass and hand supabase-js a storage object that does
 * nothing, so it starts with no session server side and picks the real
 * one up once it hydrates in the browser.
 */
const IS_SERVER = typeof window === 'undefined';

const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

const sessionStorage = IS_SERVER ? noopStorage : AsyncStorage;

export const supabase = createClient(validUrl, validKey, {
  auth: {
    storage: sessionStorage as any,
    // Nothing to persist or refresh without a browser or device, and
    // attempting it is what broke the Node render pass.
    autoRefreshToken: !IS_SERVER,
    persistSession: !IS_SERVER,
    detectSessionInUrl: false,
  },
});
