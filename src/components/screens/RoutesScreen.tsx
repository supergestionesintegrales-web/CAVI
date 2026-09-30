import React, { useState, useRef, useMemo } from 'react';
import { Auditor, RouteStep, FloatingPoint, UserRole } from '../../types';
import { AddRouteModal } from '../AddRouteModal';
import { AddFloatingPointModal } from '../AddFloatingPointModal';
import { GpsTerritoryModal } from '../GpsTerritoryModal';
import { CaviNativeMap } from '../CaviNativeMap';
import { WeeklyRoutesMatrix } from '../WeeklyRoutesMatrix';
import { MonthlyRoutesView } from '../MonthlyRoutesView';
import { AuditVisitModal } from '../AuditVisitModal';
import { ActiveAuditorCalendarView } from '../ActiveAuditorCalendarView';
import { parseRoutesFile, downloadRoutesTemplate } from '../../utils/routesExcel';
import { calculateTotalRouteDistanceKm, formatDistance, estimateTravelTime } from '../../utils/geoUtils';
import { CAVI_POINTS } from '../../data/caviPointsData';

interface RoutesScreenProps {
  auditors: Auditor[];
  steps: RouteStep[];
  floatingPoints: FloatingPoint[];
  activeRouteSourceFile?: string;
  onGoToMacros?: () => void;
  onAssignFloatingPoint: (id: string, auditorName: string, day?: string) => void;
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
  onReloadSampleAlertPoints?: () => void;
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
  onReloadSampleAlertPoints,
}) => {
  const isAuxiliar = userRole === 'auxiliar';
  const currentAuditor = auditors.find((a) => a.id === activeAuditorId) || auditors[0];

  const [selectedDay, setSelectedDay] = useState('martes');
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

  // Administrador: vista general = un desplazamiento independiente por auditor.
  // Auxiliar: siempre queda bloqueado a su propia ruta; nunca puede ver la de otro auditor.
  const effectiveAuditorForMap = isAuxiliar ? activeAuditorId : selectedAuditorForMap;

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
      {/* 🚀 GRAND TACTICAL HERO BANNER: RUTAS Y NAVEGACIÓN DEPARTAMENTAL */}
      {/* ========================================================================= */}
      <div className="relative w-full rounded-3xl p-5 sm:p-6 md:p-8 overflow-hidden bg-gradient-to-br from-[#070e1f] via-[#0f1d3b] to-[#070e1f] border border-[#1e345b] shadow-2xl">
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
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0088ff]/15 border border-[#0088ff]/30 text-[#38bdf8] text-[11px] font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] -ml-2.5" />
                SISTEMA TÁCTICO DE RUTAS Y NAVEGACIÓN CAVI
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#131b2e] text-[#cbd5e1] border border-[#222a3d] text-[10px] font-medium">
                La Guajira · 15 Municipios
              </span>
              {activeRouteSourceFile && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#131b2e] text-[#93c5fd] border border-[#222a3d] text-[10px] font-mono hidden md:inline">
                  {activeRouteSourceFile}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-[#0c1322] border border-[#222a3d] text-[11px] font-mono text-[#a5b4fc] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">
                  {isAuxiliar ? 'engineering' : 'admin_panel_settings'}
                </span>
                <span>{isAuxiliar ? `Auxiliar: ${currentAuditor.name}` : 'Modo Administrador'}</span>
              </span>
            </div>
          </div>

          {/* Hero Headline & Primary Expand Button */}
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
                <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 max-w-3xl leading-relaxed">
                  Monitoreo georreferenciado de <strong>595+ puntos de venta</strong> (CDA, Puntos Físicos, Centros de Manejo y Bancarios), trazado de rutas GPS, auditoría en terreno y desplazamiento guiado.
                </p>
              </div>
            </div>

            {/* PRIMARY HERO ACTION: AMPLIAR MAPA EN GRANDE */}
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => setMapLayoutMode(mapLayoutMode === 'panoramic_large' ? 'split' : 'panoramic_large')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  mapLayoutMode === 'panoramic_large'
                    ? 'bg-[#0088ff] hover:bg-[#0070d8] text-white shadow-[#0088ff]/40 ring-2 ring-[#38bdf8]/60'
                    : 'bg-[#1e293b] hover:bg-[#2d3a58] text-[#38bdf8] border border-[#0088ff]/50'
                }`}
                title="Ampliar o compactar el mapa de rutas"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {mapLayoutMode === 'panoramic_large' ? 'close_fullscreen' : 'open_in_full'}
                </span>
                <span>
                  {mapLayoutMode === 'panoramic_large' ? '✓ Mapa en Grande (Activo)' : 'Ampliar Mapa en Grande'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsGpsModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-[#131b2e] hover:bg-[#1e293b] text-[#cbd5e1] hover:text-white border border-[#222a3d] font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Ver territorio departamental en pantalla completa"
              >
                <span className="material-symbols-outlined text-[19px] text-[#38bdf8]">fullscreen</span>
                <span className="hidden sm:inline">Pantalla Completa</span>
              </button>
            </div>
          </div>

          {/* 4 Hero Tactical Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* 1. Puntos de Venta */}
            <div className="bg-[#101b33]/90 backdrop-blur-sm border border-[#1e2a44] p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[#38bdf8]">
                <span className="text-[11px] font-bold tracking-wide uppercase text-[#94a3b8]">Red Departamental</span>
                <span className="material-symbols-outlined text-[18px]">storefront</span>
              </div>
              <div className="mt-1">
                <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                  {CAVI_POINTS.length} PDV
                </span>
                <p className="text-[10px] text-[#cbd5e1] mt-0.5 truncate">
                  196 CDA · 168 PF · 92 CM · 139 Banco
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
                <p className="text-[10px] text-[#38bdf8] mt-0.5 truncate font-medium">
                  {selectedDay.toUpperCase()} · {selectedZone === 'Todas' ? 'La Guajira' : `Zona ${selectedZone}`}
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
                <p className="text-[10px] text-[#cbd5e1] mt-0.5 truncate">
                  Est. {routeTime} · {filteredAuditors.length} auditores
                </p>
              </div>
            </div>
          </div>

          {/* Operational Action Controls & Data Management */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1e2a44]/80">
            {/* Real Data Actions */}
            {!isAuxiliar && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay('calendario_auditor');
                    onShowToast('Calendario del Auditor Activo', 'Selector de rango de fechas y programación sobre nuestro mapa nativo.', 'info');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0088ff] to-[#0284c7] hover:from-[#0070d8] hover:to-[#0369a1] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
                  title="Abrir calendario del auditor con selector de rango de fechas"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  <span>Calendario Auditor (Rango de Fechas)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddStep()}
                  className="px-3 py-1.5 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
                  <span>+ Nueva Parada</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#f8fafc] text-xs font-bold border border-[#3b4760] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  title="Cargar matriz con dirección, nombre, canal y geolocalización GPS (.xlsx, .csv, .txt, .kml)"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">upload_file</span>
                  <span>Cargar Matriz PDV (GPS)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddFpOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#fcd34d] text-xs font-bold border border-[#f59e0b]/40 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  title="Agregar Punto Flotante"
                >
                  <span className="material-symbols-outlined text-[16px]">push_pin</span>
                  <span>+ Flotante</span>
                </button>

                <button
                  type="button"
                  onClick={downloadRoutesTemplate}
                  className="px-2.5 py-1.5 rounded-xl bg-[#131b2e] hover:bg-[#1e293b] text-[#cbd5e1] hover:text-white text-xs font-medium border border-[#222a3d] flex items-center gap-1 transition-all cursor-pointer"
                  title="Descargar Plantilla Excel con columnas de GPS y Canales"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#0088ff]">download</span>
                  <span className="hidden md:inline">Plantilla Matriz GPS</span>
                </button>

                {floatingPoints.length > 0 && (
                  <button
                    type="button"
                    onClick={onAutoAssignAll}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    title="Cargar puntos: priorizar alertas y completar cargue a cada auditor"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Cargar {floatingPoints.length} Puntos de Alerta</span>
                  </button>
                )}

                {totalStepsCount > 0 && onClearRouteSteps && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Seguro que deseas limpiar todas las paradas de ruta?')) {
                        onClearRouteSteps();
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#131b2e] hover:bg-[#7f1d1d]/40 text-[#fca5a5] text-xs font-medium border border-[#7f1d1d]/60 flex items-center gap-1 transition-all cursor-pointer"
                    title="Limpiar todas las paradas"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                    <span className="hidden sm:inline">Limpiar</span>
                  </button>
                )}
              </div>
            )}

            {/* Quick Auditor Focus Filter for Route Mapping */}
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
                    {a.name} (Zona {a.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Integrated Day & Zone Segmented Selectors */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#1e2a44]/80">
            {/* Day Selector Tabs */}
            <div className="flex items-center gap-1 bg-[#0b1326] p-1 rounded-xl border border-[#222a3d] max-w-full overflow-x-auto scrollbar-none">
              {[
                { key: 'lunes', label: 'Lun' },
                { key: 'martes', label: 'Mar' },
                { key: 'miércoles', label: 'Mié' },
                { key: 'jueves', label: 'Jue' },
                { key: 'viernes', label: 'Vie' },
                { key: 'semana', label: 'Semana' },
                { key: 'mes', label: 'Mes' },
                { key: 'calendario_auditor', label: 'Calendario Auditor' },
              ].map((item) => {
                const isSelected = selectedDay === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSelectedDay(item.key);
                      if (item.key === 'semana') {
                        onShowToast('Vista Alterna: Semana', 'Visualizando matriz operativa semanal completa.', 'info');
                      } else if (item.key === 'mes') {
                        onShowToast('Vista Mensual de Rutas', 'Visualizando matriz y calendario mensual para La Guajira.', 'info');
                      } else if (item.key === 'calendario_auditor') {
                        onShowToast('Calendario Auditor Activo', 'Filtrando paradas con selector de rango de fechas.', 'info');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-[#0088ff] text-white shadow-sm shadow-[#0088ff]/40'
                        : 'text-[#bbcabf] hover:text-[#dae2fd]'
                    }`}
                  >
                    {item.key === 'semana' && (
                      <span className="material-symbols-outlined text-[15px]">view_week</span>
                    )}
                    {item.key === 'mes' && (
                      <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                    )}
                    {item.key === 'calendario_auditor' && (
                      <span className="material-symbols-outlined text-[15px]">date_range</span>
                    )}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Zone Selector */}
            <div className="flex items-center gap-1 bg-[#0b1326] p-1 rounded-xl border border-[#222a3d] shrink-0">
              {(['Todas', 'Norte', 'Centro', 'Sur'] as const).map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedZone === zone
                      ? 'bg-[#0088ff] text-white font-bold shadow-md shadow-[#0088ff]/30'
                      : 'text-[#cbd5e1] hover:text-white'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🧭 VIEW MODE SWITCHER BAR (Mapa en Grande vs Vista Dividida vs Pantalla Completa) */}
      {/* ========================================================================= */}
      {selectedDay !== 'mes' && selectedDay !== 'semana' && selectedDay !== 'calendario_auditor' && (
        <div className="flex items-center justify-between flex-wrap gap-2.5 bg-[#131b2e] px-4 py-2.5 rounded-2xl border border-[#222a3d] shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#38bdf8]">view_compact</span>
              <span>Modo de Visualización:</span>
            </span>

            <div className="flex items-center gap-1 bg-[#0b1326] p-1 rounded-xl border border-[#222a3d]">
              <button
                type="button"
                onClick={() => setMapLayoutMode('panoramic_large')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mapLayoutMode === 'panoramic_large'
                    ? 'bg-[#0088ff] text-white shadow-sm shadow-[#0088ff]/30'
                    : 'text-[#cbd5e1] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">map</span>
                <span>Mapa en Grande (Panorámico)</span>
              </button>

              <button
                type="button"
                onClick={() => setMapLayoutMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mapLayoutMode === 'split'
                    ? 'bg-[#0088ff] text-white shadow-sm shadow-[#0088ff]/30'
                    : 'text-[#cbd5e1] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_sidebar</span>
                <span>Vista Dividida</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedAuditorForMap !== 'todos' && (
              <span className="px-2.5 py-1 rounded-lg bg-[#0088ff]/20 text-[#38bdf8] text-xs font-bold flex items-center gap-1">
                <span>Ruta: {auditors.find(a => a.id === effectiveAuditorForMap)?.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedAuditorForMap('todos')}
                  className="hover:text-white cursor-pointer ml-1"
                  title="Quitar filtro"
                >
                  ✕
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsGpsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#38bdf8] text-xs font-bold border border-[#3b4760] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Abrir mapa de pantalla completa"
            >
              <span className="material-symbols-outlined text-[16px]">fullscreen</span>
              <span>Pantalla Completa</span>
            </button>
          </div>
        </div>
      )}

      {/* VISTA MENSUAL, SEMANAL O DIARIA */}
      {selectedDay === 'mes' ? (
        <MonthlyRoutesView
          steps={steps}
          auditors={auditors}
          onSelectDay={(day) => setSelectedDay(day)}
          onOpenAddStep={handleOpenAddStep}
          onOpenGpsModal={() => setIsGpsModalOpen(true)}
          onShowToast={onShowToast}
        />
      ) : selectedDay === 'semana' ? (
        <WeeklyRoutesMatrix
          steps={steps}
          auditors={auditors}
          onToggleStepStatus={onToggleStepStatus}
          onOpenAuditModal={(step) => setAuditModalStep(step)}
          onOpenAddStep={handleOpenAddStep}
          onOpenGpsModal={() => setIsGpsModalOpen(true)}
          onSelectDay={(day) => setSelectedDay(day)}
          onUploadMatrix={() => fileInputRef.current?.click()}
          onDownloadTemplate={downloadRoutesTemplate}
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
        />
      ) : (
        /* RESPONSIVE LAYOUT (PANORAMIC LARGE MAP OR SPLIT) */
        <div className="flex flex-col w-full space-y-6">
          {/* 1. PANORAMIC LARGE MAP (WHEN MODE IS PANORAMIC_LARGE) */}
          {mapLayoutMode === 'panoramic_large' && (
            <div className="w-full bg-[#060e20] rounded-2xl overflow-hidden border border-[#222a3d] shadow-2xl relative">
              <CaviNativeMap
                height="680px"
                isExpandedLarge={true}
                onToggleExpandLarge={() => setMapLayoutMode('split')}
                initialRouteStops={mapWaypoints}
                routeGroups={mapRouteGroups}
                showPointCatalog={false}
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
          )}

          {/* 2. ITINERARIES & DISPATCH SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: Auditor Cards & Itineraries */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-4">
            <div className="flex items-center justify-between pt-1">
              <h2 className="font-headline font-bold text-sm text-[#f8fafc] flex items-center gap-2">
                <span>Auditores de Campo</span>
                <span className="px-2 py-0.5 rounded-full bg-[#1e293b] text-[10px] text-white border border-[#334155]">
                  {filteredAuditors.length} en pantalla
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allCollapsed = filteredAuditors.every((a) => collapsedAuditors[a.id]);
                    const nextState: Record<string, boolean> = {};
                    filteredAuditors.forEach((a) => {
                      nextState[a.id] = !allCollapsed;
                    });
                    setCollapsedAuditors((prev) => ({ ...prev, ...nextState }));
                  }}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#1e293b] text-[#cbd5e1] hover:text-white hover:bg-[#2d3a58] transition-colors border border-[#334155] cursor-pointer flex items-center gap-1"
                  title="Plegar o desplegar todas las paradas"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {filteredAuditors.every((a) => collapsedAuditors[a.id]) ? 'unfold_more' : 'unfold_less'}
                  </span>
                  <span>
                    {filteredAuditors.every((a) => collapsedAuditors[a.id]) ? 'Desplegar todas' : 'Plegar todas'}
                  </span>
                </button>
                <span className="text-xs text-[#cbd5e1] font-medium hidden sm:inline">
                  {totalStepsCount} paradas totales
                </span>
              </div>
            </div>

            {/* DYNAMIC AUDITOR CARDS */}
            {filteredAuditors.map((aud) => {
              const auditorSteps = steps.filter((s) => {
                const matchAuditor = s.auditorId === aud.id || (!s.auditorId && aud.id === 'aud-1');
                if (!matchAuditor) return false;
                return isStepForDay(s, selectedDay);
              });
              const completedCount = auditorSteps.filter((s) => s.status === 'completed').length;
              const notAuditedCount = auditorSteps.filter((s) => s.status === 'not_audited').length;
              const revisitCount = auditorSteps.filter((s) => s.status === 'revisit_needed').length;
              const inProgressCount = auditorSteps.filter((s) => s.status === 'in_progress').length;
              const pendingCount = auditorSteps.filter((s) => s.status === 'pending' || !s.status).length;
              const targetCount = auditorSteps.length;
              const progressPercent = targetCount > 0 ? Math.round((completedCount / targetCount) * 100) : 0;
              const auditorTotalVisits = auditorSteps.reduce(
                (acc, s) => acc + (s.visitCount || (s.status === 'completed' || s.status === 'not_audited' || s.status === 'revisit_needed' ? 1 : 0)),
                0
              );
              const cmCount = auditorSteps.filter((s) => s.format === 'CM').length;
              const pfCount = auditorSteps.filter((s) => s.format === 'PF').length;
              const cdaCount = auditorSteps.filter((s) => s.format === 'CDA').length;
              const isCollapsed = collapsedAuditors[aud.id] ?? true;
              const currentAuditorFilter = auditorStatusFilters[aud.id] || 'all';

              const displayedSteps = auditorSteps.filter((s) => {
                if (currentAuditorFilter === 'all') return true;
                if (currentAuditorFilter === 'completed') return s.status === 'completed';
                if (currentAuditorFilter === 'not_audited') return s.status === 'not_audited';
                if (currentAuditorFilter === 'revisit_needed') return s.status === 'revisit_needed';
                if (currentAuditorFilter === 'pending') return s.status === 'pending' || !s.status || s.status === 'in_progress';
                return true;
              });

              return (
                <div
                  key={aud.id}
                  className="bg-[#171f33] rounded-2xl overflow-hidden shadow-sm flex flex-col border border-[#222a3d]"
                >
                  {/* Top Accent Bar */}
                  <div
                    className={`h-1.5 w-full ${
                      aud.zone === 'Norte'
                        ? 'bg-[#0088ff]'
                        : aud.zone === 'Centro'
                        ? 'bg-[#3b82f6]'
                        : 'bg-[#8b5cf6]'
                    }`}
                  />

                  <div className="p-4 flex flex-col gap-3">
                    {/* Auditor Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            className="w-11 h-11 rounded-full object-cover shadow-sm ring-2 ring-[#0088ff]"
                            alt={aud.name}
                            src={aud.avatar}
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#4edea3] ring-2 ring-[#171f33]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {aud.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#131b2e] text-[#0088ff] text-[10px] font-bold border border-slate-200 dark:border-transparent">
                              Zona {aud.zone}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-[#cbd5e1] font-mono mt-0.5">
                            ID: {aud.code} · {aud.statusText || 'Listo para ruta'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {completedCount}
                          </span>
                          <span className="text-[11px] text-slate-400">/</span>
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {targetCount}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-[#cbd5e1]">auditados</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end text-[10px] font-mono mt-0.5 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-[#0088ff]/20 dark:text-[#38bdf8] font-bold">
                            {auditorTotalVisits} {auditorTotalVisits === 1 ? 'visita' : 'visitas'}
                          </span>
                          {revisitCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-bold">
                              {revisitCount} re-visita
                            </span>
                          )}
                          {notAuditedCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 font-bold">
                              {notAuditedCount} no audit.
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAuditorForCalendar(aud.id);
                              setSelectedDay('calendario_auditor');
                              onShowToast(
                                'Calendario del Auditor Activo',
                                `Abriendo calendario y cronograma de ${aud.name} con selector de rango de fechas.`,
                                'info'
                              );
                            }}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold border border-[#0088ff]/40 bg-[#0088ff]/15 hover:bg-[#0088ff]/30 text-[#38bdf8] hover:text-white transition-all cursor-pointer flex items-center gap-1"
                            title="Ver calendario y cronograma de este auditor con selector de rango de fechas"
                          >
                            <span className="material-symbols-outlined text-[13px]">date_range</span>
                            <span>Calendario</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAuditorForMap(selectedAuditorForMap === aud.id ? 'todos' : aud.id);
                              onShowToast(
                                'Filtro de Mapa',
                                selectedAuditorForMap === aud.id
                                  ? 'Mostrando todas las rutas departamentales'
                                  : `Trazando ruta exclusiva de ${aud.name}`,
                                'info'
                              );
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                              selectedAuditorForMap === aud.id
                                ? 'bg-[#0088ff] text-white border-[#38bdf8] shadow-xs'
                                : 'bg-[#131b2e] text-[#cbd5e1] hover:text-white border-[#222a3d]'
                            }`}
                            title="Trazar ruta de este auditor en el mapa"
                          >
                            <span className="material-symbols-outlined text-[13px]">alt_route</span>
                            <span>{selectedAuditorForMap === aud.id ? 'Ruta en Mapa ✓' : 'Ver Ruta'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Format Breakdown & Add Stop Button */}
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-transparent p-2.5 rounded-xl">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-700 dark:text-[#cbd5e1] font-semibold">Formatos:</span>
                        <span className="px-2 py-0.5 rounded bg-[#065f46] text-white font-bold text-[10px]">
                          {cdaCount} CDA
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#4338ca] text-white font-bold text-[10px]">
                          {pfCount} PF
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#0284c7] text-white font-bold text-[10px]">
                          {cmCount} CM
                        </span>
                      </div>

                      {!isAuxiliar && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddStep(aud.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#0088ff] hover:bg-[#0070d8] text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm shadow-[#0088ff]/30"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          <span>Agregar Parada</span>
                        </button>
                      )}
                    </div>

                    {/* Real Route Steps Sequence: Collapsible Section (Folded by Default) */}
                    <div className="mt-1 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => toggleAuditorCollapsed(aud.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#131b2e] dark:hover:bg-[#1e293b] border border-slate-200 dark:border-transparent transition-all cursor-pointer group text-left"
                        title={isCollapsed ? 'Click para desplegar paradas' : 'Click para plegar paradas'}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-[#1e293b] group-hover:bg-slate-300 dark:group-hover:bg-[#222a3d] flex items-center justify-center text-[#0088ff] shrink-0 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">
                              {isCollapsed ? 'expand_more' : 'expand_less'}
                            </span>
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white truncate">
                            Control de Paradas y Auditoría
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-[#0088ff] dark:text-[#38bdf8] font-mono font-bold">
                            {auditorSteps.length} {auditorSteps.length === 1 ? 'parada' : 'paradas'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-[#1e293b] text-slate-800 dark:text-[#cbd5e1]">
                            {isCollapsed ? 'Desplegar' : 'Plegar'}
                          </span>
                        </div>
                      </button>

                      {/* Unfolded Content: Only renders when unfolded */}
                      {!isCollapsed && (
                        auditorSteps.length === 0 ? (
                          /* Clean Empty State when no real steps are loaded */
                          <div className="p-4 rounded-xl bg-[#131b2e] text-center flex flex-col items-center gap-2 animate-in fade-in">
                            <div className="w-9 h-9 rounded-full bg-[#1e293b] text-[#cbd5e1] flex items-center justify-center">
                              <span className="material-symbols-outlined text-[20px]">fmd_bad</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">
                                Sin paradas asignadas para {aud.name}
                              </p>
                              <p className="text-[11px] text-[#cbd5e1] mt-0.5">
                                {isAuxiliar
                                  ? 'Tu supervisor aún no ha cargado las visitas para esta jornada.'
                                  : 'Agrega una parada manualmente o importa las rutas desde un archivo Excel.'}
                              </p>
                            </div>
                            {!isAuxiliar && (
                              <button
                                type="button"
                                onClick={() => handleOpenAddStep(aud.id)}
                                className="mt-1 px-3 py-1.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#0088ff] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">add_circle</span>
                                <span>+ Agregar Primera Parada</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          /* Real Step Items with Clean Borderless Surface */
                          <div className="flex flex-col gap-2.5 animate-in fade-in">
                            {/* Filter Chips per Audit Status */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                              {[
                                { id: 'all', label: 'Todas', count: auditorSteps.length },
                                { id: 'completed', label: 'Auditadas', count: completedCount },
                                { id: 'not_audited', label: 'No Auditadas', count: notAuditedCount },
                                { id: 'revisit_needed', label: 'Re-visita', count: revisitCount },
                                { id: 'pending', label: 'Pendientes', count: inProgressCount + pendingCount },
                              ].map((f) => (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() =>
                                    setAuditorStatusFilters((prev) => ({
                                      ...prev,
                                      [aud.id]: f.id,
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                                    currentAuditorFilter === f.id
                                      ? 'bg-[#0088ff] text-white font-bold shadow-xs'
                                      : 'bg-slate-100 dark:bg-[#131b2e] text-slate-700 dark:text-[#cbd5e1] hover:text-white border border-slate-200 dark:border-[#222a3d]'
                                  }`}
                                >
                                  <span>{f.label}</span>
                                  <span
                                    className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
                                      currentAuditorFilter === f.id
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-200 dark:bg-[#1e293b]'
                                    }`}
                                  >
                                    {f.count}
                                  </span>
                                </button>
                              ))}
                            </div>

                            {displayedSteps.length === 0 ? (
                              <div className="p-3 text-center text-xs text-slate-500 dark:text-[#94a3b8] bg-slate-50 dark:bg-[#131b2e] rounded-xl border border-dashed border-slate-200 dark:border-[#222a3d]">
                                No hay paradas en el filtro "{currentAuditorFilter}"
                              </div>
                            ) : (
                              displayedSteps.map((step, idx) => {
                                const isCurrent = step.status === 'in_progress';
                                const isCompleted = step.status === 'completed';
                                const isNotAudited = step.status === 'not_audited';
                                const isRevisit = step.status === 'revisit_needed';
                                const isPending = !step.status || step.status === 'pending';
                                const visits = step.visitCount || (isCompleted || isNotAudited || isRevisit ? 1 : 0);

                                return (
                                  <div
                                    key={step.id}
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl transition-all ${
                                      isCompleted
                                        ? 'bg-emerald-50/70 dark:bg-[#131b2e] border-l-4 border-l-[#10b981] border border-emerald-200 dark:border-[#10b981]/20 shadow-xs'
                                        : isNotAudited
                                        ? 'bg-red-50/70 dark:bg-[#131b2e] border-l-4 border-l-[#ef4444] border border-red-200 dark:border-[#ef4444]/20 shadow-xs'
                                        : isRevisit
                                        ? 'bg-purple-50/70 dark:bg-[#131b2e] border-l-4 border-l-[#a855f7] border border-purple-200 dark:border-[#a855f7]/20 shadow-xs'
                                        : isCurrent
                                        ? 'bg-amber-50/70 dark:bg-[#1e293b] border-l-4 border-l-[#f59e0b] border border-amber-200 dark:border-[#f59e0b]/30 shadow-sm'
                                        : 'bg-white hover:bg-slate-50 dark:bg-[#131b2e] dark:hover:bg-[#1e293b] border border-slate-200 dark:border-[#222a3d] shadow-xs'
                                    }`}
                                  >
                                    {/* Left: Quick Audit Action Circle + Main Info */}
                                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                      {/* Quick Action Button opens Audit Modal */}
                                      <button
                                        type="button"
                                        onClick={() => setAuditModalStep(step)}
                                        title="Haga clic para auditar o cambiar estado de visita"
                                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                                          isCompleted
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            : isNotAudited
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : isRevisit
                                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                                            : isCurrent
                                            ? 'bg-amber-500 text-white animate-pulse'
                                            : 'bg-slate-200 hover:bg-slate-300 dark:bg-[#1e293b] text-slate-800 dark:text-white dark:hover:bg-[#2d3a58]'
                                        }`}
                                      >
                                        {isCompleted ? (
                                          <span className="material-symbols-outlined text-[18px]">check</span>
                                        ) : isNotAudited ? (
                                          <span className="material-symbols-outlined text-[18px]">close</span>
                                        ) : isRevisit ? (
                                          <span className="material-symbols-outlined text-[18px]">replay</span>
                                        ) : isCurrent ? (
                                          <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                                        ) : (
                                          <span>{idx + 1}</span>
                                        )}
                                      </button>

                                      <div className="flex-1 min-w-0">
                                        {/* Row 1: Name, Visits Badge, Status Badge */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-[#f1f5f9] shrink-0">
                                            {step.time}
                                          </span>

                                          <span
                                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                              step.format === 'CM'
                                                ? 'bg-[#0284c7] text-white'
                                                : step.format === 'PF'
                                                ? 'bg-[#7c3aed] text-white'
                                                : 'bg-[#0088ff] text-white'
                                            }`}
                                          >
                                            {step.code}
                                          </span>

                                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                                            {step.name}
                                          </h4>

                                          {/* Visit Counter Pill */}
                                          {visits > 0 && (
                                            <span
                                              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-900 dark:bg-[#0088ff]/20 dark:text-[#38bdf8] border border-blue-200 dark:border-[#0088ff]/40 flex items-center gap-0.5 shrink-0"
                                              title={`Punto visitado ${visits} ${visits === 1 ? 'vez' : 'veces'}`}
                                            >
                                              <span className="material-symbols-outlined text-[10px]">explore</span>
                                              <span>{visits === 1 ? '1ra visita' : `${visits} visitas`}</span>
                                            </span>
                                          )}

                                          {/* Status Label Badge */}
                                          {isCompleted && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-[#064e3b] dark:text-[#6ee7b7] border border-emerald-200 dark:border-[#10b981]/40 flex items-center gap-0.5 shrink-0">
                                              <span className="material-symbols-outlined text-[11px]">check_circle</span>
                                              <span>Auditado</span>
                                            </span>
                                          )}

                                          {isNotAudited && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-800 dark:bg-[#7f1d1d]/60 dark:text-[#fca5a5] border border-red-200 dark:border-[#ef4444]/40 flex items-center gap-0.5 shrink-0">
                                              <span className="material-symbols-outlined text-[11px]">cancel</span>
                                              <span>No Auditado</span>
                                            </span>
                                          )}

                                          {isRevisit && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 dark:bg-[#581c87]/60 dark:text-[#d8b4fe] border border-purple-200 dark:border-[#a855f7]/40 flex items-center gap-0.5 shrink-0">
                                              <span className="material-symbols-outlined text-[11px]">replay</span>
                                              <span>Re-visita</span>
                                            </span>
                                          )}

                                          {isCurrent && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-[#78350f] dark:text-[#fcd34d] border border-amber-200 dark:border-[#f59e0b]/40 flex items-center gap-0.5 shrink-0">
                                              <span className="material-symbols-outlined text-[11px]">hourglass_top</span>
                                              <span>En Curso</span>
                                            </span>
                                          )}
                                        </div>

                                        {/* Row 2: Address & Alerts */}
                                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                          <p className="text-[11px] text-slate-600 dark:text-[#cbd5e1] truncate">
                                            {step.address}
                                          </p>

                                          {step.daysWithoutVisit && step.daysWithoutVisit >= 60 && (
                                            <span
                                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold inline-flex items-center gap-0.5 ${
                                                step.daysWithoutVisit >= 90
                                                  ? 'bg-red-100 text-red-800 dark:bg-[#dc2626]/30 dark:text-[#fca5a5] border border-red-200 dark:border-[#dc2626]/50'
                                                  : 'bg-amber-100 text-amber-900 dark:bg-[#d97706]/30 dark:text-[#fde68a] border border-amber-200 dark:border-[#d97706]/50'
                                              }`}
                                            >
                                              <span className="material-symbols-outlined text-[10px]">schedule</span>
                                              <span>{step.daysWithoutVisit}d sin visita</span>
                                            </span>
                                          )}
                                        </div>

                                        {/* Row 3: Audit Reason / Revisit Reason Banner */}
                                        {isNotAudited && step.auditReason && (
                                          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-red-800 dark:text-red-300 bg-red-100/80 dark:bg-red-950/50 px-2 py-0.5 rounded-lg border border-red-200 dark:border-red-900/50">
                                            <span className="material-symbols-outlined text-[13px] text-red-600 dark:text-red-400">report_problem</span>
                                            <span>Motivo no auditado: {step.auditReason}</span>
                                          </div>
                                        )}

                                        {isRevisit && step.auditReason && (
                                          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-purple-800 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/50 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-900/50">
                                            <span className="material-symbols-outlined text-[13px] text-purple-600 dark:text-purple-400">pending_actions</span>
                                            <span>Programado para re-visita: {step.auditReason}</span>
                                          </div>
                                        )}

                                        {step.notes && (
                                          <p className="text-[10px] text-slate-600 dark:text-[#94a3b8] italic mt-0.5 truncate">
                                            Nota: "{step.notes}"
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Right: Explicit "Auditar" button and Quick status options */}
                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                      {/* Primary Auditar Modal Button */}
                                      <button
                                        type="button"
                                        onClick={() => setAuditModalStep(step)}
                                        className="px-2.5 py-1.5 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
                                        title="Registrar estado de visita (Auditado, No Auditado, Re-visita, número de visitas)"
                                      >
                                        <span className="material-symbols-outlined text-[15px]">rate_review</span>
                                        <span>Auditar</span>
                                      </button>

                                      {/* Fast Cycle Button */}
                                      <button
                                        type="button"
                                        onClick={() => onToggleStepStatus && onToggleStepStatus(step.id)}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                          isCompleted
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-[#064e3b] dark:text-[#6ee7b7] border-emerald-200 dark:border-emerald-800'
                                            : isNotAudited
                                            ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-900'
                                            : isRevisit
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-900'
                                            : isCurrent
                                            ? 'bg-amber-100 text-amber-800 dark:bg-[#78350f] dark:text-[#fcd34d] border-amber-200 dark:border-amber-800'
                                            : 'bg-slate-100 text-slate-700 dark:bg-[#1e293b] dark:text-[#93c5fd] border-slate-200 dark:border-slate-700'
                                        }`}
                                        title="Click para ciclar estado rápidamente"
                                      >
                                        {isCompleted
                                          ? 'Auditado'
                                          : isNotAudited
                                          ? 'No Auditado'
                                          : isRevisit
                                          ? 'Re-visita'
                                          : isCurrent
                                          ? 'En Curso'
                                          : 'Pendiente'}
                                      </button>

                                      {!isAuxiliar && onDeleteRouteStep && (
                                        <button
                                          type="button"
                                          onClick={() => onDeleteRouteStep(step.id)}
                                          className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 dark:hover:bg-[#7f1d1d]/40 dark:text-[#cbd5e1] dark:hover:text-[#f87171] flex items-center justify-center transition-colors cursor-pointer"
                                          title="Eliminar parada"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">delete</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* RIGHT COLUMN: Interactive Territory Map (in Split Mode) & Dispatch Management */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-22">
          {/* Native CAVIMAPS Engine with Route Tracing & Guided Displacement (Split Mode) */}
          {mapLayoutMode === 'split' && (
            <div className="w-full bg-[#060e20] rounded-2xl overflow-hidden border border-[#222a3d] shadow-2xl relative">
              <CaviNativeMap
                height="520px"
                isExpandedLarge={false}
                onToggleExpandLarge={() => setMapLayoutMode('panoramic_large')}
                initialRouteStops={mapWaypoints}
                onStopArrival={(stop) => {
                  onShowToast(
                    'Parada Alcanzada',
                    `Llegada registrada en ${stop.name} (${stop.municipality || 'La Guajira'}).`,
                    'success'
                  );
                }}
              />
            </div>
          )}

          {/* RIGHT COLUMN: SMART ROUTE PLANNER OR AUXILIAR FIELD PANEL */}
          {isAuxiliar ? (
            <div className="flex flex-col gap-3 bg-[#171f33] p-4 rounded-2xl border border-[#222a3d] shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0088ff]/20 border border-[#0088ff]/30 flex items-center justify-center text-[#0088ff] shrink-0">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div>
                  <h2 className="font-headline font-bold text-sm text-white">
                    Despacho Asignado · {currentAuditor.name}
                  </h2>
                  <p className="text-[11px] text-[#cbd5e1]">
                    Zona {currentAuditor.zone} · Estado de visitas en terreno
                  </p>
                </div>
              </div>

              {/* Auditor Field Metrics */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-transparent p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-700 dark:text-[#cbd5e1] uppercase block font-bold">Paradas Asignadas</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    {steps.filter((s) => s.auditorId === currentAuditor.id && s.status === 'completed').length} /{' '}
                    {steps.filter((s) => s.auditorId === currentAuditor.id).length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-700 dark:text-[#cbd5e1] uppercase block font-bold">Eficacia</span>
                  <span className="text-base font-bold text-[#0088ff] font-mono">100% SLA</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-transparent space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-[#0088ff] dark:text-[#38bdf8] font-bold">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>Modo Operativo de Campo</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-[#cbd5e1] leading-relaxed">
                  Confirma cada visita usando el botón de estado en la secuencia. Tu reporte se sincroniza en tiempo real con la central.
                </p>
              </div>

              {/* Auxiliar Field Operations */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onShowToast(
                      'GPS Confirmado',
                      `Coordenadas satelitales de ${currentAuditor.name} transmitidas con éxito`,
                      'success'
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#0088ff] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">my_location</span>
                  <span>Confirmar Ubicación GPS en Campo</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onShowToast(
                      'Avance Transmitido',
                      `Reporte de paradas de la Zona ${currentAuditor.zone} sincronizado con la central`,
                      'info'
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                  <span>Transmitir Avance de Jornada</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* CONTROL DE CARGUE Y CAPACIDAD DE AUDITORES (DESPACHO INTELIGENTE) */}
              <div className="flex flex-col gap-3 bg-white dark:bg-[#171f33] p-4 rounded-2xl border border-slate-200 dark:border-[#222a3d] shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222a3d]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0088ff]/20 text-[#0088ff] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                    </div>
                    <div>
                      <h2 className="font-headline font-bold text-sm text-slate-900 dark:text-white">
                        Cargue y Capacidad de Auditores
                      </h2>
                      <p className="text-[11px] text-slate-600 dark:text-[#cbd5e1]">
                        Asignación balanceada de red operativa en La Guajira
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-[#0088ff]/20 text-blue-900 dark:text-[#38bdf8] text-[11px] font-mono font-bold">
                    {auditors.length} Auditores
                  </span>
                </div>

                {/* Priority Rule Notice */}
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-[#0f1d2e] border border-blue-200 dark:border-[#0088ff]/30 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[17px] text-[#0088ff] shrink-0 mt-0.5">priority_high</span>
                  <div className="text-[11px] text-slate-700 dark:text-[#cbd5e1] leading-relaxed">
                    <strong className="text-slate-900 dark:text-white font-bold block mb-0.5">
                      Regla de Despacho Prioritaria
                    </strong>
                    Al ejecutar el cargue, <span className="font-semibold text-red-600 dark:text-[#f87171]">se asignan primero los puntos con alerta de campo</span> (quiebres, moras &gt;60 días o anomalías). Una vez cubiertas todas las alertas, se distribuyen los demás puntos para completar el cargue y cuota a cada auditor.
                  </div>
                </div>

                {/* Auditor Workload Progress Cards */}
                <div className="space-y-2 pt-1">
                  {auditors.map((aud) => {
                    const audSteps = steps.filter((s) => s.auditorId === aud.id);
                    const alertStepsCount = audSteps.filter((s) => (s.daysWithoutVisit && s.daysWithoutVisit >= 60) || (s.alertCategory && s.alertCategory !== 'ninguna')).length;
                    const regularStepsCount = audSteps.length - alertStepsCount;
                    const target = aud.visitsTarget > 0 ? aud.visitsTarget : Math.max(audSteps.length, 10);
                    const percentLoaded = Math.min(100, Math.round((audSteps.length / target) * 100));

                    return (
                      <div
                        key={aud.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-[#222a3d] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                              {aud.name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-[#94a3b8]">
                              Zona {aud.zone} · {aud.code}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                              {audSteps.length} paradas
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-[#94a3b8] block">
                              {percentLoaded}% cargado
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-[#1e293b] h-2 rounded-full overflow-hidden flex">
                          {alertStepsCount > 0 && (
                            <div
                              style={{ width: `${(alertStepsCount / target) * 100}%` }}
                              className="bg-[#ef4444] h-full"
                              title={`${alertStepsCount} paradas con alerta prioritaria`}
                            />
                          )}
                          {regularStepsCount > 0 && (
                            <div
                              style={{ width: `${(regularStepsCount / target) * 100}%` }}
                              className="bg-[#0088ff] h-full"
                              title={`${regularStepsCount} paradas regulares`}
                            />
                          )}
                        </div>

                        {/* Breakdown pills */}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="inline-flex items-center gap-1 font-semibold text-red-700 dark:text-[#fca5a5]">
                            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                            {alertStepsCount} con alerta priorizada
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-[#93c5fd]">
                            <span className="w-2 h-2 rounded-full bg-[#0088ff]" />
                            {regularStepsCount} regulares
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TACTICAL ACTIONS BAR */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={onAutoAssignAll}
                    className="py-3 px-3 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
                    title="Asignar primero los puntos con alerta y completar el cargue de cada auditor con los demás puntos"
                  >
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    <span className="truncate">Cargar Rutas (Priorizar Alertas)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="py-3 px-3 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#f8fafc] text-xs font-bold border border-[#3b4760] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#38bdf8]">
                      {isPublishing ? 'sync' : 'send_to_mobile'}
                    </span>
                    <span className="truncate">
                      {isPublishing ? 'Publicando...' : 'Publicar Rutas'}
                    </span>
                  </button>
                </div>
                <p className="text-center text-[10px] text-[#cbd5e1] pt-0.5">
                  <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">verified_user</span>
                  Cargue balanceado CAVI · Priorización automática de alertas activa
                </p>
              </div>
            </>
          )}
        </div>
      </div>
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
