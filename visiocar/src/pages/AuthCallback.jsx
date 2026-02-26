import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔐 AuthCallback mounted');
    console.log('📍 URL:', window.location.href);
    
    const handleAuth = async () => {
      try {
        // Supabase avec detectSessionInUrl: true gère automatiquement le token
        console.log('⏳ Attente session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('📥 Session:', session);
        console.log('❌ Error:', error);

        if (error) {
          throw error;
        }

        if (session) {
          console.log('✅ Session établie !');
          setStatus('success');
          setTimeout(() => {
            navigate('/Dashboard');
          }, 1500);
        } else {
          console.log('⚠️ Pas de session, vérification hash...');
          // Vérifier s'il y a un hash dans l'URL (ancien format)
          const hash = window.location.hash;
          if (hash && hash.includes('access_token')) {
            console.log('📝 Hash trouvé, attente traitement...');
            // Attendre que Supabase traite le hash
            setTimeout(async () => {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (retrySession) {
                setStatus('success');
                setTimeout(() => navigate('/Dashboard'), 1500);
              } else {
                setStatus('error');
                setError('Session non établie');
              }
            }, 2000);
          } else {
            setStatus('error');
            setError('Lien invalide ou expiré');
          }
        }
      } catch (err) {
        console.error('💥 Erreur auth:', err);
        setStatus('error');
        setError(err.message || 'Erreur de connexion');
      }
    };

    handleAuth();
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
        <GlassCard className="w-full max-w-md p-8 text-center">
          <Loader2 className="w-12 h-12 text-[#007AFF] animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connexion en cours...</h2>
          <p className="text-white/50">Veuillez patienter</p>
        </GlassCard>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
        <GlassCard className="w-full max-w-md p-8 text-center">
          <CheckCircle className="w-12 h-12 text-[#34C759] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connecté !</h2>
          <p className="text-white/50">Redirection vers le tableau de bord...</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8 text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Erreur de connexion</h2>
        <p className="text-white/50 mb-4">{error}</p>
        <button
          onClick={() => navigate('/Login')}
          className="text-[#007AFF] hover:underline"
        >
          Retour à la page de connexion
        </button>
      </GlassCard>
    </div>
  );
}
