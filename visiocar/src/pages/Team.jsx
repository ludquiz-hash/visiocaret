import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { membersApi } from '@/api';
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
  Loader2
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import GlassInput from '@/components/ui-custom/GlassInput';
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
};

export default function Team() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, member: null });

  // Fetch members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => membersApi.list(),
    enabled: !!user,
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: (data) => membersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Invitation envoyée !');
      setShowInviteModal(false);
      setInviteEmail('');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l\'invitation');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => membersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Membre supprimé');
      setDeleteDialog({ open: false, member: null });
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  });

  const handleInvite = () => {
    if (!inviteEmail) return;
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const handleDelete = () => {
    if (deleteDialog.member) {
      deleteMutation.mutate(deleteDialog.member.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="p-4">
              <Skeleton className="h-16" />
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Équipe</h1>
          <p className="text-white/50 mt-1">{members.length} membre{members.length > 1 ? 's' : ''}</p>
        </div>
        <GlassButton icon={UserPlus} onClick={() => setShowInviteModal(true)}>
          Inviter un membre
        </GlassButton>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun membre</h3>
          <p className="text-white/50 mb-4">Invitez des collaborateurs à rejoindre votre équipe</p>
          <GlassButton icon={UserPlus} onClick={() => setShowInviteModal(true)}>
            Inviter un membre
          </GlassButton>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {members.map((member) => {
            const roleConfig = roleLabels[member.role] || roleLabels.staff;
            const RoleIcon = roleConfig.icon;

            return (
              <GlassCard key={member.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#007AFF]/30 to-[#BF5AF2]/30 flex items-center justify-center">
                    <span className="text-lg font-medium text-white">
                      {(member.user_name || member.user_email)?.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {member.user_name || member.user_email.split('@')[0]}
                    </p>
                    <p className="text-sm text-white/50 truncate">{member.user_email}</p>
                  </div>

                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] ${roleConfig.color}`}>
                    <RoleIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{roleConfig.label}</span>
                  </div>

                  {member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-white/[0.04]">
                          <MoreVertical className="w-4 h-4 text-white/40" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1d29] border-white/[0.08]">
                        <DropdownMenuItem 
                          className="text-red-400 hover:bg-red-500/10"
                          onClick={() => setDeleteDialog({ open: true, member })}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-[#1a1d29] border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="text-white">Inviter un membre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <GlassInput
                  type="email"
                  placeholder="collaborateur@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Rôle</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#007AFF]/50"
              >
                <option value="staff" className="bg-[#1a1d29]">Collaborateur</option>
                <option value="admin" className="bg-[#1a1d29]">Administrateur</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <GlassButton variant="secondary" onClick={() => setShowInviteModal(false)}>
                Annuler
              </GlassButton>
              <GlassButton 
                onClick={handleInvite}
                disabled={!inviteEmail || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Envoyer l'invitation
                  </>
                )}
              </GlassButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent className="bg-[#1a1d29] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Êtes-vous sûr de vouloir supprimer ce membre ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.04] text-white border-white/[0.08] hover:bg-white/[0.08]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
