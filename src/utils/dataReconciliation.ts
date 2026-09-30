import { LeasePoint, LeasePropertyType } from '../types';
import { DEFAULT_WEEKDAY_HOURS, SATURDAY_HOURS, CLOSED_DAY } from '../data/leasePointsData';

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
    const [d,m,y] = value.split(/[/-]/);
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
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

export function parseLeasePointsFromMacroFiles(files: Array<{ name: string; sheets?: Array<{ name:string; columns:string[]; data:(string|number|boolean|null)[][] }> }>, existing: LeasePoint[]): LeaseImportResult {
  const candidates: LeasePoint[] = [];
  const warnings: string[] = [];

  for (const file of files) {
    const likelyLease = /arrend|arriendo|canon|inmuebl|contrato/i.test(file.name);
    if (!likelyLease && !file.sheets?.some(s => s.columns.some(c => /canon|arrend|contrato|inmueble/i.test(c)))) continue;

    for (const sheet of file.sheets || []) {
      const rows = sheet.data || [];
      for (const raw of rows) {
        const row = Object.fromEntries((sheet.columns || []).map((c, i) => [c, raw[i] ?? '']));
        const code = clean(get(row, ['Codigo Inmueble','Codigo Punto','Codigo PDV','Codigo','ID Punto','ID']));
        const name = clean(get(row, ['Nombre del Punto','Nombre Punto','Punto de Venta','Nombre Inmueble','Nombre','Establecimiento']));
        if (!code && !name) continue;
        const municipality = clean(get(row, ['Municipio','Ciudad','Poblacion']));
        const previous = existing.find(p => p.code.toLowerCase() === (code || name).toLowerCase());
        const base = previous || {
          id: `arr-import-${normalize(code || name)}`,
          code: code || `ARR-${normalize(name).slice(0,12)}`,
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
            monday:{...DEFAULT_WEEKDAY_HOURS}, tuesday:{...DEFAULT_WEEKDAY_HOURS}, wednesday:{...DEFAULT_WEEKDAY_HOURS},
            thursday:{...DEFAULT_WEEKDAY_HOURS}, friday:{...DEFAULT_WEEKDAY_HOURS}, saturday:{...SATURDAY_HOURS}, sunday:{...CLOSED_DAY}
          },
          contractNumber:'',
          monthlyRent:0,
          contractStartDate:'',
          contractEndDate:'',
          areaSqMeters:0,
          landlord:{name:'',phone:''},
          incidents:[],
        } satisfies LeasePoint;

        const statusRaw = normalize(get(row,['Estado del Punto','Estado','Estado Operativo']));
        const inactiveReason = normalize(get(row,['Motivo Inactividad','Motivo Cierre']));
        const updated: LeasePoint = {
          ...base,
          code: code || base.code,
          name: name || base.name,
          propertyType: get(row,['Tipo de Inmueble','Tipo Propiedad']) ? propertyType(get(row,['Tipo de Inmueble','Tipo Propiedad'])) : base.propertyType,
          address: clean(get(row,['Direccion','Dirección'])) || base.address,
          neighborhood: clean(get(row,['Barrio','Sector'])) || base.neighborhood,
          municipality: municipality || base.municipality,
          department: clean(get(row,['Departamento'])) || base.department,
          reference: clean(get(row,['Referencia'])) || base.reference,
          lat: parseNumber(get(row,['Latitud GPS','Latitud','Lat'])) || base.lat,
          lng: parseNumber(get(row,['Longitud GPS','Longitud','Lng','Lon'])) || base.lng,
          monthlyRent: parseMoney(get(row,['Canon Mensual (COP)','Canon Mensual','Canon','Valor Canon'])) || base.monthlyRent,
          adminFee: parseMoney(get(row,['Cuota Administración (COP)','Cuota Administración','Administracion'])) || base.adminFee,
          areaSqMeters: parseNumber(get(row,['Área (m²)','Area (m2)','Area'])) || base.areaSqMeters,
          contractNumber: clean(get(row,['N° Contrato','Numero Contrato','Número Contrato','Contrato'])) || base.contractNumber,
          contractStartDate: parseDate(get(row,['Fecha Inicio Contrato','Fecha Inicio'])) || base.contractStartDate,
          contractEndDate: parseDate(get(row,['Fecha Vencimiento Contrato','Fecha Vencimiento','Fecha Fin'])) || base.contractEndDate,
          electricMeter: clean(get(row,['Medidor de Energía','Medidor Energia'])) || base.electricMeter,
          waterMeter: clean(get(row,['Medidor de Agua'])) || base.waterMeter,
          lastAuditDate: parseDate(get(row,['Última Auditoría Inmueble','Ultima Auditoria','Última Auditoría'])) || base.lastAuditDate,
          daysOfAccount: parseNumber(get(row,['Días de Cuenta','Dias de Cuenta','Dias Cuenta','Días Cuenta','Días de cuenta'])) || base.daysOfAccount,
          lastAuditorName: clean(get(row,['Auditor Responsable','Auditor'])) || base.lastAuditorName,
          landlord: {
            ...base.landlord,
            name: clean(get(row,['Propietario / Arrendador','Propietario','Arrendador'])) || base.landlord.name,
            phone: clean(get(row,['Teléfono Contacto','Telefono Contacto','Teléfono'])) || base.landlord.phone,
            email: clean(get(row,['Correo Electrónico','Correo','Email'])) || base.landlord.email,
            documentId: clean(get(row,['NIT / Documento Propietario','NIT','Documento Propietario'])) || base.landlord.documentId,
          },
        };

        if (statusRaw.includes('inactivo') || statusRaw.includes('cancel') || statusRaw.includes('terminado') || statusRaw.includes('cerrado')) {
          updated.lifecycleStatus = 'inactive';
          updated.operatingStatus = statusRaw.includes('cancel') ? 'contract_ended' : base.operatingStatus === 'open' ? 'temporarily_closed' : base.operatingStatus;
          updated.inactivityReason = inactiveReason.includes('venc') ? 'contract_expired' : inactiveReason.includes('termin') ? 'lease_terminated' : inactiveReason.includes('admin') ? 'closed_by_administration' : 'contract_cancelled';
          updated.inactivityDate = parseDate(get(row,['Fecha Inactividad','Fecha Cierre'])) || base.inactivityDate;
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

export function parseLeaseSalesFromMacroFiles(files: Array<{ name: string; sheets?: Array<{ name:string; columns:string[]; data:(string|number|boolean|null)[][] }> }>, existing: LeasePoint[], now = new Date()): { points: LeasePoint[]; detectedRows: number; warnings: string[] } {
  const byCode = new Map(existing.map(p => [p.code.toLowerCase(), p]));
  const latestByCode = new Map<string, { lastSaleDate:string; lastRowDate:string; amount:number; count:number; start:string; end:string; file:string }>();
  let detectedRows = 0;
  const warnings:string[] = [];
  for (const file of files) {
    const likelySales = /venta|ventas|giro|transacc|produccion|recaudo/i.test(file.name) || file.sheets?.some(s => s.columns.some(c => /venta|ventas|giro|transacc|valor venta|fecha venta/i.test(c)));
    if (!likelySales) continue;
    for (const sheet of file.sheets || []) {
      for (const raw of sheet.data || []) {
        const row = Object.fromEntries((sheet.columns || []).map((c,i)=>[c,raw[i] ?? '']));
        const code = clean(get(row,['Codigo Punto','Codigo PDV','Codigo','Codigo Inmueble','ID Punto','ID','Punto']));
        const name = clean(get(row,['Nombre del Punto','Nombre Punto','Punto de Venta','Nombre','Establecimiento']));
        const date = parseDate(get(row,['Fecha Venta','Fecha','Fecha Movimiento','Fecha Transaccion','Fecha Transacción','Dia','Día']));
        if ((!code && !name) || !date) continue;
        detectedRows++;
        const key = (code || name).toLowerCase();
        const amount = parseMoney(get(row,['Valor Venta','Venta','Ventas','Valor','Monto','Total']));
        const current = latestByCode.get(key);
        const start = current ? (new Date(current.start) < new Date(date) ? current.start : date) : date;
        const end = current ? (new Date(current.end) > new Date(date) ? current.end : date) : date;
        const lastSaleDate = amount > 0 && (!current?.lastSaleDate || new Date(date) > new Date(current.lastSaleDate)) ? date : (current?.lastSaleDate || '');
        latestByCode.set(key,{lastSaleDate,lastRowDate: current && new Date(current.lastRowDate) > new Date(date) ? current.lastRowDate : date,amount:(current?.amount || 0)+amount,count:(current?.count || 0)+1,start,end,file:file.name});
      }
    }
  }
  for (const [key, summary] of latestByCode) {
    const point = byCode.get(key);
    if (!point) continue;
    const referenceDate = summary.lastSaleDate || summary.lastRowDate;
    const days = Math.max(0, Math.floor((now.getTime()-new Date(referenceDate).getTime())/86400000));
    byCode.set(key,{...point,salesSummary:{lastSaleDate:summary.lastSaleDate || undefined,daysWithoutSale:days,totalTransactions:summary.count,totalSalesAmount:summary.amount,salesSourceFile:summary.file,coverageStartDate:summary.start,coverageEndDate:summary.end,status:summary.lastSaleDate ? 'with_sales' : 'no_sales'}});
  }
  if (detectedRows === 0) warnings.push('No se detectaron movimientos de ventas en los archivos cargados.');
  return {points:Array.from(byCode.values()),detectedRows,warnings};
}

export interface LeaseDataAlert {
  id:string;
  code:string;
  pointName:string;
  type:'canon_increased'|'point_closed'|'point_reopened'|'not_visited'|'contract_expiring'|'new_point'|'sales_inactivity';
  title:string;
  message:string;
  severity:'urgent'|'warning'|'info';
  createdAt:string;
}

export function generateLeaseDataAlerts(previous: LeasePoint[], next: LeasePoint[], now = new Date()): LeaseDataAlert[] {
  const alerts: LeaseDataAlert[] = [];
  const oldByCode = new Map(previous.map(p => [p.code.toLowerCase(), p]));
  const today = now.getTime();

  for (const p of next) {
    const old = oldByCode.get(p.code.toLowerCase());
    if (!old) {
      alerts.push({id:`new-${p.code}-${today}`,code:p.code,pointName:p.name,type:'new_point',title:'Nuevo punto de arrendamiento',message:`${p.name} fue incorporado al sistema.`,severity:'info',createdAt:now.toISOString()});
      continue;
    }
    if (p.monthlyRent > old.monthlyRent && old.monthlyRent > 0) {
      const pct = ((p.monthlyRent-old.monthlyRent)/old.monthlyRent*100).toFixed(1);
      alerts.push({id:`rent-${p.code}-${today}`,code:p.code,pointName:p.name,type:'canon_increased',title:'Incremento de canon',message:`El canon pasó de $${old.monthlyRent.toLocaleString('es-CO')} a $${p.monthlyRent.toLocaleString('es-CO')} (+${pct}%).`,severity:'warning',createdAt:now.toISOString()});
    }
    const oldInactive = old.lifecycleStatus === 'inactive' || old.operatingStatus === 'contract_ended';
    const newInactive = p.lifecycleStatus === 'inactive' || p.operatingStatus === 'contract_ended';
    if (!oldInactive && newInactive) alerts.push({id:`closed-${p.code}-${today}`,code:p.code,pointName:p.name,type:'point_closed',title:'Punto cerrado / inactivo',message:`${p.name} cambió a estado inactivo. ${p.inactivityReason || 'Revisar motivo'}.`,severity:'urgent',createdAt:now.toISOString()});
    if (oldInactive && !newInactive) alerts.push({id:`reopen-${p.code}-${today}`,code:p.code,pointName:p.name,type:'point_reopened',title:'Punto reactivado',message:`${p.name} volvió a estado activo.`,severity:'info',createdAt:now.toISOString()});
    if (p.salesSummary?.lastSaleDate && (p.salesSummary.daysWithoutSale || 0) >= 60) {
      const days = p.salesSummary.daysWithoutSale || 0;
      alerts.push({id:'sales-'+p.code+'-'+p.salesSummary.lastSaleDate,code:p.code,pointName:p.name,type:'sales_inactivity',title:'Sin ventas prolongadas',message:p.name+' registra '+days+' días sin movimiento de ventas desde '+p.salesSummary.lastSaleDate+'. Esto es una alerta comercial y no confirma por sí sola una depuración contractual.',severity:days >= 90 ? 'urgent' : 'warning',createdAt:now.toISOString()});
    }

    if (p.lastAuditDate) {
      const days = Math.floor((today - new Date(p.lastAuditDate).getTime()) / 86400000);
      if (days >= 60) alerts.push({id:`visit-${p.code}-${p.lastAuditDate}`,code:p.code,pointName:p.name,type:'not_visited',title:'Punto no visitado',message:`${p.name} lleva ${days} días sin auditoría registrada.`,severity:days >= 90?'urgent':'warning',createdAt:now.toISOString()});
    }
    if (p.contractEndDate) {
      const daysToEnd = Math.ceil((new Date(p.contractEndDate).getTime()-today)/86400000);
      if (daysToEnd >= 0 && daysToEnd <= 30) alerts.push({id:`contract-${p.code}-${p.contractEndDate}`,code:p.code,pointName:p.name,type:'contract_expiring',title:'Contrato próximo a vencer',message:`${p.name} tiene vencimiento de contrato en ${daysToEnd} días.`,severity:daysToEnd <= 7?'urgent':'warning',createdAt:now.toISOString()});
    }
  }
  return alerts;
}
