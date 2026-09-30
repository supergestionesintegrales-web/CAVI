import { CaviPoint } from '../types/caviMap';

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
  if (lng > 0 && lng >= 71 && lng <= 75) {
    lng = -lng;
  }

  return { lat, lng };
}

/**
 * Deduce municipality from point name, address, or cost center
 */
export function deduceMunicipality(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('riohacha') || t.includes('rioacha')) return 'Riohacha';
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
  return 'La Guajira';
}

/**
 * Deduce regional subregion based on municipality or category
 */
export function deduceSubregion(municipality: string, category: string): 'Norte' | 'Centro' | 'Sur' | 'Bancario' {
  if (category.toLowerCase().includes('corresponsal') || category.toLowerCase().includes('aval') || category.toLowerCase().includes('banc')) {
    return 'Bancario';
  }
  const mun = municipality.toLowerCase();
  if (mun.includes('maicao') || mun.includes('uribia') || mun.includes('albania')) return 'Norte';
  if (mun.includes('riohacha') || mun.includes('manaure') || mun.includes('dibulla')) return 'Centro';
  return 'Sur';
}

/**
 * Robust parser for .txt, .kml or XML files
 */
export function parsePointsFromText(content: string, filename = 'archivo.txt'): ParseResult {
  const points: CaviPoint[] = [];
  const errors: string[] = [];

  const trimmed = content.trim();
  if (!trimmed) {
    return { points: [], errors: ['El archivo está vacío.'], totalParsed: 0 };
  }

  // 1. CHECK IF KML / XML FORMAT
  if (trimmed.includes('<kml') || trimmed.includes('<Placemark') || trimmed.startsWith('<?xml')) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(trimmed, 'text/xml');

      // Check parse errors
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        // Fallback to regex-based KML placemark extraction if DOMParser failed
        return parseKmlWithRegex(trimmed);
      }

      // Read folders
      const folders = xmlDoc.getElementsByTagName('Folder');
      const placemarks = xmlDoc.getElementsByTagName('Placemark');

      for (let i = 0; i < placemarks.length; i++) {
        const pm = placemarks[i];
        try {
          const nameEl = pm.getElementsByTagName('name')[0];
          const name = nameEl?.textContent?.trim() || `Punto ${i + 1}`;

          const descEl = pm.getElementsByTagName('description')[0];
          const description = descEl?.textContent?.trim() || '';

          const addressEl = pm.getElementsByTagName('address')[0];
          const address = addressEl?.textContent?.trim() || '';

          // Look for coordinates in <Point><coordinates>
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

          // ExtendedData search
          let channel = 'CM';
          let codePdv = '';
          let costCenter = '';
          let zoneName = '';
          let startDate = '';

          const extendedData = pm.getElementsByTagName('ExtendedData')[0];
          if (extendedData) {
            const dataEls = extendedData.getElementsByTagName('Data');
            for (let j = 0; j < dataEls.length; j++) {
              const dataName = dataEls[j].getAttribute('name');
              const valEl = dataEls[j].getElementsByTagName('value')[0];
              const val = valEl?.textContent?.trim() || '';

              if (dataName === 'LATITUD' && (!lat || isNaN(lat))) {
                const parsed = parseFloat(val);
                if (!isNaN(parsed)) lat = parsed;
              } else if (dataName === 'LONGITUD' && (!lng || isNaN(lng))) {
                const parsed = parseFloat(val);
                if (!isNaN(parsed)) lng = parsed;
              } else if (dataName === 'CANAL') {
                channel = val;
              } else if (dataName === 'COD_PDV') {
                codePdv = String(parseInt(val, 10) || val).replace('.0', '');
              } else if (dataName === 'CCOSTO') {
                costCenter = val;
              } else if (dataName === 'ZONA') {
                zoneName = val;
              } else if (dataName === 'FECHA INICIO') {
                startDate = val;
              }
            }
          }

          // Fallback coordinate search in description
          if ((lat === null || lng === null) && description) {
            const latMatch = description.match(/LATITUD:\s*([-\d.]+)/i);
            const lngMatch = description.match(/LONGITUD:\s*([-\d.]+)/i);
            if (latMatch && lngMatch) {
              lat = parseFloat(latMatch[1]);
              lng = parseFloat(lngMatch[1]);
            }
            const codMatch = description.match(/COD_PDV:\s*([0-9.]+)/i);
            if (codMatch && !codePdv) codePdv = codMatch[1].replace('.0', '');
            const canalMatch = description.match(/CANAL:\s*([A-Za-z]+)/i);
            if (canalMatch && channel === 'CM') channel = canalMatch[1];
          }

          // Parent folder category detection
          let category = 'REGIONAL CENTRO';
          let parent = pm.parentElement;
          while (parent && parent.nodeName !== 'Folder' && parent.nodeName !== 'kml') {
            parent = parent.parentElement;
          }
          if (parent && parent.nodeName === 'Folder') {
            const fName = parent.getElementsByTagName('name')[0]?.textContent?.trim();
            if (fName) category = fName;
          }

          if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
            const sanitized = sanitizeCoordinates(lat, lng);
            const mun = deduceMunicipality(`${name} ${address} ${costCenter} ${description} ${zoneName}`);
            const subregion = deduceSubregion(mun, category);

            points.push({
              id: `imported-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
              name,
              category,
              subregion,
              municipality: mun,
              address: address || description.replace(/<[^>]*>?/gm, ' ').slice(0, 80),
              lat: sanitized.lat,
              lng: sanitized.lng,
              codePdv: codePdv || `PDV-${points.length + 1}`,
              channel: channel || 'CM',
              costCenter: costCenter || category,
              startDate,
            });
          }
        } catch (err: any) {
          errors.push(`Placemark #${i + 1}: ${err?.message || 'Error procesando punto'}`);
        }
      }

      if (points.length > 0) {
        return { points, errors, totalParsed: points.length };
      }
    } catch {
      // Fallback to regex parsing if DOMParser failed
      return parseKmlWithRegex(trimmed);
    }
  }

  // 2. CHECK IF PLAIN TEXT / CSV / TSV / KEY-VALUE (.txt)
  return parsePlainTextFormat(trimmed, filename);
}

/**
 * Regex-based KML parser fallback
 */
function parseKmlWithRegex(kml: string): ParseResult {
  const points: CaviPoint[] = [];
  const errors: string[] = [];

  const placemarkRegex = /<Placemark>([\s\S]*?)<\/Placemark>/gi;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = placemarkRegex.exec(kml)) !== null) {
    idx++;
    const block = match[1];
    const nameMatch = block.match(/<name>(.*?)<\/name>/i);
    const name = nameMatch ? nameMatch[1].trim() : `Punto ${idx}`;

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
      const latMatch = block.match(/LATITUD:?\s*([-\d.]+)/i) || block.match(/<Data name="LATITUD">\s*<value>([-\d.]+)<\/value>/i);
      const lngMatch = block.match(/LONGITUD:?\s*([-\d.]+)/i) || block.match(/<Data name="LONGITUD">\s*<value>([-\d.]+)<\/value>/i);
      if (latMatch && lngMatch) {
        lat = parseFloat(latMatch[1]);
        lng = parseFloat(lngMatch[1]);
      }
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      const sanitized = sanitizeCoordinates(lat, lng);
      const mun = deduceMunicipality(block);
      const subregion = deduceSubregion(mun, 'REGIONAL');

      let channel = 'CM';
      const canalMatch = block.match(/CANAL:?\s*([a-zA-Z]+)/i) || block.match(/<Data name="CANAL">\s*<value>([a-zA-Z]+)<\/value>/i);
      if (canalMatch) channel = canalMatch[1];

      let codePdv = '';
      const pdvMatch = block.match(/COD_PDV:?\s*([0-9.]+)/i) || block.match(/<Data name="COD_PDV">\s*<value>([0-9.]+)<\/value>/i);
      if (pdvMatch) codePdv = pdvMatch[1].replace('.0', '');

      points.push({
        id: `regex-kml-${Date.now()}-${idx}`,
        name,
        category: 'Punto Importado KML/TXT',
        subregion,
        municipality: mun,
        lat: sanitized.lat,
        lng: sanitized.lng,
        codePdv: codePdv || `PDV-${points.length + 1}`,
        channel,
      });
    }
  }

  return { points, errors, totalParsed: points.length };
}

/**
 * Plain text format parser (.txt files)
 * Supports:
 * - CSV/TSV: Nombre, Latitud, Longitud, Canal, Municipio, Código PDV, Dirección
 * - Key-Value blocks:
 *     NOMBRE: Punto A
 *     LATITUD: 11.37
 *     LONGITUD: -72.23
 *     CANAL: CDA
 *     MUNICIPIO: Maicao
 * - Simple lines: "CHACARITA, 11.373769, -72.233731"
 */
function parsePlainTextFormat(text: string, filename: string): ParseResult {
  const points: CaviPoint[] = [];
  const errors: string[] = [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Check if it's Key-Value block style (contains NOMBRE: or LATITUD:)
  const hasKeyValues = lines.some((l) => /^(nombre|name|latitud|latitude|lat|longitud|longitude|lng|canal|channel):/i.test(l));

  if (hasKeyValues) {
    let currentPoint: Partial<CaviPoint> = {};

    const commitCurrentPoint = (idx: number) => {
      if (currentPoint.lat && currentPoint.lng && !isNaN(currentPoint.lat) && !isNaN(currentPoint.lng)) {
        const sanitized = sanitizeCoordinates(currentPoint.lat, currentPoint.lng);
        const name = currentPoint.name || `Punto ${points.length + 1}`;
        const mun = currentPoint.municipality || deduceMunicipality(name);
        const subregion = deduceSubregion(mun, currentPoint.category || 'General');

        points.push({
          id: `txt-kv-${Date.now()}-${points.length}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          category: currentPoint.category || 'Importado TXT',
          subregion,
          municipality: mun,
          address: currentPoint.address,
          lat: sanitized.lat,
          lng: sanitized.lng,
          codePdv: currentPoint.codePdv || `PDV-${points.length + 1}`,
          channel: currentPoint.channel || 'CM',
          costCenter: currentPoint.costCenter,
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
        const key = line.slice(0, separatorIndex).trim().toLowerCase();
        const value = line.slice(separatorIndex + 1).trim();

        if (key === 'nombre' || key === 'name' || key === 'puntoventa' || key === 'pdv') {
          if (currentPoint.name && currentPoint.lat) {
            commitCurrentPoint(idx);
          }
          currentPoint.name = value;
        } else if (key === 'latitud' || key === 'lat' || key === 'latitude') {
          currentPoint.lat = parseFloat(value);
        } else if (key === 'longitud' || key === 'lng' || key === 'lon' || key === 'longitude') {
          currentPoint.lng = parseFloat(value);
        } else if (key === 'canal' || key === 'channel' || key === 'formato') {
          currentPoint.channel = value;
        } else if (key === 'municipio' || key === 'ciudad' || key === 'mun') {
          currentPoint.municipality = value;
        } else if (key === 'codigo' || key === 'cod_pdv' || key === 'codigo_pdv' || key === 'code') {
          currentPoint.codePdv = value;
        } else if (key === 'direccion' || key === 'dirección' || key === 'address') {
          currentPoint.address = value;
        } else if (key === 'categoria' || key === 'categoría' || key === 'category' || key === 'zona') {
          currentPoint.category = value;
        } else if (key === 'ccosto' || key === 'centro_costo') {
          currentPoint.costCenter = value;
        }
      }
    });

    commitCurrentPoint(lines.length);

    if (points.length > 0) {
      return { points, errors, totalParsed: points.length };
    }
  }

  // Check if CSV/TSV or Comma separated
  let delimiter = ',';
  if (lines[0]?.includes('\t')) delimiter = '\t';
  else if (lines[0]?.includes(';')) delimiter = ';';

  // Process rows
  lines.forEach((line, idx) => {
    // Skip comment lines or obvious headers
    if (line.startsWith('#') || line.startsWith('//')) return;
    const lower = line.toLowerCase();
    if (idx === 0 && (lower.includes('nombre') || lower.includes('latitud') || lower.includes('lat'))) return;

    const parts = line.split(delimiter).map((p) => p.trim());
    if (parts.length >= 2) {
      // Find numeric latitude and longitude
      let latIdx = -1;
      let lngIdx = -1;

      for (let pIdx = 0; pIdx < parts.length; pIdx++) {
        const val = parseFloat(parts[pIdx]);
        if (!isNaN(val)) {
          // Check Colombia coordinate thresholds
          if (val >= 9 && val <= 14 && latIdx === -1) {
            latIdx = pIdx;
          } else if (val <= -70 && val >= -75 && lngIdx === -1) {
            lngIdx = pIdx;
          }
        }
      }

      // If strict threshold didn't match, check indices 1 and 2
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
        const channel = parts[3] || 'CM';
        const mun = parts[4] || deduceMunicipality(name);
        const codePdv = parts[5] || `PDV-${idx + 1}`;
        const address = parts[6] || '';

        points.push({
          id: `txt-csv-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          category: 'Cargado desde ' + filename,
          subregion: deduceSubregion(mun, 'Regional'),
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
  return `# GUADIT - PLANTILLA OFICIAL DE CARGA DE PUNTOS (.txt)
# Puedes usar este formato de texto o también subir directamente archivos .kml de Google Maps.
#
# Formato 1: Bloques clave-valor (recomendado):
[PUNTO]
NOMBRE: Tienda Ejemplo Central
LATITUD: 11.5475
LONGITUD: -72.9075
CANAL: CM
MUNICIPIO: Riohacha
COD_PDV: 47890
DIRECCIÓN: Calle 15 # 10-25
ZONA: ZONA GUAJIRA CENTRO

[PUNTO]
NOMBRE: Supermercado El Dorado
LATITUD: 11.3785
LONGITUD: -72.2405
CANAL: PF
MUNICIPIO: Maicao
COD_PDV: 24300
DIRECCIÓN: Carrera 9 # 14-30
ZONA: ZONA GUAJIRA NORTE

[PUNTO]
NOMBRE: Droguería La Esperanza
LATITUD: 10.8885
LONGITUD: -72.8485
CANAL: CDA
MUNICIPIO: Fonseca
COD_PDV: 7900
DIRECCIÓN: Calle 13 # 18-40
ZONA: ZONA GUAJIRA SUR
`;
}
