import { CaviZone } from '../data/zoneAssignments';

export interface CaviPoint {
  id: string;
  name: string;
  category: string; // 'CORRESPONSAL BBVA' | 'Corresponsal Banco Agrario' | 'Corresponsal Bancamia' | 'GRUPO AVAL' | 'REGIONAL NORTE' | 'REGIONAL SUR' | 'REGIONAL CENTRO'
  subregion: 'Norte' | 'Centro' | 'Sur' | 'Bancario';
  /** Operational zone used for route ownership. Every PDV must resolve to one zone. */
  zone?: CaviZone;
  /** Auditor assigned to the operational zone. */
  auditorId?: string;
  auditorName?: string;
  auditorCode?: string;
  municipality: string;
  address?: string;
  lat: number;
  lng: number;
  codePdv?: string;
  channel?: 'CDA' | 'PF' | 'CM' | 'Bancario' | string;
  costCenter?: string;
  startDate?: string;
}

export type PointType = 'CDA' | 'PF' | 'CM' | 'Bancario' | 'ETC';

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
  CDA: { type: 'CDA', label: 'CDA', fullLabel: 'Centro de Acopio / Distribución', color: '#0284c7', bgColor: '#0369a1', borderColor: '#38bdf8', textColor: '#ffffff', icon: 'hub', description: 'Centro de acopio y atención principal' },
  PF: { type: 'PF', label: 'PF', fullLabel: 'Punto Fijo', color: '#ea580c', bgColor: '#c2410c', borderColor: '#fb923c', textColor: '#ffffff', icon: 'storefront', description: 'Punto fijo de venta y atención directa' },
  CM: { type: 'CM', label: 'CM', fullLabel: 'Canal Tradicional / Tienda', color: '#e11d48', bgColor: '#be123c', borderColor: '#fb7185', textColor: '#ffffff', icon: 'store', description: 'Canal tradicional, tiendas de barrio y comercio local' },
  Bancario: { type: 'Bancario', label: 'BANCO', fullLabel: 'Corresponsalía Bancaria', color: '#059669', bgColor: '#047857', borderColor: '#34d399', textColor: '#ffffff', icon: 'account_balance', description: 'Corresponsal bancario (BBVA, Agrario, Bancamía, Aval)' },
  ETC: { type: 'ETC', label: 'ETC', fullLabel: 'Otro Punto de Venta', color: '#9333ea', bgColor: '#7e22ce', borderColor: '#c084fc', textColor: '#ffffff', icon: 'location_on', description: 'Punto especial o no clasificado' },
};

export function getPointTypeMeta(channel?: string, category?: string): PointTypeMeta {
  const ch = (channel || '').toUpperCase().trim();
  const cat = (category || '').toLowerCase();
  if (ch === 'CDA' || ch.includes('CDA')) return POINT_TYPE_CONFIG.CDA;
  if (ch === 'PF' || ch.includes('FIJO') || ch.includes('PF')) return POINT_TYPE_CONFIG.PF;
  if (ch === 'CM' || ch.includes('TRADICIONAL') || ch.includes('TIENDA') || ch.includes('CM')) return POINT_TYPE_CONFIG.CM;
  if (ch === 'BANCARIO' || ch.includes('BANCO') || ch.includes('AVAL') || ch.includes('BBVA') || cat.includes('corresponsal') || cat.includes('banc') || cat.includes('aval') || cat.includes('bbva')) return POINT_TYPE_CONFIG.Bancario;
  return { ...POINT_TYPE_CONFIG.ETC, label: ch ? ch.slice(0, 4) : 'PDV' };
}
