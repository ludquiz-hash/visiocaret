import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { authClient } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User,
  Save,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassInput from '@/components/ui-custom/GlassInput';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Settings() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data) => authClient.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaved(true);
      toast.success('Profil mis à jour');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ full_name: fullName });
  };

  if (!profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <GlassCard className="p-6">
          <Skeleton className="h-12" />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-white/50 mt-1">Gérez votre profil</p>
      </div>

      <form onSubmit={handleSubmit}>
        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/[0.06]">
            <div className="p-3 rounded-xl bg-[#007AFF]/10">
              <User className="w-6 h-6 text-[#007AFF]" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Profil utilisateur</h2>
              <p className="text-sm text-white/50">Vos informations personnelles</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Email</label>
              <GlassInput value={user?.email || ''} disabled className="opacity-50" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Nom complet</label>
              <GlassInput
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-white/[0.06]">
            <GlassButton 
              type="submit"
              disabled={updateMutation.isPending}
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
