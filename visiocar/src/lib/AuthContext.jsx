import React, { createContext, useState, useContext, useEffect } from 'react';
import { authClient, supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkAuthState();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadUserData();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const session = await authClient.getSession();
      
      if (session) {
        await loadUserData();
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthError({
        type: 'auth_error',
        message: error.message || 'Authentication check failed'
      });
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadUserData = async () => {
    try {
      const user = await authClient.getUser();
      const profile = await authClient.getProfile();
      
      setUser(user);
      setProfile(profile);
      setIsAuthenticated(!!user);
      setAuthError(null);
    } catch (error) {
      console.error('Load user data failed:', error);
      setAuthError({
        type: 'auth_error',
        message: error.message
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    try {
      setAuthError(null);
      const { user } = await authClient.signInWithPassword(email, password);
      await loadUserData();
      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError({
        type: 'login_error',
        message: error.message || 'Login failed'
      });
      return { success: false, error: error.message };
    }
  };

  const loginWithOtp = async (email) => {
    try {
      setAuthError(null);
      await authClient.signInWithOtp(email);
      return { success: true };
    } catch (error) {
      console.error('OTP login failed:', error);
      setAuthError({
        type: 'login_error',
        message: error.message || 'Failed to send login link'
      });
      return { success: false, error: error.message };
    }
  };

  const loginWithOAuth = async (provider) => {
    try {
      setAuthError(null);
      const { url } = await authClient.signInWithOAuth(provider);
      return { success: true, url };
    } catch (error) {
      console.error('OAuth login failed:', error);
      setAuthError({
        type: 'login_error',
        message: error.message || 'OAuth login failed'
      });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setAuthError(null);
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updated = await authClient.updateProfile(updates);
      setProfile(updated);
      return { success: true, data: updated };
    } catch (error) {
      console.error('Update profile failed:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    profile,
    isAuthenticated,
    isLoadingAuth,
    authError,
    login,
    loginWithOtp,
    loginWithOAuth,
    logout,
    updateProfile,
    checkAuthState,
    refreshUser: loadUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
