import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { resolveActiveGarageId } from '@/components/utils/garageUtils';
import { isDevMode } from '@/components/utils/dev';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  ArrowRight,
  Calendar,
  Car,
  MoreVertical,
  Pencil,
  Trash2,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassInput from '@/components/ui-custom/GlassInput';
import StatusBadge from '@/components/ui-custom/StatusBadge';
import EmptyState from '@/components/ui-custom/EmptyState';
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EditClaimModal from '@/components/claim/EditClaimModal';

export default function Claims() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, claim: null });
  const [editDialog, setEditDialog] = useState({ open: false, claim: null });

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

  // Fetch claims
  const { data: claims = [], isLoading: loading } = useQuery({
    queryKey: ['claims', activeGarageId],
    queryFn: async () => {
      if (!activeGarageId) return [];
      return await base44.entities.Claim.filter(
        { garage_id: activeGarageId },
        '-created_date',
        100
      );
    },
    enabled: !!activeGarageId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Filter claims
  const filteredClaims = (claims || []).filter(claim => {
    const matchesSearch = !searchTerm || 
      claim.vehicle_data?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.vehicle_data?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.vehicle_data?.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.client_data?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: (claims || []).length,
    draft: (claims || []).filter(c => c.status === 'draft').length,
    analyzing: (claims || []).filter(c => c.status === 'analyzing').length,
    completed: (claims || []).filter(c => c.status === 'completed').length,
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (claim) => {
      // CRITICAL: Block if no activeGarageId
      if (!activeGarageId) {
        throw new Error('Aucun garage actif. Veuillez rafraîchir la page.');
      }

      // CRITICAL: Verify claim belongs to active garage
      if (claim.garage_id !== activeGarageId) {
        throw new Error('Vous n\'avez pas l\'autorisation de supprimer ce dossier');
      }

      // CRITICAL: Only allow deleting drafts
      if (claim.status !== 'draft') {
        throw new Error('Seuls les brouillons peuvent être supprimés');
      }

      if (isDevMode()) {
        console.debug('[Claims] Deleting claim:', {
          garageId: activeGarageId,
          claimId: claim.id,
          claimGarageId: claim.garage_id,
          status: claim.status,
          action: 'delete'
        });
      }

      await base44.entities.Claim.delete(claim.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims', activeGarageId] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast.success('Dossier supprimé avec succès');
      setDeleteDialog({ open: false, claim: null });
    },
    onError: (error) => {
      const errorMessage = error.message || error.toString() || 'Erreur lors de la suppression';
      toast.error(`❌ ${errorMessage}`);
      
      if (isDevMode()) {
        console.error('[Claims] Delete error:', {
          error,
          message: error.message,
          stack: error.stack,
          garageId: activeGarageId
        });
      }
    },
  });

  const handleDelete = (claim) => {
    // Pre-check before showing dialog
    if (!activeGarageId) {
      toast.error('❌ Aucun garage actif. Veuillez rafraîchir la page.');
      return;
    }
    if (claim.garage_id !== activeGarageId) {
      toast.error('❌ Vous n\'avez pas l\'autorisation de supprimer ce dossier');
      return;
    }
    if (claim.status !== 'draft') {
      toast.error('❌ Seuls les brouillons peuvent être supprimés');
      return;
    }
    setDeleteDialog({ open: true, claim });
  };

  const handleEdit = (claim) => {
    if (!activeGarageId) {
      toast.error('❌ Aucun garage actif. Veuillez rafraîchir la page.');
      return;
    }
    if (claim.garage_id !== activeGarageId) {
      toast.error('❌ Vous n\'avez pas l\'autorisation de modifier ce dossier');
      return;
    }
    setEditDialog({ open: true, claim });
  };

  // Update claim mutation
  const updateMutation = useMutation({
    mutationFn: async ({ claimId, data }) => {
      if (!activeGarageId) {
        throw new Error('Aucun garage actif. Veuillez rafraîchir la page.');
      }

      const claim = editDialog.claim;
      if (!claim || claim.garage_id !== activeGarageId) {
        throw new Error('Vous n\'avez pas l\'autorisation de modifier ce dossier');
      }

      if (isDevMode()) {
        console.debug('[Claims] Updating claim:', {
          garageId: activeGarageId,
          claimId,
          data
        });
      }

      await base44.entities.Claim.update(claimId, { ...data, garage_id: activeGarageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims', activeGarageId] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast.success('Dossier modifié avec succès');
      setEditDialog({ open: false, claim: null });
    },
    onError: (error) => {
      const errorMessage = error.message || error.toString() || 'Erreur lors de la modification';
      toast.error(`❌ ${errorMessage}`);
      
      if (isDevMode()) {
        console.error('[Claims] Update error:', {
          error,
          message: error.message,
          stack: error.stack,
          garageId: activeGarageId
        });
      }
    },
  });



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Dossiers</h1>
          <p className="text-white/50 mt-1">
            {stats.total} dossier{stats.total > 1 ? 's' : ''} au total
          </p>
        </div>
        <Link to={createPageUrl('ClaimWizard')}>
          <GlassButton icon={Plus} className="">
            Nouveau dossier
          </GlassButton>
        </Link>
      </div>

      {isDevMode() && (
        <div className="text-xs bg-white/5 text-white/50 px-3 py-2 rounded-lg border border-white/10 space-y-1">
          <div className="flex items-center gap-4 flex-wrap">
            <span>🔍 DB claims: <strong className="text-white">{(claims || []).length}</strong></span>
            <span>activeGarageId: <strong className={activeGarageId ? 'text-[#34C759]' : 'text-[#FF3B30]'}>{activeGarageId || 'null'}</strong></span>
            <span>Filter: <strong className="text-white">{statusFilter}</strong></span>
            <span>Search: <strong className="text-white">{searchTerm || 'none'}</strong></span>
          </div>
          {activeGarageId && (
            <div className="text-[10px] text-white/40 font-mono">
              Query: Claim.filter(garage_id={activeGarageId}, order=-created_date, limit=100)
            </div>
          )}
        </div>
      )}

       {/* Quick Stats */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Brouillons', value: stats.draft, color: 'text-white/50' },
          { label: 'En analyse', value: stats.analyzing, color: 'text-[#007AFF]' },
          { label: 'Terminés', value: stats.completed, color: 'text-[#34C759]' },
        ].map((stat, i) => (
          <div 
            key={i}
            className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]"
          >
            <p className="text-xs text-white/40 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <GlassInput
            placeholder="Rechercher par véhicule, client, plaque..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white/[0.04] border-white/[0.08] text-white rounded-xl">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/40" />
              <SelectValue placeholder="Statut" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-[#151921] border-white/10">
            <SelectItem value="all" className="text-white hover:bg-white/10">Tous les statuts</SelectItem>
            <SelectItem value="draft" className="text-white hover:bg-white/10">Brouillons</SelectItem>
            <SelectItem value="analyzing" className="text-white hover:bg-white/10">En analyse</SelectItem>
            <SelectItem value="review" className="text-white hover:bg-white/10">À vérifier</SelectItem>
            <SelectItem value="completed" className="text-white hover:bg-white/10">Terminés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Claims List */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 bg-white/5" />
                  <Skeleton className="h-3 w-32 bg-white/5" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full bg-white/5" />
              </div>
            ))}
          </div>
        ) : filteredClaims.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={searchTerm || statusFilter !== 'all' ? "Aucun résultat" : "Aucun dossier"}
            description={
              searchTerm || statusFilter !== 'all'
                ? "Modifiez vos critères de recherche"
                : "Créez votre premier dossier d'expertise pour commencer"
            }
            action={!searchTerm && statusFilter === 'all' ? () => window.location.href = createPageUrl('ClaimWizard') : undefined}
            actionLabel="Créer un dossier"
            className=""
          />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredClaims.map((claim) => {
              const isDraft = claim.status === 'draft';
              
              return (
                <div
                  key={claim.id}
                  className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Vehicle Icon */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#007AFF]/20 to-[#007AFF]/5 flex items-center justify-center shrink-0 border border-[#007AFF]/20">
                    <Car className="w-6 h-6 text-[#007AFF]" />
                  </div>

                  {/* Details */}
                  <Link
                    to={createPageUrl(`ClaimDetail?id=${claim.id}`)}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white truncate">
                        {claim.vehicle_data?.brand || 'Véhicule'} {claim.vehicle_data?.model || ''}
                      </p>
                      {claim.reference && (
                        <span className="text-xs text-white/40 font-mono">#{claim.reference}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-sm text-white/50">
                        {claim.client_data?.name || 'Client non défini'}
                      </span>
                      {claim.vehicle_data?.plate && (
                        <span className="text-xs text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded">
                          {claim.vehicle_data.plate}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-white/30">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(claim.created_date), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </Link>

                  {/* Status */}
                  <StatusBadge status={claim.status} className="" />

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors">
                        <MoreVertical className="w-5 h-5 text-white/40" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#151921] border-white/10">
                      {isDraft ? (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleEdit(claim)}
                            className="text-white hover:bg-white/10 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Modifier (rapide)
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              to={createPageUrl(`ClaimWizard?edit=${claim.id}`)}
                              className="text-white hover:bg-white/10 cursor-pointer flex items-center"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Modifier (complet)
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(claim)}
                            className="text-[#FF3B30] hover:bg-[#FF3B30]/10 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleEdit(claim)}
                            className="text-white hover:bg-white/10 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.location.href = createPageUrl(`ClaimDetail?id=${claim.id}`)}
                            className="text-white hover:bg-white/10 cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent className="bg-[#151921] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer le dossier ?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Cette action est irréversible. Le dossier brouillon "{deleteDialog.claim?.vehicle_data?.brand} {deleteDialog.claim?.vehicle_data?.model}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.08] border-white/10 text-white hover:bg-white/[0.12]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.claim && deleteMutation.mutate(deleteDialog.claim)}
              className="bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Claim Modal */}
      <EditClaimModal
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
        claim={editDialog.claim}
        onSave={(data) => editDialog.claim && updateMutation.mutate({ claimId: editDialog.claim.id, data })}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
}