import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { claimsApi } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassCard from '@/components/ui-custom/GlassCard';
import StepIndicator from '@/components/ui-custom/StepIndicator';
import { toast } from 'sonner';

const WIZARD_STEPS = [
  { id: 'identification', title: 'Identification', description: 'Client & véhicule' },
  { id: 'photos', title: 'Photos', description: 'Images du sinistre' },
  { id: 'analysis', title: 'Analyse', description: 'Description des dégâts' },
  { id: 'redaction', title: 'Rédaction', description: 'Notes expert' },
  { id: 'pdf', title: 'Finalisation', description: 'Rapport PDF' },
];

// Simple step components
const StepIdentification = ({ data, onUpdate }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white">Informations client</h3>
    <div className="grid md:grid-cols-2 gap-4">
      <input
        type="text"
        placeholder="Nom du client"
        value={data.client_name || ''}
        onChange={(e) => onUpdate({ client_name: e.target.value })}
        className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30"
      />
      <input
        type="email"
        placeholder="Email"
        value={data.client_email || ''}
        onChange={(e) => onUpdate({ client_email: e.target.value })}
        className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30"
      />
    </div>
    <h3 className="text-lg font-semibold text-white mt-6">Véhicule</h3>
    <div className="grid md:grid-cols-2 gap-4">
      <input
        type="text"
        placeholder="Marque"
        value={data.vehicle_brand || ''}
        onChange={(e) => onUpdate({ vehicle_brand: e.target.value })}
        className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30"
      />
      <input
        type="text"
        placeholder="Modèle"
        value={data.vehicle_model || ''}
        onChange={(e) => onUpdate({ vehicle_model: e.target.value })}
        className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30"
      />
      <input
        type="text"
        placeholder="Immatriculation"
        value={data.vehicle_license_plate || ''}
        onChange={(e) => onUpdate({ vehicle_license_plate: e.target.value })}
        className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30"
      />
      <input
        type="text"
        placeholder="Année"
        value={data.vehicle_year || ''}
        onChange={(e) => onUpdate({ vehicle_year: e.target.value })}
        className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30"
      />
    </div>
  </div>
);

const StepPhotos = ({ data, onUpdate }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white">Photos du sinistre</h3>
    <p className="text-white/50">Fonctionnalité de upload à implémenter</p>
  </div>
);

const StepAnalysis = ({ data, onUpdate }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white">Description des dommages</h3>
    <textarea
      placeholder="Décrivez les dommages observés..."
      value={data.damage_description || ''}
      onChange={(e) => onUpdate({ damage_description: e.target.value })}
      rows={6}
      className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30"
    />
  </div>
);

const StepRedaction = ({ data, onUpdate }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white">Notes de l'expert</h3>
    <textarea
      placeholder="Vos observations et recommandations..."
      value={data.expert_notes || ''}
      onChange={(e) => onUpdate({ expert_notes: e.target.value })}
      rows={6}
      className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30"
    />
    <div>
      <label className="text-sm text-white/60 mb-2 block">Estimation réparation (€)</label>
      <input
        type="text"
        placeholder="0.00"
        value={data.estimated_repair_cost || ''}
        onChange={(e) => onUpdate({ estimated_repair_cost: e.target.value })}
        className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30"
      />
    </div>
  </div>
);

const StepPDF = ({ claimId }) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const { blob } = await claimsApi.generatePDF(claimId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${claimId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF généré avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center mx-auto">
        <span className="text-4xl">📄</span>
      </div>
      <h3 className="text-xl font-semibold text-white">Rapport prêt !</h3>
      <p className="text-white/50">
        Votre dossier est complet. Générez le rapport PDF final.
      </p>
      <GlassButton 
        onClick={handleGeneratePDF}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Génération...
          </>
        ) : (
          'Télécharger le PDF'
        )}
      </GlassButton>
      <div>
        <button 
          onClick={() => navigate(createPageUrl('Claims'))}
          className="text-[#007AFF] hover:underline"
        >
          Retour aux dossiers
        </button>
      </div>
    </div>
  );
};

export default function ClaimWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [claimId, setClaimId] = useState(null);
  const [claimData, setClaimData] = useState({});

  // Check if editing existing claim
  const urlParams = new URLSearchParams(window.location.search);
  const editClaimId = urlParams.get('id');

  // Load existing claim if editing
  const { data: existingClaim, isLoading: isLoadingClaim } = useQuery({
    queryKey: ['claim', editClaimId],
    queryFn: () => claimsApi.get(editClaimId),
    enabled: !!editClaimId && !!user,
  });

  useEffect(() => {
    if (existingClaim) {
      setClaimId(existingClaim.id);
      setClaimData(existingClaim);
    }
  }, [existingClaim]);

  // Create/update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (claimId) {
        return claimsApi.update(claimId, claimData);
      } else {
        return claimsApi.create(claimData);
      }
    },
    onSuccess: (result) => {
      if (!claimId && result?.id) {
        setClaimId(result.id);
      }
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast.success(claimId ? 'Dossier mis à jour' : 'Dossier créé');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  });

  const handleNext = async () => {
    // Save current step
    await saveMutation.mutateAsync();
    
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateClaimData = (newData) => {
    setClaimData(prev => ({ ...prev, ...newData }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepIdentification data={claimData} onUpdate={updateClaimData} />;
      case 1:
        return <StepPhotos data={claimData} onUpdate={updateClaimData} />;
      case 2:
        return <StepAnalysis data={claimData} onUpdate={updateClaimData} />;
      case 3:
        return <StepRedaction data={claimData} onUpdate={updateClaimData} />;
      case 4:
        return <StepPDF claimId={claimId} />;
      default:
        return null;
    }
  };

  if (isLoadingClaim) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to={createPageUrl('Claims')}>
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {editClaimId ? 'Modifier le dossier' : 'Nouveau dossier'}
          </h1>
          <p className="text-white/50 text-sm">
            Étape {currentStep + 1} sur {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep].title}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={WIZARD_STEPS} currentStep={currentStep} />

      {/* Step Content */}
      <GlassCard className="p-6 mb-6">
        {renderStep()}
      </GlassCard>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <GlassButton
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Précédent
        </GlassButton>

        {currentStep < WIZARD_STEPS.length - 1 ? (
          <GlassButton 
            onClick={handleNext}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              'Suivant'
            )}
          </GlassButton>
        ) : (
          <GlassButton onClick={() => navigate(createPageUrl('Claims'))}>
            Terminer
          </GlassButton>
        )}
      </div>
    </div>
  );
}
