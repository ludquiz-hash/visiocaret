import React from 'react';
import { cn } from "@/lib/utils";

export default function GlassCard({ 
  children, 
  className, 
  hover = false,
  glow = false,
  ...props 
}) {
  return (
    <div 
      className={cn(
        "relative rounded-2xl border border-white/[0.06] bg-[#151921]/80 backdrop-blur-xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        hover && "transition-all duration-300 hover:border-white/[0.12] hover:shadow-[0_12px_40px_rgba(0,122,255,0.1)] hover:-translate-y-0.5",
        glow && "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-[#007AFF]/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}