import React, { useState, useRef, useEffect } from 'react';
import { TabType, UserRole, Auditor } from '../types';
import { LOGO_URL, USER_AVATAR } from '../data/mockData';

interface HeaderProps {
  activeTab: TabType;
  notificationCount: number;
  onSelectTab: (tab: TabType) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  userRole?: UserRole;
  onSelectRole?: (role: UserRole) => void;
  activeAuditorId?: string;
  onSelectAuditor?: (id: string) => void;
  auditors?: Auditor[];
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  notificationCount,
  onSelectTab,
  onOpenNotifications,
  onOpenProfile,
  userRole = 'administrador',
  onSelectRole,
  activeAuditorId = 'aud-1',
  onSelectAuditor,
  auditors = [],
  theme = 'dark',
  onToggleTheme,
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAuxiliar = userRole === 'auxiliar';
  const currentAuditor = auditors.find((a) => a.id === activeAuditorId) || auditors[0];

  const allNavItems: { id: TabType; label: string; icon: string; adminOnly?: boolean }[] = [
    { id: 'dashboard-cavi', label: 'Dashboard & KPIs (Admin)', icon: 'auto_awesome_mosaic', adminOnly: true },
    { id: 'asignacion-rutas', label: isAuxiliar ? 'Mis Rutas y Agenda' : 'Rutas y Cronograma', icon: 'alt_route' },
    { id: 'archivos-macros', label: 'Configuración', icon: 'settings' },
  ];

  const navItems = allNavItems.filter((item) => !item.adminOnly || !isAuxiliar);

  const activeAvatar = isAuxiliar && currentAuditor?.avatar ? currentAuditor.avatar : USER_AVATAR;

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-[#0b1326]/90 backdrop-blur-xl border-b border-[#222a3d]/60 shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
      <div className="max-w-7xl mx-auto h-16 md:h-18 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Left: Brand Icon and Name */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => onSelectTab(isAuxiliar ? 'asignacion-rutas' : 'dashboard-cavi')}
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

        {/* Center: Desktop Navigation Bar */}
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
                    ? 'bg-[#0088ff] text-white shadow-md shadow-[#0088ff]/30 scale-105'
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

        {/* Right: Quick Actions (Role Switcher, Notifications, Profile) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Interactive Role Switcher Pill / Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              aria-label="Cambiar Rol de Usuario"
              title="Cambiar Rol (Administrador / Auxiliar)"
              className={`h-9 md:h-10 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 transition-all border cursor-pointer text-xs font-bold ${
                isAuxiliar
                  ? 'bg-[#171f33] text-[#c0c1ff] border-[#3131c0]/50 hover:bg-[#222a3d]'
                  : 'bg-[#0088ff]/15 text-[#0088ff] border-[#0088ff]/40 hover:bg-[#0088ff]/25'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {isAuxiliar ? 'engineering' : 'verified_user'}
              </span>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[11px] font-bold">
                  {isAuxiliar ? 'Auxiliar' : 'Admin'}
                </span>
                <span className="text-[9px] text-[#bbcabf] hidden sm:inline max-w-[90px] truncate">
                  {isAuxiliar ? (currentAuditor?.name?.split(' ')[0] || 'Auditor') : 'Dueño Total'}
                </span>
              </div>
              <span className="material-symbols-outlined text-[15px] text-[#bbcabf]">
                {isRoleDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
              </span>
            </button>

            {/* Role Switcher Menu */}
            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#131b2e] border border-[#2d3449] rounded-2xl shadow-2xl p-2 z-50 text-[#dae2fd] animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 border-b border-[#222a3d] mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#bbcabf]">
                    Control de Acceso (RBAC)
                  </p>
                  <p className="text-xs text-[#dae2fd] font-semibold">
                    Selecciona tu perfil en CAVI
                  </p>
                </div>

                {/* Role 1: Administrador */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectRole?.('administrador');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-start gap-2.5 transition-colors text-left cursor-pointer ${
                    !isAuxiliar
                      ? 'bg-[#0088ff]/15 border border-[#0088ff]/50 text-white'
                      : 'hover:bg-[#171f33] text-[#dae2fd]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0088ff]/25 flex items-center justify-center text-[#0088ff] shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Administrador</span>
                      {!isAuxiliar && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] border border-[#4edea3]/30">
                          Activo
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#bbcabf] mt-0.5">
                      Dueño del sistema · Control total de CAVI, despacho, macros y reportes
                    </p>
                  </div>
                </button>

                {/* Role 2: Auxiliar (Auditores de Campo) */}
                <div className="mt-1 pt-1 border-t border-[#222a3d]">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectRole?.('auxiliar');
                      if (activeTab === 'dashboard-cavi') {
                        onSelectTab('asignacion-rutas');
                      }
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-start gap-2.5 transition-colors text-left cursor-pointer ${
                      isAuxiliar
                        ? 'bg-[#171f33] border border-[#3131c0]/60 text-[#c0c1ff]'
                        : 'hover:bg-[#171f33] text-[#dae2fd]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#3131c0]/20 flex items-center justify-center text-[#c0c1ff] shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">engineering</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">Auxiliar (Auditores)</span>
                        {isAuxiliar && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#3131c0]/40 text-[#c0c1ff]">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#bbcabf] mt-0.5">
                        Auditores (3 activos) · Solo Rutas, Agenda y Configuración Básica (Color, Red, Sensor)
                      </p>
                    </div>
                  </button>

                  {/* Auditor Selector for Auxiliar Role */}
                  {isAuxiliar && auditors.length > 0 && (
                    <div className="mt-2 p-2 bg-[#060e20] rounded-xl border border-[#222a3d] space-y-1">
                      <p className="text-[9px] font-bold text-[#bbcabf] uppercase tracking-wider px-1">
                        Auditor Asignado (3 Disponibles):
                      </p>
                      {auditors.map((aud) => {
                        const isCurrent = aud.id === activeAuditorId;
                        return (
                          <button
                            key={aud.id}
                            type="button"
                            onClick={() => {
                              onSelectAuditor?.(aud.id);
                              setIsRoleDropdownOpen(false);
                            }}
                            className={`w-full px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-[#3131c0] text-white font-bold'
                                : 'hover:bg-[#171f33] text-[#bbcabf]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <img
                                src={aud.avatar}
                                alt={aud.name}
                                className="w-5 h-5 rounded-full object-cover shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <span className="truncate">{aud.name}</span>
                            </div>
                            <span className="text-[10px] opacity-80 shrink-0 font-mono">
                              {aud.zone}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Config Gear */}
          <button
            onClick={() => onSelectTab('archivos-macros')}
            aria-label="Configuración"
            title="Configuración"
            className={`md:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all border cursor-pointer ${
              activeTab === 'archivos-macros'
                ? 'bg-[#0088ff] text-white border-[#0088ff] shadow-md shadow-[#0088ff]/30'
                : 'bg-[#131b2e] text-[#dae2fd] hover:bg-[#171f33] border-[#222a3d]'
            }`}
          >
            <span className="material-symbols-outlined text-[19px]">
              settings
            </span>
          </button>

          {/* Quick Theme Toggle Button (Sol/Luna) */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              type="button"
              aria-label={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
              title={theme === 'light' ? 'Cambiar a Modo Oscuro (Nocturno Táctico)' : 'Cambiar a Modo Claro (Diurno / Blanco)'}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-[#131b2e] text-[#dae2fd] hover:bg-[#171f33] active:scale-95 transition-all border border-[#222a3d] cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[19px] transition-transform ${theme === 'light' ? 'text-[#f59e0b]' : 'text-[#38bdf8]'}`}>
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
          )}

          {/* Notification Icon Button */}
          <button
            onClick={onOpenNotifications}
            aria-label="Notificaciones"
            title="Notificaciones"
            className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-[#131b2e] text-[#dae2fd] hover:bg-[#171f33] active:scale-95 transition-all border border-[#222a3d] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px]">notifications</span>
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-[#ffb4ab] text-[#690005] text-[9px] font-bold ring-2 ring-[#0b1326]">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Profile Icon Trigger (Avatar reflects active profile) */}
          <button
            onClick={onOpenProfile}
            aria-label="Perfil de usuario"
            title={`Perfil: ${isAuxiliar ? currentAuditor?.name || 'Auxiliar' : 'Administrador'}`}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-[#131b2e] transition-colors focus:outline-none active:scale-95 cursor-pointer"
          >
            <img
              alt="Profile"
              className={`w-8 h-8 rounded-full object-cover ring-2 ${
                isAuxiliar ? 'ring-[#c0c1ff]/60' : 'ring-[#0088ff]/60'
              }`}
              src={activeAvatar}
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
