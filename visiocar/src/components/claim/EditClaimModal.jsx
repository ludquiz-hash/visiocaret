import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GlassInput from '@/components/ui-custom/GlassInput';
import GlassButton from '@/components/ui-custom/GlassButton';
import { Car, User, FileText } from 'lucide-react';

export default function EditClaimModal({ open, onOpenChange, claim, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_plate: '',
    client_name: '',
    reference: ''
  });

  useEffect(() => {
    if (claim) {
      setFormData({
        vehicle_brand: claim.vehicle_data?.brand || '',
        vehicle_model: claim.vehicle_data?.model || '',
        vehicle_plate: claim.vehicle_data?.plate || '',
        client_name: claim.client_data?.name || '',
        reference: claim.reference || ''
      });
    }
  }, [claim]);

  const handleSave = () => {
    if (!claim) return;
    
    const updatedData = {
      vehicle_data: {
        ...claim.vehicle_data,
        brand: formData.vehicle_brand,
        model: formData.vehicle_model,
        plate: formData.vehicle_plate
      },
      client_data: {
        ...claim.client_data,
        name: formData.client_name
      },
      reference: formData.reference
    };

    onSave(updatedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151921] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Modifier le dossier</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <GlassInput
            label="Marque du véhicule"
            icon={Car}
            value={formData.vehicle_brand}
            onChange={(e) => setFormData({ ...formData, vehicle_brand: e.target.value })}
            placeholder="Ex: Peugeot"
          />
          
          <GlassInput
            label="Modèle du véhicule"
            icon={Car}
            value={formData.vehicle_model}
            onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
            placeholder="Ex: 308"
          />
          
          <GlassInput
            label="Plaque d'immatriculation"
            icon={FileText}
            value={formData.vehicle_plate}
            onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
            placeholder="Ex: AB-123-CD"
          />
          
          <GlassInput
            label="Nom du client"
            icon={User}
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            placeholder="Ex: Jean Dupont"
          />
          
          <GlassInput
            label="Référence"
            icon={FileText}
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            placeholder="CLM-XXX"
            disabled
          />

          <div className="flex justify-end gap-3 pt-4">
            <GlassButton 
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Annuler
            </GlassButton>
            <GlassButton
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving || !formData.vehicle_brand || !formData.client_name}
            >
              Enregistrer
            </GlassButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}