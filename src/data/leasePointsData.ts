import { LeasePoint, DayHours, WeeklySchedule } from '../types';

export const DEFAULT_WEEKDAY_HOURS: DayHours = {
  open: '08:00',
  close: '18:00',
  isOpen: true,
  hasLunchBreak: true,
  lunchStart: '12:30',
  lunchEnd: '14:00',
};

export const CONTINUOUS_HOURS: DayHours = {
  open: '07:30',
  close: '19:00',
  isOpen: true,
  hasLunchBreak: false,
};

export const SATURDAY_HOURS: DayHours = {
  open: '08:30',
  close: '13:00',
  isOpen: true,
  hasLunchBreak: false,
};

export const CLOSED_DAY: DayHours = {
  open: '00:00',
  close: '00:00',
  isOpen: false,
  hasLunchBreak: false,
};

export const SUNDAY_HALF_DAY: DayHours = {
  open: '09:00',
  close: '13:00',
  isOpen: true,
  hasLunchBreak: false,
};

export function createStandardSchedule(
  weekday: DayHours = DEFAULT_WEEKDAY_HOURS,
  saturday: DayHours = SATURDAY_HOURS,
  sunday: DayHours = CLOSED_DAY,
  holidayNote: string = 'Cerrado en días festivos nacionales'
): WeeklySchedule {
  return {
    monday: { ...weekday },
    tuesday: { ...weekday },
    wednesday: { ...weekday },
    thursday: { ...weekday },
    friday: { ...weekday },
    saturday: { ...saturday },
    sunday: { ...sunday },
    holidayNote,
  };
}

export const INITIAL_LEASE_POINTS: LeasePoint[] = [
  {
    id: 'arr-001',
    code: 'ARR-RIO-001',
    name: 'Sede Principal Riohacha Centro',
    propertyType: 'Local Comercial',
    operatingStatus: 'open',
    address: 'Calle 15 #8-42, Centro Histórico',
    neighborhood: 'Centro',
    municipality: 'Riohacha',
    department: 'La Guajira',
    reference: 'A 50 metros del Parque Padilla y Banco de la República',
    lat: 11.5442,
    lng: -72.9069,
    schedule: createStandardSchedule(
      { open: '08:00', close: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:30', lunchEnd: '14:00' },
      { open: '08:30', close: '13:30', isOpen: true, hasLunchBreak: false },
      CLOSED_DAY,
      'Cerrado domingos y festivos'
    ),
    contractNumber: 'CTR-2024-RIO-01',
    monthlyRent: 4800000,
    adminFee: 320000,
    contractStartDate: '2023-01-15',
    contractEndDate: '2026-12-31',
    areaSqMeters: 125,
    landlord: {
      name: 'Inversiones y Arrendamientos Guajira S.A.S.',
      phone: '+57 301 458 9201',
      email: 'arriendos@inverguajira.com',
      documentId: 'NIT 900.542.110-4',
      contactPerson: 'Dra. Carmen Cecilia Curiel',
    },
    electricMeter: 'AIR-E #88492014',
    waterMeter: 'ASAA #192044',
    lastAuditDate: '2026-09-18',
    lastAuditorName: 'Samuel Ramos Quintero',
    incidents: [
      {
        id: 'inc-101',
        date: '2026-09-10',
        time: '08:45',
        type: 'Retraso en apertura',
        description: 'Apertura retrasada 45 minutos por entrega de llaves al personal de turno.',
        reportedBy: 'Samuel Ramos',
        resolved: true,
        resolutionNotes: 'Protocolo de llaves asignado con duplicado de seguridad.',
      },
    ],
  },
  {
    id: 'arr-002',
    code: 'ARR-MAI-002',
    name: 'Punto Frontera Maicao Zona Comercio',
    propertyType: 'Local Comercial',
    operatingStatus: 'open',
    address: 'Calle 13 #11-25, Sector Comercial',
    neighborhood: 'El Comercio',
    municipality: 'Maicao',
    department: 'La Guajira',
    reference: 'Frente al Mercado Municipal y Pasaje Comercial San José',
    lat: 11.3789,
    lng: -72.2412,
    schedule: createStandardSchedule(
      { open: '07:30', close: '18:30', isOpen: true, hasLunchBreak: false },
      { open: '08:00', close: '15:00', isOpen: true, hasLunchBreak: false },
      { open: '09:00', close: '13:00', isOpen: true, hasLunchBreak: false },
      'Opera jornada continua festivos de 08:00 a 13:00'
    ),
    contractNumber: 'CTR-2023-MAI-09',
    monthlyRent: 5200000,
    contractStartDate: '2023-04-01',
    contractEndDate: '2027-03-31',
    areaSqMeters: 140,
    landlord: {
      name: 'Hassan & Hermanos Inmobiliaria',
      phone: '+57 312 667 4410',
      email: 'propiedades@hassanmaicao.com',
      documentId: 'CC 17.892.403',
      contactPerson: 'Farid Hassan Mansour',
    },
    electricMeter: 'AIR-E #6730192',
    waterMeter: 'AGUAS-MAI #44091',
    lastAuditDate: '2026-09-22',
    lastAuditorName: 'Kleyder Rodriguez',
    incidents: [],
  },
  {
    id: 'arr-003',
    code: 'ARR-URI-003',
    name: 'Atención Territorial Uribia Capital Wayuu',
    propertyType: 'Local Comercial',
    operatingStatus: 'temporarily_closed',
    manualOverrideStatus: 'force_closed',
    statusNotes: 'Cerrado temporal por falla en transformador eléctrico sectorial',
    address: 'Carrera 8 #14-30, Plaza Colombia',
    neighborhood: 'Centro Indígena',
    municipality: 'Uribia',
    department: 'La Guajira',
    reference: 'Diagonal a la Alcaldía Municipal y Banco Agrario',
    lat: 11.7139,
    lng: -72.2658,
    schedule: createStandardSchedule(
      { open: '08:00', close: '17:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '14:00' },
      { open: '08:00', close: '12:00', isOpen: true, hasLunchBreak: false },
      CLOSED_DAY,
      'Cerrado festivos'
    ),
    contractNumber: 'CTR-2024-URI-03',
    monthlyRent: 3100000,
    contractStartDate: '2024-02-01',
    contractEndDate: '2027-01-31',
    areaSqMeters: 85,
    landlord: {
      name: 'Rosiris Epinayu Uriana',
      phone: '+57 318 903 1245',
      email: 'rosiris.epinayu@gmail.com',
      documentId: 'CC 40.829.112',
      contactPerson: 'Rosiris Epinayu',
    },
    electricMeter: 'AIR-E #9910482',
    waterMeter: 'POZO-PRIVADO-01',
    lastAuditDate: '2026-09-25',
    lastAuditorName: 'Samuel Ramos Quintero',
    incidents: [
      {
        id: 'inc-102',
        date: '2026-09-28',
        time: '11:15',
        type: 'Corte de energía / agua',
        description: 'Caída de fase eléctrica en el transformador de la Cra 8. Técnico AIR-E programado.',
        reportedBy: 'Samuel Ramos Quintero',
        resolved: false,
      },
    ],
  },
  {
    id: 'arr-004',
    code: 'ARR-MAN-004',
    name: 'Módulo Operativo Manaure Las Salinas',
    propertyType: 'Taquilla / Kiosko',
    operatingStatus: 'open',
    address: 'Av. Las Salinas #4-18, Frente al Muelle',
    neighborhood: 'Las Salinas',
    municipality: 'Manaure',
    department: 'La Guajira',
    reference: 'A 100m de los depósitos salineros Bigotes',
    lat: 11.7765,
    lng: -72.4468,
    schedule: createStandardSchedule(
      { open: '08:00', close: '16:30', isOpen: true, hasLunchBreak: true, lunchStart: '12:30', lunchEnd: '13:30' },
      { open: '08:00', close: '12:30', isOpen: true, hasLunchBreak: false },
      CLOSED_DAY,
      'Cerrado en festivos'
    ),
    contractNumber: 'CTR-2024-MAN-02',
    monthlyRent: 1900000,
    contractStartDate: '2024-05-15',
    contractEndDate: '2026-11-15',
    areaSqMeters: 38,
    landlord: {
      name: 'Salinas & Logística del Caribe S.A.S.',
      phone: '+57 300 782 1190',
      email: 'operaciones@salinascaribe.co',
      documentId: 'NIT 890.301.992-1',
      contactPerson: 'Ing. Fabio Redondo',
    },
    electricMeter: 'AIR-E #1289401',
    waterMeter: 'N/A Tanque',
    lastAuditDate: '2026-09-14',
    lastAuditorName: 'Samuel Ramos Quintero',
    incidents: [],
  },
  {
    id: 'arr-005',
    code: 'ARR-FON-005',
    name: 'Sede Comercial Fonseca Valle Real',
    propertyType: 'Local Comercial',
    operatingStatus: 'open',
    address: 'Calle 13 #18-05, Centro Fonseca',
    neighborhood: 'El Carmen',
    municipality: 'Fonseca',
    department: 'La Guajira',
    reference: 'Esquina frente a la Iglesia San Agustín',
    lat: 10.8872,
    lng: -72.8483,
    schedule: createStandardSchedule(
      { open: '08:00', close: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '14:00' },
      { open: '08:30', close: '13:00', isOpen: true, hasLunchBreak: false },
      CLOSED_DAY,
      'Cerrado festivos'
    ),
    contractNumber: 'CTR-2023-FON-07',
    monthlyRent: 3500000,
    adminFee: 180000,
    contractStartDate: '2023-08-01',
    contractEndDate: '2027-07-31',
    areaSqMeters: 92,
    landlord: {
      name: 'Inmobiliaria Sol del Cesar & Guajira',
      phone: '+57 315 722 8904',
      email: 'arriendos@soldelcesar.com',
      documentId: 'NIT 901.120.449-3',
      contactPerson: 'Lic. Gonzalo Daza',
    },
    electricMeter: 'AIR-E #3390214',
    waterMeter: 'VEOLIA-FON #55812',
    lastAuditDate: '2026-09-19',
    lastAuditorName: 'Jose Aponte',
    incidents: [],
  },
  {
    id: 'arr-006',
    code: 'ARR-SJC-006',
    name: 'Agencia San Juan del Cesar',
    propertyType: 'Local Comercial',
    operatingStatus: 'open',
    address: 'Carrera 7 #6-40, Sector Comercial',
    neighborhood: 'Centro',
    municipality: 'San Juan del Cesar',
    department: 'La Guajira',
    reference: 'A media cuadra de la Plaza Santander',
    lat: 10.7711,
    lng: -73.0028,
    schedule: createStandardSchedule(
      { open: '08:00', close: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:30', lunchEnd: '14:00' },
      { open: '08:00', close: '12:30', isOpen: true, hasLunchBreak: false },
      CLOSED_DAY,
      'Cerrado domingos y festivos'
    ),
    contractNumber: 'CTR-2024-SJC-04',
    monthlyRent: 3800000,
    contractStartDate: '2024-03-01',
    contractEndDate: '2026-10-31',
    areaSqMeters: 110,
    landlord: {
      name: 'Beatriz Cuello de Ariza',
      phone: '+57 311 405 9182',
      email: 'beatriz.cuello@hotmail.com',
      documentId: 'CC 26.940.119',
      contactPerson: 'Beatriz Cuello',
    },
    electricMeter: 'AIR-E #7712093',
    waterMeter: 'EMSERPU-SJC #88190',
    lastAuditDate: '2026-09-24',
    lastAuditorName: 'Jose Aponte',
    incidents: [],
  },
  {
    id: 'arr-007',
    code: 'ARR-VIL-007',
    name: 'Punto Cuna de Acordeones Villanueva',
    propertyType: 'Local Comercial',
    operatingStatus: 'open',
    address: 'Calle 11 #10-15, Zona Céntrica',
    neighborhood: 'El Cafetal',
    municipality: 'Villanueva',
    department: 'La Guajira',
    reference: 'Frente al Parque de la Música',
    lat: 10.6078,
    lng: -72.9772,
    schedule: createStandardSchedule(
      { open: '08:00', close: '17:30', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '14:00' },
      { open: '08:30', close: '12:30', isOpen: true, hasLunchBreak: false },
      CLOSED_DAY,
      'Cerrado festivos'
    ),
    contractNumber: 'CTR-2023-VIL-05',
    monthlyRent: 2900000,
    contractStartDate: '2023-11-01',
    contractEndDate: '2026-10-31',
    areaSqMeters: 78,
    landlord: {
      name: 'Guillermo Enrique Orozco Maestre',
      phone: '+57 301 234 5678',
      email: 'guillermoorozco@yahoo.es',
      documentId: 'CC 84.102.940',
      contactPerson: 'Guillermo Orozco',
    },
    electricMeter: 'AIR-E #5501928',
    waterMeter: 'ACUAVILL #34901',
    lastAuditDate: '2026-09-26',
    lastAuditorName: 'Jose Aponte',
    incidents: [],
  },
  {
    id: 'arr-008',
    code: 'ARR-ALB-008',
    name: 'Módulo Minero Albania Cerrejón',
    propertyType: 'Oficina Administrativa',
    operatingStatus: 'open',
    address: 'Calle 4 #6-22, Barrio La Unión',
    neighborhood: 'La Unión',
    municipality: 'Albania',
    department: 'La Guajira',
    reference: 'En la vía de acceso al complejo habitacional Mushaisa',
    lat: 11.1611,
    lng: -72.5928,
    schedule: createStandardSchedule(
      { open: '07:00', close: '17:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:00' },
      { open: '07:30', close: '12:30', isOpen: true, hasLunchBreak: false },
      CLOSED_DAY,
      'Cerrado festivos'
    ),
    contractNumber: 'CTR-2024-ALB-01',
    monthlyRent: 2600000,
    contractStartDate: '2024-01-01',
    contractEndDate: '2027-12-31',
    areaSqMeters: 65,
    landlord: {
      name: 'Inversiones Mineras de La Guajira',
      phone: '+57 314 559 1022',
      email: 'contacto@invermineraguajira.com',
      documentId: 'NIT 900.881.042-8',
      contactPerson: 'Carlos Mario Bonilla',
    },
    electricMeter: 'AIR-E #4489102',
    waterMeter: 'AGUAS-ALB #11928',
    lastAuditDate: '2026-09-20',
    lastAuditorName: 'Kleyder Rodriguez',
    incidents: [],
  },
  {
    id: 'arr-009',
    code: 'ARR-RIO-009',
    name: 'Isla Comercial Centro Comercial Guajira Plaza',
    propertyType: 'Isla Comercial',
    operatingStatus: 'open',
    address: 'Av. Circunvalar #15-80, Local Isla 204',
    neighborhood: 'Boca Grande',
    municipality: 'Riohacha',
    department: 'La Guajira',
    reference: 'Pasillo Principal frente a Salas de Cine',
    lat: 11.5365,
    lng: -72.9155,
    schedule: createStandardSchedule(
      { open: '09:00', close: '20:30', isOpen: true, hasLunchBreak: false },
      { open: '09:00', close: '21:00', isOpen: true, hasLunchBreak: false },
      { open: '10:00', close: '19:00', isOpen: true, hasLunchBreak: false },
      'Abierto domingos y festivos jornada continua 10:00 a 19:00'
    ),
    contractNumber: 'CTR-2024-RIO-ISLA04',
    monthlyRent: 4200000,
    adminFee: 650000,
    contractStartDate: '2024-06-01',
    contractEndDate: '2027-05-31',
    areaSqMeters: 24,
    landlord: {
      name: 'Fideicomiso Comercial Guajira Plaza',
      phone: '+57 300 998 7612',
      email: 'administracion@guajiraplaza.com',
      documentId: 'NIT 901.340.551-7',
      contactPerson: 'Dra. Paola Vence',
    },
    electricMeter: 'SUB-MEDIDOR-ISLA-204',
    waterMeter: 'Servicio Común C.C.',
    lastAuditDate: '2026-09-27',
    lastAuditorName: 'Samuel Ramos Quintero',
    incidents: [],
  },
  {
    id: 'arr-010',
    code: 'ARR-MAI-010',
    name: 'Bodega Logística y Acopio Maicao Pista',
    propertyType: 'Centro de Distribución / Bodega',
    operatingStatus: 'maintenance',
    manualOverrideStatus: 'force_closed',
    statusNotes: 'Mantenimiento estructural en cubierta e impermeabilización por temporada de lluvias',
    address: 'Vía Paraguachón Km 2, Parque Industrial La Frontera',
    neighborhood: 'Sector Aeropuerto Antiguo',
    municipality: 'Maicao',
    department: 'La Guajira',
    reference: 'Junto a la estación de servicio Texaco La Pista',
    lat: 11.3654,
    lng: -72.2215,
    schedule: createStandardSchedule(
      { open: '07:00', close: '17:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:00' },
      { open: '07:30', close: '13:00', isOpen: true, hasLunchBreak: false },
      CLOSED_DAY,
      'Cerrado domingos y festivos'
    ),
    contractNumber: 'CTR-2022-MAI-BDG01',
    monthlyRent: 7500000,
    contractStartDate: '2022-10-01',
    contractEndDate: '2026-09-30',
    areaSqMeters: 450,
    landlord: {
      name: 'Logística & Bodegas Colombo-Venezolanas Ltda.',
      phone: '+57 310 882 4490',
      email: 'almacenes@colombovenezolana.com',
      documentId: 'NIT 890.992.115-0',
      contactPerson: 'Don Jairo Benjumea',
    },
    electricMeter: 'AIR-E #TRIFASICO-99120',
    waterMeter: 'POZO-SUBTERRANEO-B01',
    lastAuditDate: '2026-09-12',
    lastAuditorName: 'Kleyder Rodriguez',
    incidents: [
      {
        id: 'inc-103',
        date: '2026-09-23',
        time: '14:30',
        type: 'Mantenimiento preventivo',
        description: 'Inicio de labores de retejado y cambio de bajantes pluviales. Afecta acceso de camiones.',
        reportedBy: 'Kleyder Rodriguez',
        resolved: false,
      },
    ],
  },
  {
    id: 'arr-011',
    code: 'ARR-HAT-011',
    name: 'Punto Hatonuevo Los Almendros',
    propertyType: 'Local Comercial',
    operatingStatus: 'open',
    address: 'Calle 12 #15-30, Barrio Los Almendros',
    neighborhood: 'Los Almendros',
    municipality: 'Hatonuevo',
    department: 'La Guajira',
    reference: 'Diagonal a la Notaría Única de Hatonuevo',
    lat: 11.0664,
    lng: -72.7639,
    schedule: createStandardSchedule(
      { open: '08:00', close: '17:30', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
      { open: '08:00', close: '12:30', isOpen: true, hasLunchBreak: false },
      CLOSED_DAY,
      'Cerrado festivos'
    ),
    contractNumber: 'CTR-2024-HAT-02',
    monthlyRent: 2400000,
    contractStartDate: '2024-04-01',
    contractEndDate: '2026-11-30',
    areaSqMeters: 62,
    landlord: {
      name: 'Jaime Alberto Ortiz Gámez',
      phone: '+57 316 492 8810',
      email: 'jaime.ortiz.gamez@gmail.com',
      documentId: 'CC 84.092.331',
      contactPerson: 'Jaime Ortiz',
    },
    electricMeter: 'AIR-E #2290194',
    waterMeter: 'AGUAS-SUR #7728',
    lastAuditDate: '2026-09-21',
    lastAuditorName: 'Kleyder Rodriguez',
    incidents: [],
  },
  {
    id: 'arr-012',
    code: 'ARR-DIB-012',
    name: 'Módulo Costero Dibulla Palomino',
    propertyType: 'Local Comercial',
    operatingStatus: 'open',
    address: 'Calle Principal Km 72 Troncal del Caribe',
    neighborhood: 'Entrada Palomino',
    municipality: 'Dibulla',
    department: 'La Guajira',
    reference: 'Frente al CAI Turístico de Palomino',
    lat: 11.2519,
    lng: -73.5601,
    schedule: createStandardSchedule(
      { open: '08:30', close: '19:00', isOpen: true, hasLunchBreak: false },
      { open: '08:30', close: '19:30', isOpen: true, hasLunchBreak: false },
      { open: '09:00', close: '17:00', isOpen: true, hasLunchBreak: false },
      'Opera domingos y festivos por flujo turístico'
    ),
    contractNumber: 'CTR-2024-DIB-01',
    monthlyRent: 3600000,
    contractStartDate: '2024-01-10',
    contractEndDate: '2027-01-09',
    areaSqMeters: 75,
    landlord: {
      name: 'Inmobiliaria Costa Sierra Nevada',
      phone: '+57 320 671 9044',
      email: 'arriendos@costasierranevada.com',
      documentId: 'NIT 901.442.901-5',
      contactPerson: 'Sra. Astrid Meza',
    },
    electricMeter: 'AIR-E #5591024',
    waterMeter: 'ACUEDUCTO-PALOMINO #0912',
    lastAuditDate: '2026-09-17',
    lastAuditorName: 'Samuel Ramos Quintero',
    incidents: [],
  },
];

/** Determina el ciclo de vida contractual del inmueble, separado del horario diario. */
export function getLeaseLifecycleStatus(point: LeasePoint, referenceDate: Date = new Date()): {
  lifecycleStatus: 'active' | 'inactive';
  inactivityReason?: LeasePoint['inactivityReason'];
  inactivityLabel?: string;
} {
  if (point.inactivityReason) {
    const labels: Record<NonNullable<LeasePoint['inactivityReason']>, string> = {
      contract_cancelled: 'Contrato cancelado',
      contract_expired: 'Contrato de arrendamiento vencido',
      lease_terminated: 'Arrendamiento terminado',
      closed_by_administration: 'Cerrado por administración',
      other: 'Inactivo por otra razón',
    };
    return { lifecycleStatus: 'inactive', inactivityReason: point.inactivityReason, inactivityLabel: labels[point.inactivityReason] };
  }
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const end = new Date(point.contractEndDate + 'T23:59:59');
  if (point.operatingStatus === 'contract_ended' || end < today) {
    return { lifecycleStatus: 'inactive', inactivityReason: 'contract_expired', inactivityLabel: 'Contrato de arrendamiento vencido' };
  }
  return { lifecycleStatus: 'active' };
}

/**
 * Calculates current real-time open / closed status for a leased point.
 */
export function evaluatePointOpenStatus(
  point: LeasePoint,
  referenceDate: Date = new Date()
): {
  isOpenNow: boolean;
  statusCategory: 'open' | 'closed' | 'lunch' | 'maintenance' | 'temporarily_closed' | 'contract_ended';
  statusBadgeText: string;
  statusDescription: string;
  timeContext: string;
  todayHours: DayHours;
  dayName: string;
} {
  if (point.operatingStatus === 'contract_ended') {
    return {
      isOpenNow: false,
      statusCategory: 'contract_ended',
      statusBadgeText: 'Contrato Vencido',
      statusDescription: 'Inmueble desocupado / finalización de contrato de arrendamiento',
      timeContext: 'No operativo',
      todayHours: CLOSED_DAY,
      dayName: 'N/A',
    };
  }

  if (point.operatingStatus === 'maintenance') {
    return {
      isOpenNow: false,
      statusCategory: 'maintenance',
      statusBadgeText: 'En Mantenimiento',
      statusDescription: point.statusNotes || 'Inmueble cerrado por trabajos de adecuación física',
      timeContext: 'Mantenimiento en curso',
      todayHours: CLOSED_DAY,
      dayName: 'N/A',
    };
  }

  if (point.operatingStatus === 'temporarily_closed' || point.manualOverrideStatus === 'force_closed') {
    return {
      isOpenNow: false,
      statusCategory: 'temporarily_closed',
      statusBadgeText: 'Cierre Temporal / Novedad',
      statusDescription: point.statusNotes || 'Cierre registrado por novedad operativa o fuerza mayor',
      timeContext: 'Reportado con Novedad',
      todayHours: CLOSED_DAY,
      dayName: 'N/A',
    };
  }

  const dayIndex = referenceDate.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const dayKeys: (keyof WeeklySchedule)[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayKey = dayKeys[dayIndex];
  const dayName = dayLabels[dayIndex];
  const scheduleForToday = point.schedule[dayKey] as DayHours;

  if (!scheduleForToday || !scheduleForToday.isOpen) {
    return {
      isOpenNow: false,
      statusCategory: 'closed',
      statusBadgeText: 'Cerrado Hoy',
      statusDescription: `No abre los días ${dayName.toLowerCase()}s`,
      timeContext: 'Cerrado todo el día',
      todayHours: scheduleForToday || CLOSED_DAY,
      dayName,
    };
  }

  const currentHours = referenceDate.getHours();
  const currentMinutes = referenceDate.getMinutes();
  const currentMinutesTotal = currentHours * 60 + currentMinutes;

  const [openH, openM] = scheduleForToday.open.split(':').map(Number);
  const openMinutesTotal = openH * 60 + openM;

  const [closeH, closeM] = scheduleForToday.close.split(':').map(Number);
  const closeMinutesTotal = closeH * 60 + closeM;

  if (scheduleForToday.hasLunchBreak && scheduleForToday.lunchStart && scheduleForToday.lunchEnd) {
    const [lunchStartH, lunchStartM] = scheduleForToday.lunchStart.split(':').map(Number);
    const lunchStartTotal = lunchStartH * 60 + lunchStartM;

    const [lunchEndH, lunchEndM] = scheduleForToday.lunchEnd.split(':').map(Number);
    const lunchEndTotal = lunchEndH * 60 + lunchEndM;

    if (currentMinutesTotal >= lunchStartTotal && currentMinutesTotal < lunchEndTotal) {
      const minutesToResume = lunchEndTotal - currentMinutesTotal;
      return {
        isOpenNow: false,
        statusCategory: 'lunch',
        statusBadgeText: 'Almuerzo / Receso',
        statusDescription: `Cerrado por jornada de almuerzo (${scheduleForToday.lunchStart} - ${scheduleForToday.lunchEnd})`,
        timeContext: `Reanuda a las ${scheduleForToday.lunchEnd} (${minutesToResume} min)`,
        todayHours: scheduleForToday,
        dayName,
      };
    }
  }

  if (currentMinutesTotal < openMinutesTotal) {
    const diff = openMinutesTotal - currentMinutesTotal;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    const timeLeftStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

    return {
      isOpenNow: false,
      statusCategory: 'closed',
      statusBadgeText: 'Cerrado',
      statusDescription: `Abre hoy a las ${scheduleForToday.open}`,
      timeContext: `Abre en ${timeLeftStr}`,
      todayHours: scheduleForToday,
      dayName,
    };
  }

  if (currentMinutesTotal >= closeMinutesTotal) {
    return {
      isOpenNow: false,
      statusCategory: 'closed',
      statusBadgeText: 'Cerrado',
      statusDescription: `Cerró hoy a las ${scheduleForToday.close}`,
      timeContext: 'Jornada finalizada',
      todayHours: scheduleForToday,
      dayName,
    };
  }

  const diffToClose = closeMinutesTotal - currentMinutesTotal;
  const hoursLeft = Math.floor(diffToClose / 60);
  const minsLeft = diffToClose % 60;
  const closeTimeStr = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft} min`;

  return {
    isOpenNow: true,
    statusCategory: 'open',
    statusBadgeText: 'Abierto Ahora',
    statusDescription: `Jornada regular hoy: ${scheduleForToday.open} - ${scheduleForToday.close}`,
    timeContext: `Cierra a las ${scheduleForToday.close} (en ${closeTimeStr})`,
    todayHours: scheduleForToday,
    dayName,
  };
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getContractDaysRemaining(endDateStr: string): {
  days: number;
  status: 'valid' | 'expiring_soon' | 'expired';
  label: string;
} {
  const end = new Date(endDateStr);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: diffDays, status: 'expired', label: `Vencido hace ${Math.abs(diffDays)} días` };
  }
  if (diffDays <= 90) {
    return { days: diffDays, status: 'expiring_soon', label: `Por vencer en ${diffDays} días` };
  }
  return { days: diffDays, status: 'valid', label: `${diffDays} días de vigencia` };
}
