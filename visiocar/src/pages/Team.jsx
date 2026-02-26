import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { resolveActiveGarageId } from '@/components/utils/garageUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  MoreVertical,
  Trash2,
  Crown,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassInput from '@/components/ui-custom/GlassInput';
import GlassSelect from '@/components/ui-custom/GlassSelect';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';

const roleLabels = {
  owner: { label: 'Propriétaire', icon: Crown, color: 'text-[#FF9F0A]' },
  admin: { label: 'Administrateur', icon: Shield, color: 'text-[#007AFF]' },
  staff: { label: 'Collaborateur', icon: User, color: 'text-white/60' },
  member: { label: 'Collaborateur', icon: User, color: 'text-white/60' }
};

export default function Team() {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, member: null });
  const [promoteConfirmDialog, setPromoteConfirmDialog] = useState({ open: false, member: null });
  const [demoteConfirmDialog, setDemoteConfirmDialog] = useState({ open: false, member: null });

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

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

  const { data: garage, isLoading: isLoadingGarage } = useQuery({
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

  const { data: membership } = useQuery({
    queryKey: ['userMembership', user?.email, activeGarageId],
    queryFn: async () => {
      if (!user?.email || !activeGarageId) return null;
      const memberships = await base44.entities.GarageMember.filter({
        user_email: user.email,
        garage_id: activeGarageId
      });
      return memberships[0] || null;
    },
    enabled: !!user?.email && !!activeGarageId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: members = [], isLoading: isLoadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: ['garageMembers', activeGarageId],
    queryFn: async () => {
      if (!activeGarageId) return [];
      const membersData = await base44.entities.GarageMember.filter({
        garage_id: activeGarageId
      });
      return membersData.filter(m => m.is_active !== false);
    },
    enabled: !!activeGarageId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const isLoading = isLoadingGarageId || isLoadingGarage || isLoadingMembers;
  const canManageTeam = membership?.role === 'owner' || membership?.role === 'admin';
  const isOwner = membership?.role === 'owner';

  const [syncState, setSyncState] = useState({
    isSyncing: false,
    lastSyncAttempt: null,
    syncError: null
  });

  const updateUserDataCache = (garageId, role) => {
    queryClient.setQueryData(['currentUser'], (oldUser) => {
      if (!oldUser) return oldUser;
      return {
        ...oldUser,
        data: {
          ...oldUser.data,
          activeGarageId: garageId,
          activeGarageRole: role
        }
      };
    });
  };

  useEffect(() => {
    const forceSyncActiveGarageData = async () => {
      if (syncState.isSyncing || !user || !activeGarageId || !membership) {
        return;
      }

      const currentGarageId = user.data?.activeGarageId;
      const currentRole = user.data?.activeGarageRole;
      const needsSync = currentGarageId !== activeGarageId || currentRole !== membership.role;

      if (!needsSync) {
        return;
      }

      setSyncState({ isSyncing: true, lastSyncAttempt: Date.now(), syncError: null });
      updateUserDataCache(activeGarageId, membership.role);

      try {
        await base44.auth.updateMe({
          activeGarageId: activeGarageId,
          activeGarageRole: membership.role
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        await refetchUser();
        
        setSyncState({ isSyncing: false, lastSyncAttempt: Date.now(), syncError: null });
      } catch (error) {
        updateUserDataCache(activeGarageId, membership.role);
        setSyncState({ 
          isSyncing: false, 
          lastSyncAttempt: Date.now(), 
          syncError: error.message || 'Erreur inconnue' 
        });
      }
    };

    const timeoutId = setTimeout(() => {
      forceSyncActiveGarageData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [user, activeGarageId, membership, syncState.isSyncing, refetchUser]);

  useEffect(() => {
    if (activeGarageId && membership?.role && user) {
      const cacheNeedsUpdate = user.data?.activeGarageId !== activeGarageId || user.data?.activeGarageRole !== membership.role;
      
      if (cacheNeedsUpdate) {
        updateUserDataCache(activeGarageId, membership.role);
      }
    }
  }, [user, activeGarageId, membership, canManageTeam, isOwner, members.length, syncState, queryClient]);

  const ensureActiveGarageDataSynced = async () => {
    if (!user || !activeGarageId || !membership) {
      throw new Error('User, activeGarageId or membership not available');
    }

    const targetGarageId = activeGarageId;
    const targetRole = membership.role;
    
    updateUserDataCache(targetGarageId, targetRole);
    
    await refetchUser();
    const latestUser = await base44.auth.me();
    const currentGarageId = latestUser.data?.activeGarageId;
    const currentRole = latestUser.data?.activeGarageRole;
    
    const needsSync = currentGarageId !== targetGarageId || currentRole !== targetRole;
    
    if (!needsSync) {
      return;
    }

    updateUserDataCache(targetGarageId, targetRole);

    try {
      await base44.auth.updateMe({
        activeGarageId: targetGarageId,
        activeGarageRole: targetRole
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let verified = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!verified && attempts < maxAttempts) {
        attempts++;
        updateUserDataCache(targetGarageId, targetRole);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await refetchUser();
        const verifiedUser = await base44.auth.me();
        const verifiedGarageId = verifiedUser.data?.activeGarageId;
        const verifiedRole = verifiedUser.data?.activeGarageRole;
        
        if (verifiedGarageId === targetGarageId && verifiedRole === targetRole) {
          verified = true;
          updateUserDataCache(targetGarageId, targetRole);
        } else if (attempts < maxAttempts) {
          try {
            await base44.auth.updateMe({
              activeGarageId: targetGarageId,
              activeGarageRole: targetRole
            });
          } catch (updateError) {
            // Continue with retries
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!verified) {
        updateUserDataCache(targetGarageId, targetRole);
      }
    } catch (error) {
      updateUserDataCache(targetGarageId, targetRole);
    }
  };

  const inviteMember = useMutation({
    mutationFn: async ({ email, role }) => {
      if (!activeGarageId) {
        throw new Error('Aucun garage actif. Veuillez rafraîchir la page.');
      }

      if (!garage?.id) {
        throw new Error('Garage non trouvé');
      }

      const existing = members.find(m => m.user_email === email);
      if (existing) {
        throw new Error('Cet utilisateur est déjà membre de l\'équipe');
      }

      const newMember = await base44.entities.GarageMember.create({
        garage_id: activeGarageId,
        user_id: email,
        user_email: email,
        user_name: email.split('@')[0],
        role: role,
        is_active: true
      });

      try {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `Invitation à rejoindre ${garage?.name} sur VisiWebCar`,
          body: `
Bonjour,

Vous avez été invité à rejoindre l'équipe "${garage?.name}" sur VisiWebCar.

Pour accepter l'invitation, connectez-vous sur VisiWebCar avec cette adresse email.

Cordialement,
L'équipe VisiWebCar
          `.trim()
        });
      } catch (emailErr) {
        // Email sending is non-critical, continue
      }

      return newMember;
    },
    onSuccess: () => {
      refetchMembers();
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('staff');
      toast.success('Invitation envoyée avec succès');
    },
    onError: (err) => {
      const errorMessage = err.message || err.toString() || 'Erreur lors de l\'envoi de l\'invitation';
      toast.error(`❌ ${errorMessage}`);
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId) => {
      const effectiveGarageId = user?.data?.activeGarageId || activeGarageId;
      const effectiveRole = user?.data?.activeGarageRole || membership?.role;
      
      if (!effectiveGarageId) {
        throw new Error('Aucun garage actif. Veuillez rafraîchir la page.');
      }

      const effectiveCanManage = effectiveRole === 'owner' || effectiveRole === 'admin';

      if (!effectiveCanManage) {
        throw new Error(`Vous n'avez pas les permissions pour supprimer des membres. Votre rôle: ${effectiveRole || 'non défini'}`);
      }

      const member = members.find(m => m.id === memberId);
      if (!member) {
        throw new Error('Membre introuvable');
      }

      if (member.role === 'owner') {
        throw new Error('Le propriétaire ne peut pas être supprimé');
      }

      if (member.user_email === user?.email) {
        throw new Error('Vous ne pouvez pas vous supprimer vous-même');
      }

      if (membership?.role === 'admin' && member.role === 'admin') {
        throw new Error('Seul le propriétaire peut supprimer un administrateur');
      }

      try {
        await ensureActiveGarageDataSynced();
      } catch (syncError) {
        updateUserDataCache(effectiveGarageId, effectiveRole);
      }

      if (!effectiveGarageId || !effectiveRole) {
        throw new Error(`Données manquantes. effectiveGarageId: ${effectiveGarageId}, effectiveRole: ${effectiveRole}`);
      }

      try {
        const finalUserCheck = await base44.auth.me();
        if (finalUserCheck.data?.activeGarageId !== effectiveGarageId || 
            finalUserCheck.data?.activeGarageRole !== effectiveRole) {
          updateUserDataCache(effectiveGarageId, effectiveRole);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const result = await base44.entities.GarageMember.update(memberId, {
          is_active: false
        });
        return result;
      } catch (error) {
        if (error.toString().includes('403') || 
            error.toString().includes('Forbidden') || 
            error.status === 403 ||
            error.toString().includes('Permission denied')) {
          throw new Error('Permissions insuffisantes pour supprimer ce membre.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      refetchMembers();
      setDeleteConfirmDialog({ open: false, member: null });
      toast.success('Membre supprimé avec succès');
    },
    onError: (err) => {
      const errorMessage = err.message || 'Erreur lors de la suppression';
      toast.error(`❌ ${errorMessage}`);
    },
  });

  const demoteToMember = useMutation({
    mutationFn: async (memberId) => {
      const effectiveGarageId = user?.data?.activeGarageId || activeGarageId;
      const effectiveRole = user?.data?.activeGarageRole || membership?.role;
      
      if (!effectiveGarageId) {
        throw new Error('Aucun garage actif. Veuillez rafraîchir la page.');
      }

      const effectiveIsOwner = effectiveRole === 'owner';

      if (!effectiveIsOwner) {
        throw new Error(`Seul le propriétaire peut rétrograder des membres. Votre rôle: ${effectiveRole || 'non défini'}`);
      }

      const member = members.find(m => m.id === memberId);
      if (!member) {
        throw new Error('Membre introuvable');
      }

      if (member.role === 'owner') {
        throw new Error('Le propriétaire ne peut pas être rétrogradé');
      }

      if (member.user_email === user?.email) {
        throw new Error('Vous ne pouvez pas vous rétrograder vous-même');
      }

      if (member.role === 'staff' || member.role === 'member') {
        throw new Error('Ce membre est déjà collaborateur');
      }

      try {
        await ensureActiveGarageDataSynced();
      } catch (syncError) {
        updateUserDataCache(effectiveGarageId, effectiveRole);
      }

      if (!effectiveGarageId || !effectiveRole) {
        throw new Error(`Données manquantes. effectiveGarageId: ${effectiveGarageId}, effectiveRole: ${effectiveRole}`);
      }

      try {
        const finalUserCheck = await base44.auth.me();
        if (finalUserCheck.data?.activeGarageId !== effectiveGarageId || 
            finalUserCheck.data?.activeGarageRole !== effectiveRole) {
          updateUserDataCache(effectiveGarageId, effectiveRole);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const result = await base44.entities.GarageMember.update(memberId, { 
          role: 'staff'
        });
        return result;
      } catch (error) {
        if (error.toString().includes('403') || 
            error.toString().includes('Forbidden') || 
            error.status === 403 ||
            error.toString().includes('Permission denied')) {
          throw new Error('Permissions insuffisantes pour rétrograder ce membre.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      refetchMembers();
      setDemoteConfirmDialog({ open: false, member: null });
      toast.success('Membre rétrogradé en collaborateur avec succès');
    },
    onError: (err) => {
      const errorMessage = err.message || 'Erreur lors de la rétrogradation';
      toast.error(`❌ ${errorMessage}`);
    },
  });

  const promoteToAdmin = useMutation({
    mutationFn: async (memberId) => {
      const effectiveGarageId = user?.data?.activeGarageId || activeGarageId;
      const effectiveRole = user?.data?.activeGarageRole || membership?.role;
      
      if (!effectiveGarageId) {
        throw new Error('Aucun garage actif. Veuillez rafraîchir la page.');
      }

      const effectiveIsOwner = effectiveRole === 'owner';

      if (!effectiveIsOwner) {
        throw new Error(`Seul le propriétaire peut promouvoir des membres. Votre rôle: ${effectiveRole || 'non défini'}`);
      }

      const member = members.find(m => m.id === memberId);
      if (!member) {
        throw new Error('Membre introuvable');
      }

      if (member.role === 'owner') {
        throw new Error('Le propriétaire est déjà au niveau maximum');
      }
      if (member.role === 'admin') {
        throw new Error('Ce membre est déjà administrateur');
      }

      try {
        await ensureActiveGarageDataSynced();
      } catch (syncError) {
        updateUserDataCache(effectiveGarageId, effectiveRole);
      }

      if (!effectiveGarageId || !effectiveRole) {
        throw new Error(`Données manquantes. effectiveGarageId: ${effectiveGarageId}, effectiveRole: ${effectiveRole}`);
      }

      try {
        const finalUserCheck = await base44.auth.me();
        if (finalUserCheck.data?.activeGarageId !== effectiveGarageId || 
            finalUserCheck.data?.activeGarageRole !== effectiveRole) {
          updateUserDataCache(effectiveGarageId, effectiveRole);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const result = await base44.entities.GarageMember.update(memberId, { 
          role: 'admin' 
        });
        return result;
      } catch (error) {
        if (error.toString().includes('403') || 
            error.toString().includes('Forbidden') || 
            error.status === 403 ||
            error.toString().includes('Permission denied')) {
          throw new Error('Permissions insuffisantes pour promouvoir ce membre.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      refetchMembers();
      setPromoteConfirmDialog({ open: false, member: null });
      toast.success('Membre promu administrateur avec succès');
    },
    onError: (err) => {
      const errorMessage = err.message || 'Erreur lors de la promotion';
      toast.error(`❌ ${errorMessage}`);
    },
  });

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }
    inviteMember.mutate({ email: inviteEmail, role: inviteRole });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!activeGarageId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <GlassCard className="p-8 text-center">
          <Users className="w-12 h-12 text-[#FF3B30] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Aucun garage actif</h2>
          <p className="text-white/50 mb-6">
            Impossible de charger les membres de l'équipe. Veuillez rafraîchir la page.
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Équipe</h1>
          <p className="text-white/50 mt-1">
            {members.length} membre{members.length > 1 ? 's' : ''} dans {garage?.name || 'le garage'}
          </p>
        </div>
        {canManageTeam && (
          <GlassButton icon={UserPlus} onClick={() => setShowInviteModal(true)}>
            Inviter un membre
          </GlassButton>
        )}
      </div>

      {/* Members List */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="font-semibold text-white">Membres de l'équipe</h3>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {members.map((member) => {
            const roleConfig = roleLabels[member.role] || roleLabels.staff;
            const RoleIcon = roleConfig.icon;
            const isCurrentUser = member.user_email === user?.email;
            const canEdit = isOwner && !isCurrentUser && member.role !== 'owner';
            const canDelete = canManageTeam && !isCurrentUser && member.role !== 'owner' && 
                             (isOwner || (membership?.role === 'admin' && member.role !== 'admin'));
            const canPromote = isOwner && !isCurrentUser && member.role !== 'owner' && member.role !== 'admin';
            const canDemote = isOwner && !isCurrentUser && member.role === 'admin';

            return (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#007AFF]/30 to-[#BF5AF2]/30 flex items-center justify-center border border-white/10">
                  <span className="text-lg font-medium text-white">
                    {member.user_name?.charAt(0)?.toUpperCase() || member.user_email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white truncate">
                      {member.user_name || member.user_email?.split('@')[0]}
                    </p>
                    {isCurrentUser && (
                      <span className="text-xs text-white/40">(vous)</span>
                    )}
                  </div>
                  <p className="text-sm text-white/50 truncate">{member.user_email}</p>
                </div>

                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04]",
                  roleConfig.color
                )}>
                  <RoleIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{roleConfig.label}</span>
                </div>

                {canEdit || canDelete ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={removeMember.isPending || promoteToAdmin.isPending || demoteToMember.isPending}
                      >
                        {(removeMember.isPending || promoteToAdmin.isPending || demoteToMember.isPending) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreVertical className="w-4 h-4" />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#151921] border-white/10">
                      {canPromote && (
                        <DropdownMenuItem
                          className="text-white hover:bg-white/10 cursor-pointer"
                          onSelect={(e) => {
                            e.preventDefault();
                            setPromoteConfirmDialog({ open: true, member });
                          }}
                          disabled={promoteToAdmin.isPending}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Promouvoir administrateur
                        </DropdownMenuItem>
                      )}
                      {canDemote && (
                        <DropdownMenuItem
                          className="text-white hover:bg-white/10 cursor-pointer"
                          onSelect={(e) => {
                            e.preventDefault();
                            setDemoteConfirmDialog({ open: true, member });
                          }}
                          disabled={demoteToMember.isPending}
                        >
                          <User className="w-4 h-4 mr-2" />
                          Rétrograder en collaborateur
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          className="text-[#FF3B30] hover:bg-[#FF3B30]/10 cursor-pointer"
                          onSelect={(e) => {
                            e.preventDefault();
                            setDeleteConfirmDialog({ open: true, member });
                          }}
                          disabled={removeMember.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer de l'équipe
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="w-8"></div>
                )}
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">Aucun membre dans l'équipe</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Role Descriptions */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-white mb-4">Rôles et permissions</h3>
        <div className="space-y-4">
          {Object.entries(roleLabels).filter(([key]) => key !== 'member').map(([key, config]) => {
            const RoleIcon = config.icon;
            const permissions = {
              owner: ['Gestion complète', 'Facturation', 'Suppression du garage', 'Promouvoir/Rétrograder les membres'],
              admin: ['Gestion des dossiers', 'Inviter des membres', 'Paramètres'],
              staff: ['Créer des dossiers', 'Voir les dossiers', 'Modifier ses dossiers']
            };

            return (
              <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                <div className={cn("p-2 rounded-lg bg-white/[0.04]", config.color)}>
                  <RoleIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className={cn("font-medium", config.color)}>{config.label}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {permissions[key]?.join(' • ') || 'Aucune permission spécifique'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-[#151921] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Inviter un membre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <GlassInput
              label="Adresse email"
              type="email"
              placeholder="collaborateur@email.com"
              icon={Mail}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <GlassSelect
              label="Rôle"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              options={[
                { value: 'staff', label: 'Collaborateur' },
                { value: 'admin', label: 'Administrateur' }
              ]}
            />
            <div className="flex justify-end gap-2 pt-4">
              <GlassButton
                variant="secondary"
                onClick={() => setShowInviteModal(false)}
                disabled={inviteMember.isPending}
              >
                Annuler
              </GlassButton>
              <GlassButton
                onClick={handleInvite}
                loading={inviteMember.isPending}
                disabled={!inviteEmail || inviteMember.isPending || !activeGarageId}
              >
                Envoyer l'invitation
              </GlassButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmDialog.open} onOpenChange={(open) => setDeleteConfirmDialog({ ...deleteConfirmDialog, open })}>
        <AlertDialogContent className="bg-[#151921] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer le membre ?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Voulez-vous vraiment supprimer <strong>{deleteConfirmDialog.member?.user_email}</strong> de l'équipe ? 
              Cette action est irréversible et le membre perdra l'accès au garage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.08] border-white/10 text-white hover:bg-white/[0.12]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmDialog.member) {
                  removeMember.mutate(deleteConfirmDialog.member.id);
                }
              }}
              className="bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white"
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote Confirmation Dialog */}
      <AlertDialog open={promoteConfirmDialog.open} onOpenChange={(open) => setPromoteConfirmDialog({ ...promoteConfirmDialog, open })}>
        <AlertDialogContent className="bg-[#151921] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Promouvoir en administrateur ?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Voulez-vous vraiment promouvoir <strong>{promoteConfirmDialog.member?.user_email}</strong> au rôle d'administrateur ? 
              Les administrateurs peuvent inviter des membres et gérer les dossiers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.08] border-white/10 text-white hover:bg-white/[0.12]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => promoteConfirmDialog.member && promoteToAdmin.mutate(promoteConfirmDialog.member.id)}
              className="bg-[#007AFF] hover:bg-[#007AFF]/90 text-white"
              disabled={promoteToAdmin.isPending}
            >
              {promoteToAdmin.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Promotion...
                </>
              ) : (
                'Promouvoir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demote Confirmation Dialog */}
      <AlertDialog open={demoteConfirmDialog.open} onOpenChange={(open) => setDemoteConfirmDialog({ ...demoteConfirmDialog, open })}>
        <AlertDialogContent className="bg-[#151921] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Rétrograder en collaborateur ?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Voulez-vous vraiment rétrograder <strong>{demoteConfirmDialog.member?.user_email}</strong> au rôle de collaborateur ? 
              Il perdra les permissions d'administrateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.08] border-white/10 text-white hover:bg-white/[0.12]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (demoteConfirmDialog.member) {
                  demoteToMember.mutate(demoteConfirmDialog.member.id);
                }
              }}
              className="bg-[#FF9F0A] hover:bg-[#FF9F0A]/90 text-white"
              disabled={demoteToMember.isPending}
            >
              {demoteToMember.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Rétrogradation...
                </>
              ) : (
                'Rétrograder'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}