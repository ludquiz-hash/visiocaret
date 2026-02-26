import React from 'react';
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react';

export default function GlassButton({ 
  children, 
  className, 
  variant = "primary",
  size = "default",
  loading = false,
  disabled = false,
  icon: Icon,
  ...props 
}) {
  const variants = {
    primary: "bg-[#007AFF] hover:bg-[#0056CC] text-white shadow-[0_4px_20px_rgba(0,122,255,0.4)] hover:shadow-[0_6px_30px_rgba(0,122,255,0.5)]",
    secondary: "bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.1] hover:border-white/[0.2]",
    success: "bg-[#34C759] hover:bg-[#2DA44E] text-white shadow-[0_4px_20px_rgba(52,199,89,0.4)]",
    danger: "bg-[#FF3B30]/20 hover:bg-[#FF3B30]/30 text-[#FF3B30] border border-[#FF3B30]/30",
    ghost: "bg-transparent hover:bg-white/[0.06] text-white/70 hover:text-white",
    outline: "bg-transparent border border-[#007AFF]/50 text-[#007AFF] hover:bg-[#007AFF]/10 hover:border-[#007AFF]"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
    default: "px-5 py-2.5 text-sm rounded-xl gap-2",
    lg: "px-7 py-3.5 text-base rounded-xl gap-2.5",
    icon: "p-2.5 rounded-xl"
  };

  return (
    <button 
      className={cn(
        "relative inline-flex items-center justify-center font-medium transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        "active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className={cn("w-4 h-4", size === "lg" && "w-5 h-5")} />
      ) : null}
      {children}
    </button>
  );
}