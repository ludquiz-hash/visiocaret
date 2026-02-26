import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CreditCard, 
  ArrowUpRight, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  FileText,
  Zap,
  Building2,
  ExternalLink
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function Billing() {
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

  const { data: garage } = useQuery({
    queryKey: ['garage', membership?.garage_id],
    queryFn: async () => {
      if (!membership?.garage_id) return null;
      const garages = await base44.entities.Garage.filter({ id: membership.garage_id });
      return garages[0] || null;
    },
    enabled: !!membership?.garage_id,
  });

  const now = new Date();
  const { data: usageCounter } = useQuery({
    queryKey: ['usageCounter', membership?.garage_id, now.getFullYear(), now.getMonth() + 1],
    queryFn: async () => {
      if (!membership?.garage_id) return { claims_created: 0 };
      const counters = await base44.entities.UsageCounter.filter({
        garage_id: membership.garage_id,
        year: now.getFullYear(),
        month: now.getMonth() + 1
      });
      return counters[0] || { claims_created: 0 };
    },
    enabled: !!membership?.garage_id,
    initialData: { claims_created: 0 },
  });

  const handleManageBilling = async () => {
    try {
      toast.info('Chargement du portail de facturation...');
      const response = await base44.functions.invoke('createPortalSession', {
        garageId: membership?.garage_id
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Impossible d\'accéder au portail');
      }
    } catch (err) {
      toast.error('Erreur lors de l\'accès au portail de facturation');
    }
  };

  const planDetails = {
    starter: { name: 'Starter', price: 69, limit: 15, icon: Zap, color: 'blue' },
    business: { name: 'Business', price: 199, limit: null, icon: Building2, color: 'purple' }
  };

  const currentPlan = planDetails[garage?.plan_type || 'starter'];
  const isTrialing = !garage?.is_subscribed && garage?.trial_ends_at;
  const trialEnds = garage?.trial_ends_at ? new Date(garage.trial_ends_at) : null;
  const daysRemaining = trialEnds ? Math.max(0, Math.ceil((trialEnds - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Abonnement</h1>
        <p className="text-white/50 mt-1">Gérez votre plan et votre facturation</p>
      </div>

      {/* Current Plan */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-4 rounded-2xl",
              currentPlan.color === 'blue' ? "bg-[#007AFF]/10" : "bg-[#BF5AF2]/10"
            )}>
              <currentPlan.icon className={cn(
                "w-8 h-8",
                currentPlan.color === 'blue' ? "text-[#007AFF]" : "text-[#BF5AF2]"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Plan {currentPlan.name}</h2>
                {garage?.is_subscribed ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759] text-xs font-medium">
                    Actif
                  </span>
                ) : isTrialing ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#FF9F0A]/10 text-[#FF9F0A] text-xs font-medium">
                    Essai gratuit
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-medium">
                    Expiré
                  </span>
                )}
              </div>
              <p className="text-white/50 text-sm mt-1">
                {garage?.is_subscribed 
                  ? `${currentPlan.price}€/mois HT`
                  : isTrialing 
                    ? `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`
                    : 'Aucun abonnement actif'
                }
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex gap-2">
              {garage?.is_subscribed && (
                <GlassButton variant="secondary" onClick={handleManageBilling}>
                  Gérer l'abonnement
                  <ExternalLink className="w-4 h-4" />
                </GlassButton>
              )}
              <Link to={createPageUrl('Pricing')}>
                <GlassButton>
                  {garage?.is_subscribed ? 'Changer de plan' : 'Voir les plans'}
                  <ArrowUpRight className="w-4 h-4" />
                </GlassButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        {garage?.is_subscribed && garage?.current_period_end && (
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-white/[0.03]">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                  <Calendar className="w-3 h-3" />
                  Prochain renouvellement
                </div>
                <p className="text-sm font-medium text-white">
                  {format(new Date(garage.current_period_end), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03]">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                  <CreditCard className="w-3 h-3" />
                  Statut
                </div>
                <p className="text-sm font-medium text-white capitalize">
                  {garage.subscription_status || 'Actif'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03]">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                  <FileText className="w-3 h-3" />
                  Client Stripe
                </div>
                <p className="text-sm font-mono text-white/60 truncate">
                  {garage.stripe_customer_id || '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Usage */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-white mb-4">Utilisation ce mois</h3>
        
        <div className="space-y-4">
          {/* Claims Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/70">Dossiers créés</span>
              <span className="text-sm font-medium text-white">
                {usageCounter?.claims_created || 0}
                {currentPlan.limit && ` / ${currentPlan.limit}`}
              </span>
            </div>
            {currentPlan.limit && (
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    (usageCounter?.claims_created || 0) >= currentPlan.limit 
                      ? "bg-[#FF3B30]" 
                      : "bg-gradient-to-r from-[#007AFF] to-[#34C759]"
                  )}
                  style={{ 
                    width: `${Math.min(100, ((usageCounter?.claims_created || 0) / currentPlan.limit) * 100)}%` 
                  }}
                />
              </div>
            )}
            {!currentPlan.limit && (
              <p className="text-xs text-[#34C759]">Illimité avec le plan Business</p>
            )}
          </div>

          {/* Warning if near limit */}
          {currentPlan.limit && (usageCounter?.claims_created || 0) >= currentPlan.limit * 0.8 && (
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-xl",
              (usageCounter?.claims_created || 0) >= currentPlan.limit
                ? "bg-[#FF3B30]/10 border border-[#FF3B30]/20"
                : "bg-[#FF9F0A]/10 border border-[#FF9F0A]/20"
            )}>
              <AlertCircle className={cn(
                "w-5 h-5 shrink-0",
                (usageCounter?.claims_created || 0) >= currentPlan.limit ? "text-[#FF3B30]" : "text-[#FF9F0A]"
              )} />
              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  (usageCounter?.claims_created || 0) >= currentPlan.limit ? "text-[#FF3B30]" : "text-[#FF9F0A]"
                )}>
                  {(usageCounter?.claims_created || 0) >= currentPlan.limit
                    ? "Limite atteinte"
                    : "Limite presque atteinte"
                  }
                </p>
                <p className="text-xs text-white/50 mt-0.5">
                  Passez au plan Business pour des dossiers illimités
                </p>
              </div>
              <Link to={createPageUrl('Pricing')}>
                <GlassButton size="sm">Upgrader</GlassButton>
              </Link>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Trial Info */}
      {isTrialing && (
        <GlassCard className="p-6 bg-gradient-to-br from-[#007AFF]/5 to-[#BF5AF2]/5 border-[#007AFF]/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#007AFF]/10">
              <Zap className="w-6 h-6 text-[#007AFF]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Période d'essai gratuite</h3>
              <p className="text-sm text-white/60 mb-4">
                Vous avez accès à toutes les fonctionnalités pendant {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}.
                Choisissez un plan pour continuer après votre essai.
              </p>
              <Link to={createPageUrl('Pricing')}>
                <GlassButton>
                  Choisir un plan
                  <ArrowUpRight className="w-4 h-4" />
                </GlassButton>
              </Link>
            </div>
          </div>
        </GlassCard>
      )}

      {/* FAQ */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-white mb-4">Questions fréquentes</h3>
        <div className="space-y-4">
          {[
            {
              q: "Comment annuler mon abonnement ?",
              a: "Vous pouvez annuler à tout moment depuis le portail de facturation. Votre accès reste actif jusqu'à la fin de la période payée."
            },
            {
              q: "Puis-je changer de plan ?",
              a: "Oui, vous pouvez passer du plan Starter au plan Business à tout moment. Le changement est effectif immédiatement."
            },
            {
              q: "Que se passe-t-il si je dépasse ma limite ?",
              a: "Sur le plan Starter, vous ne pourrez plus créer de nouveaux dossiers une fois la limite de 15 atteinte. Passez au plan Business pour un accès illimité."
            }
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.02]">
              <p className="text-sm font-medium text-white mb-1">{item.q}</p>
              <p className="text-sm text-white/50">{item.a}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}