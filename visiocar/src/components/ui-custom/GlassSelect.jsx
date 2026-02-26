import React from 'react';
import { cn } from "@/lib/utils";
import { ChevronDown } from 'lucide-react';

const GlassSelect = React.forwardRef(({ 
  className, 
  label,
  error,
  options = [],
  placeholder = "Sélectionner...",
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
        <select
          ref={ref}
          className={cn(
            "w-full px-4 py-3 rounded-xl text-sm text-white appearance-none cursor-pointer",
            "bg-white/[0.04] border border-white/[0.08]",
            "focus:outline-none focus:border-[#007AFF]/50 focus:bg-white/[0.06]",
            "focus:ring-2 focus:ring-[#007AFF]/20",
            "transition-all duration-200",
            error && "border-[#FF3B30]/50 focus:border-[#FF3B30] focus:ring-[#FF3B30]/20",
            className
          )}
          {...props}
        >
          <option value="" className="bg-[#151921] text-white/50">{placeholder}</option>
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              className="bg-[#151921] text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      </div>
      {error && (
        <p className="text-xs text-[#FF3B30] mt-1">{error}</p>
      )}
    </div>
  );
});

GlassSelect.displayName = 'GlassSelect';

export default GlassSelect;