import { Auditor } from '../types';
import { CaviPoint, CaviZone } from '../types/caviMap';

export interface ZoneAssignment {
  zone: CaviZone;
  auditorId: string;
  auditorName: string;
  auditorCode: string;
}

export const ZONE_ASSIGNMENTS: Record<CaviZone, ZoneAssignment> = {
  Norte: { zone: 'Norte', auditorId: 'aud-1', auditorName: 'Samuel Ramos Quintero', auditorCode: 'AUD-104' },
  Centro: { zone: 'Centro', auditorId: 'aud-2', auditorName: 'Kleyder Rodriguez', auditorCode: 'AUD-209' },
  Sur: { zone: 'Sur', auditorId: 'aud-3', auditorName: 'Jose Aponte', auditorCode: 'AUD-088' },
};

const MUNICIPALITY_ZONE: Record<string, CaviZone> = {
  riohacha: 'Norte', manaure: 'Norte', uribia: 'Norte', dibulla: 'Norte',
  maicao: 'Centro', albania: 'Centro', hatonuevo: 'Centro', barrancas: 'Centro',
  distraccion: 'Centro', 'san juan del cesar': 'Sur', fonseca: 'Sur',
  villanueva: 'Sur', 'el molino': 'Sur', urumita: 'Sur',
  'la jagua del pilar': 'Sur', 'la jagua': 'Sur',
};

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

export function resolvePdvZone(point: {
  zone?: string;
  subregion?: string;
  municipality?: string;
  address?: string;
  name?: string;
  category?: string;
}): CaviZone {
  if (point.zone === 'Norte' || point.zone === 'Centro' || point.zone === 'Sur') return point.zone;
  if (point.subregion === 'Norte' || point.subregion === 'Centro' || point.subregion === 'Sur') return point.subregion;
  
  const muni = normalize(point.municipality || '');
  if (MUNICIPALITY_ZONE[muni]) return MUNICIPALITY_ZONE[muni];

  const fullText = normalize(`${point.municipality || ''} ${point.address || ''} ${point.name || ''} ${point.category || ''}`);
  
  // Sur Check
  if (
    fullText.includes('san juan') ||
    fullText.includes('fonseca') ||
    fullText.includes('villanueva') ||
    fullText.includes('molino') ||
    fullText.includes('urumita') ||
    fullText.includes('jagua') ||
    fullText.includes('regional sur') ||
    fullText.includes('zona sur')
  ) {
    return 'Sur';
  }

  // Centro Check
  if (
    fullText.includes('maicao') ||
    fullText.includes('albania') ||
    fullText.includes('hatonuevo') ||
    fullText.includes('barrancas') ||
    fullText.includes('distraccion') ||
    fullText.includes('regional centro') ||
    fullText.includes('zona centro')
  ) {
    return 'Centro';
  }

  // Norte Check (Default to Norte if Riohacha, Manaure, Uribia, Dibulla, etc.)
  return 'Norte';
}

export function getAssignedAuditorForZone(zone: CaviZone, auditors: Auditor[]): Auditor | undefined {
  const assignment = ZONE_ASSIGNMENTS[zone];
  return auditors.find((auditor) => auditor.id === assignment.auditorId)
    || auditors.find((auditor) => normalize(auditor.name) === normalize(assignment.auditorName))
    || auditors.find((auditor) => auditor.zone === zone);
}

export function enrichPdvWithAssignment<T extends CaviPoint>(point: T, auditors: Auditor[] = []) {
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
