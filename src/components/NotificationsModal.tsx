import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationItem {
  id: string;
  time: string;
  title: string;
  message: string;
  type: 'urgent' | 'info' | 'cavi';
  unread: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onMarkAllRead,
}) => {
  const notifications: NotificationItem[] = [
    {
      id: 'n-1',
      time: '09:15 AM',
      title: 'Cambio de horario en CDA Norte',
      message: 'Cierre por inventario imprevisto. CAVI reordenó la ruta de Samuel Ramos automáticamente.',
      type: 'cavi',
      unread: true,
    },
    {
      id: 'n-2',
      time: '08:00 AM',
      title: 'Congestión en Autopista Norte',
      message: 'Tramo Calle 134 a 170 saturado. Desvío asistido por Cra 19 ahorra 18 min de traslado.',
      type: 'info',
      unread: true,
    },
    {
      id: 'n-3',
      time: 'Ayer 17:30',
      title: 'Alerta de SLA Urgente',
      message: 'Punto CM-102 Compumueble Tintal supera 81 días sin auditoría física documentada.',
      type: 'urgent',
      unread: true,
    },
  ];

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
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4edea3]">notifications_active</span>
              <h3 className="font-bold text-base text-[#dae2fd]">Alertas de Campo</h3>
            </div>
            <button
              onClick={onClose}
              className="text-[#bbcabf] hover:text-white p-1 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="py-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-xl bg-[#171f33] border border-[#222a3d] flex flex-col gap-1 relative"
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      n.type === 'cavi'
                        ? 'text-[#c0c1ff]'
                        : n.type === 'urgent'
                        ? 'text-[#ffb4ab]'
                        : 'text-[#ffb95f]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {n.type === 'cavi' ? 'psychology' : n.type === 'urgent' ? 'error' : 'traffic'}
                    </span>
                    {n.title}
                  </span>
                  <span className="text-[10px] text-[#bbcabf]">{n.time}</span>
                </div>
                <p className="text-xs text-[#dae2fd] leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#222a3d] flex items-center justify-between">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-[#4edea3] hover:underline font-semibold"
            >
              Marcar todo como leído
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-[#dae2fd] transition-colors"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
