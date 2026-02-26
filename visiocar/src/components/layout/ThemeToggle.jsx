import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ThemeToggle({ theme, onToggle, className }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "group relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
        "hover:bg-white/[0.06] dark:hover:bg-white/[0.06]",
        "bg-white/[0.03] dark:bg-white/[0.03]",
        className
      )}
      aria-label="Basculer le thème"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-[#FF9F0A] transition-transform group-hover:rotate-12" />
        ) : (
          <Moon className="w-5 h-5 text-[#007AFF] transition-transform group-hover:-rotate-12" />
        )}
      </div>
      <span className="text-sm font-medium text-white dark:text-white light:text-gray-900">
        {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      </span>
    </button>
  );
}