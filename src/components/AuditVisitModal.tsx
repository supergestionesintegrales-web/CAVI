import React, { useState } from 'react';
import { RouteStep, VisitRecord } from '../types';

interface AuditVisitModalProps {
  isOpen: boolean;
  step: RouteStep | null;
  currentAuditorName?: string;
  onClose: () => void;
  onSaveAudit: (
    stepId: string,
    result: {
      status: 'completed' | 'not_audited' | 'revisit_needed' | 'in_progress' | 'pending';
      auditReason?: string;
      notes?: string;
      visitCount: number;
    }
  ) => void;
}

const NOT_AUDITED_REASONS = [
  'Local Cerrado',
  'Encargado / Administrador Ausente',
  'Rechazo de Toma de Datos',
  'Dirección No Localizada / Inexistente',
  'Zona Peligrosa / Acceso Restringido',
  'Fuerza Mayor / Clima',
  'Otro motivo',
];

const REVISIT_REASONS = [
  'Inventario Incompleto / En Descarga',
  'Volver en Turno de la Tarde',
  'Solicitaron Cita Previa con Gerencia',
  'Discrepancia de Precios por Aclarar',
  'Pendiente Conteo Físico en Bodega',
  'Re-visita Solicitada por Supervisor',
  'Otro motivo',
];

const AUDITED_NOTES_SUGGESTIONS = [
  'Auditoría completada al 100% sin discrepancias',
  'Inventario y precios verificados conforme',
  'Novedades menores resueltas en sitio',
  'Exhibición y material POP verificado',
];

export const AuditVisitModal: React.FC<AuditVisitModalProps> = ({
  isOpen,
  step,
  currentAuditorName = 'Auditor de Campo',
  onClose,
  onSaveAudit,
}) => {
  if (!isOpen || !step) return null;

  // Map existing step status to initial modal state
  const initialAuditType =
    step.status === 'completed'
      ? 'completed'
      : step.status === 'not_audited'
      ? 'not_audited'
      : step.status === 'revisit_needed'
      ? 'revisit_needed'
      : step.status === 'in_progress'
      ? 'in_progress'
      : 'completed';

  const [selectedStatus, setSelectedStatus] = useState<
    'completed' | 'not_audited' | 'revisit_needed' | 'in_progress' | 'pending'
  >(initialAuditType);

  const [reason, setReason] = useState<string>(
    step.auditReason ||
      (step.status === 'not_audited' ? NOT_AUDITED_REASONS[0] : REVISIT_REASONS[0])
  );
  const [customReason, setCustomReason] = useState<string>('');
  const [notes, setNotes] = useState<string>(step.notes || '');
  
  // Visit counter: starts at current visitCount or defaults to 1 if marking an active visit
  const [visitCount, setVisitCount] = useState<number>(() => {
    if (step.visitCount && step.visitCount > 0) return step.visitCount;
    return step.status === 'completed' || step.status === 'not_audited' || step.status === 'revisit_needed' ? 1 : 1;
  });

  const handleIncrementVisit = () => setVisitCount((prev) => prev + 1);
  const handleDecrementVisit = () => setVisitCount((prev) => Math.max(1, prev - 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalReason: string | undefined = undefined;
    if (selectedStatus === 'not_audited' || selectedStatus === 'revisit_needed') {
      finalReason = reason === 'Otro motivo' ? (customReason.trim() || 'No especificado') : reason;
    }

    onSaveAudit(step.id, {
      status: selectedStatus,
      auditReason: finalReason,
      notes: notes.trim(),
      visitCount,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#222a3d] rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#222a3d] flex items-center justify-between bg-slate-50 dark:bg-[#0f172a]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-[#0088ff]/20 text-[#0088ff] flex items-center justify-center border border-blue-200 dark:border-[#0088ff]/30">
              <span className="material-symbols-outlined text-[22px]">assignment_turned_in</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Control de Visita y Auditoría
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#94a3b8]">
                Registro de resultado de visita de campo y contador
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-[#1e293b] text-slate-500 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* POINT SUMMARY CARD */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#222a3d]">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  step.format === 'CM'
                    ? 'bg-[#0284c7] text-white'
                    : step.format === 'PF'
                    ? 'bg-[#7c3aed] text-white'
                    : 'bg-[#0088ff] text-white'
                }`}>
                  {step.code}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {step.name}
                </h4>
              </div>

              {/* Existing visit count pill */}
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-[#0088ff]/20 text-blue-900 dark:text-[#38bdf8] text-[11px] font-mono font-bold border border-blue-200 dark:border-[#0088ff]/40 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">pin_drop</span>
                <span>{step.visitCount ? `${step.visitCount} visita(s) previa(s)` : '1ra visita'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#cbd5e1] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#0088ff]">location_on</span>
              <span>{step.address} · {step.municipality || 'La Guajira'}</span>
            </p>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-[#222a3d] text-[11px] text-slate-600 dark:text-[#94a3b8]">
              <span>Auditor asignado: <strong className="text-slate-900 dark:text-white font-semibold">{step.auditorName || currentAuditorName}</strong></span>
              <span>Horario ruta: <strong className="font-mono text-slate-800 dark:text-[#fcd34d]">{step.time}</strong></span>
            </div>
          </div>

          {/* VISIT COUNTER (CUÁNTAS VECES SE VISITÓ) */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-[#0088ff]/10 border border-blue-200 dark:border-[#0088ff]/30">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Contador de Visitas al Punto
                </span>
                <span className="text-[11px] text-slate-600 dark:text-[#cbd5e1]">
                  Número de veces que el auditor ha acudido a este punto de venta
                </span>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDecrementVisit}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white border border-slate-300 dark:border-[#334155] hover:bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer shadow-xs active:scale-95"
                  title="Disminuir visitas"
                >
                  -
                </button>
                <div className="px-3 py-1 bg-white dark:bg-[#0f172a] rounded-lg border border-slate-300 dark:border-[#334155] text-center min-w-[70px]">
                  <span className="text-sm font-mono font-extrabold text-blue-700 dark:text-[#38bdf8]">
                    {visitCount} {visitCount === 1 ? 'visita' : 'visitas'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleIncrementVisit}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white border border-slate-300 dark:border-[#334155] hover:bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer shadow-xs active:scale-95"
                  title="Incrementar visitas (ej. nueva visita realizada)"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* STATUS SELECTION (AUDITADO, NO AUDITADO, RE-VISITA, EN CURSO) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-white block uppercase tracking-wider">
              ¿Cuál fue el resultado de la visita?
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. AUDITADO */}
              <button
                type="button"
                onClick={() => setSelectedStatus('completed')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  selectedStatus === 'completed'
                    ? 'bg-emerald-50 dark:bg-[#064e3b]/30 border-emerald-500 dark:border-[#10b981] ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#222a3d] hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </span>
                  {selectedStatus === 'completed' && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.2 rounded">
                      Seleccionado
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Auditado
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-[#94a3b8] leading-tight block">
                    Visita efectiva y levantamiento completo.
                  </span>
                </div>
              </button>

              {/* 2. NO AUDITADO */}
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('not_audited');
                  if (!NOT_AUDITED_REASONS.includes(reason)) setReason(NOT_AUDITED_REASONS[0]);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  selectedStatus === 'not_audited'
                    ? 'bg-red-50 dark:bg-[#7f1d1d]/30 border-red-500 dark:border-[#ef4444] ring-2 ring-red-500/20'
                    : 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#222a3d] hover:border-red-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </span>
                  {selectedStatus === 'not_audited' && (
                    <span className="text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.2 rounded">
                      Seleccionado
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    No Auditado
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-[#94a3b8] leading-tight block">
                    Visita fallida (local cerrado o ausente).
                  </span>
                </div>
              </button>

              {/* 3. RE-VISITA PENDIENTE */}
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('revisit_needed');
                  if (!REVISIT_REASONS.includes(reason)) setReason(REVISIT_REASONS[0]);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  selectedStatus === 'revisit_needed'
                    ? 'bg-purple-50 dark:bg-[#581c87]/30 border-purple-500 dark:border-[#a855f7] ring-2 ring-purple-500/20'
                    : 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#222a3d] hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">replay</span>
                  </span>
                  {selectedStatus === 'revisit_needed' && (
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-1.5 py-0.2 rounded">
                      Seleccionado
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Para Re-visita
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-[#94a3b8] leading-tight block">
                    Se dejó para volver a pasar o completar.
                  </span>
                </div>
              </button>
            </div>

            {/* Secondary status links (En curso / Pendiente) */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedStatus('in_progress')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                  selectedStatus === 'in_progress'
                    ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 font-bold'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-[#1e293b] dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                <span>Marcar "En Curso" (auditor en sitio)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('pending')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                  selectedStatus === 'pending'
                    ? 'bg-slate-200 text-slate-900 border-slate-400 dark:bg-slate-800 dark:text-white font-bold'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-[#1e293b] dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                <span>Restablecer a "Pendiente"</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC REASON SELECTOR FOR 'NO AUDITADO' */}
          {selectedStatus === 'not_audited' && (
            <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-2">
              <label className="text-xs font-bold text-red-900 dark:text-red-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">report_problem</span>
                <span>Motivo por el cual NO se auditó:</span>
              </label>
              
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1326] border border-red-300 dark:border-red-800/60 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                {NOT_AUDITED_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {reason === 'Otro motivo' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Especifique el motivo exacto..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1326] border border-red-300 dark:border-red-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              )}
            </div>
          )}

          {/* DYNAMIC REASON SELECTOR FOR 'PARA RE-VISITA' */}
          {selectedStatus === 'revisit_needed' && (
            <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2">
              <label className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">update</span>
                <span>Motivo por el cual se deja para Re-visita:</span>
              </label>

              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1326] border border-purple-300 dark:border-purple-800/60 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {REVISIT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {reason === 'Otro motivo' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Especifique el motivo de re-visita..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1326] border border-purple-300 dark:border-purple-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              )}
            </div>
          )}

          {/* QUICK SUGGESTIONS FOR AUDITED */}
          {selectedStatus === 'completed' && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-600 dark:text-[#cbd5e1] block">
                Sugerencias rápidas de confirmación:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {AUDITED_NOTES_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setNotes(sug)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-[#2d3a58] text-[10px] text-slate-800 dark:text-[#cbd5e1] border border-slate-200 dark:border-[#334155] cursor-pointer transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* NOTES & OBSERVATIONS */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white block">
              Observaciones del Auditor (Opcional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle de la visita, contacto atendió, número de factura o situación en el punto..."
              className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-[#222a3d] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0088ff]"
            />
          </div>

          {/* VISIT HISTORY IF AVAILABLE */}
          {step.visitHistory && step.visitHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#222a3d]">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#0088ff]">history</span>
                <span>Historial de Visitas Anteriores ({step.visitHistory.length}):</span>
              </span>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {step.visitHistory.map((v, i) => (
                  <div
                    key={v.id || i}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#222a3d] flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        Visita #{i + 1}
                      </span>
                      <span className="text-slate-500 dark:text-[#94a3b8] ml-2">
                        {v.date || v.timestamp}
                      </span>
                      {v.reason && (
                        <p className="text-[10px] text-slate-600 dark:text-[#cbd5e1] mt-0.5">
                          Motivo: {v.reason}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      v.result === 'auditado'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                        : v.result === 'no_auditado'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                    }`}>
                      {v.result === 'auditado' ? 'Auditado' : v.result === 'no_auditado' ? 'No Auditado' : 'Re-visita'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-slate-200 dark:border-[#222a3d] bg-slate-50 dark:bg-[#0f172a] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === 'completed'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : selectedStatus === 'not_audited'
                ? 'bg-red-600 hover:bg-red-700'
                : selectedStatus === 'revisit_needed'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-[#0088ff] hover:bg-blue-600'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>
              {selectedStatus === 'completed'
                ? 'Guardar como Auditado'
                : selectedStatus === 'not_audited'
                ? 'Guardar como No Auditado'
                : selectedStatus === 'revisit_needed'
                ? 'Guardar para Re-visita'
                : 'Guardar Estado'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
