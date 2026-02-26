import React from 'react';
import { useForm } from 'react-hook-form';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassInput from '@/components/ui-custom/GlassInput';
import GlassSelect from '@/components/ui-custom/GlassSelect';
import GlassButton from '@/components/ui-custom/GlassButton';
import { User, Car, Shield, ArrowRight, Building2 } from 'lucide-react';

const carBrands = [
  { value: 'audi', label: 'Audi' },
  { value: 'bmw', label: 'BMW' },
  { value: 'citroen', label: 'Citroën' },
  { value: 'dacia', label: 'Dacia' },
  { value: 'fiat', label: 'Fiat' },
  { value: 'ford', label: 'Ford' },
  { value: 'honda', label: 'Honda' },
  { value: 'hyundai', label: 'Hyundai' },
  { value: 'kia', label: 'Kia' },
  { value: 'mazda', label: 'Mazda' },
  { value: 'mercedes', label: 'Mercedes-Benz' },
  { value: 'nissan', label: 'Nissan' },
  { value: 'opel', label: 'Opel' },
  { value: 'peugeot', label: 'Peugeot' },
  { value: 'porsche', label: 'Porsche' },
  { value: 'renault', label: 'Renault' },
  { value: 'seat', label: 'Seat' },
  { value: 'skoda', label: 'Škoda' },
  { value: 'toyota', label: 'Toyota' },
  { value: 'volkswagen', label: 'Volkswagen' },
  { value: 'volvo', label: 'Volvo' },
  { value: 'other', label: 'Autre' },
];

const insurers = [
  { value: 'axa', label: 'AXA' },
  { value: 'allianz', label: 'Allianz' },
  { value: 'ethias', label: 'Ethias' },
  { value: 'ag', label: 'AG Insurance' },
  { value: 'belfius', label: 'Belfius' },
  { value: 'groupama', label: 'Groupama' },
  { value: 'swiss_life', label: 'Swiss Life' },
  { value: 'zurich', label: 'Zurich' },
  { value: 'mobiliere', label: 'La Mobilière' },
  { value: 'vaudoise', label: 'Vaudoise' },
  { value: 'other', label: 'Autre' },
];

export default function StepIdentification({ data, onNext }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      client_name: data?.client_data?.name || '',
      client_email: data?.client_data?.email || '',
      client_phone: data?.client_data?.phone || '',
      vehicle_brand: data?.vehicle_data?.brand || '',
      vehicle_model: data?.vehicle_data?.model || '',
      vehicle_year: data?.vehicle_data?.year || '',
      vehicle_plate: data?.vehicle_data?.plate || '',
      vehicle_vin: data?.vehicle_data?.vin || '',
      vehicle_color: data?.vehicle_data?.color || '',
      vehicle_mileage: data?.vehicle_data?.mileage || '',
      insurance_company: data?.insurance_details?.company || '',
      insurance_policy: data?.insurance_details?.policy_number || '',
      insurance_claim: data?.insurance_details?.claim_number || '',
      accident_date: data?.insurance_details?.accident_date || '',
      accident_description: data?.insurance_details?.accident_description || '',
    }
  });

  const onSubmit = (formData) => {
    const claimData = {
      client_data: {
        name: formData.client_name,
        email: formData.client_email,
        phone: formData.client_phone,
      },
      vehicle_data: {
        brand: formData.vehicle_brand,
        model: formData.vehicle_model,
        year: parseInt(formData.vehicle_year) || null,
        plate: formData.vehicle_plate,
        vin: formData.vehicle_vin,
        color: formData.vehicle_color,
        mileage: parseInt(formData.vehicle_mileage) || null,
      },
      insurance_details: {
        company: formData.insurance_company,
        policy_number: formData.insurance_policy,
        claim_number: formData.insurance_claim,
        accident_date: formData.accident_date,
        accident_description: formData.accident_description,
      },
    };
    onNext(claimData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Client Info */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#007AFF]/10">
            <User className="w-5 h-5 text-[#007AFF]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Informations client</h3>
            <p className="text-xs text-white/50">Coordonnées du propriétaire du véhicule</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassInput
            label="Nom complet *"
            placeholder="Jean Dupont"
            {...register('client_name', { required: 'Nom requis' })}
            error={errors.client_name?.message}
          />
          <GlassInput
            label="Email"
            type="email"
            placeholder="jean@email.com"
            {...register('client_email')}
          />
          <GlassInput
            label="Téléphone"
            placeholder="+32 470 12 34 56"
            {...register('client_phone')}
          />
        </div>
      </GlassCard>

      {/* Vehicle Info */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#34C759]/10">
            <Car className="w-5 h-5 text-[#34C759]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Véhicule</h3>
            <p className="text-xs text-white/50">Informations sur le véhicule endommagé</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassSelect
            label="Marque *"
            options={carBrands}
            placeholder="Sélectionner..."
            {...register('vehicle_brand', { required: 'Marque requise' })}
            error={errors.vehicle_brand?.message}
          />
          <GlassInput
            label="Modèle *"
            placeholder="Golf, A3, 308..."
            {...register('vehicle_model', { required: 'Modèle requis' })}
            error={errors.vehicle_model?.message}
          />
          <GlassInput
            label="Année"
            type="number"
            placeholder="2022"
            {...register('vehicle_year')}
          />
          <GlassInput
            label="Plaque d'immatriculation"
            placeholder="1-ABC-123"
            {...register('vehicle_plate')}
          />
          <GlassInput
            label="N° de châssis (VIN)"
            placeholder="WVWZZZ3CZWE123456"
            {...register('vehicle_vin')}
          />
          <GlassInput
            label="Couleur"
            placeholder="Noir métallisé"
            {...register('vehicle_color')}
          />
          <GlassInput
            label="Kilométrage"
            type="number"
            placeholder="45000"
            {...register('vehicle_mileage')}
          />
        </div>
      </GlassCard>

      {/* Insurance Info */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#FF9F0A]/10">
            <Shield className="w-5 h-5 text-[#FF9F0A]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Assurance</h3>
            <p className="text-xs text-white/50">Informations sur l'assurance et le sinistre</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassSelect
            label="Compagnie d'assurance"
            options={insurers}
            placeholder="Sélectionner..."
            {...register('insurance_company')}
          />
          <GlassInput
            label="N° de police"
            placeholder="POL-123456"
            {...register('insurance_policy')}
          />
          <GlassInput
            label="N° de sinistre"
            placeholder="SIN-2024-001"
            {...register('insurance_claim')}
          />
          <GlassInput
            label="Date du sinistre"
            type="date"
            {...register('accident_date')}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Description du sinistre
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#007AFF]/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#007AFF]/20 transition-all duration-200 min-h-[100px] resize-none"
              placeholder="Décrivez les circonstances du sinistre..."
              {...register('accident_description')}
            />
          </div>
        </div>
      </GlassCard>

      {/* Submit */}
      <div className="flex justify-end">
        <GlassButton type="submit" size="lg">
          Continuer
          <ArrowRight className="w-5 h-5" />
        </GlassButton>
      </div>
    </form>
  );
}