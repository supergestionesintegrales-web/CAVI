const fs = require('fs');
const path = require('path');
const { regionalNorte } = require('./dataNorte.cjs');
const { regionalSur } = require('./dataSur.cjs');
const { corresponsales, regionalCentro } = require('./dataCentro.cjs');

const allPoints = [];

// 1. Corresponsales
corresponsales.forEach((p, idx) => {
  allPoints.push({
    id: 'corr-' + (idx + 1),
    name: p.name,
    category: p.category,
    subregion: 'Bancario',
    municipality: p.mun,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    codePdv: 'CORR-' + (idx + 1),
    channel: 'Bancario',
    costCenter: p.category,
  });
});

// 2. Norte
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
    channel: p.canal,
    costCenter: p.ccosto,
  });
});

// 3. Sur
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
    channel: p.canal,
    costCenter: p.ccosto,
  });
});

// 4. Centro
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
    channel: p.canal,
    costCenter: p.ccosto,
  });
});

console.log('Total points generated:', allPoints.length);

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
