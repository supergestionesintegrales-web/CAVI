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
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-20 left-4 right-4 z-50 pointer-events-none flex flex-col gap-2 max-w-md mx-auto">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto bg-[#222a3d]/95 backdrop-blur-xl border border-[#3c4a42]/40 rounded-xl p-3.5 shadow-2xl flex items-center justify-between text-[#dae2fd]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  {toast.type === 'alert' ? 'warning' : 'auto_fix_high'}
                </span>
              </div>
              <div className="truncate">
                <p className="font-semibold text-sm text-[#4edea3]">{toast.title}</p>
                <p className="text-xs text-[#bbcabf] truncate">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#bbcabf] hover:text-[#dae2fd] p-1 ml-2 shrink-0 transition-colors"
              aria-label="Cerrar notificación"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
