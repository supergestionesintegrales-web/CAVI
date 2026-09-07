export type TabType = 'dashboard-cavi' | 'asignacion-rutas' | 'cronograma' | 'resultados-kpis' | 'archivos-macros';

export type UserRole = 'administrador' | 'auxiliar';

export interface UserSession {
  role: UserRole;
  auditorId?: string; // For auxiliar role: 'aud-1', 'aud-2', 'aud-3'
  auditorName?: string;
}

export type FormatType = 'CM' | 'PF' | 'CDA';

export type SupportedFileType = 'excel' | 'powerpoint' | 'powerbi' | 'word' | 'pdf' | 'other';

export interface MacroSheetData {
  name: string;
  rowCount: number;
  columns: string[];
  data: (string | number | boolean | null)[][];
}

export interface MacroFile {
  id: string;
  name: string;
  macroFolder: string; // e.g. "Rutas", "Auditorias", "Indicadores_PowerBI", "Presentaciones"
  year: string;        // e.g. "2024", "2023"
  month: string;       // e.g. "10-Octubre", "09-Septiembre"
  path: string;        // relative path: "Rutas/2024/10-Octubre/Rutas_Semana42_Bogota.xlsx"
  type: SupportedFileType;
  extension: string;   // "xlsx", "pptx", "pbix", "docx", "pdf"
  size: number;        // in bytes
  sizeFormatted: string;
  lastModified: string;
  summary: string;
  sheets?: MacroSheetData[];
  extractedMeta?: {
    author?: string;
    version?: string;
    pageCount?: number;
    slidesCount?: number;
    tablesCount?: number;
    recordsCount?: number;
    kpis?: Record<string, string | number>;
    tags?: string[];
    contentSnippet?: string;
  };
  rawFile?: File;
  parsedRouteSteps?: RouteStep[];
}

export interface MacroFolderDefinition {
  id: string;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  allowedExtensions: string[];
}

export interface Auditor {
  id: string;
  name: string;
  code: string;
  zone: 'Norte' | 'Centro' | 'Sur';
  avatar: string;
  status: 'progress' | 'completed';
  hasAlert: boolean;
  visitsDone: number;
  visitsTarget: number;
  pointsPerDay: number;
  auditedTotal: number;
  effectiveness: number;
  currentLocation?: string;
  statusText: string;
  targetBreakdown: {
    cm: number;
    pf: number;
    cda: number;
  };
  moraPending: number;
}

export interface RouteStep {
  id: string;
  time: string;
  code: string;
  format: FormatType;
  channel?: string;
  name: string;
  address: string;
  municipality?: string;
  lat?: number;
  lng?: number;
  hasGps?: boolean;
  status: 'completed' | 'in_progress' | 'pending';
  notes?: string;
  sla?: string;
  distance?: string;
  auditorId?: string;
  auditorName?: string;
  day?: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes';
  daysWithoutVisit?: number;
  lastVisitDate?: string;
  alertCategory?: 'sin_visita_2_3_meses' | 'critico_mas_3_meses' | 'inventario_discrepancia' | 'precio_no_conforme' | 'sla_vencido' | 'ninguna';
  alertDescription?: string;
  zone?: 'Norte' | 'Centro' | 'Sur';
}

export interface FloatingPoint {
  id: string;
  code: string;
  name: string;
  format: FormatType;
  channel?: string;
  address: string;
  municipality?: string;
  lat?: number;
  lng?: number;
  hasGps?: boolean;
  priority: 'Urgente' | 'Alta' | 'Media' | 'Baja';
  sla: string;
  details?: string;
  daysWithoutVisit?: number;
  lastVisitDate?: string;
  alertCategory?: 'sin_visita_2_3_meses' | 'critico_mas_3_meses' | 'inventario_discrepancia' | 'precio_no_conforme' | 'sla_vencido' | 'ninguna';
  alertDescription?: string;
  zone?: 'Norte' | 'Centro' | 'Sur';
}

export interface CriticalPoint {
  id: string;
  code: string;
  name: string;
  format: FormatType;
  address: string;
  zone: string;
  daysPending: number;
  priority: 'Alta' | 'Media' | 'Re-visita Inventario';
  lastAuditedDate: string;
  assignedTo?: string;
}

export interface DaySchedule {
  day: number;
  visits: number;
  status: 'normal' | 'alert' | 'warning' | 'today';
  note?: string;
}
