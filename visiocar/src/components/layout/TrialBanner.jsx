import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { Clock, ArrowRight, Zap } from 'lucide-react';

export default function TrialBanner({ daysRemaining, className }) {
  if (daysRemaining > 3) return null;

  const isUrgent = daysRemaining <= 1;

  return (
    <div className={cn(
      "rounded-xl px-4 py-3 flex items-center justify-between gap-4",
      isUrgent 
        ? "bg-gradient-to-r from-[#FF3B30]/20 to-[#FF9F0A]/20 border border-[#FF3B30]/30"
        : "bg-gradient-to-r from-[#FF9F0A]/10 to-[#007AFF]/10 border border-[#FF9F0A]/20",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isUrgent ? "bg-[#FF3B30]/20" : "bg-[#FF9F0A]/20"
        )}>
          <Clock className={cn("w-4 h-4", isUrgent ? "text-[#FF3B30]" : "text-[#FF9F0A]")} />
        </div>
        <div>
          <p className={cn(
            "text-sm font-medium",
            isUrgent ? "text-[#FF3B30]" : "text-[#FF9F0A]"
          )}>
            {isUrgent 
              ? "Dernier jour d'essai !" 
              : `${daysRemaining} jours restants`
            }
          </p>
          <p className="text-xs text-white/50">
            Passez au plan payant pour continuer
          </p>
        </div>
      </div>
      
      <Link 
        to={createPageUrl('Pricing')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
          isUrgent 
            ? "bg-[#FF3B30] hover:bg-[#FF3B30]/80 text-white"
            : "bg-[#FF9F0A] hover:bg-[#FF9F0A]/80 text-black"
        )}
      >
        <Zap className="w-4 h-4" />
        S'abonner
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}