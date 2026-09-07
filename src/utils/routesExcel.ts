import * as XLSX from 'xlsx';
import { RouteStep, FormatType, Auditor } from '../types';

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
    'SLA_Observaciones'
  ];

  const sampleRows = [
    ['PDV-01', 'Supertienda Olímpica Centro', 'Supermercados', 'CM', 'Lunes', 'Samuel Ramos Quintero', 'Calle 15 #8-20', 'Riohacha', 11.5442, -72.9069, '08:30', 'SLA: 24h · Prioridad Alta'],
    ['PDV-02', 'Tienda y Abarrotes La Gran Parada', 'Tradicional', 'PF', 'Martes', 'Kleyder Rodriguez', 'Carrera 11 #14-30', 'Maicao', 11.3778, -72.2389, '10:15', 'SLA: 48h · Canal Tradicional'],
    ['PDV-03', 'Droguería La Economía San Juan', 'Droguerías', 'PF', 'Miércoles', 'Jose Aponte', 'Calle 5 #6-12', 'San Juan del Cesar', 10.7711, -73.0025, '13:00', 'SLA: 24h · Inventario'],
    ['PDV-04', 'D1 Mercado Público Fonseca', 'Hard Discount', 'CM', 'Jueves', 'Jose Aponte', 'Carrera 18 #12-40', 'Fonseca', 10.8861, -72.8515, '14:45', 'SLA: 48h · Exhibición'],
    ['PDV-05', 'Distribuidora Mayorista El Maná', 'Mayorista', 'CDA', 'Viernes', 'Kleyder Rodriguez', 'Calle 16 #22-10', 'Maicao', 11.3812, -72.2450, '16:00', 'SLA: 24h · Re-visita'],
    ['PDV-06', 'Minimarket Los Laureles', 'Conveniencia', 'PF', 'Lunes', 'Samuel Ramos Quintero', 'Calle 12 #4-55', 'Uribia', 11.7139, -72.2660, '09:00', 'SLA: 48h · Cobertura Alta Guajira'],
    ['PDV-07', 'Super Éxito Salinas', 'Supermercados', 'CM', 'Martes', 'Samuel Ramos Quintero', 'Avenida de la Sal #3-18', 'Manaure', 11.7792, -72.4494, '11:30', 'SLA: 24h · Auditoría Promo'],
    ['PDV-08', 'Centro de Acopio Villanueva', 'CDA', 'CDA', 'Miércoles', 'Jose Aponte', 'Carrera 8 #10-05', 'Villanueva', 10.6056, -72.9789, '16:30', 'SLA: 24h · Entrega Logística'],
    ['PDV-09', 'Supermercado Central Albania', 'Supermercados', 'CM', 'Jueves', 'Kleyder Rodriguez', 'Calle 4 #7-19', 'Albania', 11.1611, -72.5928, '11:00', 'SLA: 24h · Auditoría Stock'],
    ['PDV-10', 'Abarrotes y Granero Hatonuevo', 'Tradicional', 'PF', 'Viernes', 'Kleyder Rodriguez', 'Carrera 9 #5-12', 'Hatonuevo', 11.0617, -72.7633, '14:00', 'SLA: 48h · Canal Tradicional']
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
  const parsedSteps: RouteStep[] = [];

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

    // 8. Assigned Auditor
    const auditorRaw = getVal(['auditor', 'auditorasignado', 'responsable', 'asesor', 'zona']);
    let matchedAuditor = auditors.find((a) =>
      a.name.toLowerCase().includes(auditorRaw.toLowerCase()) ||
      a.zone.toLowerCase() === auditorRaw.toLowerCase() ||
      a.code.toLowerCase() === auditorRaw.toLowerCase()
    );

    if (!matchedAuditor) {
      matchedAuditor = auditors[index % auditors.length] || auditors[0];
    }

    // 9. Day of week (Lunes a Viernes)
    const dayRaw = getVal(['dia', 'diasemana', 'dia_semana', 'day', 'jornada']).toLowerCase();
    let day: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' = 'martes';
    if (dayRaw.includes('lun')) day = 'lunes';
    else if (dayRaw.includes('mar')) day = 'martes';
    else if (dayRaw.includes('mie') || dayRaw.includes('mié')) day = 'miércoles';
    else if (dayRaw.includes('jue')) day = 'jueves';
    else if (dayRaw.includes('vie')) day = 'viernes';
    else {
      const daysCycle: Array<'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes'> = [
        'lunes', 'martes', 'miércoles', 'jueves', 'viernes'
      ];
      day = daysCycle[index % daysCycle.length];
    }

    parsedSteps.push({
      id: `step-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
      code,
      name,
      channel,
      format,
      day,
      address: fullAddress,
      municipality: municipality || 'La Guajira',
      lat,
      lng,
      hasGps,
      time,
      sla,
      status: 'pending',
      auditorId: matchedAuditor?.id || 'aud-1',
      auditorName: matchedAuditor?.name || 'Samuel Ramos Quintero',
    });
  });

  return parsedSteps;
}
