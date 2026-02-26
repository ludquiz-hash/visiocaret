import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { garageApi, usageApi } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, 
  CheckCircle, 
  Zap,
  Building2,
  ArrowUpRight
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import { toast } from 'sonner';

const plans = {
  starter: { name: 'Starter', price: 69, limit: 15 },
  business: { name: 'Business', price: 199, limit: null },
};

export default function Billing() {
  const { user, profile } = useAuth();

  const { data: garage } = useQuery({
    queryKey: ['garage'],
    queryFn: () => garageApi.get(),
    enabled: !!user,
  });

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: () => usageApi.get(),
    enabled: !!user,
  });

  const currentPlan = plans[garage?.plan_type || 'starter'];
  const isTrialing = !garage?.is_subscribed;
  const trialEnds = garage?.trial_ends_at ? new Date(garage.trial_ends_at) : null;
  const daysRemaining = trialEnds ? Math.max(0, Math.ceil((trialEnds - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  const handleSubscribe = async (planId) => {
    toast.info('Redirection vers Stripe...');
    // TODO: Implement Stripe checkout
    toast.error('Paiement non configuré en mode démo');
  };

  const handleManageBilling = async () => {
    toast.info('Portail de facturation non disponible en mode démo');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Abonnement</h1>
        <p className="text-white/50 mt-1">Gérez votre plan et votre facturation</p>
      </div>

      {/* Current Plan */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-[#007AFF]/10">
              <currentPlan.icon className="w-8 h-8 text-[#007AFF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Plan {currentPlan.name}</h2>
                {garage?.is_subscribed ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759] text-xs font-medium">
                    Actif
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#FF9F0A]/10 text-[#FF9F0A] text-xs font-medium">
                    Essai gratuit
                  </span>
                )}
              </div>
              <p className="text-white/50 text-sm mt-1">
                {garage?.is_subscribed 
                  ? `${currentPlan.price}€/mois`
                  : `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {garage?.is_subscribed && (
              <button
                onClick={handleManageBilling}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
              >
                Gérer
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Usage */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-white mb-4">Utilisation ce mois</h3>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70">Dossiers créés</span>
            <span className="text-sm font-medium text-white">
              {usage?.claims_created || 0}
              {currentPlan.limit && ` / ${currentPlan.limit}`}
            </span>
          </div>
          {currentPlan.limit && (
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#007AFF] to-[#34C759]"
                style={{ width: `${Math.min(100, ((usage?.claims_created || 0) / currentPlan.limit) * 100)}%` }}
              />
            </div>
          )}
          {!currentPlan.limit && (
            <p className="text-xs text-[#34C759]">Illimité avec le plan Business</p>
          )}
        </div>
      </GlassCard>

      {/* Plans Comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(plans).map(([key, plan]) => {
          const isCurrent = garage?.plan_type === key;
          return (
            <div
              key={key}
              className={`
                p-6 rounded-xl border transition-colors
                ${isCurrent 
                  ? 'bg-[#007AFF]/5 border-[#007AFF]/30' 
                  : 'bg-white/[0.03] border-white/[0.06]'}
              `}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-[#007AFF]/10">
                  <plan.icon className="w-6 h-6 text-[#007AFF]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                  <p className="text-2xl font-bold text-white">{plan.price}€<span className="text-sm font-normal text-white/50">/mois</span></p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle className="w-4 h-4 text-[#34C759]" />
                  {plan.limit ? `${plan.limit} dossiers/mois` : 'Dossiers illimités'}
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle className="w-4 h-4 text-[#34C759]" />
                  Export PDF
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle className="w-4 h-4 text-[#34C759]" />
                  Support email
                </li>
                {key === 'business' && (
                  <li className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-[#34C759]" />
                    Support prioritaire
                  </li>
                )}
              </ul>

              {!isCurrent && (
                <button
                  onClick={() => handleSubscribe(key)}
                  className="w-full py-2 bg-white/5 text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
                >
                  Choisir ce plan
                </button>
              )}
              {isCurrent && (
                <div className="w-full py-2 bg-[#007AFF]/10 text-[#007AFF] rounded-lg font-medium text-center">
                  Plan actuel
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
