import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ensureActiveGarage, resolveActiveGarageId } from '@/components/utils/garageUtils';
import { authenticateUser, isDevMode, getAuthErrorMessage } from '@/components/utils/authUtils';
import DevLoginScreen from '@/components/DevLoginScreen';
import Sidebar from '@/components/layout/Sidebar';
import PaywallModal from '@/components/layout/PaywallModal';
import TrialBanner from '@/components/layout/TrialBanner';
import DebugPanel from '@/components/ui-custom/DebugPanel';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

// Theme management
const THEME_KEY = 'visiwebcar-theme';
const getStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) || 'dark';
  } catch {
    return 'dark';
  }
};
const setStoredTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.warn('Failed to store theme:', e);
  }
};

const publicPages = ['Landing', 'Pricing', 'Privacy', 'Terms', 'Legal'];
const LOADING_TIMEOUT = 10000; // 10 seconds

export default function Layout({ children, currentPageName }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);
  const [garage, setGarage] = useState(null);
  const [activeGarageId, setActiveGarageId] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [showDevLogin, setShowDevLogin] = useState(false);
  const timeoutRef = useRef(null);
  const [theme, setTheme] = useState(getStoredTheme());

  // Apply theme to document
  useEffect(() => {
    document.documentElement.className = theme;
    setStoredTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const resetSession = () => {
    try {
      localStorage.removeItem('base44_access_token');
      localStorage.removeItem('token');
    } catch (e) {
      console.warn('[Layout] Failed to clear tokens:', e);
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('clear_access_token', 'true');
      window.location.href = url.toString();
    } catch {
      window.location.href = `${window.location.origin}?clear_access_token=true`;
    }
  };

  // Single effect: load everything in sequence with timeout
  useEffect(() => {
    const init = async () => {
      timeoutRef.current = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setAuthError(new Error('Le chargement prend trop de temps. Vérifiez votre connexion.'));
        }
      }, LOADING_TIMEOUT);

      try {
        // 1. Authenticate user (with dev mode fallback)
        const { user: currentUser, error: authErr } = await authenticateUser();
        
        if (authErr) {
          if (isDevMode()) {
            setShowDevLogin(true);
            setIsReady(true);
            setLoading(false);
            clearTimeout(timeoutRef.current);
            return;
          }

          const errorMsg = getAuthErrorMessage(authErr);
          setAuthError(authErr);

          setIsReady(true);
          setTimeout(() => {
            base44.auth.redirectToLogin(window.location.href);
          }, 2000);

          setLoading(false);
          clearTimeout(timeoutRef.current);
          return;
        }

        if (!currentUser) {
          if (isDevMode()) {
            setShowDevLogin(true);
          } else {
            setAuthError(new Error('Aucun utilisateur trouvé'));
          }
          setIsReady(true);
          setLoading(false);
          clearTimeout(timeoutRef.current);
          return;
        }

        setUser(currentUser);
        setAuthError(null);

        // 2. Ensure garage exists (creates if needed) and get garageId
        try {
          const garageId = await ensureActiveGarage(currentUser);
          setActiveGarageId(garageId);

          // 3. Fetch garage data
          const garages = await base44.entities.Garage.filter({ id: garageId });
          const garageData = garages[0] || null;
          setGarage(garageData);

          setIsReady(true);
        } catch (garageError) {
          toast.error('Erreur lors du chargement du garage');
          setIsReady(true);
        }
        } catch (error) {
        const errorMsg = getAuthErrorMessage(error);
        setAuthError(error);
        toast.error(errorMsg || 'Erreur lors du chargement');
        setIsReady(true);
        } finally {
        setLoading(false);
        clearTimeout(timeoutRef.current);
      }
    };

    init();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleDevAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setShowDevLogin(false);
    // Retry initialization
    window.location.reload();
  };

  // Handle paywall
  useEffect(() => {
    const isTrialExpired = garage && !garage.is_subscribed && 
      new Date(garage.trial_ends_at) < new Date();
    
    if (isTrialExpired && !publicPages.includes(currentPageName) && currentPageName !== 'Billing') {
      setShowPaywall(true);
    }
  }, [garage, currentPageName]);

  // Public pages
  if (publicPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen bg-[#0B0E14]">
        {children}
      </div>
    );
  }

  // Dev login screen
  if (showDevLogin) {
    return <DevLoginScreen onAuthSuccess={handleDevAuthSuccess} />;
  }

  // Loading with timeout protection
  if (loading || !isReady) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#007AFF] animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Chargement...</p>
          {authError && (
            <div className="mt-4 max-w-md mx-auto">
                  <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#FF3B30] shrink-0" />
                      <div className="text-sm text-white/70 text-left">
                        <p className="font-medium text-white mb-1">Erreur</p>
                        <p>{getAuthErrorMessage(authError)}</p>
                      </div>
                    </div>
                    <button
                      onClick={resetSession}
                      className="mt-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#FF3B30] text-white text-sm font-medium hover:bg-[#FF3B30]/90 transition-colors w-full"
                    >
                      Réinitialiser la session
                    </button>
                  </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // No user - show error
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-[#FF3B30] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Session non disponible</h2>
          <p className="text-white/50 mb-6">
            {authError ? getAuthErrorMessage(authError) : 'Veuillez vous connecter pour continuer.'}
          </p>
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="px-6 py-3 bg-[#007AFF] text-white rounded-xl hover:bg-[#007AFF]/90 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <style>{`
        :root.dark,
        :root {
          --color-background: #0B0E14;
          --color-surface: #151921;
          --color-border: rgba(255, 255, 255, 0.06);
          --color-text-primary: #ffffff;
          --color-text-secondary: rgba(255, 255, 255, 0.6);
          --color-text-tertiary: rgba(255, 255, 255, 0.4);
          --color-primary: #007AFF;
          --color-success: #34C759;
          --color-warning: #FF9F0A;
          --color-danger: #FF3B30;
        }

        :root.light {
          --color-background: #f8f9fa;
          --color-surface: #ffffff;
          --color-border: #e5e7eb;
          --color-text-primary: #0a0e1a;
          --color-text-secondary: #4b5563;
          --color-text-tertiary: #9ca3af;
          --color-primary: #007AFF;
          --color-success: #34C759;
          --color-warning: #FF9F0A;
          --color-danger: #FF3B30;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        
        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }

        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }

        /* Theme transitions */
        * {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }

        /* Light theme overrides */
        .light {
          color-scheme: light;
        }

        .light .bg-\\[\\#0B0E14\\] {
          background-color: #f8f9fa !important;
        }

        .light .bg-\\[\\#151921\\] {
          background-color: #ffffff !important;
        }

        .light .bg-\\[\\#151921\\]\\/80 {
          background-color: rgba(255, 255, 255, 0.95) !important;
        }

        .light .text-white {
          color: #0a0e1a !important;
        }

        .light .text-white\\/50,
        .light .text-white\\/60 {
          color: #4b5563 !important;
        }

        .light .text-white\\/40,
        .light .text-white\\/30 {
          color: #9ca3af !important;
        }

        .light .text-white\\/70 {
          color: #374151 !important;
        }

        .light .border-white\\/\\[0\\.06\\],
        .light .border-white\\/10 {
          border-color: #e5e7eb !important;
        }

        .light .border-white\\/\\[0\\.12\\],
        .light .border-white\\/20 {
          border-color: #d1d5db !important;
        }

        .light .bg-white\\/\\[0\\.02\\],
        .light .bg-white\\/\\[0\\.03\\],
        .light .bg-white\\/\\[0\\.04\\] {
          background-color: #f3f4f6 !important;
        }

        .light .bg-white\\/\\[0\\.06\\],
        .light .bg-white\\/\\[0\\.08\\] {
          background-color: #e5e7eb !important;
        }

        .light .hover\\:bg-white\\/\\[0\\.06\\]:hover,
        .light .hover\\:bg-white\\/\\[0\\.12\\]:hover {
          background-color: #e5e7eb !important;
        }

        .light .shadow-\\[0_8px_32px_rgba\\(0\\,0\\,0\\,0\\.4\\)\\] {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08) !important;
        }

        /* Sidebar light theme */
        .light aside,
        .light nav[class*="bottom"] {
          background-color: #ffffff !important;
        }

        .light .bg-\\[\\#0B0E14\\]\\/95 {
          background-color: rgba(255, 255, 255, 0.95) !important;
        }

        .light .bg-gradient-to-br.from-\\[\\#007AFF\\]\\/30 {
          background: linear-gradient(to bottom right, rgba(0, 122, 255, 0.15), rgba(191, 90, 242, 0.15)) !important;
        }

        .light .bg-\\[\\#151921\\] {
          background-color: #f3f4f6 !important;
        }

        /* Boutons bleu nuage en mode clair */
        .light .bg-\\[\\#007AFF\\] {
          background-color: #60a5fa !important;
        }

        .light .hover\\:bg-\\[\\#007AFF\\]\\/90:hover,
        .light .hover\\:bg-\\[\\#005BBB\\]:hover {
          background-color: #3b82f6 !important;
        }

        .light .text-\\[\\#007AFF\\] {
          color: #3b82f6 !important;
        }

        .light .border-\\[\\#007AFF\\] {
          border-color: #60a5fa !important;
        }

        .light .bg-\\[\\#007AFF\\]\\/10,
        .light .bg-\\[\\#007AFF\\]\\/15 {
          background-color: rgba(96, 165, 250, 0.15) !important;
        }

        .light .bg-\\[\\#007AFF\\]\\/5 {
          background-color: rgba(96, 165, 250, 0.08) !important;
        }

        /* Réduire effet néon sur cartes en mode clair */
        .light .shadow-lg,
        .light .shadow-\\[0_12px_40px_rgba\\(0\\,122\\,255\\,0\\.1\\)\\],
        .light .shadow-\\[0_4px_20px_rgba\\(0\\,122\\,255\\,0\\.4\\)\\] {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }

        .light .shadow-\\[0_6px_30px_rgba\\(0\\,122\\,255\\,0\\.5\\)\\] {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        }
        `}</style>

      <Sidebar 
        currentPage={currentPageName} 
        user={user} 
        garage={garage}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-64 pb-24 lg:pb-0"
      )}>
        <div className="p-4 md:p-6 lg:p-8">
          {!garage?.is_subscribed && (
            <TrialBanner 
              daysRemaining={Math.max(0, Math.ceil((new Date(garage?.trial_ends_at || Date.now()) - new Date()) / (1000 * 60 * 60 * 24)))}
              className="mb-6"
            />
          )}
          
          {children}
        </div>
      </main>

      <PaywallModal 
        isOpen={showPaywall}
        daysRemaining={Math.max(0, Math.ceil((new Date(garage?.trial_ends_at || Date.now()) - new Date()) / (1000 * 60 * 60 * 24)))}
        onClose={() => setShowPaywall(false)}
      />

      <DebugPanel />
    </div>
  );
}