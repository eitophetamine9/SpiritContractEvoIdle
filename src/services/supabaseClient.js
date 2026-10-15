import { createClient } from '@supabase/supabase-js';

const rawUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '';
const rawKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';

const isPlaceholder = (val) => {
  if (!val || typeof val !== 'string') return true;
  const trimmed = val.trim();
  return (
    trimmed === '' ||
    trimmed.includes('your-project-id') ||
    trimmed.includes('your-anon-key') ||
    trimmed === 'undefined' ||
    trimmed === 'null'
  );
};

export const isSupabaseConfigured = () => {
  return !isPlaceholder(rawUrl) && !isPlaceholder(rawKey);
};

export let supabase = null;

if (isSupabaseConfigured()) {
  try {
    supabase = createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err);
    supabase = null;
  }
} else {
  // Graceful offline mock / stub client to prevent runtime exceptions
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured in .env') }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured in .env') }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: new Error('Supabase not configured') }),
          order: () => ({ limit: async () => ({ data: [], error: null }) })
        }),
        order: () => ({ limit: async () => ({ data: [], error: null }) })
      }),
      upsert: async () => ({ data: null, error: new Error('Supabase not configured') }),
      insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
      update: async () => ({ data: null, error: new Error('Supabase not configured') })
    })
  };
}

export default supabase;
