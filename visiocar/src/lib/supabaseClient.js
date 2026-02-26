// Supabase Client - Source of truth for auth
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logs - TEMPORAIRE pour diagnostic
console.log('🔍 [SupabaseClient] Initialisation...');
console.log('🔍 [SupabaseClient] URL:', supabaseUrl || 'NON DÉFINIE');
console.log('🔍 [SupabaseClient] Key existe:', !!supabaseAnonKey);
console.log('🔍 [SupabaseClient] Key début:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'N/A');
console.log('🔍 [SupabaseClient] Key length:', supabaseAnonKey?.length || 0);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ [SupabaseClient] Variables manquantes!');
  console.error('❌ VITE_SUPABASE_URL:', supabaseUrl ? 'OK' : 'MANQUANT');
  console.error('❌ VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'OK' : 'MANQUANT');
}

// Vérification format clé
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.error('⚠️ [SupabaseClient] La clé ne commence pas par eyJ - ce n\'est probablement pas une clé JWT valide');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

console.log('✅ [SupabaseClient] Client créé');

// Auth helper functions
export const authClient = {
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async isAuthenticated() {
    const session = await this.getSession();
    return !!session;
  },

  async signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signInWithOtp(email) {
    console.log('📤 [AuthClient] signInWithOtp appelé avec:', email);
    console.log('📤 [AuthClient] URL:', supabaseUrl);
    console.log('📤 [AuthClient] Key présente:', !!supabaseAnonKey);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    console.log('📥 [AuthClient] Réponse:', { data, error: error?.message });
    
    if (error) throw error;
    return data;
  },

  async signInWithOAuth(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  // Get current user profile from profiles table
  async getProfile() {
    const user = await this.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    // Create profile if doesn't exist
    if (!data) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      return newProfile;
    }

    return data;
  },

  // Update profile
  async updateProfile(updates) {
    const user = await this.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export default supabase;
