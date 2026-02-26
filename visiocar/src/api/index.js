import { createClient } from '@supabase/supabase-js';

// Supabase client for auth only
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Get current Supabase session
 */
async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Generic API request helper
 */
async function apiRequest(endpoint, options = {}) {
  const session = await getSession();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle PDF responses
    if (response.headers.get('content-type') === 'application/pdf') {
      return { blob: await response.blob(), headers: response.headers };
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.error || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`[API] Error calling ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Auth API
 */
export const authApi = {
  async getMe() {
    return apiRequest('/auth/me');
  },

  async updateProfile(updates) {
    return apiRequest('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async signInWithOtp(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async verifyOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  async signOut() {
    return supabase.auth.signOut();
  },
};

/**
 * Claims API
 */
export const claimsApi = {
  async getClaims(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/claims${query ? `?${query}` : ''}`);
  },

  async getClaim(id) {
    return apiRequest(`/claims/${id}`);
  },

  async createClaim(data) {
    return apiRequest('/claims', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateClaim(id, data) {
    return apiRequest(`/claims/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteClaim(id) {
    return apiRequest(`/claims/${id}`, {
      method: 'DELETE',
    });
  },

  async generatePDF(id) {
    const response = await fetch(`${API_URL}/pdf/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(await getSession())?.access_token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'PDF generation failed' }));
      throw new Error(error.error);
    }
    
    const blob = await response.blob();
    return { blob };
  },

  async getClaimHistory(id) {
    return apiRequest(`/claims/${id}/history`);
  },
};

/**
 * Garage API
 */
export const garageApi = {
  async getGarage() {
    return apiRequest('/garage');
  },

  async updateGarage(data) {
    return apiRequest('/garage', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getMembers() {
    return apiRequest('/garage/members');
  },

  async inviteMember(email, role) {
    return apiRequest('/garage/members', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  },

  async updateMember(memberId, data) {
    return apiRequest(`/garage/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async removeMember(memberId) {
    return apiRequest(`/garage/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  async getUsage() {
    return apiRequest('/garage/usage');
  },
};

/**
 * Stripe API
 */
export const stripeApi = {
  async createCheckoutSession(planId, garageId) {
    return apiRequest('/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId, garageId }),
    });
  },

  async createPortalSession() {
    return apiRequest('/stripe/portal', {
      method: 'POST',
    });
  },
};

/**
 * Storage API (direct Supabase)
 */
export const storageApi = {
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async deleteFile(bucket, path) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  },
};
