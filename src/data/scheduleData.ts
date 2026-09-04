import { FormatType } from '../types';
import { SAMUEL_AVATAR, KLEYDER_AVATAR, JOSE_AVATAR } from './mockData';

export interface ScheduledPoint {
  id: string;
  code: string;
  format: FormatType;
  name: string;
  municipality: string;
  address: string;
  timeSlot: string;
  status: 'completed' | 'in_progress' | 'pending';
  priority: 'Alta' | 'Normal' | 'Re-visita';
  estimatedDuration: string;
  contactPerson?: string;
  phone?: string;
  caviNotes?: string;
}

export interface AuditorDaySchedule {
  auditorId: string;
  auditorName: string;
  auditorCode: string;
  avatar: string;
  zone: string;
  municipalitiesCovered: string[];
  totalVisits: number;
  completedVisits: number;
  progressPercent: number;
  routeColor: string;
  points: ScheduledPoint[];
}

export const GUAJIRA_POINTS_CATALOG = {
  norte: [
    {
      code: 'CDA-04',
      format: 'CDA' as FormatType,
      name: 'Centro Acopio Riohacha',
      municipality: 'Riohacha',
      address: 'Calle 15 #12-30, Mercado Nuevo',
      contactPerson: 'Marlon Epieyú',
      phone: '315 889 4410',
      caviNotes: 'Revisión prioritaria de cadena de frío y pesaje.'
    },
    {
      code: 'PF-12',
      format: 'PF' as FormatType,
      name: 'Supertienda Olímpica Riohacha',
      municipality: 'Riohacha',
      address: 'Calle 12 #10-45, Centro Histórico',
      contactPerson: 'Clara Redondo',
      phone: '300 241 5590',
      caviNotes: 'Validar exhibición y sellos de trazabilidad INVIMA.'
    },
    {
      code: 'CM-108',
      format: 'CM' as FormatType,
      name: 'Éxito Vecino Riohacha',
      municipality: 'Riohacha',
      address: 'Carrera 7 #13-22, Plaza Padilla',
      contactPerson: 'Jorge Luis Cotes',
      phone: '318 765 1209',
      caviNotes: 'Auditoría integral de góndolas y fechas de vencimiento.'
    },
    {
      code: 'PF-019',
      format: 'PF' as FormatType,
      name: 'Farmatodo Riohacha Malecón',
      municipality: 'Riohacha',
      address: 'Calle 1 #5-12, Malecón Playa',
      contactPerson: 'Yuleidis Uriana',
      phone: '311 902 4311',
      caviNotes: 'Verificación de kardex de medicamentos regulados.'
    },
    {
      code: 'CDA-09',
      format: 'CDA' as FormatType,
      name: 'Centro Distribución Sal Manaure',
      municipality: 'Manaure',
      address: 'Av. Salinera #4-15, Sector Costero',
      contactPerson: 'Argemiro Pushaina',
      phone: '312 660 7820',
      caviNotes: 'Control de stock a granel y condiciones de almacenamiento.'
    },
    {
      code: 'CM-076',
      format: 'CM' as FormatType,
      name: 'Supermercado Manaure Mar',
      municipality: 'Manaure',
      address: 'Calle 4 #6-20, Centro',
      contactPerson: 'Luz Marina Gómez',
      phone: '314 551 2298',
      caviNotes: 'Auditoría de cumplimiento de precios y etiquetado.'
    },
    {
      code: 'PF-065',
      format: 'PF' as FormatType,
      name: 'Droguería Central Uribia',
      municipality: 'Uribia',
      address: 'Calle 11 #9-30, Parque Principal',
      contactPerson: 'Ever Ipuana',
      phone: '317 443 8910',
      caviNotes: 'Punto estratégico de la capital indígena de Colombia.'
    },
    {
      code: 'CDA-14',
      format: 'CDA' as FormatType,
      name: 'Depósito Frontera Uribia',
      municipality: 'Uribia',
      address: 'Km 2 Vía Puerto Bolívar',
      contactPerson: 'Néstor Barros',
      phone: '320 891 3320',
      caviNotes: 'Inspección de despacho logístico hacia la Alta Guajira.'
    },
    {
      code: 'CM-115',
      format: 'CM' as FormatType,
      name: 'Mercaplaza Guajira Riohacha',
      municipality: 'Riohacha',
      address: 'Calle 15 #22-10, Barrio San Martín',
      contactPerson: 'Doris Iguarán',
      phone: '313 772 0019',
      caviNotes: 'Verificar cumplimiento de normatividad sanitaria.'
    }
  ],
  centro: [
    {
      code: 'PF-042',
      format: 'PF' as FormatType,
      name: 'Maicao Comercio Central',
      municipality: 'Maicao',
      address: 'Calle 16 #13-05, Zona Comercial',
      contactPerson: 'Farid Mansour',
      phone: '316 440 1920',
      caviNotes: 'Punto de alta rotación con historial de re-visita pendiente.'
    },
    {
      code: 'CM-085',
      format: 'CM' as FormatType,
      name: 'Megatienda La Frontera Maicao',
      municipality: 'Maicao',
      address: 'Carrera 9 #12-50',
      contactPerson: 'Samir Henríquez',
      phone: '310 882 1190',
      caviNotes: 'Verificación de factura electrónica y origen de lotes.'
    },
    {
      code: 'CDA-07',
      format: 'CDA' as FormatType,
      name: 'Almacén Aduanero Maicao',
      municipality: 'Maicao',
      address: 'Calle 11 #15-30, Salida Carraipía',
      contactPerson: 'Oscarina Pinto',
      phone: '315 330 9940',
      caviNotes: 'Control de sellos fiscales y entrada de mercancías.'
    },
    {
      code: 'PF-055',
      format: 'PF' as FormatType,
      name: 'Farmacia San Martín Maicao',
      municipality: 'Maicao',
      address: 'Calle 14 #11-08',
      contactPerson: 'Humberto Romero',
      phone: '312 409 8812',
      caviNotes: 'Revisión de refrigeración de vacunas y termómetros.'
    },
    {
      code: 'CDA-11',
      format: 'CDA' as FormatType,
      name: 'CDA Carbones Cerrejón Albania',
      municipality: 'Albania',
      address: 'Vía Principal Cerrejón #4-12',
      contactPerson: 'Carlos Mario Solano',
      phone: '318 661 2045',
      caviNotes: 'Punto corporativo minero con protocolo de seguridad estricto.'
    },
    {
      code: 'PF-077',
      format: 'PF' as FormatType,
      name: 'Droguería Cerrejón Albania',
      municipality: 'Albania',
      address: 'Calle 5 #3-18, Casco Urbano',
      contactPerson: 'Elena Movil',
      phone: '317 220 9011',
      caviNotes: 'Control de inventario trimestral para trabajadores.'
    },
    {
      code: 'CDA-08',
      format: 'CDA' as FormatType,
      name: 'CDA Guajira Hatonuevo',
      municipality: 'Hatonuevo',
      address: 'Salida Mina Km 1.5, Sector Industrial',
      contactPerson: 'Ramiro Bermúdez',
      phone: '311 559 3410',
      caviNotes: 'Alerta CAVI: requiere validar cierre de moras de Agosto.'
    },
    {
      code: 'CM-064',
      format: 'CM' as FormatType,
      name: 'Autoservicio Minero Hatonuevo',
      municipality: 'Hatonuevo',
      address: 'Calle Real #7-12, Parque Los Campanos',
      contactPerson: 'Martha Daza',
      phone: '314 990 1256',
      caviNotes: 'Inspección de cuartos fríos y abarrotes generales.'
    },
    {
      code: 'CM-092',
      format: 'CM' as FormatType,
      name: 'Supermercado El Éxito Fronterizo',
      municipality: 'Maicao',
      address: 'Calle 15 #10-14, Barrio El Carmen',
      contactPerson: 'Pedro José Mengual',
      phone: '313 118 7765',
      caviNotes: 'Verificación de pesas y balanzas certificadas.'
    }
  ],
  sur: [
    {
      code: 'CM-099',
      format: 'CM' as FormatType,
      name: 'Super Inter Fonseca',
      municipality: 'Fonseca',
      address: 'Calle 12 #15-40, Barrio San Agustín',
      contactPerson: 'Geovanny Parodi',
      phone: '318 554 9901',
      caviNotes: 'Auditoría prioritaria con alerta de desvío de inventario.'
    },
    {
      code: 'PF-081',
      format: 'PF' as FormatType,
      name: 'Droguería Central Fonseca',
      municipality: 'Fonseca',
      address: 'Carrera 18 #11-25',
      contactPerson: 'Diana Carolina Brito',
      phone: '316 229 8830',
      caviNotes: 'Inspección de fórmulas y registro sanitario INVIMA.'
    },
    {
      code: 'CDA-16',
      format: 'CDA' as FormatType,
      name: 'Bodega Agroindustrial Fonseca',
      municipality: 'Fonseca',
      address: 'Vía San Juan Km 2, Parque Tecnológico',
      contactPerson: 'Luis Fernando Pitre',
      phone: '315 881 4022',
      caviNotes: 'Validación de acopio agrícola y cárnicos de la región.'
    },
    {
      code: 'CM-071',
      format: 'CM' as FormatType,
      name: 'Supermercado San José Barrancas',
      municipality: 'Barrancas',
      address: 'Calle 9 #6-14, Centro',
      contactPerson: 'Andrés Camilo Soto',
      phone: '310 994 3012',
      caviNotes: 'Control de abastecimiento y cadena de suministro.'
    },
    {
      code: 'PF-048',
      format: 'PF' as FormatType,
      name: 'Farmacia Popular Barrancas',
      municipality: 'Barrancas',
      address: 'Carrera 5 #8-33',
      contactPerson: 'Silvia Cuello',
      phone: '314 338 1902',
      caviNotes: 'Revisión de lote de antibióticos y analgésicos.'
    },
    {
      code: 'CM-124',
      format: 'CM' as FormatType,
      name: 'Megatienda San Juan del Cesar',
      municipality: 'San Juan del Cesar',
      address: 'Carrera 6 #8-10, Avenida Manuel Antonio',
      contactPerson: 'Albeiro Mendoza',
      phone: '317 662 5590',
      caviNotes: 'Punto ancla del sur con alto volumen de transacciones.'
    },
    {
      code: 'PF-088',
      format: 'PF' as FormatType,
      name: 'Farmacia Santa Cruz Villanueva',
      municipality: 'Villanueva',
      address: 'Calle 10 #8-22, Plaza Central Santo Tomás',
      contactPerson: 'Inés María Lacouture',
      phone: '312 884 1029',
      caviNotes: 'Auditoría de cumplimiento de condiciones de almacenamiento.'
    },
    {
      code: 'CDA-10',
      format: 'CDA' as FormatType,
      name: 'Acopio Agrícola San Juan',
      municipality: 'San Juan del Cesar',
      address: 'Calle 1 #4-50, Salida a Valledupar',
      contactPerson: 'Hernán Orozco',
      phone: '313 779 4001',
      caviNotes: 'Punto limítrofe departamental con inspección fitosanitaria.'
    },
    {
      code: 'PF-094',
      format: 'PF' as FormatType,
      name: 'Droguería El Valle Villanueva',
      municipality: 'Villanueva',
      address: 'Calle 12 #7-15, Barrio Hormiguero',
      contactPerson: 'Yolanda Daza',
      phone: '318 401 2289',
      caviNotes: 'Revisión de libro de estupefacientes y psicotrópicos.'
    }
  ]
};

const TIME_SLOTS = [
  '08:00 - 09:15',
  '09:30 - 10:45',
  '11:00 - 12:15',
  '13:30 - 14:45',
  '15:00 - 16:15',
  '16:30 - 17:30',
  '17:45 - 18:45',
  '19:00 - 20:00'
];

export function getScheduleForDay(
  year: number,
  month: number,
  day: number,
  todayDay: number,
  isCurrentMonth: boolean
): AuditorDaySchedule[] {
  const dateObj = new Date(year, month, day);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

  // If weekend, returns empty or minimum on-call guard
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return [
      {
        auditorId: 'aud-1',
        auditorName: 'Samuel Ramos Quintero',
        auditorCode: 'AUD-104',
        avatar: SAMUEL_AVATAR,
        zone: 'Zona Norte',
        municipalitiesCovered: ['Riohacha (Guardia de Fin de Semana)'],
        totalVisits: 0,
        completedVisits: 0,
        progressPercent: 100,
        routeColor: '#c0c1ff',
        points: []
      },
      {
        auditorId: 'aud-2',
        auditorName: 'Kleyder Rodriguez',
        auditorCode: 'AUD-209',
        avatar: KLEYDER_AVATAR,
        zone: 'Zona Centro',
        municipalitiesCovered: ['Maicao (Descanso Programado)'],
        totalVisits: 0,
        completedVisits: 0,
        progressPercent: 100,
        routeColor: '#4edea3',
        points: []
      },
      {
        auditorId: 'aud-3',
        auditorName: 'Jose Aponte',
        auditorCode: 'AUD-088',
        avatar: JOSE_AVATAR,
        zone: 'Zona Sur',
        municipalitiesCovered: ['San Juan del Cesar (Descanso Programado)'],
        totalVisits: 0,
        completedVisits: 0,
        progressPercent: 100,
        routeColor: '#ffb95f',
        points: []
      }
    ];
  }

  // Rotations and deterministic seed based on date
  const seed = (year * 372 + (month + 1) * 31 + day) % 9;

  // Auditor 1 (Zona Norte)
  const nortePointsRaw = [...GUAJIRA_POINTS_CATALOG.norte];
  // Shift array deterministically
  const offsetN = (day + seed) % nortePointsRaw.length;
  const auditor1PointsData = [
    ...nortePointsRaw.slice(offsetN),
    ...nortePointsRaw.slice(0, offsetN)
  ].slice(0, 8); // 8 points

  // Auditor 2 (Zona Centro)
  const centroPointsRaw = [...GUAJIRA_POINTS_CATALOG.centro];
  const offsetC = (day * 2 + seed) % centroPointsRaw.length;
  const auditor2PointsData = [
    ...centroPointsRaw.slice(offsetC),
    ...centroPointsRaw.slice(0, offsetC)
  ].slice(0, 9); // 9 points

  // Auditor 3 (Zona Sur)
  const surPointsRaw = [...GUAJIRA_POINTS_CATALOG.sur];
  const offsetS = (day * 3 + seed) % surPointsRaw.length;
  const auditor3PointsData = [
    ...surPointsRaw.slice(offsetS),
    ...surPointsRaw.slice(0, offsetS)
  ].slice(0, 8); // 8 points

  const mapToScheduledPoints = (
    pts: typeof GUAJIRA_POINTS_CATALOG.norte,
    auditorIndex: number
  ): ScheduledPoint[] => {
    return pts.map((pt, idx) => {
      let status: 'completed' | 'in_progress' | 'pending' = 'pending';
      const isPastDay = isCurrentMonth ? day < todayDay : day <= todayDay;
      const isToday = isCurrentMonth && day === todayDay;

      if (isPastDay) {
        status = 'completed';
      } else if (isToday) {
        // Today has realistic progress
        if (auditorIndex === 0) {
          status = idx < 6 ? 'completed' : idx === 6 ? 'in_progress' : 'pending';
        } else if (auditorIndex === 1) {
          status = idx < 6 ? 'completed' : idx === 6 ? 'in_progress' : 'pending';
        } else {
          status = 'completed'; // Jose finished today
        }
      } else {
        status = 'pending';
      }

      const priority: 'Alta' | 'Normal' | 'Re-visita' =
        idx === 0 || pt.code === 'CM-108' || pt.code === 'PF-042'
          ? 'Alta'
          : pt.code === 'CDA-08' || pt.code === 'CM-099'
          ? 'Re-visita'
          : 'Normal';

      return {
        id: `sched-${pt.code}-${day}-${idx}`,
        code: pt.code,
        format: pt.format,
        name: pt.name,
        municipality: pt.municipality,
        address: pt.address,
        timeSlot: TIME_SLOTS[idx % TIME_SLOTS.length],
        status,
        priority,
        estimatedDuration: pt.format === 'CDA' ? '1h 15 min' : '45 min',
        contactPerson: pt.contactPerson,
        phone: pt.phone,
        caviNotes: pt.caviNotes
      };
    });
  };

  const a1Points = mapToScheduledPoints(auditor1PointsData, 0);
  const a2Points = mapToScheduledPoints(auditor2PointsData, 1);
  const a3Points = mapToScheduledPoints(auditor3PointsData, 2);

  const getMunis = (pts: ScheduledPoint[]) =>
    Array.from(new Set(pts.map((p) => p.municipality)));

  const getCompletedCount = (pts: ScheduledPoint[]) =>
    pts.filter((p) => p.status === 'completed').length;

  return [
    {
      auditorId: 'aud-1',
      auditorName: 'Samuel Ramos Quintero',
      auditorCode: 'AUD-104',
      avatar: SAMUEL_AVATAR,
      zone: 'Zona Norte',
      municipalitiesCovered: getMunis(a1Points),
      totalVisits: a1Points.length,
      completedVisits: getCompletedCount(a1Points),
      progressPercent: Math.round((getCompletedCount(a1Points) / a1Points.length) * 100),
      routeColor: '#c0c1ff',
      points: a1Points
    },
    {
      auditorId: 'aud-2',
      auditorName: 'Kleyder Rodriguez',
      auditorCode: 'AUD-209',
      avatar: KLEYDER_AVATAR,
      zone: 'Zona Centro',
      municipalitiesCovered: getMunis(a2Points),
      totalVisits: a2Points.length,
      completedVisits: getCompletedCount(a2Points),
      progressPercent: Math.round((getCompletedCount(a2Points) / a2Points.length) * 100),
      routeColor: '#4edea3',
      points: a2Points
    },
    {
      auditorId: 'aud-3',
      auditorName: 'Jose Aponte',
      auditorCode: 'AUD-088',
      avatar: JOSE_AVATAR,
      zone: 'Zona Sur',
      municipalitiesCovered: getMunis(a3Points),
      totalVisits: a3Points.length,
      completedVisits: getCompletedCount(a3Points),
      progressPercent: Math.round((getCompletedCount(a3Points) / a3Points.length) * 100),
      routeColor: '#ffb95f',
      points: a3Points
    }
  ];
}
