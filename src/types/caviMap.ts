export type CaviZone = 'Norte' | 'Centro' | 'Sur';

export interface CaviPoint {
  id: string;
  name: string;
  category: string;
  subregion: 'Norte' | 'Centro' | 'Sur';
  zone?: CaviZone;
  auditorId?: string;
  auditorName?: string;
  auditorCode?: string;
  municipality: string;
  address?: string;
  lat: number;
  lng: number;
  codePdv?: string;
  channel?: 'CDA' | 'PF' | 'CM' | string;
  costCenter?: string;
  startDate?: string;
}

export type PointType = 'CDA' | 'PF' | 'CM';

export interface PointTypeMeta {
  type: PointType;
  label: string;
  fullLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
  description: string;
}

export const POINT_TYPE_CONFIG: Record<PointType, PointTypeMeta> = {
  CDA: {
    type: 'CDA',
    label: 'CDA',
    fullLabel: 'Centro de acopio',
    color: '#0284c7',
    bgColor: '#0369a1',
    borderColor: '#38bdf8',
    textColor: '#ffffff',
    icon: 'hub',
    description: 'Centro de acopio',
  },
  PF: {
    type: 'PF',
    label: 'PF',
    fullLabel: 'Punto Físico',
    color: '#ea580c',
    bgColor: '#c2410c',
    borderColor: '#fb923c',
    textColor: '#ffffff',
    icon: 'storefront',
    description: 'Punto Físico',
  },
  CM: {
    type: 'CM',
    label: 'CM',
    fullLabel: 'Compumueble',
    color: '#10b981',
    bgColor: '#059669',
    borderColor: '#34d399',
    textColor: '#ffffff',
    icon: 'desktop_windows',
    description: 'Compumueble',
  },
};

/**
 * Checks if a point or text represents a banking institution, ATM, or corresponsal bancario
 * to be eliminated according to the business rules.
 */
export function isBankPoint(name?: string, category?: string, channel?: string, costCenter?: string): boolean {
  const text = `${name || ''} ${category || ''} ${channel || ''} ${costCenter || ''}`.toUpperCase();
  return (
    text.includes('BANCO') ||
    text.includes('BANCOLOMBIA') ||
    text.includes('DAVIVIENDA') ||
    text.includes('BBVA') ||
    text.includes('GRUPO AVAL') ||
    text.includes('BANCO POPULAR') ||
    text.includes('BANCO AGRARIO') ||
    text.includes('BANCO DE BOGOTA') ||
    text.includes('BANCO OCCIDENTE') ||
    text.includes('CORRESPONSAL BANCARIO') ||
    text.includes('CORRESPONSAL BANCO') ||
    text.includes('BANCARIO')
  );
}

/**
 * Resolves PointType strictly as:
 * - CDA (Centro de acopio): Sedes principales de acopio
 * - PF (Punto Físico): Puntos de venta directos (PDV / PF)
 * - CM (Compumueble): Equipos y muebles en aliados comerciales (CPM / CM)
 * Never mixes CDA with CM.
 * Eliminates banks.
 */
export function getPointTypeMeta(channel?: string, category?: string, costCenter?: string, name?: string): PointTypeMeta {
  const ch = (channel || '').toUpperCase().trim();
  const cat = (category || '').toUpperCase().trim();
  const nm = (name || '').toUpperCase().trim();
  const cc = (costCenter || '').toUpperCase().trim();

  // 1. Direct channel matching
  if (ch === 'CDA' || ch.includes('CENTRO DE ACOPIO') || ch.includes('ACOPIO')) {
    return POINT_TYPE_CONFIG.CDA;
  }
  if (ch === 'PF' || ch.includes('PUNTO FISICO') || ch.includes('PUNTO FÍSICO') || ch.includes('FIJO')) {
    return POINT_TYPE_CONFIG.PF;
  }
  if (ch === 'CM' || ch.includes('COMPUMUEBLE') || ch.includes('COMPU')) {
    return POINT_TYPE_CONFIG.CM;
  }

  // 2. Name-based matching
  // CDA: Centro de acopio (e.g. "CDA RIOHACHA", "PDV - CDA SEDE LA 10", "PVT -CDA COQUIVACOA")
  if (
    nm.startsWith('CDA ') ||
    nm.startsWith('CDA-') ||
    nm.startsWith('PDV - CDA') ||
    nm.startsWith('PVT -CDA') ||
    nm.startsWith('SEDE CDA') ||
    nm.includes('CENTRO DE ACOPIO') ||
    nm.includes('CENTRO ACOPIO')
  ) {
    return POINT_TYPE_CONFIG.CDA;
  }

  // CM: Compumueble (strictly separate, e.g. "CPM153 ESTERLINA", "CM TIENDA", "CPM06 TALLER")
  if (
    nm.startsWith('CM ') ||
    nm.startsWith('CM-') ||
    nm.startsWith('CPM') ||
    nm.includes('COMPUMUEBLE') ||
    cat.includes('COMPUMUEBLE') ||
    cat === 'CM'
  ) {
    return POINT_TYPE_CONFIG.CM;
  }

  // PF: Punto Físico (e.g. "PDV CALLE 10", "PDV SUCHIMMA", "PF 01")
  if (
    nm.startsWith('PF ') ||
    nm.startsWith('PF-') ||
    nm.startsWith('PDV ') ||
    nm.startsWith('PDV-') ||
    nm.startsWith('PUNTO ') ||
    nm.startsWith('PUNTOVENTA') ||
    nm.includes('PUNTO FISICO') ||
    nm.includes('PUNTO FÍSICO') ||
    cat.includes('PUNTO FISICO') ||
    cat.includes('PUNTO FÍSICO') ||
    cat === 'PF'
  ) {
    return POINT_TYPE_CONFIG.PF;
  }

  // 3. Category matching
  if (cat.includes('CENTRO DE ACOPIO') || cat === 'CDA') return POINT_TYPE_CONFIG.CDA;
  if (cat.includes('COMPUMUEBLE') || cat === 'CM') return POINT_TYPE_CONFIG.CM;
  if (cat.includes('PUNTO FISICO') || cat.includes('PUNTO FÍSICO') || cat === 'PF') return POINT_TYPE_CONFIG.PF;

  // 4. Cost center hints (e.g. cost center is CDA RIOHPRINCP, but point is a PDV)
  if (cc.includes('CDA') || cc.includes('7404')) {
    return POINT_TYPE_CONFIG.PF;
  }

  // 5. Default fallback: Punto Físico (PF)
  return POINT_TYPE_CONFIG.PF;
}

