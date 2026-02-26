// Adapter to use Supabase instead of Base44
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
const isConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));

// Create Supabase client if configured, otherwise dummy client
export const base44 = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : {
      // Dummy client
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Not configured') }),
        getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Not configured') }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Not configured') }),
        signUp: () => Promise.resolve({ data: null, error: new Error('Not configured') }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ data: null, error: new Error('Not configured') }),
        insert: () => ({ data: null, error: new Error('Not configured') }),
        update: () => ({ data: null, error: new Error('Not configured') }),
        delete: () => ({ data: null, error: new Error('Not configured') }),
      }),
    };

// Export supabase directly for use in other files
export const supabase = base44;
