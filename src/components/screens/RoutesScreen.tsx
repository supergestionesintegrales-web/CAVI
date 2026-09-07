import React, { useState, useRef } from 'react';
import { Auditor, RouteStep, FloatingPoint, UserRole } from '../../types';
import { MAP_IMAGE } from '../../data/mockData';
import { AddRouteModal } from '../AddRouteModal';
import { AddFloatingPointModal } from '../AddFloatingPointModal';
import { GpsTerritoryModal } from '../GpsTerritoryModal';
import { WeeklyRoutesMatrix } from '../WeeklyRoutesMatrix';
import { MonthlyRoutesView } from '../MonthlyRoutesView';
import { AlertPointsAssignmentPool } from '../AlertPointsAssignmentPool';
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
                  onClick={() => setSelectedDay('alertas')}
                  className="px-2 py-0.5 rounded-full bg-[#dc2626]/20 text-[#fca5a5] hover:bg-[#dc2626]/30 border border-[#dc2626]/40 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  title="Click para ver y asignar puntos con alerta"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping" />
                  <span>{floatingPoints.length} alertas por asignar</span>
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
            ...(!isAuxiliar
              ? [
                  {
                    key: 'alertas',
                    label: '🚨 Asignar Alertas',
                    badge: floatingPoints.length,
                  },
                ]
              : []),
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
                  } else if (item.key === 'alertas') {
                    onShowToast('Bolsa de Alertas', 'Visualizando puntos rezagados (2-3 meses) y alertas para asignación.', 'info');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isSelected
                    ? item.key === 'alertas'
                      ? 'bg-[#dc2626] text-white shadow-sm shadow-[#dc2626]/40'
                      : 'bg-[#0088ff] text-[#ffffff] shadow-sm shadow-[#0088ff]/30'
                    : item.key === 'alertas'
                    ? 'text-[#fca5a5] hover:bg-[#1e293b]'
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
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isSelected
                        ? 'bg-white text-[#991b1b]'
                        : 'bg-[#dc2626] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
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

        {/* Global Progress Summary */}
        <div className="md:col-span-7 bg-[#171f33] rounded-xl p-2.5 flex items-center justify-between shadow-sm border border-[#222a3d]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] shrink-0">
              <span className="material-symbols-outlined text-[16px]">navigation</span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#38bdf8] font-bold">Estado Departamental de Rutas</p>
              <p className="text-xs text-[#cbd5e1] truncate">
                {totalStepsCount > 0
                  ? `${completedStepsCount} de ${totalStepsCount} paradas ejecutadas (${Math.round((completedStepsCount / totalStepsCount) * 100)}%)`
                  : 'Esperando asignación de paradas reales para la jornada'}
              </p>
            </div>
          </div>
          <span className="font-mono text-xs text-[#0088ff] shrink-0 bg-[#131b2e] px-2.5 py-1 rounded-lg border border-[#0088ff]/30 font-bold">
            {totalStepsCount > 0 ? `${Math.round((completedStepsCount / totalStepsCount) * 100)}% Efic.` : 'Listo'}
          </span>
        </div>
      </div>

      {/* VISTA ALERTAS, MENSUAL, SEMANAL O DIARIA */}
      {selectedDay === 'alertas' ? (
        <AlertPointsAssignmentPool
          floatingPoints={floatingPoints}
          auditors={auditors}
          onAssignPoint={onAssignFloatingPoint}
          onAutoAssignAll={onAutoAssignAll}
          onDeletePoint={onDeleteFloatingPoint}
          onOpenAddModal={() => setIsAddFpOpen(true)}
          onReloadSampleAlertPoints={onReloadSampleAlertPoints}
          onShowToast={onShowToast}
        />
      ) : selectedDay === 'mes' ? (
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
            const targetCount = auditorSteps.length;
            const progressPercent = targetCount > 0 ? Math.round((completedCount / targetCount) * 100) : 0;
            const cmCount = auditorSteps.filter((s) => s.format === 'CM').length;
            const pfCount = auditorSteps.filter((s) => s.format === 'PF').length;
            const cdaCount = auditorSteps.filter((s) => s.format === 'CDA').length;
            const isCollapsed = collapsedAuditors[aud.id] ?? true;

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
                      <span className="font-mono text-xs font-bold text-[#0088ff]">
                        {completedCount} / {targetCount}
                      </span>
                      <p className="text-[10px] text-slate-600 dark:text-[#cbd5e1] font-semibold">
                        {progressPercent}% Cuota
                      </p>
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
                          Secuencia Inteligente de Paradas
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
                        <div className="flex flex-col gap-2 animate-in fade-in">
                          {auditorSteps.map((step, idx) => {
                            const isCurrent = step.status === 'in_progress';
                            const isCompleted = step.status === 'completed';

                            return (
                              <div
                                key={step.id}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                                  isCurrent
                                    ? 'bg-amber-50/70 dark:bg-[#1e293b] border-l-4 border-l-[#f59e0b] border border-amber-200 dark:border-transparent shadow-sm'
                                    : isCompleted
                                    ? 'bg-emerald-50/60 dark:bg-[#131b2e] border-l-4 border-l-[#10b981] border border-emerald-200 dark:border-transparent'
                                    : 'bg-white hover:bg-slate-50 dark:bg-[#131b2e] dark:hover:bg-[#1e293b] border border-slate-200 dark:border-transparent shadow-xs'
                                }`}
                              >
                                {/* Step Number or Status Icon */}
                                <button
                                  type="button"
                                  onClick={() => onToggleStepStatus && onToggleStepStatus(step.id)}
                                  title="Cambiar estado de visita"
                                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all cursor-pointer ${
                                    isCompleted
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : isCurrent
                                      ? 'bg-amber-500 text-white shadow-sm animate-pulse'
                                      : 'bg-slate-200 hover:bg-slate-300 dark:bg-[#1e293b] text-slate-800 dark:text-white dark:hover:bg-[#2d3a58]'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                  ) : isCurrent ? (
                                    <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                                  ) : (
                                    <span>{idx + 1}</span>
                                  )}
                                </button>

                                {/* Time */}
                                <span className="font-mono text-xs font-bold text-slate-800 dark:text-[#f1f5f9] shrink-0 w-11">
                                  {step.time}
                                </span>

                                {/* Format Badge */}
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                                    step.format === 'CM'
                                      ? 'bg-[#0284c7] text-white'
                                      : step.format === 'PF'
                                      ? 'bg-[#7c3aed] text-white'
                                      : 'bg-[#0088ff] text-white'
                                  }`}
                                >
                                  {step.code}
                                </span>

                                {/* Details: Crystal-clear High Contrast */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                                      {step.name}
                                    </p>
                                    {step.daysWithoutVisit && step.daysWithoutVisit >= 60 && (
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold inline-flex items-center gap-0.5 ${
                                        step.daysWithoutVisit >= 90
                                          ? 'bg-red-100 text-red-800 dark:bg-[#dc2626]/30 dark:text-[#fca5a5] border border-red-200 dark:border-[#dc2626]/50'
                                          : 'bg-amber-100 text-amber-900 dark:bg-[#d97706]/30 dark:text-[#fde68a] border border-amber-200 dark:border-[#d97706]/50'
                                      }`}>
                                        <span className="material-symbols-outlined text-[10px]">schedule</span>
                                        <span>{step.daysWithoutVisit}d sin visita</span>
                                      </span>
                                    )}
                                    {step.alertCategory && step.alertCategory !== 'ninguna' && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-800 dark:bg-[#dc2626]/30 dark:text-[#fca5a5] border border-red-200 dark:border-[#dc2626]/50 inline-flex items-center gap-0.5">
                                        <span className="material-symbols-outlined text-[10px]">warning</span>
                                        <span>Alerta</span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-[#cbd5e1] truncate mt-0.5">
                                    {step.address}
                                  </p>
                                  {(step.notes || step.alertDescription) && (
                                    <p className="text-[10px] text-amber-800 dark:text-[#fcd34d] font-semibold truncate mt-0.5">
                                      {step.alertDescription || step.notes}
                                    </p>
                                  )}
                                </div>

                                {/* Status Pill & Action */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => onToggleStepStatus && onToggleStepStatus(step.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                      isCompleted
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-[#064e3b] dark:text-[#6ee7b7]'
                                        : isCurrent
                                        ? 'bg-amber-100 text-amber-800 dark:bg-[#78350f] dark:text-[#fcd34d]'
                                        : 'bg-slate-100 text-slate-700 dark:bg-[#1e293b] dark:text-[#93c5fd] border border-slate-200 dark:border-transparent'
                                    }`}
                                  >
                                    {isCompleted ? 'Completada' : isCurrent ? 'En Curso' : 'Pendiente'}
                                  </button>

                                  {!isAuxiliar && onDeleteRouteStep && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteRouteStep(step.id)}
                                      className="w-6 h-6 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600 dark:hover:bg-[#7f1d1d]/40 dark:text-[#cbd5e1] dark:hover:text-[#f87171] flex items-center justify-center transition-colors cursor-pointer"
                                      title="Eliminar parada"
                                    >
                                      <span className="material-symbols-outlined text-[15px]">delete</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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
              {/* SMART ROUTE PLANNER & CRITICAL ALERT POINTS PANEL */}
              <div className="flex flex-col gap-2.5 bg-white dark:bg-[#171f33] p-4 rounded-2xl border border-slate-200 dark:border-[#222a3d] shadow-sm">
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => setPoolCollapsed(!poolCollapsed)}
                    className="cursor-pointer select-none flex-1 min-w-0"
                    title={poolCollapsed ? 'Click para desplegar lista' : 'Click para plegar lista'}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />
                      <h2 className="font-headline font-bold text-sm text-slate-900 dark:text-white truncate">
                        Puntos con Alertas / Rezagados
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-[#dc2626]/30 text-red-800 dark:text-[#fca5a5] border border-red-200 dark:border-[#dc2626]/50 text-[11px] font-mono font-bold">
                        {floatingPoints.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-[#cbd5e1] mt-0.5">
                      PDVs con 2-3 meses sin visita o alertas operativas
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsAddFpOpen(true)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-[#2d3a58] text-amber-700 dark:text-[#fcd34d] border border-slate-200 dark:border-transparent transition-colors cursor-pointer"
                      title="Registrar punto con alerta manualmente"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_alert</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoolCollapsed(!poolCollapsed)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-[#2d3a58] text-slate-800 dark:text-[#cbd5e1] border border-slate-200 dark:border-transparent transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title={poolCollapsed ? 'Desplegar lista' : 'Plegar lista'}
                    >
                      <span className="text-[10px]">{poolCollapsed ? 'Desplegar' : 'Plegar'}</span>
                      <span className="material-symbols-outlined text-[18px]">
                        {poolCollapsed ? 'expand_more' : 'expand_less'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Quick Link to full assignment board */}
                <button
                  type="button"
                  onClick={() => setSelectedDay('alertas')}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-[#dc2626]/15 dark:hover:bg-[#dc2626]/25 border border-red-200 dark:border-[#dc2626]/30 text-red-800 dark:text-[#fca5a5] text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">crisis_alert</span>
                    <span>Abrir Centro Completo de Asignación</span>
                  </span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>

                {!poolCollapsed && (
                  <div className="flex flex-col gap-2 transition-all max-h-[380px] overflow-y-auto pr-1">
                    {floatingPoints.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-transparent p-4 rounded-xl text-center flex flex-col items-center gap-1.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 dark:bg-[#10b981]/20 dark:text-[#34d399] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">verified</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Todos los puntos críticos están asignados
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-[#cbd5e1]">
                          No quedan PDVs rezagados en la bolsa. Puedes agregar nuevos o recargar ejemplos.
                        </p>
                        {onReloadSampleAlertPoints && (
                          <button
                            type="button"
                            onClick={onReloadSampleAlertPoints}
                            className="mt-1 text-xs text-[#0088ff] hover:underline font-bold"
                          >
                            Recargar puntos críticos de ejemplo
                          </button>
                        )}
                      </div>
                    ) : (
                      floatingPoints.map((fp) => {
                        const isHighMora = (fp.daysWithoutVisit || 0) >= 60;
                        const isSevereMora = (fp.daysWithoutVisit || 0) >= 90;

                        return (
                          <div
                            key={fp.id}
                            className="bg-white hover:bg-slate-50 dark:bg-[#131b2e] dark:hover:bg-[#1e293b] p-3 rounded-xl shadow-xs flex flex-col gap-2 border border-slate-200 border-l-4 border-l-[#ef4444] dark:border-transparent dark:border-l-4 dark:border-l-[#ef4444] transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    fp.format === 'CM'
                                      ? 'bg-[#0284c7] text-white'
                                      : fp.format === 'PF'
                                      ? 'bg-[#7c3aed] text-white'
                                      : 'bg-[#0088ff] text-white'
                                  }`}
                                >
                                  {fp.code}
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {fp.name}
                                </span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-bold shadow-xs">
                                {fp.priority}
                              </span>
                            </div>

                            {/* Mora de visitas / Alerta */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isHighMora && (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${
                                    isSevereMora
                                      ? 'bg-red-100 text-red-800 dark:bg-[#dc2626]/30 dark:text-[#fca5a5] border border-red-200 dark:border-[#dc2626]/50'
                                      : 'bg-amber-100 text-amber-900 dark:bg-[#d97706]/30 dark:text-[#fde68a] border border-amber-200 dark:border-[#d97706]/50'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[11px]">schedule</span>
                                  <span>
                                    {fp.daysWithoutVisit}d sin visita ({isSevereMora ? '>3 meses' : '2-3 meses'})
                                  </span>
                                </span>
                              )}
                              {fp.zone && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-[#1e293b] text-slate-800 dark:text-[#93c5fd] font-bold border border-slate-200 dark:border-transparent">
                                  Zona {fp.zone}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-[#cbd5e1] leading-tight">
                              {fp.address} {fp.municipality ? `· ${fp.municipality}` : ''}
                            </p>

                            {fp.alertDescription && (
                              <div className="text-[11px] text-red-900 dark:text-[#fcd34d] font-semibold leading-snug bg-red-50 dark:bg-transparent p-1.5 rounded-lg border border-red-200 dark:border-transparent flex items-start gap-1">
                                <span>⚠️</span>
                                <span>{fp.alertDescription}</span>
                              </div>
                            )}

                            {/* Quick Assign to Auditors for current day */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#222a3d]">
                              <span className="text-[10px] text-slate-800 dark:text-[#cbd5e1] font-bold uppercase">
                                Asignar a:
                              </span>
                              <div className="flex items-center gap-1">
                                {auditors.map((aud) => (
                                  <button
                                    key={aud.id}
                                    type="button"
                                    onClick={() => onAssignFloatingPoint(fp.id, aud.name, selectedDay)}
                                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-[#0088ff] hover:text-white dark:bg-[#1e293b] text-slate-800 dark:text-[#93c5fd] text-[10px] font-bold transition-all border border-slate-200 dark:border-transparent cursor-pointer"
                                    title={`Asignar a ${aud.name} (${aud.zone}) para el día ${selectedDay}`}
                                  >
                                    {aud.name.split(' ')[0]} ({aud.zone[0]})
                                  </button>
                                ))}
                                {onDeleteFloatingPoint && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteFloatingPoint(fp.id)}
                                    className="p-1 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 dark:hover:bg-[#7f1d1d]/40 dark:text-[#cbd5e1] dark:hover:text-[#f87171] transition-colors cursor-pointer"
                                    title="Descartar punto"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">delete</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* TACTICAL ACTIONS BAR */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={onAutoAssignAll}
                    className="py-3 px-3 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    <span className="truncate">Auto-asignar CAVI</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="py-3 px-3 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isPublishing ? 'sync' : 'send_to_mobile'}
                    </span>
                    <span className="truncate">
                      {isPublishing ? 'Publicando...' : 'Publicar Rutas'}
                    </span>
                  </button>
                </div>
                <p className="text-center text-[10px] text-[#cbd5e1] pt-0.5">
                  <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">lock</span>
                  Despacho encriptado · Algoritmo CAVI v4.2.1
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
