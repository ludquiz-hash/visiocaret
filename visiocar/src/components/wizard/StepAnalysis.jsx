import React, { useState, useMemo } from 'react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  ListChecks,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Zones du véhicule
const ZONES_VEHICULE = {
  Avant: [
    'Pare-chocs avant',
    'Capot',
    'Aile avant gauche',
    'Aile avant droite',
    'Phare avant gauche',
    'Phare avant droit',
    'Calandre',
    'Pare-brise',
  ],
  'Latéral gauche': [
    'Porte avant gauche',
    'Porte arrière gauche',
    'Bas de caisse gauche',
    'Rétroviseur gauche',
  ],
  'Latéral droit': [
    'Porte avant droite',
    'Porte arrière droite',
    'Bas de caisse droit',
    'Rétroviseur droit',
  ],
  Arrière: [
    'Pare-chocs arrière',
    'Hayon/Coffre',
    'Aile arrière gauche',
    'Aile arrière droite',
    'Feu arrière gauche',
    'Feu arrière droit',
    'Lunette arrière',
  ],
  Autre: ['Toit', 'Plancher', 'Élément mécanique', 'Autre (préciser)'],
};

const TYPES_DOMMAGE = [
  'Rayure légère',
  'Rayure profonde',
  'Enfoncement léger',
  'Enfoncement important',
  'Bris/Fissure',
  'Déchirure',
  'Corrosion',
  'Décollement',
  'Pièce manquante',
  'Dommages multiples',
];

const OPERATIONS = [
  { label: 'Polissage', tempsStandard: 0.5 },
  { label: 'Retouche peinture', tempsStandard: 1 },
  { label: 'Ponçage', tempsStandard: 1 },
  { label: 'Masticage', tempsStandard: 0.5 },
  { label: 'Apprêt', tempsStandard: 0.5 },
  { label: 'Peinture', tempsStandard: 2 },
  { label: 'Vernis', tempsStandard: 1 },
  { label: 'Débosselage sans peinture', tempsStandard: 1.5 },
  { label: 'Débosselage', tempsStandard: 3 },
  { label: 'Redressage', tempsStandard: 4 },
  { label: 'Remplacement élément', tempsStandard: 2 },
  { label: 'Remplacement vitre', tempsStandard: 1 },
  { label: 'Remplacement optique', tempsStandard: 0.5 },
  { label: 'Collage pare-brise', tempsStandard: 2 },
  { label: 'Soudure + peinture', tempsStandard: 6 },
  { label: 'Traitement antirouille', tempsStandard: 2 },
];

// Templates de suggestions
const TEMPLATES = {
  'Pare-chocs avant + Enfoncement important': {
    description:
      "Enfoncement du pare-chocs avant avec bris de peinture. Déformation marquée nécessitant un remplacement complet de l'élément.",
    operations: ['Remplacement élément', 'Peinture'],
    tempsStandard: 3.5,
  },
  'Porte avant gauche + Rayure profonde': {
    description:
      "Rayure profonde sur porte avant gauche atteignant l'apprêt. Prévoir ponçage, masticage et cycle complet de peinture.",
    operations: ['Ponçage', 'Masticage', 'Apprêt', 'Peinture', 'Vernis'],
    tempsStandard: 5,
  },
  'Capot + Enfoncement léger': {
    description:
      'Enfoncement léger du capot sans atteinte majeure de la peinture. Réparable par débosselage sans peinture et polissage.',
    operations: ['Débosselage sans peinture', 'Polissage'],
    tempsStandard: 2,
  },
};

const EMPTY_ZONE = {
  id: '',
  zone: '',
  typeDommage: '',
  description: '',
  operations: [],
  tempsEstime: 0,
};

export default function StepAnalysis({ data, onNext, onBack }) {
  const initialZones = data?.analysis_assistee?.zones || [];
  const [zones, setZones] = useState(initialZones);
  const [currentZone, setCurrentZone] = useState(EMPTY_ZONE);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  const tempsTotal = useMemo(
    () => zones.reduce((sum, z) => sum + (Number(z.tempsEstime) || 0), 0),
    [zones]
  );

  const calculateTimeFromOperations = (selectedOps) =>
    selectedOps.reduce((total, opLabel) => {
      const op = OPERATIONS.find((o) => o.label === opLabel);
      return total + (op?.tempsStandard || 0);
    }, 0);

  const updateSuggestion = (zoneLabel, typeLabel) => {
    if (!zoneLabel || !typeLabel) {
      setSuggestion(null);
      return;
    }
    const key = `${zoneLabel} + ${typeLabel}`;
    setSuggestion(TEMPLATES[key] || null);
  };

  const handleFieldChange = (field, value) => {
    setCurrentZone((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'zone' || field === 'typeDommage') {
        updateSuggestion(
          field === 'zone' ? value : prev.zone,
          field === 'typeDommage' ? value : prev.typeDommage
        );
      }
      return updated;
    });
  };

  const handleOperationToggle = (label) => {
    setCurrentZone((prev) => {
      const already = prev.operations.includes(label);
      const operations = already
        ? prev.operations.filter((op) => op !== label)
        : [...prev.operations, label];
      const tempsEstime = calculateTimeFromOperations(operations);
      return { ...prev, operations, tempsEstime };
    });
  };

  const handleApplySuggestion = () => {
    if (!suggestion) return;
    setCurrentZone((prev) => ({
      ...prev,
      description: suggestion.description,
      operations: suggestion.operations,
      tempsEstime: suggestion.tempsStandard,
    }));
  };

  const validateCurrentZone = () => {
    if (!currentZone.zone || !currentZone.typeDommage || !currentZone.description) {
      setFormError(
        'Veuillez renseigner au minimum la zone impactée, le type de dommage et la description détaillée.'
      );
      return false;
    }
    setFormError(null);
    return true;
  };

  const resetForm = () => {
    setCurrentZone(EMPTY_ZONE);
    setIsEditing(false);
    setEditingId(null);
    setSuggestion(null);
  };

  const handleAddOrUpdateZone = () => {
    if (!validateCurrentZone()) return;

    if (isEditing && editingId) {
      setZones((prev) =>
        prev.map((z) => (z.id === editingId ? { ...currentZone, id: editingId } : z))
      );
    } else {
      const id = `zone_${Date.now()}`;
      setZones((prev) => [...prev, { ...currentZone, id }]);
    }

    resetForm();
  };

  const handleEditZone = (zone) => {
    setCurrentZone(zone);
    setIsEditing(true);
    setEditingId(zone.id);
    updateSuggestion(zone.zone, zone.typeDommage);
  };

  const handleDeleteZone = (id) => {
    if (window.confirm('Supprimer cette zone endommagée ?')) {
      setZones((prev) => prev.filter((z) => z.id !== id));
    }
  };

  const handleContinue = () => {
    if (zones.length === 0) {
      setFormError('Veuillez renseigner au moins une zone endommagée avant de continuer.');
      return;
    }

    const analysis_assistee = {
      zones,
      tempsTotal,
      statut: 'complete',
    };

    onNext({ analysis_assistee });
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <GlassCard className="p-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#007AFF]/10 mt-0.5">
            <ListChecks className="w-5 h-5 text-[#007AFF]" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm md:text-base">
              Analyse assistée des dégâts
            </h3>
            <p className="text-xs md:text-sm text-white/60 mt-1">
              L’analyse IA automatique est désactivée. Vous saisissez manuellement les dégâts, de façon
              structurée et professionnelle.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Formulaire zone */}
      <GlassCard className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-white text-sm md:text-base">
              {isEditing ? 'Modifier une zone endommagée' : 'Ajouter une zone endommagée'}
            </h3>
            <p className="text-xs text-white/50 mt-1">
              Décrivez une zone à la fois. Vous pourrez en ajouter plusieurs.
            </p>
          </div>
          {zones.length > 0 && (
            <span className="text-xs text-white/50">
              {zones.length} zone{zones.length > 1 ? 's' : ''} renseignée
            </span>
          )}
        </div>

        {/* Zone impactée */}
        <div className="space-y-1">
          <label className="text-xs text-white/60">Zone impactée *</label>
          <select
            value={currentZone.zone}
            onChange={(e) => handleFieldChange('zone', e.target.value)}
            className="w-full rounded-xl bg-white/[0.02] border border-white/[0.08] text-sm text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
          >
            <option value="">Sélectionner...</option>
            {Object.entries(ZONES_VEHICULE).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Type de dommage */}
        <div className="space-y-1">
          <label className="text-xs text-white/60">Type de dommage *</label>
          <select
            value={currentZone.typeDommage}
            onChange={(e) => handleFieldChange('typeDommage', e.target.value)}
            className="w-full rounded-xl bg-white/[0.02] border border-white/[0.08] text-sm text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
          >
            <option value="">Sélectionner...</option>
            {TYPES_DOMMAGE.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Suggestion */}
        {suggestion && (
          <div className="rounded-xl border border-[#007AFF]/25 bg-[#007AFF]/10 px-3 py-3 text-xs text-white/80 space-y-2">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-[#34C759]" />
              <span className="font-medium text-white text-xs">
                Suggestion basée sur des cas similaires
              </span>
            </div>
            <p className="text-[11px] text-white/70">{suggestion.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestion.operations.map((op) => (
                <span
                  key={op}
                  className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] text-white/80"
                >
                  {op}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded-full bg-[#34C759]/15 text-[10px] text-[#34C759]">
                Temps standard : {suggestion.tempsStandard}h
              </span>
            </div>
            <button
              type="button"
              onClick={handleApplySuggestion}
              className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/[0.08] px-2 py-1 text-[10px] text-white hover:bg-white/[0.12]"
            >
              <Plus className="w-3 h-3" />
              Utiliser cette suggestion (modifiable)
            </button>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs text-white/60">Description détaillée *</label>
          <textarea
            value={currentZone.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-white/[0.02] border border-white/[0.08] text-sm text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#007AFF] resize-y"
            placeholder="Décrivez précisément les dégâts observés : localisation exacte, nature du choc, état de la peinture, éléments annexes touchés..."
          />
        </div>

        {/* Opérations */}
        <div className="space-y-2">
          <label className="text-xs text-white/60">Opérations nécessaires</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {OPERATIONS.map((op) => {
              const selected = currentZone.operations.includes(op.label);
              return (
                <button
                  key={op.label}
                  type="button"
                  onClick={() => handleOperationToggle(op.label)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-[11px]',
                    selected
                      ? 'border-[#007AFF]/60 bg-[#007AFF]/15 text-[#E5F0FF]'
                      : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                  )}
                >
                  <span className="truncate">{op.label}</span>
                  <span className="text-[10px] text-white/40">{op.tempsStandard}h</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Temps estimé */}
        <div className="space-y-1">
          <label className="text-xs text-white/60">Temps estimé (heures)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="0"
              value={currentZone.tempsEstime || ''}
              onChange={(e) =>
                setCurrentZone((prev) => ({
                  ...prev,
                  tempsEstime: parseFloat(e.target.value || '0'),
                }))
              }
              className="w-24 rounded-xl bg-white/[0.02] border border-white/[0.08] text-sm text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
            <span className="text-xs text-white/40">
              Calcul automatique selon les opérations (modifiable manuellement).
            </span>
          </div>
        </div>

        {/* Erreur local */}
        {formError && (
          <div className="flex items-center gap-2 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/25 px-3 py-2 text-xs text-[#FF3B30]">
            <AlertCircle className="w-3 h-3" />
            <span>{formError}</span>
          </div>
        )}

        {/* Actions formulaire */}
        <div className="flex justify-end gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.06]"
            >
              Annuler la modification
            </button>
          )}
          <GlassButton onClick={handleAddOrUpdateZone}>
            {isEditing ? (
              <>
                <Edit3 className="w-4 h-4" />
                Mettre à jour la zone
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Ajouter cette zone
              </>
            )}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Récap des zones */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#34C759]" />
            <h3 className="text-sm font-medium text-white">
              Zones endommagées ({zones.length})
            </h3>
          </div>
          <span className="text-xs text-white/60">
            Temps total estimé :{' '}
            <span className="font-semibold text-white">{tempsTotal.toFixed(1)}h</span>
          </span>
        </div>

        {zones.length === 0 ? (
          <p className="text-xs text-white/40">
            Aucune zone renseignée pour le moment. Ajoutez au moins une zone avant de continuer.
          </p>
        ) : (
          <div className="space-y-3">
            {zones.map((z, idx) => (
              <div
                key={z.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.01] px-3 py-3 flex flex-col gap-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/40">#{idx + 1}</span>
                      <span className="text-sm font-medium text-white truncate">{z.zone}</span>
                    </div>
                    <span className="text-[11px] text-white/50">{z.typeDommage}</span>
                  </div>
                  <span className="text-xs font-medium text-[#007AFF] shrink-0">
                    {Number(z.tempsEstime || 0).toFixed(1)}h
                  </span>
                </div>
                <p className="text-[11px] text-white/60 mt-1 line-clamp-3">{z.description}</p>
                {z.operations?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {z.operations.map((op) => (
                      <span
                        key={op}
                        className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] text-white/70"
                      >
                        {op}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditZone(z)}
                    className="inline-flex items-center gap-1 rounded-full bg白/[0.06] px-2 py-1 text-[10px] text-white/70 hover:bg-white/[0.1]"
                  >
                    <Edit3 className="w-3 h-3" />
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteZone(z.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#FF3B30]/10 px-2 py-1 text-[10px] text-[#FF3B30] hover:bg-[#FF3B30]/20"
                  >
                    <Trash2 className="w-3 h-3" />
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Navigation */}
      <div className="flex justify-between">
        <GlassButton variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Retour
        </GlassButton>
        <GlassButton onClick={handleContinue} disabled={zones.length === 0}>
          Continuer vers la rédaction
          <ArrowRight className="w-5 h-5" />
        </GlassButton>
      </div>
    </div>
  );
}

