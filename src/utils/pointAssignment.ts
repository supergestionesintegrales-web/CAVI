import { Auditor, RouteStep, FloatingPoint, FormatType, AlertCategory } from '../types';
import { GUAJIRA_73_MONTHLY_POINTS, WORKLOAD_CONSTRAINTS } from '../data/guajiraPointsData';

export { WORKLOAD_CONSTRAINTS, GUAJIRA_73_MONTHLY_POINTS };

export const WORKLOAD_RULES = WORKLOAD_CONSTRAINTS;

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

  // Helper to pick the best auditor for a candidate respecting the 24-25 weekly target
  const getBestAuditorForZone = (candidateZone: string): Auditor => {
    // 1. Exact zone matches where auditor has not reached weekly capacity (25 points)
    const zoneMatches = auditors.filter(
      (a) => a.zone.toLowerCase() === candidateZone.toLowerCase()
    );

    const availableZoneAuditors = zoneMatches.filter(
      (a) => auditorLoads[a.id].assignedSteps.length < WORKLOAD_CONSTRAINTS.WEEKLY_AVG_MAX
    );

    if (availableZoneAuditors.length > 0) {
      availableZoneAuditors.sort(
        (a, b) =>
          auditorLoads[a.id].assignedSteps.length -
          auditorLoads[b.id].assignedSteps.length
      );
      return availableZoneAuditors[0];
    }

    if (zoneMatches.length > 0) {
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

  // Helper to pick the best day for an auditor respecting the 8-10 points/day rule
  const getBestDayForAuditor = (
    auditorId: string,
    isAlert: boolean
  ): RouteStep['day'] => {
    const loadInfo = auditorLoads[auditorId];
    if (!loadInfo) return 'lunes';

    // Prefer Lunes, Martes, Miércoles to concentrate field audits into 8-10 points/day
    const preferredDays: RouteStep['day'][] = ['lunes', 'martes', 'miércoles'];
    const allDays: RouteStep['day'][] = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];

    // 1. Fill preferred days up to minimum daily workload (8 points)
    for (const d of preferredDays) {
      if (loadInfo.dayCounts[d] < WORKLOAD_CONSTRAINTS.DAILY_MIN_POINTS) {
        return d;
      }
    }

    // 2. If each preferred day already has 8 points, fill up to maximum daily workload (10 points)
    for (const d of preferredDays) {
      if (loadInfo.dayCounts[d] < WORKLOAD_CONSTRAINTS.DAILY_MAX_POINTS) {
        return d;
      }
    }

    // 3. If preferred days are full (10 points each), schedule on Jueves/Viernes
    for (const d of allDays) {
      if (loadInfo.dayCounts[d] < WORKLOAD_CONSTRAINTS.DAILY_MAX_POINTS) {
        return d;
      }
    }

    // Fallback: day with least load
    let minDay = allDays[0];
    let minStops = loadInfo.dayCounts[minDay];
    for (const d of allDays) {
      if (loadInfo.dayCounts[d] < minStops) {
        minStops = loadInfo.dayCounts[d];
        minDay = d;
      }
    }
    return minDay;
  };

  const SCHEDULED_TIME_SLOTS = [
    '08:00 AM',
    '08:45 AM',
    '09:30 AM',
    '10:15 AM',
    '11:00 AM',
    '01:30 PM',
    '02:15 PM',
    '03:00 PM',
    '03:45 PM',
    '04:30 PM',
  ];

  const newlyAssignedSteps: RouteStep[] = [];

  // ==========================================
  // PHASE 1: ASSIGN ALL ALERT POINTS FIRST
  // ==========================================
  alertCandidates.forEach((candidate, idx) => {
    const zone =
      candidate.zone ||
      guessZoneFromLocation(candidate.municipality || candidate.address || '');
    const matchedAuditor = getBestAuditorForZone(zone);
    const assignedDay =
      candidate.day && validDays.includes(candidate.day)
        ? candidate.day
        : getBestDayForAuditor(matchedAuditor.id, true);

    const loadInfo = auditorLoads[matchedAuditor.id];
    loadInfo.dayCounts[assignedDay]++;
    loadInfo.alertCount++;

    const orderInDay = loadInfo.dayCounts[assignedDay] - 1;
    const timeStr = SCHEDULED_TIME_SLOTS[orderInDay % SCHEDULED_TIME_SLOTS.length];

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

    const matchedAuditor = getBestAuditorForZone(zone);

    const assignedDay =
      candidate.day && validDays.includes(candidate.day)
        ? candidate.day
        : getBestDayForAuditor(matchedAuditor.id, false);

    const loadInfo = auditorLoads[matchedAuditor.id];
    loadInfo.dayCounts[assignedDay]++;
    loadInfo.regularCount++;

    const orderInDay = loadInfo.dayCounts[assignedDay] - 1;
    const timeStr = SCHEDULED_TIME_SLOTS[orderInDay % SCHEDULED_TIME_SLOTS.length];

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
 * Master sample candidate points (73 puntos totales de muestreo mensual)
 * distribuidos según las directrices operativas en los 15 municipios de La Guajira.
 */
export const MASTER_SAMPLE_CANDIDATE_POINTS: PointCandidate[] = GUAJIRA_73_MONTHLY_POINTS;

