import React, { useState } from 'react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassInput from '@/components/ui-custom/GlassInput';
import { 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Clock,
  CheckCircle
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function StepRedaction({ data, onNext, onBack }) {
  const [damages, setDamages] = useState(data?.ai_report?.damages || []);
  const [additionalNotes, setAdditionalNotes] = useState(
    data?.manual_adjustments?.additional_notes || ''
  );
  const [editingId, setEditingId] = useState(null);

  const totalHours = damages.reduce((sum, d) => sum + (d.estimated_hours || 0), 0);

  const updateDamage = (id, field, value) => {
    setDamages(prev => prev.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const removeDamage = (id) => {
    setDamages(prev => prev.filter(d => d.id !== id));
  };

  const addDamage = () => {
    const newDamage = {
      id: `dmg_${Date.now()}`,
      zone: 'Nouvelle zone',
      description: '',
      severity: 'moyenne',
      parts: [],
      operations: [],
      estimated_hours: 0
    };
    setDamages(prev => [...prev, newDamage]);
    setEditingId(newDamage.id);
  };

  const handleContinue = () => {
    onNext({
      ai_report: {
        ...data.ai_report,
        damages,
        total_hours: totalHours
      },
      manual_adjustments: {
        additional_notes: additionalNotes,
        adjusted_damages: damages,
        total_hours_adjusted: totalHours
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#007AFF]/10">
              <Edit3 className="w-5 h-5 text-[#007AFF]" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Rédaction du rapport</h3>
              <p className="text-xs text-white/50">
                Ajustez les dommages et le temps estimé si nécessaire
              </p>
            </div>
          </div>
        </div>

        {/* Total Time Card */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#007AFF]/10 to-[#34C759]/10 border border-[#007AFF]/20">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#007AFF]" />
            <span className="text-sm text-white/70">Temps total estimé</span>
          </div>
          <span className="text-3xl font-bold text-white">{totalHours.toFixed(1)}h</span>
        </div>
      </GlassCard>

      {/* Damages List */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="font-semibold text-white">
            Dommages ({damages.length})
          </h3>
          <GlassButton variant="secondary" size="sm" onClick={addDamage}>
            <Plus className="w-4 h-4" />
            Ajouter
          </GlassButton>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {damages.map((damage) => (
            <div 
              key={damage.id} 
              className={cn(
                "p-4 transition-colors",
                editingId === damage.id && "bg-white/[0.02]"
              )}
            >
              {editingId === damage.id ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassInput
                      label="Zone"
                      value={damage.zone}
                      onChange={(e) => updateDamage(damage.id, 'zone', e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">
                        Gravité
                      </label>
                      <select
                        value={damage.severity}
                        onChange={(e) => updateDamage(damage.id, 'severity', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#007AFF]/50"
                      >
                        <option value="légère">Légère</option>
                        <option value="moyenne">Moyenne</option>
                        <option value="importante">Importante</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={damage.description}
                      onChange={(e) => updateDamage(damage.id, 'description', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#007AFF]/50 min-h-[80px] resize-none"
                      placeholder="Décrivez le dommage..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassInput
                      label="Pièces concernées"
                      value={damage.parts?.join(', ') || ''}
                      onChange={(e) => updateDamage(damage.id, 'parts', e.target.value.split(', '))}
                      placeholder="Pare-chocs, Capot, ..."
                    />
                    <GlassInput
                      label="Temps estimé (heures)"
                      type="number"
                      step="0.5"
                      value={damage.estimated_hours}
                      onChange={(e) => updateDamage(damage.id, 'estimated_hours', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <GlassInput
                    label="Opérations"
                    value={damage.operations?.join(', ') || ''}
                    onChange={(e) => updateDamage(damage.id, 'operations', e.target.value.split(', '))}
                    placeholder="Remplacement, Peinture, Redressage, ..."
                  />

                  <div className="flex justify-end gap-2">
                    <GlassButton 
                      variant="danger" 
                      size="sm"
                      onClick={() => removeDamage(damage.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </GlassButton>
                    <GlassButton 
                      variant="success" 
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Valider
                    </GlassButton>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div 
                  className="cursor-pointer"
                  onClick={() => setEditingId(damage.id)}
                >
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
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#007AFF]">
                        {damage.estimated_hours}h
                      </span>
                      <Edit3 className="w-4 h-4 text-white/30" />
                    </div>
                  </div>
                  <p className="text-sm text-white/60 mb-2">{damage.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {damage.parts?.map((part, i) => (
                      <span 
                        key={i}
                        className="px-2 py-1 rounded-lg bg-white/[0.04] text-xs text-white/60"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {damages.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-white/40">Aucun dommage enregistré</p>
              <GlassButton variant="secondary" size="sm" className="mt-4" onClick={addDamage}>
                <Plus className="w-4 h-4" />
                Ajouter un dommage
              </GlassButton>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Additional Notes */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[#FF9F0A]/10">
            <FileText className="w-5 h-5 text-[#FF9F0A]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Notes additionnelles</h3>
            <p className="text-xs text-white/50">
              Ajoutez des remarques ou observations supplémentaires
            </p>
          </div>
        </div>
        
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#007AFF]/50 min-h-[120px] resize-none"
          placeholder="Notes complémentaires pour le rapport..."
        />
      </GlassCard>

      {/* Navigation */}
      <div className="flex justify-between">
        <GlassButton variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Retour
        </GlassButton>
        <GlassButton onClick={handleContinue}>
          Générer le PDF
          <ArrowRight className="w-5 h-5" />
        </GlassButton>
      </div>
    </div>
  );
}