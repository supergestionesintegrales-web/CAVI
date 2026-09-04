import React, { useState } from 'react';
import { Auditor, RouteStep, FloatingPoint } from '../../types';
import { MAP_IMAGE } from '../../data/mockData';

interface RoutesScreenProps {
  auditors: Auditor[];
  steps: RouteStep[];
  floatingPoints: FloatingPoint[];
  activeRouteSourceFile?: string;
  onGoToMacros?: () => void;
  onAssignFloatingPoint: (id: string, auditorName: string) => void;
  onAutoAssignAll: () => void;
  onShowToast: (title: string, message: string) => void;
}

export const RoutesScreen: React.FC<RoutesScreenProps> = ({
  auditors,
  steps,
  floatingPoints,
  activeRouteSourceFile = 'Rutas_Semana42_LaGuajira_Departamental.xlsx',
  onGoToMacros,
  onAssignFloatingPoint,
  onAutoAssignAll,
  onShowToast,
}) => {
  const [selectedDay, setSelectedDay] = useState('martes');
  const [selectedZone, setSelectedZone] = useState<'Todas' | 'Norte' | 'Centro' | 'Sur'>('Todas');
  const [poolCollapsed, setPoolCollapsed] = useState(false);
  const [isReorderingKleyder, setIsReorderingKleyder] = useState(false);
  const [kleyderReordered, setKleyderReordered] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleReorderKleyder = () => {
    setIsReorderingKleyder(true);
    setTimeout(() => {
      setIsReorderingKleyder(false);
      setKleyderReordered(true);
      onShowToast(
        'Ruta Re-optimizada con CAVI',
        'Se permutó CM-40 por PF-19 ahorrando 28 min de tramo en Troncal del Caribe (Riohacha - Maicao)'
      );
    }, 800);
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      onShowToast(
        'Rutas Publicadas Exitosamente',
        'Hoja de ruta y geolocalizaciones enviadas a los 3 auditores de campo'
      );
    }, 900);
  };

  const filteredAuditors = auditors.filter((aud) => {
    if (selectedZone === 'Todas') return true;
    return aud.zone === selectedZone;
  });

  return (
    <div className="flex flex-col w-full space-y-4 md:space-y-5">
      {/* Header Section: Title & AI Overview Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#171f33] flex items-center justify-center text-[#4edea3] shadow-sm">
            <span className="material-symbols-outlined text-[22px]">alt_route</span>
          </div>
          <div>
            <h1 className="font-headline font-bold text-base md:text-lg text-[#dae2fd] tracking-tight">
              Asignación y Rutas
            </h1>
            <p className="text-[11px] text-[#bbcabf]">
              Logística táctica y despacho asistido por IA
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            onShowToast(
              'Sincronización en vivo',
              'Coordenadas de 27 puntos y telemetría de auditores actualizadas'
            )
          }
          className="px-3 py-1.5 rounded-xl bg-[#171f33] hover:bg-[#222a3d] text-[#4edea3] text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all border border-[#4edea3]/20"
        >
          <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
          <span>En vivo</span>
        </button>
      </div>

      {/* MACRO DATA SOURCE BANNER */}
      <div className="p-3 rounded-xl bg-[#131b2e] border border-[#222a3d] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#003824] border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] shrink-0">
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-[#4edea3]">Alimentado desde Macro:</span>
              <span className="text-xs font-bold text-[#dae2fd] truncate font-mono">
                {activeRouteSourceFile}
              </span>
            </div>
            <p className="text-[11px] text-[#bbcabf] truncate">
              Lectura jerárquica: 📁 Rutas &gt; 2024 &gt; 10-Octubre • Datos sincronizados con algoritmo CAVI
            </p>
          </div>
        </div>

        {onGoToMacros && (
          <button
            onClick={onGoToMacros}
            className="px-3 py-1.5 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#c0c1ff] text-xs font-semibold flex items-center gap-1.5 border border-[#3131c0]/30 shrink-0 transition-all self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[15px]">folder_open</span>
            <span>Explorar Macros</span>
          </button>
        )}
      </div>

      {/* Week Selector & Day Tabs Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
        {/* Week Selector Dropdown Pill */}
        <div className="md:col-span-5 flex items-center justify-between bg-[#131b2e] rounded-xl px-3.5 py-2.5 shadow-sm border border-[#222a3d]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-[#c0c1ff] text-[20px]">
              calendar_month
            </span>
            <div className="min-w-0">
              <span className="text-xs text-[#dae2fd] block truncate font-bold">
                Semana 42 (16 - 21 Octubre)
              </span>
              <span className="text-[10px] text-[#bbcabf]">Auditorías Operativas Q4</span>
            </div>
          </div>
          <button
            aria-label="Cambiar semana"
            className="w-7 h-7 rounded-lg bg-[#171f33] flex items-center justify-center text-[#bbcabf]"
          >
            <span className="material-symbols-outlined text-[16px]">unfold_more</span>
          </button>
        </div>

        {/* Day Quick Tabs */}
        <div className="md:col-span-7 flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {[
            { id: 'martes', label: 'Hoy (Martes 17)', active: true },
            { id: 'miercoles', label: 'Miércoles 18', active: false },
            { id: 'jueves', label: 'Jueves 19', active: false },
            { id: 'viernes', label: 'Viernes 20', active: false },
          ].map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`px-3 py-2 rounded-xl text-xs shrink-0 flex items-center gap-1.5 transition-all ${
                selectedDay === day.id
                  ? 'bg-[#4edea3] text-[#003824] font-bold shadow-sm'
                  : 'bg-[#131b2e] text-[#bbcabf] hover:text-[#dae2fd]'
              }`}
            >
              {selectedDay === day.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#003824] animate-ping" />
              )}
              <span>{day.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Zone Filters & Smart Dispatch Alert Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
        {/* Zone Filter Segmented Bar */}
        <div className="md:col-span-5 grid grid-cols-4 gap-1 bg-[#060e20] p-1 rounded-xl">
          {(['Todas', 'Norte', 'Centro', 'Sur'] as const).map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
                selectedZone === zone
                  ? 'bg-[#171f33] text-[#4edea3] font-bold shadow'
                  : 'text-[#bbcabf] hover:text-[#dae2fd]'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        {/* Smart Dispatch Alert Pill */}
        <div className="md:col-span-7 bg-gradient-to-r from-[#222a3d] via-[#171f33] to-[#222a3d] rounded-xl p-2.5 flex items-center justify-between shadow-sm border border-[#3131c0]/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#c0c1ff]/15 flex items-center justify-center text-[#c0c1ff] shrink-0">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#c0c1ff] font-bold">CAVI Co-Pilot Activo</p>
              <p className="text-xs text-[#bbcabf] truncate">
                Tráfico en Autopista Norte. Ruta re-optimizada.
              </p>
            </div>
          </div>
          <span className="font-code-metric text-[11px] text-[#4edea3] shrink-0 bg-[#060e20] px-2 py-0.5 rounded border border-[#4edea3]/20">
            98.2% Efic.
          </span>
        </div>
      </div>

      {/* RESPONSIVE DESKTOP/TABLET GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Main Allocation Matrix & Auditor Route Timeline */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          {/* Main Allocation Matrix Header */}
          <div className="flex items-center justify-between pt-1">
            <h2 className="font-headline font-bold text-sm text-[#dae2fd] flex items-center gap-2">
              <span>Auditores de Campo</span>
              <span className="px-2 py-0.5 rounded-full bg-[#2d3449] text-[10px] text-[#dae2fd]">
                3 Activos
              </span>
            </h2>
            <span className="text-[11px] text-[#bbcabf]">27 visitas programadas</span>
          </div>

      {/* CARD 1: Samuel Ramos Quintero (Zona Norte) - Expanded View */}
      {(selectedZone === 'Todas' || selectedZone === 'Norte') && (
        <div className="bg-[#171f33] rounded-xl overflow-hidden shadow-md flex flex-col border border-[#222a3d]">
          <div className="h-1 w-full bg-gradient-to-r from-[#4edea3] via-[#10b981] to-[#2d3449]" />
          <div className="p-4 flex flex-col gap-3">
            {/* Auditor Info */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    className="w-11 h-11 rounded-full object-cover shadow-sm ring-1 ring-[#4edea3]"
                    alt="Samuel Ramos Quintero"
                    src={auditors[0].avatar}
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#4edea3] ring-2 ring-[#171f33]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-[#dae2fd] truncate">
                      {auditors[0].name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded bg-[#060e20] text-[#4edea3] text-[10px] font-semibold">
                      En Ruta
                    </span>
                  </div>
                  <p className="text-[11px] text-[#bbcabf]">
                    Auditor Zona Norte · ID: {auditors[0].code}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-code-metric text-xs text-[#4edea3]">6 / 9</span>
                <p className="text-[10px] text-[#bbcabf]">66% Cuota</p>
              </div>
            </div>

            {/* Target Breakdown Badges */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] text-[#bbcabf]">Target:</span>
              <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[#c0c1ff] font-semibold text-[10px]">
                3 CDA
              </span>
              <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[#4edea3] font-semibold text-[10px]">
                3 PF
              </span>
              <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[#ffb95f] font-semibold text-[10px]">
                3 CM
              </span>
              <span className="ml-auto text-[11px] text-[#bbcabf] flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">near_me</span>
                14.8 km tot.
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-[#060e20] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#4edea3] h-2 rounded-full transition-all duration-500"
                style={{ width: '66%' }}
              />
            </div>

            {/* Route Sequence Timeline */}
            <div className="mt-1 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[#bbcabf] pb-0.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Secuencia Inteligente
                </span>
                <span className="text-[10px] text-[#c0c1ff]">Secuencia CAVI-v4</span>
              </div>

              {/* Steps */}
              {steps.slice(0, 4).map((step) => {
                const isCurrent = step.status === 'in_progress';
                const isCompleted = step.status === 'completed';
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors ${
                      isCurrent
                        ? 'bg-[#222a3d] border border-[#ffb95f]/40 shadow-sm'
                        : isCompleted
                        ? 'bg-[#131b2e]'
                        : 'bg-[#131b2e]/70 opacity-90'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                        isCompleted
                          ? 'bg-[#4edea3]/20 text-[#4edea3]'
                          : isCurrent
                          ? 'bg-[#e29100] text-[#523200] animate-pulse'
                          : 'bg-[#2d3449] text-[#bbcabf]'
                      }`}
                    >
                      {isCompleted ? (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      ) : isCurrent ? (
                        <span className="material-symbols-outlined text-[14px]">
                          hourglass_top
                        </span>
                      ) : (
                        <span>4</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-code-metric text-[11px] ${
                            isCurrent ? 'text-[#ffb95f] font-bold' : 'text-[#bbcabf]'
                          }`}
                        >
                          {step.time}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            step.format === 'CM'
                              ? 'bg-[#083344] text-[#22D3EE]'
                              : step.format === 'PF'
                              ? 'bg-[#082F49] text-[#38BDF8]'
                              : 'bg-[#3B0764] text-[#C084FC]'
                          }`}
                        >
                          {step.code}
                        </span>
                        <span
                          className={`text-xs truncate ${
                            isCurrent ? 'font-bold text-white' : 'text-[#dae2fd]'
                          }`}
                        >
                          {step.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#bbcabf] truncate">
                        {step.address} · {step.notes || step.sla}
                      </p>
                    </div>

                    {isCompleted && (
                      <span className="material-symbols-outlined text-[#4edea3] text-[16px] shrink-0">
                        verified
                      </span>
                    )}
                    {isCurrent && (
                      <button
                        onClick={() =>
                          onShowToast(
                            'Telemetría activa con Samuel',
                            'Canal de voz directo y transmisión GPS cada 5 seg.'
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-[#171f33] text-[#dae2fd] text-[10px] font-semibold shrink-0 border border-[#2d3449]"
                      >
                        Rastrear
                      </button>
                    )}
                    {!isCompleted && !isCurrent && (
                      <span className="text-[10px] text-[#bbcabf]">Pend.</span>
                    )}
                  </div>
                );
              })}

              {/* Collapsed summary pill */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#060e20] rounded-lg text-[#bbcabf] text-[11px]">
                <span className="flex items-center gap-1 truncate">
                  <span className="material-symbols-outlined text-[14px]">more_horiz</span>
                  2 más: [14:45] CDA-09 Almacén Toberín · [16:00] PF-45 Santa Fe
                </span>
                <span className="font-code-metric text-[#c0c1ff] font-semibold shrink-0 ml-1">
                  +2.1h est.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CARD 2: Kleyder Rodriguez (Zona Centro) */}
      {(selectedZone === 'Todas' || selectedZone === 'Centro') && (
        <div className="bg-[#171f33] rounded-xl overflow-hidden shadow-md flex flex-col border border-[#222a3d]">
          <div className="h-1 w-full bg-[#3131c0]" />
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    className="w-11 h-11 rounded-full object-cover shadow-sm ring-1 ring-[#c0c1ff]"
                    alt="Kleyder Rodriguez"
                    src={auditors[1].avatar}
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#c0c1ff] ring-2 ring-[#171f33]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-[#dae2fd] truncate">
                      {auditors[1].name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded bg-[#060e20] text-[#c0c1ff] text-[10px] font-semibold">
                      Zona Centro
                    </span>
                  </div>
                  <p className="text-[11px] text-[#bbcabf]">
                    Auditor Senior · ID: {auditors[1].code}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-code-metric text-xs text-[#c0c1ff]">4 / 10</span>
                <p className="text-[10px] text-[#bbcabf]">40% Cuota</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] text-[#bbcabf]">Target:</span>
              <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[#c0c1ff] font-semibold text-[10px]">
                3 CDA
              </span>
              <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[#4edea3] font-semibold text-[10px]">
                3 PF
              </span>
              <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[#ffb95f] font-semibold text-[10px]">
                4 CM
              </span>
              <span className="ml-auto text-[11px] text-[#ffb4ab] flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">traffic</span>
                Congestión Calle 26
              </span>
            </div>

            {/* Interactive AI Reorder Card */}
            <div className="bg-[#131b2e] p-3 rounded-xl flex items-center justify-between gap-2 border border-[#222a3d]">
              <div className="min-w-0">
                <p className="text-xs text-[#dae2fd] font-bold">
                  {kleyderReordered ? 'Tramo optimizado y sin demoras' : 'Conflicto de tramo detectado'}
                </p>
                <p className="text-[11px] text-[#bbcabf] truncate">
                  {kleyderReordered
                    ? 'Se evitó el embotellamiento de Calle 26 vía Cra 13'
                    : 'CAVI sugiere permutar CM-40 por PF-19 para evitar obras'}
                </p>
              </div>
              <button
                onClick={handleReorderKleyder}
                disabled={isReorderingKleyder || kleyderReordered}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 active:scale-95 transition-all shadow-sm ${
                  kleyderReordered
                    ? 'bg-[#10b981]/20 text-[#4edea3] border border-[#4edea3]/40'
                    : 'bg-[#3131c0] text-[#dae2fd] hover:bg-[#3131c0]/80'
                }`}
              >
                {isReorderingKleyder ? (
                  <>
                    <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                    <span>Reordenando...</span>
                  </>
                ) : kleyderReordered ? (
                  <>
                    <span className="material-symbols-outlined text-[15px]">done_all</span>
                    <span>Optimizado</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[15px]">swap_calls</span>
                    <span>Optimizar CAVI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARD 3: Jose Aponte (Zona Sur) - Completed State */}
      {(selectedZone === 'Todas' || selectedZone === 'Sur') && (
        <div className="bg-[#171f33] rounded-xl overflow-hidden shadow-md flex flex-col border border-[#222a3d]">
          <div className="h-1 w-full bg-[#10b981]" />
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    className="w-11 h-11 rounded-full object-cover shadow-sm ring-1 ring-[#4edea3]"
                    alt="Jose Aponte"
                    src={auditors[2].avatar}
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#4edea3] ring-2 ring-[#171f33]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-[#dae2fd] truncate">
                      {auditors[2].name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] text-[10px] font-bold">
                      100% Completado
                    </span>
                  </div>
                  <p className="text-[11px] text-[#bbcabf]">
                    Auditor Zona Sur · ID: {auditors[2].code}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-code-metric text-xs text-[#4edea3]">8 / 8</span>
                <p className="text-[10px] text-[#4edea3]">Objetivo logrado</p>
              </div>
            </div>

            <div className="bg-[#131b2e] p-3 rounded-xl flex items-center justify-between border border-[#222a3d]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4edea3] text-[20px]">
                  verified_user
                </span>
                <div>
                  <p className="text-xs text-[#dae2fd] font-semibold">
                    Ruta finalizada sin incidentes
                  </p>
                  <p className="text-[11px] text-[#bbcabf]">
                    3 CDA · 3 PF · 2 CM auditados en 5h 40m
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#4edea3] text-[22px]">
                workspace_premium
              </span>
            </div>
          </div>
        </div>
      )}
        </div>

        {/* RIGHT COLUMN: Interactive Territory Map & Floating Dispatch Pool */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-22">
          {/* Map Territory Preview Snippet */}
          <div className="relative w-full h-52 lg:h-64 rounded-xl overflow-hidden shadow-md border border-[#222a3d]">
            <img
              src={MAP_IMAGE}
              alt="Red Departamental La Guajira"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060e20] via-[#060e20]/40 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#131b2e]/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-[#222a3d]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping" />
                <span className="text-xs font-bold text-[#dae2fd]">Red Departamental La Guajira</span>
              </div>
              <span className="font-code-metric text-xs text-[#c0c1ff]">15 Municipios Conectados</span>
            </div>
          </div>

          {/* SMART ROUTE PLANNER ACCORDION & FLOATING POOL */}
          <div className="flex flex-col gap-2.5 bg-[#171f33] p-4 rounded-xl border border-[#222a3d] shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline font-bold text-sm text-[#dae2fd] flex items-center gap-2">
                  <span>Puntos Flotantes sin Asignar</span>
                  <span className="w-5 h-5 rounded-full bg-[#e29100] text-[#523200] text-[10px] font-bold flex items-center justify-center">
                    {floatingPoints.length}
                  </span>
                </h2>
                <p className="text-[11px] text-[#bbcabf]">
                  Sector Maicao &amp; San Juan del Cesar · Pendientes de despacho departamental
                </p>
              </div>
              <button
                onClick={() => setPoolCollapsed(!poolCollapsed)}
                className="w-8 h-8 rounded-lg bg-[#222a3d] flex items-center justify-center text-[#bbcabf] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {poolCollapsed ? 'expand_more' : 'expand_less'}
                </span>
              </button>
            </div>

            {!poolCollapsed && (
              <div className="flex flex-col gap-2 transition-all max-h-[380px] overflow-y-auto pr-1">
                {floatingPoints.length === 0 ? (
                  <div className="bg-[#131b2e] p-4 rounded-xl text-center flex flex-col items-center gap-1.5 border border-[#222a3d]">
                    <div className="w-9 h-9 rounded-full bg-[#4edea3]/20 text-[#4edea3] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">task_alt</span>
                    </div>
                    <p className="text-xs font-bold text-[#dae2fd]">
                      ¡Todos los puntos fueron distribuidos!
                    </p>
                    <p className="text-[11px] text-[#bbcabf]">
                      Rutas de hoy equilibradas según proximidad y SLA.
                    </p>
                  </div>
                ) : (
                  floatingPoints.map((fp) => (
                    <div
                      key={fp.id}
                      className="bg-[#131b2e] p-3 rounded-xl shadow-sm flex items-center justify-between gap-2 border border-[#222a3d] border-l-4 border-l-[#ffb95f]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg bg-[#222a3d] flex items-center justify-center text-[#bbcabf] shrink-0"
                          title="Arrastrar para asignar"
                        >
                          <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                fp.format === 'CM'
                                  ? 'bg-[#083344] text-[#22D3EE]'
                                  : fp.format === 'PF'
                                  ? 'bg-[#082F49] text-[#38BDF8]'
                                  : 'bg-[#3B0764] text-[#C084FC]'
                              }`}
                            >
                              {fp.code}
                            </span>
                            <span className="text-xs font-bold text-[#dae2fd] truncate">
                              {fp.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#bbcabf] truncate">
                            {fp.address} · {fp.sla}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onAssignFloatingPoint(fp.id, 'Kleyder Rodriguez')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#222a3d] hover:bg-[#3131c0] hover:text-white text-[#c0c1ff] text-[11px] font-semibold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">person_add</span>
                        <span>Asignar</span>
                      </button>
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
                onClick={onAutoAssignAll}
                className="py-3 px-3 rounded-xl bg-[#3131c0] hover:bg-[#3131c0]/80 text-[#dae2fd] text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                <span className="truncate">Auto-asignar CAVI</span>
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="py-3 px-3 rounded-xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isPublishing ? 'sync' : 'send_to_mobile'}
                </span>
                <span className="truncate">
                  {isPublishing ? 'Publicando...' : 'Publicar Rutas'}
                </span>
              </button>
            </div>
            <p className="text-center text-[10px] text-[#bbcabf] pt-0.5">
              <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">lock</span>
              Despacho encriptado · Algoritmo CAVI v4.2.1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
