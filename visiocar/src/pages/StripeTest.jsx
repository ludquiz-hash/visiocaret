import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import { toast } from 'sonner';

export default function StripeTest() {
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: membership } = useQuery({
    queryKey: ['userMembership', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const memberships = await base44.entities.GarageMember.filter({ user_email: user.email });
      return memberships[0] || null;
    },
    enabled: !!user?.email,
  });

  const handleCreateSession = async (planId) => {
    if (!membership?.garage_id) {
      toast.error('Garage introuvable');
      return;
    }

    setLoading(true);
    setSessionData(null);

    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        planId,
        garageId: membership.garage_id,
      });

      if (response.data?.success) {
        setSessionData(response.data);
        toast.success('Session créée avec succès');
      } else {
        toast.error('Erreur lors de la création de la session');
      }
    } catch (error) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[#007AFF]/10">
          <CreditCard className="w-6 h-6 text-[#007AFF]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Test Stripe</h1>
          <p className="text-sm text-white/50">
            Testez les sessions de paiement Stripe
          </p>
        </div>
      </div>

      {/* Test Buttons */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Créer une session de paiement
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <GlassButton
            variant="primary"
            size="lg"
            onClick={() => handleCreateSession('starter')}
            loading={loading}
            disabled={loading}
          >
            Tester Plan Starter (69€)
          </GlassButton>

          <GlassButton
            variant="primary"
            size="lg"
            onClick={() => handleCreateSession('business')}
            loading={loading}
            disabled={loading}
          >
            Tester Plan Business (199€)
          </GlassButton>
        </div>

        {/* Session Data */}
        {sessionData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#34C759]">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Session créée avec succès</span>
            </div>

            <div className="bg-white/[0.04] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Session ID:</span>
                <code className="text-[#007AFF] font-mono text-xs">
                  {sessionData.sessionId}
                </code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">URL:</span>
                <a
                  href={sessionData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#007AFF] hover:underline flex items-center gap-1 text-xs"
                >
                  Ouvrir la page de paiement
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <GlassButton
              variant="primary"
              onClick={() => window.open(sessionData.url, '_blank')}
              icon={ExternalLink}
            >
              Ouvrir dans un nouvel onglet
            </GlassButton>
          </div>
        )}
      </GlassCard>

      {/* Test Cards Info */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Cartes de test Stripe
        </h2>

        <div className="space-y-3 text-sm">
          <div className="bg-white/[0.04] rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/70">Paiement réussi</span>
              <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
            </div>
            <code className="text-[#007AFF] font-mono">4242 4242 4242 4242</code>
          </div>

          <div className="bg-white/[0.04] rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/70">3D Secure requis</span>
              <Loader2 className="w-4 h-4 text-[#FF9F0A]" />
            </div>
            <code className="text-[#007AFF] font-mono">4000 0027 6000 3184</code>
          </div>

          <div className="bg-white/[0.04] rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/70">Paiement refusé</span>
              <XCircle className="w-4 h-4 text-[#FF3B30]" />
            </div>
            <code className="text-[#007AFF] font-mono">4000 0000 0000 0002</code>
          </div>

          <div className="text-xs text-white/40 mt-4">
            • Date d'expiration: n'importe quelle date future<br />
            • CVC: n'importe quel 3 chiffres<br />
            • Code postal: n'importe lequel
          </div>
        </div>
      </GlassCard>

      {/* Webhook Events (TODO) */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Événements webhook reçus
        </h2>
        <p className="text-sm text-white/50">
          Les webhooks apparaîtront ici après configuration
        </p>
      </GlassCard>
    </div>
  );
}