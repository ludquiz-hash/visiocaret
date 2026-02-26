import React from 'react';
import { cn } from "@/lib/utils";
import GlassButton from './GlassButton';

export default function EmptyState({ 
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className 
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-6 text-center",
      className
    )}>
      {Icon && (
        <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-6 border border-white/[0.06]">
          <Icon className="w-10 h-10 text-white/30" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 max-w-sm mb-6">{description}</p>
      {action && actionLabel && (
        <GlassButton onClick={action}>
          {actionLabel}
        </GlassButton>
      )}
    </div>
  );
}