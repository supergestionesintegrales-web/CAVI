import React, { useState, useRef } from 'react';
import { MacroFile, SupportedFileType, RouteStep } from '../../types';
import { MACRO_FOLDERS_DEFINITIONS, parseUploadedDirectoryFiles } from '../../data/macroFoldersData';
import { FileViewerModal } from '../FileViewerModal';

interface MacroFoldersScreenProps {
  files: MacroFile[];
  onAddFiles: (newFiles: MacroFile[]) => void;
  onInjectRoutes: (file: MacroFile) => void;
  activeRouteSourceFile?: string;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenScanner?: () => void;
  onManualCheckIn?: (code: string, name: string) => void;
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
}

export const MacroFoldersScreen: React.FC<MacroFoldersScreenProps> = ({
  files,
  onAddFiles,
  onInjectRoutes,
  activeRouteSourceFile,
  theme = 'dark',
  onToggleTheme,
  onOpenScanner,
  onManualCheckIn,
  onShowToast,
}) => {
  const [selectedMacroFolder, setSelectedMacroFolder] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<SupportedFileType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [manualQrCode, setManualQrCode] = useState<string>('');
  const [activeFileForViewer, setActiveFileForViewer] = useState<MacroFile | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Report Export State
  const [selectedPeriod, setSelectedPeriod] = useState('Semana Actual');
  const [selectedAuditors, setSelectedAuditors] = useState('Todos (3)');
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadExcel = (filename = 'CAVI_Consolidado_Sem42.xlsx') => {
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
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 900);
  };

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive unique years and months from existing files
  const availableYears = Array.from(new Set(files.map((f) => f.year))).sort().reverse();
  const availableMonths = Array.from(new Set(files.map((f) => f.month))).sort();

  // Filtered files
  const filteredFiles = files.filter((f) => {
    if (selectedMacroFolder !== 'all' && f.macroFolder.toLowerCase() !== selectedMacroFolder.toLowerCase()) {
      return false;
    }
    if (selectedYear !== 'all' && f.year !== selectedYear) {
      return false;
    }
    if (selectedMonth !== 'all' && f.month !== selectedMonth) {
      return false;
    }
    if (selectedType !== 'all' && f.type !== selectedType) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchPath = f.path.toLowerCase().includes(q);
      const matchSummary = f.summary.toLowerCase().includes(q);
      const matchExt = f.extension.toLowerCase().includes(q);
      if (!matchName && !matchPath && !matchSummary && !matchExt) {
        return false;
      }
    }
    return true;
  });

  // Handle Directory Picker Upload
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsProcessing(true);
    try {
      const fileList = Array.from(e.target.files) as File[];
      const parsed = await parseUploadedDirectoryFiles(fileList);
      if (parsed.length > 0) {
        onAddFiles(parsed);
        onShowToast(
          'Carpeta Procesada',
          `Se indexaron ${parsed.length} archivo(s) de la carpeta seleccionada.`,
          'success'
        );
      } else {
        onShowToast('Sin archivos válidos', 'No se encontraron archivos compatibles en la carpeta.', 'alert');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Error al leer carpeta', 'Ocurrió un inconveniente procesando los archivos.', 'alert');
    } finally {
      setIsProcessing(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  // Handle Drag and Drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const items = e.dataTransfer.items;
    const fileList: File[] = [];

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) fileList.push(file);
        }
      }
    } else if (e.dataTransfer.files) {
      fileList.push(...(Array.from(e.dataTransfer.files) as File[]));
    }

    if (fileList.length > 0) {
      setIsProcessing(true);
      try {
        const parsed = await parseUploadedDirectoryFiles(fileList);
        if (parsed.length > 0) {
          onAddFiles(parsed);
          onShowToast(
            'Archivos Indexados',
            `Se han procesado ${parsed.length} archivo(s) arrastrado(s) con éxito.`,
            'success'
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDownloadStructureGuide = () => {
    const guideContent = `# ESTRUCTURA DE MACRO-CARPETAS PARA CAVI
==================================================

CAVI se alimenta de una carpeta madre que organiza tus archivos por MACRO-CARPETAS > AÑOS > MESES:

CarpetaMadre/
│
├── Rutas/
│   ├── 2024/
│   │   ├── 10-Octubre/
│   │   │   ├── Rutas_Semana42_LaGuajira_Departamental.xlsx  <-- Hojas de ruta, paradas, SLA
│   │   │   └── Puntos_Mora_Prioritaria_LaGuajira.xlsx
│   │   └── 09-Septiembre/
│   │       └── Historico_Rutas_Septiembre_Consolidado.xlsx
│   └── 2023/
│       └── 12-Diciembre/
│
├── Auditorias/
│   ├── 2024/
│   │   ├── 10-Octubre/
│   │   │   ├── Acta_Inspeccion_CM108_Riohacha.docx   <-- Actas de auditoría
│   │   │   └── Informe_Auditoria_Integral_CDA005.pdf
│   │   └── 09-Septiembre/
│
├── Indicadores_PowerBI/
│   ├── 2024/
│   │   ├── 10-Octubre/
│   │   │   └── Dashboard_Auditorias_LaGuajira_Departamental.pbix    <-- Modelos analíticos .PBIX
│   │   └── 09-Septiembre/
│
└── Presentaciones_Gerencia/
    ├── 2024/
    │   ├── 10-Octubre/
    │   │   └── Comite_Operaciones_LaGuajira_W42.pptx  <-- Presentaciones PowerPoint
    │   └── 09-Septiembre/

FORMATOS COMPATIBLES LEÍDOS POR CAVI:
- Excel: .xlsx, .xls, .xlsm, .csv (Lectura de hojas, tablas de paradas y sincronización a rutas en vivo)
- PowerPoint: .pptx, .ppt (Lectura de diapositivas, notas de orador y agenda)
- Power BI: .pbix, .pbit (Esquema de entidades, métricas DAX e indicadores)
- Word: .docx, .doc (Actas de inspección, no conformidades y resúmenes)
- PDF: .pdf (Documentos oficiales, certificados e informes consolidados)
`;
    const blob = new Blob([guideContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CAVI_Estructura_Carpetas_Guia.txt';
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Guía Descargada', 'Se descargó el manual de organización de macro-carpetas.', 'info');
  };

  const getBadgeStyle = (type: SupportedFileType) => {
    switch (type) {
      case 'excel':
        return { bg: 'bg-[#003824]/60', text: 'text-[#4edea3]', border: 'border-[#4edea3]/40', icon: 'table_chart' };
      case 'powerpoint':
        return { bg: 'bg-[#523200]/60', text: 'text-[#ffb95f]', border: 'border-[#ffb95f]/40', icon: 'co_present' };
      case 'powerbi':
        return { bg: 'bg-[#472a00]/60', text: 'text-[#ffb95f]', border: 'border-[#ffb95f]/40', icon: 'analytics' };
      case 'word':
        return { bg: 'bg-[#1000a9]/25', text: 'text-[#c0c1ff]', border: 'border-[#c0c1ff]/40', icon: 'article' };
      case 'pdf':
        return { bg: 'bg-[#690005]/40', text: 'text-[#ffb4ab]', border: 'border-[#ffb4ab]/40', icon: 'picture_as_pdf' };
      default:
        return { bg: 'bg-[#222a3d]', text: 'text-[#bbcabf]', border: 'border-[#222a3d]', icon: 'draft' };
    }
  };

  return (
    <div className="flex flex-col w-full space-y-4 md:space-y-5">
      {/* Hidden inputs for folder and file selection */}
      <input
        type="file"
        ref={folderInputRef}
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleFolderUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept=".xlsx,.xls,.xlsm,.csv,.pptx,.ppt,.pbix,.docx,.doc,.pdf"
        onChange={handleFolderUpload}
        className="hidden"
      />

      {/* TOP CONFIGURATION & REGIONAL NETWORK HEADER */}
      <div className="flex flex-col gap-3 bg-[#131b2e] p-4 sm:p-5 rounded-2xl border border-[#222a3d] shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#4edea3] shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[26px]">settings</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-headline font-black text-lg md:text-xl text-[#dae2fd] tracking-tight">
                  Configuración del Sistema & Alimentador de Macros
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] text-[11px] font-bold border border-[#4edea3]/30 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                  Motor Lector Activo
                </span>
              </div>
              <p className="text-xs text-[#bbcabf] mt-1 max-w-2xl leading-relaxed">
                Gestión de parámetros operativos, ámbito de red y alimentador jerárquico de <strong>Macro-carpetas</strong> (ej. <em>Rutas, Auditorías, Indicadores, Presentaciones</em>), desglosadas por <strong>Años</strong> y <strong>Meses</strong>.
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center shrink-0">
            <button
              onClick={() => folderInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">drive_folder_upload</span>
              <span>{isProcessing ? 'Procesando...' : 'Cargar Carpeta de tu PC'}</span>
            </button>

            <button
              onClick={handleDownloadStructureGuide}
              className="px-3 py-2 rounded-xl bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] text-xs font-semibold flex items-center gap-1.5 border border-[#222a3d] transition-all"
              title="Descargar guía de organización de carpetas"
            >
              <span className="material-symbols-outlined text-[16px]">help_outline</span>
              <span className="hidden sm:inline">Guía de Estructura</span>
            </button>
          </div>
        </div>

        {/* SETTINGS PARAMETER: REGIONAL NETWORK BANNER */}
        <div className="mt-2 p-3 rounded-xl bg-[#171f33] border border-[#222a3d] flex flex-col md:flex-row md:items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-[#3131c0]/25 text-[#c0c1ff] border border-[#3131c0]/40 shrink-0">
              <span className="material-symbols-outlined text-[20px]">lan</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#dae2fd]">Red Activa del Sistema:</span>
                <span className="px-2 py-0.5 rounded-full bg-[#003824] text-[#4edea3] text-[11px] font-bold border border-[#4edea3]/40 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
                  Departamental (Exclusiva)
                </span>
                <span className="text-[11px] text-[#c0c1ff] font-semibold">
                  Departamento de La Guajira
                </span>
              </div>
              <p className="text-[11px] text-[#bbcabf] mt-0.5">
                La telemetría, auditorías y hojas de ruta aplican exclusivamente a los 15 municipios de La Guajira (Riohacha, Maicao, Uribia, Manaure, San Juan del Cesar, Fonseca, Barrancas, etc.).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-center flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-[#222a3d] text-[11px] text-[#dae2fd] font-medium border border-[#222a3d] whitespace-nowrap">
              15 Municipios
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#222a3d] text-[11px] text-[#4edea3] font-bold border border-[#222a3d] whitespace-nowrap">
              100% Departamental
            </span>
          </div>
        </div>
      </div>

      {/* CONFIGURATION MODULE: REPORT EXPORT (MOVED FROM DASHBOARD) */}
      <div className="bg-[#131b2e] p-4 sm:p-5 rounded-2xl border border-[#222a3d] shadow-sm overflow-hidden mb-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#4edea3]/20 flex items-center justify-center text-[#4edea3] border border-[#4edea3]/30 shrink-0">
            <span className="material-symbols-outlined text-[20px]">table_view</span>
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="font-headline font-bold text-sm text-[#dae2fd]">
              Exportación de Reportes Ejecutivos
            </h2>
            <p className="text-[11px] text-[#bbcabf]">Descarga el consolidado oficial con dinámicas integradas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-[#171f33] rounded-xl p-3 flex flex-col border border-[#222a3d]">
            <label className="text-[11px] text-[#bbcabf] font-semibold mb-1">Período de Reporte</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-sm text-[#dae2fd] focus:outline-none w-full cursor-pointer appearance-none"
            >
              <option value="Semana Actual" className="bg-[#131b2e]">Semana Actual (42)</option>
              <option value="Semana Anterior" className="bg-[#131b2e]">Semana Anterior (41)</option>
              <option value="Mes Octubre" className="bg-[#131b2e]">Mes Octubre</option>
              <option value="Q3 Completo" className="bg-[#131b2e]">Q3 Completo</option>
            </select>
          </div>

          <div className="bg-[#171f33] rounded-xl p-3 flex flex-col border border-[#222a3d]">
            <label className="text-[11px] text-[#bbcabf] font-semibold mb-1">Filtro de Auditores</label>
            <select
              value={selectedAuditors}
              onChange={(e) => setSelectedAuditors(e.target.value)}
              className="bg-transparent text-sm text-[#dae2fd] focus:outline-none w-full cursor-pointer appearance-none"
            >
              <option value="Todos (3)" className="bg-[#131b2e]">Todos (3)</option>
              <option value="Samuel Ramos" className="bg-[#131b2e]">Samuel Ramos</option>
              <option value="Kleyder Rodriguez" className="bg-[#131b2e]">Kleyder Rodriguez</option>
              <option value="Jose Aponte" className="bg-[#131b2e]">Jose Aponte</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleDownloadExcel()}
          disabled={isExporting}
          className="w-full h-12 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#ffffff] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
              <span>Generando Consolidado XLSX...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">download</span>
              <span>Descargar Consolidado Oficial (.XLSX)</span>
            </>
          )}
        </button>
      </div>

      {/* CONFIGURATION MODULE 1: SELECTOR DE TEMA (MODO OSCURO / CLARO) */}
      <div className="bg-[#131b2e] p-4 sm:p-5 rounded-2xl border border-[#222a3d] shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-[#3131c0]/20 flex items-center justify-center text-[#c0c1ff] border border-[#3131c0]/40 shrink-0">
              <span className="material-symbols-outlined text-[20px]">palette</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-[#dae2fd]">
                Tema Visual & Apariencia de la Plataforma
              </h2>
              <p className="text-[11px] text-[#bbcabf]">
                Ajusta la paleta visual para visualización táctica nocturna o de alto contraste diurno
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
            <span className="text-xs text-[#bbcabf]">Tema en uso:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#171f33] border border-[#222a3d] text-[#dae2fd]">
              {theme === 'dark' ? 'Modo Oscuro (Nocturno)' : 'Modo Claro (Diurno)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => {
              if (theme !== 'dark' && onToggleTheme) onToggleTheme();
            }}
            className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#171f33] border-[#4edea3] shadow-[0_0_15px_rgba(78,222,163,0.15)] ring-1 ring-[#4edea3]/50'
                : 'bg-[#131b2e] border-[#222a3d] hover:border-[#cbd5e1] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0b1326] flex items-center justify-center text-[#ffb95f] border border-[#222a3d]">
                <span className="material-symbols-outlined text-[22px]">dark_mode</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#dae2fd]">Modo Oscuro</p>
                <p className="text-[11px] text-[#bbcabf]">Táctico nocturno / descanso visual</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
              theme === 'dark'
                ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40'
                : 'bg-[#222a3d] text-[#bbcabf]'
            }`}>
              {theme === 'dark' ? '✓ Activo' : 'Seleccionar'}
            </span>
          </button>

          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => {
              if (theme !== 'light' && onToggleTheme) onToggleTheme();
            }}
            className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-[#ffffff] border-[#059669] shadow-[0_0_15px_rgba(5,150,105,0.15)] ring-1 ring-[#059669]/50'
                : 'bg-[#131b2e] border-[#222a3d] hover:border-[#4edea3]/50 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f4f6fb] flex items-center justify-center text-[#0284c7] border border-[#cbd5e1]">
                <span className="material-symbols-outlined text-[22px]">light_mode</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#dae2fd]">Modo Claro</p>
                <p className="text-[11px] text-[#bbcabf]">Alto contraste diurno para luz solar</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
              theme === 'light'
                ? 'bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]'
                : 'bg-[#222a3d] text-[#bbcabf]'
            }`}>
              {theme === 'light' ? '✓ Activo' : 'Seleccionar'}
            </span>
          </button>
        </div>
      </div>

      {/* CONFIGURATION MODULE 2: SENSOR & CHECK-IN QR */}
      <div className="bg-[#131b2e] p-4 sm:p-5 rounded-2xl border border-[#222a3d] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4edea3]/15 flex items-center justify-center text-[#4edea3] border border-[#4edea3]/30">
              <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-[#dae2fd]">
                  Módulo de Campo: Sensor & Check-in QR
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#4edea3] text-[10px] font-bold border border-[#4edea3]/30">
                  Enlace Óptico Activo
                </span>
              </div>
              <p className="text-[11px] text-[#bbcabf]">
                Escaneo y verificación de presencia física en puntos de auditoría departamentales (Riohacha, Maicao, etc.)
              </p>
            </div>
          </div>

          {/* Primary Scanner Trigger Button */}
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-4 py-2.5 rounded-xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all self-start lg:self-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              <span>Abrir Escáner de Cámara QR</span>
            </button>
          )}
        </div>

        {/* Quick validation & manual code entry simulator */}
        <div className="p-3.5 rounded-xl bg-[#171f33] border border-[#222a3d] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#dae2fd] mb-1">
              Validación Directa de Punto de Control (QR Manual / Simulador)
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-[11px] text-[#bbcabf]">Puntos rápidos:</span>
              {['CM-108 (Riohacha)', 'PF-042 (Maicao)', 'CDA-04 (Riohacha)', 'CM-88 (Fonseca)'].map((p) => {
                const code = p.split(' ')[0];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      if (onManualCheckIn) {
                        onManualCheckIn(code, p);
                      } else {
                        onShowToast('Check-in Realizado', `${p} auditado correctamente`, 'success');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-xs text-[#dae2fd] font-medium border border-[#222a3d] hover:border-[#4edea3]/40 transition-all cursor-pointer"
                  >
                    + {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Código QR (ej. CM-108)"
              value={manualQrCode}
              onChange={(e) => setManualQrCode(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#131b2e] border border-[#222a3d] text-xs text-[#dae2fd] focus:outline-none focus:border-[#4edea3] w-36 sm:w-44"
            />
            <button
              type="button"
              onClick={() => {
                if (!manualQrCode.trim()) {
                  onShowToast('Código requerido', 'Ingresa un código de punto (ej. CM-108)', 'warning');
                  return;
                }
                const code = manualQrCode.trim().toUpperCase();
                if (onManualCheckIn) {
                  onManualCheckIn(code, `Punto Auditado ${code}`);
                } else {
                  onShowToast('Check-in Exitoso', `Punto ${code} verificado`, 'success');
                }
                setManualQrCode('');
              }}
              className="px-3 py-1.5 rounded-lg bg-[#10b981] text-[#ffffff] text-xs font-bold hover:bg-[#059669] transition-all cursor-pointer"
            >
              Validar
            </button>
          </div>
        </div>
      </div>

      {/* STATS & QUICK TELEMETRY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#222a3d] shadow-sm">
          <p className="text-[11px] text-[#bbcabf] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#4edea3]">folder_special</span>
            Macro-Carpetas
          </p>
          <p className="text-xl font-headline font-black text-[#dae2fd] mt-1">4 Principales</p>
          <p className="text-[10px] text-[#bbcabf] mt-0.5">Rutas, Auditorías, BI, PPT</p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#222a3d] shadow-sm">
          <p className="text-[11px] text-[#bbcabf] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#38bdf8]">calendar_month</span>
            Años / Meses
          </p>
          <p className="text-xl font-headline font-black text-[#38bdf8] mt-1">{availableYears.length} Años • {availableMonths.length} Meses</p>
          <p className="text-[10px] text-[#4edea3] mt-0.5 font-medium">10-Octubre Activo</p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#222a3d] shadow-sm">
          <p className="text-[11px] text-[#bbcabf] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#ffb95f]">file_copy</span>
            Archivos Indexados
          </p>
          <p className="text-xl font-headline font-black text-[#dae2fd] mt-1">{files.length} Archivos</p>
          <p className="text-[10px] text-[#bbcabf] mt-0.5">Excel, PPTX, PBIX, DOCX, PDF</p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#222a3d] shadow-sm">
          <p className="text-[11px] text-[#bbcabf] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#c084fc]">alt_route</span>
            Fuente de Rutas
          </p>
          <p className="text-sm font-bold text-[#dae2fd] truncate mt-1.5" title={activeRouteSourceFile}>
            {activeRouteSourceFile || 'Rutas_Semana42_LaGuajira_Departamental.xlsx'}
          </p>
          <p className="text-[10px] text-[#4edea3] mt-0.5 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
            Sincronizado a CAVI
          </p>
        </div>
      </div>

      {/* DRAG & DROP ZONE */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => folderInputRef.current?.click()}
        className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
          isDraggingOver
            ? 'border-[#4edea3] bg-[#4edea3]/10 scale-[1.01]'
            : 'border-[#2d3449] bg-[#131b2e]/60 hover:border-[#4edea3]/60 hover:bg-[#131b2e]'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-[#171f33] border border-[#222a3d] flex items-center justify-center text-[#4edea3]">
          <span className="material-symbols-outlined text-[28px]">
            {isDraggingOver ? 'file_download' : 'cloud_upload'}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-[#dae2fd]">
            Arrastra tu Carpeta de Macros aquí o haz clic para seleccionarla
          </p>
          <p className="text-xs text-[#bbcabf] mt-0.5">
            Lee automáticamente subcarpetas de <strong>Años</strong> (2024, 2023...) y <strong>Meses</strong> (10-Octubre, 09-Septiembre...)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
          <span className="px-2 py-0.5 rounded bg-[#003824] text-[#4edea3] text-[10px] font-bold border border-[#4edea3]/30">Excel .xlsx / .csv</span>
          <span className="px-2 py-0.5 rounded bg-[#523200] text-[#ffb95f] text-[10px] font-bold border border-[#ffb95f]/30">PowerPoint .pptx</span>
          <span className="px-2 py-0.5 rounded bg-[#472a00] text-[#ffb95f] text-[10px] font-bold border border-[#ffb95f]/30">Power BI .pbix</span>
          <span className="px-2 py-0.5 rounded bg-[#1000a9]/30 text-[#c0c1ff] text-[10px] font-bold border border-[#c0c1ff]/30">Word .docx</span>
          <span className="px-2 py-0.5 rounded bg-[#690005]/40 text-[#ffb4ab] text-[10px] font-bold border border-[#ffb4ab]/30">PDF .pdf</span>
        </div>
      </div>

      {/* MACRO FOLDERS SELECTOR TABS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#bbcabf] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-[#4edea3]">folder_open</span>
            Macro-Carpetas Registradas
          </h2>
          <span className="text-[11px] text-[#bbcabf]">Filtrar por macro</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Option: All */}
          <button
            onClick={() => setSelectedMacroFolder('all')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              selectedMacroFolder === 'all'
                ? 'bg-[#3131c0]/25 border-[#3131c0] shadow-sm'
                : 'bg-[#131b2e] border-[#222a3d] hover:bg-[#171f33]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-[#c0c1ff] text-[20px]">dataset</span>
              <span className="text-[11px] font-bold text-[#dae2fd]">{files.length}</span>
            </div>
            <p className="text-xs font-bold text-[#dae2fd] mt-2">Todas las Macros</p>
            <p className="text-[10px] text-[#bbcabf] truncate">Repositorio completo</p>
          </button>

          {/* Defined Macros */}
          {MACRO_FOLDERS_DEFINITIONS.map((mf) => {
            const count = files.filter((f) => f.macroFolder.toLowerCase() === mf.name.toLowerCase()).length;
            const isSelected = selectedMacroFolder.toLowerCase() === mf.name.toLowerCase();

            return (
              <button
                key={mf.id}
                onClick={() => setSelectedMacroFolder(mf.name)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#171f33] border-[#4edea3] shadow-md ring-1 ring-[#4edea3]/50'
                    : 'bg-[#131b2e] border-[#222a3d] hover:bg-[#171f33]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-[22px]" style={{ color: mf.color }}>
                    {mf.icon}
                  </span>
                  <span className="text-[11px] font-bold text-[#dae2fd] bg-[#171f33] px-1.5 py-0.5 rounded border border-[#222a3d]">
                    {count}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#dae2fd] mt-2 truncate">{mf.label}</p>
                <p className="text-[10px] text-[#bbcabf] truncate font-mono">📁 /{mf.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER BAR: YEAR, MONTH, TYPE & SEARCH */}
      <div className="bg-[#131b2e] p-3.5 rounded-xl border border-[#222a3d] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Breadcrumb / Status */}
          <div className="flex items-center gap-1.5 text-xs text-[#bbcabf] flex-wrap">
            <span className="material-symbols-outlined text-[16px] text-[#4edea3]">home_storage</span>
            <span>Carpeta Madre</span>
            <span>/</span>
            <strong className="text-[#dae2fd]">
              {selectedMacroFolder === 'all' ? 'Todas las Macros' : selectedMacroFolder}
            </strong>
            {selectedYear !== 'all' && (
              <>
                <span>/</span>
                <span className="px-1.5 py-0.5 rounded bg-[#171f33] text-[#dae2fd] font-bold">{selectedYear}</span>
              </>
            )}
            {selectedMonth !== 'all' && (
              <>
                <span>/</span>
                <span className="px-1.5 py-0.5 rounded bg-[#171f33] text-[#4edea3] font-bold">{selectedMonth}</span>
              </>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#bbcabf]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o contenido..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#171f33] border border-[#222a3d] text-xs text-[#dae2fd] placeholder-[#bbcabf]/60 focus:outline-none focus:border-[#4edea3]"
            />
          </div>
        </div>

        {/* Dropdown filters for Year, Month, Type */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#222a3d] text-xs">
          {/* Year Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[#bbcabf] text-[11px] font-medium">Año:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#171f33] border border-[#222a3d] text-xs text-[#dae2fd] focus:outline-none focus:border-[#4edea3]"
            >
              <option value="all">Todos los Años</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[#bbcabf] text-[11px] font-medium">Mes:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#171f33] border border-[#222a3d] text-xs text-[#dae2fd] focus:outline-none focus:border-[#4edea3]"
            >
              <option value="all">Todos los Meses</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* File Type Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[#bbcabf] text-[11px] font-medium">Formato:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as SupportedFileType | 'all')}
              className="px-2.5 py-1 rounded-lg bg-[#171f33] border border-[#222a3d] text-xs text-[#dae2fd] focus:outline-none focus:border-[#4edea3]"
            >
              <option value="all">Todos los Formatos</option>
              <option value="excel">Excel (.xlsx, .csv)</option>
              <option value="powerpoint">PowerPoint (.pptx)</option>
              <option value="powerbi">Power BI (.pbix)</option>
              <option value="word">Word (.docx)</option>
              <option value="pdf">PDF (.pdf)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(selectedMacroFolder !== 'all' || selectedYear !== 'all' || selectedMonth !== 'all' || selectedType !== 'all' || searchQuery !== '') && (
            <button
              onClick={() => {
                setSelectedMacroFolder('all');
                setSelectedYear('all');
                setSelectedMonth('all');
                setSelectedType('all');
                setSearchQuery('');
              }}
              className="px-2 py-1 rounded-lg text-xs text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#171f33] transition-colors ml-auto flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">filter_alt_off</span>
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* FILES LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-headline font-bold text-sm text-[#dae2fd]">
              Archivos Encontrados ({filteredFiles.length})
            </h3>
            {activeRouteSourceFile && (
              <span className="px-2 py-0.5 rounded bg-[#003824] text-[#4edea3] text-[10px] font-bold border border-[#4edea3]/30 hidden sm:inline">
                Alimentando: {activeRouteSourceFile}
              </span>
            )}
          </div>
          <span className="text-xs text-[#bbcabf]">
            Haz clic en un archivo para abrir y leer su contenido
          </span>
        </div>

        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFiles.map((file) => {
              const badge = getBadgeStyle(file.type);
              const isActiveSource = activeRouteSourceFile === file.name;

              return (
                <div
                  key={file.id}
                  className={`p-4 rounded-2xl bg-[#131b2e] border transition-all flex flex-col justify-between gap-3 shadow-sm hover:shadow-md ${
                    isActiveSource
                      ? 'border-[#4edea3] ring-1 ring-[#4edea3]/40'
                      : 'border-[#222a3d] hover:border-[#2d3449]'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header with Type badge, path and size */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${badge.bg} ${badge.border}`}>
                          <span className={`material-symbols-outlined text-[20px] ${badge.text}`}>
                            {badge.icon}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-[#dae2fd] truncate" title={file.name}>
                            {file.name}
                          </h4>
                          <p className="text-[11px] text-[#bbcabf] font-mono truncate">
                            📁 {file.path}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badge.bg} ${badge.text} ${badge.border}`}>
                          .{file.extension}
                        </span>
                        <span className="text-[11px] text-[#bbcabf] font-mono">
                          {file.sizeFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Summary / Extracted Info */}
                    <p className="text-xs text-[#bbcabf] line-clamp-2 leading-relaxed">
                      {file.summary}
                    </p>

                    {/* Micro tags */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-[#171f33] text-[#dae2fd] font-semibold border border-[#222a3d]">
                        {file.year}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#171f33] text-[#4edea3] font-semibold border border-[#222a3d]">
                        {file.month}
                      </span>
                      {file.sheets && (
                        <span className="px-2 py-0.5 rounded bg-[#003824]/40 text-[#4edea3] font-bold border border-[#4edea3]/20">
                          {file.sheets.length} hoja(s) leída(s)
                        </span>
                      )}
                      {file.extractedMeta?.recordsCount && (
                        <span className="px-2 py-0.5 rounded bg-[#171f33] text-[#bbcabf] border border-[#222a3d]">
                          {file.extractedMeta.recordsCount} registros
                        </span>
                      )}
                      {file.extractedMeta?.slidesCount && (
                        <span className="px-2 py-0.5 rounded bg-[#523200]/40 text-[#ffb95f] font-bold border border-[#ffb95f]/20">
                          {file.extractedMeta.slidesCount} diapositivas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#222a3d] text-xs">
                    <span className="text-[10px] text-[#bbcabf] truncate">
                      Modificado: {file.lastModified}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {file.type === 'excel' && (
                        <button
                          onClick={() => {
                            onInjectRoutes(file);
                            onShowToast(
                              'Datos de Ruta Alimentados',
                              `Las paradas de "${file.name}" se cargaron en el plan de campo.`,
                              'success'
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            isActiveSource
                              ? 'bg-[#003824] text-[#4edea3] border border-[#4edea3]/40'
                              : 'bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824]'
                          }`}
                          title="Alimentar rutas y paradas activas con este archivo"
                        >
                          <span className="material-symbols-outlined text-[14px]">sync</span>
                          <span>{isActiveSource ? 'Activo' : 'Alimentar'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActiveFileForViewer(file)}
                        className="px-3 py-1 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-[#dae2fd] text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        <span>Abrir y Leer</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-[#131b2e] border border-[#222a3d] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#171f33] border border-[#222a3d] flex items-center justify-center text-[#bbcabf] mx-auto">
              <span className="material-symbols-outlined text-[28px]">search_off</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#dae2fd]">No se encontraron archivos</h4>
              <p className="text-xs text-[#bbcabf] max-w-sm mx-auto mt-1">
                No hay archivos que coincidan con los filtros seleccionados de macro-carpeta, año, mes o búsqueda.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedMacroFolder('all');
                setSelectedYear('all');
                setSelectedMonth('all');
                setSelectedType('all');
                setSearchQuery('');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-[#dae2fd]"
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </div>

      {/* FILE VIEWER MODAL */}
      <FileViewerModal
        file={activeFileForViewer}
        onClose={() => setActiveFileForViewer(null)}
        onInjectRoutes={onInjectRoutes}
        onShowToast={onShowToast}
      />
    </div>
  );
};
