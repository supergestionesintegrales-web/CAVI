import { Auditor, RouteStep, FloatingPoint, FormatType, AlertCategory } from '../types';

export interface PointCandidate {
  id?: string;
  code: string;
  name: string;
  format: FormatType;
  address: string;
  municipality?: string;
  zone?: 'Norte' | 'Centro' | 'Sur';
  channel?: string;
  hasGps?: boolean;
  lat?: number;
  lng?: number;
  daysWithoutVisit?: number;
  alertCategory?: AlertCategory;
  alertDescription?: string;
  priority?: string;
  sla?: string;
  notes?: string;
  time?: string;
  day?: RouteStep['day'];
  auditorId?: string;
  auditorName?: string;
  hasAlert?: boolean;
}

export interface AuditorSummaryDetail {
  auditorId: string;
  auditorName: string;
  zone: string;
  assigned: number;
  alertCount: number;
  regularCount: number;
  totalAssigned: number;
}

export interface AssignmentResult {
  assignedSteps: RouteStep[];
  prioritizedAlertsCount: number;
  alertCount: number;
  regularPointsCount: number;
  regularCount: number;
  auditorSummary: Record<string, AuditorSummaryDetail>;
}

/**
 * Determines if a candidate point has an active operational alert
 * (e.g. days without visit >= 60, inventory mismatch, critical priority, or alert description).
 */
export function isAlertPoint(p: any): boolean {
  if (!p) return false;
  if (p.hasAlert === true) return true;
  if (p.alertCategory && p.alertCategory !== 'ninguna') return true;
  if (typeof p.daysWithoutVisit === 'number' && p.daysWithoutVisit >= 60) return true;
  const prio = String(p.priority || '').toUpperCase();
  if (prio === 'URGENTE' || prio === 'CRÍTICA' || prio === 'CRITICA' || prio === 'ALTA') return true;
  if (p.alertDescription && String(p.alertDescription).trim().length > 0) return true;
  const notesStr = String(p.notes || '').toLowerCase();
  if (
    notesStr.includes('alerta') ||
    notesStr.includes('sin visita') ||
    notesStr.includes('quiebre') ||
    notesStr.includes('mora') ||
    notesStr.includes('urgente')
  ) {
    return true;
  }
  const slaStr = String(p.sla || '').toLowerCase();
  if (slaStr.includes('crítico') || slaStr.includes('critico') || slaStr.includes('urgente')) {
    return true;
  }
  return false;
}

/**
 * Infers operating zone in La Guajira based on municipality or address
 */
export function guessZoneFromLocation(location: string): 'Norte' | 'Centro' | 'Sur' {
  const loc = location.toLowerCase();
  if (
    loc.includes('riohacha') ||
    loc.includes('manaure') ||
    loc.includes('uribia') ||
    loc.includes('dibulla') ||
    loc.includes('norte')
  ) {
    return 'Norte';
  }
  if (
    loc.includes('maicao') ||
    loc.includes('albania') ||
    loc.includes('hatonuevo') ||
    loc.includes('centro')
  ) {
    return 'Centro';
  }
  if (
    loc.includes('san juan') ||
    loc.includes('fonseca') ||
    loc.includes('villanueva') ||
    loc.includes('barrancas') ||
    loc.includes('distraccion') ||
    loc.includes('distracción') ||
    loc.includes('el molino') ||
    loc.includes('la jagua') ||
    loc.includes('urumita') ||
    loc.includes('sur')
  ) {
    return 'Sur';
  }
  return 'Norte';
}

/**
 * Default GPS coordinates for La Guajira zones
 */
export const ZONE_COORDS = {
  Norte: { lat: 11.5442, lng: -72.9069 },
  Centro: { lat: 11.3778, lng: -72.2389 },
  Sur: { lat: 10.7711, lng: -73.0025 },
};

/**
 * TWO-PHASE POINT ASSIGNMENT ALGORITHM:
 * 1. Prioritizes points with alerts first:
 *    - Assigns them to the corresponding auditor matching operating zone (Norte, Centro, Sur).
 *    - Schedules them in priority morning slots and early weekdays (Lunes, Martes).
 * 2. Completes the load for each auditor with the remaining points without alerts:
 *    - Balances the workload across all auditors so each auditor receives an even and optimal load.
 *    - Fills the daily schedules (Lunes a Viernes) evenly.
 */
export function distributePointsWithAlertPriority(
  candidates: PointCandidate[],
  auditors: Auditor[],
  existingSteps: RouteStep[] = []
): AssignmentResult {
  if (candidates.length === 0 || auditors.length === 0) {
    const emptySummary: Record<string, AuditorSummaryDetail> = {};
    auditors.forEach((a) => {
      emptySummary[a.id] = {
        auditorId: a.id,
        auditorName: a.name,
        zone: a.zone,
        assigned: 0,
        alertCount: 0,
        regularCount: 0,
        totalAssigned: 0,
      };
    });
    return {
      assignedSteps: [],
      prioritizedAlertsCount: 0,
      alertCount: 0,
      regularPointsCount: 0,
      regularCount: 0,
      auditorSummary: emptySummary,
    };
  }

  // Split into alert candidates vs regular candidates
  const alertCandidates: PointCandidate[] = [];
  const regularCandidates: PointCandidate[] = [];

  candidates.forEach((c) => {
    if (isAlertPoint(c)) {
      alertCandidates.push(c);
    } else {
      regularCandidates.push(c);
    }
  });

  // Sort alert candidates by severity: highest days without visit first
  alertCandidates.sort((a, b) => {
    const daysA = a.daysWithoutVisit || (a.priority === 'Urgente' ? 95 : 65);
    const daysB = b.daysWithoutVisit || (b.priority === 'Urgente' ? 95 : 65);
    return daysB - daysA;
  });

  const validDays: RouteStep['day'][] = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];

  // Track state per auditor
  const auditorLoads: Record<
    string,
    {
      auditor: Auditor;
      alertCount: number;
      regularCount: number;
      dayCounts: Record<RouteStep['day'], number>;
      assignedSteps: RouteStep[];
    }
  > = {};

  auditors.forEach((aud) => {
    const initialDayCounts: Record<RouteStep['day'], number> = {
      lunes: 0,
      martes: 0,
      miércoles: 0,
      jueves: 0,
      viernes: 0,
    };
    existingSteps
      .filter((s) => s.auditorId === aud.id)
      .forEach((s) => {
        if (s.day && initialDayCounts[s.day] !== undefined) {
          initialDayCounts[s.day]++;
        }
      });

    auditorLoads[aud.id] = {
      auditor: aud,
      alertCount: 0,
      regularCount: 0,
      dayCounts: initialDayCounts,
      assignedSteps: [],
    };
  });

  // Helper to pick the best auditor for a candidate
  const getBestAuditorForZone = (candidateZone: string, preferLowestLoad = false): Auditor => {
    // 1. Exact zone match
    const zoneMatches = auditors.filter(
      (a) => a.zone.toLowerCase() === candidateZone.toLowerCase()
    );

    if (zoneMatches.length > 0) {
      if (preferLowestLoad && zoneMatches.length > 1) {
        zoneMatches.sort(
          (a, b) =>
            auditorLoads[a.id].assignedSteps.length -
            auditorLoads[b.id].assignedSteps.length
        );
      }
      return zoneMatches[0];
    }

    // 2. Fallback to the auditor with the lowest total load
    const sorted = [...auditors].sort(
      (a, b) =>
        auditorLoads[a.id].assignedSteps.length -
        auditorLoads[b.id].assignedSteps.length
    );
    return sorted[0];
  };

  // Helper to pick the best day for an auditor
  const getBestDayForAuditor = (
    auditorId: string,
    isAlert: boolean
  ): RouteStep['day'] => {
    const loadInfo = auditorLoads[auditorId];
    if (!loadInfo) return 'lunes';

    // For alerts, prefer early week: lunes, martes, miércoles
    const dayPool: RouteStep['day'][] = isAlert
      ? ['lunes', 'martes', 'miércoles', 'jueves', 'viernes']
      : ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];

    // Pick day with minimum stops currently scheduled
    let bestDay = dayPool[0];
    let minStops = loadInfo.dayCounts[bestDay];

    for (const d of dayPool) {
      if (loadInfo.dayCounts[d] < minStops) {
        minStops = loadInfo.dayCounts[d];
        bestDay = d;
      }
    }
    return bestDay;
  };

  const newlyAssignedSteps: RouteStep[] = [];

  // ==========================================
  // PHASE 1: ASSIGN ALL ALERT POINTS FIRST
  // ==========================================
  alertCandidates.forEach((candidate, idx) => {
    const zone =
      candidate.zone ||
      guessZoneFromLocation(candidate.municipality || candidate.address || '');
    const matchedAuditor = getBestAuditorForZone(zone, false);
    const assignedDay =
      candidate.day && validDays.includes(candidate.day)
        ? candidate.day
        : getBestDayForAuditor(matchedAuditor.id, true);

    const loadInfo = auditorLoads[matchedAuditor.id];
    loadInfo.dayCounts[assignedDay]++;
    loadInfo.alertCount++;

    const orderInDay = loadInfo.dayCounts[assignedDay];
    const hour = 8 + (orderInDay % 4);
    const minute = orderInDay % 2 === 0 ? '00' : '30';
    const timeStr = `${hour < 10 ? '0' + hour : hour}:${minute} AM`;

    const alertDays = candidate.daysWithoutVisit || 75;
    const alertDesc =
      candidate.alertDescription ||
      `${alertDays} días sin visita · Prioridad en terreno`;

    const step: RouteStep = {
      id: candidate.id || `step-alert-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      code: candidate.code,
      name: candidate.name,
      channel: candidate.channel || 'Tradicional',
      format: candidate.format || 'CM',
      day: assignedDay,
      address: candidate.address,
      municipality:
        candidate.municipality ||
        (matchedAuditor.zone === 'Norte'
          ? 'Riohacha'
          : matchedAuditor.zone === 'Centro'
          ? 'Maicao'
          : 'San Juan del Cesar'),
      time: candidate.time || timeStr,
      sla: candidate.sla || 'SLA Urgente (<24h)',
      status: 'pending',
      auditorId: matchedAuditor.id,
      auditorName: matchedAuditor.name,
      notes: `🚨 Prioridad Alerta: ${alertDesc}`,
      daysWithoutVisit: alertDays,
      alertCategory: (candidate.alertCategory as AlertCategory | undefined) || 'sin_visita_2_3_meses',
      alertDescription: alertDesc,
      hasGps: candidate.hasGps ?? true,
      lat: candidate.lat || ZONE_COORDS[matchedAuditor.zone].lat,
      lng: candidate.lng || ZONE_COORDS[matchedAuditor.zone].lng,
    };

    loadInfo.assignedSteps.push(step);
    newlyAssignedSteps.push(step);
  });

  // =========================================================================
  // PHASE 2: ASSIGN REGULAR POINTS TO COMPLETE EACH AUDITOR'S LOAD (CARGUE)
  // =========================================================================
  regularCandidates.forEach((candidate, idx) => {
    const zone =
      candidate.zone ||
      guessZoneFromLocation(candidate.municipality || candidate.address || '');

    // Check load balancing: if zone auditor is already overloaded compared to peers, balance
    const zoneAuditor = getBestAuditorForZone(zone, false);
    const zoneAuditorLoad = auditorLoads[zoneAuditor.id].assignedSteps.length;

    // Lowest overall auditor load
    const minLoadAuditor = [...auditors].sort(
      (a, b) =>
        auditorLoads[a.id].assignedSteps.length -
        auditorLoads[b.id].assignedSteps.length
    )[0];
    const minAuditorLoad = auditorLoads[minLoadAuditor.id].assignedSteps.length;

    // Prefer zone auditor, but if discrepancy > 3 paradas, balance to complete cargue
    const matchedAuditor =
      zoneAuditorLoad - minAuditorLoad > 3 ? minLoadAuditor : zoneAuditor;

    const assignedDay =
      candidate.day && validDays.includes(candidate.day)
        ? candidate.day
        : getBestDayForAuditor(matchedAuditor.id, false);

    const loadInfo = auditorLoads[matchedAuditor.id];
    loadInfo.dayCounts[assignedDay]++;
    loadInfo.regularCount++;

    const orderInDay = loadInfo.dayCounts[assignedDay];
    const hour = 10 + (orderInDay % 6);
    const timePeriod = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    const minute = orderInDay % 2 === 0 ? '15' : '45';
    const timeStr = `${displayHour}:${minute} ${timePeriod}`;

    const step: RouteStep = {
      id: candidate.id || `step-reg-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      code: candidate.code,
      name: candidate.name,
      channel: candidate.channel || 'Tradicional',
      format: candidate.format || 'CM',
      day: assignedDay,
      address: candidate.address,
      municipality:
        candidate.municipality ||
        (matchedAuditor.zone === 'Norte'
          ? 'Riohacha'
          : matchedAuditor.zone === 'Centro'
          ? 'Maicao'
          : 'San Juan del Cesar'),
      time: candidate.time || timeStr,
      sla: candidate.sla || 'SLA 48h · Cobertura Regular',
      status: 'pending',
      auditorId: matchedAuditor.id,
      auditorName: matchedAuditor.name,
      notes: candidate.notes || 'Cargue regular de cobertura y supervisión de PDV',
      daysWithoutVisit: candidate.daysWithoutVisit || 15,
      alertCategory: undefined,
      alertDescription: undefined,
      hasGps: candidate.hasGps ?? true,
      lat: candidate.lat || ZONE_COORDS[matchedAuditor.zone].lat,
      lng: candidate.lng || ZONE_COORDS[matchedAuditor.zone].lng,
    };

    loadInfo.assignedSteps.push(step);
    newlyAssignedSteps.push(step);
  });

  const auditorSummary: Record<string, AuditorSummaryDetail> = {};
  auditors.forEach((aud) => {
    const loadInfo = auditorLoads[aud.id];
    auditorSummary[aud.id] = {
      auditorId: aud.id,
      auditorName: aud.name,
      zone: aud.zone,
      assigned: loadInfo.assignedSteps.length,
      alertCount: loadInfo.alertCount,
      regularCount: loadInfo.regularCount,
      totalAssigned: loadInfo.assignedSteps.length,
    };
  });

  return {
    assignedSteps: newlyAssignedSteps,
    prioritizedAlertsCount: alertCandidates.length,
    alertCount: alertCandidates.length,
    regularPointsCount: regularCandidates.length,
    regularCount: regularCandidates.length,
    auditorSummary,
  };
}

/**
 * Master sample candidate points combining critical points and regular stores
 * across La Guajira (15 municipalities) for seamless demonstration of prioritized cargue.
 */
export const MASTER_SAMPLE_CANDIDATE_POINTS: PointCandidate[] = [
  // 1. Alert Points (Prioritized)
  {
    code: 'CM-108',
    name: 'Éxito Riohacha Centro',
    format: 'CM',
    address: 'Av. de los Estudiantes #12-40, Riohacha',
    municipality: 'Riohacha',
    zone: 'Norte',
    daysWithoutVisit: 84,
    alertCategory: 'sin_visita_2_3_meses',
    alertDescription: '84 días sin visita presencial · Quiebre de stock y desabastecimiento',
    priority: 'Urgente',
    hasGps: true,
    lat: 11.5442,
    lng: -72.9069,
  },
  {
    code: 'PF-042',
    name: 'Maicao Comercio Central',
    format: 'PF',
    address: 'Calle 16 #13-05, Mercado Público, Maicao',
    municipality: 'Maicao',
    zone: 'Centro',
    daysWithoutVisit: 72,
    alertCategory: 'inventario_discrepancia',
    alertDescription: '72 días sin visita · Discrepancia de stock físico vs sistema',
    priority: 'Alta',
    hasGps: true,
    lat: 11.3778,
    lng: -72.2389,
  },
  {
    code: 'CDA-07',
    name: 'Centro Agropecuario San Juan',
    format: 'CDA',
    address: 'Cra 6 #14-22, Salida San Juan del Cesar',
    municipality: 'San Juan del Cesar',
    zone: 'Sur',
    daysWithoutVisit: 96,
    alertCategory: 'critico_mas_3_meses',
    alertDescription: '96 días sin visita (>3 meses) · Superó límite máximo de supervisión',
    priority: 'Urgente',
    hasGps: true,
    lat: 10.7711,
    lng: -73.0025,
  },
  {
    code: 'CM-102',
    name: 'Tienda Ara Maicao Central',
    format: 'CM',
    address: 'Calle 16 #11-24, Maicao',
    municipality: 'Maicao',
    zone: 'Centro',
    daysWithoutVisit: 65,
    alertCategory: 'sin_visita_2_3_meses',
    alertDescription: '65 días sin visita (~2.2 meses) · Expiró ventana bimestral',
    priority: 'Alta',
    hasGps: true,
    lat: 11.3812,
    lng: -72.245,
  },
  {
    code: 'PF-89',
    name: 'Droguería y Variedades Manaure',
    format: 'PF',
    address: 'Av. Las Salinas #4-18, Manaure',
    municipality: 'Manaure',
    zone: 'Norte',
    daysWithoutVisit: 78,
    alertCategory: 'precio_no_conforme',
    alertDescription: '78 días sin visita · Precios fuera de parámetro en canal PF',
    priority: 'Urgente',
    hasGps: true,
    lat: 11.7792,
    lng: -72.4494,
  },
  {
    code: 'CM-115',
    name: 'Super Inter Fonseca Central',
    format: 'CM',
    address: 'Calle 12 #18-35, Fonseca',
    municipality: 'Fonseca',
    zone: 'Sur',
    daysWithoutVisit: 62,
    alertCategory: 'sin_visita_2_3_meses',
    alertDescription: '62 días sin visita · Revisión de material POP y planograma',
    priority: 'Alta',
    hasGps: true,
    lat: 10.8861,
    lng: -72.8515,
  },
  {
    code: 'PF-33',
    name: 'Distribuidora Uribia Central',
    format: 'PF',
    address: 'Calle 3 #5-12, Plaza Principal, Uribia',
    municipality: 'Uribia',
    zone: 'Norte',
    daysWithoutVisit: 105,
    alertCategory: 'critico_mas_3_meses',
    alertDescription: '105 días sin visita (3.5 meses) · Máxima antigüedad sin inspección',
    priority: 'Urgente',
    hasGps: true,
    lat: 11.7139,
    lng: -72.266,
  },
  {
    code: 'CM-96',
    name: 'Supertienda Villanueva Real',
    format: 'CM',
    address: 'Carrera 8 #11-50, Villanueva',
    municipality: 'Villanueva',
    zone: 'Sur',
    daysWithoutVisit: 88,
    alertCategory: 'sla_vencido',
    alertDescription: '88 días sin visita · SLA vencido para homologación de precios',
    priority: 'Urgente',
    hasGps: true,
    lat: 10.6056,
    lng: -72.9789,
  },

  // 2. Regular Points (Assigned after alerts to complete the cargue)
  {
    code: 'CM-01',
    name: 'Olímpica Calle Ancha Riohacha',
    format: 'CM',
    address: 'Calle 7 #10-15, Riohacha',
    municipality: 'Riohacha',
    zone: 'Norte',
    daysWithoutVisit: 14,
    hasGps: true,
    lat: 11.545,
    lng: -72.908,
  },
  {
    code: 'PF-12',
    name: 'Granero El Paisa Maicao',
    format: 'PF',
    address: 'Carrera 10 #12-30, Maicao',
    municipality: 'Maicao',
    zone: 'Centro',
    daysWithoutVisit: 18,
    hasGps: true,
    lat: 11.379,
    lng: -72.241,
  },
  {
    code: 'PF-15',
    name: 'Droguería La Principal San Juan',
    format: 'PF',
    address: 'Calle 4 #8-20, San Juan del Cesar',
    municipality: 'San Juan del Cesar',
    zone: 'Sur',
    daysWithoutVisit: 12,
    hasGps: true,
    lat: 10.772,
    lng: -73.003,
  },
  {
    code: 'CDA-02',
    name: 'Centro de Acopio Cerrejón Albania',
    format: 'CDA',
    address: 'Vía Principal Albania Km 2',
    municipality: 'Albania',
    zone: 'Centro',
    daysWithoutVisit: 21,
    hasGps: true,
    lat: 11.1611,
    lng: -72.5928,
  },
  {
    code: 'CM-05',
    name: 'Supermercado Los Primos Fonseca',
    format: 'CM',
    address: 'Carrera 19 #14-25, Fonseca',
    municipality: 'Fonseca',
    zone: 'Sur',
    daysWithoutVisit: 16,
    hasGps: true,
    lat: 10.887,
    lng: -72.852,
  },
  {
    code: 'PF-22',
    name: 'Abarrotes Hatonuevo Central',
    format: 'PF',
    address: 'Calle 5 #9-18, Hatonuevo',
    municipality: 'Hatonuevo',
    zone: 'Centro',
    daysWithoutVisit: 25,
    hasGps: true,
    lat: 11.0617,
    lng: -72.7633,
  },
  {
    code: 'CM-33',
    name: 'D1 Mercado Villanueva',
    format: 'CM',
    address: 'Carrera 7 #12-10, Villanueva',
    municipality: 'Villanueva',
    zone: 'Sur',
    daysWithoutVisit: 19,
    hasGps: true,
    lat: 10.606,
    lng: -72.979,
  },
  {
    code: 'PF-45',
    name: 'Minimarket Los Laureles Dibulla',
    format: 'PF',
    address: 'Calle Principal #3-22, Dibulla',
    municipality: 'Dibulla',
    zone: 'Norte',
    daysWithoutVisit: 22,
    hasGps: true,
    lat: 11.2725,
    lng: -73.3094,
  },
  {
    code: 'CM-50',
    name: 'Supermercado Central Barrancas',
    format: 'CM',
    address: 'Calle 10 #7-40, Barrancas',
    municipality: 'Barrancas',
    zone: 'Sur',
    daysWithoutVisit: 15,
    hasGps: true,
    lat: 10.9572,
    lng: -72.7886,
  },
];
