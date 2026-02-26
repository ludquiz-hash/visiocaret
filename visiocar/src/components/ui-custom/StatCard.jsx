import React from 'react';
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from 'lucide-react';
import GlassCard from './GlassCard';

export default function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "blue",
  className 
}) {
  const colors = {
    blue: {
      icon: "text-[#007AFF]",
      bg: "bg-[#007AFF]/10",
      glow: "shadow-[0_0_40px_rgba(0,122,255,0.15)]"
    },
    green: {
      icon: "text-[#34C759]",
      bg: "bg-[#34C759]/10",
      glow: "shadow-[0_0_40px_rgba(52,199,89,0.15)]"
    },
    orange: {
      icon: "text-[#FF9F0A]",
      bg: "bg-[#FF9F0A]/10",
      glow: "shadow-[0_0_40px_rgba(255,159,10,0.15)]"
    },
    purple: {
      icon: "text-[#BF5AF2]",
      bg: "bg-[#BF5AF2]/10",
      glow: "shadow-[0_0_40px_rgba(191,90,242,0.15)]"
    }
  };

  const colorSet = colors[color];

  return (
    <GlassCard 
      hover 
      className={cn(
        "p-5 overflow-hidden",
        colorSet.glow,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-white/50 font-medium">{title}</p>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-white/40">{subtitle}</p>
            )}
          </div>
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend === "up" ? "bg-[#34C759]/10 text-[#34C759]" : "bg-[#FF3B30]/10 text-[#FF3B30]"
            )}>
              {trend === "up" ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trendValue}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-xl", colorSet.bg)}>
            <Icon className={cn("w-6 h-6", colorSet.icon)} />
          </div>
        )}
      </div>
    </GlassCard>
  );
}