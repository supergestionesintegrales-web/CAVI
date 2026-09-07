import React, { useState, useMemo } from 'react';
import { RouteStep, Auditor } from '../types';

interface WeeklyRoutesMatrixProps {
  steps: RouteStep[];
  auditors: Auditor[];
  onToggleStepStatus?: (stepId: string) => void;
  onOpenAddStep?: (auditorId?: string, day?: string) => void;
  onOpenGpsModal: () => void;
  onSelectDay: (day: string) => void;
  onUploadMatrix: () => void;
  onDownloadTemplate: () => void;
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
}

const DAYS_OF_WEEK: Array<{ key: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes'; label: string; fullLabel: string }> = [
  { key: 'lunes', label: 'Lun', fullLabel: 'Lunes' },
  { key: 'martes', label: 'Mar', fullLabel: 'Martes' },
  { key: 'miércoles', label: 'Mié', fullLabel: 'Miércoles' },
  { key: 'jueves', label: 'Jue', fullLabel: 'Jueves' },
  { key: 'viernes', label: 'Vie', fullLabel: 'Viernes' },
];

export const WeeklyRoutesMatrix: React.FC<WeeklyRoutesMatrixProps> = ({
  steps,
  auditors,
  onToggleStepStatus,
  onOpenAddStep,
  onOpenGpsModal,
  onSelectDay,
  onUploadMatrix,
  onDownloadTemplate,
  onShowToast,
}) => {
  const [filterChannel, setFilterChannel] = useState<string>('todos');
  const [filterAuditor, setFilterAuditor] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize step day
  const getStepDay = (step: RouteStep, index: number): string => {
    if (step.day) return step.day.toLowerCase();
    const cycle = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
    return cycle[index % cycle.length];
  };

  // Group steps by day
  const stepsByDay = useMemo(() => {
    const map: Record<string, RouteStep[]> = {
      lunes: [],
      martes: [],
      miércoles: [],
      jueves: [],
      viernes: [],
    };

    steps.forEach((step, idx) => {
      // Apply filters
      if (filterAuditor !== 'todos' && step.auditorId !== filterAuditor) return;
      if (filterChannel !== 'todos' && (!step.channel || !step.channel.toLowerCase().includes(filterChannel.toLowerCase()))) return;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          step.name.toLowerCase().includes(q) ||
          step.code.toLowerCase().includes(q) ||
          step.address.toLowerCase().includes(q) ||
          step.municipality.toLowerCase().includes(q) ||
          (step.channel && step.channel.toLowerCase().includes(q));
        if (!match) return;
      }

      const d = getStepDay(step, idx);
      if (map[d]) {
        map[d].push(step);
      } else {
        map.martes.push(step);
      }
    });

    return map;
  }, [steps, filterAuditor, filterChannel, searchQuery]);

  // Overall KPIs
  const totalStops = steps.length;
  const gpsStops = steps.filter((s) => s.hasGps).length;
  const completedStops = steps.filter((s) => s.status === 'completed').length;
  const inProgressStops = steps.filter((s) => s.status === 'in_progress').length;

  const channelsSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    steps.forEach((s) => {
      const ch = s.channel || 'Tradicional';
      counts[ch] = (counts[ch] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [steps]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* TOP BANNER: VISTA ALTERNA SEMANAL */}
      <div className="bg-[#171f33] border border-[#222a3d] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0088ff]/20 text-[#0088ff] text-xs font-bold border border-[#0088ff]/40 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">view_week</span>
                <span>Vista Alterna: Semana Completa</span>
              </span>
              <span className="text-xs font-bold text-white">
                Matriz Operativa de Puntos de Venta (Lunes a Viernes)
              </span>
            </div>
            <p className="text-xs text-[#cbd5e1] mt-1">
              Consolidado de visitas de campo programadas con dirección exacta, canal comercial y georreferenciación GPS.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={onUploadMatrix}
              className="px-3.5 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">upload_file</span>
              <span>Cargar Matriz PDV (GPS)</span>
            </button>

            <button
              type="button"
              onClick={onDownloadTemplate}
              className="px-3 py-2 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#f8fafc] text-xs font-medium border border-[#3b4760] flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">download</span>
              <span>Plantilla Excel</span>
            </button>

            <button
              type="button"
              onClick={onOpenGpsModal}
              className="px-3.5 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold border border-[#0088ff]/40 flex items-center gap-1.5 shadow-md shadow-[#0088ff]/20 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px] text-white">public</span>
              <span>Ver en Mapa Satelital GPS</span>
            </button>
          </div>
        </div>

        {/* METRIC STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#222a3d]">
          <div className="bg-[#0b1326] p-3 rounded-xl border border-[#222a3d]">
            <span className="text-[11px] text-[#cbd5e1] block">Total Paradas Semanales</span>
            <span className="text-lg font-mono font-bold text-white mt-0.5 block">
              {totalStops} PDVs
            </span>
          </div>

          <div className="bg-[#0b1326] p-3 rounded-xl border border-[#222a3d]">
            <span className="text-[11px] text-[#cbd5e1] block">Geolocalizadas con GPS</span>
            <span className="text-lg font-mono font-bold text-[#38bdf8] mt-0.5 flex items-center gap-1">
              <span>{gpsStops}</span>
              <span className="text-xs font-normal text-[#64748b]">
                ({totalStops > 0 ? Math.round((gpsStops / totalStops) * 100) : 0}%)
              </span>
            </span>
          </div>

          <div className="bg-[#0b1326] p-3 rounded-xl border border-[#222a3d]">
            <span className="text-[11px] text-[#cbd5e1] block">Estado de Visitas</span>
            <span className="text-xs font-bold text-[#4edea3] mt-1 block">
              {completedStops} completadas · {inProgressStops} en curso
            </span>
          </div>

          <div className="bg-[#0b1326] p-3 rounded-xl border border-[#222a3d]">
            <span className="text-[11px] text-[#cbd5e1] block">Canales Activos</span>
            <span className="text-xs font-bold text-[#fcd34d] mt-1 block truncate">
              {channelsSummary.length > 0 ? channelsSummary.map((c) => c[0]).slice(0, 2).join(', ') : 'Pendiente'}
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-[#171f33] border border-[#222a3d] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#94a3b8]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por PDV, canal, dirección o municipio..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0b1326] text-xs text-white placeholder-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-[#0088ff] border border-[#222a3d]"
            />
          </div>

          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="bg-[#0b1326] text-white text-xs px-2.5 py-1.5 rounded-xl border border-[#222a3d] focus:outline-none focus:ring-1 focus:ring-[#0088ff] cursor-pointer"
          >
            <option value="todos">Todos los Canales</option>
            <option value="Supermercados">Supermercados</option>
            <option value="Tradicional">Canal Tradicional</option>
            <option value="Droguerías">Droguerías</option>
            <option value="Hard Discount">Hard Discount</option>
            <option value="Mayorista">Mayorista</option>
            <option value="Conveniencia">Conveniencia</option>
            <option value="CDA">CDA / Acopio</option>
          </select>

          <select
            value={filterAuditor}
            onChange={(e) => setFilterAuditor(e.target.value)}
            className="bg-[#0b1326] text-white text-xs px-2.5 py-1.5 rounded-xl border border-[#222a3d] focus:outline-none focus:ring-1 focus:ring-[#0088ff] cursor-pointer hidden sm:block"
          >
            <option value="todos">Todos los Auditores</option>
            {auditors.map((aud) => (
              <option key={aud.id} value={aud.id}>
                {aud.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-[#94a3b8] font-mono">
          Mostrando matriz semanal 5 días
        </span>
      </div>

      {/* 5-DAY OPERATIONAL MATRIX GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5 items-start">
        {DAYS_OF_WEEK.map((day) => {
          const daySteps = stepsByDay[day.key] || [];
          const dayGpsCount = daySteps.filter((s) => s.hasGps).length;
          const dayCompletedCount = daySteps.filter((s) => s.status === 'completed').length;

          return (
            <div
              key={day.key}
              className="bg-[#171f33] border border-[#222a3d] rounded-2xl overflow-hidden flex flex-col shadow-sm"
            >
              {/* Day Header */}
              <div className="p-3 bg-[#0f172a] border-b border-[#222a3d] flex items-center justify-between day-matrix-header" data-dark-header="true">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold !text-white text-white uppercase tracking-wider day-matrix-title">
                      {day.fullLabel}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0088ff]/25 !text-[#38bdf8] text-[#38bdf8] border border-[#0088ff]/40 day-matrix-badge">
                      {daySteps.length}
                    </span>
                  </div>
                  <span className="text-[10px] !text-[#cbd5e1] text-[#cbd5e1] day-matrix-subtitle">
                    {dayGpsCount} con GPS · {dayCompletedCount} completadas
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectDay(day.key);
                    onShowToast(`Día ${day.fullLabel}`, `Cambiando a la vista diaria detallada de ${day.fullLabel}.`, 'info');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#1e293b] hover:bg-[#2d3a58] !text-white text-white text-[10px] font-bold transition-all cursor-pointer border border-[#334155] day-matrix-btn flex items-center gap-1 shadow-sm"
                  title={`Abrir vista diaria de ${day.fullLabel}`}
                >
                  <span>Ver Día</span>
                  <span className="material-symbols-outlined text-[12px] !text-[#38bdf8]">arrow_forward</span>
                </button>
              </div>

              {/* Day Steps List */}
              <div className="p-2 space-y-2 max-h-[580px] overflow-y-auto">
                {daySteps.length === 0 ? (
                  <div className="p-5 text-center flex flex-col items-center justify-center gap-1.5 text-xs text-[#94a3b8]">
                    <span className="material-symbols-outlined text-[24px] text-[#475569]">event_busy</span>
                    <span>Sin paradas este día</span>
                    {onOpenAddStep && (
                      <button
                        type="button"
                        onClick={() => onOpenAddStep(undefined, day.key)}
                        className="mt-1 text-[11px] text-[#0088ff] hover:underline font-bold"
                      >
                        + Agregar PDV
                      </button>
                    )}
                  </div>
                ) : (
                  daySteps.map((step, idx) => {
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'in_progress';

                    return (
                      <div
                        key={step.id}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-[#1e293b] border-[#f59e0b]'
                            : isCompleted
                            ? 'bg-[#0f1d2e] border-[#10b981]/50'
                            : 'bg-[#0b1326] border-[#222a3d] hover:border-[#38bdf8]/40'
                        }`}
                      >
                        {/* Top info: Order & Channel */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="w-5 h-5 rounded-full bg-[#1e293b] text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            {step.channel && (
                              <span className="px-1.5 py-0.5 rounded bg-[#1e293b] text-[#38bdf8] text-[9px] font-bold border border-[#38bdf8]/30 truncate max-w-[100px]">
                                {step.channel}
                              </span>
                            )}
                          </div>

                          {step.hasGps ? (
                            <span className="px-1 py-0.5 rounded bg-[#0088ff]/20 text-[#38bdf8] text-[9px] font-bold flex items-center gap-0.5 border border-[#0088ff]/30">
                              <span className="material-symbols-outlined text-[10px]">gps_fixed</span>
                              <span>GPS</span>
                            </span>
                          ) : (
                            <span className="px-1 py-0.5 rounded bg-[#334155] text-[#94a3b8] text-[9px] font-medium">
                              Sin GPS
                            </span>
                          )}
                        </div>

                        {/* Store Name */}
                        <h4 className="text-xs font-bold text-white leading-tight line-clamp-2">
                          {step.name}
                        </h4>

                        {/* Alert / Days Without Visit Badge */}
                        {(step.daysWithoutVisit && step.daysWithoutVisit >= 60) || (step.alertCategory && step.alertCategory !== 'ninguna') ? (
                          <div className="flex items-center gap-1 flex-wrap mt-1">
                            {step.daysWithoutVisit && step.daysWithoutVisit >= 60 && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold inline-flex items-center gap-1 ${
                                step.daysWithoutVisit >= 90
                                  ? 'bg-[#dc2626]/30 text-[#fca5a5] border border-[#dc2626]/50'
                                  : 'bg-[#d97706]/30 text-[#fde68a] border border-[#d97706]/50'
                              }`}>
                                <span className="material-symbols-outlined text-[11px]">schedule</span>
                                <span>{step.daysWithoutVisit}d sin visita</span>
                              </span>
                            )}
                            {step.alertCategory && step.alertCategory !== 'ninguna' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#dc2626]/30 text-[#fca5a5] border border-[#dc2626]/50 inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px]">warning</span>
                                <span>Alerta</span>
                              </span>
                            )}
                          </div>
                        ) : null}

                        {/* Physical Address */}
                        <p className="text-[11px] text-[#cbd5e1] mt-1 flex items-start gap-1 leading-snug">
                          <span className="material-symbols-outlined text-[13px] text-[#0088ff] shrink-0 mt-0.5">
                            location_on
                          </span>
                          <span className="line-clamp-2">{step.address}</span>
                        </p>

                        {/* Municipality and Coordinates */}
                        <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#94a3b8] font-mono">
                          <span>{step.municipality || 'La Guajira'}</span>
                          {step.hasGps && typeof step.lat === 'number' && typeof step.lng === 'number' && (
                            <span className="text-[#38bdf8] font-semibold">
                              {step.lat.toFixed(3)}°, {step.lng.toFixed(3)}°
                            </span>
                          )}
                        </div>

                        {/* Assigned Auditor & Time */}
                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[#222a3d] text-[10px]">
                          <span className="text-[#cbd5e1] truncate max-w-[110px]">
                            {step.auditorName?.split(' ')[0] || 'Auditor'}
                          </span>
                          <span className="font-mono text-[#fcd34d] font-bold">
                            {step.time}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 mt-2">
                          {onToggleStepStatus && (
                            <button
                              type="button"
                              onClick={() => onToggleStepStatus(step.id)}
                              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isCompleted
                                  ? 'bg-[#064e3b] text-[#6ee7b7]'
                                  : isCurrent
                                  ? 'bg-[#f59e0b] text-black font-bold'
                                  : 'bg-[#1e293b] text-white hover:bg-[#2d3a58]'
                              }`}
                            >
                              {isCompleted ? 'Completada' : isCurrent ? 'En Curso' : 'Pendiente'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={onOpenGpsModal}
                            className="p-1 rounded-lg bg-[#0088ff]/20 text-[#0088ff] hover:bg-[#0088ff] hover:text-white transition-all cursor-pointer"
                            title="Ubicar este punto en el mapa satelital GPS"
                          >
                            <span className="material-symbols-outlined text-[14px]">my_location</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
