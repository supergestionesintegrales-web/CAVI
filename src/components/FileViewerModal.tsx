import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MacroFile } from '../types';

interface FileViewerModalProps {
  file: MacroFile | null;
  onClose: () => void;
  onInjectRoutes?: (file: MacroFile) => void;
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  file,
  onClose,
  onInjectRoutes,
  onShowToast,
}) => {
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [sheetSearch, setSheetSearch] = useState('');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  if (!file) return null;

  const currentSheet = file.sheets && file.sheets[activeSheetIndex];
  const filteredRows = currentSheet
    ? currentSheet.data.filter((row) =>
        row.some((cell) =>
          String(cell ?? '').toLowerCase().includes(sheetSearch.toLowerCase())
        )
      )
    : [];

  const handleDownload = () => {
    if (file.rawFile) {
      const url = URL.createObjectURL(file.rawFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Create a text/csv or mock download
      const blob = new Blob([
        `GUADIT Documento Extraído\nArchivo: ${file.name}\nRuta: ${file.path}\nResumen: ${file.summary}\nFecha: ${file.lastModified}\n`
      ], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
    onShowToast('Descarga iniciada', `Se ha generado el archivo ${file.name}`, 'info');
  };

  const getFileBadgeColor = () => {
    switch (file.type) {
      case 'excel':
        return 'bg-[#003824] text-[#4edea3] border-[#4edea3]/40';
      case 'powerpoint':
        return 'bg-[#523200] text-[#ffb95f] border-[#ffb95f]/40';
      case 'powerbi':
        return 'bg-[#472a00] text-[#ffb95f] border-[#ffb95f]/40';
      case 'word':
        return 'bg-[#1000a9]/30 text-[#c0c1ff] border-[#c0c1ff]/40';
      case 'pdf':
        return 'bg-[#690005]/40 text-[#ffb4ab] border-[#ffb4ab]/40';
      default:
        return 'bg-[#222a3d] text-[#bbcabf] border-[#222a3d]';
    }
  };

  const getFileIcon = () => {
    switch (file.type) {
      case 'excel':
        return 'table_chart';
      case 'powerpoint':
        return 'co_present';
      case 'powerbi':
        return 'analytics';
      case 'word':
        return 'article';
      case 'pdf':
        return 'picture_as_pdf';
      default:
        return 'draft';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-4xl bg-[#131b2e] border border-[#2d3449] rounded-2xl shadow-2xl flex flex-col text-[#dae2fd] max-h-[92vh] overflow-hidden"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 border-b border-[#222a3d] bg-[#171f33]/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${getFileBadgeColor()}`}>
                <span className="material-symbols-outlined text-[24px]">
                  {getFileIcon()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-headline font-bold text-base sm:text-lg text-[#dae2fd] truncate">
                    {file.name}
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getFileBadgeColor()}`}>
                    .{file.extension}
                  </span>
                </div>
                <p className="text-xs text-[#bbcabf] truncate flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[13px] text-[#4edea3]">folder</span>
                  <span>{file.path}</span>
                  <span>•</span>
                  <span>{file.sizeFormatted}</span>
                  <span>•</span>
                  <span>{file.lastModified}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {file.type === 'excel' && onInjectRoutes && (
                <button
                  onClick={() => {
                    onInjectRoutes(file);
                    onShowToast(
                      'Rutas Sincronizadas',
                      `Se importaron las paradas de "${file.name}" al plan operativo en vivo de GUADIT.`,
                      'success'
                    );
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  title="Inyectar datos de este archivo en la pantalla de Asignación y Rutas"
                >
                  <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                  <span className="hidden sm:inline">Alimentar Rutas</span>
                </button>
              )}

              <button
                onClick={handleDownload}
                className="w-9 h-9 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] flex items-center justify-center text-[#dae2fd] transition-colors"
                title="Descargar archivo"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
              </button>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] flex items-center justify-center text-[#bbcabf] hover:text-[#dae2fd] transition-colors"
                title="Cerrar visor"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Body Content by File Type */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Overview / Summary Box */}
            <div className="p-3.5 rounded-xl bg-[#171f33] border border-[#222a3d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#4edea3] uppercase tracking-wider">
                    Lectura e Indexación del Sistema
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                </div>
                <p className="text-xs text-[#dae2fd] leading-relaxed">
                  {file.summary}
                </p>
              </div>

              {/* KPIs Quick Badges */}
              {file.extractedMeta?.kpis && (
                <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
                  {Object.entries(file.extractedMeta.kpis).slice(0, 3).map(([key, val]) => (
                    <div key={key} className="px-2.5 py-1 rounded-lg bg-[#131b2e] border border-[#222a3d] text-center">
                      <p className="text-[10px] text-[#bbcabf] uppercase">{key}</p>
                      <p className="text-xs font-bold text-[#dae2fd]">{val}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 1. EXCEL SPREADSHEET VIEWER */}
            {file.type === 'excel' && file.sheets && file.sheets.length > 0 && (
              <div className="space-y-3">
                {/* Sheet Tabs and Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#222a3d]">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    <span className="text-xs text-[#bbcabf] font-medium mr-1 shrink-0">Hojas:</span>
                    {file.sheets.map((s, idx) => (
                      <button
                        key={s.name}
                        onClick={() => setActiveSheetIndex(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                          activeSheetIndex === idx
                            ? 'bg-[#4edea3] text-[#003824] shadow-sm font-bold'
                            : 'bg-[#171f33] text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#222a3d]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">table_rows</span>
                        <span>{s.name}</span>
                        <span className="text-[10px] opacity-80">({s.rowCount})</span>
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-56">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#bbcabf]">
                      search
                    </span>
                    <input
                      type="text"
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                      placeholder="Buscar en celdas..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#171f33] border border-[#222a3d] text-xs text-[#dae2fd] placeholder-[#bbcabf]/60 focus:outline-none focus:border-[#4edea3]"
                    />
                  </div>
                </div>

                {/* Table Rendering */}
                {currentSheet && (
                  <div className="rounded-xl border border-[#222a3d] overflow-hidden bg-[#171f33]">
                    <div className="overflow-x-auto max-h-[46vh]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#131b2e] sticky top-0 z-10 border-b border-[#222a3d]">
                          <tr>
                            <th className="p-2.5 text-[#bbcabf] font-semibold w-10 text-center border-r border-[#222a3d]">#</th>
                            {currentSheet.columns.map((col, cIdx) => (
                              <th
                                key={cIdx}
                                className="p-2.5 font-semibold text-[#dae2fd] border-r border-[#222a3d] last:border-r-0 whitespace-nowrap"
                              >
                                {col || `Columna ${cIdx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222a3d]">
                          {filteredRows.length > 0 ? (
                            filteredRows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-[#222a3d]/40 transition-colors">
                                <td className="p-2.5 text-center text-[#bbcabf] font-mono text-[10px] bg-[#131b2e]/40 border-r border-[#222a3d]">
                                  {rIdx + 1}
                                </td>
                                {currentSheet.columns.map((_, cIdx) => {
                                  const val = row[cIdx];
                                  const strVal = val !== undefined && val !== null ? String(val) : '';
                                  const isCM = strVal === 'CM';
                                  const isPF = strVal === 'PF';
                                  const isCDA = strVal === 'CDA';

                                  return (
                                    <td
                                      key={cIdx}
                                      className="p-2.5 text-[#dae2fd] border-r border-[#222a3d] last:border-r-0 whitespace-nowrap"
                                    >
                                      {isCM || isPF || isCDA ? (
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            isCM
                                              ? 'bg-[#083344] text-[#22D3EE]'
                                              : isPF
                                              ? 'bg-[#082F49] text-[#38BDF8]'
                                              : 'bg-[#3B0764] text-[#C084FC]'
                                          }`}
                                        >
                                          {strVal}
                                        </span>
                                      ) : (
                                        strVal || <span className="text-[#bbcabf]/40 italic">-</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={currentSheet.columns.length + 1}
                                className="p-8 text-center text-[#bbcabf]"
                              >
                                No se encontraron filas que coincidan con la búsqueda.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-2.5 bg-[#131b2e] border-t border-[#222a3d] text-[11px] text-[#bbcabf] flex items-center justify-between">
                      <span>Mostrando {filteredRows.length} de {currentSheet.rowCount} filas</span>
                      <span>Hoja activa: <strong className="text-[#dae2fd]">{currentSheet.name}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. POWERPOINT VIEWER */}
            {file.type === 'powerpoint' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Left: Interactive Slide Canvas */}
                  <div className="md:col-span-8 rounded-2xl bg-gradient-to-br from-[#171f33] to-[#0f1626] border border-[#222a3d] p-6 flex flex-col justify-between aspect-video min-h-[260px] shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#222a3d]/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffb95f]"></span>
                        <span className="text-xs font-bold text-[#ffb95f] uppercase tracking-wider">
                          Diapositiva {activeSlideIndex + 1} de {file.extractedMeta?.slidesCount || 16}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#bbcabf]">Comité de Operaciones CAVI</span>
                    </div>

                    <div className="my-auto py-4">
                      {activeSlideIndex === 0 && (
                        <div className="space-y-2 text-center max-w-md mx-auto">
                          <span className="px-3 py-1 rounded-full bg-[#ffb95f]/20 text-[#ffb95f] text-xs font-bold border border-[#ffb95f]/30">
                            Presentación Ejecutiva W42
                          </span>
                          <h3 className="font-headline font-black text-xl text-[#dae2fd]">
                            Balance Operativo de Rutas y Auditorías
                          </h3>
                          <p className="text-xs text-[#bbcabf]">
                            Cobertura Departamental La Guajira • Optimización Voronoi v2.4
                          </p>
                        </div>
                      )}
                      {activeSlideIndex === 1 && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-[#4edea3] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px]">verified</span>
                            Cumplimiento de Metas Mensuales
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 rounded-xl bg-[#131b2e] border border-[#222a3d] text-center">
                              <p className="text-[11px] text-[#bbcabf]">Efectividad</p>
                              <p className="text-lg font-black text-[#4edea3]">95.4%</p>
                            </div>
                            <div className="p-3 rounded-xl bg-[#131b2e] border border-[#222a3d] text-center">
                              <p className="text-[11px] text-[#bbcabf]">Auditores</p>
                              <p className="text-lg font-black text-[#c0c1ff]">3 Activos</p>
                            </div>
                            <div className="p-3 rounded-xl bg-[#131b2e] border border-[#222a3d] text-center">
                              <p className="text-[11px] text-[#bbcabf]">Mora Pendiente</p>
                              <p className="text-lg font-black text-[#ffb4ab]">4 Puntos</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {activeSlideIndex >= 2 && (
                        <div className="space-y-2 text-left">
                          <h4 className="font-bold text-sm text-[#dae2fd]">
                            Plan de Contingencia y Mitigación de Tráfico
                          </h4>
                          <ul className="text-xs text-[#bbcabf] space-y-1.5 list-disc pl-4">
                            <li>Reordenamiento dinámico por lluvias en cuadrante Autopista Norte.</li>
                            <li>Asignación de puntos flotantes a Kleyder Rodriguez (Centro).</li>
                            <li>Monitoreo de checkpoints vía GPS y telemetría activa en tiempo real.</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#222a3d]/80 text-xs">
                      <button
                        disabled={activeSlideIndex === 0}
                        onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                        className="px-2.5 py-1 rounded-lg bg-[#222a3d] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#2d3449] text-[#dae2fd]"
                      >
                        ← Anterior
                      </button>
                      <span className="text-[#bbcabf] text-[11px]">
                        {activeSlideIndex + 1} / {file.extractedMeta?.slidesCount || 16}
                      </span>
                      <button
                        disabled={activeSlideIndex >= (file.extractedMeta?.slidesCount || 16) - 1}
                        onClick={() => setActiveSlideIndex((prev) => prev + 1)}
                        className="px-2.5 py-1 rounded-lg bg-[#222a3d] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#2d3449] text-[#dae2fd]"
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>

                  {/* Right: Notes & Index */}
                  <div className="md:col-span-4 space-y-3">
                    <div className="p-3.5 rounded-xl bg-[#171f33] border border-[#222a3d] space-y-2">
                      <h4 className="text-xs font-bold text-[#ffb95f] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">notes</span>
                        Notas del Ponente
                      </h4>
                      <p className="text-xs text-[#bbcabf] leading-relaxed">
                        Hacer énfasis en la reducción del 22.4% en tiempos de traslado lograda gracias a las ventanas de despacho de la IA CAVI.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#171f33] border border-[#222a3d] space-y-2">
                      <h4 className="text-xs font-bold text-[#dae2fd] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                        Índice de Diapositivas
                      </h4>
                      <div className="space-y-1 text-xs text-[#bbcabf]">
                        <div
                          onClick={() => setActiveSlideIndex(0)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${activeSlideIndex === 0 ? 'bg-[#222a3d] text-[#dae2fd] font-bold' : 'hover:bg-[#222a3d]/50'}`}
                        >
                          1. Portada y Agenda
                        </div>
                        <div
                          onClick={() => setActiveSlideIndex(1)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${activeSlideIndex === 1 ? 'bg-[#222a3d] text-[#dae2fd] font-bold' : 'hover:bg-[#222a3d]/50'}`}
                        >
                          2. Hitos y Cumplimiento de Metas
                        </div>
                        <div
                          onClick={() => setActiveSlideIndex(2)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${activeSlideIndex >= 2 ? 'bg-[#222a3d] text-[#dae2fd] font-bold' : 'hover:bg-[#222a3d]/50'}`}
                        >
                          3. Contingencias y Despacho en Campo
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. POWER BI DASHBOARD VIEWER */}
            {file.type === 'powerbi' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#171f33] border border-[#222a3d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#ffb95f] text-[22px]">bar_chart_4_bars</span>
                      <h3 className="font-headline font-bold text-sm text-[#dae2fd]">
                        Modelo Semántico DirectQuery: {file.name}
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ffb95f]/15 text-[#ffb95f] text-[11px] font-bold border border-[#ffb95f]/30">
                      Power BI Dataset Activo
                    </span>
                  </div>

                  {/* Synthetic KPI Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-[#131b2e] border border-[#222a3d]">
                      <p className="text-[10px] text-[#bbcabf]">CUMPLIMIENTO</p>
                      <p className="text-xl font-black text-[#4edea3]">95.4%</p>
                      <p className="text-[10px] text-[#4edea3] mt-0.5">↑ +2.1% vs Q2</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#131b2e] border border-[#222a3d]">
                      <p className="text-[10px] text-[#bbcabf]">AUDITORÍAS MES</p>
                      <p className="text-xl font-black text-[#c0c1ff]">184</p>
                      <p className="text-[10px] text-[#bbcabf] mt-0.5">Meta: 180</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#131b2e] border border-[#222a3d]">
                      <p className="text-[10px] text-[#bbcabf]">TIEMPO VISITA</p>
                      <p className="text-xl font-black text-[#dae2fd]">41 min</p>
                      <p className="text-[10px] text-[#4edea3] mt-0.5">-8 min promedio</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#131b2e] border border-[#222a3d]">
                      <p className="text-[10px] text-[#bbcabf]">MORA ACTIVA</p>
                      <p className="text-xl font-black text-[#ffb4ab]">4 Pts</p>
                      <p className="text-[10px] text-[#ffb4ab] mt-0.5">2 Urgentes</p>
                    </div>
                  </div>

                  {/* Model Entities Table */}
                  <div className="pt-2 border-t border-[#222a3d] space-y-2">
                    <p className="text-xs font-semibold text-[#bbcabf]">
                      Estructura de Tablas del Modelo (.PBIX):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#131b2e] border border-[#222a3d]">
                        <span className="font-bold text-[#dae2fd] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#ffb95f]">table</span>
                          Fact_Visitas_Auditoria
                        </span>
                        <p className="text-[10px] text-[#bbcabf] mt-1">1,840 filas registradas</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#131b2e] border border-[#222a3d]">
                        <span className="font-bold text-[#dae2fd] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#ffb95f]">table</span>
                          Dim_PuntosVenta
                        </span>
                        <p className="text-[10px] text-[#bbcabf] mt-1">184 establecimientos</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#131b2e] border border-[#222a3d]">
                        <span className="font-bold text-[#dae2fd] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#ffb95f]">table</span>
                          Dim_Auditores_CAVI
                        </span>
                        <p className="text-[10px] text-[#bbcabf] mt-1">Samuel, Kleyder, Jose</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. WORD DOCUMENT VIEWER */}
            {file.type === 'word' && (
              <div className="p-6 rounded-2xl bg-[#171f33] border border-[#222a3d] space-y-4 max-w-2xl mx-auto shadow-inner">
                {/* Official Letterhead Header */}
                <div className="flex items-start justify-between border-b border-[#222a3d] pb-4">
                  <div>
                    <h3 className="font-headline font-bold text-base text-[#dae2fd]">
                      ACTA DE INSPECCIÓN Y AUDITORÍA TÉCNICA
                    </h3>
                    <p className="text-xs text-[#bbcabf]">
                      Sistema Integrado de Gestión Operacional GUADIT
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#3131c0] text-[#c0c1ff] text-[11px] font-mono font-bold">
                    DOC-2024-W42
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-b border-[#222a3d] pb-4">
                  <div>
                    <span className="text-[#bbcabf]">Auditor Responsable:</span>
                    <p className="font-bold text-[#dae2fd]">{file.extractedMeta?.author || 'Samuel Ramos Quintero'}</p>
                  </div>
                  <div>
                    <span className="text-[#bbcabf]">Fecha de Emisión:</span>
                    <p className="font-bold text-[#dae2fd]">{file.lastModified}</p>
                  </div>
                  <div>
                    <span className="text-[#bbcabf]">Ubicación y Formato:</span>
                    <p className="font-bold text-[#dae2fd]">Riohacha, La Guajira • Formato CM</p>
                  </div>
                  <div>
                    <span className="text-[#bbcabf]">Dictamen de Visita:</span>
                    <p className="font-bold text-[#4edea3]">CONFORME CON OBSERVACIONES</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#dae2fd] leading-relaxed">
                  <h4 className="font-bold text-sm text-[#dae2fd]">1. Resumen Ejecutivo del Hallazgo</h4>
                  <p className="text-[#bbcabf]">
                    {file.extractedMeta?.contentSnippet || file.summary}
                  </p>
                  <p className="text-[#bbcabf]">
                    Se verificó el cumplimiento de los estándares de almacenamiento, rotulado y verificación metrológica de balanzas. No se evidenciaron discrepancias de inventario mayores.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#222a3d] flex items-center justify-between text-xs text-[#bbcabf]">
                  <span>Firma digital: Validada vía Blockchain SHA-256</span>
                  <span className="text-[#4edea3] font-bold">Vigente</span>
                </div>
              </div>
            )}

            {/* 5. PDF VIEWER */}
            {file.type === 'pdf' && (
              <div className="p-6 rounded-2xl bg-[#171f33] border border-[#222a3d] space-y-4 max-w-2xl mx-auto">
                <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-[24px]">picture_as_pdf</span>
                    <div>
                      <h3 className="font-bold text-sm text-[#dae2fd]">{file.name}</h3>
                      <p className="text-[11px] text-[#bbcabf]">Páginas: {file.extractedMeta?.pageCount || 6} • Tamaño: {file.sizeFormatted}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-[#dae2fd] flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                    Descargar PDF
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-2">
                  <h4 className="text-xs font-bold text-[#ffb4ab] uppercase tracking-wider">
                    Extracto del Documento Certificado
                  </h4>
                  <p className="text-xs text-[#dae2fd] leading-relaxed">
                    {file.extractedMeta?.contentSnippet || file.summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#131b2e] border border-[#222a3d]">
                    <span className="text-[#bbcabf] text-[10px]">ORGANISMO EMISOR</span>
                    <p className="font-bold text-[#dae2fd] mt-0.5">{file.extractedMeta?.author || 'Dirección de Operaciones GUADIT'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#131b2e] border border-[#222a3d]">
                    <span className="text-[#bbcabf] text-[10px]">ESTADO DE INDEXACIÓN</span>
                    <p className="font-bold text-[#4edea3] mt-0.5">Leído y Verificado</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 sm:px-5 bg-[#171f33]/90 border-t border-[#222a3d] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#bbcabf]">
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-[16px] text-[#4edea3]">verified_user</span>
              <span className="truncate">Archivo protegido e indexado en la macro-carpeta: <strong className="text-[#dae2fd]">{file.macroFolder}</strong></span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-bold text-[#dae2fd] self-end sm:self-auto transition-colors"
            >
              Cerrar Visor
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
