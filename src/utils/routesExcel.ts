import * as XLSX from 'xlsx';
import { RouteStep, FormatType, Auditor, AlertCategory } from '../types';
import { distributePointsWithAlertPriority, PointCandidate } from './pointAssignment';

/**
 * Downloads a clean, formatted Excel template for uploading real route stops.
 */
export function downloadRoutesTemplate() {
  const headers = [
    'Codigo_PDV',
    'Nombre_Punto_Venta',
    'Canal',
    'Formato',
    'Dia_Semana',
    'Auditor_Asignado',
    'Direccion',
    'Municipio',
    'Latitud_GPS',
    'Longitud_GPS',
    'Horario_Programado',
    'Dias_Sin_Visita',
    'Alerta_Campo',
    'SLA_Observaciones'
  ];

  const sampleRows = [
    ['PDV-01', 'Supertienda Olímpica Centro', 'Supermercados', 'CM', 'Lunes', 'Samuel Ramos Quintero', 'Calle 15 #8-20', 'Riohacha', 11.5442, -72.9069, '08:00', 84, 'Quiebre de stock presencial', 'SLA: 24h · Prioridad Alta Alerta'],
    ['PDV-02', 'Tienda y Abarrotes La Gran Parada', 'Tradicional', 'PF', 'Martes', 'Kleyder Rodriguez', 'Carrera 11 #14-30', 'Maicao', 11.3778, -72.2389, '08:30', 72, 'Discrepancia de inventario físico', 'SLA: 48h · Alerta Inventario'],
    ['PDV-03', 'Droguería La Economía San Juan', 'Droguerías', 'PF', 'Miércoles', 'Jose Aponte', 'Calle 5 #6-12', 'San Juan del Cesar', 10.7711, -73.0025, '08:30', 96, 'Superó límite de 3 meses sin visita', 'SLA: Urgente Alerta'],
    ['PDV-04', 'D1 Mercado Público Fonseca', 'Hard Discount', 'CM', 'Jueves', 'Jose Aponte', 'Carrera 18 #12-40', 'Fonseca', 10.8861, -72.8515, '10:45', 14, 'Ninguna', 'SLA: 48h · Exhibición Regular'],
    ['PDV-05', 'Distribuidora Mayorista El Maná', 'Mayorista', 'CDA', 'Viernes', 'Kleyder Rodriguez', 'Calle 16 #22-10', 'Maicao', 11.3812, -72.2450, '11:15', 18, 'Ninguna', 'SLA: 24h · Cargue Regular'],
    ['PDV-06', 'Minimarket Los Laureles', 'Conveniencia', 'PF', 'Lunes', 'Samuel Ramos Quintero', 'Calle 12 #4-55', 'Uribia', 11.7139, -72.2660, '11:00', 105, 'Máxima mora alta guajira', 'SLA: 48h · Prioridad Alerta'],
    ['PDV-07', 'Super Éxito Salinas', 'Supermercados', 'CM', 'Martes', 'Samuel Ramos Quintero', 'Avenida de la Sal #3-18', 'Manaure', 11.7792, -72.4494, '14:00', 12, 'Ninguna', 'SLA: 24h · Auditoría Promo'],
    ['PDV-08', 'Centro de Acopio Villanueva', 'CDA', 'CDA', 'Miércoles', 'Jose Aponte', 'Carrera 8 #10-05', 'Villanueva', 10.6056, -72.9789, '14:30', 20, 'Ninguna', 'SLA: 24h · Entrega Regular'],
    ['PDV-09', 'Supermercado Central Albania', 'Supermercados', 'CM', 'Jueves', 'Kleyder Rodriguez', 'Calle 4 #7-19', 'Albania', 11.1611, -72.5928, '14:00', 15, 'Ninguna', 'SLA: 24h · Auditoría Stock'],
    ['PDV-10', 'Abarrotes y Granero Hatonuevo', 'Tradicional', 'PF', 'Viernes', 'Kleyder Rodriguez', 'Carrera 9 #5-12', 'Hatonuevo', 11.0617, -72.7633, '15:30', 22, 'Ninguna', 'SLA: 48h · Canal Tradicional']
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 },
    { wch: 34 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 26 },
    { wch: 30 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 32 },
    { wch: 32 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Matriz_PDV_GPS');
  XLSX.writeFile(wb, 'Matriz_Puntos_De_Venta_GPS_LaGuajira.xlsx');
}

/**
 * Downloads a specialized matrix template with explicit GPS geolocation columns and store channels.
 */
export function downloadPdvsMatrixTemplate() {
  downloadRoutesTemplate();
}

/**
 * Parses an uploaded Excel or CSV file and extracts RouteStep objects with Geolocation, Name, Channel, and Address.
 */
export async function parseRoutesFile(file: File, auditors: Auditor[]): Promise<RouteStep[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
  const candidates: PointCandidate[] = [];

  rawRows.forEach((row, index) => {
    // Helper to find column values safely
    const getVal = (possibleKeys: string[]) => {
      for (const k of possibleKeys) {
        for (const rowKey of Object.keys(row)) {
          const cleanKey = rowKey.trim().toLowerCase().replace(/[_\s-]+/g, '');
          const cleanTarget = k.toLowerCase().replace(/[_\s-]+/g, '');
          if (cleanKey === cleanTarget || rowKey.trim().toLowerCase() === k.toLowerCase()) {
            return String(row[rowKey]).trim();
          }
        }
      }
      return '';
    };

    // 1. Code
    const code = getVal(['codigo', 'código', 'id', 'cod', 'pto', 'codigopdv', 'idpunto']) || `PDV-${index + 1}`;

    // 2. Name of POS / Establecimiento
    const name = getVal([
      'nombre',
      'nombrepuntoventa',
      'nombreestablecimiento',
      'establecimiento',
      'puntodeventa',
      'punto',
      'cliente',
      'razonsocial',
      'sede'
    ]) || `Punto de Venta ${code}`;

    // 3. Channel / Canal
    const channelRaw = getVal([
      'canal',
      'canaldistribucion',
      'canalventas',
      'tipocanal',
      'categoria',
      'tipopunto'
    ]);
    const channel = channelRaw || 'Tradicional';

    // 4. Format (CM, PF, CDA)
    const rawFormat = getVal(['formato', 'tipo', 'formatopunto']).toUpperCase();
    let format: FormatType = 'CM';
    if (rawFormat === 'CDA' || channel.toLowerCase().includes('cda') || channel.toLowerCase().includes('acopio') || channel.toLowerCase().includes('distribuidora')) {
      format = 'CDA';
    } else if (rawFormat === 'PF' || channel.toLowerCase().includes('tradicional') || channel.toLowerCase().includes('droguer') || channel.toLowerCase().includes('conveniencia')) {
      format = 'PF';
    } else {
      format = 'CM';
    }

    // 5. Address and Municipality
    const address = getVal(['direccion', 'dirección', 'direccionestablecimiento', 'direccionmunicipio', 'ubicacion', 'ubicación', 'domicilio']) || 'La Guajira';
    const municipality = getVal(['municipio', 'ciudad', 'poblacion', 'zona', 'subregion']) || '';
    const fullAddress = municipality && !address.toLowerCase().includes(municipality.toLowerCase())
      ? `${address}, ${municipality}`
      : address;

    // 6. Geolocation (Latitude & Longitude)
    let lat: number | undefined = undefined;
    let lng: number | undefined = undefined;

    const latRaw = getVal(['latitud', 'lat', 'latitude', 'latitudgps', 'coordy', 'y']);
    const lngRaw = getVal(['longitud', 'lng', 'lon', 'longitude', 'longitudgps', 'coordx', 'x']);
    const combinedGps = getVal(['geolocalizacion', 'geolocalización', 'coordenadas', 'gps', 'coords', 'ubicaciongps']);

    if (latRaw && lngRaw) {
      const parsedLat = parseFloat(latRaw.replace(',', '.'));
      const parsedLng = parseFloat(lngRaw.replace(',', '.'));
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        lat = parsedLat;
        lng = parsedLng;
      }
    } else if (combinedGps) {
      // E.g. "11.5442, -72.9069" or "11.5442 -72.9069" or "11.5442; -72.9069"
      const parts = combinedGps.split(/[,;\s]+/).map(p => parseFloat(p.trim().replace(',', '.'))).filter(n => !isNaN(n));
      if (parts.length >= 2) {
        lat = parts[0];
        lng = parts[1];
      }
    }

    // Coordinates sanity check (in Colombia lat is positive ~10-12 in Guajira, lng is negative ~ -71 to -73)
    if (lat !== undefined && lng !== undefined) {
      if (lat < 0 && lng > 0) {
        // Inverted lat and lng
        const temp = lat;
        lat = lng;
        lng = temp;
      }
      if (lng > 0) {
        lng = -lng; // Colombia is West (negative longitude)
      }
    }

    const hasGps = typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);

    // 7. Time and SLA
    const time = getVal(['horario', 'hora', 'horarioprogramado', 'time', 'horavisita']) || `${8 + (index % 8)}:00`;
    const sla = getVal(['sla', 'slaobservaciones', 'observaciones', 'notas', 'prioridad']) || (channel ? `Canal: ${channel}` : 'SLA 48h');

    // 8. Alert & Days without visit
    const daysRaw = getVal(['diassinvisita', 'dias_sin_visita', 'diassinatencion', 'mora', 'diassinvisitar', 'diasmora']);
    const daysWithoutVisit = daysRaw ? parseInt(daysRaw, 10) : undefined;
    const alertRaw = getVal(['alerta', 'alertacategoria', 'categoriaalerta', 'alert', 'novedad', 'tipoalerta', 'alertaprioritaria', 'alertacampo']);
    const alertDesc = getVal(['descripcion_alerta', 'motivoalerta', 'detallealerta', 'alertadescripcion', 'observacionalerta', 'detallenovedad']);

    let alertCategory: string | undefined = undefined;
    if (alertRaw && alertRaw.toLowerCase() !== 'ninguna' && alertRaw.toLowerCase() !== 'sin novedad') {
      alertCategory = 'alerta_operativa';
    } else if (daysWithoutVisit && daysWithoutVisit >= 60) {
      alertCategory = daysWithoutVisit >= 90 ? 'critico_mas_3_meses' : 'sin_visita_2_3_meses';
    }

    // 9. Assigned Auditor
    const auditorRaw = getVal(['auditor', 'auditorasignado', 'responsable', 'asesor', 'zona']);
    let matchedAuditor = auditors.find((a) =>
      a.name.toLowerCase().includes(auditorRaw.toLowerCase()) ||
      a.zone.toLowerCase() === auditorRaw.toLowerCase() ||
      a.code.toLowerCase() === auditorRaw.toLowerCase()
    );

    // 10. Day of week (Lunes a Viernes)
    const dayRaw = getVal(['dia', 'diasemana', 'dia_semana', 'day', 'jornada']).toLowerCase();
    let explicitDay: RouteStep['day'] | undefined = undefined;
    if (dayRaw.includes('lun')) explicitDay = 'lunes';
    else if (dayRaw.includes('mar')) explicitDay = 'martes';
    else if (dayRaw.includes('mie') || dayRaw.includes('mié')) explicitDay = 'miércoles';
    else if (dayRaw.includes('jue')) explicitDay = 'jueves';
    else if (dayRaw.includes('vie')) explicitDay = 'viernes';

    candidates.push({
      id: `step-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
      code,
      name,
      channel,
      format,
      day: explicitDay,
      address: fullAddress,
      municipality: municipality || 'La Guajira',
      lat,
      lng,
      hasGps,
      time,
      sla,
      daysWithoutVisit,
      alertCategory: alertCategory as AlertCategory | undefined,
      alertDescription: alertDesc || (daysWithoutVisit && daysWithoutVisit >= 60 ? `${daysWithoutVisit} días sin visita presencial` : undefined),
      auditorId: matchedAuditor?.id,
      auditorName: matchedAuditor?.name,
    });
  });

  // Check if any candidates need automated alert-prioritized distribution
  const needsAutoDistribution = candidates.some((c) => !c.auditorId);
  if (needsAutoDistribution) {
    const { assignedSteps } = distributePointsWithAlertPriority(candidates, auditors);
    return assignedSteps;
  }

  // If explicit auditors were given, still prioritize alert points so they appear first in each day
  const resultSteps: RouteStep[] = candidates.map((c, index) => {
    const daysCycle: Array<RouteStep['day']> = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
    const finalDay = c.day || daysCycle[index % daysCycle.length];
    const aud = auditors.find((a) => a.id === c.auditorId) || auditors[index % auditors.length] || auditors[0];

    return {
      id: c.id || `step-${Date.now()}-${index}`,
      code: c.code,
      name: c.name,
      channel: c.channel,
      format: c.format,
      day: finalDay,
      address: c.address,
      municipality: c.municipality || 'La Guajira',
      lat: c.lat,
      lng: c.lng,
      hasGps: c.hasGps ?? false,
      time: c.time || `${8 + (index % 8)}:00`,
      sla: c.sla || 'SLA 48h',
      status: 'pending',
      auditorId: aud.id,
      auditorName: aud.name,
      notes: c.alertDescription ? `🚨 Prioridad Alerta: ${c.alertDescription}` : undefined,
      daysWithoutVisit: c.daysWithoutVisit,
      alertCategory: (c.alertCategory as AlertCategory | undefined) || (c.daysWithoutVisit && c.daysWithoutVisit >= 60 ? 'sin_visita_2_3_meses' : undefined),
      alertDescription: c.alertDescription,
    };
  });

  // Sort steps: alerts first, then regular
  resultSteps.sort((a, b) => {
    const isAlertA = !!a.alertCategory || (a.daysWithoutVisit || 0) >= 60;
    const isAlertB = !!b.alertCategory || (b.daysWithoutVisit || 0) >= 60;
    if (isAlertA && !isAlertB) return -1;
    if (!isAlertA && isAlertB) return 1;
    return 0;
  });

  return resultSteps;
}
