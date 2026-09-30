export type TabType = 'dashboard-cavi' | 'asignacion-rutas' | 'cronograma' | 'resultados-kpis' | 'archivos-macros' | 'arrendamientos';

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

export interface VisitRecord {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  auditorName: string;
  result: 'auditado' | 'no_auditado' | 'revisita_pendiente';
  reason?: string;
  notes?: string;
}

export type AlertCategory = 'sin_visita_2_3_meses' | 'critico_mas_3_meses' | 'inventario_discrepancia' | 'precio_no_conforme' | 'sla_vencido' | 'ninguna';

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
  status: 'completed' | 'in_progress' | 'pending' | 'not_audited' | 'revisit_needed';
  notes?: string;
  sla?: string;
  distance?: string;
  auditorId?: string;
  auditorName?: string;
  day?: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes';
  daysWithoutVisit?: number;
  lastVisitDate?: string;
  alertCategory?: AlertCategory;
  alertDescription?: string;
  zone?: 'Norte' | 'Centro' | 'Sur';

  // Audit and visit tracking
  visitCount?: number;
  auditStatus?: 'auditado' | 'no_auditado' | 'revisita_pendiente' | 'en_curso' | 'pendiente';
  auditReason?: string;
  auditDate?: string;
  visitHistory?: VisitRecord[];
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

export type LeasePropertyType =
  | 'Local Comercial'
  | 'Isla Comercial'
  | 'Oficina Administrativa'
  | 'Centro de Distribución / Bodega'
  | 'Taquilla / Kiosko';

export type LeaseOperatingStatus =
  | 'open'                 // Abierto normalmente
  | 'closed'               // Cerrado según horario
  | 'temporarily_closed'   // Cerrado por novedad o contingencia
  | 'maintenance'          // En mantenimiento o adecuación
  | 'contract_ended';      // Desalojado / Finalizado

export interface DayHours {
  open: string;    // HH:mm, e.g. "08:00"
  close: string;   // HH:mm, e.g. "18:00"
  isOpen: boolean; // false si no abre ese día
  hasLunchBreak?: boolean;
  lunchStart?: string;
  lunchEnd?: string;
}

export interface WeeklySchedule {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  holidayNote?: string;
}

export interface LandlordInfo {
  name: string;
  phone: string;
  email?: string;
  documentId?: string;
  contactPerson?: string;
}

export interface LeaseIncident {
  id: string;
  date: string;
  time: string;
  type:
    | 'Cierre no autorizado'
    | 'Retraso en apertura'
    | 'Cierre anticipado'
    | 'Corte de energía / agua'
    | 'Mantenimiento preventivo'
    | 'Novedad de infraestructura'
    | 'Inspección de auditoría';
  description: string;
  reportedBy: string;
  resolved: boolean;
  resolutionNotes?: string;
}

export interface LeasePoint {
  id: string;
  code: string;                // e.g. "ARR-RIO-001"
  name: string;                // e.g. "Sede Principal Riohacha Centro"
  propertyType: LeasePropertyType;
  operatingStatus: LeaseOperatingStatus;
  manualOverrideStatus?: 'force_open' | 'force_closed' | null;
  statusNotes?: string;

  // Ubicación
  address: string;
  neighborhood: string;
  municipality: string;        // Riohacha, Maicao, Uribia, etc.
  department: string;          // La Guajira
  reference?: string;
  lat: number;
  lng: number;

  // Horarios
  schedule: WeeklySchedule;

  // Contrato y Financiero
  contractNumber: string;
  monthlyRent: number;         // en COP
  adminFee?: number;           // en COP
  contractStartDate: string;   // YYYY-MM-DD
  contractEndDate: string;     // YYYY-MM-DD
  areaSqMeters: number;

  // Propietario / Inmobiliaria
  landlord: LandlordInfo;

  // Medidores y Servicios
  electricMeter?: string;
  waterMeter?: string;

  // Auditoría y Novedades
  lastAuditDate?: string;
  lastAuditorName?: string;
  incidents: LeaseIncident[];
}
