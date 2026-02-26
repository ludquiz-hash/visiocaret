import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Car, 
  Zap, 
  FileText, 
  Clock, 
  Shield, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Play,
  Star
} from 'lucide-react';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassCard from '@/components/ui-custom/GlassCard';
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Analyse automatique instantanée",
  description: "Le système analyse vos photos et détecte automatiquement les dommages en quelques secondes.",
    color: "blue"
  },
  {
    icon: FileText,
    title: "Rapports professionnels",
    description: "Générez des PDF d'expertise complets, prêts à envoyer aux assureurs.",
    color: "green"
  },
  {
    icon: Clock,
    title: "Gain de temps",
    description: "Réduisez de 70% le temps passé sur chaque dossier d'expertise.",
    color: "purple"
  },
  {
    icon: Shield,
    title: "Données sécurisées",
    description: "Vos données sont chiffrées et hébergées en Europe, conformes RGPD.",
    color: "orange"
  }
];

const steps = [
  { num: 1, title: "Prenez des photos", desc: "Capturez les dommages du véhicule" },
  { num: 2, title: "Analyse automatique", desc: "Le système détecte et évalue les dégâts" },
  { num: 3, title: "Ajustez si besoin", desc: "Modifiez les estimations manuellement" },
  { num: 4, title: "Générez le PDF", desc: "Envoyez le rapport à l'assureur" }
];

export default function Landing() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-[#0B0E14] overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#007AFF]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#BF5AF2]/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#0056CC] flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">VisiWebCar</span>
          </div>
          
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link to={createPageUrl('Dashboard')}>
                <GlassButton>
                  Accéder à l'app
                  <ArrowRight className="w-4 h-4" />
                </GlassButton>
              </Link>
            ) : (
              <>
                <button 
                  onClick={() => base44.auth.redirectToLogin()}
                  className="text-white/70 hover:text-white transition-colors text-sm font-medium"
                >
                  Connexion
                </button>
                <button onClick={() => base44.auth.redirectToLogin()}>
                  <GlassButton>
                    Essai gratuit
                  </GlassButton>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/20 mb-8">
            <Sparkles className="w-4 h-4 text-[#007AFF]" />
            <span className="text-sm text-[#007AFF] font-medium">Nouveau: Analyse avancée des dommages</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            L'expertise carrosserie
            <br />
            <span className="bg-gradient-to-r from-[#007AFF] to-[#BF5AF2] bg-clip-text text-transparent">
              propulsée par l’analyse avancée
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
            Analysez les dommages, estimez les réparations et générez des rapports PDF professionnels en quelques clics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => base44.auth.redirectToLogin()}>
              <GlassButton size="lg">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </GlassButton>
            </button>
            <Link to={createPageUrl('Pricing')}>
              <GlassButton variant="secondary" size="lg">
                Voir les tarifs
              </GlassButton>
            </Link>
          </div>

          <p className="text-sm text-white/40 mt-6">
            5 jours d'essai gratuit • Sans carte bancaire
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-24 bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Une solution complète pour digitaliser vos expertises carrosserie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              const colors = {
                blue: "bg-[#007AFF]/10 text-[#007AFF]",
                green: "bg-[#34C759]/10 text-[#34C759]",
                purple: "bg-[#BF5AF2]/10 text-[#BF5AF2]",
                orange: "bg-[#FF9F0A]/10 text-[#FF9F0A]"
              };

              return (
                <GlassCard key={i} hover className="p-8">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", colors[feature.color])}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/50 leading-relaxed">{feature.description}</p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-white/50">En 4 étapes simples</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#007AFF]/20 to-[#007AFF]/5 border border-[#007AFF]/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-[#007AFF]">{step.num}</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/50">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-[#007AFF]/30 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="p-12 text-center bg-gradient-to-br from-[#007AFF]/10 to-[#BF5AF2]/10 border-[#007AFF]/20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt à transformer vos expertises ?
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              Rejoignez les carrossiers qui gagnent du temps chaque jour avec VisiWebCar.
            </p>
            <button onClick={() => base44.auth.redirectToLogin()}>
              <GlassButton size="lg">
                Démarrer l'essai gratuit
                <ArrowRight className="w-5 h-5" />
              </GlassButton>
            </button>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#007AFF] to-[#0056CC] flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">VisiWebCar</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-white/50">
              <Link to={createPageUrl('Privacy')} className="hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link to={createPageUrl('Terms')} className="hover:text-white transition-colors">
                CGV
              </Link>
              <Link to={createPageUrl('Legal')} className="hover:text-white transition-colors">
                Mentions légales
              </Link>
            </div>

            <p className="text-sm text-white/40">
              © 2024 VisiWebCar. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}