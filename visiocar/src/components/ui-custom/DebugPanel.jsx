import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: membership } = useQuery({
    queryKey: ['userMembership', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const memberships = await base44.entities.GarageMember.filter({ user_email: user.email });
      return memberships[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['claims', membership?.garage_id],
    queryFn: async () => {
      if (!membership?.garage_id) return [];
      return base44.entities.Claim.filter({ garage_id: membership.garage_id });
    },
    enabled: !!membership?.garage_id,
    refetchOnMount: true,
  });

  // Only show in development
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#FF3B30] text-white rounded-lg shadow-lg hover:bg-[#FF3B30]/90 transition-colors"
      >
        <Bug className="w-4 h-4" />
        Debug
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-14 right-0 w-96 bg-[#0B0E14] border border-[#FF3B30]/30 rounded-lg shadow-2xl p-4 text-xs text-white/80 max-h-96 overflow-y-auto">
          <h3 className="font-bold text-[#FF3B30] mb-3 text-sm">🐛 Debug Info</h3>
          
          <div className="space-y-3">
            <div className="bg-white/5 p-2 rounded">
              <p className="text-white/50 mb-1">User ID:</p>
              <p className="font-mono text-white">{user?.id || 'null'}</p>
            </div>

            <div className="bg-white/5 p-2 rounded">
              <p className="text-white/50 mb-1">User Email:</p>
              <p className="font-mono text-white">{user?.email || 'null'}</p>
            </div>

            <div className="bg-white/5 p-2 rounded">
              <p className="text-white/50 mb-1">activeGarageId (user.data):</p>
              <p className={`font-mono ${user?.data?.activeGarageId ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                {user?.data?.activeGarageId || '❌ NOT SET'}
              </p>
            </div>

            <div className="bg-white/5 p-2 rounded">
              <p className="text-white/50 mb-1">activeGarageRole (user.data):</p>
              <p className={`font-mono ${user?.data?.activeGarageRole ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                {user?.data?.activeGarageRole || '❌ NOT SET'}
              </p>
            </div>

            <div className="bg-white/5 p-2 rounded">
              <p className="text-white/50 mb-1">Membership Garage ID:</p>
              <p className="font-mono text-white">{membership?.garage_id || 'null'}</p>
            </div>

            <div className="bg-white/5 p-2 rounded">
              <p className="text-white/50 mb-1">Membership Role:</p>
              <p className="font-mono text-white">{membership?.role || 'null'}</p>
            </div>

            <div className="bg-white/5 p-2 rounded">
              <p className="text-white/50 mb-1">Claims Loaded:</p>
              <p className={`font-mono ${claims.length > 0 ? 'text-[#34C759]' : claimsLoading ? 'text-[#FF9F0A]' : 'text-[#FF3B30]'}`}>
                {claimsLoading ? 'Chargement...' : `${claims.length} dossiers`}
              </p>
            </div>

            <div className="bg-white/5 p-2 rounded">
              <p className="text-white/50 mb-1">Query Status:</p>
              <div className="space-y-1 mt-1">
                <p className={membership?.garage_id ? 'text-[#34C759]' : 'text-[#FF3B30]'}>
                  • Query enabled: {membership?.garage_id ? '✅' : '❌'}
                </p>
                <p className={claimsLoading ? 'text-[#FF9F0A]' : 'text-[#34C759]'}>
                  • Loading: {claimsLoading ? '⏳' : '✅'}
                </p>
              </div>
            </div>

            <div className="bg-white/5 p-2 rounded">
              <p className="text-white/50 mb-1">RLS Check:</p>
              <div className="space-y-1 mt-1">
                <p className={user?.data?.activeGarageId ? 'text-[#34C759]' : 'text-[#FF3B30]'}>
                  • activeGarageId: {user?.data?.activeGarageId ? '✅' : '❌'}
                </p>
                <p className={user?.data?.activeGarageRole ? 'text-[#34C759]' : 'text-[#FF3B30]'}>
                  • activeGarageRole: {user?.data?.activeGarageRole ? '✅' : '❌'}
                </p>
              </div>
            </div>
          </div>

          <p className="text-white/30 mt-3 text-[10px]">
            ℹ️ Ce panel n'est visible qu'en développement
          </p>
        </div>
      )}
    </div>
  );
}