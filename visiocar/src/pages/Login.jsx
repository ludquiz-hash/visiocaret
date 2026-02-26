import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Mail, ArrowRight, Loader2, Car, CheckCircle } from 'lucide-react';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassCard from '@/components/ui-custom/GlassCard';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }

    console.log('🔐 Tentative login avec:', trimmedEmail);
    console.log('📍 URL actuelle:', window.location.origin);
    console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

    setIsLoading(true);
    try {
      console.log('📤 Appel signInWithOtp...');
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log('📥 Réponse Supabase:', { data, error });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ Email envoyé avec succès');
      setEmailSent(true);
      toast.success('Lien de connexion envoyé ! Vérifiez votre email.');
      
    } catch (error) {
      console.error('💥 Erreur complète:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email');
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
          <div className="text-sm text-white/40 mb-4">
            💡 Astuce : Vérifiez aussi votre dossier spam
          </div>
          <button 
            onClick={() => {
              setEmailSent(false);
              setEmail('');
            }}
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
                disabled={isLoading}
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

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-white/40">
            En vous connectant, vous acceptez nos{' '}
            <a href="/terms" className="text-[#007AFF] hover:underline">CGV</a>
            {' '}et{' '}
            <a href="/privacy" className="text-[#007AFF] hover:underline">Politique de confidentialité</a>.
          </p>
          <p className="text-xs text-white/30">
            URL: {window.location.origin}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
