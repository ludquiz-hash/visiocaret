import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { claimsApi, garageApi } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Plus,
  ArrowRight,
  Calendar,
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
  // Get user from auth context
  const { user, profile } = useAuth();

  // Fetch garage
  const { data: garage, isLoading: garageLoading } = useQuery({
    queryKey: ['garage'],
    queryFn: () => garageApi.get(),
    enabled: !!user,
  });

  // Fetch claims
  const { data: claimsData = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: () => claimsApi.list({ limit: 50 }),
    enabled: !!user,
  });

  // Fetch usage
  const { data: usage = { claims_created: 0 } } = useQuery({
    queryKey: ['usage'],
    queryFn: () => garageApi.getUsage(),
    enabled: !!user,
  });

  const claimsList = claimsData || [];
  const loading = claimsLoading || garageLoading;

  // Calculate stats
  const activeClaims = claimsList.filter(c => ['draft', 'analyzing', 'review'].includes(c.status));
  const completedClaims = claimsList.filter(c => c.status === 'completed');
  const recentClaims = claimsList.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Bonjour, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Bienvenue'} 👋
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
          value={usage?.claims_created || 0}
          icon={Calendar}
          color="purple"
          subtitle={garage?.plan_type === 'starter' ? `/ 15 max` : 'Illimité'}
        />
        <StatCard
          title="Dossiers terminés"
          value={completedClaims.length}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Total dossiers"
          value={claimsList.length}
          icon={FileText}
          color="orange"
        />
      </div>

      {/* Recent Claims */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Dossiers récents</h2>
          <Link to={createPageUrl('Claims')}>
            <GlassButton variant="ghost" size="sm">
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="p-4">
                <Skeleton className="h-16" />
              </GlassCard>
            ))}
          </div>
        ) : recentClaims.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun dossier"
            description="Créez votre premier dossier d'expertise"
            action={
              <Link to={createPageUrl('ClaimWizard')}>
                <GlassButton icon={Plus}>
                  Créer un dossier
                </GlassButton>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {recentClaims.map((claim) => (
              <GlassCard key={claim.id} className="p-4 hover:border-white/[0.12] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-white truncate">
                        {claim.claim_number || `Dossier #${claim.id?.slice(0, 8)}`}
                      </h3>
                      <StatusBadge status={claim.status} />
                    </div>
                    <p className="text-sm text-white/50">
                      {claim.client_name || 'Client non renseigné'} • {claim.vehicle_brand || 'N/A'} {claim.vehicle_model || ''}
                    </p>
                  </div>
                  <p className="text-sm text-white/40 ml-4">
                    {claim.created_at 
                      ? format(new Date(claim.created_at), 'dd MMM', { locale: fr })
                      : ''
                    }
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
