const fs = require('fs');
const path = require('path');
const { regionalNorte } = require('./dataNorte.cjs');
const { regionalSur } = require('./dataSur.cjs');
const { regionalCentro } = require('./dataCentro.cjs');

const allPoints = [];

// 1. Regional Norte (Uribia, Manaure, Dibulla)
regionalNorte.forEach((p, idx) => {
  allPoints.push({
    id: 'norte-' + (p.pdv || idx + 1),
    name: p.name,
    category: 'REGIONAL NORTE',
    subregion: 'Norte',
    municipality: p.mun,
    lat: p.lat,
    lng: p.lng,
    codePdv: p.pdv,
    channel: p.canal, // 'CDA' | 'PF' | 'CM'
    costCenter: p.ccosto,
  });
});

// 2. Regional Sur (Fonseca, San Juan del Cesar, Villanueva, etc.)
regionalSur.forEach((p, idx) => {
  allPoints.push({
    id: 'sur-' + (p.pdv || idx + 1),
    name: p.name,
    category: 'REGIONAL SUR',
    subregion: 'Sur',
    municipality: p.mun,
    lat: p.lat,
    lng: p.lng,
    codePdv: p.pdv,
    channel: p.canal, // 'CDA' | 'PF' | 'CM'
    costCenter: p.ccosto,
  });
});

// 3. Regional Centro (Riohacha, Maicao, Albania, Barrancas, Hatonuevo, Distracción)
regionalCentro.forEach((p, idx) => {
  allPoints.push({
    id: 'centro-' + (p.pdv || idx + 1),
    name: p.name,
    category: 'REGIONAL CENTRO',
    subregion: 'Centro',
    municipality: p.mun,
    lat: p.lat,
    lng: p.lng,
    codePdv: p.pdv,
    channel: p.canal, // 'CDA' | 'PF' | 'CM'
    costCenter: p.ccosto,
  });
});

console.log('Total real points generated (without banks):', allPoints.length);

const fileContent = `import { CaviPoint } from '../types/caviMap';

export const CAVI_POINTS: CaviPoint[] = ${JSON.stringify(allPoints, null, 2)};

export const MUNICIPALITIES_GUAJIRA = [
  'Riohacha',
  'Maicao',
  'Uribia',
  'Manaure',
  'Albania',
  'Dibulla',
  'Barrancas',
  'Hatonuevo',
  'Fonseca',
  'San Juan del Cesar',
  'Distracción',
  'El Molino',
  'Villanueva',
  'Urumita',
  'La Jagua del Pilar'
];
`;

const outputPath = path.join(__dirname, '..', 'src', 'data', 'caviPointsData.ts');
fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log('Written to:', outputPath);
