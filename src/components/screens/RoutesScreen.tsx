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
  const isAdmin = userRole === 'administrador';
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

  // Catálogo activo para selección de paradas: inventario CAVI + puntos ya cargados en la ruta.
  const activeRoutePointOptions = useMemo<ActiveRoutePointOption[]>(() => {
    const options: ActiveRoutePointOption[] = [];
    const seen = new Set<string>();

    CAVI_POINTS.forEach((point) => {
      const channel = point.channel || point.category || 'CM';
      const channelUpper = channel.toUpperCase();
      const format: 'CM' | 'PF' | 'CDA' =
        channelUpper.includes('CDA') ? 'CDA' :
        channelUpper.includes('PF') || channelUpper.includes('FIJO') ? 'PF' :
        'CM';

      const code = point.codePdv || point.id;
      const key = code.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      options.push({
        id: point.id,
        code,
        name: point.name,
        format,
        channel,
        address: point.address || point.name,
        municipality: point.municipality,
        lat: point.lat,
        lng: point.lng,
        zone: point.zone,
      });
    });

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

  // Inventario georreferenciado completo: CAVI_POINTS + cualquier PDV nuevo
  // que llegue por una ruta/Excel y todavía no exista en el catálogo base.
  const mapInventoryPoints = useMemo(() => {
    const base = [...CAVI_POINTS];
    const seen = new Set(base.map((p) => (p.codePdv || p.id).toLowerCase()));

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
      {/* 🚀 GRAND TACTICAL HERO BANNER: RUTAS Y NAVEGACIÓN DEPARTAMENTAL */}
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
              <span className="px-2.5 py-0.5 rounded-full bg-[#131b2e] text-[#cbd5e1] border border-[#222a3d] text-[10px] font-medium">
                La Guajira · 15 Municipios
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
                <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 max-w-3xl leading-relaxed">
                  Monitoreo georreferenciado de <strong>595+ puntos de venta</strong> (CDA, Puntos Físicos, Centros de Manejo y Bancarios), trazado de rutas GPS, auditoría en terreno y desplazamiento guiado.
                </p>
              </div>
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
          userRole={userRole}
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
        /* RESPONSIVE UNIFIED LAYOUT */
        <div className="flex flex-col w-full space-y-6">
          {/* MAPA PRINCIPAL: ocupación total del ancho */}
          <div className="w-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-lg relative min-h-[520px] flex flex-col">
            <CaviNativeMap
              height="520px"
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
