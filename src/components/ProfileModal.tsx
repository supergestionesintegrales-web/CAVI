import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { USER_AVATAR } from '../data/mockData';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onShowToast: (title: string, message: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
  onToggleTheme,
  onShowToast,
}) => {
  const [offlineSync, setOfflineSync] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-sm bg-[#131b2e] border border-[#2d3449] rounded-2xl p-5 shadow-2xl flex flex-col text-[#dae2fd]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#222a3d]">
            <h3 className="font-bold text-base text-[#dae2fd]">Perfil Operativo</h3>
            <button
              onClick={onClose}
              className="text-[#bbcabf] hover:text-white p-1 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="py-4 flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={USER_AVATAR}
                alt="Supervisor Profile"
                className="w-18 h-18 rounded-full object-cover ring-4 ring-[#4edea3]/30 shadow-lg"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#4edea3] ring-2 ring-[#131b2e]" />
            </div>
            <h4 className="font-bold text-lg text-[#dae2fd] mt-2">Ing. Hernán Gómez</h4>
            <p className="text-xs text-[#bbcabf]">Director de Operaciones &amp; Compliance</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[11px] font-semibold text-[#4edea3]">
                ID: DIR-001
              </span>
              <span className="px-2 py-0.5 rounded bg-[#3131c0]/30 text-[11px] font-semibold text-[#c0c1ff]">
                CAVI SuperAdmin
              </span>
            </div>
          </div>

          <div className="space-y-2.5 bg-[#060e20] p-3 rounded-xl border border-[#222a3d] text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#bbcabf]">Motor de Optimización</span>
              <span className="font-bold text-[#4edea3]">CAVI Engine v4.2.1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#bbcabf]">Ciclo Actual</span>
              <span className="font-bold text-[#dae2fd]">Q3 Consolidado (Semana 42)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#bbcabf]">Cobertura Nacional</span>
              <span className="font-bold text-[#ffb95f]">606 Puntos Activos</span>
            </div>
          </div>

          <div className="py-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#dae2fd] font-medium">Sincronización Offline</span>
              <button
                onClick={() => setOfflineSync(!offlineSync)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                  offlineSync ? 'bg-[#10b981]' : 'bg-[#222a3d]'
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
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                  pushAlerts ? 'bg-[#10b981]' : 'bg-[#222a3d]'
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
                  <span className="text-[#dae2fd] font-medium">Tema Visual</span>
                </div>
                <button
                  onClick={onToggleTheme}
                  className="px-2.5 py-1 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-[#dae2fd] flex items-center gap-1.5 transition-all border border-[#2d3449]"
                >
                  <span>{theme === 'dark' ? 'Oscuro' : 'Blanco'}</span>
                  <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              onShowToast('Caché sincronizada', 'Todos los datos de campo se actualizaron con la nube');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-bold text-[#4edea3] flex items-center justify-center gap-1.5 transition-all mt-1"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            Forzar Sincronización Completa
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
