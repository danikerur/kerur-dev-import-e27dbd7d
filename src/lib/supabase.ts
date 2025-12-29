import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    'Supabase configuration is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. The app may need a full page refresh.'
  );
}

// Create a dummy client if not configured to prevent crashes
const createSupabaseClient = (): SupabaseClient => {
  if (!isConfigured) {
    // Return a client with placeholder values - will fail on actual API calls
    return createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: localStorage,
    },
    db: {
      schema: 'public',
    },
  });
};

export const supabase = createSupabaseClient();

supabase.auth.onAuthStateChange((event) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-') || k.startsWith('supabase.auth'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    console.log('User signed out, cleared auth data');
  }
});
