import React, { useState } from 'react';
import { Auditor } from '../../types';

interface DashboardScreenProps {
  auditors: Auditor[];
  macroFilesCount?: number;
  onGoToMacros?: () => void;
  onOpenScanner: () => void;
  onOpenCriticalPoints: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'alert') => void;
  initialViewMode?: 'consolidado' | 'operativo' | 'kpis';
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  auditors,
  macroFilesCount = 8,
  onGoToMacros,
  onOpenScanner,
  onOpenCriticalPoints,
  onShowToast,
  initialViewMode = 'consolidado',
}) => {
  const [viewMode, setViewMode] = useState<'consolidado' | 'operativo' | 'kpis'>(initialViewMode);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'progress' | 'completed' | 'alert'>('all');
  const [isApplyingCavi, setIsApplyingCavi] = useState(false);
  const [caviApplied, setCaviApplied] = useState(false);

  // KPI & Report Exporter State
  const [selectedPeriod, setSelectedPeriod] = useState('Semana Actual');
  const [selectedAuditors, setSelectedAuditors] = useState('Todos (3)');
  const [isExporting, setIsExporting] = useState(false);

  const filteredAuditors = auditors.filter((aud) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'progress') return aud.status === 'progress';
    if (activeFilter === 'completed') return aud.status === 'completed';
    if (activeFilter === 'alert') return aud.hasAlert;
    return true;
  });

  const handleApplyCavi = () => {
    setIsApplyingCavi(true);
    setTimeout(() => {
      setIsApplyingCavi(false);
      setCaviApplied(true);
      onShowToast(
        'CAVI Aplicado con Éxito',
        'Se recalcularon 27 rutas departamentales ahorrando 1h 45m de traslado en Troncal del Caribe (Zona Norte)',
        'success'
      );
    }, 900);
  };

  const handleDownloadExcel = (filename = 'GUADIT_Consolidado_Sem42.xlsx') => {
    setIsExporting(true);

    setTimeout(() => {
      setIsExporting(false);
      onShowToast('Generando XLSX', `${filename} listo para guardar`, 'success');

      const csvContent =
        'sep=,\n' +
        'ID,PUNTO_CONTROL,FORMATO,ZONA,DIRECCION,AUDITOR,ESTADO,CUMPLIMIENTO_SLA,TIEMPO_TRASLADO_MIN,HALLAZGOS\n' +
        'CM-108,Riohacha Centro Comercial,CM,Norte (Riohacha),Calle 15 #7-40 Riohacha,Samuel Ramos Quintero,Completado,100%,18,Sin novedades\n' +
        'PF-042,Maicao Frontera Plaza,PF,Frontera (Maicao),Calle 16 #10-22 Maicao,Kleyder Rodriguez,En curso,92%,24,Re-visita inventario\n' +
        'CDA-04,Centro Acopio Riohacha Portuario,CDA,Norte (Riohacha),Vía Santa Marta Km 2 Riohacha,Samuel Ramos Quintero,Completado,98%,15,Conforme\n' +
        'PF-12,San Juan del Cesar Principal,PF,Sur (San Juan),Cra 5 #8-35 San Juan del Cesar,Jose Aponte,Completado,100%,20,Conforme\n' +
        'CM-88,Fonseca Plaza Express,CM,Sur (Fonseca),Calle 12 #18-04 Fonseca,Jose Aponte,En curso,95%,12,Check-in GPS verificado\n' +
        'CM-92,Uribia Capital Indígena,CM,Alta Guajira (Uribia),Plaza Colombia Uribia,Samuel Ramos Quintero,Programado,100%,28,Pendiente\n' +
        'CDA-33,CDA Minero Barrancas - Cerrejón,CDA,Sur (Barrancas),Km 5 Vía Cerrejón Barrancas,Jose Aponte,Completado,100%,35,Capacidad +500 items ok\n' +
        'CM-102,Manaure Salinas Market,CM,Norte (Manaure),Calle Central Salinas Manaure,Samuel Ramos Quintero,Completado,100%,19,Alerta superada';

      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full space-y-4 md:space-y-5">
      {/* HEADER SECTION: UNIFIED TITLE & SUB-VIEW SWITCHER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#131b2e] p-3.5 sm:p-4 md:p-5 rounded-2xl border border-[#222a3d] shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[#171f33] flex items-center justify-center text-[#4edea3] shadow-inner border border-[#222a3d] shrink-0">
            <span className="material-symbols-outlined text-[24px]">auto_awesome_mosaic</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline font-bold text-base sm:text-lg text-[#dae2fd] tracking-tight">
                Dashboard &amp; KPIs
              </h1>
            </div>
            <p className="text-[11px] text-[#bbcabf] mt-0.5 leading-tight">
              Control Operativo en Terreno &amp; Analítica Departamental • La Guajira (Semana 42)
            </p>
          </div>
        </div>

        {/* VIEW MODE TOGGLE PILLS */}
        <div className="flex items-center gap-1 bg-[#0b1326] p-1 rounded-xl border border-[#222a3d] self-start lg:self-center max-w-full overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('consolidado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'consolidado'
                ? 'bg-[#10b981] text-[#ffffff] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">dashboard</span>
            <span>Consolidado</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('operativo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'operativo'
                ? 'bg-[#10b981] text-[#ffffff] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">alt_route</span>
            <span>Operativo</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kpis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'kpis'
                ? 'bg-[#10b981] text-[#ffffff] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">insights</span>
            <span>KPIs &amp; Reportes</span>
          </button>
        </div>
      </div>

      {/* TOP MASTER KPI METRIC CARDS (ALWAYS VISIBLE IN ALL VIEWS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Cumplimiento Semanal */}
        <div className="bg-[#131b2e] rounded-xl p-3.5 shadow-md flex flex-col justify-between border border-[#222a3d]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-[#bbcabf] uppercase tracking-wider font-bold">
              Cumplimiento
            </span>
            <span className="w-6 h-6 rounded-full bg-[#4edea3]/15 flex items-center justify-center text-[#4edea3]">
              <span className="material-symbols-outlined text-[16px]">verified</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-headline font-bold text-[#4edea3]">94.2%</span>
              <span className="text-[10px] text-[#4edea3] flex items-center font-bold">
                <span className="material-symbols-outlined text-[12px]">trending_up</span>
                +3.4%
              </span>
            </div>
            <p className="text-[10px] text-[#bbcabf] mt-0.5 leading-tight">
              74 de 78 visitas ejecutadas esta semana
            </p>
          </div>
          <div className="w-full bg-[#2d3449] rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-[#4edea3] h-full rounded-full" style={{ width: '94.2%' }} />
          </div>
        </div>

        {/* Efectividad Ruta */}
        <div className="bg-[#131b2e] rounded-xl p-3.5 shadow-md flex flex-col justify-between border border-[#222a3d]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-[#bbcabf] uppercase tracking-wider font-bold">
              Efectividad Ruta
            </span>
            <span className="w-6 h-6 rounded-full bg-[#c0c1ff]/15 flex items-center justify-center text-[#c0c1ff]">
              <span className="material-symbols-outlined text-[16px]">navigation</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-headline font-bold text-[#dae2fd]">91.8%</span>
              <span className="text-[10px] text-[#4edea3] flex items-center font-bold">-22% min</span>
            </div>
            <p className="text-[10px] text-[#bbcabf] mt-0.5 leading-tight">
              Tiempos de traslado optimizados vía CAVI
            </p>
          </div>
          <div className="w-full bg-[#2d3449] rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-[#c0c1ff] h-full rounded-full" style={{ width: '91.8%' }} />
          </div>
        </div>

        {/* Cobertura Q3 Departamental */}
        <div className="bg-[#131b2e] rounded-xl p-3.5 shadow-md flex flex-col justify-between border border-[#222a3d]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-[#bbcabf] uppercase tracking-wider font-bold">
              Cobertura Q3
            </span>
            <span className="w-6 h-6 rounded-full bg-[#ffb95f]/15 flex items-center justify-center text-[#ffb95f]">
              <span className="material-symbols-outlined text-[16px]">domain</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-headline font-bold text-[#ffb95f]">81.3%</span>
              <span className="text-[10px] text-[#bbcabf]">ciclo</span>
            </div>
            <p className="text-[10px] text-[#bbcabf] mt-0.5 leading-tight">
              493 de 606 puntos auditados en ciclo actual
            </p>
          </div>
          <div className="w-full bg-[#2d3449] rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-[#ffb95f] h-full rounded-full" style={{ width: '81.3%' }} />
          </div>
        </div>

        {/* Hallazgos Críticos */}
        <div className="bg-[#131b2e] rounded-xl p-3.5 shadow-md flex flex-col justify-between border border-[#222a3d]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-[#bbcabf] uppercase tracking-wider font-bold">
              Hallazgos Críticos
            </span>
            <span className="w-6 h-6 rounded-full bg-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[16px]">warning</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-headline font-bold text-[#ffb4ab]">18</span>
              <span className="text-[10px] text-[#ffb4ab] font-bold">Re-visita</span>
            </div>
            <p className="text-[10px] text-[#bbcabf] mt-0.5 leading-tight">
              Requieren re-inspección inmediata (&lt;48h)
            </p>
          </div>
          <div className="w-full bg-[#2d3449] rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-[#ffb4ab] h-full rounded-full" style={{ width: '23%' }} />
          </div>
        </div>
      </div>

      {/* PUSH ALERT BANNER */}
      {!alertDismissed && (
        <div className="relative overflow-hidden rounded-xl bg-[#222a3d] p-3.5 shadow-md border border-[#ffb95f]/30">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#e29100] text-[#523200] shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[11px] text-[#ffb95f] uppercase tracking-wider font-bold">
                  Alerta en Terreno
                </span>
                <span className="text-[11px] text-[#bbcabf]">09:15 AM</span>
              </div>
              <p className="text-xs text-[#dae2fd] leading-snug">
                Cambio de horario en{' '}
                <span className="font-semibold text-[#c0c1ff]">CDA del Sol Riohacha</span> por inventario
                imprevisto. Ruta re-optimizada automáticamente por CAVI.
              </p>
            </div>
            <button
              aria-label="Descartar"
              className="text-[#bbcabf] hover:text-white p-1 shrink-0 transition-colors cursor-pointer"
              onClick={() => setAlertDismissed(true)}
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN UNIFIED CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: OPERATIVO / COBERTURA / ASISTENTE CAVI */}
        {(viewMode === 'consolidado' || viewMode === 'operativo') && (
          <div className={`${viewMode === 'consolidado' ? 'lg:col-span-7 xl:col-span-7' : 'lg:col-span-12'} space-y-4`}>
            {/* RESUMEN DE COBERTURA GLOBAL & METAS */}
            <div className="flex flex-col rounded-xl bg-[#131b2e] p-4 shadow-sm space-y-3.5 border border-[#222a3d]/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#4edea3]"></div>
                  <span className="text-xs text-[#dae2fd] font-semibold tracking-wide">
                    Cobertura Global &amp; Meta Semanal
                  </span>
                </div>
                <span className="font-code-metric text-xs text-[#4edea3] bg-[#171f33] px-2.5 py-0.5 rounded-full border border-[#4edea3]/20">
                  Semana 42
                </span>
              </div>

              {/* MAIN STAT ROW */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col bg-[#171f33] p-3 rounded-lg border border-[#222a3d]/50">
                  <span className="text-[11px] text-[#bbcabf]">Universo Total</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-headline font-bold text-[#dae2fd]">606</span>
                    <span className="text-[11px] text-[#bbcabf]">puntos</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-[#c0c1ff]">
                    <span className="material-symbols-outlined text-[14px]">hub</span>
                    <span>Red Activa Departamental</span>
                  </div>
                </div>

                <div className="flex flex-col bg-[#171f33] p-3 rounded-lg border border-[#222a3d]/50">
                  <span className="text-[11px] text-[#bbcabf]">Meta Semanal</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-headline font-bold text-[#4edea3]">58</span>
                    <span className="text-sm text-[#bbcabf]">/ 78</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[11px] font-bold text-[#4edea3]">74.4% avance</span>
                    <span className="text-[11px] text-[#bbcabf]">| 20 rest.</span>
                  </div>
                </div>
              </div>

              {/* PROGRESS LINE VISUAL */}
              <div className="flex flex-col space-y-1">
                <div className="w-full bg-[#2d3449] h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-[#4edea3] h-full rounded-full transition-all duration-700"
                    style={{ width: '74.4%' }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-[#bbcabf]">
                  <span>0 visitas</span>
                  <span>Meta objetivo: 78 visitas</span>
                </div>
              </div>

              {/* BREAKDOWN PILLS: CM, PF, CDA */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {/* CM Compumueble */}
                <div className="flex flex-col p-2 rounded-lg bg-[#222a3d] border border-[#083344]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-[#22D3EE] bg-[#083344] px-1.5 py-0.5 rounded">
                      CM
                    </span>
                    <span className="font-code-metric text-[10px] text-[#bbcabf]">62.6%</span>
                  </div>
                  <span className="text-xs text-[#dae2fd] font-semibold">245 / 391</span>
                  <span className="text-[10px] text-[#bbcabf] truncate">Compumueble</span>
                </div>

                {/* PF Punto Físico */}
                <div className="flex flex-col p-2 rounded-lg bg-[#222a3d] border border-[#082F49]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-[#38BDF8] bg-[#082F49] px-1.5 py-0.5 rounded">
                      PF
                    </span>
                    <span className="font-code-metric text-[10px] text-[#bbcabf]">67.0%</span>
                  </div>
                  <span className="text-xs text-[#dae2fd] font-semibold">118 / 176</span>
                  <span className="text-[10px] text-[#bbcabf] truncate">Punto Físico</span>
                </div>

                {/* CDA Centro Acopio */}
                <div className="flex flex-col p-2 rounded-lg bg-[#222a3d] border border-[#3B0764]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-[#C084FC] bg-[#3B0764] px-1.5 py-0.5 rounded">
                      CDA
                    </span>
                    <span className="font-code-metric text-[10px] text-[#4edea3] font-bold">82.0%</span>
                  </div>
                  <span className="text-xs text-[#dae2fd] font-semibold">32 / 39</span>
                  <span className="text-[10px] text-[#bbcabf] truncate">Centro Acopio</span>
                </div>
              </div>
            </div>

            {/* ASISTENTE CAVI (AI INTELLIGENCE MODULE) */}
            <div className="relative overflow-hidden rounded-xl bg-[#131b2e] shadow-xl p-4 space-y-3.5 border border-[#3131c0]/40">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#3131c0] opacity-20 blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#3131c0] flex items-center justify-center text-[#c0c1ff] shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline font-bold text-sm text-[#dae2fd] leading-tight">
                      Asistente CAVI
                    </span>
                    <span className="text-[11px] text-[#c0c1ff]">Motor de Inteligencia Operativa</span>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#3131c0]/40 text-[#c0c1ff] text-[11px] font-semibold border border-[#3131c0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-ping"></span>
                  Activo
                </span>
              </div>

              {/* CRITICAL AUDIT POINTS ALERT CONTAINER */}
              <div className="flex flex-col bg-[#171f33] p-3 rounded-xl space-y-2.5 relative z-10 border border-[#222a3d]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]">
                      crisis_alert
                    </span>
                    <span className="text-xs text-[#dae2fd] font-bold">Puntos Críticos en Mora</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#93000a]/40 text-[#ffb4ab] text-[11px] font-bold border border-[#93000a]">
                    14 Puntos (&gt;75 días)
                  </span>
                </div>
                <p className="text-[11px] text-[#bbcabf]">
                  Puntos que superan el ciclo regulatorio de 60 a 90 días sin auditoría física documentada.
                </p>

                {/* PENDING CARDS LIST */}
                <div className="flex flex-col space-y-1.5">
                  <div className="flex flex-col p-2.5 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] transition-colors space-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-[#22D3EE] bg-[#083344] px-1 py-0.5 rounded">
                          CM
                        </span>
                        <span className="text-xs text-[#dae2fd] font-bold truncate">
                          CM-108 Riohacha Viva
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-[#ffb4ab] font-bold shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]"></span>
                        Hace 84 días
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#bbcabf]">
                      <span className="truncate">Calle 15 #18-20 • Zona Norte</span>
                      <span className="text-[10px] text-[#ffb95f] font-semibold">Prioridad Alta</span>
                    </div>
                  </div>

                  <div className="flex flex-col p-2.5 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] transition-colors space-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-[#38BDF8] bg-[#082F49] px-1 py-0.5 rounded">
                          PF
                        </span>
                        <span className="text-xs text-[#dae2fd] font-bold truncate">
                          PF-042 Maicao Central
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-[#ffb4ab] font-bold shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]"></span>
                        Hace 72 días
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#bbcabf]">
                      <span className="truncate">Calle 16 #13-05 • Zona Centro</span>
                      <span className="text-[10px] text-[#c0c1ff] font-medium">Re-visita Inventario</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI SMART OPTIMIZATION CARD */}
              <div className="flex flex-col p-3 rounded-xl bg-[#171f33] space-y-2 relative z-10 border border-[#222a3d]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#c0c1ff] text-[18px]">
                    lightbulb
                  </span>
                  <span className="text-xs text-[#c0c1ff] font-bold">
                    Optimización de Desplazamiento
                  </span>
                </div>
                <p className="text-xs text-[#dae2fd] leading-snug">
                  Se agruparon <span className="font-bold text-[#4edea3]">9 puntos</span> en el corredor
                  Troncal del Caribe para <span className="font-semibold text-white">Samuel Ramos</span>.
                </p>
                <div className="flex items-center gap-1.5 bg-[#2d3449] px-2.5 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-[#4edea3] text-[16px]">
                    electric_bolt
                  </span>
                  <span className="text-xs text-[#dae2fd]">
                    Ahorro proyectado:{' '}
                    <strong className="text-[#4edea3] font-bold">1h 45m</strong> de traslado hoy
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 relative z-10">
                <button
                  onClick={handleApplyCavi}
                  disabled={isApplyingCavi || caviApplied}
                  className={`w-full h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-xs shadow-md active:opacity-90 transition-all cursor-pointer ${
                    caviApplied
                      ? 'bg-[#171f33] text-[#4edea3] border border-[#4edea3]/40'
                      : 'bg-[#4edea3] text-[#003824] hover:bg-[#6ffbbe]'
                  }`}
                >
                  {isApplyingCavi ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                      <span>Optimizando rutas...</span>
                    </>
                  ) : caviApplied ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">done_all</span>
                      <span>Rutas de Hoy Optimizadas</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>Aplicar a Rutas de Hoy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onOpenCriticalPoints}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-[#dae2fd] text-xs font-semibold transition-colors border border-[#2d3449] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                  <span>Ver 14 Puntos Pendientes</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN (OR FULL WIDTH): AUDITORES EN TERRENO + REPORTES EXCEL */}
        {(viewMode === 'consolidado' || viewMode === 'operativo') && (
          <div className={`${viewMode === 'consolidado' ? 'lg:col-span-5 xl:col-span-5' : 'lg:col-span-12'} space-y-4`}>
            {/* AUDITORES EN TERRENO (LIVE OPERATIONS) */}
            <div className="flex flex-col space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#4edea3] text-[20px]">
                    engineering
                  </span>
                  <h2 className="font-headline font-bold text-sm text-[#dae2fd]">
                    Auditores en Terreno Hoy
                  </h2>
                </div>
                <span className="text-[11px] text-[#bbcabf] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
                  3 activos
                </span>
              </div>

              {/* FILTER CHIPS */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-[#4edea3] text-[#003824] font-bold'
                      : 'bg-[#222a3d] text-[#bbcabf] hover:bg-[#2d3449]'
                  }`}
                >
                  Todos (3)
                </button>
                <button
                  onClick={() => setActiveFilter('progress')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === 'progress'
                      ? 'bg-[#4edea3] text-[#003824] font-bold'
                      : 'bg-[#222a3d] text-[#bbcabf] hover:bg-[#2d3449]'
                  }`}
                >
                  En Curso (2)
                </button>
                <button
                  onClick={() => setActiveFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === 'completed'
                      ? 'bg-[#4edea3] text-[#003824] font-bold'
                      : 'bg-[#222a3d] text-[#bbcabf] hover:bg-[#2d3449]'
                  }`}
                >
                  Completados (1)
                </button>
                <button
                  onClick={() => setActiveFilter('alert')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === 'alert'
                      ? 'bg-[#4edea3] text-[#003824] font-bold'
                      : 'bg-[#222a3d] text-[#bbcabf] hover:bg-[#2d3449]'
                  }`}
                >
                  Alertas CAVI (1)
                </button>
              </div>

              {/* AUDITOR ROSTER CARDS */}
              <div className="flex flex-col space-y-2.5">
                {filteredAuditors.map((auditor) => (
                  <div
                    key={auditor.id}
                    className="flex flex-col p-3.5 rounded-xl bg-[#131b2e] space-y-2 shadow-sm border border-[#222a3d] hover:border-[#3131c0]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={auditor.avatar}
                            alt={auditor.name}
                            className="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-[#4edea3]/30"
                            referrerPolicy="no-referrer"
                          />
                          <span
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#131b2e] bg-[#4edea3]"
                          ></span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-[#dae2fd] truncate">
                            {auditor.name}
                          </span>
                          <span className="text-[11px] text-[#bbcabf]">
                            Auditor {auditor.zone} • Zona {auditor.zone}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-[#4edea3]">
                          {auditor.visitsDone}/{auditor.visitsTarget}
                        </span>
                        <div className="text-[10px] text-[#bbcabf]">
                          {auditor.status === 'completed' ? '100% Meta' : 'visitas'}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="flex-1 bg-[#2d3449] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-[#4edea3]"
                          style={{
                            width: `${(auditor.visitsDone / auditor.visitsTarget) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="font-code-metric text-[10px] text-[#bbcabf]">
                        {Math.round((auditor.visitsDone / auditor.visitsTarget) * 100)}%
                      </span>
                    </div>

                    {/* Footer info */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-[#bbcabf] border-t border-[#222a3d]/50">
                      <span className="flex items-center gap-1 text-[#c0c1ff]">
                        <span className="material-symbols-outlined text-[13px]">
                          {auditor.status === 'completed' ? 'task_alt' : 'alt_route'}
                        </span>
                        {auditor.statusText}
                      </span>
                      <span className="text-[10px] text-[#bbcabf]">{auditor.currentLocation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SCANNER TRIGGER */}
            <div className="pt-1">
              <button
                onClick={onOpenScanner}
                className="w-full p-3.5 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] flex items-center justify-between text-[#dae2fd] transition-all border border-[#3c4a42]/50 active:scale-[0.99] shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#171f33] flex items-center justify-center text-[#4edea3]">
                    <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-[#dae2fd]">Escanear Punto de Control</span>
                    <span className="text-[10px] text-[#bbcabf]">Check-in geoetiquetado por QR / NFC</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#bbcabf]">chevron_right</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION: DESEMPEÑO DE AUDITORES & DESGLOSE POR FORMATO (KPIS SECTION) */}
        {(viewMode === 'consolidado' || viewMode === 'kpis') && (
          <div className={`${viewMode === 'consolidado' ? 'lg:col-span-7 xl:col-span-7' : 'lg:col-span-7'} space-y-4`}>
            {/* Desempeño de Auditores Individual */}
            <div className="bg-[#131b2e] rounded-xl p-4 shadow-md border border-[#222a3d]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4edea3] text-[20px]">badge</span>
                  <h2 className="font-headline font-bold text-sm text-[#dae2fd]">
                    Desempeño Individual de Auditores
                  </h2>
                </div>
                <span className="text-[11px] text-[#bbcabf]">Promedio: 9.1 pts/d</span>
              </div>

              <div className="flex flex-col gap-3">
                {auditors.map((auditor) => (
                  <div
                    key={auditor.id}
                    className="bg-[#171f33] rounded-xl p-3 shadow-sm border border-[#222a3d]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-[#4edea3]/40"
                          alt={auditor.name}
                          src={auditor.avatar}
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#dae2fd] truncate">
                              {auditor.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#222a3d] text-[#bbcabf] text-[10px]">
                              {auditor.zone}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#bbcabf]">
                            {auditor.pointsPerDay} pts/día • {auditor.auditedTotal} auditados
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-headline font-bold text-[#4edea3]">
                          {auditor.effectiveness}%
                        </span>
                        <p className="text-[10px] text-[#4edea3]/80">Efectividad</p>
                      </div>
                    </div>

                    <div className="w-full bg-[#2d3449] rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className="bg-[#4edea3] h-full rounded-full"
                        style={{ width: `${auditor.effectiveness}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#222a3d]">
                      <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[10px] font-code-metric text-[#e1e0ff]">
                        {auditor.targetBreakdown.cm} CM
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[10px] font-code-metric text-[#ffb95f]">
                        {auditor.targetBreakdown.pf} PF
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[10px] font-code-metric text-[#c0c1ff]">
                        {auditor.targetBreakdown.cda} CDA
                      </span>
                      <span className="text-[11px] text-[#bbcabf] ml-auto flex items-center gap-1">
                        {auditor.moraPending > 0 ? (
                          <>
                            <span className="material-symbols-outlined text-[13px] text-[#ffb95f]">
                              schedule
                            </span>
                            <span>{auditor.moraPending} pend</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[13px] text-[#4edea3]">
                              verified
                            </span>
                            <span>0 mora</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desglose por Formato de Establecimiento */}
            <div className="bg-[#131b2e] rounded-xl p-4 shadow-md border border-[#222a3d]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#c0c1ff] text-[20px]">
                    pie_chart
                  </span>
                  <h2 className="font-headline font-bold text-sm text-[#dae2fd]">
                    Desglose por Formato
                  </h2>
                </div>
                <span className="font-code-metric text-xs text-[#4edea3]">Score: 91.4/100</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* CM */}
                <div className="bg-[#171f33] rounded-xl p-2.5 flex flex-col items-center text-center border border-[#222a3d]">
                  <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[#e1e0ff] text-[11px] font-bold">
                    CM
                  </span>
                  <span className="text-base font-headline font-bold text-[#dae2fd] mt-1">391</span>
                  <span className="text-[10px] text-[#bbcabf]">Compumueble</span>
                  <span className="font-code-metric text-xs text-[#4edea3] mt-2">92.8%</span>
                  <span className="text-[9px] text-[#bbcabf]">Conforme</span>
                </div>

                {/* PF */}
                <div className="bg-[#171f33] rounded-xl p-2.5 flex flex-col items-center text-center border border-[#222a3d]">
                  <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[#ffb95f] text-[11px] font-bold">
                    PF
                  </span>
                  <span className="text-base font-headline font-bold text-[#dae2fd] mt-1">176</span>
                  <span className="text-[10px] text-[#bbcabf]">Punto Físico</span>
                  <span className="font-code-metric text-xs text-[#4edea3] mt-2">89.4%</span>
                  <span className="text-[9px] text-[#bbcabf]">Conforme</span>
                </div>

                {/* CDA */}
                <div className="bg-[#171f33] rounded-xl p-2.5 flex flex-col items-center text-center border border-[#222a3d]">
                  <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[#c0c1ff] text-[11px] font-bold">
                    CDA
                  </span>
                  <span className="text-base font-headline font-bold text-[#dae2fd] mt-1">39</span>
                  <span className="text-[10px] text-[#bbcabf]">Acopio</span>
                  <span className="font-code-metric text-xs text-[#ffb95f] mt-2">86.1%</span>
                  <span className="text-[9px] text-[#bbcabf]">Conforme</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
