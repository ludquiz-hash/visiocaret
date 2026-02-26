import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FileText, 
  Plus,
  Settings, 
  CreditCard,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Car,
  HelpCircle,
  Building2,
  TestTube
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ThemeToggle from './ThemeToggle';

const menuItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: 'Dashboard' },
  { id: 'claims', label: 'Dossiers', icon: FileText, path: 'Claims' },
  { id: 'new-claim', label: 'Nouveau dossier', icon: Plus, path: 'ClaimWizard', highlight: true },
  { id: 'team', label: 'Équipe', icon: Users, path: 'Team' },
  { id: 'billing', label: 'Abonnement', icon: CreditCard, path: 'Billing' },
  { id: 'garage', label: 'Mon garage', icon: Building2, path: 'GarageSettings' },
  { id: 'settings', label: 'Paramètres', icon: Settings, path: 'Settings' },
];

export default function Sidebar({ currentPage, user, garage, theme, onToggleTheme }) {
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40",
        "bg-[#0B0E14]/95 backdrop-blur-xl border-r border-white/[0.06]",
        "transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#0056CC] flex items-center justify-center shadow-lg shadow-[#007AFF]/20">
              <Car className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">VisiWebCar</h1>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Expert Vision</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = currentPage === item.path;
              const Icon = item.icon;
              
              return (
                <li key={item.id}>
                  <Link
                    to={createPageUrl(item.path)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                      "transition-all duration-200",
                      isActive 
                        ? "bg-[#007AFF]/15 text-[#007AFF] shadow-lg shadow-[#007AFF]/10" 
                        : "text-white/60 hover:text-white hover:bg-white/[0.06]",
                      item.highlight && !isActive && "bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Garage Info */}
        {garage && !collapsed && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-xs text-white/40 mb-1">Garage actif</p>
            <p className="text-sm font-medium text-white truncate">{garage.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                garage.is_subscribed ? "bg-[#34C759]" : "bg-[#FF9F0A]"
              )} />
              <span className="text-xs text-white/50">
                {garage.is_subscribed ? `Plan ${garage.plan_type}` : "Période d'essai"}
              </span>
            </div>
          </div>
        )}

        {/* Theme Toggle */}
        {!collapsed && (
          <div className="px-3 mb-2">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        )}

        {/* User & Logout */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl",
            collapsed && "justify-center px-0"
          )}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#007AFF]/30 to-[#BF5AF2]/30 flex items-center justify-center border border-white/10">
              <span className="text-sm font-medium text-white">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.full_name || 'Utilisateur'}
                </p>
                <p className="text-xs text-white/40 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors mt-1",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-[#151921] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-t border-white/[0.06] px-2 py-2 safe-area-pb">
        <div className="flex items-center justify-around">
          {menuItems.slice(0, 5).map((item) => {
            const isActive = currentPage === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                to={createPageUrl(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors",
                  isActive ? "text-[#007AFF]" : "text-white/40"
                )}
              >
                <Icon className={cn("w-5 h-5", item.highlight && !isActive && "text-[#007AFF]")} />
                <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}