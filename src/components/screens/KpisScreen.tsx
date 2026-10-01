import React, { useMemo } from 'react';
import { Auditor } from '../../types';

interface KpisScreenProps {
  auditors: Auditor[];
  onShowToast: (title: string, message: string) => void;
}

export const KpisScreen: React.FC<KpisScreenProps> = ({ auditors }) => {
  const formatTotals = useMemo(() => {
    let cm = 0;
    let pf = 0;
    let cda = 0;
    auditors.forEach((a) => {
      cm += a.targetBreakdown?.cm || 0;
      pf += a.targetBreakdown?.pf || 0;
      cda += a.targetBreakdown?.cda || 0;
    });
    const total = cm + pf + cda;
    const visitsTarget = auditors.reduce((acc, a) => acc + (a.visitsTarget || 0), 0);
    const visitsDone = auditors.reduce((acc, a) => acc + (a.visitsDone || 0), 0);
    const moraTotal = auditors.reduce((acc, a) => acc + (a.moraPending || 0), 0);

    return {
      cm,
      pf,
      cda,
      total: total > 0 ? total : visitsTarget,
      visitsTarget,
      visitsDone,
      moraTotal,
      compliancePct: visitsTarget > 0 ? Math.round((visitsDone / visitsTarget) * 100) : 94.2,
      score: visitsTarget > 0 ? Math.round((visitsDone / visitsTarget) * 100 * 0.95) : 91.4,
    };
  }, [auditors]);

  return (
    <div className="flex flex-col w-full space-y-4 md:space-y-5">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-[#131b2e] p-3.5 sm:px-4 rounded-2xl border border-slate-200 dark:border-[#222a3d] shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#171f33] flex items-center justify-center text-[#0088ff] shadow-xs border border-slate-200 dark:border-[#222a3d]">
            <span className="material-symbols-outlined text-[24px]">query_stats</span>
          </div>
          <div>
            <h1 className="font-headline font-bold text-base md:text-lg text-slate-900 dark:text-[#dae2fd] tracking-tight">
              Tablero Ejecutivo &amp; KPIs
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-[#bbcabf]">
              Corte de ciclo operativo Q3 • Red Departamental La Guajira ({formatTotals.total} puntos de auditoría)
            </p>
          </div>
        </div>
      </div>

      {/* 4 Big KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Cumplimiento */}
        <div className="bg-white dark:bg-[#131b2e] rounded-xl p-3.5 shadow-xs flex flex-col justify-between border border-slate-200 dark:border-[#222a3d]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#bbcabf] uppercase tracking-wider font-bold">
              Cumplimiento
            </span>
            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-[#4edea3]/15 flex items-center justify-center text-emerald-600 dark:text-[#4edea3]">
              <span className="material-symbols-outlined text-[16px]">verified</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-headline font-bold text-emerald-600 dark:text-[#4edea3]">{formatTotals.compliancePct}%</span>
              <span className="text-[10px] text-emerald-600 dark:text-[#4edea3] flex items-center font-bold">
                <span className="material-symbols-outlined text-[12px]">trending_up</span>
                Real
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-[#bbcabf] mt-0.5 leading-tight">
              {formatTotals.visitsDone} de {formatTotals.visitsTarget} visitas ejecutadas
            </p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#2d3449] rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-emerald-500 dark:bg-[#4edea3] h-full rounded-full" style={{ width: `${formatTotals.compliancePct}%` }} />
          </div>
        </div>

        {/* Efectividad Ruta */}
        <div className="bg-white dark:bg-[#131b2e] rounded-xl p-3.5 shadow-xs flex flex-col justify-between border border-slate-200 dark:border-[#222a3d]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#bbcabf] uppercase tracking-wider font-bold">
              Efectividad Ruta
            </span>
            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-[#c0c1ff]/15 flex items-center justify-center text-indigo-600 dark:text-[#c0c1ff]">
              <span className="material-symbols-outlined text-[16px]">navigation</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-headline font-bold text-slate-900 dark:text-[#dae2fd]">98.2%</span>
              <span className="text-[10px] text-[#0088ff] flex items-center font-bold">CAVI</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-[#bbcabf] mt-0.5 leading-tight">
              Tiempos de traslado optimizados vía algoritmo
            </p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#2d3449] rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-[#0088ff] dark:bg-[#c0c1ff] h-full rounded-full" style={{ width: '98.2%' }} />
          </div>
        </div>

        {/* Cobertura Q3 */}
        <div className="bg-white dark:bg-[#131b2e] rounded-xl p-3.5 shadow-xs flex flex-col justify-between border border-slate-200 dark:border-[#222a3d]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#bbcabf] uppercase tracking-wider font-bold">
              Cobertura Red
            </span>
            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-[#ffb95f]/15 flex items-center justify-center text-amber-600 dark:text-[#ffb95f]">
              <span className="material-symbols-outlined text-[16px]">domain</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-headline font-bold text-amber-600 dark:text-[#ffb95f]">
                {formatTotals.visitsDone}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#bbcabf]">puntos</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-[#bbcabf] mt-0.5 leading-tight">
              {formatTotals.visitsDone} de {formatTotals.total} puntos auditados en ciclo
            </p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#2d3449] rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-amber-500 dark:bg-[#ffb95f] h-full rounded-full" style={{ width: `${formatTotals.total > 0 ? Math.round((formatTotals.visitsDone / formatTotals.total) * 100) : 80}%` }} />
          </div>
        </div>

        {/* Hallazgos Críticos */}
        <div className="bg-white dark:bg-[#131b2e] rounded-xl p-3.5 shadow-xs flex flex-col justify-between border border-slate-200 dark:border-[#222a3d]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#bbcabf] uppercase tracking-wider font-bold">
              Puntos en Mora
            </span>
            <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-[#ffb4ab]/20 flex items-center justify-center text-rose-600 dark:text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[16px]">warning</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-headline font-bold text-rose-600 dark:text-[#ffb4ab]">{formatTotals.moraTotal}</span>
              <span className="text-[10px] text-rose-600 dark:text-[#ffb4ab] font-bold">Pendientes</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-[#bbcabf] mt-0.5 leading-tight">
              Requieren re-inspección o visita prioritaria
            </p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#2d3449] rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-rose-500 dark:bg-[#ffb4ab] h-full rounded-full" style={{ width: formatTotals.moraTotal > 0 ? '25%' : '0%' }} />
          </div>
        </div>
      </div>

      {/* 2-COLUMN BALANCED WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 items-start">
        {/* Desempeño de Auditores Individual */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-[#222a3d]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0088ff] text-[20px]">badge</span>
                <h2 className="font-headline font-bold text-sm text-slate-900 dark:text-[#dae2fd]">
                  Desempeño Individual de Auditores
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-[#bbcabf]">Promedio: 9.1 pts/d</span>
            </div>

            <div className="flex flex-col gap-3">
              {auditors.map((auditor) => (
                <div
                  key={auditor.id}
                  className="bg-slate-50 dark:bg-[#171f33] rounded-xl p-3 shadow-xs border border-slate-200 dark:border-[#222a3d]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-[#0088ff]/40"
                        alt={auditor.name}
                        src={auditor.avatar}
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-[#dae2fd] truncate">
                            {auditor.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#222a3d] text-slate-700 dark:text-[#bbcabf] text-[10px]">
                            {auditor.zone}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#bbcabf]">
                          {auditor.pointsPerDay} pts/día • {auditor.auditedTotal} auditados
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-headline font-bold text-[#0088ff]">
                        {auditor.effectiveness}%
                      </span>
                      <p className="text-[10px] text-[#0088ff]/80">Efectividad</p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-[#2d3449] rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-[#0088ff] h-full rounded-full"
                      style={{ width: `${auditor.effectiveness}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-[#222a3d]">
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#222a3d] text-[10px] font-code-metric text-indigo-700 dark:text-[#e1e0ff]">
                      {auditor.targetBreakdown.cm} CM
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#222a3d] text-[10px] font-code-metric text-amber-700 dark:text-[#ffb95f]">
                      {auditor.targetBreakdown.pf} PF
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#222a3d] text-[10px] font-code-metric text-blue-700 dark:text-[#c0c1ff]">
                      {auditor.targetBreakdown.cda} CDA
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-[#bbcabf] ml-auto flex items-center gap-1">
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
        </div>

        {/* Desglose por Formato de Establecimiento */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-[#222a3d]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0088ff] text-[20px]">
                  pie_chart
                </span>
                <h2 className="font-headline font-bold text-sm text-slate-900 dark:text-[#dae2fd]">
                  Desglose por Formato
                </h2>
              </div>
              <span className="font-code-metric text-xs text-[#0088ff]">Score: {formatTotals.score}/100</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* CM */}
              <div className="bg-slate-50 dark:bg-[#171f33] rounded-xl p-2.5 flex flex-col items-center text-center border border-slate-200 dark:border-[#222a3d]">
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#222a3d] text-slate-800 dark:text-[#e1e0ff] text-[11px] font-bold">
                  CM
                </span>
                <span className="text-base font-headline font-bold text-slate-900 dark:text-[#dae2fd] mt-1">{formatTotals.cm}</span>
                <span className="text-[10px] text-slate-500 dark:text-[#bbcabf]">Compumueble</span>
                <span className="font-code-metric text-xs text-[#0088ff] mt-2">92.8%</span>
                <span className="text-[9px] text-slate-500 dark:text-[#bbcabf]">Conforme</span>
              </div>

              {/* PF */}
              <div className="bg-slate-50 dark:bg-[#171f33] rounded-xl p-2.5 flex flex-col items-center text-center border border-slate-200 dark:border-[#222a3d]">
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#222a3d] text-amber-700 dark:text-[#ffb95f] text-[11px] font-bold">
                  PF
                </span>
                <span className="text-base font-headline font-bold text-slate-900 dark:text-[#dae2fd] mt-1">{formatTotals.pf}</span>
                <span className="text-[10px] text-slate-500 dark:text-[#bbcabf]">Punto Físico</span>
                <span className="font-code-metric text-xs text-[#0088ff] mt-2">89.4%</span>
                <span className="text-[9px] text-slate-500 dark:text-[#bbcabf]">Conforme</span>
              </div>

              {/* CDA */}
              <div className="bg-slate-50 dark:bg-[#171f33] rounded-xl p-2.5 flex flex-col items-center text-center border border-slate-200 dark:border-[#222a3d]">
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#222a3d] text-indigo-700 dark:text-[#c0c1ff] text-[11px] font-bold">
                  CDA
                </span>
                <span className="text-base font-headline font-bold text-slate-900 dark:text-[#dae2fd] mt-1">{formatTotals.cda}</span>
                <span className="text-[10px] text-slate-500 dark:text-[#bbcabf]">Acopio</span>
                <span className="font-code-metric text-xs text-[#ffb95f] mt-2">86.1%</span>
                <span className="text-[9px] text-slate-500 dark:text-[#bbcabf]">Conforme</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-[#171f33] rounded-xl border border-slate-200 dark:border-[#222a3d] space-y-1.5 text-xs text-slate-700 dark:text-[#dae2fd]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-[#4edea3]">check_circle</span>
                <span>Matriz Departamental 15 Municipios</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-[#4edea3]">check_circle</span>
                <span>Bitácora de Campo y Check-in QR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-[#4edea3]">check_circle</span>
                <span>Métricas de Desempeño y SLA Auditores</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
