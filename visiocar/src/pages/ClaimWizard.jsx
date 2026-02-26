import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { resolveActiveGarageId } from '@/components/utils/garageUtils';
import { isDevMode } from '@/components/utils/dev';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassCard from '@/components/ui-custom/GlassCard';
import StepIndicator from '@/components/ui-custom/StepIndicator';
import StepIdentification from '@/components/wizard/StepIdentification';
import StepPhotos from '@/components/wizard/StepPhotos';
import StepAnalysis from '@/components/wizard/StepAnalysis';
import StepRedaction from '@/components/wizard/StepRedaction';
import StepPDF from '@/components/wizard/StepPDF';
import PaywallModal from '@/components/layout/PaywallModal';
import { toast } from 'sonner';

const WIZARD_STEPS = [
  { id: 'identification', title: 'Identification', description: 'Client & véhicule' },
  { id: 'photos', title: 'Photos', description: 'Images du sinistre' },
  { id: 'analysis', title: 'Analyse assistée', description: 'Saisie guidée des dégâts' },
  { id: 'redaction', title: 'Rédaction', description: 'Ajustements' },
  { id: 'pdf', title: 'Finalisation', description: 'Rapport PDF' },
];

export default function ClaimWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [claimId, setClaimId] = useState(null);
  const [claimData, setClaimData] = useState({});
  const [showPaywall, setShowPaywall] = useState(false);

  // Check if editing existing claim
  const urlParams = new URLSearchParams(window.location.search);
  const editClaimId = urlParams.get('edit');

  // Get current user
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

  // Get user's garage membership (for role checks)
  const { data: membership } = useQuery({
    queryKey: ['userMembership', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const memberships = await base44.entities.GarageMember.filter({ user_email: user.email });
      return memberships[0] || null;
    },
    enabled: !!user?.email,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Get garage
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

  // Load existing claim if editing - MUST filter by id AND garage_id
  const { data: existingClaim, isLoading: isLoadingClaim } = useQuery({
    queryKey: ['claim', editClaimId, activeGarageId],
    queryFn: async () => {
      if (!editClaimId || !activeGarageId) return null;
      
      if (isDevMode()) {
        console.debug('[ClaimWizard] Loading claim for edit:', { editClaimId, activeGarageId });
      }
      
      // CRITICAL: Filter by both id AND garage_id for security
      const claims = await base44.entities.Claim.filter({ 
        id: editClaimId,
        garage_id: activeGarageId 
      });
      
      const loadedClaim = claims[0] || null;
      
      if (isDevMode()) {
        console.debug('[ClaimWizard] Claim loaded for edit:', {
          editClaimId,
          activeGarageId,
          claimGarageId: loadedClaim?.garage_id,
          status: loadedClaim?.status,
          found: !!loadedClaim
        });
      }
      
      return loadedClaim;
    },
    enabled: !!editClaimId && !!activeGarageId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Initialize claimId and claimData when editing
  useEffect(() => {
    if (existingClaim) {
      // Security check: verify claim belongs to active garage
      if (existingClaim.garage_id !== activeGarageId) {
        toast.error('❌ Vous n\'avez pas l\'autorisation de modifier ce dossier');
        navigate(createPageUrl('Claims'));
        return;
      }
      
      setClaimId(existingClaim.id);
      setClaimData(existingClaim);
      
      if (isDevMode()) {
        console.debug('[ClaimWizard] Claim initialized for edit:', {
          claimId: existingClaim.id,
          garageId: activeGarageId,
          status: existingClaim.status
        });
      }
    }
  }, [existingClaim, activeGarageId, navigate]);

  // Get usage counter
  const now = new Date();
  const { data: usageCounter } = useQuery({
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
    initialData: { claims_created: 0 },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Check limits - BLOQUER la création si limite atteinte
  useEffect(() => {
    if (garage && usageCounter && !editClaimId) { // Ne pas bloquer en mode édition
      const claimsCreated = usageCounter.claims_created || 0;
      const isTrialing = !garage.is_subscribed;
      const trialEndsAt = garage.trial_ends_at ? new Date(garage.trial_ends_at) : null;
      const isTrialExpired = isTrialing && trialEndsAt && trialEndsAt < new Date();
      const isStarter = garage.is_subscribed && garage.plan_type === 'starter';
      const hasReachedLimit = claimsCreated >= 15;

      // Essai gratuit : limité à 15 dossiers + blocage si période expirée
      if (isTrialing) {
        if (isTrialExpired || hasReachedLimit) {
          const reasonText = isTrialExpired
            ? 'Période d\'essai terminée.'
            : `Limite atteinte (${claimsCreated}/15 dossiers).`;

          toast.error(
            `${reasonText} Souscrivez au plan Starter (69€) ou Business (199€) pour continuer.`
          );
          setShowPaywall(true);
          return;
        }
      }

      // Plan Starter : 15 dossiers / mois
      if (isStarter && hasReachedLimit) {
        toast.error('Limite mensuelle atteinte (15 dossiers). Passez au plan Business pour un accès illimité.');
        setShowPaywall(true);
        return;
      }
    }
  }, [garage, usageCounter, editClaimId]);

  // Create/Update claim mutation
  const saveClaim = useMutation({
    mutationFn: async (data) => {
      // CRITICAL: Block if no activeGarageId
      if (!activeGarageId) {
        throw new Error('Aucun garage actif. Veuillez rafraîchir la page.');
      }

      // SÉCURITÉ: Bloquer la création si limite atteinte
      if (!claimId) { // Uniquement pour CREATE, pas UPDATE
        const claimsCreated = usageCounter?.claims_created || 0;
        const isTrialing = !garage?.is_subscribed;
        const trialEndsAt = garage?.trial_ends_at ? new Date(garage.trial_ends_at) : null;
        const isTrialExpired = isTrialing && trialEndsAt && trialEndsAt < new Date();
        const isStarter = garage?.is_subscribed && garage?.plan_type === 'starter';
        const hasReachedLimit = claimsCreated >= 15;

        // Essai gratuit : max 15 dossiers + blocage si période expirée
        if (isTrialing && (isTrialExpired || hasReachedLimit)) {
          if (isTrialExpired) {
            throw new Error('Période d\'essai terminée. Veuillez souscrire au plan Starter (69€) ou Business (199€).');
          }
          throw new Error('Limite de 15 dossiers atteinte pendant la période d\'essai. Passez à un plan payant pour continuer.');
        }

        // Plan Starter : 15 dossiers / mois
        if (isStarter && hasReachedLimit) {
          throw new Error('Limite mensuelle atteinte (15 dossiers). Passez au plan Business pour des dossiers illimités.');
        }
      }

      if (claimId) {
        // UPDATE existing claim
        // CRITICAL: Verify claim belongs to active garage before update
        let existing = existingClaim;
        if (!existing || !existing.id) {
          const claims = await base44.entities.Claim.filter({ 
            id: claimId,
            garage_id: activeGarageId 
          });
          existing = claims[0] || null;
        }
        
        if (!existing || !existing.id) {
          throw new Error('Dossier introuvable ou vous n\'avez pas l\'autorisation de le modifier');
        }
        
        if (existing.garage_id !== activeGarageId) {
          throw new Error('Vous n\'avez pas l\'autorisation de modifier ce dossier');
        }

        if (isDevMode()) {
          console.debug('[ClaimWizard] Updating claim:', {
            garageId: activeGarageId,
            claimId: claimId,
            claimGarageId: existing.garage_id,
            status: existing.status,
            action: 'update'
          });
        }

        // Ensure garage_id is preserved in update data (required for RLS)
        const updateData = {
          ...(typeof data === 'object' && data !== null ? data : {}),
          garage_id: activeGarageId
        };

        const updated = await base44.entities.Claim.update(claimId, updateData);
        return updated;
      } else {
        // CREATE new claim
        const garageId = activeGarageId;

        const reference = `CLM-${Date.now().toString(36).toUpperCase()}`;
        const newClaim = await base44.entities.Claim.create({
          ...(typeof data === 'object' && data !== null ? data : {}),
          garage_id: garageId,
          reference,
          status: 'draft'
        });
        
        // Update usage counter - only for CREATE, not UPDATE
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        if (usageCounter?.id) {
          await base44.entities.UsageCounter.update(usageCounter.id, {
            claims_created: (usageCounter.claims_created || 0) + 1
          });
        } else {
          await base44.entities.UsageCounter.create({
            garage_id: garageId,
            year: currentYear,
            month: currentMonth,
            claims_created: 1
          });
        }
        
        return newClaim;
      }
    },
    onSuccess: (data) => {
      if (!claimId && data?.id) {
        setClaimId(data.id);
      }
      
      // Invalidate queries with proper keys including activeGarageId
      queryClient.invalidateQueries({ queryKey: ['claims', activeGarageId] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      if (claimId || data?.id) {
        const idToInvalidate = claimId || data.id;
        // CRITICAL: Include activeGarageId in claim detail query key
        queryClient.invalidateQueries({ queryKey: ['claim', idToInvalidate, activeGarageId] });
        queryClient.invalidateQueries({ queryKey: ['claim', idToInvalidate] });
      }
      // CRITICAL: Invalidate usage counter with full key (year/month)
      const now = new Date();
      queryClient.invalidateQueries({ queryKey: ['usageCounter', activeGarageId, now.getFullYear(), now.getMonth() + 1] });
      queryClient.invalidateQueries({ queryKey: ['usageCounter', activeGarageId] });
      queryClient.invalidateQueries({ queryKey: ['usageCounter'] });
      
      // Show success toast
      if (claimId) {
        toast.success('Dossier modifié avec succès');
      } else {
        toast.success('Dossier créé avec succès');
      }
      
      if (isDevMode()) {
        console.debug('[ClaimWizard] Claim saved successfully:', {
          claimId: data.id,
          garageId: activeGarageId,
          isUpdate: !!claimId
        });
      }
    },
    onError: (error) => {
      const errorMessage = error.message || error.toString() || 'Erreur lors de l\'enregistrement';
      toast.error(`❌ ${errorMessage}`);
      
      if (isDevMode()) {
        console.error('[ClaimWizard] Save error:', {
          error,
          message: error.message,
          stack: error.stack,
          garageId: activeGarageId,
          claimId: claimId
        });
      }
    }
  });

  const handleStepComplete = async (stepData) => {
    const newData = { ...claimData, ...stepData };
    setClaimData(newData);

    // Save to database
    await saveClaim.mutateAsync(newData);

    // Move to next step
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = (pdfUrl) => {
    // pdfUrl is optional, passed by StepPDF but not required
    queryClient.invalidateQueries({ queryKey: ['claims', activeGarageId] });
    if (claimId) {
      // CRITICAL: Include activeGarageId in claim detail query key
      queryClient.invalidateQueries({ queryKey: ['claim', claimId, activeGarageId] });
      queryClient.invalidateQueries({ queryKey: ['claim', claimId] });
    }
    toast.success('Dossier finalisé avec succès !');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepIdentification 
            data={claimData} 
            onNext={handleStepComplete} 
          />
        );
      case 1:
        return (
          <StepPhotos 
            data={claimData} 
            onNext={handleStepComplete}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <StepAnalysis 
            data={claimData} 
            onNext={handleStepComplete}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <StepRedaction 
            data={claimData} 
            onNext={handleStepComplete}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <StepPDF 
            data={claimData}
            claimId={claimId}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  // Calculate trial days
  const getDaysRemaining = () => {
    if (!garage?.trial_ends_at) return 5;
    const trialEnd = new Date(garage.trial_ends_at);
    const now = new Date();
    const diffMs = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Show loading while resolving activeGarageId or loading existing claim
  if (!activeGarageId || (editClaimId && isLoadingClaim)) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-[#007AFF] animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Show error if editing but claim not found or doesn't belong to garage (only after loading finishes)
  if (editClaimId && !isLoadingClaim && !existingClaim) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[#FF3B30] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Dossier introuvable</h2>
          <p className="text-white/50 mb-6">
            Le dossier demandé n'existe pas ou vous n'avez pas l'autorisation de le modifier.
          </p>
          <Link to={createPageUrl('Claims')}>
            <GlassButton icon={null} className="">Retour aux dossiers</GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to={createPageUrl('Claims')}
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux dossiers
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {editClaimId ? 'Modifier le dossier' : 'Nouveau dossier d\'expertise'}
        </h1>
        <p className="text-white/50 mt-1">
          {editClaimId ? 'Modifiez les informations du dossier' : 'Créez un rapport complet en quelques minutes'}
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator 
        steps={WIZARD_STEPS} 
        currentStep={currentStep} 
        className="mb-8"
      />

      {/* Step Content */}
      {renderStep()}

      {/* Paywall */}
      <PaywallModal 
        isOpen={showPaywall}
        daysRemaining={getDaysRemaining()}
        onClose={!garage?.is_subscribed && getDaysRemaining() > 0 ? () => setShowPaywall(false) : undefined}
      />
    </div>
  );
}