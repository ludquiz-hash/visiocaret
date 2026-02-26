import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { garageApi } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Building2,
  Save,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassInput from '@/components/ui-custom/GlassInput';
import { Skeleton } from '@/components/ui/skeleton';

export default function GarageSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

  // Fetch garage
  const { data: garage, isLoading } = useQuery({
    queryKey: ['garage'],
    queryFn: () => garageApi.get(),
    enabled: !!user,
  });

  // Update form when garage data loads
  useEffect(() => {
    if (garage) {
      reset({
        name: garage.name || '',
        company_name: garage.company_name || '',
        company_address: garage.company_address || '',
        company_phone: garage.company_phone || '',
        company_email: garage.company_email || '',
      });
    }
  }, [garage, reset]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => garageApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage'] });
      setSaved(true);
      toast.success('Paramètres mis à jour');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <GlassCard className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-white/50 mt-1">Configurez votre garage</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <GlassCard className="p-6 space-y-6">
          {/* Garage Info */}
          <div className="flex items-center gap-4 pb-6 border-b border-white/[0.06]">
            <div className="p-3 rounded-xl bg-[#007AFF]/10">
              <Building2 className="w-6 h-6 text-[#007AFF]" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Informations du garage</h2>
              <p className="text-sm text-white/50">Ces informations apparaîtront sur vos rapports PDF</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-white/60 mb-2">Nom du garage *</label>
              <GlassInput
                {...register('name')}
                placeholder="Mon Garage"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">Nom de l'entreprise</label>
              <GlassInput
                {...register('company_name')}
                placeholder="SARL Mon Garage"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm text-white/60 mb-2">Adresse</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <GlassInput
                  {...register('company_address')}
                  placeholder="123 rue de Paris, 75001 Paris"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <GlassInput
                  {...register('company_phone')}
                  placeholder="01 23 45 67 89"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <GlassInput
                  {...register('company_email')}
                  type="email"
                  placeholder="contact@mongarage.fr"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-6 border-t border-white/[0.06]">
            <GlassButton 
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
              icon={updateMutation.isPending ? Loader2 : saved ? CheckCircle2 : Save}
            >
              {updateMutation.isPending ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Enregistrer'}
            </GlassButton>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}
