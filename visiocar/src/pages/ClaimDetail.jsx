import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { resolveActiveGarageId } from '@/components/utils/garageUtils';
import { isDevMode } from '@/components/utils/dev';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Car, 
  User, 
  Shield, 
  FileText,
  Download,
  Mail,
  Clock,
  Calendar,
  AlertCircle,
  Pencil,
  Trash2
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import StatusBadge from '@/components/ui-custom/StatusBadge';
import ClaimHistory from '@/components/claim/ClaimHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
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
  const urlParams = new URLSearchParams(window.location.search);
  const claimId = urlParams.get('id');
  const [deleteDialog, setDeleteDialog] = React.useState({ open: false });
  const [isPdfLoading, setIsPdfLoading] = React.useState(false);
  const [isEmailLoading, setIsEmailLoading] = React.useState(false);

  const getFunctionErrorMessage = (err, fallback = 'Erreur serveur') => {
    // base44.functions.invoke uses axios under the hood; keep the real server payload if present
    const data = err?.response?.data;
    if (data) {
      const error = data?.error || data?.message;
      const details = data?.details;
      if (error && details) return `${error}: ${details}`;
      if (error) return String(error);
      if (typeof data === 'string') return data;
    }
    return err?.message || String(err) || fallback;
  };

  const downloadPdfFromUrl = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Téléchargement PDF impossible (HTTP ${response.status})`);
    }
    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error('PDF vide');
    }
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `Rapport_${claim?.reference || claim?.id || 'DOSSIER'}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(objectUrl);
  };

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

  // Fetch claim - MUST filter by id AND garage_id
  const { data: claim, isLoading } = useQuery({
    queryKey: ['claim', claimId, activeGarageId],
    queryFn: async () => {
      if (!claimId || !activeGarageId) return null;
      
      const claims = await base44.entities.Claim.filter({ 
        id: claimId,
        garage_id: activeGarageId 
      });
      
      return claims[0] || null;
    },
    enabled: !!claimId && !!activeGarageId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!activeGarageId) {
        throw new Error('Aucun garage actif');
      }
      if (!claim?.id) {
        throw new Error('Dossier introuvable');
      }
      if (claim.garage_id !== activeGarageId) {
        throw new Error('Vous n\'avez pas l\'autorisation de supprimer ce dossier');
      }
      if (claim.status !== 'draft') {
        throw new Error('Seuls les brouillons peuvent être supprimés');
      }

      await base44.entities.Claim.delete(claim.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims', activeGarageId] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['claim', claimId, activeGarageId] });
      queryClient.invalidateQueries({ queryKey: ['claim', claimId] });
      toast.success('Dossier supprimé avec succès');
      setDeleteDialog({ open: false });
      navigate(createPageUrl('Claims'));
    },
    onError: (error) => {
      const errorMessage = error.message || error.toString() || 'Erreur lors de la suppression';
      toast.error(`❌ ${errorMessage}`);
    },
  });

  const handleDelete = () => {
    if (!claim) return;
    if (claim.status !== 'draft') {
      toast.error('Seuls les brouillons peuvent être supprimés');
      return;
    }
    setDeleteDialog({ open: true });
  };

  const sendEmail = async () => {
    if (!claim?.client_data?.email) {
      toast.error('Aucune adresse email client');
      return;
    }

    try {
      setIsEmailLoading(true);
      toast.info('Envoi de l\'email...');

      const response = await base44.functions.invoke('sendClaimEmail', {
        claimId: claim.id,
        recipientEmail: claim.client_data.email,
        recipientName: claim.client_data.name
      });

      if (response?.data?.error) {
        throw new Error(response.data.error + (response.data.details ? `: ${response.data.details}` : ''));
      }

      if (response?.data?.success) {
        toast.success('Email envoyé avec succès');
      } else {
        throw new Error('Email non envoyé');
      }
    } catch (err) {
      console.error('❌ [EMAIL] Erreur:', err);
      toast.error(`Impossible d'envoyer l'email: ${getFunctionErrorMessage(err, 'Erreur envoi email')}`);
    } finally {
      setIsEmailLoading(false);
    }
  };

  if (isLoading || !activeGarageId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-64 w-full rounded-2xl bg-white/5" />
        <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[#FF3B30] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Dossier introuvable</h2>
          <p className="text-white/50 mb-6">
            Le dossier demandé n'existe pas, a été supprimé, ou vous n'avez pas l'autorisation d'y accéder.
          </p>
          <Link to={createPageUrl('Claims')}>
            <GlassButton icon={null} className="">Retour aux dossiers</GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  // Security check: verify claim belongs to active garage
  if (claim.garage_id !== activeGarageId) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[#FF3B30] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Accès refusé</h2>
          <p className="text-white/50 mb-6">
            Vous n'avez pas l'autorisation d'accéder à ce dossier.
          </p>
          <Link to={createPageUrl('Claims')}>
            <GlassButton icon={null} className="">Retour aux dossiers</GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  const isDraft = claim.status === 'draft';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          to={createPageUrl('Claims')}
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux dossiers
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {claim.vehicle_data?.brand} {claim.vehicle_data?.model}
              </h1>
              <StatusBadge status={claim.status} className="" />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-white/50 flex-wrap">
              <span className="font-mono">#{claim.reference}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(claim.created_date), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {isDraft && (
              <Link to={createPageUrl(`ClaimWizard?edit=${claim.id}`)} className="flex-1 sm:flex-none">
                <GlassButton icon={Pencil} className="w-full">
                  Modifier
                </GlassButton>
              </Link>
            )}
            {isDraft && (
              <GlassButton 
                variant="danger"
                icon={Trash2}
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 sm:flex-none"
              >
                Supprimer
              </GlassButton>
            )}
            {claim.pdf_url ? (
              <GlassButton
                icon={Download}
                className="flex-1 sm:flex-none"
                disabled={isPdfLoading}
                onClick={async () => {
                  try {
                    setIsPdfLoading(true);
                    toast.info('Téléchargement du PDF...');
                    await downloadPdfFromUrl(claim.pdf_url);
                    toast.success('PDF téléchargé !');
                  } catch (err) {
                    console.error('❌ [PDF] Erreur téléchargement:', err);
                    toast.error(getFunctionErrorMessage(err, 'Erreur lors du téléchargement du PDF'));
                  } finally {
                    setIsPdfLoading(false);
                  }
                }}
              >
                {isPdfLoading ? 'Téléchargement...' : 'Télécharger PDF'}
              </GlassButton>
            ) : (
              <GlassButton 
                icon={Download}
                onClick={async () => {
                  try {
                    setIsPdfLoading(true);
                    toast.info('Génération du PDF...');
                    
                    const response = await base44.functions.invoke('generateClaimPDF', { claimId });
                    
                    if (response?.data?.error) {
                      throw new Error(response.data.error + (response.data.details ? `: ${response.data.details}` : ''));
                    }

                    if (response?.data?.success && response?.data?.pdf_url) {
                      toast.success('PDF généré avec succès');
                      queryClient.invalidateQueries({ queryKey: ['claim', claimId, activeGarageId] });
                    } else {
                      throw new Error('PDF non généré');
                    }
                  } catch (err) {
                    console.error('❌ [PDF] Erreur:', err);
                    toast.error(`Impossible de générer le PDF: ${getFunctionErrorMessage(err, 'Erreur génération PDF')}`);
                  } finally {
                    setIsPdfLoading(false);
                  }
                }}
                className="flex-1 sm:flex-none"
                disabled={isPdfLoading}
              >
                {isPdfLoading ? 'Génération...' : 'Générer PDF'}
              </GlassButton>
            )}
            <GlassButton 
              variant="secondary" 
              icon={Mail}
              onClick={sendEmail}
              disabled={!claim.client_data?.email}
              className="flex-1 sm:flex-none"
            >
              {isEmailLoading ? 'Envoi...' : 'Envoyer'}
            </GlassButton>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Info */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#007AFF]/10">
                <Car className="w-5 h-5 text-[#007AFF]" />
              </div>
              <h3 className="font-semibold text-white">Véhicule</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Marque', value: claim.vehicle_data?.brand },
                { label: 'Modèle', value: claim.vehicle_data?.model },
                { label: 'Année', value: claim.vehicle_data?.year },
                { label: 'Plaque', value: claim.vehicle_data?.plate },
                { label: 'Couleur', value: claim.vehicle_data?.color },
                { label: 'Kilométrage', value: claim.vehicle_data?.mileage ? `${claim.vehicle_data.mileage.toLocaleString()} km` : null },
              ].filter(item => item.value).map((item, i) => (
                <div key={i}>
                  <p className="text-xs text-white/40 mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-white">{item.value}</p>
                </div>
              ))}
            </div>
            {claim.vehicle_data?.vin && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/40 mb-1">N° de châssis (VIN)</p>
                <p className="text-sm font-mono text-white/70">{claim.vehicle_data.vin}</p>
              </div>
            )}
          </GlassCard>

          {/* Damages */}
          {claim.ai_report?.damages?.length > 0 && (
            <GlassCard className="overflow-hidden">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="font-semibold text-white">
                  Dommages ({claim.ai_report.damages.length})
                </h3>
                <div className="flex items-center gap-2 text-[#007AFF]">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{claim.ai_report.total_hours || 0}h estimées</span>
                </div>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {claim.ai_report.damages.map((damage, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{damage.zone}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs",
                          damage.severity === 'légère' && "bg-[#34C759]/10 text-[#34C759]",
                          damage.severity === 'moyenne' && "bg-[#FF9F0A]/10 text-[#FF9F0A]",
                          damage.severity === 'importante' && "bg-[#FF3B30]/10 text-[#FF3B30]"
                        )}>
                          {damage.severity}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white/60">
                        {damage.estimated_hours}h
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mb-2">{damage.description}</p>
                    {damage.operations?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {damage.operations.map((op, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 rounded bg-[#007AFF]/10 text-xs text-[#007AFF]"
                          >
                            {op}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Photos */}
          {claim.images?.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="font-semibold text-white mb-4">
                Photos ({claim.images.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {claim.images.map((image, index) => (
                  <a 
                    key={index}
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-[4/3] rounded-xl overflow-hidden bg-white/[0.04] hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src={image.url} 
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Client */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#34C759]/10">
                <User className="w-5 h-5 text-[#34C759]" />
              </div>
              <h3 className="font-semibold text-white">Client</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-white/40 mb-1">Nom</p>
                <p className="text-sm font-medium text-white">
                  {claim.client_data?.name || '-'}
                </p>
              </div>
              {claim.client_data?.email && (
                <div>
                  <p className="text-xs text-white/40 mb-1">Email</p>
                  <p className="text-sm text-white/70">{claim.client_data.email}</p>
                </div>
              )}
              {claim.client_data?.phone && (
                <div>
                  <p className="text-xs text-white/40 mb-1">Téléphone</p>
                  <p className="text-sm text-white/70">{claim.client_data.phone}</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Insurance */}
          {(claim.insurance_details?.company || claim.insurance_details?.claim_number) && (
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-[#FF9F0A]/10">
                  <Shield className="w-5 h-5 text-[#FF9F0A]" />
                </div>
                <h3 className="font-semibold text-white">Assurance</h3>
              </div>
              <div className="space-y-3">
                {claim.insurance_details?.company && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">Compagnie</p>
                    <p className="text-sm font-medium text-white">{claim.insurance_details.company}</p>
                  </div>
                )}
                {claim.insurance_details?.claim_number && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">N° sinistre</p>
                    <p className="text-sm text-white/70 font-mono">{claim.insurance_details.claim_number}</p>
                  </div>
                )}
                {claim.insurance_details?.accident_date && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">Date du sinistre</p>
                    <p className="text-sm text-white/70">
                      {format(new Date(claim.insurance_details.accident_date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Summary */}
          {claim.ai_report?.summary && (
            <GlassCard className="p-6 bg-[#007AFF]/5 border-[#007AFF]/20">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-[#007AFF]" />
                <h3 className="font-semibold text-white">Résumé IA</h3>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                {claim.ai_report.summary}
              </p>
            </GlassCard>
          )}

          {/* History */}
          <ClaimHistory claimId={claimId} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent className="bg-[#151921] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer le dossier ?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Cette action est irréversible. Le dossier brouillon "{claim?.vehicle_data?.brand} {claim?.vehicle_data?.model}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.08] border-white/10 text-white hover:bg-white/[0.12]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}