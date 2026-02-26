import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { claimsApi } from '@/api';
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
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, claim: null });
  const [editDialog, setEditDialog] = useState({ open: false, claim: null });

  // Fetch claims
  const { data: claims = [], isLoading: loading } = useQuery({
    queryKey: ['claims'],
    queryFn: () => claimsApi.list(),
    enabled: !!user,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => claimsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast.success('Dossier supprimé');
      setDeleteDialog({ open: false, claim: null });
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => claimsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast.success('Dossier mis à jour');
      setEditDialog({ open: false, claim: null });
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });

  // Filter claims
  const filteredClaims = (claims || []).filter(claim => {
    const matchesSearch = !searchTerm || 
      (claim.claim_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (claim.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (claim.vehicle_brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (claim.vehicle_model?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (deleteDialog.claim) {
      deleteMutation.mutate(deleteDialog.claim.id);
    }
  };

  const handleUpdate = async (data) => {
    if (editDialog.claim) {
      updateMutation.mutate({ id: editDialog.claim.id, data });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4 text-white/40" />;
      case 'analyzing': return <Filter className="w-4 h-4 text-[#007AFF]" />;
      case 'review': return <Eye className="w-4 h-4 text-[#FF9F0A]" />;
      case 'completed': return <Calendar className="w-4 h-4 text-[#34C759]" />;
      default: return <FileText className="w-4 h-4 text-white/40" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Dossiers</h1>
          <p className="text-white/50 mt-1">
            {filteredClaims.length} dossier{filteredClaims.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link to={createPageUrl('ClaimWizard')}>
          <GlassButton icon={Plus}>
            Nouveau dossier
          </GlassButton>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <GlassInput
            placeholder="Rechercher un dossier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white/[0.04] border-white/[0.08] text-white">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d29] border-white/[0.08]">
            <SelectItem value="all" className="text-white">Tous les statuts</SelectItem>
            <SelectItem value="draft" className="text-white">Brouillon</SelectItem>
            <SelectItem value="analyzing" className="text-white">En analyse</SelectItem>
            <SelectItem value="review" className="text-white">En révision</SelectItem>
            <SelectItem value="completed" className="text-white">Terminé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : filteredClaims.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun dossier"
          description={searchTerm || statusFilter !== 'all' 
            ? "Essayez de modifier vos filtres"
            : "Créez votre premier dossier d'expertise"
          }
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
          {filteredClaims.map((claim) => (
            <GlassCard key={claim.id} className="p-4 hover:border-white/[0.12] transition-colors">
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                  {getStatusIcon(claim.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white truncate">
                        {claim.claim_number || `Dossier #${claim.id?.slice(0, 8)}`}
                      </h3>
                      <p className="text-sm text-white/50">
                        {claim.client_name || 'Client non renseigné'}
                      </p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/40">
                    <div className="flex items-center gap-1.5">
                      <Car className="w-4 h-4" />
                      <span>
                        {claim.vehicle_brand || 'N/A'} {claim.vehicle_model || ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {claim.created_at 
                          ? format(new Date(claim.created_at), 'dd MMM yyyy', { locale: fr })
                          : 'Date inconnue'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                      <MoreVertical className="w-4 h-4 text-white/40" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1d29] border-white/[0.08]">
                    <DropdownMenuItem 
                      className="text-white hover:bg-white/[0.04]"
                      onClick={() => window.location.href = createPageUrl(`ClaimDetail?id=${claim.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-white hover:bg-white/[0.04]"
                      onClick={() => setEditDialog({ open: true, claim })}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-400 hover:bg-red-500/10"
                      onClick={() => setDeleteDialog({ open: true, claim })}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent className="bg-[#1a1d29] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.04] text-white border-white/[0.08] hover:bg-white/[0.08]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <EditClaimModal
        claim={editDialog.claim}
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
        onSave={handleUpdate}
      />
    </div>
  );
}
