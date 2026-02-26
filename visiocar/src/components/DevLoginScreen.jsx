import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassInput from '@/components/ui-custom/GlassInput';
import GlassButton from '@/components/ui-custom/GlassButton';
import { AlertCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function DevLoginScreen({ onAuthSuccess }) {
  const [email, setEmail] = useState('dev@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Attempt dev login
      await base44.auth.login(email, password);
      const user = await base44.auth.me();
      
      if (user && onAuthSuccess) {
        onAuthSuccess(user);
      }
    } catch (err) {
      console.error('[DevLoginScreen] Login error:', err);
      setError(err?.message || 'Login failed. Check credentials.');
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 rounded-xl bg-[#007AFF]/10">
            <LogIn className="w-6 h-6 text-[#007AFF]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">Dev Login</h1>
        <p className="text-white/50 text-center text-sm mb-6">Mode développement</p>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#FF3B30] shrink-0 mt-0.5" />
              <div className="text-sm text-white/70">
                <p className="font-medium text-white mb-1">Erreur</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <GlassInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="dev@example.com"
            disabled={loading}
          />

          <GlassInput
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            disabled={loading}
          />

          <GlassButton
            type="submit"
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            Se connecter
          </GlassButton>
        </form>

        <p className="text-xs text-white/40 text-center mt-6">
          Écran de connexion dev uniquement
        </p>
      </GlassCard>
    </div>
  );
}