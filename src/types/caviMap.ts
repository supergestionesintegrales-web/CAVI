export interface CaviPoint {
  id: string;
  name: string;
  category: string; // 'CORRESPONSAL BBVA' | 'Corresponsal Banco Agrario' | 'Corresponsal Bancamia' | 'GRUPO AVAL' | 'REGIONAL NORTE' | 'REGIONAL SUR' | 'REGIONAL CENTRO'
  subregion: 'Norte' | 'Centro' | 'Sur' | 'Bancario';
  municipality: string;
  address?: string;
  lat: number;
  lng: number;
  codePdv?: string;
  channel?: 'CDA' | 'PF' | 'CM' | 'Bancario' | string;
  costCenter?: string;
  startDate?: string;
}
