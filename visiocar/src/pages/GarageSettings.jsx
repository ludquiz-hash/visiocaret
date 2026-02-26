import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { resolveActiveGarageId } from '@/components/utils/garageUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Building2,
  Upload,
  Save,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Hash,
  Palette
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassInput from '@/components/ui-custom/GlassInput';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

export default function GarageSettings() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Get user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Resolve active garage ID - BLOCK ALL OPERATIONS IF NULL
  const { data: activeGarageId, isLoading: isLoadingGarageId } = useQuery({
    queryKey: ['activeGarageId', user?.email],
    queryFn: async () => {
      if (!user) return null;
      return await resolveActiveGarageId(user);
    },
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch garage - ONLY when activeGarageId is resolved
  const { data: garage, isLoading: isLoadingGarage } = useQuery({
    queryKey: ['garage', activeGarageId],
    queryFn: async () => {
      if (!activeGarageId) {
      if (import.meta.env.MODE === 'development') {
        console.debug('[GarageSettings] No activeGarageId, cannot fetch garage');
      }
        return null;
      }
      const garages = await base44.entities.Garage.filter({ id: activeGarageId });
      const loadedGarage = garages[0] || null;
      
      if (import.meta.env.MODE === 'development') {
        console.debug('[GarageSettings] Garage loaded:', {
          garageId: activeGarageId,
          loadedGarageId: loadedGarage?.id,
          hasCompanyName: !!loadedGarage?.company_name,
          hasLogo: !!loadedGarage?.logo_url
        });
      }
      
      return loadedGarage;
    },
    enabled: !!activeGarageId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const isLoading = isLoadingGarageId || isLoadingGarage;

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      company_name: garage?.company_name || '',
      street: garage?.company_address?.street || '',
      zip: garage?.company_address?.zip || '',
      city: garage?.company_address?.city || '',
      country: garage?.company_address?.country || 'BE',
      company_vat: garage?.company_vat || '',
      company_email: garage?.company_email || '',
      company_phone: garage?.company_phone || '',
      brand_accent: garage?.brand_accent || '#007AFF',
      pdf_footer_note: garage?.pdf_footer_note || '',
      show_logo_on_pdf: garage?.show_logo_on_pdf !== false,
    },
  });

  // Update form when garage data loads
  React.useEffect(() => {
    if (garage) {
      setValue('company_name', garage.company_name || '');
      setValue('street', garage.company_address?.street || '');
      setValue('zip', garage.company_address?.zip || '');
      setValue('city', garage.company_address?.city || '');
      setValue('country', garage.company_address?.country || 'BE');
      setValue('company_vat', garage.company_vat || '');
      setValue('company_email', garage.company_email || '');
      setValue('company_phone', garage.company_phone || '');
      setValue('brand_accent', garage.brand_accent || '#007AFF');
      setValue('pdf_footer_note', garage.pdf_footer_note || '');
      setValue('show_logo_on_pdf', garage.show_logo_on_pdf !== false);
    }
  }, [garage, setValue]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // CRITICAL: Block if no activeGarageId
      if (!activeGarageId) {
        throw new Error('Aucun garage actif. Veuillez rafraîchir la page.');
      }

      if (!garage?.id) {
        throw new Error('Garage non chargé. Veuillez rafraîchir la page.');
      }

      if (garage.id !== activeGarageId) {
        throw new Error('ID de garage incohérent. Veuillez rafraîchir la page.');
      }

      // Prepare payload matching DB schema exactly
      const savePayload = {
        id: activeGarageId,
        company_name: data.company_name || null,
        company_vat: data.company_vat || null,
        company_email: data.company_email || null,
        company_phone: data.company_phone || null,
        company_address: {
          street: data.street || null,
          zip: data.zip || null,
          city: data.city || null,
          country: data.country || 'BE',
        },
        brand_accent: data.brand_accent || '#007AFF',
        pdf_footer_note: data.pdf_footer_note || null,
        show_logo_on_pdf: data.show_logo_on_pdf !== false,
      };

      if (import.meta.env.MODE === 'development') {
        console.debug('[GarageSettings] Save payload:', {
          garageId: activeGarageId,
          loadedGarageId: garage.id,
          savePayload
        });
      }

      // Optimistic update
      const optimisticGarage = { ...garage, ...savePayload };
      queryClient.setQueryData(['garage', activeGarageId], optimisticGarage);
      
      // Actual update - use activeGarageId as source of truth
      const result = await base44.entities.Garage.update(activeGarageId, savePayload);
      
      if (import.meta.env.MODE === 'development') {
        console.debug('[GarageSettings] Garage updated successfully:', {
          garageId: activeGarageId,
          resultId: result.id,
          companyName: result.company_name
        });
      }
      
      return result;
    },
    onSuccess: (result) => {
      // Update cache with server response
      queryClient.setQueryData(['garage', activeGarageId], result);
      queryClient.invalidateQueries({ queryKey: ['garage', activeGarageId] });
      queryClient.invalidateQueries({ queryKey: ['garage'] });
      setSaved(true);
      toast.success('✅ Informations enregistrées avec succès');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (garage) {
        queryClient.setQueryData(['garage', activeGarageId], garage);
      }
      
      const errorMessage = error.message || error.toString() || 'Erreur inconnue lors de l\'enregistrement';
      toast.error(`❌ ${errorMessage}`);
      
      if (import.meta.env.MODE === 'development') {
        console.error('[GarageSettings] Update error:', {
          error,
          message: error.message,
          stack: error.stack,
          garageId: activeGarageId,
          garage: garage?.id
        });
      }
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // CRITICAL: Block if no activeGarageId
    if (!activeGarageId) {
      toast.error('❌ Aucun garage actif. Veuillez rafraîchir la page.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('❌ Format non supporté. Utilisez PNG, JPG ou SVG.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`❌ Fichier trop volumineux. Maximum 5 MB (actuel: ${(file.size / 1024 / 1024).toFixed(2)} MB).`);
      return;
    }

    if (!garage?.id) {
      toast.error('❌ Garage non chargé. Veuillez rafraîchir la page.');
      return;
    }

    if (garage.id !== activeGarageId) {
      toast.error('❌ ID de garage incohérent. Veuillez rafraîchir la page.');
      return;
    }

    setUploading(true);
    let blobUrl = null;
    
    try {
      if (import.meta.env.MODE === 'development') {
        console.debug('[GarageSettings] Starting logo upload:', {
          garageId: activeGarageId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
      }

      // Optimistic update - show preview immediately
      blobUrl = URL.createObjectURL(file);
      const optimisticGarage = { ...garage, logo_url: blobUrl };
      queryClient.setQueryData(['garage', activeGarageId], optimisticGarage);
      
      // Upload file to Base44 storage
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (!file_url) {
        throw new Error('Upload réussi mais aucune URL retournée');
      }

      if (import.meta.env.MODE === 'development') {
        console.debug('[GarageSettings] File uploaded, URL:', file_url);
      }
      
      // Update garage with actual URL - use activeGarageId as source of truth
      const updated = await base44.entities.Garage.update(activeGarageId, { 
        logo_url: file_url 
      });
      
      if (import.meta.env.MODE === 'development') {
        console.debug('[GarageSettings] Garage updated with logo:', {
          garageId: activeGarageId,
          logoUrl: file_url,
          updatedId: updated.id
        });
      }
      
      // Update cache with server response
      queryClient.setQueryData(['garage', activeGarageId], updated);
      queryClient.invalidateQueries({ queryKey: ['garage', activeGarageId] });
      queryClient.invalidateQueries({ queryKey: ['garage'] });
      
      // Clean up blob URL
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      
      toast.success('✅ Logo téléchargé avec succès');
    } catch (error) {
      // Rollback optimistic update
      if (garage) {
        queryClient.setQueryData(['garage', activeGarageId], garage);
      }
      
      // Clean up blob URL on error
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      
      const errorMessage = error.message || error.toString() || 'Erreur inconnue lors du téléchargement';
      toast.error(`❌ ${errorMessage}`);
      
      if (import.meta.env.MODE === 'development') {
        console.error('[GarageSettings] Logo upload error:', {
          error,
          message: error.message,
          stack: error.stack,
          garageId: activeGarageId,
          fileName: file.name
        });
      }
    } finally {
      setUploading(false);
      // Reset file input to allow re-uploading same file
      e.target.value = '';
    }
  };

  const onSubmit = (data) => {
    // CRITICAL: Block submit if no activeGarageId
    if (!activeGarageId) {
      toast.error('❌ Aucun garage actif. Veuillez rafraîchir la page.');
      return;
    }

    if (!garage?.id) {
      toast.error('❌ Garage non chargé. Veuillez rafraîchir la page.');
      return;
    }

    updateMutation.mutate({
      company_name: data.company_name,
      company_address: {
        street: data.street,
        zip: data.zip,
        city: data.city,
        country: data.country,
      },
      company_vat: data.company_vat,
      company_email: data.company_email,
      company_phone: data.company_phone,
      brand_accent: data.brand_accent,
      pdf_footer_note: data.pdf_footer_note,
      show_logo_on_pdf: data.show_logo_on_pdf,
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Show error if no activeGarageId after loading
  if (!activeGarageId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <GlassCard className="p-8 text-center">
          <Building2 className="w-12 h-12 text-[#FF3B30] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Aucun garage actif</h2>
          <p className="text-white/50 mb-6">
            Impossible de charger les informations du garage. Veuillez rafraîchir la page.
          </p>
          <GlassButton onClick={() => window.location.reload()} className="mt-4" icon={null}>
            Rafraîchir la page
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  // Show error if garage not found
  if (!garage) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <GlassCard className="p-8 text-center">
          <Building2 className="w-12 h-12 text-[#FF3B30] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Garage introuvable</h2>
          <p className="text-white/50 mb-6">
            Le garage avec l'ID {activeGarageId} n'a pas été trouvé.
          </p>
          <GlassButton onClick={() => window.location.reload()} className="mt-4" icon={null}>
            Rafraîchir la page
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[#007AFF]/10">
          <Building2 className="w-6 h-6 text-[#007AFF]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Informations du garage</h1>
          <p className="text-sm text-white/50">
            Personnalisez les informations de votre entreprise
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo Section */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#007AFF]" />
            Logo de l'entreprise
          </h2>

          <div className="flex items-start gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              {garage?.logo_url ? (
                <div className="w-32 h-32 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 flex items-center justify-center">
                  <img
                    src={garage.logo_url}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl bg-white/[0.04] border border-white/[0.08] border-dashed flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white/30" />
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <label className="block">
                <GlassButton
                  type="button"
                  variant="secondary"
                  size="default"
                  loading={uploading}
                  disabled={uploading || !activeGarageId || !garage?.id}
                  onClick={() => document.getElementById('logo-upload').click()}
                  icon={null}
                  className=""
                >
                  {uploading ? 'Téléchargement...' : 'Choisir un fichier'}
                </GlassButton>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-white/40">
                PNG, JPG ou SVG. Maximum 5 MB. Recommandé: 512x512px
              </p>

              {/* Show logo on PDF toggle */}
              <div className="flex items-center justify-between pt-2">
                <label className="text-sm text-white/70">
                  Afficher le logo sur les rapports PDF
                </label>
                <Switch
                  checked={watch('show_logo_on_pdf')}
                  onCheckedChange={(checked) => setValue('show_logo_on_pdf', checked)}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Company Information */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#007AFF]" />
            Informations de l'entreprise
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassInput
              label="Nom de l'entreprise"
              placeholder="Ex: Carrosserie Dupont SPRL"
              {...register('company_name')}
            />
            <GlassInput
              label="Numéro de TVA"
              placeholder="BE 0123.456.789"
              icon={Hash}
              {...register('company_vat')}
            />
            <GlassInput
              label="Email professionnel"
              type="email"
              placeholder="contact@garage.be"
              icon={Mail}
              {...register('company_email')}
            />
            <GlassInput
              label="Téléphone professionnel"
              placeholder="+32 4 123 45 67"
              icon={Phone}
              {...register('company_phone')}
            />
          </div>
        </GlassCard>

        {/* Address */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#007AFF]" />
            Adresse complète
          </h2>

          <div className="space-y-4">
            <GlassInput
              label="Rue et numéro"
              placeholder="Rue de l'Exemple, 123"
              {...register('street')}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassInput
                label="Code postal"
                placeholder="1000"
                {...register('zip')}
              />
              <GlassInput
                label="Ville"
                placeholder="Bruxelles"
                {...register('city')}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/70">Pays</label>
                <select
                  {...register('country')}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#007AFF]/50 focus:ring-2 focus:ring-[#007AFF]/20"
                >
                  <option value="BE">Belgique</option>
                  <option value="CH">Suisse</option>
                </select>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Branding */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#007AFF]" />
            Personnalisation
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/70">
                Couleur d'accent (optionnel)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  {...register('brand_accent')}
                  className="w-16 h-12 rounded-xl border border-white/[0.08] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  {...register('brand_accent')}
                  placeholder="#007AFF"
                  className="flex-1 px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#007AFF]/50 focus:ring-2 focus:ring-[#007AFF]/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/70">
                Note de pied de page PDF (optionnel)
              </label>
              <textarea
                {...register('pdf_footer_note')}
                placeholder="Ex: Merci de votre confiance. N'hésitez pas à nous contacter pour toute question."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#007AFF]/50 focus:ring-2 focus:ring-[#007AFF]/20 resize-none"
              />
            </div>
          </div>
        </GlassCard>

        {/* Save Button */}
        <div className="flex justify-end">
            <GlassButton
              type="submit"
              variant={saved ? 'success' : 'primary'}
              size="lg"
              loading={updateMutation.isPending}
              disabled={updateMutation.isPending || !activeGarageId || !garage?.id}
              icon={saved ? CheckCircle2 : Save}
              className=""
            >
              {saved ? 'Enregistré' : 'Enregistrer les modifications'}
            </GlassButton>
        </div>
      </form>
    </div>
  );
}