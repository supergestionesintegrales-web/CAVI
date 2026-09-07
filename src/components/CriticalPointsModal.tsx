import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CriticalPoint } from '../types';
import { CRITICAL_POINTS_LIST } from '../data/mockData';

interface CriticalPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignPoint: (code: string, auditor: string) => void;
}

export const CriticalPointsModal: React.FC<CriticalPointsModalProps> = ({
  isOpen,
  onClose,
  onAssignPoint,
}) => {
  const [filterFormat, setFilterFormat] = useState<'ALL' | 'CM' | 'PF' | 'CDA'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredPoints = CRITICAL_POINTS_LIST.filter((point) => {
    const matchesFormat = filterFormat === 'ALL' || point.format === filterFormat;
    const matchesSearch =
      point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFormat && matchesSearch;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-[#131b2e] border border-[#2d3449] rounded-2xl p-5 shadow-2xl flex flex-col text-[#dae2fd] max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#222a3d]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb4ab]">crisis_alert</span>
              <div>
                <h3 className="font-bold text-base text-[#dae2fd]">
                  Puntos Críticos en Mora (&gt;75 días)
                </h3>
                <p className="text-xs text-[#bbcabf]">
                  14 puntos fuera de ciclo regulatorio de 60-90 días
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#bbcabf] hover:text-white p-1 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="py-3 flex flex-col gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#bbcabf] text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, código o dirección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060e20] text-xs text-[#dae2fd] placeholder-[#bbcabf]/60 border border-[#222a3d] focus:outline-none focus:border-[#0088ff]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {(['ALL', 'CM', 'PF', 'CDA'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFilterFormat(fmt)}
                  className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                    filterFormat === fmt
                      ? 'bg-[#0088ff] text-white shadow shadow-[#0088ff]/25'
                      : 'bg-[#171f33] text-[#bbcabf] hover:text-white'
                  }`}
                >
                  {fmt === 'ALL' ? 'Todos los Formatos' : fmt}
                </button>
              ))}
            </div>
          </div>

          {/* List of critical points */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1">
            {filteredPoints.length === 0 ? (
              <div className="text-center py-8 text-[#bbcabf] text-xs">
                No se encontraron puntos con los filtros seleccionados
              </div>
            ) : (
              filteredPoints.map((point: CriticalPoint) => (
                <div
                  key={point.id}
                  className="bg-[#171f33] p-3 rounded-xl border border-[#222a3d] hover:border-[#0088ff]/40 transition-colors flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          point.format === 'CM'
                            ? 'bg-[#083344] text-[#22D3EE]'
                            : point.format === 'PF'
                            ? 'bg-[#082F49] text-[#38BDF8]'
                            : 'bg-[#3B0764] text-[#C084FC]'
                        }`}
                      >
                        {point.format}
                      </span>
                      <span className="font-bold text-sm text-[#dae2fd] truncate">
                        {point.code} {point.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#ffb4ab] shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]"></span>
                      Hace {point.daysPending} días
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#bbcabf]">
                    <span className="truncate">{point.address} • {point.zone}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        point.priority === 'Alta'
                          ? 'bg-[#ffb4ab]/15 text-[#ffb4ab]'
                          : 'bg-[#ffb95f]/15 text-[#ffb95f]'
                      }`}
                    >
                      {point.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#222a3d]/60 text-xs">
                    <span className="text-[11px] text-[#bbcabf]">
                      Última visita: {point.lastAuditedDate}
                    </span>
                    <button
                      onClick={() => {
                        onAssignPoint(point.code, 'Samuel Ramos Quintero');
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#222a3d] hover:bg-[#0088ff] hover:text-white text-[#38bdf8] font-semibold text-[11px] transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">add_task</span>
                      Asignar a Ruta
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#222a3d] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-[#dae2fd] transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
