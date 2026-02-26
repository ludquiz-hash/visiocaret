// API Client - Replaces Base44 SDK with direct Supabase calls
import { supabase } from '@/lib/supabaseClient';

// Helper to get current user
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Auth API
export const authApi = {
  async me() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      // Create profile
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

  async updateMe(updates) {
    const user = await getCurrentUser();
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

// Claims API
export const claimsApi = {
  async list(filters = {}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('claims')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(data) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Generate claim number
    if (!data.claim_number) {
      const date = new Date();
      const prefix = 'VIS';
      const random = Math.floor(1000 + Math.random() * 9000);
      data.claim_number = `${prefix}-${date.getFullYear()}-${random}`;
    }

    const { data: result, error } = await supabase
      .from('claims')
      .insert([{
        ...data,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async update(id, data) {
    const { data: result, error } = await supabase
      .from('claims')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async delete(id) {
    const { error } = await supabase
      .from('claims')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Garage API
export const garageApi = {
  async get() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('garages')
      .select('*')
      .eq('owner_id', user.id)
      .single();
    
    if (error || !data) {
      // Create default garage
      const { data: newGarage, error: createError } = await supabase
        .from('garages')
        .insert([{
          owner_id: user.id,
          name: 'Mon Garage',
          plan_type: 'starter',
          is_subscribed: false,
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      return newGarage;
    }
    
    return data;
  },

  async update(data) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data: result, error } = await supabase
      .from('garages')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('owner_id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
};

// Members API
export const membersApi = {
  async list() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data: garage } = await supabase
      .from('garages')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!garage) return [];

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('garage_id', garage.id);
    
    if (error) throw error;
    return data || [];
  },

  async create(data) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data: garage } = await supabase
      .from('garages')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!garage) throw new Error('No garage found');

    const { data: result, error } = await supabase
      .from('members')
      .insert([{
        ...data,
        garage_id: garage.id,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async update(id, data) {
    const { data: result, error } = await supabase
      .from('members')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async delete(id) {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Usage API
export const usageApi = {
  async get() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;

    return {
      claims_created: count || 0,
      claims_limit: 15
    };
  }
};

// Storage API
export const storageApi = {
  async upload(file, bucket = 'claim-photos') {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { path: data.path, url: publicUrl };
  },

  async delete(path, bucket = 'claim-photos') {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  }
};

// Functions API (backend calls)
export const functionsApi = {
  async invoke(functionName, payload = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': session ? `Bearer ${session.access_token}` : ''
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Function call failed');
    }

    return response.json();
  }
};

// Legacy compatibility - base44 adapter
export const base44 = {
  auth: {
    me: () => authApi.me(),
    updateMe: (data) => authApi.updateMe(data),
    redirectToLogin: () => window.location.href = '/login',
    logout: () => supabase.auth.signOut()
  },
  entities: {
    Claim: {
      filter: (filters) => claimsApi.list(filters),
      get: (id) => claimsApi.get(id),
      create: (data) => claimsApi.create(data),
      update: (id, data) => claimsApi.update(id, data),
      delete: (id) => claimsApi.delete(id)
    },
    Garage: {
      filter: () => garageApi.get().then(g => [g]),
      update: (id, data) => garageApi.update(data)
    },
    GarageMember: {
      filter: () => membersApi.list()
    },
    UsageCounter: {
      filter: () => usageApi.get().then(u => [u])
    }
  },
  functions: {
    invoke: (name, payload) => functionsApi.invoke(name, payload)
  },
  integrations: {
    Core: {
      UploadFile: ({ file }) => storageApi.upload(file)
    }
  }
};

export default {
  auth: authApi,
  claims: claimsApi,
  garage: garageApi,
  members: membersApi,
  usage: usageApi,
  storage: storageApi,
  functions: functionsApi,
  base44 // Legacy compatibility
};
