import React, { useState } from 'react';
import { Auditor } from '../../types';

interface KpisScreenProps {
  auditors: Auditor[];
  onShowToast: (title: string, message: string) => void;
}

export const KpisScreen: React.FC<KpisScreenProps> = ({ auditors, onShowToast }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('Semana Actual');
  const [selectedAuditors, setSelectedAuditors] = useState('Todos (3)');
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadExcel = (filename = 'GUADIT_Consolidado_Sem42.xlsx') => {
    setIsExporting(true);

    setTimeout(() => {
      setIsExporting(false);
      onShowToast('Generando XLSX', `${filename} listo para guardar`);

      // Generate a realistic downloadable spreadsheet CSV format with Excel MIME
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
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#131b2e] p-3.5 sm:px-4 rounded-xl border border-[#222a3d]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#171f33] flex items-center justify-center text-[#4edea3] shadow-sm">
            <span className="material-symbols-outlined text-[22px]">query_stats</span>
          </div>
          <div>
            <h1 className="font-headline font-bold text-base md:text-lg text-[#dae2fd] tracking-tight">
              Tablero Ejecutivo
            </h1>
            <p className="text-[11px] text-[#bbcabf]">
              Corte de ciclo Q3 • Red Departamental La Guajira (Semana 42)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
        </div>
      </div>

      {/* 4 Big KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Cumplimiento */}
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
              <span className="text-[10px] text-[#4edea3] flex items-center font-bold">-22%</span>
            </div>
            <p className="text-[10px] text-[#bbcabf] mt-0.5 leading-tight">
              Tiempos de traslado optimizados vía CAVI
            </p>
          </div>
          <div className="w-full bg-[#2d3449] rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-[#c0c1ff] h-full rounded-full" style={{ width: '91.8%' }} />
          </div>
        </div>

        {/* Cobertura Q3 */}
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
            <span className="w-6 h-6 rounded-full bg-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] animate-pulse">
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

      {/* RESPONSIVE 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Desempeño de Auditores & Desglose por Formato */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          {/* Desempeño de Auditores */}
      <div className="bg-[#131b2e] rounded-xl p-4 shadow-md border border-[#222a3d]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[20px]">badge</span>
            <h2 className="font-headline font-bold text-sm text-[#dae2fd]">
              Desempeño de Auditores
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

      {/* Desglose por Formato */}
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

    {/* RIGHT COLUMN: Exportación de Reportes & Histórico */}
    <div className="lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-22">
      {/* Exportación de Reportes Ejecutivos */}
      <div className="bg-[#131b2e] rounded-xl p-4 shadow-xl relative overflow-hidden border border-[#222a3d]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#4edea3]/20 flex items-center justify-center text-[#4edea3]">
            <span className="material-symbols-outlined text-[20px]">table_view</span>
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="font-headline font-bold text-sm text-[#dae2fd]">
              Exportación de Reportes Ejecutivos
            </h2>
            <p className="text-[11px] text-[#bbcabf]">Formato oficial con dinámicas integradas</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[#171f33] rounded-lg p-2 flex flex-col border border-[#222a3d]">
            <label className="text-[10px] text-[#bbcabf] mb-0.5">Período</label>
            <div className="flex items-center justify-between text-[#dae2fd] text-xs">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-xs text-[#dae2fd] focus:outline-none w-full cursor-pointer"
              >
                <option value="Semana Actual" className="bg-[#131b2e]">Semana Actual (42)</option>
                <option value="Semana Anterior" className="bg-[#131b2e]">Semana Anterior (41)</option>
                <option value="Mes Octubre" className="bg-[#131b2e]">Mes Octubre</option>
                <option value="Q3 Completo" className="bg-[#131b2e]">Q3 Completo</option>
              </select>
            </div>
          </div>

          <div className="bg-[#171f33] rounded-lg p-2 flex flex-col border border-[#222a3d]">
            <label className="text-[10px] text-[#bbcabf] mb-0.5">Auditores</label>
            <div className="flex items-center justify-between text-[#dae2fd] text-xs">
              <select
                value={selectedAuditors}
                onChange={(e) => setSelectedAuditors(e.target.value)}
                className="bg-transparent text-xs text-[#dae2fd] focus:outline-none w-full cursor-pointer"
              >
                <option value="Todos (3)" className="bg-[#131b2e]">Todos (3)</option>
                <option value="Samuel Ramos" className="bg-[#131b2e]">Samuel Ramos</option>
                <option value="Kleyder Rodriguez" className="bg-[#131b2e]">Kleyder Rodriguez</option>
                <option value="Jose Aponte" className="bg-[#131b2e]">Jose Aponte</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#171f33] rounded-lg p-3 mb-3 border border-[#222a3d]">
          <div className="flex items-center gap-1.5 text-[#c0c1ff] mb-1.5 text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>Contenido del archivo .XLSX:</span>
          </div>
          <ul className="text-[11px] text-[#bbcabf] space-y-1">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
              606 puntos con timestamp de última visita y geolocalización.
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
              18 hallazgos críticos desglosados (CM, PF, CDA).
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff]" />
              Alertas predictivas CAVI y registro de kilometraje optimizado.
            </li>
          </ul>
        </div>

        <button
          onClick={() => handleDownloadExcel()}
          disabled={isExporting}
          className="w-full h-12 bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
        >
          {isExporting ? (
            <>
              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
              <span>Compilando datos ejecutivos...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">download</span>
              <span>Descargar Reporte en Excel (.XLSX)</span>
            </>
          )}
        </button>

        {/* Histórico de Descargas */}
        <div className="mt-4 pt-3 border-t border-[#222a3d]">
          <span className="text-[10px] text-[#bbcabf] uppercase tracking-wider block mb-2 font-semibold">
            Histórico de Descargas
          </span>
          <div className="space-y-1.5">
            <div className="bg-[#171f33] rounded-lg px-3 py-2 flex items-center justify-between border border-[#222a3d]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[#4edea3] text-[18px]">
                  description
                </span>
                <div className="min-w-0 truncate">
                  <span className="text-xs text-[#dae2fd] truncate block font-medium">
                    GUADIT_Consolidado_Sem41.xlsx
                  </span>
                  <span className="text-[10px] text-[#bbcabf] block">12 Oct 2024 • 4.2 MB</span>
                </div>
              </div>
              <button
                onClick={() => handleDownloadExcel('GUADIT_Consolidado_Sem41.xlsx')}
                aria-label="Descargar Sem 41"
                className="w-8 h-8 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] flex items-center justify-center text-[#4edea3] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
              </button>
            </div>

            <div className="bg-[#171f33] rounded-lg px-3 py-2 flex items-center justify-between border border-[#222a3d]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[#4edea3] text-[18px]">
                  description
                </span>
                <div className="min-w-0 truncate">
                  <span className="text-xs text-[#dae2fd] truncate block font-medium">
                    GUADIT_Q3_Auditoria_Completa.xlsx
                  </span>
                  <span className="text-[10px] text-[#bbcabf] block">30 Sep 2024 • 11.8 MB</span>
                </div>
              </div>
              <button
                onClick={() => handleDownloadExcel('GUADIT_Q3_Auditoria_Completa.xlsx')}
                aria-label="Descargar Q3"
                className="w-8 h-8 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] flex items-center justify-center text-[#4edea3] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
);
};
