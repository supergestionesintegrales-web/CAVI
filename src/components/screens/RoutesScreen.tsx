import React, { useState, useRef } from 'react';
import { Auditor, RouteStep, FloatingPoint, UserRole } from '../../types';
import { MAP_IMAGE } from '../../data/mockData';
import { AddRouteModal } from '../AddRouteModal';
import { AddFloatingPointModal } from '../AddFloatingPointModal';
import { GpsTerritoryModal } from '../GpsTerritoryModal';
import { WeeklyRoutesMatrix } from '../WeeklyRoutesMatrix';
import { parseRoutesFile, downloadRoutesTemplate } from '../../utils/routesExcel';

interface RoutesScreenProps {
  auditors: Auditor[];
  steps: RouteStep[];
  floatingPoints: FloatingPoint[];
  activeRouteSourceFile?: string;
  onGoToMacros?: () => void;
  onAssignFloatingPoint: (id: string, auditorName: string) => void;
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
}) => {
  const isAuxiliar = userRole === 'auxiliar';
  const currentAuditor = auditors.find((a) => a.id === activeAuditorId) || auditors[0];

  const [selectedDay, setSelectedDay] = useState('martes');
  const [selectedZone, setSelectedZone] = useState<'Todas' | 'Norte' | 'Centro' | 'Sur'>('Todas');
  // Lists start collapsed by default as requested
  const [poolCollapsed, setPoolCollapsed] = useState(true);
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
                {isAuxiliar ? 'Hoja de Ruta Operativa' : 'Asignación y Rutas'}
              </h1>
            </div>
            <p className="text-[11px] text-[#bbcabf] mt-0.5 leading-tight">
              {totalStepsCount > 0
                ? `${totalStepsCount} paradas reales cargadas · ${completedStepsCount} completadas`
                : 'Sin paradas cargadas. Agrega paradas reales o importa tu archivo Excel.'}
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
            { key: 'semana', label: 'Semana (Vista Alterna)' },
          ].map((day) => {
            const isSelected = selectedDay === day.key;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => {
                  setSelectedDay(day.key);
                  if (day.key === 'semana') {
                    onShowToast('Vista Alterna: Semana', 'Visualizando matriz operativa semanal completa.', 'info');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#0088ff] text-[#ffffff] shadow-sm shadow-[#0088ff]/30'
                    : 'text-[#bbcabf] hover:text-[#dae2fd]'
                }`}
              >
                {day.key === 'semana' && (
                  <span className="material-symbols-outlined text-[15px] mr-1">view_week</span>
                )}
                <span>{day.label}</span>
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

      {/* VISTA ALTERNA SEMANAL O VISTA DIARIA */}
      {selectedDay === 'semana' ? (
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
                          <h3 className="text-sm font-bold text-white truncate">
                            {aud.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-[#131b2e] text-[#0088ff] text-[10px] font-bold">
                            Zona {aud.zone}
                          </span>
                        </div>
                        <p className="text-xs text-[#cbd5e1] font-mono mt-0.5">
                          ID: {aud.code} · {aud.statusText || 'Listo para ruta'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-bold text-[#0088ff]">
                        {completedCount} / {targetCount}
                      </span>
                      <p className="text-[10px] text-[#cbd5e1] font-semibold">
                        {progressPercent}% Cuota
                      </p>
                    </div>
                  </div>

                  {/* Format Breakdown & Add Stop Button */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs bg-[#131b2e] p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-[#cbd5e1] font-semibold">Formatos:</span>
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
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#131b2e] hover:bg-[#1e293b] transition-all cursor-pointer group text-left"
                      title={isCollapsed ? 'Click para desplegar paradas' : 'Click para plegar paradas'}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[#1e293b] group-hover:bg-[#222a3d] flex items-center justify-center text-[#0088ff] shrink-0 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">
                            {isCollapsed ? 'expand_more' : 'expand_less'}
                          </span>
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white truncate">
                          Secuencia Inteligente de Paradas
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-[#38bdf8] font-mono font-bold">
                          {auditorSteps.length} {auditorSteps.length === 1 ? 'parada' : 'paradas'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#1e293b] text-[#cbd5e1]">
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
                                    ? 'bg-[#1e293b] border-l-4 border-l-[#f59e0b] shadow-sm'
                                    : isCompleted
                                    ? 'bg-[#131b2e] border-l-4 border-l-[#10b981]'
                                    : 'bg-[#131b2e] hover:bg-[#1e293b]'
                                }`}
                              >
                                {/* Step Number or Status Icon */}
                                <button
                                  type="button"
                                  onClick={() => onToggleStepStatus && onToggleStepStatus(step.id)}
                                  title="Cambiar estado de visita"
                                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all cursor-pointer ${
                                    isCompleted
                                      ? 'bg-[#064e3b] text-[#34d399]'
                                      : isCurrent
                                      ? 'bg-[#b45309] text-white animate-pulse'
                                      : 'bg-[#1e293b] text-white hover:bg-[#2d3a58]'
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
                                <span className="font-mono text-xs font-bold text-[#f1f5f9] shrink-0 w-11">
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
                                  <p className="text-xs font-bold text-white truncate leading-tight">
                                    {step.name}
                                  </p>
                                  <p className="text-[11px] text-[#cbd5e1] truncate mt-0.5">
                                    {step.address}
                                  </p>
                                  {step.notes && (
                                    <p className="text-[10px] text-[#a7f3d0] font-medium truncate mt-0.5">
                                      {step.notes}
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
                                        ? 'bg-[#064e3b] text-[#6ee7b7]'
                                        : isCurrent
                                        ? 'bg-[#78350f] text-[#fcd34d]'
                                        : 'bg-[#1e293b] text-[#93c5fd]'
                                    }`}
                                  >
                                    {isCompleted ? 'Completada' : isCurrent ? 'En Curso' : 'Pendiente'}
                                  </button>

                                  {!isAuxiliar && onDeleteRouteStep && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteRouteStep(step.id)}
                                      className="w-6 h-6 rounded-md hover:bg-[#7f1d1d]/40 text-[#cbd5e1] hover:text-[#f87171] flex items-center justify-center transition-colors cursor-pointer"
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
              <div className="grid grid-cols-2 gap-2 bg-[#131b2e] p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-[#cbd5e1] uppercase block font-bold">Paradas Asignadas</span>
                  <span className="text-base font-bold text-white font-mono">
                    {steps.filter((s) => s.auditorId === currentAuditor.id && s.status === 'completed').length} /{' '}
                    {steps.filter((s) => s.auditorId === currentAuditor.id).length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#cbd5e1] uppercase block font-bold">Eficacia</span>
                  <span className="text-base font-bold text-[#0088ff] font-mono">100% SLA</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#131b2e] space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-[#38bdf8] font-bold">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>Modo Operativo de Campo</span>
                </div>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
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
              {/* SMART ROUTE PLANNER ACCORDION & FLOATING POOL */}
              <div className="flex flex-col gap-2.5 bg-[#171f33] p-4 rounded-2xl border border-[#222a3d] shadow-sm">
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => setPoolCollapsed(!poolCollapsed)}
                    className="cursor-pointer select-none flex-1 min-w-0"
                    title={poolCollapsed ? 'Click para desplegar lista' : 'Click para plegar lista'}
                  >
                    <h2 className="font-headline font-bold text-sm text-white flex items-center gap-2">
                      <span>Puntos Flotantes sin Asignar</span>
                      <span className="w-5 h-5 rounded-full bg-[#f59e0b] text-[#451a03] text-[10px] font-bold flex items-center justify-center">
                        {floatingPoints.length}
                      </span>
                    </h2>
                    <p className="text-[11px] text-[#cbd5e1]">
                      Puntos pendientes de despacho en La Guajira
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsAddFpOpen(true)}
                      className="p-1.5 rounded-lg bg-[#1e293b] hover:bg-[#2d3a58] text-[#fcd34d] transition-colors cursor-pointer"
                      title="Agregar punto flotante"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoolCollapsed(!poolCollapsed)}
                      className="px-2 py-1 rounded-lg bg-[#1e293b] hover:bg-[#2d3a58] text-[#cbd5e1] hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title={poolCollapsed ? 'Desplegar lista' : 'Plegar lista'}
                    >
                      <span className="text-[10px]">{poolCollapsed ? 'Desplegar' : 'Plegar'}</span>
                      <span className="material-symbols-outlined text-[18px]">
                        {poolCollapsed ? 'expand_more' : 'expand_less'}
                      </span>
                    </button>
                  </div>
                </div>

                {!poolCollapsed && (
                  <div className="flex flex-col gap-2 transition-all max-h-[360px] overflow-y-auto pr-1">
                    {floatingPoints.length === 0 ? (
                      <div className="bg-[#131b2e] p-4 rounded-xl text-center flex flex-col items-center gap-1.5">
                        <div className="w-9 h-9 rounded-full bg-[#0088ff]/20 text-[#38bdf8] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">task_alt</span>
                        </div>
                        <p className="text-xs font-bold text-white">
                          Bandeja de puntos flotantes limpia
                        </p>
                        <p className="text-[11px] text-[#cbd5e1]">
                          No hay puntos flotantes pendientes. Agrega nuevos con el botón (+) si requieres despachar visitas adicionales.
                        </p>
                      </div>
                    ) : (
                      floatingPoints.map((fp) => (
                        <div
                          key={fp.id}
                          className="bg-[#131b2e] hover:bg-[#1e293b] p-3 rounded-xl shadow-sm flex flex-col gap-2 border-l-4 border-l-[#f59e0b] transition-colors"
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
                              <span className="text-xs font-bold text-white truncate">
                                {fp.name}
                              </span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#78350f] text-[#fde68a] font-bold">
                              {fp.priority}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#cbd5e1] leading-tight">
                            {fp.address} · {fp.sla}
                          </p>

                          {/* Quick Assign Buttons to Real 3 Auditors */}
                          <div className="flex items-center justify-between pt-1 border-t border-[#222a3d]">
                            <span className="text-[10px] text-[#cbd5e1] font-semibold">Asignar a:</span>
                            <div className="flex items-center gap-1">
                              {auditors.map((aud) => (
                                <button
                                  key={aud.id}
                                  type="button"
                                  onClick={() => onAssignFloatingPoint(fp.id, aud.name)}
                                  className="px-2 py-0.5 rounded bg-[#1e293b] hover:bg-[#3b82f6] hover:text-white text-[#93c5fd] text-[10px] font-bold transition-all cursor-pointer"
                                  title={`Asignar a ${aud.name} (${aud.zone})`}
                                >
                                  {aud.name.split(' ')[0]} ({aud.zone[0]})
                                </button>
                              ))}
                              {onDeleteFloatingPoint && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteFloatingPoint(fp.id)}
                                  className="p-1 rounded hover:bg-[#7f1d1d]/40 text-[#cbd5e1] hover:text-[#f87171] transition-colors cursor-pointer"
                                  title="Descartar punto"
                                >
                                  <span className="material-symbols-outlined text-[13px]">delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
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
