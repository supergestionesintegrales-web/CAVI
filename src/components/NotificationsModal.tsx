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
        `${a.type}|${a.code || ''}|${a.title}|${a.message}`,
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
          className="w-full max-w-6xl bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl flex flex-col text-slate-800"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center">
              <h3 className="font-bold text-base text-slate-900">Centro de Alertas</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="py-3 max-h-[70vh] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-stretch">
            {notifications.length === 0 ? <div className="text-xs text-slate-500 text-center py-8">No hay alertas generadas por actualizaciones de datos.</div> : notifications.map((n) => (
              <div
                key={n.id}
                data-notification-card="true"
                className="push-notification-item min-w-0 p-3 rounded-xl bg-white border border-slate-200 flex flex-col gap-1 relative shadow-sm"
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      n.type === 'cavi'
                        ? 'text-indigo-700'
                        : n.type === 'urgent'
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {n.type === 'cavi' ? 'psychology' : n.type === 'urgent' ? 'error' : 'traffic'}
                    </span>
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-500 notification-time">{n.time}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed notification-text">{n.message}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-[#0088ff] hover:underline font-semibold cursor-pointer"
            >
              Marcar todo como leído
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
