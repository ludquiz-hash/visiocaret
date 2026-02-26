import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { resolveActiveGarageId } from '@/components/utils/garageUtils';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Clock, 
  TrendingUp, 
  Zap,
  Plus,
  ArrowRight,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import StatCard from '@/components/ui-custom/StatCard';
import StatusBadge from '@/components/ui-custom/StatusBadge';
import EmptyState from '@/components/ui-custom/EmptyState';
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  // Get user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Resolve active garage ID
  const { data: activeGarageId } = useQuery({
    queryKey: ['activeGarageId', user?.email],
    queryFn: async () => {
      if (!user) return null;
      return await resolveActiveGarageId(user);
    },
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch garage
  const { data: garage } = useQuery({
    queryKey: ['garage', activeGarageId],
    queryFn: async () => {
      if (!activeGarageId) return null;
      const garages = await base44.entities.Garage.filter({ id: activeGarageId });
      return garages[0] || null;
    },
    enabled: !!activeGarageId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch claims
  const { data: claims = [], isLoading: loading } = useQuery({
    queryKey: ['claims', activeGarageId],
    queryFn: async () => {
      if (!activeGarageId) return [];
      return await base44.entities.Claim.filter(
        { garage_id: activeGarageId },
        '-created_date',
        50
      );
    },
    enabled: !!activeGarageId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch usage counter
  const now = new Date();
  const { data: usageCounter = { claims_created: 0 } } = useQuery({
    queryKey: ['usageCounter', activeGarageId, now.getFullYear(), now.getMonth() + 1],
    queryFn: async () => {
      if (!activeGarageId) return { claims_created: 0 };
      const counters = await base44.entities.UsageCounter.filter({
        garage_id: activeGarageId,
        year: now.getFullYear(),
        month: now.getMonth() + 1
      });
      return counters[0] || { claims_created: 0 };
    },
    enabled: !!activeGarageId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Calculate stats
  const activeClaims = claims.filter(c => ['draft', 'analyzing', 'review'].includes(c.status));
  const completedClaims = claims.filter(c => c.status === 'completed');
  const totalHoursSaved = completedClaims.reduce((acc, c) => {
    const hours = c.ai_report?.total_hours || 0;
    return acc + (hours * 0.3); // Assume 30% time saved per analysis
  }, 0);

  const recentClaims = claims.slice(0, 5);

  return (
    <div className="space-y-8">
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs bg-white/5 text-white/50 px-3 py-2 rounded-lg border border-white/10">
          🔍 DB claims count: {(claims || []).length} | activeGarageId: {activeGarageId || 'null'}
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Bonjour, {user?.full_name?.split(' ')[0] || 'Bienvenue'} 👋
          </h1>
          <p className="text-white/50 mt-1">
            Voici un aperçu de votre activité
          </p>
        </div>
        <Link to={createPageUrl('ClaimWizard')}>
          <GlassButton icon={Plus}>
            Nouveau dossier
          </GlassButton>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Dossiers en cours"
          value={activeClaims.length}
          icon={FileText}
          color="blue"
          subtitle="À traiter"
        />
        <StatCard
          title="Ce mois"
          value={usageCounter?.claims_created || 0}
          icon={Calendar}
          color="purple"
          subtitle={garage?.plan_type === 'starter' ? `/ 15 max` : 'Illimité'}
        />
        <StatCard
          title="Temps estimé gagné"
          value={`${Math.round(totalHoursSaved)}h`}
          icon={Clock}
          color="green"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Dossiers terminés"
          value={completedClaims.length}
          icon={CheckCircle2}
          color="orange"
          subtitle="Total"
        />
      </div>

      {/* Recent Claims */}
      <GlassCard className="overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Dossiers récents</h2>
          <Link 
            to={createPageUrl('Claims')}
            className="text-sm text-[#007AFF] hover:text-[#007AFF]/80 flex items-center gap-1 transition-colors"
          >
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 bg-white/5" />
                  <Skeleton className="h-3 w-32 bg-white/5" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full bg-white/5" />
              </div>
            ))}
          </div>
        ) : recentClaims.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun dossier"
            description="Créez votre premier dossier d'expertise pour commencer à utiliser l'analyse automatique."
            action={() => window.location.href = createPageUrl('ClaimWizard')}
            actionLabel="Créer un dossier"
          />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {recentClaims.map((claim) => (
              <Link
                key={claim.id}
                to={createPageUrl(`ClaimDetail?id=${claim.id}`)}
                className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors"
              >
                {/* Vehicle Icon/Thumbnail */}
                <div className="w-12 h-12 rounded-xl bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-[#007AFF]">
                    {claim.vehicle_data?.brand?.charAt(0) || 'V'}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white truncate">
                      {claim.vehicle_data?.brand || 'Véhicule'} {claim.vehicle_data?.model || ''}
                    </p>
                    {claim.reference && (
                      <span className="text-xs text-white/40">#{claim.reference}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-white/50">
                      {claim.client_data?.name || 'Client non défini'}
                    </span>
                    <span className="text-xs text-white/30">
                      {format(new Date(claim.created_date), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <StatusBadge status={claim.status} />

                <ArrowRight className="w-4 h-4 text-white/20" />
              </Link>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard hover className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#007AFF]/10">
              <Zap className="w-6 h-6 text-[#007AFF]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Analyse rapide</h3>
              <p className="text-sm text-white/50 mb-4">
                Téléchargez des photos et obtenez une analyse automatique en quelques secondes
              </p>
              <Link to={createPageUrl('ClaimWizard')}>
                <GlassButton variant="secondary" size="sm">
                  Démarrer
                </GlassButton>
              </Link>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#34C759]/10">
              <TrendingUp className="w-6 h-6 text-[#34C759]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Statistiques avancées</h3>
              <p className="text-sm text-white/50 mb-4">
                Suivez vos performances et optimisez votre productivité
              </p>
              <Link to={createPageUrl('Claims')}>
                <GlassButton variant="secondary" size="sm">
                  Voir les rapports
                </GlassButton>
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}