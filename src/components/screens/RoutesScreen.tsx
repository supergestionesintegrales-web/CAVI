import React, { useState, useRef } from 'react';
import { Auditor, RouteStep, FloatingPoint, UserRole } from '../../types';
import { MAP_IMAGE } from '../../data/mockData';
import { AddRouteModal } from '../AddRouteModal';
import { AddFloatingPointModal } from '../AddFloatingPointModal';
import { GpsTerritoryModal } from '../GpsTerritoryModal';
import { WeeklyRoutesMatrix } from '../WeeklyRoutesMatrix';
import { MonthlyRoutesView } from '../MonthlyRoutesView';
import { AuditVisitModal } from '../AuditVisitModal';
import { parseRoutesFile, downloadRoutesTemplate } from '../../utils/routesExcel';

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

  // Filter auditors by zone
  const filteredAuditors = auditors.filter((aud) => {
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

  return (
    <div className="flex flex-col w-full space-y-4 md:space-y-5">
      {/* Hidden File Input for Excel/CSV Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
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

      {/* Role Notice Banner for Auxiliar */}
      {isAuxiliar && (
        <div className="p-3 rounded-xl bg-[#171f33] border border-[#3131c0]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3131c0]/20 flex items-center justify-center text-[#c0c1ff] shrink-0">
              <span className="material-symbols-outlined text-[18px]">engineering</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#c0c1ff]">
                Modo Auxiliar · Sesión: {currentAuditor.name} ({currentAuditor.code})
              </p>
              <p className="text-[11px] text-[#cbd5e1]">
                Vista de itinerario de campo. Las funciones de asignación y despacho masivo están reservadas al Administrador.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#060e20] text-[#c0c1ff] text-[10px] font-mono border border-[#3131c0]/30 self-start sm:self-auto shrink-0">
            Zona {currentAuditor.zone}
          </span>
        </div>
      )}

      {/* HEADER SECTION: UNIFIED TITLE & DAY SELECTOR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#131b2e] p-3.5 sm:p-4 md:p-5 rounded-2xl border border-[#222a3d] shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[#171f33] flex items-center justify-center text-[#0088ff] shadow-inner border border-[#222a3d] shrink-0">
            <span className="material-symbols-outlined text-[24px]">alt_route</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline font-bold text-base sm:text-lg text-[#dae2fd] tracking-tight">
                {isAuxiliar ? 'Mi Hoja de Ruta y Cronograma' : 'Rutas y Cronograma'}
              </h1>
              {floatingPoints.length > 0 && !isAuxiliar && (
                <button
                  type="button"
                  onClick={onAutoAssignAll}
                  className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  title="Cargar puntos: priorizar alertas y completar cargue a cada auditor"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>{floatingPoints.length} puntos por cargar (priorizar alertas)</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#bbcabf] mt-0.5 leading-tight">
              {isAuxiliar
                ? 'Itinerario de visitas en campo para La Guajira'
                : totalStepsCount > 0
                ? `${totalStepsCount} paradas cargadas · ${completedStepsCount} completadas · Asignación de puntos críticos y cronograma unificado`
                : 'Planificación operativa unificada: asigna puntos críticos (2-3 meses sin visita) a los auditores.'}
            </p>
          </div>
        </div>

        {/* DAY SELECTOR PILLS */}
        <div className="flex items-center gap-1 bg-[#0b1326] p-1 rounded-xl border border-[#222a3d] self-start lg:self-center max-w-full overflow-x-auto scrollbar-none shrink-0">
          {[
            { key: 'lunes', label: 'Lun' },
            { key: 'martes', label: 'Mar' },
            { key: 'miércoles', label: 'Mié' },
            { key: 'jueves', label: 'Jue' },
            { key: 'viernes', label: 'Vie' },
            { key: 'semana', label: 'Semana' },
            { key: 'mes', label: 'Mes' },
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
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#0088ff] text-[#ffffff] shadow-sm shadow-[#0088ff]/30'
                    : 'text-[#bbcabf] hover:text-[#dae2fd]'
                }`}
              >
                {item.key === 'semana' && (
                  <span className="material-symbols-outlined text-[15px]">view_week</span>
                )}
                {item.key === 'mes' && (
                  <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ADMIN REAL DATA TOOLBAR */}
      {!isAuxiliar && (
        <div className="bg-[#171f33] border border-[#222a3d] rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0088ff]/20 text-[#0088ff] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">database</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#f8fafc]">
                Gestión de Información Real
              </p>
              <p className="text-[11px] text-[#cbd5e1]">
                Ingresa paradas de campo manualmente o carga tu archivo consolidado XLSX / CSV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenAddStep()}
              className="px-3 py-1.5 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
              <span>+ Nueva Parada Real</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#f8fafc] text-xs font-bold border border-[#3b4760] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Cargar matriz con dirección, nombre, canal y geolocalización GPS"
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
        </div>
      )}

      {/* Zone Filters & Status Pill */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
        {/* Zone Filter Segmented Bar */}
        <div className="md:col-span-5 grid grid-cols-4 gap-1 bg-[#131b2e] p-1 rounded-xl border border-[#222a3d]">
          {(['Todas', 'Norte', 'Centro', 'Sur'] as const).map((zone) => (
            <button
              key={zone}
              type="button"
              onClick={() => setSelectedZone(zone)}
              className={`py-1.5 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedZone === zone
                  ? 'bg-[#0088ff] text-white font-bold shadow-md shadow-[#0088ff]/30'
                  : 'text-[#cbd5e1] hover:text-white'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        {/* Global Progress Summary with Audit Control */}
        <div className="md:col-span-7 bg-[#171f33] rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm border border-[#222a3d]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] shrink-0">
              <span className="material-symbols-outlined text-[17px]">fact_check</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[#38bdf8] font-bold">Control de Auditoría y Visitas</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-[#0088ff]/20 text-[#0088ff] dark:text-[#38bdf8] text-[10px] font-mono font-bold">
                  {totalVisitsPerformed} visitas realizadas
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] flex-wrap">
                <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {completedStepsCount} auditados
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-red-400 font-semibold flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  {notAuditedStepsCount} no auditados
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-purple-400 font-semibold flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                  {revisitStepsCount} re-visitas
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-300 font-medium">
                  {pendingStepsCount} pendientes
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <span className="font-mono text-xs text-[#0088ff] bg-[#131b2e] px-2.5 py-1 rounded-lg border border-[#0088ff]/30 font-bold">
              {totalStepsCount > 0 ? `${Math.round((completedStepsCount / totalStepsCount) * 100)}% Auditado` : 'Listo'}
            </span>
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
        />
      ) : (
        /* RESPONSIVE LAYOUT GRID */
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

        {/* RIGHT COLUMN: Interactive Territory Map & Floating Dispatch Pool */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-22">
          {/* Map Territory Preview Snippet with Full Modal Trigger */}
          <div
            onClick={() => setIsGpsModalOpen(true)}
            className="group cursor-pointer relative w-full h-56 lg:h-64 rounded-2xl overflow-hidden shadow-md border border-[#222a3d] hover:border-[#0088ff]/60 transition-all"
            title="Haz clic para ver el mapa GPS completo en grande con todos los puntos"
          >
            <img
              src={MAP_IMAGE}
              alt="Red Departamental La Guajira"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060e20] via-[#060e20]/40 to-transparent" />

            {/* Quick Action Top-Right Button */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#060e20]/90 backdrop-blur-md border border-[#3b4760] text-white shadow-lg group-hover:bg-[#0088ff] group-hover:text-white group-hover:border-[#0088ff] transition-all">
              <span className="material-symbols-outlined text-[16px]">open_in_full</span>
              <span className="text-xs font-bold font-sans">Ver en Grande</span>
            </div>

            {/* Bottom Overlay Banner: Guaranteed White Text */}
            <div
              data-map-overlay="true"
              data-gps-title="true"
              className="map-overlay-banner gps-white-text absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#060e20]/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-[#222a3d] text-white"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3] animate-ping shrink-0" />
                <div className="min-w-0">
                  <span
                    className="text-xs font-bold tracking-wide block truncate gps-title text-white"
                    style={{ color: '#ffffff' }}
                  >
                    GPS · Red Departamental La Guajira
                  </span>
                  <span
                    className="text-[11px] truncate block opacity-90 text-white"
                    style={{ color: '#ffffff' }}
                  >
                    {steps.length} paradas asignadas · Click para ampliar
                  </span>
                </div>
              </div>
              <span
                className="map-overlay-badge font-mono text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-[#1e293b] border border-[#3b4760] shrink-0 ml-2"
                style={{ color: '#ffffff', backgroundColor: '#1e293b' }}
              >
                15 Municipios
              </span>
            </div>
          </div>

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
