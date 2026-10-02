import { CaviPoint, isBankPoint } from '../types/caviMap';

export interface ParseResult {
  points: CaviPoint[];
  errors: string[];
  totalParsed: number;
}

/**
 * Auto-corrects swapped or corrupted coordinates for Colombia/La Guajira:
 * La Guajira latitudes are approximately +10.0 to +12.8
 * La Guajira longitudes are approximately -73.8 to -71.0
 */
export function sanitizeCoordinates(rawLat: number, rawLng: number): { lat: number; lng: number } {
  let lat = rawLat;
  let lng = rawLng;

  // Handle accidental negative latitude (e.g., -172.1447 / 11.2245 typo)
  if (lat < 0 && lng > 0) {
    const temp = lat;
    lat = lng;
    lng = temp;
  }

  // Handle -172 instead of -72
  if (lng < -170 && lng > -175) {
    lng = lng + 100; // e.g. -172.1447 -> -72.1447
  }

  // Handle inverted positive lat/lng
  if (lat > 50 && lng < 20) {
    const temp = lat;
    lat = lng;
    lng = -temp;
  }

  // Ensure longitude is negative in Colombia
  if (lng > 0 && lng >= 70 && lng <= 76) {
    lng = -lng;
  }

  return { lat, lng };
}

/**
 * Deduce municipality from point name, address, cost center, or geographic coordinates
 */
export function deduceMunicipality(text: string, lat?: number, lng?: number): string {
  const t = text.toLowerCase();
  if (
    t.includes('riohacha') ||
    t.includes('rioacha') ||
    t.includes('rioh') ||
    t.includes('riohprincp') ||
    t.includes('7404')
  ) {
    return 'Riohacha';
  }
  if (t.includes('maicao')) return 'Maicao';
  if (t.includes('uribia')) return 'Uribia';
  if (t.includes('manaure')) return 'Manaure';
  if (t.includes('albania') || t.includes('cuestecita')) return 'Albania';
  if (t.includes('fonseca') || t.includes('conejo')) return 'Fonseca';
  if (t.includes('san juan') || t.includes('sanjuan')) return 'San Juan del Cesar';
  if (t.includes('barrancas') || t.includes('barranca')) return 'Barrancas';
  if (t.includes('hatonuevo')) return 'Hatonuevo';
  if (t.includes('villanueva')) return 'Villanueva';
  if (t.includes('urumita')) return 'Urumita';
  if (t.includes('dibulla') || t.includes('mingueo') || t.includes('palomino')) return 'Dibulla';
  if (t.includes('distraccion') || t.includes('distracción')) return 'Distracción';
  if (t.includes('molino')) return 'El Molino';
  if (t.includes('jagua')) return 'La Jagua del Pilar';

  // Fallback coordinate bounding box in La Guajira
  if (lat && lng) {
    if (lat >= 11.40 && lat <= 11.65 && lng <= -72.70 && lng >= -73.20) return 'Riohacha';
    if (lat >= 11.25 && lat <= 11.45 && lng <= -72.10 && lng >= -72.45) return 'Maicao';
    if (lat >= 11.60 && lat <= 12.50 && lng <= -71.10 && lng >= -72.50) return 'Uribia';
    if (lat >= 11.65 && lat <= 11.85 && lng <= -72.35 && lng >= -72.60) return 'Manaure';
    if (lat >= 10.80 && lat <= 10.98 && lng <= -72.75 && lng >= -72.95) return 'Fonseca';
    if (lat >= 10.65 && lat <= 10.85 && lng <= -72.95 && lng >= -73.15) return 'San Juan del Cesar';
  }

  return 'Riohacha';
}

/**
 * Deduce regional subregion based on municipality, category, or zone text.
 * Strictly 'Norte' | 'Centro' | 'Sur'.
 */
export function deduceSubregion(municipality: string, categoryText: string): 'Norte' | 'Centro' | 'Sur' {
  const cat = categoryText.toLowerCase();
  if (
    cat.includes('centro') ||
    cat.includes('7400') ||
    cat.includes('7404') ||
    cat.includes('rioh') ||
    cat.includes('riohprincp')
  ) {
    return 'Centro';
  }
  if (cat.includes('norte')) {
    return 'Norte';
  }
  if (cat.includes('sur')) {
    return 'Sur';
  }

  const mun = municipality.toLowerCase();
  if (
    mun.includes('riohacha') ||
    mun.includes('maicao') ||
    mun.includes('albania') ||
    mun.includes('hatonuevo') ||
    mun.includes('barrancas') ||
    mun.includes('distraccion')
  ) {
    return 'Centro';
  }
  if (mun.includes('uribia') || mun.includes('manaure') || mun.includes('dibulla')) {
    return 'Norte';
  }
  return 'Sur';
}

/**
 * Strict resolution:
 * CDA: Centro de acopio
 * PF: Punto Físico
 * CM: Compumueble
 * Never confuses an administrative cost center (e.g. CCOSTO CDA RIOHPRINCP) with the point type.
 * Never includes banks or etc.
 */
export function resolvePdvFormatAndChannel(
  rawChannel?: string,
  rawName?: string,
  rawDescription?: string,
  rawCostCenter?: string
): { channel: 'CDA' | 'PF' | 'CM'; category: string } {
  const ch = (rawChannel || '').toUpperCase().trim();
  const nm = (rawName || '').toUpperCase().trim();
  const desc = (rawDescription || '').toUpperCase().trim();
  const cc = (rawCostCenter || '').toUpperCase().trim();

  // 1. Direct channel matching
  if (ch === 'CDA' || ch.includes('CENTRO DE ACOPIO') || ch.includes('ACOPIO')) {
    return { channel: 'CDA', category: 'Centro de acopio (CDA)' };
  }
  if (ch === 'PF' || ch.includes('PUNTO FISICO') || ch.includes('PUNTO FÍSICO') || ch.includes('FIJO')) {
    return { channel: 'PF', category: 'Punto Físico (PF)' };
  }
  if (ch === 'CM' || ch.includes('COMPUMUEBLE') || ch.includes('COMPU')) {
    return { channel: 'CM', category: 'Compumueble (CM)' };
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
    return { channel: 'CDA', category: 'Centro de acopio (CDA)' };
  }

  // CM: Compumueble (e.g. "CPM153 ESTERLINA", "CM TIENDA", "CPM06 TALLER")
  if (
    nm.startsWith('CM ') ||
    nm.startsWith('CM-') ||
    nm.startsWith('CPM') ||
    nm.includes('COMPUMUEBLE')
  ) {
    return { channel: 'CM', category: 'Compumueble (CM)' };
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
    nm.includes('PUNTO FÍSICO')
  ) {
    return { channel: 'PF', category: 'Punto Físico (PF)' };
  }

  // 3. Fallback: If it belongs to a CDA cost center or description mentions punto de venta -> PF
  if (cc.includes('CDA') || cc.includes('7404') || desc.includes('PUNTOVENTA') || desc.includes('PDV')) {
    return { channel: 'PF', category: 'Punto Físico (PF)' };
  }

  // 4. Default: Punto Físico (PF)
  return { channel: 'PF', category: 'Punto Físico (PF)' };
}

/**
 * Helper to parse HTML / CDATA key-value blocks typically found in KML description tags:
 * e.g. COD_ZONA: 7400<br>ZONA: ZONA GUAJIRA CENTRO<br>COD_CCOSTO: 7404<br>CCOSTO: CDA RIOHPRINCP<br>COD_PDV: 16943<br>PUNTOVENTA: PDV CALLE 10...
 */
export function parseKmlDescriptionFields(rawDesc: string) {
  // Strip CDATA wrapper if present and convert <br> to newlines
  const text = rawDesc
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&lt;br\s*\/?&gt;/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '\n') // remove any other HTML tags
    .replace(/&nbsp;/gi, ' ')
    .trim();

  const fields: Record<string, string> = {};
  const lines = text.split('\n');

  for (const line of lines) {
    const sep = line.indexOf(':');
    if (sep !== -1) {
      const key = line.slice(0, sep).trim().toUpperCase().replace(/[_\s-]+/g, '');
      const val = line.slice(sep + 1).trim();
      if (key && val) {
        fields[key] = val;
      }
    }
  }

  const extractRegex = (regex: RegExp) => {
    const m = text.match(regex);
    return m ? m[1].trim() : '';
  };

  const codZona = fields['CODZONA'] || fields['CODIGOZONA'] || extractRegex(/COD_?ZONA:\s*([^<\r\n]+)/i);
  const zona = fields['ZONA'] || extractRegex(/ZONA:\s*([^<\r\n]+)/i);
  const codCcosto = fields['CODCCOSTO'] || fields['CODIGOCCOSTO'] || extractRegex(/COD_?CCOSTO:\s*([^<\r\n]+)/i);
  const ccosto = fields['CCOSTO'] || fields['CENTROCOSTO'] || fields['CENTRO_COSTO'] || extractRegex(/CCOSTO:\s*([^<\r\n]+)/i);
  const codPdv = fields['CODPDV'] || fields['CODIGOPDV'] || fields['COD'] || fields['CODIGO'] || extractRegex(/COD_?PDV:\s*([^<\r\n]+)/i);
  const puntoVenta = fields['PUNTOVENTA'] || fields['PUNTO'] || fields['NOMBRE'] || extractRegex(/(?:PUNTO_?VENTA|PUNTOVENTA|NOMBRE):\s*([^<\r\n]+)/i);
  const fechaInicio = fields['FECHAINICIO'] || fields['FECHA'] || extractRegex(/FECHA\s*INICIO:\s*([^<\r\n]+)/i);
  const latStr = fields['LATITUD'] || fields['LAT'] || extractRegex(/LATITUD:?\s*([-\d.]+)/i);
  const lngStr = fields['LONGITUD'] || fields['LNG'] || fields['LON'] || extractRegex(/LONGITUD:?\s*([-\d.]+)/i);
  const canal = fields['CANAL'] || fields['FORMATO'] || fields['TIPO'] || extractRegex(/CANAL:\s*([^<\r\n]+)/i);
  const direccion = fields['DIRECCION'] || fields['DIRECCIÓN'] || fields['ADDRESS'] || extractRegex(/DIRECCI[OÓ]N:\s*([^<\r\n]+)/i);
  const municipio = fields['MUNICIPIO'] || fields['CIUDAD'] || extractRegex(/MUNICIPIO:\s*([^<\r\n]+)/i);

  return {
    rawCleanText: text,
    codZona,
    zona,
    codCcosto,
    ccosto,
    codPdv,
    puntoVenta,
    fechaInicio,
    latStr,
    lngStr,
    canal,
    direccion,
    municipio,
  };
}

/**
 * Robust parser for .kml, .xml or .txt files.
 * Strictly separates:
 * - CDA: Centro de acopio
 * - PF: Punto Físico
 * - CM: Compumueble
 * Eliminates banks and etc.
 */
export function parsePointsFromText(content: string, filename = 'archivo.txt'): ParseResult {
  const points: CaviPoint[] = [];
  const errors: string[] = [];

  const trimmed = content.trim();
  if (!trimmed) {
    return { points: [], errors: ['El archivo está vacío.'], totalParsed: 0 };
  }

  // 1. CHECK IF KML PLACEMARKS EXIST VIA DOMPARSER
  const hasPlacemarks = /<placemark/i.test(trimmed);
  const hasKmlStructure = /<kml/i.test(trimmed) || /xmlns="http:\/\/www\.opengis\.net\/kml/i.test(trimmed);

  if (hasPlacemarks || hasKmlStructure) {
    try {
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(trimmed, 'text/xml');
        const parserError = xmlDoc.getElementsByTagName('parsererror');

        if (parserError.length === 0) {
          const placemarks = xmlDoc.getElementsByTagName('Placemark');

          for (let i = 0; i < placemarks.length; i++) {
            const pm = placemarks[i];
            try {
              const nameEl = pm.getElementsByTagName('name')[0];
              const rawName = nameEl?.textContent?.trim() || '';

              const descEl = pm.getElementsByTagName('description')[0];
              const rawDescription = descEl?.textContent?.trim() || '';

              const addressEl = pm.getElementsByTagName('address')[0];
              const address = addressEl?.textContent?.trim() || '';

              const descFields = parseKmlDescriptionFields(rawDescription);

              let name = rawName;
              const isGenericName = !rawName || /^punto\s*\d+$/i.test(rawName) || /^placemark$/i.test(rawName) || /^untitled/i.test(rawName);
              if (descFields.puntoVenta) {
                name = descFields.puntoVenta;
              } else if (isGenericName && descFields.ccosto) {
                name = descFields.ccosto;
              } else if (!name) {
                name = `Punto ${i + 1}`;
              }

              let lat: number | null = null;
              let lng: number | null = null;

              const coordsEl = pm.getElementsByTagName('coordinates')[0];
              if (coordsEl && coordsEl.textContent) {
                const raw = coordsEl.textContent.trim().split(',');
                if (raw.length >= 2) {
                  const parsedLng = parseFloat(raw[0]);
                  const parsedLat = parseFloat(raw[1]);
                  if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                    lng = parsedLng;
                    lat = parsedLat;
                  }
                }
              }

              // Fallback to description coordinates
              if ((lat === null || lng === null || isNaN(lat) || isNaN(lng)) && descFields.latStr && descFields.lngStr) {
                const parsedLat = parseFloat(descFields.latStr);
                const parsedLng = parseFloat(descFields.lngStr);
                if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                  lat = parsedLat;
                  lng = parsedLng;
                }
              }

              if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
                const sanitized = sanitizeCoordinates(lat, lng);
                const { channel, category } = resolvePdvFormatAndChannel(descFields.canal, name, rawDescription);
                const mun = descFields.municipio || deduceMunicipality(`${name} ${descFields.ccosto} ${address} ${descFields.direccion}`, sanitized.lat, sanitized.lng);
                const subregion = deduceSubregion(mun, `${descFields.zona} ${descFields.codZona} ${descFields.codCcosto}`);

                points.push({
                  id: `kml-pt-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
                  name,
                  category,
                  subregion,
                  zone: subregion,
                  municipality: mun,
                  address: descFields.direccion || address || `${name}, ${mun}`,
                  lat: sanitized.lat,
                  lng: sanitized.lng,
                  codePdv: descFields.codPdv || `PDV-${points.length + 1}`,
                  channel,
                  costCenter: descFields.ccosto || undefined,
                  startDate: descFields.fechaInicio,
                });
              }
            } catch (err: any) {
              errors.push(`Placemark #${i + 1}: ${err?.message || 'Error procesando punto'}`);
            }
          }

          if (points.length > 0) {
            return { points, errors, totalParsed: points.length };
          }
        }
      }
    } catch {
      // DOMParser failed or not available, fallback to regex
    }
  }

  // 2. CHECK IF DESCRIPTION BLOCKS EXIST (e.g. description><![CDATA[...]]> or <description>...)
  const hasDescriptionBlocks = /(?:<description[^>]*>|description>)/i.test(trimmed);
  if (hasDescriptionBlocks) {
    const descRegex = /(?:<description[^>]*>|description>)([\s\S]*?)(?:<\/description>|(?=\s*(?:<description|description>))|$)/gi;
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = descRegex.exec(trimmed)) !== null) {
      const raw = match[1]?.trim();
      if (!raw) continue;
      idx++;

      const descFields = parseKmlDescriptionFields(raw);
      let lat = descFields.latStr ? parseFloat(descFields.latStr) : null;
      let lng = descFields.lngStr ? parseFloat(descFields.lngStr) : null;

      // Also check if coordinates are embedded in [lat, lng] or plain text inside the description
      if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
        const coordMatch = raw.match(/([-\d.]+)\s*,\s*([-\d.]+)/);
        if (coordMatch) {
          const v1 = parseFloat(coordMatch[1]);
          const v2 = parseFloat(coordMatch[2]);
          if (!isNaN(v1) && !isNaN(v2)) {
            if (v1 < 0 && v2 > 0) {
              lng = v1;
              lat = v2;
            } else {
              lat = v1;
              lng = v2;
            }
          }
        }
      }

      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        const sanitized = sanitizeCoordinates(lat, lng);
        const name = descFields.puntoVenta || descFields.ccosto || `Punto ${idx}`;
        const { channel, category } = resolvePdvFormatAndChannel(descFields.canal, name, raw);
        const mun = descFields.municipio || deduceMunicipality(`${name} ${descFields.ccosto} ${descFields.direccion}`, sanitized.lat, sanitized.lng);
        const subregion = deduceSubregion(mun, `${descFields.zona} ${descFields.codZona} ${descFields.codCcosto}`);

        points.push({
          id: `desc-pt-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          category,
          subregion,
          zone: subregion,
          municipality: mun,
          address: descFields.direccion || `${name}, ${mun}`,
          lat: sanitized.lat,
          lng: sanitized.lng,
          codePdv: descFields.codPdv || `PDV-${points.length + 1}`,
          channel,
          costCenter: descFields.ccosto || undefined,
          startDate: descFields.fechaInicio,
        });
      }
    }

    if (points.length > 0) {
      return { points, errors, totalParsed: points.length };
    }
  }

  // 3. CHECK IF REGEX KML PLACEMARKS CAN EXTRACT FROM NON-STANDARD STREAM
  const regexResult = parseKmlWithRegex(trimmed);
  if (regexResult.points.length > 0) {
    return regexResult;
  }

  // 4. CHECK IF PLAIN TEXT / CSV / TSV / KEY-VALUE (.txt)
  return parsePlainTextFormat(trimmed, filename);
}

/**
 * Regex-based KML parser fallback for non-standard XML or partial KML streams
 */
function parseKmlWithRegex(kml: string): ParseResult {
  const points: CaviPoint[] = [];
  const errors: string[] = [];

  const placemarkRegex = /<Placemark[\s\S]*?>([\s\S]*?)<\/Placemark>/gi;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = placemarkRegex.exec(kml)) !== null) {
    idx++;
    const block = match[1];
    const nameMatch = block.match(/<name>(.*?)<\/name>/i);
    let name = nameMatch ? nameMatch[1].trim() : '';

    const descMatch = block.match(/<description>([\s\S]*?)<\/description>/i);
    const rawDesc = descMatch ? descMatch[1] : '';
    const descFields = parseKmlDescriptionFields(rawDesc);

    if (descFields.puntoVenta) {
      name = descFields.puntoVenta;
    } else if (!name || /^punto\s*\d+$/i.test(name)) {
      name = descFields.ccosto || `Punto ${idx}`;
    }

    const coordsMatch = block.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
    let lat: number | null = null;
    let lng: number | null = null;

    if (coordsMatch) {
      const parts = coordsMatch[1].trim().split(',');
      if (parts.length >= 2) {
        lng = parseFloat(parts[0]);
        lat = parseFloat(parts[1]);
      }
    }

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      if (descFields.latStr && descFields.lngStr) {
        lat = parseFloat(descFields.latStr);
        lng = parseFloat(descFields.lngStr);
      }
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      const sanitized = sanitizeCoordinates(lat, lng);
      const { channel, category } = resolvePdvFormatAndChannel(descFields.canal, name, rawDesc);
      const mun = descFields.municipio || deduceMunicipality(`${name} ${descFields.ccosto} ${rawDesc}`, sanitized.lat, sanitized.lng);
      const subregion = deduceSubregion(mun, `${descFields.zona} ${descFields.codZona}`);

      points.push({
        id: `regex-kml-${Date.now()}-${idx}`,
        name,
        category,
        subregion,
        zone: subregion,
        municipality: mun,
        address: descFields.direccion || `${name}, ${mun}`,
        lat: sanitized.lat,
        lng: sanitized.lng,
        codePdv: descFields.codPdv || `PDV-${points.length + 1}`,
        channel,
        costCenter: descFields.ccosto || undefined,
        startDate: descFields.fechaInicio,
      });
    }
  }

  return { points, errors, totalParsed: points.length };
}

/**
 * Plain text format parser (.txt files)
 * Supports:
 * - HTML-like line breaks (<br>) converted to real linebreaks
 * - Key-Value blocks:
 *     COD_ZONA: 7400
 *     ZONA: ZONA GUAJIRA CENTRO
 *     COD_CCOSTO: 7404
 *     CCOSTO: CDA RIOHPRINCP
 *     COD_PDV: 16943
 *     PUNTOVENTA: PDV CALLE 10
 *     LATITUD: 11.548549
 *     LONGITUD: -72.908154
 *     CANAL: PF # Opciones válidas: CDA (Centro de acopio) | PF (Punto Físico) | CM (Compumueble)
 * - CSV/TSV format: Nombre, Latitud, Longitud, Canal, Municipio, Código PDV, Dirección
 */
function parsePlainTextFormat(text: string, filename: string): ParseResult {
  const points: CaviPoint[] = [];
  const errors: string[] = [];

  // Normalize HTML breaks, CDATA tags, and standard line breaks
  const normalizedText = text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&lt;br\s*\/?&gt;/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '\n')
    .replace(/&nbsp;/gi, ' ');

  const lines = normalizedText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Check if it's Key-Value block style
  const hasKeyValues = lines.some((l) =>
    /^(cod_zona|zona|cod_ccosto|ccosto|cod_pdv|puntoventa|nombre|name|latitud|lat|longitud|lng|lon|canal|formato|municipio|direccion|fechainicio|fecha):/i.test(l)
  );

  if (hasKeyValues) {
    let currentPoint: Partial<CaviPoint> & { codZona?: string; codCcosto?: string } = {};

    const commitCurrentPoint = (idx: number) => {
      if (currentPoint.lat && currentPoint.lng && !isNaN(currentPoint.lat) && !isNaN(currentPoint.lng)) {
        const sanitized = sanitizeCoordinates(currentPoint.lat, currentPoint.lng);
        const name = currentPoint.name || `Punto ${points.length + 1}`;
        const mun = currentPoint.municipality || deduceMunicipality(`${name} ${currentPoint.costCenter || ''}`, sanitized.lat, sanitized.lng);
        const subregion = (currentPoint.subregion as any) || deduceSubregion(mun, `${currentPoint.category || ''} ${currentPoint.codCcosto || ''}`);
        const { channel, category } = resolvePdvFormatAndChannel(currentPoint.channel, name, '');

        points.push({
          id: `txt-kv-${Date.now()}-${points.length}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          category,
          subregion,
          zone: subregion,
          municipality: mun,
          address: currentPoint.address || `${name}, ${mun}`,
          lat: sanitized.lat,
          lng: sanitized.lng,
          codePdv: currentPoint.codePdv || `PDV-${points.length + 1}`,
          channel,
          costCenter: currentPoint.costCenter,
          startDate: currentPoint.startDate,
        });
      }
      currentPoint = {};
    };

    lines.forEach((line, idx) => {
      if (line === '---' || line === '===' || line.startsWith('//') || line.toLowerCase() === '[punto]') {
        commitCurrentPoint(idx);
        return;
      }

      const separatorIndex = line.indexOf(':');
      if (separatorIndex !== -1) {
        const rawKey = line.slice(0, separatorIndex).trim().toUpperCase().replace(/[_\s-]+/g, '');
        const value = line.slice(separatorIndex + 1).trim();

        if (rawKey === 'NOMBRE' || rawKey === 'NAME' || rawKey === 'PUNTOVENTA' || rawKey === 'PDV') {
          if (currentPoint.name && currentPoint.lat) {
            commitCurrentPoint(idx);
          }
          currentPoint.name = value;
        } else if (rawKey === 'LATITUD' || rawKey === 'LAT' || rawKey === 'LATITUDE') {
          currentPoint.lat = parseFloat(value);
        } else if (rawKey === 'LONGITUD' || rawKey === 'LNG' || rawKey === 'LON' || rawKey === 'LONGITUDE') {
          currentPoint.lng = parseFloat(value);
        } else if (rawKey === 'CANAL' || rawKey === 'CHANNEL' || rawKey === 'FORMATO') {
          currentPoint.channel = value;
        } else if (rawKey === 'CCOSTO' || rawKey === 'CENTROCOSTO' || rawKey === 'CODCOCCOSTO') {
          currentPoint.costCenter = value;
        } else if (rawKey === 'CODCCOSTO' || rawKey === 'CODIGOCCOSTO') {
          currentPoint.codCcosto = value;
        } else if (rawKey === 'ZONA' || rawKey === 'CODZONA') {
          if (value.toUpperCase().includes('CENTRO') || value === '7400') currentPoint.subregion = 'Centro';
          else if (value.toUpperCase().includes('NORTE')) currentPoint.subregion = 'Norte';
          else if (value.toUpperCase().includes('SUR')) currentPoint.subregion = 'Sur';
        } else if (rawKey === 'MUNICIPIO' || rawKey === 'CIUDAD') {
          currentPoint.municipality = value;
        } else if (rawKey === 'CODIGO' || rawKey === 'CODPDV' || rawKey === 'CODE') {
          currentPoint.codePdv = value;
        } else if (rawKey === 'DIRECCION' || rawKey === 'DIRECCIÓN' || rawKey === 'ADDRESS') {
          currentPoint.address = value;
        } else if (rawKey === 'FECHAINICIO' || rawKey === 'FECHA') {
          currentPoint.startDate = value;
        }
      }
    });

    commitCurrentPoint(lines.length);

    if (points.length > 0) {
      return { points, errors, totalParsed: points.length };
    }
  }

  // Check CSV/TSV format
  let delimiter = ',';
  if (lines[0]?.includes('\t')) delimiter = '\t';
  else if (lines[0]?.includes(';')) delimiter = ';';

  lines.forEach((line, idx) => {
    if (line.startsWith('#') || line.startsWith('//')) return;
    const lower = line.toLowerCase();
    if (idx === 0 && (lower.includes('nombre') || lower.includes('latitud') || lower.includes('lat'))) return;

    const parts = line.split(delimiter).map((p) => p.trim());
    if (parts.length >= 2) {
      let latIdx = -1;
      let lngIdx = -1;

      for (let pIdx = 0; pIdx < parts.length; pIdx++) {
        const val = parseFloat(parts[pIdx]);
        if (!isNaN(val)) {
          if (val >= 9 && val <= 14 && latIdx === -1) {
            latIdx = pIdx;
          } else if (val <= -70 && val >= -75 && lngIdx === -1) {
            lngIdx = pIdx;
          }
        }
      }

      if (latIdx === -1 || lngIdx === -1) {
        if (!isNaN(parseFloat(parts[1])) && !isNaN(parseFloat(parts[2]))) {
          latIdx = 1;
          lngIdx = 2;
        }
      }

      if (latIdx !== -1 && lngIdx !== -1) {
        const lat = parseFloat(parts[latIdx]);
        const lng = parseFloat(parts[lngIdx]);
        const sanitized = sanitizeCoordinates(lat, lng);

        const name = parts[0] || `Punto ${idx + 1}`;
        const rawChannel = parts[3] || '';
        const mun = parts[4] || deduceMunicipality(name, sanitized.lat, sanitized.lng);
        const codePdv = parts[5] || `PDV-${idx + 1}`;
        const address = parts[6] || `${name}, ${mun}`;

        const { channel, category } = resolvePdvFormatAndChannel(rawChannel, name, '');
        const subregion = deduceSubregion(mun, `${channel} ${name}`);

        points.push({
          id: `txt-csv-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          category,
          subregion,
          zone: subregion,
          municipality: mun,
          address,
          lat: sanitized.lat,
          lng: sanitized.lng,
          codePdv,
          channel,
        });
      } else {
        errors.push(`Línea ${idx + 1}: No se detectaron coordenadas válidas (Lat, Lng).`);
      }
    }
  });

  return { points, errors, totalParsed: points.length };
}

/**
 * Generates an editable, clean TXT template string for users to download or inspect
 */
export function generateTxtTemplate(): string {
  return `# GUADIT - PLANTILLA OFICIAL DE CARGA DE PUNTOS (.txt / KML)
# Formatos válidos: CDA (Centro de acopio) | PF (Punto Físico) | CM (Compumueble)
[PUNTO]
COD_ZONA: 7400
ZONA: ZONA GUAJIRA CENTRO
COD_CCOSTO: 7404
CCOSTO: CDA RIOHPRINCP
COD_PDV: 16943
PUNTOVENTA: PDV CALLE 10
CANAL: PF
FECHA INICIO: 6/27/2019
LATITUD: 11.548549
LONGITUD: -72.908154
MUNICIPIO: Riohacha
DIRECCIÓN: Calle 10 con Carrera 15

[PUNTO]
COD_ZONA: 7400
ZONA: ZONA GUAJIRA CENTRO
COD_CCOSTO: 7404
CCOSTO: CDA RIOHPRINCP
COD_PDV: 16944
PUNTOVENTA: CDA MERCADO RIOHACHA
CANAL: CDA
FECHA INICIO: 8/15/2019
LATITUD: 11.543210
LONGITUD: -72.912450
MUNICIPIO: Riohacha
DIRECCIÓN: Mercado Nuevo Riohacha

[PUNTO]
COD_ZONA: 7400
ZONA: ZONA GUAJIRA CENTRO
COD_CCOSTO: 7404
CCOSTO: CDA RIOHPRINCP
COD_PDV: 17166
PUNTOVENTA: CPM153 ESTERLINA
CANAL: CM
FECHA INICIO: 9/01/2019
LATITUD: 11.550145
LONGITUD: -72.905354
MUNICIPIO: Riohacha
DIRECCIÓN: Calle 15 # 12-40
`;
}
