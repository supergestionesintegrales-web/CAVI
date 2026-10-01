import React, { useState, useRef, useMemo } from 'react';
import { Auditor, RouteStep, FloatingPoint, UserRole } from '../../types';
import { AddRouteModal, ActiveRoutePointOption } from '../AddRouteModal';
import { AddFloatingPointModal } from '../AddFloatingPointModal';
import { GpsTerritoryModal } from '../GpsTerritoryModal';
import { CaviNativeMap } from '../CaviNativeMap';
import { WeeklyRoutesMatrix } from '../WeeklyRoutesMatrix';
import { MonthlyRoutesView } from '../MonthlyRoutesView';
import { AuditVisitModal } from '../AuditVisitModal';
import { ActiveAuditorCalendarView } from '../ActiveAuditorCalendarView';
import { AlertPointsAssignmentPool } from '../AlertPointsAssignmentPool';
import { parseRoutesFile, downloadRoutesTemplate } from '../../utils/routesExcel';
import { calculateTotalRouteDistanceKm, formatDistance, estimateTravelTime } from '../../utils/geoUtils';

interface RoutesScreenProps {
  auditors: Auditor[];
  steps: RouteStep[];
  floatingPoints: FloatingPoint[];
  activeRouteSourceFile?: string;
  onGoToMacros?: () => void;
  onAssignFloatingPoint: (id: string, auditorId: string, day?: string) => void;
  onAutoAssignAll: () => void;
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
  userRole?: UserRole;
  activeAuditorId?: string;
  onAddRouteStep?: (step: Omit<RouteStep, 'id'>) => void;
  onDeleteRouteStep?: (id: string) => void;
  onToggleStepStatus?: (id: string) => void;
  onUpdateAuditStatus?: (
    id: string,
    result: {
      status: 'completed' | 'not_audited' | 'revisit_needed' | 'in_progress' | 'pending';
      auditReason?: string;
      notes?: string;
      visitCount: number;
    }
  ) => void;
  onImportRouteSteps?: (steps: RouteStep[]) => void;
  onClearRouteSteps?: () => void;
  onAddFloatingPoint?: (fp: Omit<FloatingPoint, 'id'>) => void;
  onDeleteFloatingPoint?: (id: string) => void;
  onReassignRouteStep?: (stepId: string, day: RouteStep['day'], auditorId?: string) => void;
}

export const RoutesScreen: React.FC<RoutesScreenProps> = ({
  auditors,
  steps,
  floatingPoints,
  activeRouteSourceFile = 'Rutas_LaGuajira_Departamental.xlsx',
  onAssignFloatingPoint,
  onAutoAssignAll,
  onShowToast,
  userRole = 'administrador',
  activeAuditorId = 'aud-1',
  onAddRouteStep,
  onDeleteRouteStep,
  onToggleStepStatus,
  onUpdateAuditStatus,
  onImportRouteSteps,
  onClearRouteSteps,
  onAddFloatingPoint,
  onDeleteFloatingPoint,
  onReassignRouteStep,
}) => {
  const isAuxiliar = userRole === 'auxiliar';
  const isAdmin = userRole === 'administrador';
  const currentAuditor = auditors?.find((a) => a.id === activeAuditorId) || auditors?.[0];

  // Resolve today's date & day key
  const todayDate = useMemo(() => new Date(), []);
  const todayDayIndex = todayDate.getDay(); // 0 is Sun, 1 Mon, 2 Tue, 3 Wed, 4 Thu, 5 Fri, 6 Sat
  const DAY_KEY_MAP: Record<number, string> = {
    1: 'lunes',
    2: 'martes',
    3: 'miércoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sábado',
  };
  const todayDayKey = DAY_KEY_MAP[todayDayIndex] || 'lunes';
  const todayDateFormatted = useMemo(() => {
    return todayDate.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [todayDate]);

  const [selectedDay, setSelectedDay] = useState<string>('semana');
  const [selectedZone, setSelectedZone] = useState<'Todas' | 'Norte' | 'Centro' | 'Sur'>('Todas');
  // Lists start collapsed by default as requested
  const [poolCollapsed, setPoolCollapsed] = useState(false);
  const [collapsedAuditors, setCollapsedAuditors] = useState<Record<string, boolean>>(() =>
    auditors.reduce((acc, a) => ({ ...acc, [a.id]: true }), {})
  );
  const [isPublishing, setIsPublishing] = useState(false);

  // Modal and audit state
  const [auditModalStep, setAuditModalStep] = useState<RouteStep | null>(null);
  const [auditorStatusFilters, setAuditorStatusFilters] = useState<Record<string, string>>({});

  const toggleAuditorCollapsed = (id: string) => {
    setCollapsedAuditors((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id]
    }));
  };

  // Modals state
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [targetAuditorForAdd, setTargetAuditorForAdd] = useState<string | undefined>(undefined);
  const [isAddFpOpen, setIsAddFpOpen] = useState(false);
  const [isGpsModalOpen, setIsGpsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map layout & sizing states
  const [mapLayoutMode, setMapLayoutMode] = useState<'panoramic_large' | 'split'>('panoramic_large');
  const [selectedAuditorForMap, setSelectedAuditorForMap] = useState<string>(isAuxiliar ? activeAuditorId : 'todos');
  const [selectedAuditorForCalendar, setSelectedAuditorForCalendar] = useState<string>(activeAuditorId || 'aud-1');

  // Filter auditors by zone
  const filteredAuditors = auditors.filter((aud) => {
    // Auxiliar: aislamiento estricto a su propio auditor.
    if (isAuxiliar && aud.id !== activeAuditorId) return false;
    if (selectedZone === 'Todas') return true;
    return aud.zone === selectedZone;
  });

  const isStepForDay = (step: RouteStep, day: string) => {
    if (!step.day) return true;
    const sDay = step.day.toLowerCase();
    const target = day.toLowerCase();
    if (target === 'sábado' && (sDay.includes('sab') || sDay.includes('sáb'))) return true;
    return sDay.includes(target.slice(0, 3));
  };

  // Handle Excel file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onShowToast('Procesando archivo', `Analizando ${file.name}...`, 'info');
      const parsed = await parseRoutesFile(file, auditors);
      if (parsed.length === 0) {
        onShowToast('Sin datos detectados', 'El archivo no contiene filas válidas de paradas.', 'alert');
        return;
      }
      const gpsCount = parsed.filter((p) => p.hasGps).length;
      if (onImportRouteSteps) {
        onImportRouteSteps(parsed);
      }
      onShowToast(
        'Matriz Cargada con Éxito',
        `Se importaron ${parsed.length} paradas (${gpsCount} con geolocalización GPS activa para el mapa).`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Error al importar', err?.message || 'No se pudo leer el archivo Excel/CSV.', 'alert');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenAddStep = (auditorId?: string) => {
    setTargetAuditorForAdd(auditorId);
    setIsAddStepOpen(true);
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      onShowToast(
        'Rutas Publicadas Exitosamente',
        `Hoja de ruta con ${steps.length} paradas enviada a los auditores en terreno.`,
        'success'
      );
    }, 900);
  };

  const totalStepsCount = steps.length;
  const completedStepsCount = steps.filter((s) => s.status === 'completed').length;
  const notAuditedStepsCount = steps.filter((s) => s.status === 'not_audited').length;
  const revisitStepsCount = steps.filter((s) => s.status === 'revisit_needed').length;
  const inProgressStepsCount = steps.filter((s) => s.status === 'in_progress').length;
  const pendingStepsCount = steps.filter((s) => s.status === 'pending' || !s.status).length;
  const totalVisitsPerformed = steps.reduce(
    (acc, s) => acc + (s.visitCount || (s.status === 'completed' || s.status === 'not_audited' || s.status === 'revisit_needed' ? 1 : 0)),
    0
  );

  const currentDaySteps = useMemo(() => {
    return steps.filter((s) => isStepForDay(s, selectedDay));
  }, [steps, selectedDay]);

  const activeRouteStops = useMemo(() => {
    return currentDaySteps.length > 0 ? currentDaySteps : steps;
  }, [currentDaySteps, steps]);

  // Catálogo activo para selección de paradas: inventario CAVI + puntos ya cargados en la ruta.
  const activeRoutePointOptions = useMemo<ActiveRoutePointOption[]>(() => {
    const options: ActiveRoutePointOption[] = [];
    const seen = new Set<string>();

    steps.forEach((step) => {
      const key = step.code.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      options.push({
        id: `route-${step.id}`,
        code: step.code,
        name: step.name,
        format: step.format,
        channel: step.channel,
        address: step.address,
        municipality: step.municipality,
        lat: step.lat,
        lng: step.lng,
        zone: step.zone,
      });
    });

    return options.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [steps]);

  // Administrador: vista general = un desplazamiento independiente por auditor.
  // Auxiliar: siempre queda bloqueado a su propia ruta; nunca puede ver la de otro auditor.
  const effectiveAuditorForMap = isAuxiliar ? activeAuditorId : selectedAuditorForMap;

  // Inventario georreferenciado: solo puntos cargados por el usuario.
  const mapInventoryPoints = useMemo(() => {
    const base: ActiveRoutePointOption[] = [];
    const seen = new Set<string>();

    steps.forEach((step) => {
      if (!Number.isFinite(step.lat) || !Number.isFinite(step.lng)) return;
      const key = step.code.toLowerCase();
      if (seen.has(key)) return;

      base.push({
        id: `route-pdv-${step.id}`,
        name: step.name,
        category: step.format || step.channel || 'PDV',
        subregion: step.zone || 'Centro',
        zone: step.zone,
        municipality: step.municipality,
        address: step.address,
        lat: step.lat,
        lng: step.lng,
        codePdv: step.code,
        channel: step.format || step.channel || 'CM',
      });
      seen.add(key);
    });

    return base;
  }, [steps]);

  const mapWaypoints = useMemo(() => {
    if (effectiveAuditorForMap === 'todos') return [];
    return activeRouteStops.filter((s) => s.auditorId === effectiveAuditorForMap);
  }, [activeRouteStops, effectiveAuditorForMap]);

  const mapRouteGroups = useMemo(() => {
    if (effectiveAuditorForMap !== 'todos') return [];
    const routeColors = ['#0088ff', '#10b981', '#f59e0b'];
    return auditors.map((auditor, index) => ({
      id: auditor.id,
      label: `Ruta · ${auditor.name}`,
      color: routeColors[index % routeColors.length],
      zone: auditor.zone,
      stops: activeRouteStops.filter((s) => s.auditorId === auditor.id),
    })).filter((group) => group.stops.length > 0);
  }, [activeRouteStops, auditors, effectiveAuditorForMap]);

  const routeDistanceKm = useMemo(() => {
    const valid = mapWaypoints.filter((s) => s.lat && s.lng);
    return calculateTotalRouteDistanceKm(valid);
  }, [mapWaypoints]);

  const routeTime = useMemo(() => {
    return estimateTravelTime(routeDistanceKm);
  }, [routeDistanceKm]);

  const progressPercent = totalStepsCount > 0 ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0;

  // Resumen dinámico según los puntos reales cargados en el sistema
  const totalLoadedPointsCount = mapInventoryPoints.length;

  const pointsChannelSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    mapInventoryPoints.forEach((p) => {
      const ch = (p.channel || p.category || 'PDV').toUpperCase().trim();
      counts[ch] = (counts[ch] || 0) + 1;
    });
    return counts;
  }, [mapInventoryPoints]);

  const pointsChannelSummaryText = useMemo(() => {
    const entries = Object.entries(pointsChannelSummary);
    if (entries.length === 0) return `${totalLoadedPointsCount} PDV cargados`;
    return entries.slice(0, 4).map(([ch, cnt]) => `${cnt} ${ch}`).join(' · ');
  }, [pointsChannelSummary, totalLoadedPointsCount]);

  return (
    <div className="flex flex-col w-full space-y-4 md:space-y-5">
      {/* Hidden File Input for Excel/CSV/TXT/KML Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv, .txt, .kml, .xml"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Modals */}
      <AddRouteModal
        isOpen={isAddStepOpen}
        onClose={() => setIsAddStepOpen(false)}
        onAdd={(step) => {
          if (onAddRouteStep) onAddRouteStep(step);
          else onShowToast('Parada Agregada', `${step.code} añadida.`);
        }}
        auditors={auditors}
        defaultAuditorId={targetAuditorForAdd}
        availablePoints={activeRoutePointOptions}
      />

      <AddFloatingPointModal
        isOpen={isAddFpOpen}
        onClose={() => setIsAddFpOpen(false)}
        onAdd={(fp) => {
          if (onAddFloatingPoint) onAddFloatingPoint(fp);
          else onShowToast('Punto Creado', `${fp.code} listo para asignar.`);
        }}
      />

      {/* Full-Screen Interactive GPS Territory Modal */}
      {isGpsModalOpen && (
        <GpsTerritoryModal
          isOpen={isGpsModalOpen}
          onClose={() => setIsGpsModalOpen(false)}
          steps={steps}
          floatingPoints={floatingPoints}
          auditors={auditors}
          onToggleStepStatus={onToggleStepStatus}
          onImportRouteSteps={onImportRouteSteps}
          onShowToast={onShowToast}
        />
      )}

      {/* ========================================================================= */}
      {/*  GRAND TACTICAL HERO BANNER: RUTAS Y NAVEGACIÓN DEPARTAMENTAL */}
      {/* ========================================================================= */}
      <div className="routes-tactical-shell relative w-full rounded-3xl p-5 sm:p-6 md:p-8 overflow-hidden bg-gradient-to-br from-[#070e1f] via-[#0f1d3b] to-[#070e1f] border border-[#1e345b] shadow-2xl">
        {/* Glowing atmospheric background radial accents */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-[#0088ff]/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 bg-[#38bdf8]/10 rounded-full blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        <div className="relative z-10 flex flex-col gap-5 sm:gap-6">
          {/* Top Status & System Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#1e2a44]/80">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#0088ff]/25 text-[#38bdf8] border border-[#0088ff]/40 text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-[15px]">event</span>
                <span>Hoy: <strong className="capitalize">{todayDateFormatted}</strong></span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#131b2e] text-[#cbd5e1] border border-[#222a3d] text-[10px] font-medium">
                La Guajira · 15 Municipios (Sábados Medio Día Laboral)
              </span>
            </div>
          </div>

          {/* Hero Headline */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#0088ff] to-[#38bdf8] flex items-center justify-center text-white shadow-xl shadow-[#0088ff]/30 shrink-0">
                <span className="material-symbols-outlined text-[32px] sm:text-[38px]">alt_route</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-headline font-extrabold text-xl sm:text-2xl md:text-3xl text-white tracking-tight leading-tight">
                    {isAuxiliar ? 'Mi Hoja de Ruta Táctica y Campo' : 'Centro de Trazado de Rutas y Despacho'}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-[#cbd5e1] dark:text-[#94a3b8] mt-1 max-w-3xl leading-relaxed">
                  Monitoreo georreferenciado de <strong>{totalLoadedPointsCount} puntos de auditoría</strong> cargados en el sistema ({pointsChannelSummaryText}), trazado de rutas GPS, auditoría en terreno y desplazamiento guiado.
                </p>
              </div>
            </div>
          </div>

          {/* 4 Hero Tactical Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* 1. Puntos de Venta */}
            <div className="bg-[#101b33]/90 backdrop-blur-sm border border-[#1e2a44] p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[#38bdf8]">
                <span className="text-[11px] font-bold tracking-wide uppercase text-[#cbd5e1] dark:text-[#94a3b8]">Red Departamental</span>
                <span className="material-symbols-outlined text-[18px]">storefront</span>
              </div>
              <div className="mt-1">
                <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                  {totalLoadedPointsCount} PDV
                </span>
                <p className="text-[10px] text-[#cbd5e1] mt-0.5 break-words leading-tight" title={pointsChannelSummaryText}>
                  {pointsChannelSummaryText}
                </p>
              </div>
            </div>

            {/* 2. Paradas en Ruta Activa */}
            <div className="bg-[#101b33]/90 backdrop-blur-sm border border-[#1e2a44] p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[#0088ff]">
                <span className="text-[11px] font-bold tracking-wide uppercase text-[#94a3b8]">Paradas en Ruta</span>
                <span className="material-symbols-outlined text-[18px]">alt_route</span>
              </div>
              <div className="mt-1">
                <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                  {mapWaypoints.length} Paradas
                </span>
                <p className="text-[10px] text-[#38bdf8] mt-0.5 break-words font-medium leading-tight">
                  {selectedDay.toUpperCase()} · {selectedZone === 'Todas' ? 'La Guajira' : selectedZone}
                </p>
              </div>
            </div>

            {/* 3. Control de Auditoría */}
            <div className="bg-[#101b33]/90 backdrop-blur-sm border border-[#1e2a44] p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[11px] font-bold tracking-wide uppercase text-[#94a3b8]">Avance de Visitas</span>
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
              </div>
              <div className="mt-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
                    {completedStepsCount}
                  </span>
                  <span className="text-xs text-[#94a3b8] font-mono">/ {totalStepsCount}</span>
                  <span className="text-[10px] font-bold text-[#4edea3] ml-auto">
                    {progressPercent}%
                  </span>
                </div>
                {/* Multi-color progress bar */}
                <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden flex mt-1.5">
                  <div style={{ width: `${totalStepsCount > 0 ? (completedStepsCount / totalStepsCount) * 100 : 0}%` }} className="bg-emerald-400 h-full" title="Auditados" />
                  <div style={{ width: `${totalStepsCount > 0 ? (notAuditedStepsCount / totalStepsCount) * 100 : 0}%` }} className="bg-rose-500 h-full" title="No Auditados" />
                  <div style={{ width: `${totalStepsCount > 0 ? (revisitStepsCount / totalStepsCount) * 100 : 0}%` }} className="bg-purple-500 h-full" title="Re-visita" />
                  <div style={{ width: `${totalStepsCount > 0 ? (pendingStepsCount / totalStepsCount) * 100 : 0}%` }} className="bg-slate-500 h-full" title="Pendientes" />
                </div>
              </div>
            </div>

            {/* 4. Recorrido & Tiempos */}
            <div className="bg-[#101b33]/90 backdrop-blur-sm border border-[#1e2a44] p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[#f59e0b]">
                <span className="text-[11px] font-bold tracking-wide uppercase text-[#94a3b8]">Desplazamiento Est.</span>
                <span className="material-symbols-outlined text-[18px]">speed</span>
              </div>
              <div className="mt-1">
                <span className="text-lg sm:text-xl font-extrabold text-[#fcd34d] font-mono">
                  {formatDistance(routeDistanceKm)}
                </span>
                <p className="text-[10px] text-[#cbd5e1] mt-0.5 break-words leading-tight">
                  Est. {routeTime} · {filteredAuditors.length} auditores
                </p>
              </div>
            </div>
          </div>

          {/* Quick Auditor Focus Filter for Route Mapping */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-[#1e2a44]/80">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#94a3b8] font-medium hidden sm:inline">Ruta de Auditor:</span>
              <select
                value={effectiveAuditorForMap}
                onChange={(e) => setSelectedAuditorForMap(e.target.value)}
                disabled={isAuxiliar}
                className="bg-[#131b2e] text-white text-xs px-3 py-1.5 rounded-xl border border-[#222a3d] focus:outline-none focus:ring-1 focus:ring-[#0088ff] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <option value="todos">Todas las rutas de auditores</option>
                {auditors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Integrated Day & Zone Segmented Selectors */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#1e2a44]/80">
            {/* View Selector Tabs: Only Semana, Mes, Calendario Auditor */}
            <div className="flex items-center gap-1.5 bg-[#0b1326] p-1.5 rounded-2xl border border-[#222a3d] max-w-full overflow-x-auto scrollbar-none">
              {[
                { key: 'semana', label: 'Semana', icon: 'view_week', desc: 'Matriz y Hoja de Ruta Semanal' },
                { key: 'mes', label: 'Mes', icon: 'calendar_month', desc: 'Vista Mensual Departamental' },
                { key: 'calendario_auditor', label: 'Calendario Auditor', icon: 'date_range', desc: 'Agenda de Campo' },
              ].map((item) => {
                const isSelected = selectedDay === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSelectedDay(item.key);
                      if (item.key === 'semana') {
                        onShowToast('Vista Semanal', 'Visualizando hoja de ruta y matriz semanal.', 'info');
                      } else if (item.key === 'mes') {
                        onShowToast('Vista Mensual', 'Visualizando matriz mensual de La Guajira.', 'info');
                      } else if (item.key === 'calendario_auditor') {
                        onShowToast('Calendario Auditor', 'Agenda interactiva de campo por auditor.', 'info');
                      }
                    }}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-[#0088ff] text-white shadow-md shadow-[#0088ff]/40 ring-1 ring-white/30'
                        : 'text-[#bbcabf] hover:text-white hover:bg-[#131b2e]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Zone Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="routes-zone-filter" className="text-xs text-[#94a3b8] font-medium">Zona</label>
              <select
                id="routes-zone-filter"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value as typeof selectedZone)}
                className="bg-[#0b1326] text-white text-xs px-3 py-1.5 rounded-xl border border-[#222a3d] focus:outline-none focus:ring-1 focus:ring-[#0088ff] cursor-pointer min-w-[150px]"
              >
                <option value="Todas">Todas</option>
                <option value="Norte">Norte</option>
                <option value="Centro">Centro</option>
                <option value="Sur">Sur</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* VISTA MENSUAL, SEMANAL O CALENDARIO AUDITOR */}
      {selectedDay === 'mes' ? (
        <MonthlyRoutesView
          steps={steps}
          auditors={auditors}
          onSelectDay={(day) => setSelectedDay('semana')}
          onOpenAddStep={handleOpenAddStep}
          onOpenGpsModal={() => setIsGpsModalOpen(true)}
          onShowToast={onShowToast}
        />
      ) : selectedDay === 'calendario_auditor' ? (
        <ActiveAuditorCalendarView
          steps={steps}
          auditors={isAuxiliar ? auditors.filter((a) => a.id === activeAuditorId) : auditors}
          activeAuditorId={isAuxiliar ? activeAuditorId : selectedAuditorForCalendar}
          onSelectAuditor={(audId) => {
            if (!isAuxiliar) setSelectedAuditorForCalendar(audId);
          }}
          onToggleStepStatus={onToggleStepStatus}
          onOpenAuditModal={(step) => setAuditModalStep(step)}
          onOpenAddStep={handleOpenAddStep}
          onOpenGpsModal={() => setIsGpsModalOpen(true)}
          onShowToast={onShowToast}
          isAuxiliar={isAuxiliar}
          userRole={userRole}
        />
      ) : (
        /* VISTA UNIFICADA DE SEMANA:
           1. engineering Auditores de Campo (Tarjetas + Matriz semanal)
           2. Alertas (puntos por tiempo sin visitar, reprogramados o cerrados)
           3. Mapa (de último al fondo)
        */
        <div className="flex flex-col gap-6 w-full">
          {/* ========================================================================= */}
          {/* 1. ENGINEERING AUDITORES DE CAMPO & MATRIZ SEMANAL */}
          {/* ========================================================================= */}
          <section className="w-full bg-white dark:bg-[#131b2e] rounded-3xl p-4 sm:p-6 border-2 border-slate-300 dark:border-[#222a3d] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-200 dark:border-[#222a3d]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0088ff]/15 dark:bg-[#0088ff]/25 text-[#0088ff] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">engineering</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-headline font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                      Auditores de Campo · Hoja de Ruta Semanal
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-[#0088ff]/20 text-[#0070d8] dark:text-[#38bdf8] text-[11px] font-extrabold border border-blue-200 dark:border-[#0088ff]/30 font-mono">
                      {steps.length} PDVs en Matriz
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 font-medium">
                    Supervisión operativa, distribución de carga y paradas asignadas por zona geográfica en La Guajira.
                  </p>
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenAddStep(undefined)}
                  className="px-3.5 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[16px]">add_location</span>
                  <span>+ Asignar PDV Manual</span>
                </button>
              )}
            </div>

            {/* Auditores Cards Grid (Samuel - Norte, Kleyder - Centro, Jose - Sur) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {filteredAuditors.map((auditor) => {
                const audSteps = steps.filter((s) => s.auditorId === auditor.id || (!s.auditorId && auditor.id === 'aud-1'));
                const completedCount = audSteps.filter((s) => s.status === 'completed').length;
                const progress = audSteps.length > 0 ? Math.round((completedCount / audSteps.length) * 100) : 0;

                return (
                  <div
                    key={auditor.id}
                    className="rounded-2xl border-2 border-slate-300 dark:border-[#222a3d] bg-slate-50/70 dark:bg-[#171f33] p-4 flex flex-col justify-between shadow-xs transition-all hover:border-[#0088ff]/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={auditor.avatar}
                          alt={auditor.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-[#0088ff] shadow-sm bg-white dark:bg-[#0b1326]"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#171f33] bg-emerald-500"></span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-headline font-extrabold text-sm text-slate-900 dark:text-white break-words">
                          {auditor.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-[#131b2e] text-slate-900 dark:text-[#93c5fd] font-extrabold text-[10px] border border-slate-300 dark:border-[#2d3a58]">
                            Zona {auditor.zone}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-[#cbd5e1]">
                            {auditor.vehicle || 'Moto Oficial'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white block">
                          {completedCount}/{audSteps.length}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">
                          {progress}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2.5">
                      <div className="flex-1 bg-slate-200 dark:bg-[#222a3d] h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#0088ff] transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold font-mono text-emerald-700 dark:text-[#4edea3]">{progress}%</span>
                    </div>

                    {auditor.currentLocation && (
                      <div className="text-[10px] text-slate-600 dark:text-[#94a3b8] mt-2 pt-2 border-t border-slate-200 dark:border-[#222a3d] flex items-center gap-1 break-words">
                        <span className="material-symbols-outlined text-[13px] text-[#0088ff] shrink-0">near_me</span>
                        <span>{auditor.currentLocation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Matriz Semanal Completa */}
            <WeeklyRoutesMatrix
              steps={steps}
              auditors={auditors}
              onToggleStepStatus={onToggleStepStatus}
              onOpenAuditModal={(step) => setAuditModalStep(step)}
              onOpenAddStep={handleOpenAddStep}
              onOpenGpsModal={() => setIsGpsModalOpen(true)}
              onSelectDay={() => setSelectedDay('semana')}
              onUploadMatrix={() => fileInputRef.current?.click()}
              onDownloadTemplate={downloadRoutesTemplate}
              onShowToast={onShowToast}
              userRole={userRole}
            />
          </section>

          {/* ========================================================================= */}
          {/* 2. ALERTAS DE PUNTOS PRIORIZADOS (LUEGO) */}
          {/* ========================================================================= */}
          <AlertPointsAssignmentPool
            floatingPoints={floatingPoints}
            steps={steps}
            auditors={auditors}
            onAssignPoint={onAssignFloatingPoint}
            onAutoAssignAll={onAutoAssignAll}
            onDeletePoint={onDeleteFloatingPoint}
            onOpenAddModal={() => setIsAddFpOpen(true)}
            onShowToast={onShowToast}
            userRole={userRole}
            onReassignStepDay={(stepId, day, audId) => {
              if (onReassignRouteStep) {
                onReassignRouteStep(stepId, day, audId);
              } else if (onAddRouteStep) {
                const targetStep = steps.find((s) => s.id === stepId);
                if (targetStep) {
                  const matchedAud = audId ? auditors.find((a) => a.id === audId) : undefined;
                  onAddRouteStep({
                    ...targetStep,
                    day,
                    auditorId: matchedAud?.id || targetStep.auditorId,
                    auditorName: matchedAud?.name || targetStep.auditorName,
                    status: 'pending',
                    notes: `Priorizado para re-visita en ${day?.toUpperCase() || 'RUTA'}`,
                  });
                }
              }
            }}
          />

          {/* ========================================================================= */}
          {/* 3. MAPA TERRITORIAL DE RUTAS (DE ÚLTIMO) */}
          {/* ========================================================================= */}
          <section className="w-full bg-white dark:bg-[#131b2e] rounded-3xl p-4 sm:p-6 border-2 border-slate-300 dark:border-[#222a3d] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222a3d]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0088ff] text-[22px]">public</span>
                <h3 className="font-headline font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Mapa Territorial de Rutas y Desplazamiento (CAVIMAPS)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {mapWaypoints.length} Puntos Georreferenciados en Terreno
              </span>
            </div>
            <div className="w-full bg-[#060e20] rounded-2xl overflow-hidden border border-[#222a3d] shadow-md relative min-h-[540px] flex flex-col">
              <CaviNativeMap
                height="540px"
                initialRouteStops={mapWaypoints}
                routeGroups={mapRouteGroups}
                showPointCatalog={true}
                resetRouteOnEmpty
                onStopArrival={(stop) => {
                  onShowToast(
                    'Parada Alcanzada',
                    `Llegada registrada en ${stop.name} (${stop.municipality || 'La Guajira'}).`,
                    'success'
                  );
                }}
              />
            </div>
          </section>
        </div>
      )}

      {/* Audit Visit Outcome Modal */}
      <AuditVisitModal
        isOpen={!!auditModalStep}
        step={auditModalStep}
        currentAuditorName={
          auditors.find((a) => a.id === auditModalStep?.auditorId)?.name ||
          currentAuditor?.name ||
          'Auditor'
        }
        onClose={() => setAuditModalStep(null)}
        onSaveAudit={(stepId, result) => {
          if (onUpdateAuditStatus) {
            onUpdateAuditStatus(stepId, result);
          } else if (onToggleStepStatus) {
            onToggleStepStatus(stepId);
          }
        }}
      />
    </div>
  );
};
