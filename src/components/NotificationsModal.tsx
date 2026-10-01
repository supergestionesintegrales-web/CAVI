import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { LeaseDataAlert } from '../utils/dataReconciliation';

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
  alerts?: LeaseDataAlert[];
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onMarkAllRead,
  alerts = [],
}) => {
  const notifications: NotificationItem[] = Array.from(
    new Map(
      alerts.map((a) => [
        `${a.type}|${a.pointCode || ''}|${a.title}|${a.message}`,
        {
          id: a.id,
          time: new Date(a.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          title: a.title,
          message: a.message,
          type: a.severity === 'urgent' ? 'urgent' : a.severity === 'warning' ? 'info' : 'cavi',
          unread: true,
        } as NotificationItem,
      ])
    ).values()
  );


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          data-notification-modal="true"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-6xl bg-[#131b2e] border border-[#2d3449] rounded-2xl p-5 shadow-2xl flex flex-col text-[#dae2fd]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#222a3d]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0088ff]">notifications_active</span>
              <h3 className="font-bold text-base text-[#dae2fd]">Alertas de Campo</h3>
            </div>
            <button
              onClick={onClose}
              className="text-[#bbcabf] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="py-3 max-h-[70vh] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {notifications.length === 0 ? <div className="text-xs text-[#bbcabf] text-center py-8">No hay alertas generadas por actualizaciones de datos.</div> : notifications.map((n) => (
              <div
                key={n.id}
                data-notification-card="true"
                className="push-notification-item p-3 rounded-xl bg-[#171f33] border border-[#222a3d] flex flex-col gap-1 relative shadow-sm"
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
                  <span className="text-[10px] text-[#bbcabf] notification-time">{n.time}</span>
                </div>
                <p className="text-xs text-[#dae2fd] leading-relaxed notification-text">{n.message}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#222a3d] flex items-center justify-between">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-[#0088ff] hover:underline font-semibold cursor-pointer"
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
