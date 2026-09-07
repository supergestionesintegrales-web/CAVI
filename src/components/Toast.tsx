import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastData {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'alert';
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
  theme?: 'light' | 'dark';
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss, theme }) => {
  const isLight =
    theme === 'light' ||
    (typeof document !== 'undefined' &&
      (document.documentElement.getAttribute('data-theme') === 'light' ||
        document.documentElement.classList.contains('theme-light')));

  return (
    <div className="fixed top-20 left-4 right-4 z-50 pointer-events-none flex flex-col gap-2 max-w-md mx-auto">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isAlert = toast.type === 'alert';
          const isInfo = toast.type === 'info';

          return (
            <motion.div
              key={toast.id}
              data-push-toast="true"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`pointer-events-auto push-toast-card rounded-2xl p-3.5 shadow-2xl flex items-center justify-between border transition-all ${
                isLight
                  ? 'bg-white border-slate-200/90 text-slate-800 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.12)]'
                  : 'bg-[#171f33]/95 backdrop-blur-xl border-[#222a3d] text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isAlert
                      ? isLight
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-[#b45309]/30 text-[#fcd34d] border-[#f59e0b]/30'
                      : isInfo
                      ? isLight
                        ? 'bg-sky-100 text-sky-800 border-sky-200'
                        : 'bg-[#0284c7]/30 text-[#38bdf8] border-[#38bdf8]/30'
                      : isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-[#10b981]/20 text-[#4edea3] border-[#4edea3]/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">
                    {isAlert ? 'warning' : isInfo ? 'info' : 'check_circle'}
                  </span>
                </div>
                <div className="truncate">
                  <p
                    className={`font-bold text-sm tracking-tight ${
                      isAlert
                        ? isLight
                          ? 'text-amber-900'
                          : 'text-[#fcd34d]'
                        : isInfo
                        ? isLight
                          ? 'text-sky-950'
                          : 'text-[#38bdf8]'
                        : isLight
                        ? 'text-emerald-950'
                        : 'text-[#4edea3]'
                    }`}
                  >
                    {toast.title}
                  </p>
                  <p
                    className={`text-xs truncate font-medium ${
                      isLight ? 'text-slate-600' : 'text-[#cbd5e1]'
                    }`}
                  >
                    {toast.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className={`p-1.5 ml-2 shrink-0 rounded-lg transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                    : 'text-[#cbd5e1] hover:text-white hover:bg-[#222a3d]'
                }`}
                aria-label="Cerrar notificación"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
