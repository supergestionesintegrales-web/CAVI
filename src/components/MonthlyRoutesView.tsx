import React, { useState, useMemo } from 'react';
import { RouteStep, Auditor } from '../types';

interface MonthlyRoutesViewProps {
  steps: RouteStep[];
  auditors: Auditor[];
  onSelectDay: (dayKey: string) => void;
  onOpenAddStep?: (auditorId?: string, defaultDay?: string) => void;
  onOpenGpsModal?: () => void;
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES_MAP: Record<number, { key: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes'; label: string }> = {
  1: { key: 'lunes', label: 'Lunes' },
  2: { key: 'martes', label: 'Martes' },
  3: { key: 'miércoles', label: 'Miércoles' },
  4: { key: 'jueves', label: 'Jueves' },
  5: { key: 'viernes', label: 'Viernes' },
};

const LA_GUAJIRA_MUNICIPALITIES = [
  { name: 'Riohacha', zone: 'Norte' },
  { name: 'Maicao', zone: 'Norte' },
  { name: 'Manaure', zone: 'Norte' },
  { name: 'Uribia', zone: 'Norte' },
  { name: 'Dibulla', zone: 'Centro' },
  { name: 'Albania', zone: 'Centro' },
  { name: 'Hatonuevo', zone: 'Centro' },
  { name: 'Barrancas', zone: 'Centro' },
  { name: 'Distracción', zone: 'Centro' },
  { name: 'Fonseca', zone: 'Centro' },
  { name: 'San Juan del Cesar', zone: 'Centro' },
  { name: 'El Molino', zone: 'Sur' },
  { name: 'Villanueva', zone: 'Sur' },
  { name: 'Urumita', zone: 'Sur' },
  { name: 'La Jagua del Pilar', zone: 'Sur' },
];

export const MonthlyRoutesView: React.FC<MonthlyRoutesViewProps> = ({
  steps,
  auditors,
  onSelectDay,
  onOpenAddStep,
  onOpenGpsModal,
  onShowToast,
}) => {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(today.getDate());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAuditor, setFilterAuditor] = useState('todos');
  const [filterZone, setFilterZone] = useState<'Todas' | 'Norte' | 'Centro' | 'Sur'>('Todas');

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDayNumber(today.getDate());
    onShowToast('Vista Hoy', `Regresando a ${today.getDate()} de ${MONTH_NAMES[today.getMonth()]}.`, 'info');
  };

  // Calendar calculations
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayOfMonth = useMemo(() => {
    // 0 = Sunday, 1 = Monday ... 6 = Saturday
    const day = new Date(currentYear, currentMonth, 1).getDay();
    // Convert so 0 = Monday, 6 = Sunday
    return day === 0 ? 6 : day - 1;
  }, [currentYear, currentMonth]);

  // Steps filtered by auditor and zone
  const filteredSteps = useMemo(() => {
    return steps.filter((step) => {
      if (filterAuditor !== 'todos' && step.auditorId !== filterAuditor) {
        return false;
      }
      if (filterZone !== 'Todas') {
        const aud = auditors.find((a) => a.id === step.auditorId);
        if (aud && aud.zone !== filterZone) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = step.name.toLowerCase().includes(q);
        const matchCode = step.code.toLowerCase().includes(q);
        const matchAddr = step.address.toLowerCase().includes(q);
        const matchMuni = step.municipality?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchAddr && !matchMuni) return false;
      }
      return true;
    });
  }, [steps, filterAuditor, filterZone, searchQuery, auditors]);

  // Steps mapped by day of week
  const stepsByDayKey = useMemo(() => {
    const acc: Record<string, RouteStep[]> = {
      lunes: [],
      martes: [],
      miércoles: [],
      jueves: [],
      viernes: [],
    };
    filteredSteps.forEach((s) => {
      if (s.day && acc[s.day]) {
        acc[s.day].push(s);
      } else {
        // Default distribution if day is not explicitly tagged
        acc.martes.push(s);
      }
    });
    return acc;
  }, [filteredSteps]);

  // Key metrics for the month
  const totalStopsMonth = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const dayOfWeek = date.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dayInfo = DAY_NAMES_MAP[dayOfWeek];
        if (dayInfo) {
          count += (stepsByDayKey[dayInfo.key] || []).length;
        }
      }
    }
    return count;
  }, [daysInMonth, currentYear, currentMonth, stepsByDayKey]);

  const gpsPercentage = useMemo(() => {
    if (filteredSteps.length === 0) return 0;
    const withGps = filteredSteps.filter((s) => s.hasGps).length;
    return Math.round((withGps / filteredSteps.length) * 100);
  }, [filteredSteps]);

  // Selected date details
  const selectedDateObj = useMemo(() => {
    return new Date(currentYear, currentMonth, selectedDayNumber);
  }, [currentYear, currentMonth, selectedDayNumber]);

  const selectedDayOfWeek = selectedDateObj.getDay();
  const selectedDayInfo = DAY_NAMES_MAP[selectedDayOfWeek];
  const selectedDaySteps = selectedDayInfo ? stepsByDayKey[selectedDayInfo.key] || [] : [];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* HEADER & MONTH NAVIGATION */}
      <div className="bg-[#171f33] border border-[#222a3d] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#0088ff]/15 text-[#0088ff] border border-[#0088ff]/30">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-headline font-bold text-white flex items-center gap-2">
                  <span>Matriz y Planificación Mensual de Rutas</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#0088ff]/20 text-[#38bdf8] border border-[#0088ff]/30">
                    CAVI 2026
                  </span>
                </h2>
                <p className="text-xs text-[#bbcabf] mt-0.5">
                  Planificación estratégica y cobertura departamental de los 15 municipios de La Guajira
                </p>
              </div>
            </div>
          </div>

          {/* Month Stepper & Today Button */}
          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
            <div className="flex items-center bg-[#0b1326] p-1 rounded-xl border border-[#222a3d]">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Mes anterior"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#dae2fd] hover:bg-[#171f33] active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              <div className="px-3 py-1 text-center min-w-[140px]">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
                <span className="text-[10px] text-[#38bdf8] font-mono">
                  {daysInMonth} días calendario
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Mes siguiente"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#dae2fd] hover:bg-[#171f33] active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-3 py-2 rounded-xl bg-[#0b1326] hover:bg-[#171f33] text-[#dae2fd] text-xs font-semibold flex items-center gap-1.5 transition-all border border-[#222a3d] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#0088ff]">today</span>
              <span>Hoy ({today.getDate()} {MONTH_NAMES[today.getMonth()].slice(0, 3)})</span>
            </button>

            {onOpenGpsModal && (
              <button
                type="button"
                onClick={onOpenGpsModal}
                className="px-3 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#0088ff]/25 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">map</span>
                <span>Mapa Satelital GPS</span>
              </button>
            )}
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-[#222a3d]">
          <div className="bg-[#0b1326] p-3 rounded-xl border border-[#222a3d]">
            <span className="text-[11px] text-[#bbcabf] block">Paradas Proyectadas Mes</span>
            <span className="text-lg font-mono font-bold text-white mt-0.5 block">
              {totalStopsMonth} Visitas
            </span>
          </div>

          <div className="bg-[#0b1326] p-3 rounded-xl border border-[#222a3d]">
            <span className="text-[11px] text-[#bbcabf] block">Cobertura GPS Satelital</span>
            <span className="text-lg font-mono font-bold text-[#38bdf8] mt-0.5 flex items-center gap-1">
              <span>{gpsPercentage}%</span>
              <span className="text-[10px] text-[#bbcabf] font-normal font-sans">verificadas</span>
            </span>
          </div>

          <div className="bg-[#0b1326] p-3 rounded-xl border border-[#222a3d]">
            <span className="text-[11px] text-[#bbcabf] block">Red Departamental</span>
            <span className="text-lg font-mono font-bold text-white mt-0.5 block">
              15 Municipios
            </span>
          </div>

          <div className="bg-[#0b1326] p-3 rounded-xl border border-[#222a3d]">
            <span className="text-[11px] text-[#bbcabf] block">Auditores en Campo</span>
            <span className="text-lg font-mono font-bold text-[#0088ff] mt-0.5 block">
              {auditors.length} Asignados
            </span>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
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
              placeholder="Filtrar paradas por nombre, municipio, código..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0b1326] text-xs text-white placeholder-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-[#0088ff] border border-[#222a3d]"
            />
          </div>

          <select
            value={filterAuditor}
            onChange={(e) => setFilterAuditor(e.target.value)}
            className="bg-[#0b1326] text-white text-xs px-2.5 py-1.5 rounded-xl border border-[#222a3d] focus:outline-none focus:ring-1 focus:ring-[#0088ff] cursor-pointer"
          >
            <option value="todos">Todos los Auditores</option>
            {auditors.map((aud) => (
              <option key={aud.id} value={aud.id}>
                {aud.name} ({aud.zone})
              </option>
            ))}
          </select>

          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value as any)}
            className="bg-[#0b1326] text-white text-xs px-2.5 py-1.5 rounded-xl border border-[#222a3d] focus:outline-none focus:ring-1 focus:ring-[#0088ff] cursor-pointer hidden sm:block"
          >
            <option value="Todas">Todas las Zonas</option>
            <option value="Norte">Zona Norte</option>
            <option value="Centro">Zona Centro</option>
            <option value="Sur">Zona Sur</option>
          </select>
        </div>

        {onOpenAddStep && (
          <button
            type="button"
            onClick={() => onOpenAddStep(undefined, selectedDayInfo?.key || 'lunes')}
            className="px-3 py-1.5 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>+ Agregar Parada</span>
          </button>
        )}
      </div>

      {/* MONTH CALENDAR GRID */}
      <div className="bg-[#171f33] border border-[#222a3d] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dayName, idx) => {
            const isWeekend = idx >= 5;
            return (
              <div
                key={dayName}
                className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  isWeekend
                    ? 'bg-[#0b1326]/40 text-[#86948a]'
                    : 'bg-[#0f172a] text-white border border-[#222a3d]'
                }`}
              >
                <span className="hidden sm:inline">{dayName}</span>
                <span className="sm:hidden">{dayName.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty padding slots before day 1 */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div
              key={`empty-pad-${idx}`}
              className="min-h-[90px] sm:min-h-[110px] rounded-xl bg-[#0b1326]/20 border border-transparent p-2 opacity-25"
            />
          ))}

          {/* Actual days of month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateObj = new Date(currentYear, currentMonth, dayNum);
            const dayOfWeek = dateObj.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const dayInfo = DAY_NAMES_MAP[dayOfWeek];
            const isToday =
              today.getDate() === dayNum &&
              today.getMonth() === currentMonth &&
              today.getFullYear() === currentYear;
            const isSelected = selectedDayNumber === dayNum;

            const dayStops = dayInfo ? stepsByDayKey[dayInfo.key] || [] : [];
            const dayGpsCount = dayStops.filter((s) => s.hasGps).length;

            if (isWeekend) {
              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDayNumber(dayNum)}
                  className={`min-h-[90px] sm:min-h-[110px] rounded-xl p-2 sm:p-2.5 transition-all flex flex-col justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-[#1e293b] border-[#0088ff] ring-1 ring-[#0088ff]'
                      : 'bg-[#0b1326]/40 border-[#222a3d]/40 text-[#86948a] hover:bg-[#0b1326]/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#86948a]">{dayNum}</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#0b1326] text-[#64748b]">
                      Descanso
                    </span>
                  </div>
                  <div className="text-[10px] text-[#64748b] leading-tight mt-auto">
                    Guardia pasiva / Cierre administrativo
                  </div>
                </div>
              );
            }

            return (
              <div
                key={dayNum}
                onClick={() => setSelectedDayNumber(dayNum)}
                className={`min-h-[90px] sm:min-h-[110px] rounded-xl p-2 sm:p-2.5 transition-all flex flex-col justify-between cursor-pointer border relative group ${
                  isSelected
                    ? 'bg-[#131b2e] border-[#0088ff] ring-2 ring-[#0088ff]/60 shadow-md'
                    : isToday
                    ? 'bg-[#171f33] border-[#0088ff] text-white shadow-sm'
                    : 'bg-[#131b2e] border-[#222a3d] hover:border-[#0088ff]/50 hover:bg-[#1a233b]'
                }`}
              >
                {/* Day Number and Badges */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-bold leading-none ${
                        isSelected || isToday ? 'text-white' : 'text-[#dae2fd]'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-[#0088ff] text-white">
                        HOY
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#0088ff]/20 text-[#38bdf8] border border-[#0088ff]/30">
                    {dayStops.length} PDVs
                  </span>
                </div>

                {/* Content snippet */}
                <div className="my-1.5 space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-[#bbcabf] truncate">
                    <span className="material-symbols-outlined text-[12px] text-[#0088ff]">
                      location_on
                    </span>
                    <span className="truncate">
                      {dayStops.length > 0
                        ? Array.from(new Set(dayStops.map((s) => s.municipality || 'Riohacha'))).slice(0, 2).join(', ')
                        : 'Sin paradas'}
                    </span>
                  </div>

                  {dayStops.length > 0 && (
                    <div className="flex items-center gap-1 text-[9px] font-mono text-[#38bdf8]">
                      <span className="material-symbols-outlined text-[10px]">gps_fixed</span>
                      <span>{dayGpsCount}/{dayStops.length} GPS</span>
                    </div>
                  )}
                </div>

                {/* Footer action */}
                <div className="pt-1 border-t border-[#222a3d]/60 flex items-center justify-between">
                  <span className="text-[9px] text-[#86948a] uppercase font-bold">
                    {dayInfo?.label.slice(0, 3)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dayInfo) {
                        onSelectDay(dayInfo.key);
                        onShowToast(`Día ${dayInfo.label}`, `Cambiando a la vista detallada de ${dayInfo.label}.`, 'info');
                      }
                    }}
                    className="text-[10px] font-bold text-[#0088ff] hover:text-[#38bdf8] flex items-center gap-0.5 hover:underline"
                    title={`Abrir vista diaria de ${dayInfo?.label}`}
                  >
                    <span>Ver Día</span>
                    <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED DAY DETAIL PANEL */}
      <div className="bg-[#171f33] border border-[#222a3d] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222a3d]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0088ff]/20 text-[#0088ff] flex items-center justify-center font-bold font-mono">
              {selectedDayNumber}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>
                  {selectedDayInfo
                    ? `${selectedDayInfo.label} ${selectedDayNumber} de ${MONTH_NAMES[currentMonth]}`
                    : `Día ${selectedDayNumber} de ${MONTH_NAMES[currentMonth]} (Fin de semana)`}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0b1326] text-[#38bdf8] border border-[#222a3d] font-mono font-bold">
                  {selectedDaySteps.length} paradas
                </span>
              </h3>
              <p className="text-xs text-[#bbcabf]">
                {selectedDayInfo
                  ? `Rutas operativas asignadas en el ciclo ${selectedDayInfo.label}`
                  : 'Día no laboral para inspección presencial ordinaria'}
              </p>
            </div>
          </div>

          {selectedDayInfo && (
            <button
              type="button"
              onClick={() => {
                onSelectDay(selectedDayInfo.key);
                onShowToast(`Día ${selectedDayInfo.label}`, `Cambiando a la vista diaria de ${selectedDayInfo.label}.`, 'info');
              }}
              className="px-3.5 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <span>Abrir Vista Detallada del Día</span>
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            </button>
          )}
        </div>

        {/* Stops preview for selected day */}
        {selectedDaySteps.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#94a3b8] flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-[#475569]">event_available</span>
            <span>No hay paradas programadas registradas para esta fecha.</span>
            {onOpenAddStep && selectedDayInfo && (
              <button
                type="button"
                onClick={() => onOpenAddStep(undefined, selectedDayInfo.key)}
                className="mt-1 text-xs text-[#0088ff] font-bold hover:underline"
              >
                + Programar PDV para {selectedDayInfo.label}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
            {selectedDaySteps.map((step, idx) => {
              const aud = auditors.find((a) => a.id === step.auditorId);
              return (
                <div
                  key={step.id}
                  className="p-3 rounded-xl bg-[#0b1326] border border-[#222a3d] hover:border-[#0088ff]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-[#171f33] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#0088ff]/20 text-[#38bdf8] border border-[#0088ff]/30">
                          {step.code}
                        </span>
                      </div>
                      {step.hasGps && (
                        <span className="px-1 py-0.2 rounded bg-[#0088ff]/20 text-[#38bdf8] text-[9px] font-bold flex items-center gap-0.5 border border-[#0088ff]/30">
                          <span className="material-symbols-outlined text-[10px]">gps_fixed</span>
                          <span>GPS</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white leading-tight line-clamp-1">
                      {step.name}
                    </h4>

                    {/* Alert & Days Without Visit Badges */}
                    {(step.daysWithoutVisit && step.daysWithoutVisit >= 60) || (step.alertCategory && step.alertCategory !== 'ninguna') ? (
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {step.daysWithoutVisit && step.daysWithoutVisit >= 60 && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold inline-flex items-center gap-0.5 ${
                            step.daysWithoutVisit >= 90
                              ? 'bg-[#dc2626]/30 text-[#fca5a5] border border-[#dc2626]/50'
                              : 'bg-[#d97706]/30 text-[#fde68a] border border-[#d97706]/50'
                          }`}>
                            <span className="material-symbols-outlined text-[10px]">schedule</span>
                            <span>{step.daysWithoutVisit}d sin visita</span>
                          </span>
                        )}
                        {step.alertCategory && step.alertCategory !== 'ninguna' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#dc2626]/30 text-[#fca5a5] border border-[#dc2626]/50 inline-flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px]">warning</span>
                            <span>Alerta</span>
                          </span>
                        )}
                      </div>
                    ) : null}

                    <p className="text-[11px] text-[#cbd5e1] mt-0.5 line-clamp-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-[#0088ff]">location_on</span>
                      <span>{step.address}</span>
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#222a3d] flex items-center justify-between text-[10px] text-[#bbcabf]">
                    <span>{step.municipality || 'La Guajira'}</span>
                    <span className="font-semibold text-white">{aud ? aud.name : 'Sin asignar'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 15 MUNICIPALITIES COVERAGE DIRECTORY */}
      <div className="bg-[#171f33] border border-[#222a3d] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0088ff] text-[20px]">public</span>
            <h3 className="text-sm font-bold text-white">
              Red Departamental de 15 Municipios (La Guajira)
            </h3>
          </div>
          <span className="text-[10px] text-[#38bdf8] font-mono font-bold">
            100% Cobertura Activa
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {LA_GUAJIRA_MUNICIPALITIES.map((mun) => {
            const munSteps = filteredSteps.filter(
              (s) => s.municipality?.toLowerCase() === mun.name.toLowerCase()
            );
            return (
              <div
                key={mun.name}
                className="p-2.5 rounded-xl bg-[#0b1326] border border-[#222a3d] hover:border-[#0088ff]/30 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block">{mun.name}</span>
                  <span className="text-[10px] text-[#86948a] block">Zona {mun.zone}</span>
                </div>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#0088ff]/15 text-[#38bdf8] border border-[#0088ff]/30">
                  {munSteps.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
