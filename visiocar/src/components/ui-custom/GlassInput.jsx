import React from 'react';
import { cn } from "@/lib/utils";

const GlassInput = React.forwardRef(({ 
  className, 
  label,
  error,
  icon: Icon,
  ...props 
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-white/70">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30",
            "bg-white/[0.04] border border-white/[0.08]",
            "focus:outline-none focus:border-[#007AFF]/50 focus:bg-white/[0.06]",
            "focus:ring-2 focus:ring-[#007AFF]/20",
            "transition-all duration-200",
            Icon && "pl-10",
            error && "border-[#FF3B30]/50 focus:border-[#FF3B30] focus:ring-[#FF3B30]/20",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-[#FF3B30] mt-1">{error}</p>
      )}
    </div>
  );
});

GlassInput.displayName = 'GlassInput';

export default GlassInput;