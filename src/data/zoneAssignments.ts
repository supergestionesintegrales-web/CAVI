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
  riohacha: 'Centro',
  maicao: 'Centro',
  albania: 'Centro',
  hatonuevo: 'Centro',
  barrancas: 'Centro',
  distraccion: 'Centro',
  manaure: 'Norte',
  uribia: 'Norte',
  dibulla: 'Norte',
  'san juan del cesar': 'Sur',
  fonseca: 'Sur',
  villanueva: 'Sur',
  'el molino': 'Sur',
  urumita: 'Sur',
  'la jagua del pilar': 'Sur',
  'la jagua': 'Sur',
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
  
  const fullText = normalize(`${point.zone || ''} ${point.subregion || ''} ${point.municipality || ''} ${point.address || ''} ${point.name || ''} ${point.category || ''}`);

  // Centro Check (explicit zone centro, 7400, 7404, riohacha, etc.)
  if (
    fullText.includes('centro') ||
    fullText.includes('guajira centro') ||
    fullText.includes('7400') ||
    fullText.includes('7404') ||
    fullText.includes('riohacha') ||
    fullText.includes('rioh') ||
    fullText.includes('maicao') ||
    fullText.includes('albania') ||
    fullText.includes('hatonuevo') ||
    fullText.includes('barrancas') ||
    fullText.includes('distraccion')
  ) {
    return 'Centro';
  }

  // Sur Check
  if (
    fullText.includes('san juan') ||
    fullText.includes('fonseca') ||
    fullText.includes('villanueva') ||
    fullText.includes('molino') ||
    fullText.includes('urumita') ||
    fullText.includes('jagua') ||
    fullText.includes('regional sur') ||
    fullText.includes('zona sur') ||
    fullText.includes('sur')
  ) {
    return 'Sur';
  }

  // Norte Check (Uribia, Manaure, Dibulla, etc.)
  if (
    fullText.includes('uribia') ||
    fullText.includes('manaure') ||
    fullText.includes('dibulla') ||
    fullText.includes('norte') ||
    fullText.includes('guajira norte')
  ) {
    return 'Norte';
  }

  const muni = normalize(point.municipality || '');
  if (MUNICIPALITY_ZONE[muni]) return MUNICIPALITY_ZONE[muni];

  return 'Centro';
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
