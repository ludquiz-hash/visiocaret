import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { claimsApi, functionsApi } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Car, 
  User, 
  FileText,
  Download,
  Mail,
  Calendar,
  Pencil,
  Trash2
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import StatusBadge from '@/components/ui-custom/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
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

export default function ClaimDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const claimId = urlParams.get('id');
  const [deleteDialog, setDeleteDialog] = useState({ open: false });
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Fetch claim
  const { data: claim, isLoading } = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => claimsApi.get(claimId),
    enabled: !!claimId && !!user,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => claimsApi.delete(claimId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast.success('Dossier supprimé');
      navigate(createPageUrl('Claims'));
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleDownloadPDF = async () => {
    setIsPdfLoading(true);
    try {
      const { blob } = await claimsApi.generatePDF(claimId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${claim?.claim_number || claimId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('PDF téléchargé');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleSendEmail = async () => {
    toast.info('Envoi d\'email... (fonctionnalité à implémenter)');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <GlassCard className="p-6">
          <Skeleton className="h-48" />
        </GlassCard>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Dossier non trouvé</h2>
        <p className="text-white/50 mb-4">Ce dossier n'existe pas ou a été supprimé</p>
        <Link to={createPageUrl('Claims')}>
          <GlassButton>Retour aux dossiers</GlassButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Claims')}>
            <GlassButton variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {claim.claim_number || `Dossier #${claim.id?.slice(0, 8)}`}
            </h1>
            <p className="text-white/50 text-sm">
              Créé le {claim.created_at ? format(new Date(claim.created_at), 'dd MMMM yyyy', { locale: fr }) : 'Date inconnue'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <GlassButton 
            variant="secondary" 
            onClick={handleDownloadPDF}
            disabled={isPdfLoading}
          >
            {isPdfLoading ? (
              <>
                <span className="animate-spin">⌛</span>
                Génération...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                PDF
              </>
            )}
          </GlassButton>
          <GlassButton 
            variant="secondary"
            onClick={handleSendEmail}
          >
            <Mail className="w-4 h-4" />
            Email
          </GlassButton>
          <Link to={createPageUrl(`ClaimWizard?id=${claim.id}`)}>
            <GlassButton variant="secondary">
              <Pencil className="w-4 h-4" />
              Modifier
            </GlassButton>
          </Link>
          <GlassButton 
            variant="secondary"
            onClick={() => setDeleteDialog({ open: true })}
          >
            <Trash2 className="w-4 h-4" />
          </GlassButton>
        </div>
      </div>

      <StatusBadge status={claim.status} />

      {/* Client Info */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-[#007AFF]" />
          <h2 className="text-lg font-semibold text-white">Client</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white/50">Nom</label>
            <p className="text-white">{claim.client_name || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-white/50">Email</label>
            <p className="text-white">{claim.client_email || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-white/50">Téléphone</label>
            <p className="text-white">{claim.client_phone || 'N/A'}</p>
          </div>
        </div>
      </GlassCard>

      {/* Vehicle Info */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Car className="w-5 h-5 text-[#007AFF]" />
          <h2 className="text-lg font-semibold text-white">Véhicule</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white/50">Marque / Modèle</label>
            <p className="text-white">{claim.vehicle_brand || 'N/A'} {claim.vehicle_model || ''}</p>
          </div>
          <div>
            <label className="text-sm text-white/50">Année</label>
            <p className="text-white">{claim.vehicle_year || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-white/50">Immatriculation</label>
            <p className="text-white">{claim.vehicle_license_plate || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-white/50">N° VIN</label>
            <p className="text-white">{claim.vehicle_vin || 'N/A'}</p>
          </div>
        </div>
      </GlassCard>

      {/* Damage Info */}
      {claim.damage_description && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Description des dommages</h2>
          <p className="text-white/70 whitespace-pre-wrap">{claim.damage_description}</p>
        </GlassCard>
      )}

      {/* Expert Notes */}
      {claim.expert_notes && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Notes de l'expert</h2>
          <p className="text-white/70 whitespace-pre-wrap">{claim.expert_notes}</p>
        </GlassCard>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
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
    </div>
  );
}
