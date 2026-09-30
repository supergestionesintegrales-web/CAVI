import React, { useState } from 'react';
import { LeasePoint, LeaseIncident, LeaseOperatingStatus } from '../types';

interface LeaseIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  point: LeasePoint | null;
  onUpdatePointStatus: (
    pointId: string,
    status: LeaseOperatingStatus,
    override: 'force_open' | 'force_closed' | null,
    notes: string,
    newIncident?: LeaseIncident
  ) => void;
  onResolveIncident?: (pointId: string, incidentId: string, notes: string) => void;
  currentUser?: string;
}

export const LeaseIncidentModal: React.FC<LeaseIncidentModalProps> = ({
  isOpen,
  onClose,
  point,
  onUpdatePointStatus,
  onResolveIncident,
  currentUser = 'Administrador',
}) => {
  if (!isOpen || !point) return null;

  const [selectedStatus, setSelectedStatus] = useState<LeaseOperatingStatus>(point.operatingStatus);
  const [override, setOverride] = useState<'force_open' | 'force_closed' | null>(point.manualOverrideStatus || null);
  const [incidentType, setIncidentType] = useState<LeaseIncident['type']>('Cierre no autorizado');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [statusNotes, setStatusNotes] = useState(point.statusNotes || '');
  const [showNewIncidentForm, setShowNewIncidentForm] = useState(false);
  const [inactivityReason, setInactivityReason] = useState<LeasePoint['inactivityReason']>(point.inactivityReason);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newIncident: LeaseIncident | undefined;
    if (showNewIncidentForm && incidentDescription.trim()) {
      newIncident = {
        id: `inc-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        type: incidentType,
        description: incidentDescription.trim(),
        reportedBy: currentUser,
        resolved: false,
      };
    }

    onUpdatePointStatus(point.id, selectedStatus, override, `${inactivityReason ? `[${inactivityReason}] ` : ''}${statusNotes}`, newIncident);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0e172a] border border-[#222a3d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#131b2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#ffb4ab]/15 text-[#ffb4ab] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Novedad / Control de Cierre
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                {point.code} · {point.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-[#222a3d] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Quick status switch */}
          <div>
            <label className="block text-xs font-bold text-[#cbd5e1] mb-2">
              Estado Operativo Actual
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('open');
                  setOverride('force_open');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedStatus === 'open' && override === 'force_open'
                    ? 'bg-[#10b981]/20 border-[#10b981] text-[#4edea3] font-bold'
                    : 'bg-[#131b2e] border-[#222a3d] text-[#94a3b8] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">storefront</span>
                <span className="text-[11px]">Abierto Normal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('temporarily_closed');
                  setOverride('force_closed');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedStatus === 'temporarily_closed' || override === 'force_closed'
                    ? 'bg-[#ffb4ab]/20 border-[#ffb4ab] text-[#ffb4ab] font-bold'
                    : 'bg-[#131b2e] border-[#222a3d] text-[#94a3b8] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">lock</span>
                <span className="text-[11px]">Cerrado Novedad</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('contract_ended');
                  setOverride('force_closed');
                  setInactivityReason('contract_cancelled');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedStatus === 'contract_ended'
                    ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ffb4ab] font-bold'
                    : 'bg-[#131b2e] border-[#222a3d] text-[#94a3b8] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">contract</span>
                <span className="text-[11px]">Contrato cancelado</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('maintenance');
                  setOverride('force_closed');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedStatus === 'maintenance'
                    ? 'bg-[#ffb95f]/20 border-[#ffb95f] text-[#ffb95f] font-bold'
                    : 'bg-[#131b2e] border-[#222a3d] text-[#94a3b8] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">build</span>
                <span className="text-[11px]">Mantenimiento</span>
              </button>
            </div>
          </div>

          {override !== null && (
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('open');
                setOverride(null);
                setStatusNotes('');
              }}
              className="w-full py-1.5 px-3 rounded-lg text-xs bg-[#171f33] text-[#38bdf8] hover:bg-[#222a3d] border border-[#2d3449] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Restablecer cálculo automático de horario (quitar forzado)
            </button>
          )}

          {selectedStatus === 'contract_ended' && (
            <div>
              <label className="block text-xs font-bold text-[#cbd5e1] mb-1">Motivo de inactividad</label>
              <select value={inactivityReason || 'contract_cancelled'} onChange={(e) => setInactivityReason(e.target.value as LeasePoint['inactivityReason'])}
                className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none">
                <option value="contract_cancelled">Cancelación de contrato</option>
                <option value="contract_expired">Vencimiento del contrato</option>
                <option value="lease_terminated">Terminación del arrendamiento</option>
                <option value="closed_by_administration">Cierre por administración</option>
                <option value="other">Otra razón</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
              Observación / Motivo del Estado
            </label>
            <textarea
              rows={2}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Ej. Punto cerrado por corte de energía general en el sector comercial..."
              className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none resize-none"
            />
          </div>

          {/* Toggle register incident */}
          <div className="pt-2 border-t border-[#222a3d]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">report</span>
                Registrar Novedad en Bitácora
              </span>
              <button
                type="button"
                onClick={() => setShowNewIncidentForm(!showNewIncidentForm)}
                className="text-xs font-semibold text-[#0088ff] hover:underline cursor-pointer"
              >
                {showNewIncidentForm ? 'Ocultar formulario' : '+ Agregar Novedad'}
              </button>
            </div>

            {showNewIncidentForm && (
              <div className="p-3.5 bg-[#131b2e] rounded-xl border border-[#222a3d] space-y-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Tipo de Incidencia</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value as LeaseIncident['type'])}
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                  >
                    <option value="Cierre no autorizado">Cierre no autorizado (incumplimiento)</option>
                    <option value="Retraso en apertura">Retraso en apertura de jornada</option>
                    <option value="Cierre anticipado">Cierre anticipado de jornada</option>
                    <option value="Corte de energía / agua">Corte de energía / agua / servicios</option>
                    <option value="Mantenimiento preventivo">Mantenimiento preventivo o correctivo</option>
                    <option value="Novedad de infraestructura">Novedad de infraestructura física</option>
                    <option value="Inspección de auditoría">Inspección de auditoría en terreno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Descripción detallada *</label>
                  <textarea
                    rows={2}
                    required={showNewIncidentForm}
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    placeholder="Detalla lo encontrado en la inspección..."
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Historical Incidents */}
          {point.incidents.length > 0 && (
            <div className="pt-2 border-t border-[#222a3d]">
              <span className="text-xs font-bold text-[#cbd5e1] block mb-2">
                Historial de Novedades ({point.incidents.length})
              </span>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {point.incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-2.5 bg-[#131b2e] rounded-xl border border-[#222a3d] text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="text-[11px] text-[#94a3b8]">{inc.date} {inc.time}</span>
                        <span>·</span>
                        <span className="text-[#ffb95f]">{inc.type}</span>
                      </div>
                      <p className="text-[11px] text-[#cbd5e1] mt-0.5">{inc.description}</p>
                      <p className="text-[10px] text-[#94a3b8] mt-1">Reportó: {inc.reportedBy}</p>
                    </div>
                    {inc.resolved ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] shrink-0">
                        Resuelta
                      </span>
                    ) : onResolveIncident ? (
                      <button
                        type="button"
                        onClick={() => onResolveIncident(point.id, inc.id, 'Resuelto por administración')}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0088ff]/20 text-[#0088ff] hover:bg-[#0088ff]/30 shrink-0 cursor-pointer"
                      >
                        Marcar Resuelta
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#ffb4ab]/20 text-[#ffb4ab] shrink-0">
                        Activa
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-[#222a3d] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94a3b8] hover:text-white hover:bg-[#171f33] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0088ff] hover:bg-[#0070d8] shadow-md shadow-[#0088ff]/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Actualizar Estado y Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
