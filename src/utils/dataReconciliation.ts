import * as XLSX from 'xlsx';
import { LeasePoint, LeasePropertyType, RouteStep, MacroFile } from '../types';
import { DEFAULT_WEEKDAY_HOURS, SATURDAY_HOURS, CLOSED_DAY, formatCOP } from '../data/leasePointsData';
import { parsePointsFromText } from './kmlTxtParser';

const clean = (v: unknown) => String(v ?? '').trim();
const normalize = (v: unknown) => clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

const get = (row: Record<string, unknown>, keys: string[]) => {
  const wanted = keys.map(normalize);
  const key = Object.keys(row).find((k) => wanted.includes(normalize(k)));
  return key ? row[key] : '';
};

const parseMoney = (v: unknown) => {
  const n = Number(clean(v).replace(/[^0-9,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const parseNumber = (v: unknown) => {
  const n = Number(clean(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const parseDate = (v: unknown) => {
  const value = clean(v);
  if (!value) return '';
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    const serial = Number(value);
    if (serial >= 20000 && serial <= 80000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + serial * 86400000);
      return date.toISOString().slice(0, 10);
    }
  }
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(value)) {
    const [d, m, y] = value.split(/[/-]/);
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return value;
};

const propertyType = (v: unknown): LeasePropertyType => {
  const s = normalize(v);
  if (s.includes('isla')) return 'Isla Comercial';
  if (s.includes('oficina')) return 'Oficina Administrativa';
  if (s.includes('bodega') || s.includes('centrodistribucion')) return 'Centro de Distribución / Bodega';
  if (s.includes('taquilla') || s.includes('kiosko')) return 'Taquilla / Kiosko';
  return 'Local Comercial';
};

export interface LeaseImportResult {
  points: LeasePoint[];
  warnings: string[];
  detectedRows: number;
}

export interface NetworkMasterSummary {
  activeCodes: Set<string>;
  inactiveMap: Map<string, { reason: string; date: string; name: string }>;
  detectedActiveCount: number;
  detectedInactiveCount: number;
}

export interface LeaseDataAlert {
  id: string;
  code: string;
  pointName: string;
  type:
    | 'active_lease_no_sales'
    | 'active_lease_closed_point'
    | 'no_sales_unvisited'
    | 'sales_in_inactive_point'
    | 'network_status_discrepancy'
    | 'audit_closed_network_active'
    | 'active_unmapped'
    | 'canon_increased'
    | 'point_closed'
    | 'point_reopened'
    | 'not_visited'
    | 'contract_expiring'
    | 'new_point'
    | 'sales_inactivity';
  title: string;
  message: string;
  severity: 'urgent' | 'warning' | 'info';
  createdAt: string;
  monthlyRent?: number;
  daysWithoutSale?: number;
  lastSaleDate?: string;
  lastAuditDate?: string;
  daysWithoutAudit?: number;
  networkStatus?: 'activa' | 'inactiva' | 'cerrado' | 'desconocido';
  hasGpsCoordinates?: boolean;
  financialRiskAmount?: number;
  recommendedAction?: string;
  municipality?: string;
  zone?: 'Norte' | 'Centro' | 'Sur';
}

/**
 * Parses lease records from uploaded files (contracts, monthly rent, landlords, dates)
 */
export function parseLeasePointsFromMacroFiles(
  files: Array<{ name: string; sheets?: Array<{ name: string; columns: string[]; data: (string | number | boolean | null)[][] }> }>,
  existing: LeasePoint[]
): LeaseImportResult {
  const candidates: LeasePoint[] = [];
  const warnings: string[] = [];

  for (const file of files) {
    const likelyLease = /arrend|arriendo|canon|inmuebl|contrato/i.test(file.name);
    if (!likelyLease && !file.sheets?.some((s) => s.columns.some((c) => /canon|arrend|contrato|inmueble/i.test(c)))) continue;

    for (const sheet of file.sheets || []) {
      const rows = sheet.data || [];
      for (const raw of rows) {
        const row = Object.fromEntries((sheet.columns || []).map((c, i) => [c, raw[i] ?? '']));
        const code = clean(get(row, ['Codigo Inmueble', 'Codigo Punto', 'Codigo PDV', 'Codigo', 'ID Punto', 'ID']));
        const name = clean(get(row, ['Nombre del Punto', 'Nombre Punto', 'Punto de Venta', 'Nombre Inmueble', 'Nombre', 'Establecimiento']));
        if (!code && !name) continue;
        const municipality = clean(get(row, ['Municipio', 'Ciudad', 'Poblacion']));
        const previous = existing.find((p) => p.code.toLowerCase() === (code || name).toLowerCase());
        const base = previous || {
          id: `arr-import-${normalize(code || name)}`,
          code: code || `ARR-${normalize(name).slice(0, 12)}`,
          name: name || code,
          propertyType: 'Local Comercial' as LeasePropertyType,
          operatingStatus: 'open' as const,
          address: '',
          neighborhood: '',
          municipality,
          department: 'La Guajira',
          lat: 0,
          lng: 0,
          schedule: {
            monday: { ...DEFAULT_WEEKDAY_HOURS },
            tuesday: { ...DEFAULT_WEEKDAY_HOURS },
            wednesday: { ...DEFAULT_WEEKDAY_HOURS },
            thursday: { ...DEFAULT_WEEKDAY_HOURS },
            friday: { ...DEFAULT_WEEKDAY_HOURS },
            saturday: { ...SATURDAY_HOURS },
            sunday: { ...CLOSED_DAY },
          },
          contractNumber: '',
          monthlyRent: 0,
          contractStartDate: '',
          contractEndDate: '',
          areaSqMeters: 0,
          landlord: { name: '', phone: '' },
          incidents: [],
        } satisfies LeasePoint;

        const statusRaw = normalize(get(row, ['Estado del Punto', 'Estado', 'Estado Operativo']));
        const inactiveReason = normalize(get(row, ['Motivo Inactividad', 'Motivo Cierre', 'Motivo']));
        const updated: LeasePoint = {
          ...base,
          code: code || base.code,
          name: name || base.name,
          propertyType: get(row, ['Tipo de Inmueble', 'Tipo Propiedad']) ? propertyType(get(row, ['Tipo de Inmueble', 'Tipo Propiedad'])) : base.propertyType,
          address: clean(get(row, ['Direccion', 'Dirección'])) || base.address,
          neighborhood: clean(get(row, ['Barrio', 'Sector'])) || base.neighborhood,
          municipality: municipality || base.municipality,
          department: clean(get(row, ['Departamento'])) || base.department,
          reference: clean(get(row, ['Referencia'])) || base.reference,
          lat: parseNumber(get(row, ['Latitud GPS', 'Latitud', 'Lat'])) || base.lat,
          lng: parseNumber(get(row, ['Longitud GPS', 'Longitud', 'Lng', 'Lon'])) || base.lng,
          monthlyRent: parseMoney(get(row, ['Canon Mensual (COP)', 'Canon Mensual', 'Canon', 'Valor Canon'])) || base.monthlyRent,
          adminFee: parseMoney(get(row, ['Cuota Administración (COP)', 'Cuota Administración', 'Administracion'])) || base.adminFee,
          areaSqMeters: parseNumber(get(row, ['Área (m²)', 'Area (m2)', 'Area'])) || base.areaSqMeters,
          contractNumber: clean(get(row, ['N° Contrato', 'Numero Contrato', 'Número Contrato', 'Contrato'])) || base.contractNumber,
          contractStartDate: parseDate(get(row, ['Fecha Inicio Contrato', 'Fecha Inicio'])) || base.contractStartDate,
          contractEndDate: parseDate(get(row, ['Fecha Vencimiento Contrato', 'Fecha Vencimiento', 'Fecha Fin'])) || base.contractEndDate,
          electricMeter: clean(get(row, ['Medidor de Energía', 'Medidor Energia'])) || base.electricMeter,
          waterMeter: clean(get(row, ['Medidor de Agua'])) || base.waterMeter,
          lastAuditDate: parseDate(get(row, ['Última Auditoría Inmueble', 'Ultima Auditoria', 'Última Auditoría'])) || base.lastAuditDate,
          daysOfAccount: parseNumber(get(row, ['Días de Cuenta', 'Dias de Cuenta', 'Dias Cuenta', 'Días Cuenta', 'Días de cuenta'])) || base.daysOfAccount,
          lastAuditorName: clean(get(row, ['Auditor Responsable', 'Auditor'])) || base.lastAuditorName,
          landlord: {
            ...base.landlord,
            name: clean(get(row, ['Propietario / Arrendador', 'Propietario', 'Arrendador'])) || base.landlord.name,
            phone: clean(get(row, ['Teléfono Contacto', 'Telefono Contacto', 'Teléfono'])) || base.landlord.phone,
            email: clean(get(row, ['Correo Electrónico', 'Correo', 'Email'])) || base.landlord.email,
            documentId: clean(get(row, ['NIT / Documento Propietario', 'NIT', 'Documento Propietario'])) || base.landlord.documentId,
          },
        };

        if (statusRaw.includes('inactivo') || statusRaw.includes('cancel') || statusRaw.includes('terminado') || statusRaw.includes('cerrado')) {
          updated.lifecycleStatus = 'inactive';
          updated.operatingStatus = statusRaw.includes('cancel') ? 'contract_ended' : base.operatingStatus === 'open' ? 'temporarily_closed' : base.operatingStatus;
          updated.inactivityReason = inactiveReason.includes('venc')
            ? 'contract_expired'
            : inactiveReason.includes('termin')
            ? 'lease_terminated'
            : inactiveReason.includes('admin')
            ? 'closed_by_administration'
            : 'contract_cancelled';
          updated.inactivityDate = parseDate(get(row, ['Fecha Inactividad', 'Fecha Cierre'])) || base.inactivityDate;
        } else if (statusRaw.includes('activo') || statusRaw.includes('abierto')) {
          updated.lifecycleStatus = 'active';
        }
        candidates.push(updated);
      }
    }
  }

  const byCode = new Map<string, LeasePoint>();
  for (const p of existing) byCode.set(p.code.toLowerCase(), p);
  for (const p of candidates) byCode.set(p.code.toLowerCase(), p);
  if (candidates.length === 0) warnings.push('No se detectaron filas de arrendamientos en los archivos cargados.');
  return { points: Array.from(byCode.values()), warnings, detectedRows: candidates.length };
}

/**
 * Parses sales files (last sale date, total volume, days without sales)
 */
export function parseLeaseSalesFromMacroFiles(
  files: Array<{ name: string; sheets?: Array<{ name: string; columns: string[]; data: (string | number | boolean | null)[][] }> }>,
  existing: LeasePoint[],
  now = new Date()
): { points: LeasePoint[]; detectedRows: number; warnings: string[] } {
  const byCode = new Map(existing.map((p) => [p.code.toLowerCase(), p]));
  const latestByCode = new Map<
    string,
    { lastSaleDate: string; lastRowDate: string; amount: number; count: number; start: string; end: string; file: string; daysWithoutSale?: number }
  >();
  let detectedRows = 0;
  const warnings: string[] = [];

  for (const file of files) {
    const likelySales =
      /venta|ventas|giro|transacc|produccion|recaudo/i.test(file.name) ||
      file.sheets?.some((s) => s.columns.some((c) => /venta|ventas|giro|transacc|valor venta|fecha venta|dias sin venta/i.test(c)));
    if (!likelySales) continue;

    for (const sheet of file.sheets || []) {
      for (const raw of sheet.data || []) {
        const row = Object.fromEntries((sheet.columns || []).map((c, i) => [c, raw[i] ?? '']));
        const code = clean(get(row, ['Codigo Punto', 'Codigo PDV', 'Codigo', 'Codigo Inmueble', 'ID Punto', 'ID', 'Punto']));
        const name = clean(get(row, ['Nombre del Punto', 'Nombre Punto', 'Punto de Venta', 'Nombre', 'Establecimiento']));
        const date = parseDate(get(row, ['Fecha Venta', 'Fecha', 'Fecha Movimiento', 'Fecha Transaccion', 'Fecha Transacción', 'Ultima Venta', 'Dia', 'Día']));
        const explicitDays = parseNumber(get(row, ['Dias Sin Venta', 'Días Sin Venta', 'Dias Sin Ventas', 'Días sin venta']));

        if (!code && !name) continue;
        detectedRows++;
        const key = (code || name).toLowerCase();
        const amount = parseMoney(get(row, ['Valor Venta', 'Venta', 'Ventas', 'Valor', 'Monto', 'Total']));
        const current = latestByCode.get(key);
        const start = current ? (date && new Date(current.start) < new Date(date) ? current.start : date || current.start) : date || '';
        const end = current ? (date && new Date(current.end) > new Date(date) ? current.end : date || current.end) : date || '';
        const lastSaleDate =
          amount > 0 && date && (!current?.lastSaleDate || new Date(date) > new Date(current.lastSaleDate))
            ? date
            : current?.lastSaleDate || date || '';

        latestByCode.set(key, {
          lastSaleDate,
          lastRowDate: current && date && new Date(current.lastRowDate) > new Date(date) ? current.lastRowDate : date || current?.lastRowDate || '',
          amount: (current?.amount || 0) + amount,
          count: (current?.count || 0) + 1,
          start,
          end,
          file: file.name,
          daysWithoutSale: explicitDays > 0 ? explicitDays : current?.daysWithoutSale,
        });
      }
    }
  }

  for (const [key, summary] of latestByCode) {
    const point = byCode.get(key);
    if (!point) continue;

    let days = summary.daysWithoutSale;
    if (days === undefined) {
      const referenceDate = summary.lastSaleDate || summary.lastRowDate;
      days = referenceDate ? Math.max(0, Math.floor((now.getTime() - new Date(referenceDate).getTime()) / 86400000)) : 99;
    }

    byCode.set(key, {
      ...point,
      salesSummary: {
        lastSaleDate: summary.lastSaleDate || undefined,
        daysWithoutSale: days,
        totalTransactions: summary.count,
        totalSalesAmount: summary.amount,
        salesSourceFile: summary.file,
        coverageStartDate: summary.start,
        coverageEndDate: summary.end,
        status: summary.lastSaleDate && summary.amount > 0 ? 'with_sales' : 'no_sales',
      },
    });
  }

  if (detectedRows === 0) warnings.push('No se detectaron movimientos de ventas en los archivos cargados.');
  return { points: Array.from(byCode.values()), detectedRows, warnings };
}

/**
 * Parses Active Network and Inactive/Closed Points master reports
 */
export function parseNetworkMasterFromMacroFiles(
  files: Array<{ name: string; sheets?: Array<{ name: string; columns: string[]; data: (string | number | boolean | null)[][] }> }>
): NetworkMasterSummary {
  const activeCodes = new Set<string>();
  const inactiveMap = new Map<string, { reason: string; date: string; name: string }>();

  for (const file of files) {
    const nameLower = file.name.toLowerCase();
    const isInactiveFile = /red.*inactiv|inactiv|cerrad|baja|depura|cancel/i.test(nameLower);
    const isActiveFile = /red.*activ|maestro.*activ|puntos.*activ|abiert/i.test(nameLower);

    for (const sheet of file.sheets || []) {
      const sheetLower = sheet.name.toLowerCase();
      const isInactiveSheet = isInactiveFile || /inactiv|cerrad|baja|depura|cancel/i.test(sheetLower);
      const isActiveSheet = isActiveFile || /red.*activ|maestro.*activ|puntos.*activ|abiert/i.test(sheetLower);

      if (!isInactiveSheet && !isActiveSheet) continue;

      for (const raw of sheet.data || []) {
        const row = Object.fromEntries((sheet.columns || []).map((c, i) => [c, raw[i] ?? '']));
        const code = clean(get(row, ['Codigo Punto', 'Codigo PDV', 'Codigo', 'Codigo Inmueble', 'ID Punto', 'ID', 'Punto'])).toLowerCase();
        const name = clean(get(row, ['Nombre del Punto', 'Nombre Punto', 'Punto de Venta', 'Nombre', 'Establecimiento']));
        const statusRaw = normalize(get(row, ['Estado', 'Estado del Punto', 'Condicion', 'Situacion']));
        const reason = clean(get(row, ['Motivo', 'Motivo Cierre', 'Motivo Inactividad', 'Causa', 'Detalle'])) || 'Punto cerrado / inactivo';
        const date = parseDate(get(row, ['Fecha Cierre', 'Fecha Inactividad', 'Fecha Baja', 'Fecha']));

        if (!code) continue;

        if (isInactiveSheet || statusRaw.includes('inactiv') || statusRaw.includes('cerrad') || statusRaw.includes('baja') || statusRaw.includes('cancel')) {
          inactiveMap.set(code, { reason, date, name: name || code });
        } else if (isActiveSheet || statusRaw.includes('activ') || statusRaw.includes('abiert')) {
          activeCodes.add(code);
        }
      }
    }
  }

  return {
    activeCodes,
    inactiveMap,
    detectedActiveCount: activeCodes.size,
    detectedInactiveCount: inactiveMap.size,
  };
}

/**
 * Extracts GPS coordinates from TXT/KML or geocoding sheets
 */
export function parseTxtCoordinatesFromMacroFiles(
  files: Array<{ name: string; sheets?: Array<{ name: string; columns: string[]; data: (string | number | boolean | null)[][] }> }>
): Map<string, { lat: number; lng: number; municipality?: string; address?: string }> {
  const coordMap = new Map<string, { lat: number; lng: number; municipality?: string; address?: string }>();

  for (const file of files) {
    for (const sheet of file.sheets || []) {
      for (const raw of sheet.data || []) {
        const row = Object.fromEntries((sheet.columns || []).map((c, i) => [c, raw[i] ?? '']));
        const code = clean(get(row, ['Codigo PDV', 'Codigo Punto', 'Codigo', 'ID Punto', 'Punto', 'COD_PDV'])).toLowerCase();
        const lat = parseNumber(get(row, ['Latitud', 'Latitud GPS', 'Lat', 'LATITUD']));
        const lng = parseNumber(get(row, ['Longitud', 'Longitud GPS', 'Lng', 'Lon', 'LONGITUD']));
        const municipality = clean(get(row, ['Municipio', 'Ciudad', 'MUNICIPIO']));
        const address = clean(get(row, ['Direccion', 'Dirección', 'DIRECCION', 'DIRECCIÓN']));

        if (code && Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
          coordMap.set(code, { lat, lng, municipality, address });
        }
      }
    }
  }

  return coordMap;
}

/**
 * Central Cross-Reconciliation Engine:
 * Crosses Leases, Sales, Active/Inactive Network, TXT coordinates, and Auditor Route Steps.
 * Generates prioritized alerts for economic leaks, inactive points paying rent, unvisited abandoned points, etc.
 */
export function generateCrossReconciliationAlerts(
  leasePoints: LeasePoint[],
  routeSteps: RouteStep[] = [],
  macroFiles: MacroFile[] = [],
  now = new Date()
): { alerts: LeaseDataAlert[]; reconciledLeasePoints: LeasePoint[] } {
  const alerts: LeaseDataAlert[] = [];
  const network = parseNetworkMasterFromMacroFiles(macroFiles);
  const coords = parseTxtCoordinatesFromMacroFiles(macroFiles);
  const today = now.getTime();

  // Map route steps by code for audit visit reconciliation
  const stepsByCode = new Map<string, RouteStep[]>();
  routeSteps.forEach((s) => {
    const k = s.code.toLowerCase();
    if (!stepsByCode.has(k)) stepsByCode.set(k, []);
    stepsByCode.get(k)!.push(s);
  });

  const reconciledPoints: LeasePoint[] = leasePoints.map((p) => {
    const key = p.code.toLowerCase();
    let updated = { ...p };

    // 1. Cross with Inactive Network Master
    if (network.inactiveMap.has(key)) {
      const inactInfo = network.inactiveMap.get(key)!;
      updated.lifecycleStatus = 'inactive';
      updated.operatingStatus = 'temporarily_closed';
      if (!updated.inactivityReason) updated.inactivityReason = inactInfo.reason.slice(0, 50) as any;
      if (!updated.inactivityDate && inactInfo.date) updated.inactivityDate = inactInfo.date;
    } else if (network.activeCodes.has(key) && updated.lifecycleStatus !== 'inactive') {
      updated.lifecycleStatus = 'active';
    }

    // 2. Cross with TXT/KML coordinates
    if (coords.has(key)) {
      const c = coords.get(key)!;
      if (!updated.lat || updated.lat === 0) updated.lat = c.lat;
      if (!updated.lng || updated.lng === 0) updated.lng = c.lng;
      if (!updated.municipality && c.municipality) updated.municipality = c.municipality;
      if (!updated.address && c.address) updated.address = c.address;
    }

    // 3. Cross with RouteSteps / Audit history
    const audSteps = stepsByCode.get(key) || [];
    if (audSteps.length > 0) {
      const completedVisit = audSteps.find((s) => s.status === 'completed' || s.auditStatus === 'auditado');
      const closedInField = audSteps.find((s) => s.status === 'not_audited' && /cerrad|inactiv/i.test(s.auditReason || s.notes || ''));
      if (completedVisit) {
        updated.lastAuditDate = completedVisit.scheduledDate || completedVisit.auditDate || updated.lastAuditDate;
        updated.lastAuditorName = completedVisit.auditorName || updated.lastAuditorName;
      }
      if (closedInField && updated.operatingStatus !== 'temporarily_closed') {
        updated.operatingStatus = 'temporarily_closed';
        updated.statusNotes = `Reportado cerrado por auditor ${closedInField.auditorName || ''} en visita.`;
      }
    }

    return updated;
  });

  // RUN CORE CROSS-REFERENCING RULES
  for (const p of reconciledPoints) {
    const key = p.code.toLowerCase();
    const audSteps = stepsByCode.get(key) || [];
    const isInactiveInNetwork = network.inactiveMap.has(key);
    const isActiveInNetwork = network.activeCodes.has(key);
    const isClosedOrEnded =
      p.lifecycleStatus === 'inactive' ||
      p.operatingStatus === 'contract_ended' ||
      p.operatingStatus === 'temporarily_closed' ||
      isInactiveInNetwork;

    const daysWithoutSale = p.salesSummary?.daysWithoutSale ?? (p.salesSummary?.lastSaleDate ? Math.floor((today - new Date(p.salesSummary.lastSaleDate).getTime()) / 86400000) : 90);
    const hasSalesRecord = Boolean(p.salesSummary?.lastSaleDate && (p.salesSummary?.totalSalesAmount || 0) > 0);

    const auditDateStr = p.lastAuditDate || audSteps.find((s) => s.scheduledDate)?.scheduledDate;
    const daysWithoutAudit = auditDateStr ? Math.floor((today - new Date(auditDateStr).getTime()) / 86400000) : 120;

    // RULE 1: CANON PAGÁNDOSE EN PUNTO CERRADO / RED INACTIVA (Crítica Financiera / Desembolso Fantasma)
    if (isClosedOrEnded && p.monthlyRent > 0) {
      alerts.push({
        id: `closed-rent-${p.code}-${today}`,
        code: p.code,
        pointName: p.name,
        type: 'active_lease_closed_point',
        title: 'Canon pagándose en punto cerrado / inactivo',
        message: `Fuga de capital: ${p.name} figura como CERRADO o INACTIVO en la red (${p.inactivityReason || 'Punto dado de baja'}), pero mantiene contrato de arrendamiento activo con canon de ${formatCOP(p.monthlyRent)}/mes. Se requiere cesación o terminación inmediata.`,
        severity: 'urgent',
        createdAt: now.toISOString(),
        monthlyRent: p.monthlyRent,
        financialRiskAmount: p.monthlyRent,
        networkStatus: 'inactiva',
        recommendedAction: 'Suspender desembolso de canon y radicar terminación contractual con el arrendador.',
        municipality: p.municipality,
      });
    }

    // RULE 2: ARRIENDO ACTIVO SIN VENTAS (Fuga de Capital Operativa)
    if (!isClosedOrEnded && p.monthlyRent > 0 && (!hasSalesRecord || daysWithoutSale >= 30)) {
      const isVeryOld = daysWithoutSale >= 60 || !hasSalesRecord;
      alerts.push({
        id: `lease-nosale-${p.code}-${today}`,
        code: p.code,
        pointName: p.name,
        type: 'active_lease_no_sales',
        title: `Arriendo activo sin ventas (${daysWithoutSale} días)`,
        message: `${p.name} tiene contrato de arrendamiento vigente por ${formatCOP(p.monthlyRent)}/mes, pero registra ${daysWithoutSale} días sin generar ventas comerciales. Representa un gasto inmobiliario sin retorno comercial.`,
        severity: isVeryOld || p.monthlyRent >= 1500000 ? 'urgent' : 'warning',
        createdAt: now.toISOString(),
        monthlyRent: p.monthlyRent,
        financialRiskAmount: p.monthlyRent,
        daysWithoutSale,
        lastSaleDate: p.salesSummary?.lastSaleDate,
        networkStatus: 'activa',
        recommendedAction: 'Verificar operatividad en terreno con el supervisor de zona o evaluar reubicación.',
        municipality: p.municipality,
      });
    }

    // RULE 3: SIN VENTA PROLONGADA Y SIN VISITA DEL AUDITOR (Punto Ciego / Abandono Físico)
    if (!isClosedOrEnded && daysWithoutSale >= 30 && (!auditDateStr || daysWithoutAudit >= 45)) {
      alerts.push({
        id: `blind-point-${p.code}-${today}`,
        code: p.code,
        pointName: p.name,
        type: 'no_sales_unvisited',
        title: `Sin ventas y sin visita de auditor (${daysWithoutSale}d / ${daysWithoutAudit}d)`,
        message: `${p.name} acumula ${daysWithoutSale} días sin ventas registradas y ${auditDateStr ? `${daysWithoutAudit} días sin auditoría presencial` : 'nunca ha sido visitado en terreno'}. Riesgo de cierre no notificado o daño de terminal.`,
        severity: daysWithoutSale >= 60 || daysWithoutAudit >= 60 ? 'urgent' : 'warning',
        createdAt: now.toISOString(),
        daysWithoutSale,
        lastSaleDate: p.salesSummary?.lastSaleDate,
        lastAuditDate: auditDateStr,
        daysWithoutAudit,
        networkStatus: 'activa',
        recommendedAction: 'Asignar inspección técnica prioritaria en el cronograma del auditor asignado.',
        municipality: p.municipality,
      });
    }

    // RULE 4: AUDITOR CONSTATÓ LOCAL CERRADO PERO FIGURA ACTIVO EN RED COMERCIAL
    const closedInAudit = audSteps.some((s) => s.status === 'not_audited' && /cerrad|clausur/i.test(s.auditReason || s.notes || ''));
    if (closedInAudit && !isClosedOrEnded) {
      alerts.push({
        id: `audit-closed-${p.code}-${today}`,
        code: p.code,
        pointName: p.name,
        type: 'audit_closed_network_active',
        title: 'Cerrado en terreno pero activo en red comercial',
        message: `El auditor constató en visita física que ${p.name} se encuentra cerrado, pero continúa figurando como activo en el maestro de red.`,
        severity: 'urgent',
        createdAt: now.toISOString(),
        networkStatus: 'activa',
        recommendedAction: 'Actualizar catálogo maestro de red y suspender metas comerciales para este PDV.',
        municipality: p.municipality,
      });
    }

    // RULE 5: VENTAS REGISTRADAS EN PUNTO INACTIVO O CERRADO (Anomalía de Transacciones)
    if (isClosedOrEnded && hasSalesRecord && daysWithoutSale <= 15) {
      alerts.push({
        id: `sales-inactive-${p.code}-${today}`,
        code: p.code,
        pointName: p.name,
        type: 'sales_in_inactive_point',
        title: 'Ventas registradas en punto reportado inactivo',
        message: `Anomalía operacional: Se detectaron ventas recientes (${formatCOP(p.salesSummary?.totalSalesAmount || 0)}) en ${p.name}, a pesar de que el maestro de red lo califica como CERRADO o INACTIVO.`,
        severity: 'urgent',
        createdAt: now.toISOString(),
        daysWithoutSale,
        lastSaleDate: p.salesSummary?.lastSaleDate,
        networkStatus: 'inactiva',
        recommendedAction: 'Auditoría forense: verificar si la terminal fue trasladada o si el punto debe ser reactivado formalmente.',
        municipality: p.municipality,
      });
    }

    // RULE 6: DISCREPANCIA RED ACTIVA VS RED INACTIVA
    if (isActiveInNetwork && isInactiveInNetwork) {
      alerts.push({
        id: `net-discrepancy-${p.code}-${today}`,
        code: p.code,
        pointName: p.name,
        type: 'network_status_discrepancy',
        title: 'Discrepancia: figura en Red Activa y Red Inactiva',
        message: `${p.name} está listado simultáneamente en el archivo de Red Activa y en el de Red Inactiva / Puntos Cerrados. Inconsistencia entre bases de datos.`,
        severity: 'warning',
        createdAt: now.toISOString(),
        networkStatus: 'desconocido',
        recommendedAction: 'Alinear y depurar las bases comerciales de red.',
        municipality: p.municipality,
      });
    }

    // RULE 7: PUNTO ACTIVO SIN COORDENADAS GEOGRÁFICAS (Reporte TXT Faltante)
    if (!isClosedOrEnded && (!p.lat || !p.lng || p.lat === 0 || p.lng === 0)) {
      alerts.push({
        id: `unmapped-${p.code}-${today}`,
        code: p.code,
        pointName: p.name,
        type: 'active_unmapped',
        title: 'Punto activo sin coordenadas TXT / GPS',
        message: `${p.name} está activo en operación comercial pero no posee coordenadas GPS en el reporte TXT/KML. No puede ser incorporado a rutas optimizadas.`,
        severity: 'warning',
        createdAt: now.toISOString(),
        networkStatus: 'activa',
        hasGpsCoordinates: false,
        recommendedAction: 'Subir archivo TXT/KML de coordenadas o geolocalizar manualmente en CAVIMAPS.',
        municipality: p.municipality,
      });
    }

    // RULE 8: CONTRATO DE ARRENDAMIENTO PRÓXIMO A VENCER
    if (p.contractEndDate) {
      const daysToEnd = Math.ceil((new Date(p.contractEndDate).getTime() - today) / 86400000);
      if (daysToEnd >= 0 && daysToEnd <= 30) {
        alerts.push({
          id: `contract-end-${p.code}-${today}`,
          code: p.code,
          pointName: p.name,
          type: 'contract_expiring',
          title: `Contrato por vencer en ${daysToEnd} días`,
          message: `El contrato de arrendamiento de ${p.name} vence el ${p.contractEndDate} (${daysToEnd} días restantes). Canon: ${formatCOP(p.monthlyRent)}/mes. ${hasSalesRecord ? 'Punto con ventas activas: prioridad de prórroga.' : 'Punto sin ventas: evaluar no renovación.'}`,
          severity: daysToEnd <= 7 ? 'urgent' : 'warning',
          createdAt: now.toISOString(),
          monthlyRent: p.monthlyRent,
          recommendedAction: hasSalesRecord ? 'Iniciar trámite de renovación contractual con el arrendador.' : 'Gestionar acta de entrega física del local.',
          municipality: p.municipality,
        });
      }
    }
  }

  return { alerts, reconciledLeasePoints: reconciledPoints };
}

/**
 * Legacy wrapper to maintain full backward compatibility
 */
export function generateLeaseDataAlerts(previous: LeasePoint[], next: LeasePoint[], now = new Date()): LeaseDataAlert[] {
  const result = generateCrossReconciliationAlerts(next, [], [], now);
  return result.alerts;
}

/**
 * Exports all reconciliation alerts and audit findings to an executive Excel spreadsheet
 */
export function exportReconciliationReportToExcel(alerts: LeaseDataAlert[], leasePoints: LeasePoint[]) {
  const alertsSheetData = [
    [
      'Código PDV',
      'Nombre Establecimiento',
      'Municipio',
      'Tipo de Alerta',
      'Severidad',
      'Diagnóstico e Inteligencia CAVI',
      'Canon Mensual (COP)',
      'Días Sin Venta',
      'Fecha Última Venta',
      'Fecha Última Auditoría',
      'Estado en Red',
      'Impacto Financiero Riesgo (COP)',
      'Acción Recomendada',
      'Fecha Detección',
    ],
    ...alerts.map((a) => {
      const p = leasePoints.find((lp) => lp.code.toLowerCase() === a.code.toLowerCase());
      return [
        a.code,
        a.pointName,
        a.municipality || p?.municipality || 'La Guajira',
        a.title,
        a.severity.toUpperCase(),
        a.message,
        a.monthlyRent || p?.monthlyRent || 0,
        a.daysWithoutSale ?? p?.salesSummary?.daysWithoutSale ?? '',
        a.lastSaleDate || p?.salesSummary?.lastSaleDate || 'Sin registro',
        a.lastAuditDate || p?.lastAuditDate || 'Sin auditoría',
        a.networkStatus || (p?.lifecycleStatus === 'inactive' ? 'Inactiva' : 'Activa'),
        a.financialRiskAmount || 0,
        a.recommendedAction || 'Inspección de campo requerida',
        new Date(a.createdAt).toLocaleString('es-CO'),
      ];
    }),
  ];

  const totalFinancialRisk = alerts.reduce((acc, a) => acc + (a.financialRiskAmount || 0), 0);
  const urgentCount = alerts.filter((a) => a.severity === 'urgent').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  const summarySheetData = [
    ['REPORTE EJECUTIVO DE CRUCE DE DATOS Y ALERTAS - CAVI GUADIT'],
    ['Fecha de Generación', new Date().toLocaleString('es-CO')],
    [''],
    ['MÉTRICA', 'VALOR'],
    ['Total de Alertas Detectadas', alerts.length],
    ['Alertas Urgentes (Acción Inmediata)', urgentCount],
    ['Alertas Preventivas / Advertencias', warningCount],
    ['Impacto Financiero en Riesgo (Canones sin retorno o en puntos cerrados)', totalFinancialRisk],
    ['Puntos de Arrendamiento Reconciliados', leasePoints.length],
    [''],
    ['CRITERIOS DE CRUCE EJECUTADOS:'],
    ['1. Arrendamientos Activos vs Reporte de Ventas (Fuga de Capital por inactividad comercial)'],
    ['2. Arrendamientos Activos vs Puntos Cerrados / Red Inactiva (Pago indebido de cánones)'],
    ['3. Reporte de Ventas vs Visitas de Auditoría (Detección de puntos ciegos o abandono)'],
    ['4. Reporte TXT/KML vs Red Activa (Verificación de georreferenciación y coordenadas)'],
    ['5. Auditorías de Campo vs Maestro de Red (Discrepancias de cierre físico)'],
  ];

  const wb = XLSX.utils.book_new();
  const wsAlerts = XLSX.utils.aoa_to_sheet(alertsSheetData);
  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);

  XLSX.utils.book_append_sheet(wb, wsAlerts, 'Alertas_y_Cruces');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Ejecutivo');

  const fileName = `CAVI_Reporte_Alertas_Cruces_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
