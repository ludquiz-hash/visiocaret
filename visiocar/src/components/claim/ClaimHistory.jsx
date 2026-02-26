import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, FileText, Mail, CheckCircle, Edit, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import { Skeleton } from '@/components/ui/skeleton';

const actionIcons = {
  created: FileText,
  updated: Edit,
  status_changed: CheckCircle,
  pdf_generated: FileText,
  email_sent: Mail,
};

const actionColors = {
  created: 'text-[#34C759]',
  updated: 'text-[#007AFF]',
  status_changed: 'text-[#FF9F0A]',
  pdf_generated: 'text-[#BF5AF2]',
  email_sent: 'text-[#007AFF]',
};

export default function ClaimHistory({ claimId }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['claimHistory', claimId],
    queryFn: async () => {
      if (!claimId) return [];
      const items = await base44.entities.ClaimHistory.filter(
        { claim_id: claimId },
        '-created_date',
        50
      );
      return items;
    },
    enabled: !!claimId,
  });

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <h3 className="font-semibold text-white mb-4">Historique</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/5" />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (!history || history.length === 0) {
    return (
      <GlassCard className="p-6">
        <h3 className="font-semibold text-white mb-4">Historique</h3>
        <p className="text-sm text-white/40">Aucun historique disponible</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="font-semibold text-white mb-4">Historique ({history.length})</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {history.map((item) => {
          const Icon = actionIcons[item.action] || AlertCircle;
          const color = actionColors[item.action] || 'text-white/60';

          return (
            <div
              key={item.id}
              className="flex gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className={`p-2 rounded-lg bg-white/[0.04] ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{item.description}</p>
                {item.user_name && (
                  <p className="text-xs text-white/40 mt-0.5">
                    Par {item.user_name}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1 text-xs text-white/30">
                  <Clock className="w-3 h-3" />
                  {format(new Date(item.created_date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}