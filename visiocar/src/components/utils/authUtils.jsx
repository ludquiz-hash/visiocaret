import { base44 } from '@/api/base44Client';

/**
 * Check if running in dev mode
 */
export function isDevMode() {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.VITE_DEV_MODE === 'true' ||
    window.location.hostname === 'localhost'
  );
}

/**
 * Authenticate user - returns { user, error }
 */
export async function authenticateUser() {
  try {
    const isAuthenticated = await base44.auth.isAuthenticated();
    
    if (!isAuthenticated) {
      return {
        user: null,
        error: new Error('User not authenticated')
      };
    }

    const user = await base44.auth.me();
    return { user, error: null };
  } catch (error) {
    return {
      user: null,
      error: error || new Error('Authentication failed')
    };
  }
}

/**
 * Get user-friendly error message
 */
export function getAuthErrorMessage(error) {
  if (!error) return 'Une erreur est survenue';

  const message = error?.message || String(error);

  // Map common auth errors
  if (message.includes('not authenticated') || message.includes('session')) {
    return 'Votre session a expiré. Veuillez vous reconnecter.';
  }

  if (message.includes('network') || message.includes('offline')) {
    return 'Problème de connexion. Vérifiez votre internet.';
  }

  if (message.includes('timeout')) {
    return 'Le chargement prend trop de temps.';
  }

  if (message.includes('unauthorized')) {
    return 'Accès refusé.';
  }

  if (message.includes('forbidden')) {
    return 'Vous n\'avez pas les permissions nécessaires.';
  }

  return message || 'Une erreur est survenue lors de l\'authentification';
}