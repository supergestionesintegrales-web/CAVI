import React from 'react';
import { TabType } from '../types';
import { LOGO_URL, USER_AVATAR } from '../data/mockData';

interface HeaderProps {
  activeTab: TabType;
  notificationCount: number;
  onSelectTab: (tab: TabType) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  notificationCount,
  onSelectTab,
  onOpenNotifications,
  onOpenProfile,
}) => {
  const navItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'dashboard-cavi', label: 'Dashboard & KPIs', icon: 'auto_awesome_mosaic' },
    { id: 'asignacion-rutas', label: 'Asignación de Rutas', icon: 'alt_route' },
    { id: 'cronograma', label: 'Cronograma', icon: 'calendar_today' },
    { id: 'archivos-macros', label: 'Configuración', icon: 'settings' },
  ];

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-[#0b1326]/90 backdrop-blur-xl border-b border-[#222a3d]/60 shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
      <div className="max-w-7xl mx-auto h-16 md:h-18 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Left: Brand Icon and Name */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => onSelectTab('dashboard-cavi')}
            aria-label="CAVI Inicio"
            title="CAVI"
            className="flex items-center justify-center p-1 rounded-xl hover:bg-[#131b2e] transition-all focus:outline-none active:scale-95 cursor-pointer gap-2"
          >
            <img
              alt="CAVI Logo"
              className="w-8 h-8 md:w-9 md:h-9 object-cover shrink-0 rounded-full"
              src={LOGO_URL}
              referrerPolicy="no-referrer"
            />
            <span className="font-bold text-2xl md:text-3xl tracking-wide leading-none">
              <span className="text-[#0088ff]">CA</span>
              <span className="text-[#0047AB]">VI</span>
            </span>
          </button>
        </div>

        {/* Center: Desktop Navigation Bar - Icons only without names */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#131b2e] p-1.5 rounded-2xl border border-[#222a3d] shadow-inner">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                aria-label={item.label}
                title={item.label}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#10b981] text-[#003824] shadow-md scale-105'
                    : 'text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#171f33] active:scale-95'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right: Quick Actions - Icons only (Settings on mobile, Notifications, Profile) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Config Gear (Icons only) */}
          <button
            onClick={() => onSelectTab('archivos-macros')}
            aria-label="Configuración"
            title="Configuración"
            className={`md:hidden w-10 h-10 flex items-center justify-center rounded-xl transition-all border cursor-pointer ${
              activeTab === 'archivos-macros'
                ? 'bg-[#10b981] text-[#003824] border-[#4edea3]'
                : 'bg-[#131b2e] text-[#dae2fd] hover:bg-[#171f33] border-[#222a3d]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              settings
            </span>
          </button>

          {/* Notification Icon Button */}
          <button
            onClick={onOpenNotifications}
            aria-label="Notificaciones"
            title="Notificaciones"
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[#131b2e] text-[#dae2fd] hover:bg-[#171f33] active:scale-95 transition-all border border-[#222a3d] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-[#ffb4ab] text-[#690005] text-[9px] font-bold ring-2 ring-[#0b1326]">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Profile Icon Trigger (Avatar only, no name labels) */}
          <button
            onClick={onOpenProfile}
            aria-label="Perfil de usuario"
            title="Perfil de Usuario"
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#131b2e] transition-colors focus:outline-none active:scale-95 cursor-pointer"
          >
            <img
              alt="Profile"
              className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover ring-2 ring-[#4edea3]/40"
              src={USER_AVATAR}
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
