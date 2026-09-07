import { Auditor, RouteStep, FloatingPoint, CriticalPoint, DaySchedule } from '../types';

export const LOGO_URL = '/Caviperfil.jpg';

export const USER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCY4JQs4rxbRafcfGhS3lfAG64ef9Qd367zYkwTXG6MxfoiePWNBX1eFW0obP9uaGagumqxWGoPsgH9h8_gs8oEKE4fyGmFsyAmPvZ4cm0NXZ_GkC6gAYvYihEJkv8aT8Ov6WgVwJa7yWCafvH5z-2-hZ-1xLXLq2iw-CVQZcwQpMe8rNYo05nndmNlTCn20G0_WXVgqzWN9Hd6qPBakKXdc9p8x0k27o-Jwo39jUBVo0S51VBUBYkR';

export const SAMUEL_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyvW6_RFCcFCVSL7hGvqnR81k2Q2Gc9TpTlySrCtBPNT_5Xrl0eE33mOb79Id9psAJwiBZ1lHqtisHXEom8Ot2GWl8iMHiSdl-p91yvnI78kghhMjlCFExbdPkO5mWHuAjskGKV_gI3jw37MpIP1bAmLWglN5Z-TFQpQlHKew0X9jqO3EvJp6fQD_6UvWAw3znSV2VEOQY6q5yHfzKw8PJRdv5zkk7vLoIRdEi180CbkvOaWUyF3FY';

export const KLEYDER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5Ik1NlZAoTX_ao_AB6MZPFrqHgxRwOyIG4cNbtP1MdPXonSAKk2vEvoibY1jK5AKWKuO1iptSJ8-BjJYtYYIhy_z_EWgqQDqURraMYlxgpwTGI7X2lDmuzAFL0c_i6LhHImTv_cSj5J8Rn4kw14xQIV3dj8FA-702DiUzr1tqlJ74H0k9V6SKlrDFGDoTKe0E7GRsGOZgdXTGfEWstl6V83pDoPLA8PiuohEND5LjkiGehYaCDL3U';

export const JOSE_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7k4fZFf4_ALnUCkykp5d8_EWDcITBbKmOj8XZwNtCtRd1R-h4ZhldiedVXIan_eVpbLifqpL1bG9ztSNNj6mYRK9b9dwQ_Nb9jgzP8obhPVMotcKH71c41c8r61Gj5Vb_2oMjouCrw-mgYyy1XVfWK2kneaAP4HnODkrwLRAPYVwgZbr1uB9_xHyMTBPBZ6L-0MXRMyZTaXstV6Ci8T4MGF-7U1-Sr5QWljtU-mhSuKDN6Lci8wbg';

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

// Inicia vacío para permitir el ingreso de la información real del usuario
export const INITIAL_SAMUEL_STEPS: RouteStep[] = [];

export const INITIAL_FLOATING_POINTS: FloatingPoint[] = [];

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
