import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { USER_AVATAR } from '../data/mockData';
import { UserRole, Auditor } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
  userRole?: UserRole;
  onSelectRole?: (role: UserRole) => void;
  activeAuditorId?: string;
  onSelectAuditor?: (id: string) => void;
  auditors?: Auditor[];
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
  onToggleTheme,
  onShowToast,
  userRole = 'administrador',
  onSelectRole,
  activeAuditorId = 'aud-1',
  onSelectAuditor,
  auditors = [],
}) => {
  const [offlineSync, setOfflineSync] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);

  if (!isOpen) return null;

  const isAuxiliar = userRole === 'auxiliar';
  const currentAuditor = auditors.find((a) => a.id === activeAuditorId) || auditors[0];

  const profileName = isAuxiliar && currentAuditor ? currentAuditor.name : 'Ing. Hernán Gómez';
  const profileRoleTitle = isAuxiliar
    ? `Auditor Operativo · Zona ${currentAuditor?.zone || 'Campo'}`
    : 'Director de Operaciones & Compliance';
  const profileId = isAuxiliar && currentAuditor ? currentAuditor.code : 'DIR-001';
  const profileBadge = isAuxiliar ? 'Auxiliar en Terreno' : 'Administrador (Dueño)';
  const profileAvatar = isAuxiliar && currentAuditor?.avatar ? currentAuditor.avatar : USER_AVATAR;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-md bg-[#131b2e] border border-[#2d3449] rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col text-[#dae2fd] max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#222a3d]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0088ff] text-[20px]">
                badge
              </span>
              <h3 className="font-bold text-base text-[#dae2fd]">Perfil &amp; Control de Roles</h3>
            </div>
            <button
              onClick={onClose}
              className="text-[#bbcabf] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* User Profile Card */}
          <div className="py-3 sm:py-4 flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={profileAvatar}
                alt={profileName}
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover shadow-lg ring-4 ${
                  isAuxiliar ? 'ring-[#3131c0]/50' : 'ring-[#0088ff]/40'
                }`}
                referrerPolicy="no-referrer"
              />
              <span
                className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full ring-2 ring-[#131b2e] ${
                  isAuxiliar ? 'bg-[#c0c1ff]' : 'bg-[#4edea3]'
                }`}
              />
            </div>
            <h4 className="font-bold text-base sm:text-lg text-[#dae2fd] mt-2">{profileName}</h4>
            <p className="text-xs text-[#bbcabf]">{profileRoleTitle}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[11px] font-semibold text-[#0088ff]">
                ID: {profileId}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  isAuxiliar
                    ? 'bg-[#3131c0]/30 text-[#c0c1ff] border border-[#3131c0]/40'
                    : 'bg-[#0088ff]/20 text-[#38bdf8] border border-[#0088ff]/40'
                }`}
              >
                {profileBadge}
              </span>
            </div>
          </div>

          {/* RBAC ROLE SELECTOR CARDS */}
          <div className="space-y-2 bg-[#060e20] p-3 rounded-xl border border-[#222a3d]">
            <p className="text-[11px] font-bold text-[#dae2fd] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#0088ff]">admin_panel_settings</span>
              <span>Cambiar Rol del Sistema</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* Card 1: Administrador */}
              <button
                type="button"
                onClick={() => {
                  onSelectRole?.('administrador');
                  onShowToast('Rol Administrador Activado', 'Control total de CAVI, despacho, macros y reportes.', 'success');
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  !isAuxiliar
                    ? 'bg-[#0088ff]/15 border-[#0088ff] text-[#dae2fd] shadow-md'
                    : 'bg-[#131b2e] border-[#222a3d] text-[#bbcabf] hover:border-[#3d455d]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-[18px] ${!isAuxiliar ? 'text-[#0088ff]' : 'text-[#bbcabf]'}`}>
                      verified_user
                    </span>
                    <span className={`text-xs font-bold ${!isAuxiliar ? 'text-[#0088ff]' : 'text-[#dae2fd]'}`}>
                      Administrador
                    </span>
                  </div>
                  {!isAuxiliar && (
                    <span className="w-2 h-2 rounded-full bg-[#0088ff] shadow-[0_0_6px_#0088ff]" />
                  )}
                </div>
                <p className="text-[10px] mt-1 text-[#bbcabf] leading-tight">
                  Dueño del sistema. Control total de todo: CAVI, asignación de rutas y macros.
                </p>
              </button>

              {/* Card 2: Auxiliar */}
              <button
                type="button"
                onClick={() => {
                  onSelectRole?.('auxiliar');
                  onShowToast('Rol Auxiliar Activado', 'Acceso operativo a Rutas, Agenda, Color, Red Comercial y Sensor.', 'info');
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isAuxiliar
                    ? 'bg-[#171f33] border-[#3131c0] text-[#dae2fd] shadow-md ring-1 ring-[#3131c0]'
                    : 'bg-[#131b2e] border-[#222a3d] text-[#bbcabf] hover:border-[#3d455d]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-[18px] ${isAuxiliar ? 'text-[#c0c1ff]' : 'text-[#bbcabf]'}`}>
                      engineering
                    </span>
                    <span className={`text-xs font-bold ${isAuxiliar ? 'text-[#c0c1ff]' : 'text-[#dae2fd]'}`}>
                      Auxiliar (3 Auditores)
                    </span>
                  </div>
                  {isAuxiliar && (
                    <span className="w-2 h-2 rounded-full bg-[#c0c1ff] shadow-[0_0_6px_#c0c1ff]" />
                  )}
                </div>
                <p className="text-[10px] mt-1 text-[#bbcabf] leading-tight">
                  Operativo: Rutas y Agenda. En Config: Color, Red Comercial y Sensor. Sin CAVI ni asignación.
                </p>
              </button>
            </div>

            {/* If Auxiliar: Selector of the 3 Auditors */}
            {isAuxiliar && (
              <div className="mt-2 pt-2 border-t border-[#222a3d]">
                <span className="text-[10px] font-bold text-[#bbcabf] uppercase tracking-wider block mb-1.5">
                  Seleccionar Auditor de Campo (3 Activos):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {auditors.map((aud) => {
                    const isSelected = aud.id === activeAuditorId;
                    return (
                      <button
                        key={aud.id}
                        type="button"
                        onClick={() => {
                          onSelectAuditor?.(aud.id);
                          onShowToast('Auditor Activo', `Sesión iniciada como ${aud.name}`, 'info');
                        }}
                        className={`p-1.5 rounded-lg flex flex-col items-center text-center gap-1 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#3131c0]/40 border-[#3131c0] text-white shadow-sm'
                            : 'bg-[#131b2e] border-[#222a3d] text-[#bbcabf] hover:bg-[#171f33]'
                        }`}
                      >
                        <img
                          src={aud.avatar}
                          alt={aud.name}
                          className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-[#3131c0]"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] font-bold leading-tight truncate w-full">
                          {aud.name.split(' ')[0]}
                        </span>
                        <span className="text-[9px] text-[#bbcabf] font-mono">
                          {aud.zone}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats / System Metrics */}
          <div className="space-y-2 bg-[#060e20] p-3 rounded-xl border border-[#222a3d] text-xs mt-3">
            <div className="flex items-center justify-between">
              <span className="text-[#bbcabf]">Nivel de Permisos</span>
              <span className={`font-bold ${isAuxiliar ? 'text-[#c0c1ff]' : 'text-[#0088ff]'}`}>
                {isAuxiliar ? 'Operativo (Rutas, Agenda, Red, Sensor)' : 'Control Total (Administrador)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#bbcabf]">Territorio Asignado</span>
              <span className="font-bold text-[#dae2fd]">
                {isAuxiliar ? `La Guajira · Zona ${currentAuditor?.zone || 'Norte'}` : 'Nacional (606 Puntos)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#bbcabf]">Acceso a CAVI / Despacho</span>
              <span className={`font-bold ${isAuxiliar ? 'text-[#ffb4ab]' : 'text-[#0088ff]'}`}>
                {isAuxiliar ? 'Bloqueado (Solo Consulta de Ruta)' : 'Habilitado (Despacho con IA)'}
              </span>
            </div>
          </div>

          {/* Settings Toggles */}
          <div className="py-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#dae2fd] font-medium">Sincronización Offline</span>
              <button
                onClick={() => setOfflineSync(!offlineSync)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  offlineSync ? 'bg-[#0088ff]' : 'bg-[#222a3d]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    offlineSync ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#dae2fd] font-medium">Alertas Tácticas Push</span>
              <button
                onClick={() => setPushAlerts(!pushAlerts)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  pushAlerts ? 'bg-[#0088ff]' : 'bg-[#222a3d]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    pushAlerts ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* App Theme Selector */}
            {onToggleTheme && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#222a3d]">
                <div className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-[17px] ${
                    theme === 'dark' ? 'text-[#ffb95f]' : 'text-[#3131c0]'
                  }`}>
                    {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                  </span>
                  <span className="text-[#dae2fd] font-medium">Tema Visual (Color)</span>
                </div>
                <button
                  onClick={onToggleTheme}
                  className="px-2.5 py-1 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-[#dae2fd] flex items-center gap-1.5 transition-all border border-[#2d3449] cursor-pointer"
                >
                  <span>{theme === 'dark' ? 'Oscuro' : 'Blanco'}</span>
                  <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              onShowToast('Caché sincronizada', 'Todos los datos de campo se actualizaron con el servidor CAVI', 'success');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-bold text-[#0088ff] flex items-center justify-center gap-1.5 transition-all mt-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            Forzar Sincronización Completa
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
