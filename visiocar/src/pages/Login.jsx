import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Mail, ArrowRight, Loader2, Car, CheckCircle } from 'lucide-react';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassCard from '@/components/ui-custom/GlassCard';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { loginWithOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const result = await loginWithOtp(email);
      if (result.success) {
        setEmailSent(true);
        toast.success('Lien de connexion envoyé ! Vérifiez votre email.');
      } else {
        toast.error(result.error || 'Erreur de connexion');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#007AFF]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#BF5AF2]/10 rounded-full blur-[120px]" />
        </div>

        <GlassCard className="w-full max-w-md p-8 text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#34C759]/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[#34C759]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Email envoyé !</h2>
          <p className="text-white/60 mb-6">
            Un lien de connexion a été envoyé à <strong>{email}</strong>.<br />
            Cliquez sur le lien dans l'email pour accéder à votre compte.
          </p>
          <button 
            onClick={() => setEmailSent(false)}
            className="text-[#007AFF] hover:underline text-sm"
          >
            Utiliser une autre adresse email
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#007AFF]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#BF5AF2]/10 rounded-full blur-[120px]" />
      </div>

      <GlassCard className="w-full max-w-md p-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#0056CC] flex items-center justify-center mx-auto mb-4">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">VisioCar</h1>
          <p className="text-white/50 text-sm mt-1">Connexion sécurisée</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-white/60 mb-2">Adresse email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#007AFF]/50"
                required
              />
            </div>
          </div>

          <GlassButton 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                Recevoir le lien magique
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </GlassButton>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-white/40">
            En vous connectant, vous acceptez nos{' '}
            <a href="/terms" className="text-[#007AFF] hover:underline">CGV</a>
            {' '}et{' '}
            <a href="/privacy" className="text-[#007AFF] hover:underline">Politique de confidentialité</a>.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <p className="text-sm text-white/50 text-center">
            Pas encore de compte ?{' '}
            <button 
              onClick={handleSubmit}
              className="text-[#007AFF] hover:underline font-medium"
            >
              Inscrivez-vous
            </button>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
