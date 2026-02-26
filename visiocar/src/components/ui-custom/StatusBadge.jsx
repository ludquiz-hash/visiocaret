import React from 'react';
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react';

const statusConfig = {
  draft: {
    label: "Brouillon",
    color: "bg-white/10 text-white/70 border-white/10"
  },
  analyzing: {
    label: "Analyse en cours",
    color: "bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/30",
    animated: true
  },
  review: {
    label: "À vérifier",
    color: "bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/30"
  },
  completed: {
    label: "Terminé",
    color: "bg-[#34C759]/10 text-[#34C759] border-[#34C759]/30"
  },
  blocked: {
    label: "Bloqué",
    color: "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/30"
  }
};

export default function StatusBadge({ status, className }) {
  const config = statusConfig[status] || statusConfig.draft;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      config.color,
      className
    )}>
      {config.animated && (
        <Loader2 className="w-3 h-3 animate-spin" />
      )}
      {config.label}
    </span>
  );
}