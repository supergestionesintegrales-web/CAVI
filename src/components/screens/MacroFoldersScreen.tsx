import React, { useState, useRef, useEffect } from 'react';
import { MacroFile, SupportedFileType, UserRole, RouteStep, Auditor } from '../../types';
import { MACRO_FOLDERS_DEFINITIONS, parseUploadedDirectoryFiles } from '../../data/macroFoldersData';
import { FileViewerModal } from '../FileViewerModal';
import { ConfigTopSlider, ConfigSectionId } from '../macro/ConfigTopSlider';
import { ProcessingProgressBar, UploadProgressState } from '../macro/ProcessingProgressBar';

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
  userRole?: UserRole;
  routeSteps?: RouteStep[];
  auditors?: Auditor[];
}

export interface FieldCheckInItem {
  id: string;
  code: string;
  pointName: string;
  municipio: string;
  timestamp: string;
  type: 'Sensor Óptico QR' | 'Check-in Manual' | 'Telemetría GPS';
  status: 'Verificado' | 'En Ruta' | 'Conforme';
  auditor: string;
}

export interface MunicipioGuajira {
  name: string;
  subregion: 'Alta Guajira' | 'Media Guajira' | 'Sur de La Guajira';
  sla: number;
  pointsCount: number;
  status: 'Operativo' | 'En Ruta' | 'Verificado';
}

export const MUNICIPIOS_GUAJIRA: MunicipioGuajira[] = [
  { name: 'Riohacha', subregion: 'Media Guajira', sla: 98, pointsCount: 4, status: 'Verificado' },
  { name: 'Maicao', subregion: 'Media Guajira', sla: 94, pointsCount: 3, status: 'En Ruta' },
  { name: 'Uribia', subregion: 'Alta Guajira', sla: 92, pointsCount: 2, status: 'En Ruta' },
  { name: 'Manaure', subregion: 'Alta Guajira', sla: 96, pointsCount: 2, status: 'Verificado' },
  { name: 'San Juan del Cesar', subregion: 'Sur de La Guajira', sla: 100, pointsCount: 2, status: 'Verificado' },
  { name: 'Fonseca', subregion: 'Sur de La Guajira', sla: 95, pointsCount: 2, status: 'En Ruta' },
  { name: 'Barrancas', subregion: 'Sur de La Guajira', sla: 100, pointsCount: 2, status: 'Verificado' },
  { name: 'Dibulla', subregion: 'Media Guajira', sla: 97, pointsCount: 1, status: 'Verificado' },
  { name: 'Albania', subregion: 'Media Guajira', sla: 95, pointsCount: 1, status: 'Verificado' },
  { name: 'Hatonuevo', subregion: 'Sur de La Guajira', sla: 98, pointsCount: 1, status: 'Verificado' },
  { name: 'Distracción', subregion: 'Sur de La Guajira', sla: 100, pointsCount: 1, status: 'Verificado' },
  { name: 'El Molino', subregion: 'Sur de La Guajira', sla: 99, pointsCount: 1, status: 'Verificado' },
  { name: 'Villanueva', subregion: 'Sur de La Guajira', sla: 100, pointsCount: 2, status: 'Verificado' },
  { name: 'Urumita', subregion: 'Sur de La Guajira', sla: 98, pointsCount: 1, status: 'Verificado' },
  { name: 'La Jagua del Pilar', subregion: 'Sur de La Guajira', sla: 100, pointsCount: 1, status: 'Verificado' },
];

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
  userRole = 'administrador',
  routeSteps = [],
  auditors = [],
}) => {
  const isAuxiliar = userRole === 'auxiliar';

  // Upper Slider Active Section (Default: 'tema-vial' for Auxiliar, 'macros' for Admin)
  const [activeConfigSection, setActiveConfigSection] = useState<ConfigSectionId>(
    isAuxiliar ? 'tema-vial' : 'macros'
  );

  // Sync activeConfigSection if user switches roles
  useEffect(() => {
    if (isAuxiliar && activeConfigSection === 'macros') {
      setActiveConfigSection('tema-vial');
    }
  }, [isAuxiliar, activeConfigSection]);

  // Filter & Search states for files
  const [selectedMacroFolder, setSelectedMacroFolder] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<SupportedFileType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [manualQrCode, setManualQrCode] = useState<string>('');
  const [activeFileForViewer, setActiveFileForViewer] = useState<MacroFile | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Loading & Processing Bar State
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({
    isActive: false,
    isComplete: false,
    percent: 0,
    current: 0,
    total: 0,
    fileName: '',
    stage: '',
  });

  // Report Export & Unified Operaciones State
  const [selectedPeriod, setSelectedPeriod] = useState('Semana Actual');
  const [selectedAuditors, setSelectedAuditors] = useState('Todos (3)');
  const [isExporting, setIsExporting] = useState(false);
  const [includeQrCheckIns, setIncludeQrCheckIns] = useState(true);
  const [includeRedGuajira, setIncludeRedGuajira] = useState(true);
  const [includeSlaMetrics, setIncludeSlaMetrics] = useState(true);
  const [filterMunicipio, setFilterMunicipio] = useState<string>('all');

  // Real-time Check-ins List (Unified with QR Sensor and XLSX export)
  const [checkInsList, setCheckInsList] = useState<FieldCheckInItem[]>([
    {
      id: 'chk-1',
      code: 'CM-108',
      pointName: 'Riohacha Centro Comercial',
      municipio: 'Riohacha',
      timestamp: '08:42 AM',
      type: 'Sensor Óptico QR',
      status: 'Verificado',
      auditor: 'Samuel Ramos Quintero',
    },
    {
      id: 'chk-2',
      code: 'PF-042',
      pointName: 'Maicao Frontera Plaza',
      municipio: 'Maicao',
      timestamp: '10:15 AM',
      type: 'Sensor Óptico QR',
      status: 'Verificado',
      auditor: 'Kleyder Rodriguez',
    },
    {
      id: 'chk-3',
      code: 'CDA-04',
      pointName: 'Centro Acopio Riohacha Portuario',
      municipio: 'Riohacha',
      timestamp: '11:30 AM',
      type: 'Sensor Óptico QR',
      status: 'Verificado',
      auditor: 'Samuel Ramos Quintero',
    },
    {
      id: 'chk-4',
      code: 'CM-88',
      pointName: 'Fonseca Plaza Express',
      municipio: 'Fonseca',
      timestamp: '01:10 PM',
      type: 'Telemetría GPS',
      status: 'En Ruta',
      auditor: 'Jose Aponte',
    },
    {
      id: 'chk-5',
      code: 'CDA-33',
      pointName: 'CDA Minero Barrancas - Cerrejón',
      municipio: 'Barrancas',
      timestamp: '02:25 PM',
      type: 'Sensor Óptico QR',
      status: 'Conforme',
      auditor: 'Jose Aponte',
    },
  ]);

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

  // Unified File Processing with Real-time Progress Bar
  const processFilesWithProgress = async (fileList: File[], sourceLabel: 'Carpeta' | 'Archivos Sueltos' | 'Arrastre') => {
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    setUploadProgress({
      isActive: true,
      isComplete: false,
      percent: 5,
      current: 1,
      total: fileList.length,
      fileName: fileList[0]?.name || '',
      stage: `Iniciando cargue y análisis de ${fileList.length} archivo(s)...`,
    });

    try {
      const parsed = await parseUploadedDirectoryFiles(
        fileList,
        (info) => {
          setUploadProgress({
            isActive: true,
            isComplete: info.percent >= 100,
            percent: info.percent,
            current: info.current,
            total: info.total,
            fileName: info.fileName,
            stage: info.stage,
          });
        },
        selectedMacroFolder
      );

      if (parsed.length > 0) {
        onAddFiles(parsed);
        setUploadProgress((prev) => ({
          ...prev,
          percent: 100,
          isComplete: true,
          stage: `✓ Indexación finalizada: ${parsed.length} archivo(s) agregados al repositorio de La Guajira.`,
        }));
        onShowToast(
          `${sourceLabel} Procesado(s)`,
          `Se indexaron ${parsed.length} archivo(s) exitosamente con metadatos y hojas de ruta.`,
          'success'
        );
      } else {
        setUploadProgress((prev) => ({
          ...prev,
          percent: 100,
          isComplete: true,
          stage: 'No se encontraron archivos compatibles en la selección.',
        }));
        onShowToast('Sin archivos válidos', 'No se encontraron archivos compatibles (.xlsx, .csv, .pptx, .pbix, .docx, .pdf).', 'alert');
      }
    } catch (err) {
      console.error(err);
      setUploadProgress((prev) => ({
        ...prev,
        percent: 100,
        isComplete: true,
        stage: 'Ocurrió un inconveniente al procesar los archivos.',
      }));
      onShowToast('Error al procesar', 'Ocurrió un inconveniente procesando los archivos.', 'alert');
    } finally {
      setIsProcessing(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 1. Directory Picker Upload
  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files) as File[];
    processFilesWithProgress(fileList, 'Carpeta');
  };

  // 2. Standalone Single/Multiple Files Upload
  const handleSingleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files) as File[];
    processFilesWithProgress(fileList, 'Archivos Sueltos');
  };

  // 3. Drag and Drop Handler (accepts folders and standalone files)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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
      processFilesWithProgress(fileList, 'Arrastre');
    }
  };

  const handleQuickCheckIn = (code: string, pointName: string) => {
    const matchedMuni =
      MUNICIPIOS_GUAJIRA.find((m) => pointName.toLowerCase().includes(m.name.toLowerCase()))?.name || 'Riohacha';
    const newCheckIn: FieldCheckInItem = {
      id: `chk-${Date.now()}`,
      code,
      pointName,
      municipio: matchedMuni,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'Sensor Óptico QR',
      status: 'Verificado',
      auditor: selectedAuditors === 'Todos (3)' ? 'Samuel Ramos Quintero' : selectedAuditors,
    };

    setCheckInsList((prev) => [newCheckIn, ...prev]);
    if (onManualCheckIn) {
      onManualCheckIn(code, pointName);
    }
    onShowToast('Punto Validado y Registrado', `${pointName} (${code}) validado y añadido al reporte XLSX`, 'success');
  };

  const handleDownloadExcel = (customPeriod?: string) => {
    setIsExporting(true);
    const period = customPeriod || selectedPeriod;

    setTimeout(() => {
      setIsExporting(false);
      const filename = `CAVI_Consolidado_Operativo_${period.replace(/\s+/g, '_')}_LaGuajira.xlsx`;

      // Build unified multi-section CSV/Excel spreadsheet
      let csvContent = '\uFEFF'; // UTF-8 BOM for Excel accented characters
      csvContent += 'sep=,\n';
      csvContent += '========================================================================================\n';
      csvContent += 'CAVI - SISTEMA DE CONTROL Y AUDITORIA VIAL INTEGRAL\n';
      csvContent += 'REPORTE CONSOLIDADO UNIFICADO: HOJAS DE RUTA, SENSOR QR Y RED DEPARTAMENTAL\n';
      csvContent += `PERIODO: ${period}, AUDITORES: ${selectedAuditors}, GENERADO: ${new Date().toLocaleString('es-CO')}\n`;
      csvContent += 'AMBITO OPERATIVO: 15 MUNICIPIOS DE LA GUAJIRA (100% COBERTURA DEPARTAMENTAL)\n';
      csvContent += '========================================================================================\n\n';

      // Section 1: Hojas de Ruta
      csvContent += '--- SECCION 1: HOJAS DE RUTA Y AUDITORIAS EN CAMPO ---\n';
      csvContent += 'ID_PUNTO,ESTABLECIMIENTO,FORMATO,MUNICIPIO_ZONA,DIRECCION,AUDITOR_ASIGNADO,ESTADO_VISITA,CUMPLIMIENTO_SLA,TIEMPO_TRASLADO_MIN,OBSERVACIONES\n';
      if (routeSteps.length > 0) {
        routeSteps.forEach((s) => {
          const auditorName = auditors.find((a) => a.id === s.auditorId)?.name || 'Samuel Ramos Quintero';
          const estado = s.status === 'completed' ? 'Completado' : s.status === 'in_progress' ? 'En curso' : 'Pendiente';
          csvContent += `"${s.code}","${s.name}","${s.format}","La Guajira","${s.address}","${auditorName}","${estado}","${s.sla || '100%'}","${s.time || '20 min'}","${s.notes || 'Auditoría en terreno'}"\n`;
        });
      } else {
        csvContent += '"CM-108","Riohacha Centro Comercial","CM","Riohacha (Norte)","Calle 15 #7-40","Samuel Ramos Quintero","Completado","100%","18","Check-in QR validado sin novedades"\n';
      }
      csvContent += '\n';

      // Section 2: Sensor & QR Check-ins
      if (includeQrCheckIns) {
        csvContent += '--- SECCION 2: TELEMETRIA Y CHECK-INS SENSOR QR EN TIEMPO REAL ---\n';
        csvContent += 'CODIGO_QR,PUNTO_AUDITADO,MUNICIPIO,HORA_REGISTRO,METODO_CAPTURA,AUDITOR,ESTADO_VALIDACION\n';
        checkInsList.forEach((chk) => {
          csvContent += `"${chk.code}","${chk.pointName}","${chk.municipio}","${chk.timestamp}","${chk.type}","${chk.auditor}","${chk.status}"\n`;
        });
        csvContent += '\n';
      }

      // Section 3: Red Guajira (15 Municipios)
      if (includeRedGuajira) {
        csvContent += '--- SECCION 3: RED DEPARTAMENTAL - LOS 15 MUNICIPIOS DE LA GUAJIRA ---\n';
        csvContent += 'MUNICIPIO,SUBREGION,PUNTOS_PROGRAMADOS,NIVEL_SLA,ESTADO_OPERATIVO,COBERTURA_RED\n';
        MUNICIPIOS_GUAJIRA.forEach((m) => {
          csvContent += `"${m.name}","${m.subregion}",${m.pointsCount},"${m.sla}%","${m.status}","100% Activa"\n`;
        });
        csvContent += '\n';
      }

      // Section 4: Resumen SLA Auditores
      if (includeSlaMetrics) {
        csvContent += '--- SECCION 4: RENDIMIENTO OPERATIVO Y SLA POR AUDITOR ---\n';
        csvContent += 'AUDITOR,PUNTOS_ASIGNADOS,PUNTOS_AUDITADOS,EFICIENCIA_SLA,TIEMPO_PROMEDIO_TRASLADO\n';
        if (auditors.length > 0) {
          auditors.forEach((aud) => {
            csvContent += `"${aud.name}",${aud.visitsTarget},${aud.visitsDone},"${aud.effectiveness}%","20 min"\n`;
          });
        } else {
          csvContent += 'Samuel Ramos Quintero,6,5,98.6%,21 min\n';
          csvContent += 'Kleyder Rodriguez,4,3,94.2%,23 min\n';
          csvContent += 'Jose Aponte,5,5,99.1%,19 min\n';
        }
      }

      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onShowToast(
        'Reporte XLSX Unificado Descargado',
        `Consolidado descargado con Hojas de Ruta, ${checkInsList.length} Check-ins QR y los 15 Municipios de La Guajira.`,
        'success'
      );
    }, 850);
  };

  const handleDownloadStructureGuide = () => {
    const guideContent = `# ESTRUCTURA DE MACRO-CARPETAS Y ARCHIVOS PARA CAVI
==================================================

CAVI admite dos modos de carga:
1) CARPETAS COMPLETAS: Organizadas por Macro-carpetas > Años > Meses
2) ARCHIVOS SUELTOS: Sube archivos individuales (.xlsx, .csv, .pptx, .pbix, .docx, .pdf) y CAVI los clasificará automáticamente según su tipo y nombre.

ORGANIZACIÓN POR CARPETA MADRE:
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

FORMATOS COMPATIBLES:
- Excel: .xlsx, .xls, .xlsm, .csv
- PowerPoint: .pptx, .ppt
- Power BI: .pbix, .pbit
- Word: .docx, .doc
- PDF: .pdf
`;
    const blob = new Blob([guideContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CAVI_Estructura_Carpetas_y_Archivos.txt';
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Guía Descargada', 'Se descargó el manual de organización de macro-carpetas y archivos.', 'info');
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

  const showMacros = !isAuxiliar && (activeConfigSection === 'macros' || activeConfigSection === 'todas');
  const showTemaVial = activeConfigSection === 'tema-vial' || activeConfigSection === 'todas';
  const showOperacionesReportes =
    activeConfigSection === 'reportes-operaciones' ||
    activeConfigSection === 'reportes' ||
    activeConfigSection === 'sensor-qr' ||
    activeConfigSection === 'red-parametros' ||
    activeConfigSection === 'todas';

  return (
    <div className="flex flex-col w-full space-y-4 md:space-y-5">
      {/* Role Notice Banner for Auxiliar in Configuration */}
      {isAuxiliar && (
        <div className="p-3 rounded-xl bg-[#171f33] border border-[#3131c0]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3131c0]/20 flex items-center justify-center text-[#c0c1ff] shrink-0">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#c0c1ff]">
                Configuración Operativa (Rol Auxiliar)
              </p>
              <p className="text-[11px] text-[#bbcabf]">
                Permisos activos: Cambio de Color (Tema Vial), Red Comercial La Guajira y Sensor de Campo.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#060e20] text-[#c0c1ff] text-[10px] font-semibold border border-[#3131c0]/30 self-start sm:self-auto shrink-0">
            Auditores de Campo (3 Activos)
          </span>
        </div>
      )}

      {/* Hidden File Inputs: Directory Picker & Standalone Files Picker */}
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
        accept=".xlsx,.xls,.xlsm,.csv,.pptx,.ppt,.pbix,.pbit,.docx,.doc,.pdf"
        onChange={handleSingleFilesUpload}
        className="hidden"
      />

      {/* 1. UPPER SLIDER CONTROLLER (SLIDER SUPERIOR PARA SEPARAR CADA SECCIÓN) */}
      <ConfigTopSlider
        activeSection={activeConfigSection}
        onSelectSection={setActiveConfigSection}
        filesCount={files.length}
        currentTheme={theme}
        userRole={userRole}
      />

      {/* GLOBAL PERSISTENT PROGRESS BAR (Visible whenever upload/processing is happening) */}
      <ProcessingProgressBar
        progress={uploadProgress}
        onDismiss={() => setUploadProgress((prev) => ({ ...prev, isActive: false, isComplete: false }))}
      />

      {/* =========================================================================
          SECTION A: TEMA VIAL & APARIENCIA DE LA PLATAFORMA (CAMBIO DE TEMA VIAL)
          ========================================================================= */}
      {showTemaVial && (
        <div className="bg-[#131b2e] p-4 sm:p-5 rounded-2xl border border-[#222a3d] shadow-sm overflow-hidden transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-[#3131c0]/20 flex items-center justify-center text-[#c0c1ff] border border-[#3131c0]/40 shrink-0">
                <span className="material-symbols-outlined text-[22px]">palette</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-[#dae2fd]">
                    Tema Vial &amp; Apariencia Operativa en Terreno
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#4edea3] text-[10px] font-bold border border-[#4edea3]/30">
                    Selector de Alto Rendimiento
                  </span>
                </div>
                <p className="text-xs text-[#bbcabf] mt-0.5">
                  Alterna la paleta visual según las condiciones de luminosidad en ruta vial: modo nocturno táctico o modo diurno de alto contraste para sol intenso.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
              <span className="text-xs text-[#bbcabf]">Tema activo:</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#171f33] border border-[#222a3d] text-[#dae2fd]">
                {theme === 'dark' ? '🌙 Modo Oscuro (Nocturno Táctico)' : '☀️ Modo Claro (Diurno / Vial)'}
              </span>
            </div>
          </div>

          {/* Theme Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => {
                if (theme !== 'dark' && onToggleTheme) onToggleTheme();
              }}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#171f33] border-[#4edea3] shadow-[0_0_20px_rgba(78,222,163,0.18)] ring-1 ring-[#4edea3]/60'
                  : 'bg-[#131b2e] border-[#222a3d] hover:border-[#cbd5e1] opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0b1326] flex items-center justify-center text-[#ffb95f] border border-[#222a3d] shadow-inner">
                  <span className="material-symbols-outlined text-[24px]">dark_mode</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#dae2fd]">Modo Oscuro (Nocturno)</p>
                  <p className="text-[11px] text-[#bbcabf] mt-0.5">Táctico para cabina vehicular y descanso visual en ruta</p>
                  <span className="text-[10px] text-[#4edea3] font-medium">Bajo consumo de batería OLED en campo</span>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                  theme === 'dark'
                    ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40'
                    : 'bg-[#222a3d] text-[#bbcabf]'
                }`}
              >
                {theme === 'dark' ? '✓ Activo' : 'Seleccionar'}
              </span>
            </button>

            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => {
                if (theme !== 'light' && onToggleTheme) onToggleTheme();
              }}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-[#ffffff] border-[#059669] shadow-[0_0_20px_rgba(5,150,105,0.2)] ring-1 ring-[#059669]/60'
                  : 'bg-[#131b2e] border-[#222a3d] hover:border-[#4edea3]/50 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#f4f6fb] flex items-center justify-center text-[#0284c7] border border-[#cbd5e1] shadow-inner">
                  <span className="material-symbols-outlined text-[24px]">light_mode</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#dae2fd]">Modo Claro (Diurno / Vial)</p>
                  <p className="text-[11px] text-[#bbcabf] mt-0.5">Alto contraste para luz solar directa en La Guajira</p>
                  <span className="text-[10px] text-[#0284c7] font-medium">Fácil lectura de señalética y hojas de ruta</span>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                  theme === 'light'
                    ? 'bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]'
                    : 'bg-[#222a3d] text-[#bbcabf]'
                }`}
              >
                {theme === 'light' ? '✓ Activo' : 'Seleccionar'}
              </span>
            </button>
          </div>

          {/* ROAD / FIELD SIMULATION BANNER */}
          <div className="p-3.5 rounded-xl bg-[#171f33] border border-[#222a3d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4edea3]/15 flex items-center justify-center text-[#4edea3]">
                <span className="material-symbols-outlined text-[18px]">alt_route</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#dae2fd]">
                  Simulación de Señalética Vial CAVI en Terreno
                </p>
                <p className="text-[11px] text-[#bbcabf]">
                  Visualizando paradas con tipografía optimizada para vibración vehicular y visión a media distancia.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[10px] font-mono text-[#4edea3]">
                Troncal del Caribe Km 14
              </span>
              <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[10px] font-mono text-[#dae2fd]">
                SLA: 45 min
              </span>
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-2.5 py-1 rounded-lg bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-[11px] font-bold transition-all cursor-pointer"
              >
                Alternar Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION B: ALIMENTADOR DE MACROS & ARCHIVOS (SUBIDA DE CARPETAS Y ARCHIVOS)
          ========================================================================= */}
      {showMacros && (
        <div className="space-y-4">
          {/* HEADER & UPLOAD ACTIONS BAR */}
          <div className="flex flex-col gap-3 bg-[#131b2e] p-4 sm:p-5 rounded-2xl border border-[#222a3d] shadow-sm overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-2xl bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#4edea3] shrink-0 shadow-inner">
                  <span className="material-symbols-outlined text-[26px]">folder_managed</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-headline font-black text-lg md:text-xl text-[#dae2fd] tracking-tight">
                      Alimentador de Macros &amp; Archivos del Sistema
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] text-[11px] font-bold border border-[#4edea3]/30 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                      Motor Lector CAVI Activo
                    </span>
                  </div>
                  <p className="text-xs text-[#bbcabf] mt-1 max-w-2xl leading-relaxed">
                    Sube <strong>carpetas completas</strong> estructuradas por <em>Año/Mes</em> o carga <strong>archivos sueltos individuales</strong> (.xlsx, .csv, .pptx, .pbix, .docx, .pdf). El motor analizará el contenido con la barra de progreso en tiempo real.
                  </p>
                </div>
              </div>

              {/* ACTION BUTTONS: FOLDER UPLOAD + STANDALONE FILES UPLOAD + GUIDE */}
              <div className="flex items-center gap-2 flex-wrap self-start lg:self-center shrink-0">
                {/* 1. Upload Folder Button */}
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-3.5 py-2 rounded-xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                  title="Subir una carpeta completa organizada con subcarpetas"
                >
                  <span className="material-symbols-outlined text-[18px]">drive_folder_upload</span>
                  <span>{isProcessing ? 'Procesando...' : 'Subir Carpeta'}</span>
                </button>

                {/* 2. Upload Standalone Files Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-3.5 py-2 rounded-xl bg-[#3131c0] hover:bg-[#4343d8] text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                  title="Subir uno o varios archivos sueltos (.xlsx, .csv, .pptx, .pbix, .docx, .pdf)"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span>Subir Archivos Sueltos</span>
                </button>

                {/* 3. Structure Guide Button */}
                <button
                  type="button"
                  onClick={handleDownloadStructureGuide}
                  className="px-3 py-2 rounded-xl bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] text-xs font-semibold flex items-center gap-1.5 border border-[#222a3d] transition-all cursor-pointer"
                  title="Descargar guía de organización de carpetas y formatos compatibles"
                >
                  <span className="material-symbols-outlined text-[16px]">help_outline</span>
                  <span className="hidden sm:inline">Guía Formatos</span>
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
              <p className="text-xl font-headline font-black text-[#dae2fd] mt-1">4 Categorías</p>
              <p className="text-[10px] text-[#bbcabf] mt-0.5">Rutas, Auditorías, BI, PPT</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#222a3d] shadow-sm">
              <p className="text-[11px] text-[#bbcabf] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#38bdf8]">calendar_month</span>
                Años / Meses
              </p>
              <p className="text-xl font-headline font-black text-[#38bdf8] mt-1">
                {availableYears.length} Años • {availableMonths.length} Meses
              </p>
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

          {/* DUAL DRAG & DROP ZONE (CARPETAS O ARCHIVOS SUELTOS) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 ${
              isDraggingOver
                ? 'border-[#4edea3] bg-[#4edea3]/10 scale-[1.01]'
                : 'border-[#2d3449] bg-[#131b2e]/60 hover:border-[#4edea3]/60 hover:bg-[#131b2e]'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#171f33] border border-[#222a3d] flex items-center justify-center text-[#4edea3] shadow-inner">
              <span className="material-symbols-outlined text-[32px]">
                {isDraggingOver ? 'file_download' : 'cloud_upload'}
              </span>
            </div>

            <div>
              <p className="text-sm sm:text-base font-bold text-[#dae2fd]">
                Arrastra tu Carpeta o Archivos Sueltos aquí
              </p>
              <p className="text-xs text-[#bbcabf] mt-1 max-w-md mx-auto">
                Soporta carpetas estructuradas o archivos individuales. CAVI procesará y mostrará el avance en la barra de carga.
              </p>
            </div>

            {/* Quick Action Buttons inside dropzone */}
            <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-[#171f33] hover:bg-[#222a3d] border border-[#4edea3]/40 text-[#4edea3] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">folder_open</span>
                <span>Seleccionar Carpeta</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-[#171f33] hover:bg-[#222a3d] border border-[#3131c0]/50 text-[#c0c1ff] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">post_add</span>
                <span>Seleccionar Archivos Sueltos</span>
              </button>
            </div>

            {/* Format Pills */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center mt-1">
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
                type="button"
                onClick={() => setSelectedMacroFolder('all')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
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
                    type="button"
                    onClick={() => setSelectedMacroFolder(mf.name)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
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
                  className="px-2.5 py-1 rounded-lg bg-[#171f33] border border-[#222a3d] text-xs text-[#dae2fd] focus:outline-none focus:border-[#4edea3] cursor-pointer"
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
                  className="px-2.5 py-1 rounded-lg bg-[#171f33] border border-[#222a3d] text-xs text-[#dae2fd] focus:outline-none focus:border-[#4edea3] cursor-pointer"
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
                  className="px-2.5 py-1 rounded-lg bg-[#171f33] border border-[#222a3d] text-xs text-[#dae2fd] focus:outline-none focus:border-[#4edea3] cursor-pointer"
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
                  type="button"
                  onClick={() => {
                    setSelectedMacroFolder('all');
                    setSelectedYear('all');
                    setSelectedMonth('all');
                    setSelectedType('all');
                    setSearchQuery('');
                  }}
                  className="px-2 py-1 rounded-lg text-xs text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#171f33] transition-colors ml-auto flex items-center gap-1 cursor-pointer"
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
                  Archivos en Repositorio ({filteredFiles.length})
                </h3>
                {activeRouteSourceFile && (
                  <span className="px-2 py-0.5 rounded bg-[#003824] text-[#4edea3] text-[10px] font-bold border border-[#4edea3]/30 hidden sm:inline">
                    Alimentando rutas: {activeRouteSourceFile}
                  </span>
                )}
              </div>
              <span className="text-xs text-[#bbcabf]">
                Haz clic en "Abrir y Leer" para examinar hojas, tablas o métricas
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
                              type="button"
                              onClick={() => {
                                onInjectRoutes(file);
                                onShowToast(
                                  'Datos de Ruta Alimentados',
                                  `Las paradas de "${file.name}" se cargaron en el plan de campo.`,
                                  'success'
                                );
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
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
                            type="button"
                            onClick={() => setActiveFileForViewer(file)}
                            className="px-3 py-1 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-[#dae2fd] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
                  type="button"
                  onClick={() => {
                    setSelectedMacroFolder('all');
                    setSelectedYear('all');
                    setSelectedMonth('all');
                    setSelectedType('all');
                    setSearchQuery('');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-[#dae2fd] cursor-pointer"
                >
                  Restablecer Filtros
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION UNIFICADA: REPORTE XLSX, SENSOR QR & RED GUAJIRA
          ========================================================================= */}
      {showOperacionesReportes && (
        <div className="bg-[#131b2e] p-4 sm:p-6 rounded-2xl border border-[#222a3d] shadow-sm space-y-6 overflow-hidden">
          {/* 1. HEADER PRINCIPAL UNIFICADO */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222a3d]">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#003824] flex items-center justify-center text-[#4edea3] border border-[#4edea3]/40 shadow-inner shrink-0">
                <span className="material-symbols-outlined text-[26px]">fact_check</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-headline font-black text-base sm:text-lg text-[#dae2fd]">
                    Consolidado Operativo: Reporte XLSX, Sensor QR &amp; Red Guajira
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#003824] text-[#4edea3] text-[10px] font-bold border border-[#4edea3]/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                    Módulo Unificado
                  </span>
                </div>
                <p className="text-xs text-[#bbcabf] mt-0.5">
                  Telemetría de campo, validación óptica QR y exportación oficial en Excel (.XLSX) para los 15 municipios de La Guajira.
                </p>
              </div>
            </div>

            {/* Quick action buttons & status tags */}
            <div className="flex items-center gap-2 flex-wrap self-start md:self-center shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-[#171f33] text-xs text-[#dae2fd] font-semibold border border-[#222a3d] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#ffb95f]">lan</span>
                15 Mpios 100%
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#003824]/60 text-xs text-[#4edea3] font-bold border border-[#4edea3]/30 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">qr_code_scanner</span>
                {checkInsList.length} Check-ins
              </span>
            </div>
          </div>

          {/* 2. SUBMÓDULO A: RED DEPARTAMENTAL LA GUAJIRA (15 MUNICIPIOS) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#3131c0]/25 text-[#c0c1ff] border border-[#3131c0]/40">
                  <span className="material-symbols-outlined text-[18px]">lan</span>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#dae2fd]">
                    1. Red Departamental La Guajira — Cobertura en los 15 Municipios
                  </h3>
                  <p className="text-[11px] text-[#bbcabf]">
                    Ámbito de auditoría exclusivo: Riohacha, Maicao, Uribia, Manaure y los 11 municipios del centro y sur
                  </p>
                </div>
              </div>

              {filterMunicipio !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilterMunicipio('all')}
                  className="px-2.5 py-1 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#4edea3] text-[11px] font-bold self-start sm:self-auto cursor-pointer"
                >
                  ✕ Ver los 15 Municipios
                </button>
              )}
            </div>

            {/* 15 Municipalities Interactive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {MUNICIPIOS_GUAJIRA.map((muni) => {
                const isSelected = filterMunicipio === muni.name;
                return (
                  <button
                    key={muni.name}
                    type="button"
                    onClick={() => setFilterMunicipio(isSelected ? 'all' : muni.name)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-[#003824] border-[#4edea3] ring-1 ring-[#4edea3]/60 shadow-md'
                        : 'bg-[#171f33] border-[#222a3d] hover:border-[#4edea3]/40 hover:bg-[#1a233a]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#dae2fd] truncate" title={muni.name}>
                        {muni.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#131b2e] text-[#4edea3] border border-[#222a3d]">
                        {muni.sla}% SLA
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#bbcabf]">
                      <span className="truncate">{muni.subregion}</span>
                      <span className="text-[#dae2fd] font-semibold">{muni.pointsCount} pts</span>
                    </div>

                    <div className="flex items-center gap-1 text-[9px]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          muni.status === 'Verificado'
                            ? 'bg-[#4edea3]'
                            : muni.status === 'En Ruta'
                            ? 'bg-[#ffb95f]'
                            : 'bg-[#38bdf8]'
                        }`}
                      ></span>
                      <span className="text-[#bbcabf] font-medium">{muni.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. SUBMÓDULO B: SENSOR DE CAMPO & CHECK-IN QR */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#171f33] border border-[#222a3d] space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4edea3]/15 flex items-center justify-center text-[#4edea3] border border-[#4edea3]/30 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-bold text-[#dae2fd]">
                      2. Sensor de Campo &amp; Verificación Óptica QR
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#4edea3] text-[10px] font-bold border border-[#4edea3]/30">
                      Enlace en Vivo
                    </span>
                  </div>
                  <p className="text-[11px] text-[#bbcabf] mt-0.5">
                    Escanea puntos físicos en campo con cámara o valida códigos manuales para alimentar la bitácora del reporte.
                  </p>
                </div>
              </div>

              {/* Primary Camera Scanner Button */}
              {onOpenScanner && (
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="px-4 py-2.5 rounded-xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all self-start lg:self-auto cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  <span>Abrir Escáner de Cámara QR</span>
                </button>
              )}
            </div>

            {/* Quick Validation Simulator & Direct Manual Input */}
            <div className="p-3 rounded-xl bg-[#131b2e] border border-[#222a3d] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#dae2fd] mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-[#ffb95f]">bolt</span>
                  Validación Rápida de Puntos (Simulador de Sensor):
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { code: 'CM-108', label: 'CM-108 (Riohacha)' },
                    { code: 'PF-042', label: 'PF-042 (Maicao)' },
                    { code: 'CDA-04', label: 'CDA-04 (Riohacha)' },
                    { code: 'CM-88', label: 'CM-88 (Fonseca)' },
                    { code: 'PF-12', label: 'PF-12 (San Juan)' },
                    { code: 'CM-92', label: 'CM-92 (Uribia)' },
                  ].map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => handleQuickCheckIn(p.code, p.label)}
                      className="px-2.5 py-1 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-xs text-[#dae2fd] font-medium border border-[#222a3d] hover:border-[#4edea3]/40 transition-all cursor-pointer"
                    >
                      + {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input for manual QR code */}
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Código QR (ej. CM-108)"
                  value={manualQrCode}
                  onChange={(e) => setManualQrCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualQrCode.trim()) {
                      const code = manualQrCode.trim().toUpperCase();
                      handleQuickCheckIn(code, `Punto Verificado ${code}`);
                      setManualQrCode('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#171f33] border border-[#222a3d] text-xs text-[#dae2fd] focus:outline-none focus:border-[#4edea3] w-36 sm:w-44"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!manualQrCode.trim()) {
                      onShowToast('Código requerido', 'Ingresa un código de punto (ej. CM-108)', 'alert');
                      return;
                    }
                    const code = manualQrCode.trim().toUpperCase();
                    handleQuickCheckIn(code, `Punto Verificado ${code}`);
                    setManualQrCode('');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#10b981] text-[#ffffff] text-xs font-bold hover:bg-[#059669] transition-all cursor-pointer"
                >
                  Validar
                </button>
              </div>
            </div>

            {/* Live Check-ins Feed / Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#bbcabf] uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#4edea3]">history</span>
                  Bitácora de Telemetría Sensor &amp; Check-ins QR ({checkInsList.length} registrados):
                </span>
                <span className="text-[10px] text-[#4edea3]">Sincronizado a XLSX</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {checkInsList
                  .filter((chk) => filterMunicipio === 'all' || chk.municipio.toLowerCase() === filterMunicipio.toLowerCase())
                  .map((chk) => (
                    <div
                      key={chk.id}
                      className="p-2.5 rounded-xl bg-[#131b2e] border border-[#222a3d] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-[#003824] text-[#4edea3] font-bold text-[10px] font-mono shrink-0 border border-[#4edea3]/30">
                          {chk.code}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#dae2fd] truncate">{chk.pointName}</p>
                          <p className="text-[10px] text-[#bbcabf] truncate">
                            📍 {chk.municipio} • {chk.type} • {chk.auditor}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-[#bbcabf] font-mono">{chk.timestamp}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10b981]/20 text-[#4edea3] border border-[#4edea3]/30">
                          ✓ {chk.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* 4. SUBMÓDULO C: GENERADOR DE REPORTE XLSX OFICIAL UNIFICADO */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#171f33] border border-[#222a3d] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 flex items-center justify-center text-[#4edea3] border border-[#4edea3]/30 shrink-0">
                <span className="material-symbols-outlined text-[22px]">table_view</span>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#dae2fd]">
                  3. Exportación de Reporte Consolidado Oficial (.XLSX)
                </h3>
                <p className="text-[11px] text-[#bbcabf] mt-0.5">
                  Genera la matriz descargable que integra Hojas de Ruta, Bitácora Sensor QR y los 15 Municipios de La Guajira.
                </p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#131b2e] rounded-xl p-3 flex flex-col border border-[#222a3d]">
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

              <div className="bg-[#131b2e] rounded-xl p-3 flex flex-col border border-[#222a3d]">
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

            {/* Inclusion Toggles */}
            <div className="p-3 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-2">
              <span className="text-[11px] font-bold text-[#bbcabf] uppercase tracking-wider block">
                Módulos integrados en el archivo XLSX:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 text-[#dae2fd] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeQrCheckIns}
                    onChange={(e) => setIncludeQrCheckIns(e.target.checked)}
                    className="accent-[#10b981] w-4 h-4 rounded"
                  />
                  <span>Sensor QR ({checkInsList.length} check-ins)</span>
                </label>

                <label className="flex items-center gap-2 text-[#dae2fd] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRedGuajira}
                    onChange={(e) => setIncludeRedGuajira(e.target.checked)}
                    className="accent-[#10b981] w-4 h-4 rounded"
                  />
                  <span>Red 15 Municipios (La Guajira)</span>
                </label>

                <label className="flex items-center gap-2 text-[#dae2fd] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSlaMetrics}
                    onChange={(e) => setIncludeSlaMetrics(e.target.checked)}
                    className="accent-[#10b981] w-4 h-4 rounded"
                  />
                  <span>Hojas de Ruta &amp; SLA Auditores</span>
                </label>
              </div>
            </div>

            {/* Big Download Button */}
            <button
              type="button"
              onClick={() => handleDownloadExcel()}
              disabled={isExporting}
              className="w-full h-12 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#ffffff] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  <span>Generando Consolidado Unificado XLSX...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  <span>Descargar Consolidado Operativo Oficial (.XLSX)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

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
