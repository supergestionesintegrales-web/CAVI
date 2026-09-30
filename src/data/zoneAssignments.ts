import { Auditor } from '../types';
import { CaviPoint } from '../types/caviMap';

export type CaviZone = 'Norte' | 'Centro' | 'Sur';

export interface ZoneAssignment {
  zone: CaviZone;
  auditorId: string;
  auditorName: string;
  auditorCode: string;
}

export const ZONE_ASSIGNMENTS: Record<CaviZone, ZoneAssignment> = {
  Norte: {
    zone: 'Norte',
    auditorId: 'aud-1',
    auditorName: 'Samuel Ramos Quintero',
    auditorCode: 'AUD-104',
  },
  Centro: {
    zone: 'Centro',
    auditorId: 'aud-2',
    auditorName: 'Kleyder Rodriguez',
    auditorCode: 'AUD-209',
  },
  Sur: {
    zone: 'Sur',
    auditorId: 'aud-3',
    auditorName: 'Jose Aponte',
    auditorCode: 'AUD-088',
  },
};

const MUNICIPALITY_ZONE: Record<string, CaviZone> = {
  riohacha: 'Norte',
  manaure: 'Norte',
  uribia: 'Norte',
  dibulla: 'Norte',
  maicao: 'Centro',
  albania: 'Centro',
  hatonuevo: 'Centro',
  barrancas: 'Centro',
  distraccion: 'Centro',
  'distracción': 'Centro',
  'san juan del cesar': 'Sur',
  fonseca: 'Sur',
  villanueva: 'Sur',
  'el molino': 'Sur',
  urumita: 'Sur',
  'la jagua del pilar': 'Sur',
  'la jagua': 'Sur',
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Single source of truth for PDV -> Zone.
 * Existing CAVI point data already carries subregion for regional points;
 * bancario points are resolved from municipality so every PDV also receives
 * an operational zone.
 */
export function resolvePdvZone(point: Pick<CaviPoint, 'subregion' | 'municipality' | 'category'>): CaviZone {
  if (point.subregion === 'Norte' || point.subregion === 'Centro' || point.subregion === 'Sur') {
    return point.subregion;
  }

  const municipality = normalize(point.municipality || '');
  if (MUNICIPALITY_ZONE[municipality]) return MUNICIPALITY_ZONE[municipality];

  const text = normalize(`${point.category || ''} ${point.municipality || ''}`);
  if (text.includes('regional norte') || text.includes('norte')) return 'Norte';
  if (text.includes('regional centro') || text.includes('centro')) return 'Centro';
  if (text.includes('regional sur') || text.includes('sur')) return 'Sur';

  // Keep a deterministic operational default rather than deriving a zone from
  // whichever auditor happens to receive the point.
  return 'Norte';
}

export function getAssignedAuditorForZone(
  zone: CaviZone,
  auditors: Auditor[]
): Auditor | undefined {
  const assignment = ZONE_ASSIGNMENTS[zone];
  return auditors.find((auditor) => auditor.id === assignment.auditorId)
    || auditors.find((auditor) => normalize(auditor.name) === normalize(assignment.auditorName))
    || auditors.find((auditor) => auditor.zone === zone);
}

export function enrichPdvWithAssignment<T extends CaviPoint>(
  point: T,
  auditors: Auditor[] = []
): T & {
  zone: CaviZone;
  auditorId?: string;
  auditorName?: string;
  auditorCode?: string;
} {
  const zone = resolvePdvZone(point);
  const assigned = getAssignedAuditorForZone(zone, auditors);

  return {
    ...point,
    zone,
    auditorId: assigned?.id || ZONE_ASSIGNMENTS[zone].auditorId,
    auditorName: assigned?.name || ZONE_ASSIGNMENTS[zone].auditorName,
    auditorCode: assigned?.code || ZONE_ASSIGNMENTS[zone].auditorCode,
  };
}
