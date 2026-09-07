import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface UploadProgressState {
  isActive: boolean;
  isComplete: boolean;
  percent: number;
  current: number;
  total: number;
  fileName: string;
  stage: string;
  errorCount?: number;
}

interface ProcessingProgressBarProps {
  progress: UploadProgressState;
  onDismiss: () => void;
}

export const ProcessingProgressBar: React.FC<ProcessingProgressBarProps> = ({
  progress,
  onDismiss,
}) => {
  if (!progress.isActive && !progress.isComplete) return null;

  const isDone = progress.percent >= 100 || progress.isComplete;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        className={`w-full rounded-2xl p-4 sm:p-5 border transition-all shadow-xl overflow-hidden ${
          isDone
            ? 'bg-[#0088ff]/15 border-[#0088ff]/60 shadow-[0_0_25px_rgba(0,136,255,0.2)]'
            : 'bg-[#131b2e] border-[#31394d] shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
        }`}
      >
        {/* Header with Title, Status & Percentage */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                isDone
                  ? 'bg-[#0088ff] text-white border-[#38bdf8]'
                  : 'bg-[#0088ff]/20 text-[#0088ff] border-[#0088ff]/30'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${!isDone ? 'animate-spin' : ''}`}>
                {isDone ? 'check_circle' : 'progress_activity'}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-headline font-bold text-sm text-[#dae2fd]">
                  {isDone
                    ? 'Procesamiento e Indexación Completada'
                    : 'Cargando y Procesando Información...'}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                    isDone
                      ? 'bg-[#0088ff]/20 text-[#38bdf8] border-[#0088ff]/40'
                      : 'bg-[#3131c0]/30 text-[#c0c1ff] border-[#3131c0]/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isDone ? 'bg-[#38bdf8]' : 'bg-[#c0c1ff] animate-ping'
                    }`}
                  />
                  {isDone ? '100% Finalizado' : `Archivo ${progress.current} de ${progress.total}`}
                </span>
              </div>
              <p className="text-xs text-[#bbcabf] truncate mt-0.5" title={progress.fileName}>
                {isDone
                  ? `Se indexaron ${progress.total} archivo(s) al repositorio de La Guajira.`
                  : `Procesando: ${progress.fileName || 'Analizando estructura...'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Percent Badge */}
            <div className="text-right">
              <span className="font-mono font-black text-lg md:text-xl text-[#0088ff] tracking-tight">
                {Math.min(100, Math.max(0, progress.percent))}%
              </span>
            </div>

            {/* Dismiss Button when done */}
            {isDone && (
              <button
                type="button"
                onClick={onDismiss}
                className="px-3 py-1.5 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <span>Cerrar</span>
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* The Animated Progress Bar */}
        <div className="relative w-full h-3.5 bg-[#060e20] rounded-full p-0.5 border border-[#222a3d] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#0088ff] via-[#38bdf8] to-[#60a5fa] shadow-[0_0_12px_rgba(0,136,255,0.6)] relative"
            style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Shimmer light effect running across */}
            {!isDone && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite] -skew-x-12" />
            )}
          </motion.div>
        </div>

        {/* Stepper Pipeline Indicators */}
        <div className="mt-3 pt-3 border-t border-[#222a3d]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-[#bbcabf] truncate">
            <span className="material-symbols-outlined text-[15px] text-[#0088ff]">
              {isDone ? 'task_alt' : 'hourglass_top'}
            </span>
            <span className="text-[11px] font-medium truncate">
              {progress.stage || 'Iniciando verificación de datos...'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#bbcabf] shrink-0">
            <span
              className={`px-2 py-0.5 rounded ${
                progress.percent >= 25 ? 'bg-[#0088ff]/20 text-[#38bdf8] font-bold border border-[#0088ff]/30' : 'bg-[#171f33]'
              }`}
            >
              1. Lectura binaria
            </span>
            <span>→</span>
            <span
              className={`px-2 py-0.5 rounded ${
                progress.percent >= 60 ? 'bg-[#0088ff]/20 text-[#38bdf8] font-bold border border-[#0088ff]/30' : 'bg-[#171f33]'
              }`}
            >
              2. Tablas &amp; Metadatos
            </span>
            <span>→</span>
            <span
              className={`px-2 py-0.5 rounded ${
                progress.percent >= 90 ? 'bg-[#0088ff]/20 text-[#38bdf8] font-bold border border-[#0088ff]/30' : 'bg-[#171f33]'
              }`}
            >
              3. Paradas &amp; SLAs
            </span>
            <span>→</span>
            <span
              className={`px-2 py-0.5 rounded ${
                isDone ? 'bg-[#0088ff]/20 text-[#38bdf8] font-bold border border-[#0088ff]/30' : 'bg-[#171f33]'
              }`}
            >
              4. CAVI Sync
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
