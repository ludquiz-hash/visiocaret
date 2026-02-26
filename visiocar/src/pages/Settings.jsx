import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { resolveActiveGarageId } from '@/components/utils/garageUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Upload,
  Save,
  User,
  Globe,
  Bell,
  Shield,
  Trash2
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassInput from '@/components/ui-custom/GlassInput';
import GlassSelect from '@/components/ui-custom/GlassSelect';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('garage');
  
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

  // Get membership for role check
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

  // Fetch garage
  const { data: garage, isLoading: garageLoading } = useQuery({
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

  const [garageForm, setGarageForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    country: 'BE'
  });

  const [profileForm, setProfileForm] = useState({
    full_name: ''
  });

  useEffect(() => {
    if (garage) {
      setGarageForm({
        name: garage.name || '',
        address: garage.address || '',
        phone: garage.phone || '',
        email: garage.email || '',
        country: garage.country || 'BE'
      });
    }
  }, [garage]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || ''
      });
    }
  }, [user]);

  const updateGarage = useMutation({
    mutationFn: async (data) => {
      if (!garage?.id) {
        throw new Error('Garage not loaded');
      }
      
      // Optimistic update
      const optimisticGarage = { ...garage, ...data };
      queryClient.setQueryData(['garage', activeGarageId], optimisticGarage);
      
      // Actual update
      const result = await base44.entities.Garage.update(garage.id, data);
      return result;
    },
    onSuccess: (updatedGarage) => {
      queryClient.setQueryData(['garage', activeGarageId], updatedGarage);
      queryClient.invalidateQueries(['garage', activeGarageId]);
      toast.success('Informations du garage mises à jour');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Settings] Garage updated:', updatedGarage);
      }
    },
    onError: (error) => {
      // Rollback optimistic update
      if (garage) {
        queryClient.setQueryData(['garage', activeGarageId], garage);
      }
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
      
      if (process.env.NODE_ENV === 'development') {
        console.error('[Settings] Update error:', error);
      }
    }
  });

  const updateProfile = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Profil mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateGarage.mutateAsync({ logo_url: file_url });
      toast.success('Logo mis à jour');
    } catch (err) {
      toast.error('Erreur lors de l\'upload du logo');
    }
  };

  const tabs = [
    { id: 'garage', label: 'Garage', icon: Building2 },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const canEditGarage = membership?.role === 'owner' || membership?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-white/50 mt-1">Configurez votre espace de travail</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-[#007AFF]/10 text-[#007AFF]"
                  : "text-white/50 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Garage Settings */}
      {activeTab === 'garage' && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-[#007AFF]/10">
                <Building2 className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Informations du garage</h3>
                <p className="text-xs text-white/50">Ces informations apparaîtront sur vos rapports</p>
              </div>
            </div>

            {/* Logo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden">
                  {garage?.logo_url ? (
                    <img src={garage.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-white/20" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={!canEditGarage}
                  />
                  <label 
                    htmlFor="logo-upload"
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors",
                      canEditGarage 
                        ? "bg-white/[0.06] text-white hover:bg-white/[0.1]"
                        : "bg-white/[0.02] text-white/30 cursor-not-allowed"
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    Changer le logo
                  </label>
                  <p className="text-xs text-white/40 mt-1">PNG, JPG. Max 2MB.</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassInput
                label="Nom du garage"
                value={garageForm.name}
                onChange={(e) => setGarageForm({ ...garageForm, name: e.target.value })}
                disabled={!canEditGarage}
              />
              <GlassSelect
                label="Pays"
                value={garageForm.country}
                onChange={(e) => setGarageForm({ ...garageForm, country: e.target.value })}
                options={[
                  { value: 'BE', label: 'Belgique' },
                  { value: 'CH', label: 'Suisse' }
                ]}
                disabled={!canEditGarage}
              />
              <div className="md:col-span-2">
                <GlassInput
                  label="Adresse"
                  value={garageForm.address}
                  onChange={(e) => setGarageForm({ ...garageForm, address: e.target.value })}
                  disabled={!canEditGarage}
                />
              </div>
              <GlassInput
                label="Téléphone"
                value={garageForm.phone}
                onChange={(e) => setGarageForm({ ...garageForm, phone: e.target.value })}
                disabled={!canEditGarage}
              />
              <GlassInput
                label="Email"
                type="email"
                value={garageForm.email}
                onChange={(e) => setGarageForm({ ...garageForm, email: e.target.value })}
                disabled={!canEditGarage}
              />
            </div>

            {canEditGarage && (
              <div className="flex justify-end mt-6">
                <GlassButton 
                  onClick={() => updateGarage.mutate(garageForm)}
                  loading={updateGarage.isPending}
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </GlassButton>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-[#34C759]/10">
                <User className="w-5 h-5 text-[#34C759]" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Mon profil</h3>
                <p className="text-xs text-white/50">Vos informations personnelles</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassInput
                label="Nom complet"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              />
              <GlassInput
                label="Email"
                type="email"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div className="flex justify-end mt-6">
              <GlassButton 
                onClick={() => updateProfile.mutate(profileForm)}
                loading={updateProfile.isPending}
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </GlassButton>
            </div>
          </GlassCard>

          {/* Account Info */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#FF9F0A]/10">
                <Shield className="w-5 h-5 text-[#FF9F0A]" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Informations du compte</h3>
                <p className="text-xs text-white/50">Détails de connexion</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                <span className="text-sm text-white/70">Rôle dans le garage</span>
                <span className="text-sm font-medium text-white capitalize">{membership?.role || 'Membre'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                <span className="text-sm text-white/70">Membre depuis</span>
                <span className="text-sm font-medium text-white">
                  {user?.created_date ? new Date(user.created_date).toLocaleDateString('fr-FR') : '-'}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-[#BF5AF2]/10">
                <Bell className="w-5 h-5 text-[#BF5AF2]" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Notifications email</h3>
                <p className="text-xs text-white/50">Configurez vos préférences de notification</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { id: 'claim_complete', label: 'Dossier terminé', desc: 'Recevoir un email quand un dossier est finalisé' },
                { id: 'team_invite', label: 'Invitation équipe', desc: 'Recevoir un email pour les nouvelles invitations' },
                { id: 'billing', label: 'Facturation', desc: 'Recevoir les factures et alertes de paiement' },
                { id: 'newsletter', label: 'Actualités', desc: 'Recevoir les mises à jour et nouveautés' }
              ].map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-white/50">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
                  </label>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}