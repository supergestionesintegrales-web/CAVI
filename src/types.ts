export type TabType = 'dashboard-cavi' | 'asignacion-rutas' | 'cronograma' | 'resultados-kpis' | 'archivos-macros' | 'arrendamientos';

export type UserRole = 'administrador' | 'auxiliar';

export type UserSession = { role: UserRole; auditorId?: string; auditorName?: string; };

export type FormatType = 'CM' | 'PF' | 'CDA';
export type SupportedFileType = 'excel' | 'powerpoint' | 'powerbi' | 'word' | 'pdf' | 'other';

export interface MacroSheetData { name: string; rowCount: number; columns: string[]; data: (string | number | boolean | null)[][]; }
export interface MacroFile { id:string; name:string; macroFolder:string; year:string; month:string; path:string; type:SupportedFileType; extension:string; size:number; sizeFormatted:string; lastModified:string; summary:string; sheets?:MacroSheetData[]; extractedMeta?:{author?:string;version?:string;pageCount?:number;slidesCount?:number;tablesCount?:number;recordsCount?:number;kpis?:Record<string,string|number>;tags?:string[];contentSnippet?:string}; rawFile?:File; parsedRouteSteps?:RouteStep[]; }
export interface MacroFolderDefinition { id:string; name:string; label:string; description:string; icon:string; color:string; allowedExtensions:string[]; }

export interface Auditor { id:string; name:string; code:string; zone:'Norte'|'Centro'|'Sur'; avatar:string; status:'progress'|'completed'; hasAlert:boolean; visitsDone:number; visitsTarget:number; pointsPerDay:number; auditedTotal:number; effectiveness:number; currentLocation?:string; statusText:string; targetBreakdown:{cm:number;pf:number;cda:number}; moraPending:number; }
export interface VisitRecord { id:string; timestamp:string; date:string; time:string; auditorName:string; result:'auditado'|'no_auditado'|'revisita_pendiente'; reason?:string; notes?:string; }
export type AlertCategory = 'sin_visita_2_3_meses'|'critico_mas_3_meses'|'inventario_discrepancia'|'precio_no_conforme'|'sla_vencido'|'ninguna';
export interface RouteStep { id:string; time:string; code:string; format:FormatType; channel?:string; name:string; address:string; municipality?:string; lat?:number; lng?:number; hasGps?:boolean; status:'completed'|'in_progress'|'pending'|'not_audited'|'revisit_needed'; notes?:string; sla?:string; distance?:string; auditorId?:string; auditorName?:string; day?:'lunes'|'martes'|'miércoles'|'jueves'|'viernes'; daysWithoutVisit?:number; lastVisitDate?:string; alertCategory?:AlertCategory; alertDescription?:string; zone?:'Norte'|'Centro'|'Sur'; visitCount?:number; auditStatus?:'auditado'|'no_auditado'|'revisita_pendiente'|'en_curso'|'pendiente'; auditReason?:string; auditDate?:string; visitHistory?:VisitRecord[]; }
export interface FloatingPoint { id:string; code:string; name:string; format:FormatType; channel?:string; address:string; municipality?:string; lat?:number; lng?:number; hasGps?:boolean; priority:'Urgente'|'Alta'|'Media'|'Baja'; sla:string; details?:string; daysWithoutVisit?:number; lastVisitDate?:string; alertCategory?:AlertCategory; alertDescription?:string; zone?:'Norte'|'Centro'|'Sur'; }
export interface CriticalPoint { id:string; code:string; name:string; format:FormatType; address:string; zone:string; daysPending:number; priority:'Alta'|'Media'|'Re-visita Inventario'; lastAuditedDate:string; assignedTo?:string; }
export interface DaySchedule { day:number; visits:number; status:'normal'|'alert'|'warning'|'today'; note?:string; }

export type LeasePropertyType = 'Local Comercial'|'Isla Comercial'|'Oficina Administrativa'|'Centro de Distribución / Bodega'|'Taquilla / Kiosko';
export type LeaseOperatingStatus = 'open'|'closed'|'temporarily_closed'|'maintenance'|'contract_ended';
export type LeaseLifecycleStatus = 'active'|'inactive';
export type LeaseInactivityReason = 'contract_cancelled'|'contract_expired'|'lease_terminated'|'closed_by_administration'|'other';

export interface DayHours { open:string; close:string; isOpen:boolean; hasLunchBreak?:boolean; lunchStart?:string; lunchEnd?:string; }
export interface WeeklySchedule { monday:DayHours; tuesday:DayHours; wednesday:DayHours; thursday:DayHours; friday:DayHours; saturday:DayHours; sunday:DayHours; holidayNote?:string; }
export interface LandlordInfo { name:string; phone:string; email?:string; documentId?:string; contactPerson?:string; }
export interface LeaseIncident { id:string; date:string; time:string; type:'Cierre no autorizado'|'Retraso en apertura'|'Cierre anticipado'|'Corte de energía / agua'|'Mantenimiento preventivo'|'Novedad de infraestructura'|'Inspección de auditoría'; description:string; reportedBy:string; resolved:boolean; resolutionNotes?:string; }

export interface LeaseSalesSummary {
  lastSaleDate?: string;
  daysWithoutSale?: number;
  totalTransactions?: number;
  totalSalesAmount?: number;
  salesSourceFile?: string;
  coverageStartDate?: string;
  coverageEndDate?: string;
  status?: 'with_sales'|'no_sales'|'no_data';
}

export interface LeasePoint {
  id:string; code:string; name:string; propertyType:LeasePropertyType;
  operatingStatus:LeaseOperatingStatus;
  lifecycleStatus?:LeaseLifecycleStatus;
  inactivityReason?:LeaseInactivityReason;
  inactivityDate?:string;
  manualOverrideStatus?:'force_open'|'force_closed'|null;
  statusNotes?:string;
  address:string; neighborhood:string; municipality:string; department:string; reference?:string; lat:number; lng:number;
  schedule:WeeklySchedule;
  contractNumber:string; monthlyRent:number; adminFee?:number; contractStartDate:string; contractEndDate:string; areaSqMeters:number;
  landlord:LandlordInfo; electricMeter?:string; waterMeter?:string; lastAuditDate?:string; lastAuditorName?:string; incidents:LeaseIncident[]; salesSummary?: LeaseSalesSummary;
}
