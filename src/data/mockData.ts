import { Auditor, RouteStep, FloatingPoint, CriticalPoint, DaySchedule } from '../types';

// Crisp, high-definition Vector SVG Logo for CAVI
export const CAVI_VECTOR_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="caviLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0088ff"/>
      <stop offset="50%" stop-color="#0066cc"/>
      <stop offset="100%" stop-color="#003d82"/>
    </linearGradient>
    <linearGradient id="caviRadarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0088ff"/>
    </linearGradient>
  </defs>
  <!-- Background Shield / Hexagon Circle -->
  <circle cx="50" cy="50" r="48" fill="url(#caviLogoGrad)" stroke="#38bdf8" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="3,3" opacity="0.4"/>
  <!-- Target Rings -->
  <circle cx="50" cy="50" r="30" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.6"/>
  <circle cx="50" cy="50" r="16" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.5"/>
  <!-- Vector Compass / Diamond Core -->
  <path d="M50 16 L58 45 L87 50 L58 55 L50 84 L42 55 L13 50 L42 45 Z" fill="#ffffff" opacity="0.95"/>
  <path d="M50 24 L56 46 L78 50 L56 54 L50 76 L44 54 L22 50 L44 46 Z" fill="url(#caviRadarGrad)"/>
  <!-- Center Core -->
  <circle cx="50" cy="50" r="6" fill="#ffffff" stroke="#003d82" stroke-width="2"/>
  <circle cx="50" cy="50" r="2.5" fill="#0088ff"/>
</svg>
`)}`;

export const LOGO_URL = CAVI_VECTOR_LOGO;

import {
  CARTOON_SAMUEL_AVATAR,
  CARTOON_KLEYDER_AVATAR,
  CARTOON_JOSE_AVATAR,
  CARTOON_ADMIN_AVATAR,
} from './cartoonAvatars';

export const USER_AVATAR = CARTOON_ADMIN_AVATAR;
export const SAMUEL_AVATAR = CARTOON_SAMUEL_AVATAR;
export const KLEYDER_AVATAR = CARTOON_KLEYDER_AVATAR;
export const JOSE_AVATAR = CARTOON_JOSE_AVATAR;

export const MAP_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAkVGNnXz9T48sbePuXgGF7lzKxSTPnX72kibPBvzCcCgUc37iM4GL6UfvKIC6TL4lQ2d49FWaMy7pjUP0ATWKcOkDkwY4BHPrJhwP82E1tJBeAADGXw3v2CDPquj_GJAMfABCCroid1EiqWCzQTytunT12QOfFLEOSOlW1uMtOHT_NNwPavAey0LM4dWY06FoCfstS7Lb0PNMVVbc6fFpBhm45D-10bwHy0_OYbYLCHi3_UdI3yYa';

export const AUDITORS_DATA: Auditor[] = [
  {
    id: 'aud-1',
    name: 'Samuel Ramos Quintero',
    code: 'AUD-104',
    zone: 'Norte',
    avatar: SAMUEL_AVATAR,
    status: 'progress',
    hasAlert: false,
    visitsDone: 0,
    visitsTarget: 0,
    pointsPerDay: 0,
    auditedTotal: 0,
    effectiveness: 100,
    currentLocation: 'Sin visitas registradas hoy',
    statusText: 'Listo para asignar ruta',
    targetBreakdown: {
      cm: 0,
      pf: 0,
      cda: 0,
    },
    moraPending: 0,
  },
  {
    id: 'aud-2',
    name: 'Kleyder Rodriguez',
    code: 'AUD-209',
    zone: 'Centro',
    avatar: KLEYDER_AVATAR,
    status: 'progress',
    hasAlert: false,
    visitsDone: 0,
    visitsTarget: 0,
    pointsPerDay: 0,
    auditedTotal: 0,
    effectiveness: 100,
    currentLocation: 'Sin visitas registradas hoy',
    statusText: 'Listo para asignar ruta',
    targetBreakdown: {
      cm: 0,
      pf: 0,
      cda: 0,
    },
    moraPending: 0,
  },
  {
    id: 'aud-3',
    name: 'Jose Aponte',
    code: 'AUD-088',
    zone: 'Sur',
    avatar: JOSE_AVATAR,
    status: 'progress',
    hasAlert: false,
    visitsDone: 0,
    visitsTarget: 0,
    pointsPerDay: 0,
    auditedTotal: 0,
    effectiveness: 100,
    currentLocation: 'Sin visitas registradas hoy',
    statusText: 'Listo para asignar ruta',
    targetBreakdown: {
      cm: 0,
      pf: 0,
      cda: 0,
    },
    moraPending: 0,
  }
];

export const INITIAL_ALERT_POINTS: FloatingPoint[] = [
  {
    id: 'fp-alert-1',
    code: 'CM-108',
    name: 'Éxito Riohacha Centro',
    format: 'CM',
    address: 'Av. de los Estudiantes #12-40, Riohacha',
    municipality: 'Riohacha',
    zone: 'Norte',
    daysWithoutVisit: 84,
    lastVisitDate: '15 Junio 2026',
    alertCategory: 'sin_visita_2_3_meses',
    alertDescription: '84 días sin visita presencial (~3 meses) · Riesgo crítico de ruptura de stock y desabastecimiento',
    priority: 'Urgente',
    sla: 'SLA Crítico (<24h)',
    details: 'Mora acumulada de 84 días · Se requiere auditoría presencial y verificación física',
    hasGps: true,
  },
  {
    id: 'fp-alert-2',
    code: 'PF-042',
    name: 'Maicao Comercio Central',
    format: 'PF',
    address: 'Calle 16 #13-05, Mercado Público, Maicao',
    municipality: 'Maicao',
    zone: 'Centro',
    daysWithoutVisit: 72,
    lastVisitDate: '27 Junio 2026',
    alertCategory: 'inventario_discrepancia',
    alertDescription: '72 días sin visita (~2.5 meses) · Discrepancia de stock físico vs sistema informada por central',
    priority: 'Alta',
    sla: 'SLA Alta Prioridad (24-48h)',
    details: 'Inconsistencia de inventario en canal PF · Requiere arqueo con encargado',
    hasGps: true,
  },
  {
    id: 'fp-alert-3',
    code: 'CDA-07',
    name: 'Centro Agropecuario San Juan',
    format: 'CDA',
    address: 'Cra 6 #14-22, Salida San Juan del Cesar',
    municipality: 'San Juan del Cesar',
    zone: 'Sur',
    daysWithoutVisit: 96,
    lastVisitDate: '03 Junio 2026',
    alertCategory: 'critico_mas_3_meses',
    alertDescription: '96 días sin visita (>3 meses) · Superó límite máximo trimestral de inspección',
    priority: 'Urgente',
    sla: 'SLA Vencido Inmediato',
    details: 'Alerta Roja: Más de 3 meses sin visita · Requiere levantamiento de acta y auditoría integral',
    hasGps: true,
  },
  {
    id: 'fp-alert-4',
    code: 'CM-102',
    name: 'Tienda Ara Maicao Central',
    format: 'CM',
    address: 'Calle 16 #11-24, Maicao',
    municipality: 'Maicao',
    zone: 'Centro',
    daysWithoutVisit: 65,
    lastVisitDate: '04 Julio 2026',
    alertCategory: 'sin_visita_2_3_meses',
    alertDescription: '65 días sin visita (~2.2 meses) · Expiró ventana bimestral regular de supervisión',
    priority: 'Alta',
    sla: 'SLA Prioritario (48h)',
    details: 'Mora bimestral · Verificación seriales aduaneros y precios en góndola',
    hasGps: true,
  },
  {
    id: 'fp-alert-5',
    code: 'PF-89',
    name: 'Droguería y Variedades Manaure',
    format: 'PF',
    address: 'Av. Las Salinas #4-18, Manaure',
    municipality: 'Manaure',
    zone: 'Norte',
    daysWithoutVisit: 78,
    lastVisitDate: '21 Junio 2026',
    alertCategory: 'precio_no_conforme',
    alertDescription: '78 días sin visita (~2.6 meses) · Reporte de desvío de precios y anomalía comercial',
    priority: 'Urgente',
    sla: 'SLA Urgente (<24h)',
    details: 'Alerta comercial: Precios fuera de parámetro en canal PF · Revisión urgente',
    hasGps: true,
  },
  {
    id: 'fp-alert-6',
    code: 'CM-115',
    name: 'Super Inter Fonseca Central',
    format: 'CM',
    address: 'Calle 12 #18-35, Fonseca',
    municipality: 'Fonseca',
    zone: 'Sur',
    daysWithoutVisit: 62,
    lastVisitDate: '07 Julio 2026',
    alertCategory: 'sin_visita_2_3_meses',
    alertDescription: '62 días sin visita (~2 meses) · Requerimiento de revisión de material POP y planograma',
    priority: 'Media',
    sla: 'SLA Estándar (72h)',
    details: 'Fin de ventana bimestral · Control de exhibiciones y presencia de marca',
    hasGps: true,
  },
  {
    id: 'fp-alert-7',
    code: 'PF-33',
    name: 'Distribuidora Uribia Central',
    format: 'PF',
    address: 'Calle 3 #5-12, Plaza Principal, Uribia',
    municipality: 'Uribia',
    zone: 'Norte',
    daysWithoutVisit: 105,
    lastVisitDate: '25 Mayo 2026',
    alertCategory: 'critico_mas_3_meses',
    alertDescription: '105 días sin visita (3.5 meses) · Máxima antigüedad sin inspección presencial en La Guajira',
    priority: 'Urgente',
    sla: 'SLA Crítico Vencido',
    details: 'Ruta Alta Guajira · Prioridad 1 para asignación en el inicio de semana',
    hasGps: true,
  },
  {
    id: 'fp-alert-8',
    code: 'CM-96',
    name: 'Supertienda Villanueva Real',
    format: 'CM',
    address: 'Carrera 8 #11-50, Villanueva',
    municipality: 'Villanueva',
    zone: 'Sur',
    daysWithoutVisit: 88,
    lastVisitDate: '11 Junio 2026',
    alertCategory: 'sla_vencido',
    alertDescription: '88 días sin visita (~3 meses) · SLA vencido para homologación de precios',
    priority: 'Urgente',
    sla: 'SLA Vencido (<24h)',
    details: 'Ruta Sur Guajira · Regularización contractual y visita técnica obligatoria',
    hasGps: true,
  },
  {
    id: 'fp-alert-9',
    code: 'CM-120',
    name: 'Almacén Central Riohacha (Cerrado)',
    format: 'CM',
    address: 'Calle 14 #8-30, Riohacha',
    municipality: 'Riohacha',
    zone: 'Norte',
    daysWithoutVisit: 54,
    lastVisitDate: '18 Julio 2026',
    alertCategory: 'cerrado',
    alertDescription: 'PDV reportado cerrado en auditoría anterior · Verificación presencial y ajuste de horario comercial',
    priority: 'Local Cerrado',
    sla: 'SLA Prioritario (24h)',
    details: 'Local reportado cerrado · Requiere comprobar si opera en horario vespertino',
    hasGps: true,
  },
  {
    id: 'fp-alert-10',
    code: 'PF-55',
    name: 'Kiosko Maicao Frontera (Cerrado)',
    format: 'PF',
    address: 'Carrera 9 #15-20, Maicao',
    municipality: 'Maicao',
    zone: 'Centro',
    daysWithoutVisit: 48,
    lastVisitDate: '24 Julio 2026',
    alertCategory: 'cerrado',
    alertDescription: 'Encontrado cerrado sin notificación · Re-inspección prioritaria para validar operatividad',
    priority: 'Local Cerrado',
    sla: 'SLA Inspección Urgente',
    details: 'Punto comercial cerrado · Posible traslado o suspensión temporal',
    hasGps: true,
  },
  {
    id: 'fp-alert-11',
    code: 'CDA-14',
    name: 'Centro Distribución San Juan (Re-visita)',
    format: 'CDA',
    address: 'Km 2 Vía Valledupar, San Juan del Cesar',
    municipality: 'San Juan del Cesar',
    zone: 'Sur',
    daysWithoutVisit: 42,
    lastVisitDate: '30 Julio 2026',
    alertCategory: 'revisita',
    alertDescription: 'Reprogramado para re-visita obligatoria por discrepancia en arqueo de stock físico',
    priority: 'Re-visita Inventario',
    sla: 'SLA Re-visita (<48h)',
    details: 'Diferencias de inventario en primera visita · Levantamiento de nueva acta presencial',
    hasGps: true,
  },
  {
    id: 'fp-alert-12',
    code: 'PF-94',
    name: 'Punto Físico Manaure Salar (Re-visita)',
    format: 'PF',
    address: 'Calle 4 #6-45, Manaure',
    municipality: 'Manaure',
    zone: 'Norte',
    daysWithoutVisit: 38,
    lastVisitDate: '02 Agosto 2026',
    alertCategory: 'revisita',
    alertDescription: 'Reprogramado para re-visita por actualización técnica y validación de contrato',
    priority: 'Re-visita Inventario',
    sla: 'SLA Re-visita Programada',
    details: 'Pendiente homologación documental y firma de acta con encargado',
    hasGps: true,
  },
];

export const INITIAL_FLOATING_POINTS: FloatingPoint[] = INITIAL_ALERT_POINTS;

export const INITIAL_SAMUEL_STEPS: RouteStep[] = [];

export const CRITICAL_POINTS_LIST: CriticalPoint[] = [];

// Opcional: datos de demostración si el usuario desea explorar con un clic
export const DEMO_SAMPLE_STEPS: RouteStep[] = [
  {
    id: 'step-1',
    time: '08:30',
    code: 'CDA-04',
    format: 'CDA',
    name: 'Centro Acopio Riohacha',
    address: 'Calle 15 #12-30, Mercado Nuevo',
    status: 'completed',
    notes: 'Auditado en 42 min · Sin discrepancias',
    auditorId: 'aud-1',
    auditorName: 'Samuel Ramos Quintero'
  },
  {
    id: 'step-2',
    time: '10:00',
    code: 'PF-12',
    format: 'PF',
    name: 'Supertienda Olímpica Riohacha',
    address: 'Calle 7 #8-45, Centro',
    status: 'completed',
    notes: 'Inventario conforme · Conexión directa',
    auditorId: 'aud-1',
    auditorName: 'Samuel Ramos Quintero'
  },
  {
    id: 'step-3',
    time: '11:15',
    code: 'CM-88',
    format: 'CM',
    name: 'Éxito Viva Riohacha',
    address: 'Cra 7 #34-80, Salida a Maicao',
    status: 'in_progress',
    notes: 'En curso · GPS a 180 m',
    auditorId: 'aud-1',
    auditorName: 'Samuel Ramos Quintero'
  },
  {
    id: 'step-4',
    time: '13:30',
    code: 'CM-92',
    format: 'CM',
    name: 'Tienda D1 Manaure Salinas',
    address: 'Av. Las Salinas #4-12, Manaure',
    status: 'pending',
    sla: 'SLA: 48h restantes · Troncal del Caribe',
    distance: '24.5 km',
    auditorId: 'aud-1',
    auditorName: 'Samuel Ramos Quintero'
  },
  {
    id: 'step-5',
    time: '09:00',
    code: 'CM-51',
    format: 'CM',
    name: 'Super Inter Maicao Central',
    address: 'Calle 16 # 10-25, Maicao',
    status: 'pending',
    sla: 'SLA: 24h restantes',
    auditorId: 'aud-2',
    auditorName: 'Kleyder Rodriguez'
  },
  {
    id: 'step-6',
    time: '08:45',
    code: 'CDA-18',
    format: 'CDA',
    name: 'CDA Guajira Sur Villanueva',
    address: 'Salida a Valledupar Km 1',
    status: 'pending',
    sla: 'SLA: 48h restantes',
    auditorId: 'aud-3',
    auditorName: 'Jose Aponte'
  }
];

export const DEMO_SAMPLE_FLOATING: FloatingPoint[] = [
  {
    id: 'fp-1',
    code: 'CM-102',
    name: 'Tienda Ara Maicao Central',
    format: 'CM',
    address: 'Calle 16 #11-24, Maicao',
    priority: 'Urgente',
    sla: 'SLA Urgente (<24h)',
    details: 'Mora acumulada 81 días · Verificación seriales aduaneros'
  },
  {
    id: 'fp-2',
    code: 'PF-77',
    name: 'Droguería Humanitaria San Juan',
    format: 'PF',
    address: 'Calle 7 #5-18, San Juan del Cesar',
    priority: 'Media',
    sla: 'Prioridad Media (48h)',
    details: 'Inspección de inventario farmacológico y arqueo'
  }
];

export const DEMO_CRITICAL_POINTS_LIST: CriticalPoint[] = [
  {
    id: 'cp-1',
    code: 'CM-108',
    name: 'Éxito Riohacha Centro',
    format: 'CM',
    address: 'Av. de los Estudiantes #12-40',
    zone: 'Zona Norte',
    daysPending: 84,
    priority: 'Alta',
    lastAuditedDate: '24 Julio 2024',
    assignedTo: 'Samuel Ramos Quintero'
  },
  {
    id: 'cp-2',
    code: 'PF-042',
    name: 'Maicao Comercio Central',
    format: 'PF',
    address: 'Calle 16 #13-05',
    zone: 'Zona Centro',
    daysPending: 72,
    priority: 'Re-visita Inventario',
    lastAuditedDate: '05 Agosto 2024',
    assignedTo: 'Kleyder Rodriguez'
  }
];

export const CALENDAR_DAYS: DaySchedule[] = [
  { day: 1, visits: 24, status: 'normal' },
  { day: 2, visits: 26, status: 'normal' },
  { day: 3, visits: 25, status: 'normal' },
  { day: 4, visits: 19, status: 'alert', note: '19 visitas · Desfase operacional' },
  { day: 5, visits: 0, status: 'normal' },
  { day: 6, visits: 0, status: 'normal' },
  { day: 7, visits: 27, status: 'normal' },
  { day: 8, visits: 28, status: 'normal' },
  { day: 9, visits: 22, status: 'warning' },
  { day: 10, visits: 26, status: 'normal' },
  { day: 11, visits: 27, status: 'normal' },
  { day: 12, visits: 0, status: 'normal' },
  { day: 13, visits: 0, status: 'normal' },
  { day: 14, visits: 28, status: 'normal' },
  { day: 15, visits: 27, status: 'normal' },
  { day: 16, visits: 26, status: 'normal' },
  { day: 17, visits: 27, status: 'today', note: 'Jornada Actual · 27 visitas' },
  { day: 18, visits: 26, status: 'normal' },
  { day: 19, visits: 0, status: 'normal' },
  { day: 20, visits: 0, status: 'normal' },
  { day: 21, visits: 21, status: 'warning' },
  { day: 22, visits: 27, status: 'normal' },
  { day: 23, visits: 26, status: 'normal' },
  { day: 24, visits: 28, status: 'normal' },
  { day: 25, visits: 23, status: 'warning' },
  { day: 26, visits: 0, status: 'normal' },
  { day: 27, visits: 0, status: 'normal' },
  { day: 28, visits: 26, status: 'normal' },
  { day: 29, visits: 27, status: 'normal' },
  { day: 30, visits: 26, status: 'normal' },
  { day: 31, visits: 25, status: 'normal' },
];
