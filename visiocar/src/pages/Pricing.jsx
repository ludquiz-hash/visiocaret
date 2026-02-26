import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Check, 
  Zap, 
  Building2, 
  ArrowLeft,
  Star,
  Shield,
  Headphones
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 69,
    description: 'Parfait pour démarrer',
    icon: Zap,
    color: 'blue',
    features: [
      '15 dossiers par mois',
      'Analyse automatique des dommages',
      'Génération PDF',
      'Support email',
      '1 utilisateur',
    ],
    limitations: [
      'Logo générique sur les rapports',
    ]
  },
  {
    id: 'business',
    name: 'Business',
    price: 199,
    description: 'Pour les professionnels',
    icon: Building2,
    color: 'purple',
    popular: true,
    features: [
      'Dossiers illimités',
      'Analyse automatique des dommages',
      'Génération PDF',
      'Support prioritaire',
      'Utilisateurs illimités',
      'Logo personnalisé sur les rapports',
      'Export des données',
      'API access',
    ],
    limitations: []
  }
];

export default function Pricing() {
  const [isLoading, setIsLoading] = useState(null); // 'starter' | 'business' | null
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
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

  const handleSubscribe = async (planId) => {
    if (!user) {
      base44.auth.redirectToLogin(createPageUrl('Pricing'));
      return;
    }

    if (!membership?.garage_id) {
      toast.error('Garage introuvable. Veuillez contacter le support.');
      return;
    }

    try {
      setIsLoading(planId);
      toast.info('Redirection vers le paiement...');
      
      const response = await base44.functions.invoke('createCheckoutSession', {
        planId,
        garageId: membership.garage_id
      });

      if (response.data?.success && response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Erreur: URL de paiement non reçue');
        setIsLoading(null);
      }
    } catch (err) {
      toast.error(`Erreur: ${err.message || 'Impossible de créer la session'}`);
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] py-12 px-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#007AFF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#BF5AF2]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Back Link */}
        <Link 
          to={createPageUrl('Dashboard')}
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Simplifiez vos expertises carrosserie avec notre solution IA
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = garage?.plan_type === plan.id && garage?.is_subscribed;
            
            return (
              <GlassCard 
                key={plan.id}
                className={cn(
                  "relative p-8 overflow-hidden",
                  plan.popular && "border-[#BF5AF2]/50 shadow-[0_0_60px_rgba(191,90,242,0.15)]"
                )}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-[#BF5AF2] to-[#007AFF] text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      POPULAIRE
                    </div>
                  </div>
                )}

                {/* Plan Icon & Name */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn(
                    "p-3 rounded-xl",
                    plan.color === 'blue' ? "bg-[#007AFF]/10" : "bg-[#BF5AF2]/10"
                  )}>
                    <Icon className={cn(
                      "w-6 h-6",
                      plan.color === 'blue' ? "text-[#007AFF]" : "text-[#BF5AF2]"
                    )} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                    <p className="text-sm text-white/50">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}€</span>
                    <span className="text-white/50">/mois</span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">HT • Facturation mensuelle</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#34C759] shrink-0" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, i) => (
                    <li key={i} className="flex items-start gap-3 opacity-50">
                      <span className="w-5 h-5 flex items-center justify-center text-white/40">—</span>
                      <span className="text-sm text-white/50">{limitation}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrentPlan ? (
                  <div className="w-full py-3 rounded-xl bg-[#34C759]/10 border border-[#34C759]/30 text-center">
                    <span className="text-sm font-medium text-[#34C759]">Plan actuel</span>
                  </div>
                ) : (
                  <GlassButton 
                    className="w-full"
                    variant={plan.popular ? 'primary' : 'secondary'}
                    size="lg"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading === plan.id}
                  >
                    {isLoading === plan.id
                      ? 'Chargement...'
                      : garage?.is_subscribed
                        ? 'Changer de plan'
                        : 'Commencer'
                    }
                  </GlassButton>
                )}
              </GlassCard>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: 'Paiement sécurisé', desc: 'Transactions via Stripe' },
            { icon: Headphones, title: 'Support réactif', desc: 'Réponse sous 24h' },
            { icon: Zap, title: 'Sans engagement', desc: 'Annulez à tout moment' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <item.icon className="w-5 h-5 text-[#007AFF]" />
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-white/50">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Link */}
        <p className="text-center text-sm text-white/40 mt-12">
          Des questions ? Contactez-nous à{' '}
          <a href="mailto:support@visiwebcar.fr" className="text-[#007AFF] hover:underline">
            support@visiwebcar.fr
          </a>
        </p>
      </div>
    </div>
  );
}