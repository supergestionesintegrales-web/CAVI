import React, { useState, useMemo, useRef } from 'react';
import { RouteStep, FloatingPoint, Auditor } from '../types';
import { MAP_IMAGE } from '../data/mockData';
import { parseRoutesFile, downloadRoutesTemplate } from '../utils/routesExcel';

interface GpsTerritoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: RouteStep[];
  floatingPoints: FloatingPoint[];
  auditors: Auditor[];
  onToggleStepStatus?: (stepId: string) => void;
  onImportRouteSteps?: (steps: RouteStep[]) => void;
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
}

// 15 Municipios oficiales del departamento de La Guajira con coordenadas geográficas reales
export interface MunicipalityLocation {
  id: string;
  name: string;
  department: string;
  subregion: 'Alta Guajira' | 'Media Guajira' | 'Baja Guajira / Sur';
  zone: 'Norte' | 'Centro' | 'Sur';
  lat: number;
  lng: number;
  highlight?: boolean;
}

export const GUAJIRA_MUNICIPALITIES: MunicipalityLocation[] = [
  // Alta Guajira
  { id: 'mun-1', name: 'Uribia', department: 'La Guajira', subregion: 'Alta Guajira', zone: 'Norte', lat: 11.7139, lng: -72.2660, highlight: true },
  { id: 'mun-2', name: 'Manaure', department: 'La Guajira', subregion: 'Alta Guajira', zone: 'Norte', lat: 11.7792, lng: -72.4494, highlight: true },

  // Media Guajira
  { id: 'mun-3', name: 'Riohacha (Capital)', department: 'La Guajira', subregion: 'Media Guajira', zone: 'Norte', lat: 11.5442, lng: -72.9069, highlight: true },
  { id: 'mun-4', name: 'Maicao (Frontera)', department: 'La Guajira', subregion: 'Media Guajira', zone: 'Centro', lat: 11.3778, lng: -72.2389, highlight: true },
  { id: 'mun-5', name: 'Dibulla', department: 'La Guajira', subregion: 'Media Guajira', zone: 'Norte', lat: 11.2725, lng: -73.3106 },
  { id: 'mun-6', name: 'Albania', department: 'La Guajira', subregion: 'Media Guajira', zone: 'Centro', lat: 11.1611, lng: -72.5928 },
  { id: 'mun-7', name: 'Hatonuevo', department: 'La Guajira', subregion: 'Media Guajira', zone: 'Centro', lat: 11.0617, lng: -72.7633 },

  // Baja Guajira / Sur
  { id: 'mun-8', name: 'Barrancas (Cerrejón)', department: 'La Guajira', subregion: 'Baja Guajira / Sur', zone: 'Sur', lat: 10.9572, lng: -72.7889, highlight: true },
  { id: 'mun-9', name: 'Distracción', department: 'La Guajira', subregion: 'Baja Guajira / Sur', zone: 'Sur', lat: 10.8986, lng: -72.8872 },
  { id: 'mun-10', name: 'Fonseca', department: 'La Guajira', subregion: 'Baja Guajira / Sur', zone: 'Sur', lat: 10.8861, lng: -72.8515, highlight: true },
  { id: 'mun-11', name: 'San Juan del Cesar', department: 'La Guajira', subregion: 'Baja Guajira / Sur', zone: 'Sur', lat: 10.7711, lng: -73.0025, highlight: true },
  { id: 'mun-12', name: 'El Molino', department: 'La Guajira', subregion: 'Baja Guajira / Sur', zone: 'Sur', lat: 10.6528, lng: -72.9039 },
  { id: 'mun-13', name: 'Villanueva', department: 'La Guajira', subregion: 'Baja Guajira / Sur', zone: 'Sur', lat: 10.6056, lng: -72.9789, highlight: true },
  { id: 'mun-14', name: 'Urumita', department: 'La Guajira', subregion: 'Baja Guajira / Sur', zone: 'Sur', lat: 10.5594, lng: -73.0131 },
  { id: 'mun-15', name: 'La Jagua del Pilar', department: 'La Guajira', subregion: 'Baja Guajira / Sur', zone: 'Sur', lat: 10.5103, lng: -73.0761 },
];

// Helper: Convert geographic coordinate (lat, lng) to canvas position percent (x%, y%)
// Bounding box: Longitude [-73.55, -71.85], Latitude [10.40, 12.35]
function getCoordinatesPercent(lat: number, lng: number, offsetSeed = 0) {
  const minLng = -73.55;
  const maxLng = -71.85;
  const minLat = 10.40;
  const maxLat = 12.35;

  let x = ((lng - minLng) / (maxLng - minLng)) * 82 + 9;
  let y = (1 - (lat - minLat) / (maxLat - minLat)) * 80 + 10;

  // Add slight offset for points sharing the exact same town center
  if (offsetSeed !== 0) {
    const angle = (offsetSeed * 137.5) * (Math.PI / 180);
    const radius = 2.2 + (offsetSeed % 3) * 0.8;
    x += Math.cos(angle) * radius;
    y += Math.sin(angle) * (radius * 0.85);
  }

  return {
    x: Math.max(5, Math.min(94, x)),
    y: Math.max(6, Math.min(92, y)),
  };
}

// Extract municipality coordinates from text or auditor zone
function resolvePointLocation(
  name: string,
  address: string,
  auditorZone?: string,
  indexSeed = 1
) {
  const text = (name + ' ' + address).toLowerCase();

  for (const mun of GUAJIRA_MUNICIPALITIES) {
    const munNameOnly = mun.name.toLowerCase().split(' ')[0];
    if (text.includes(munNameOnly) || text.includes(mun.name.toLowerCase())) {
      const coords = getCoordinatesPercent(mun.lat, mun.lng, indexSeed);
      return {
        lat: mun.lat + (indexSeed * 0.008 - 0.012),
        lng: mun.lng + (indexSeed * 0.009 - 0.015),
        municipality: mun.name,
        subregion: mun.subregion,
        x: coords.x,
        y: coords.y,
      };
    }
  }

  // Fallback by zone
  let baseMun = GUAJIRA_MUNICIPALITIES[2]; // Riohacha default
  if (auditorZone === 'Centro') baseMun = GUAJIRA_MUNICIPALITIES[3]; // Maicao
  if (auditorZone === 'Sur') baseMun = GUAJIRA_MUNICIPALITIES[9]; // Fonseca

  const coords = getCoordinatesPercent(baseMun.lat, baseMun.lng, indexSeed);
  return {
    lat: baseMun.lat + (indexSeed * 0.01 - 0.015),
    lng: baseMun.lng + (indexSeed * 0.01 - 0.015),
    municipality: baseMun.name,
    subregion: baseMun.subregion,
    x: coords.x,
    y: coords.y,
  };
}

export const GpsTerritoryModal: React.FC<GpsTerritoryModalProps> = ({
  isOpen,
  onClose,
  steps,
  floatingPoints,
  auditors,
  onToggleStepStatus,
  onImportRouteSteps,
  onShowToast,
}) => {
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [filterAuditor, setFilterAuditor] = useState<string>('todos');
  const [filterChannel, setFilterChannel] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'completed' | 'in_progress' | 'pending' | 'floating'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState<'satellite' | 'tactical' | 'clean'>('satellite');
  const [showRoutesLines, setShowRoutesLines] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onShowToast('Procesando archivo', `Analizando matriz GPS ${file.name}...`, 'info');
      const parsed = await parseRoutesFile(file, auditors);
      if (parsed.length === 0) {
        onShowToast('Sin datos detectados', 'El archivo no contiene filas válidas de paradas.', 'alert');
        return;
      }
      const gpsCount = parsed.filter((p) => p.hasGps).length;
      if (onImportRouteSteps) {
        onImportRouteSteps(parsed);
      }
      onShowToast(
        'Matriz Cargada con Éxito',
        `Se importaron ${parsed.length} puntos de venta (${gpsCount} geolocalizados en el mapa GPS).`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Error al importar', err?.message || 'No se pudo leer el archivo Excel/CSV.', 'alert');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Map all steps to located points
  const mappedSteps = useMemo(() => {
    return steps.map((step, idx) => {
      const auditor = auditors.find((a) => a.id === step.auditorId);
      
      let lat: number;
      let lng: number;
      let x: number;
      let y: number;
      let municipality: string;
      let subregion: string;

      if (step.hasGps && typeof step.lat === 'number' && typeof step.lng === 'number' && !isNaN(step.lat) && !isNaN(step.lng)) {
        lat = step.lat;
        lng = step.lng;
        const coords = getCoordinatesPercent(lat, lng, 0);
        x = coords.x;
        y = coords.y;
        municipality = step.municipality || resolvePointLocation(step.name, step.address, auditor?.zone, idx + 1).municipality;
        subregion = resolvePointLocation(step.name, step.address, auditor?.zone, idx + 1).subregion;
      } else {
        const loc = resolvePointLocation(step.name, step.address, auditor?.zone, idx + 1);
        lat = loc.lat;
        lng = loc.lng;
        x = loc.x;
        y = loc.y;
        municipality = step.municipality || loc.municipality;
        subregion = loc.subregion;
      }

      return {
        ...step,
        type: 'assigned' as const,
        lat,
        lng,
        municipality,
        subregion,
        x,
        y,
        channel: step.channel || 'Tradicional',
        hasGps: !!step.hasGps,
        auditorName: auditor?.name || step.auditorName || 'Sin asignar',
        auditorZone: auditor?.zone || 'Norte',
        auditorAvatar: auditor?.avatar,
      };
    });
  }, [steps, auditors]);

  // Map floating points
  const mappedFloating = useMemo(() => {
    return floatingPoints.map((fp, idx) => {
      let lat: number;
      let lng: number;
      let x: number;
      let y: number;
      let municipality: string;
      let subregion: string;

      if (fp.hasGps && typeof fp.lat === 'number' && typeof fp.lng === 'number' && !isNaN(fp.lat) && !isNaN(fp.lng)) {
        lat = fp.lat;
        lng = fp.lng;
        const coords = getCoordinatesPercent(lat, lng, 0);
        x = coords.x;
        y = coords.y;
        municipality = fp.municipality || resolvePointLocation(fp.name, fp.address, undefined, idx + 10).municipality;
        subregion = resolvePointLocation(fp.name, fp.address, undefined, idx + 10).subregion;
      } else {
        const loc = resolvePointLocation(fp.name, fp.address, undefined, idx + 10);
        lat = loc.lat;
        lng = loc.lng;
        x = loc.x;
        y = loc.y;
        municipality = fp.municipality || loc.municipality;
        subregion = loc.subregion;
      }

      return {
        id: fp.id,
        code: fp.code,
        name: fp.name,
        format: fp.format,
        channel: fp.channel || 'Tradicional',
        hasGps: !!fp.hasGps,
        address: fp.address,
        time: 'Por Despachar',
        status: 'floating' as const,
        type: 'floating' as const,
        priority: fp.priority,
        sla: fp.sla,
        details: fp.details,
        lat,
        lng,
        municipality,
        subregion,
        x,
        y,
        auditorName: 'Punto Flotante sin Asignar',
        auditorZone: 'Sin asignar',
        auditorAvatar: undefined,
      };
    });
  }, [floatingPoints]);

  const allLocatedPoints = useMemo(() => {
    return [...mappedSteps, ...mappedFloating];
  }, [mappedSteps, mappedFloating]);

  // Filter points
  const filteredPoints = useMemo(() => {
    return allLocatedPoints.filter((pt) => {
      // Auditor filter
      if (filterAuditor !== 'todos') {
        if (filterAuditor === 'floating') {
          if (pt.type !== 'floating') return false;
        } else {
          if (pt.type === 'floating' || pt.auditorId !== filterAuditor) return false;
        }
      }

      // Status filter
      if (filterStatus !== 'todos') {
        if (filterStatus === 'floating' && pt.type !== 'floating') return false;
        if (filterStatus !== 'floating' && pt.status !== filterStatus) return false;
      }

      // Channel filter
      if (filterChannel !== 'todos') {
        if (!pt.channel || !pt.channel.toLowerCase().includes(filterChannel.toLowerCase())) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          pt.name.toLowerCase().includes(q) ||
          pt.code.toLowerCase().includes(q) ||
          pt.address.toLowerCase().includes(q) ||
          pt.municipality.toLowerCase().includes(q) ||
          (pt.channel && pt.channel.toLowerCase().includes(q)) ||
          pt.auditorName.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [allLocatedPoints, filterAuditor, filterChannel, filterStatus, searchQuery]);

  const selectedPoint = useMemo(() => {
    return allLocatedPoints.find((pt) => pt.id === selectedPointId);
  }, [allLocatedPoints, selectedPointId]);

  // Totals
  const totalCompleted = mappedSteps.filter((s) => s.status === 'completed').length;
  const totalInProgress = mappedSteps.filter((s) => s.status === 'in_progress').length;
  const totalPending = mappedSteps.filter((s) => s.status === 'pending').length;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-[#0b1326] text-white w-full max-w-7xl h-[94vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#222a3d] animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER: 100% PURE CRISP WHITE TEXT */}
        <div className="bg-[#131b2e] px-4 sm:px-6 py-3.5 border-b border-[#222a3d] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#0088ff]/20 flex items-center justify-center text-[#0088ff] shrink-0 border border-[#0088ff]/30 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">satellite_alt</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-headline font-bold text-white tracking-wide" style={{ color: '#ffffff' }}>
                  GPS Red Departamental La Guajira
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#1e293b] text-white text-[11px] font-bold border border-[#3b4760]" style={{ color: '#ffffff' }}>
                  15 Municipios Monitoreados
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#064e3b] text-[#6ee7b7] text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-ping" />
                  <span>Sincronización GPS en Vivo</span>
                </span>
              </div>
              <p className="text-xs text-[#cbd5e1] truncate mt-0.5 font-medium">
                Visualización satelital a escala completa · {steps.length} paradas asignadas · {floatingPoints.length} puntos flotantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleFileUpload}
            />

            {onImportRouteSteps && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
                title="Cargar matriz con dirección, nombre de tienda, canal comercial y geolocalización GPS"
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span className="hidden sm:inline">Cargar Matriz PDV (GPS)</span>
              </button>
            )}

            <button
              type="button"
              onClick={downloadRoutesTemplate}
              className="p-2 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#cbd5e1] hover:text-white transition-colors cursor-pointer border border-[#3b4760] hidden md:flex items-center gap-1 text-xs font-medium"
              title="Descargar formato modelo Excel con columnas de GPS y Canales"
            >
              <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">download</span>
              <span>Plantilla GPS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onShowToast('GPS Actualizado', 'Se refrescaron las coordenadas satelitales de los 15 municipios.', 'info');
              }}
              className="p-2 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-white transition-colors cursor-pointer border border-[#3b4760] hidden sm:flex items-center gap-1 text-xs font-bold"
              title="Refrescar Satélite"
            >
              <span className="material-symbols-outlined text-[17px] text-[#38bdf8]">my_location</span>
              <span>Centrar GPS</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#cbd5e1] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#3b4760]"
              title="Cerrar mapa"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* TOP METRICS & QUICK FILTER BAR */}
        <div className="bg-[#171f33] px-4 sm:px-6 py-2.5 border-b border-[#222a3d] flex items-center justify-between gap-3 flex-wrap shrink-0">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs">
            <span className="text-white font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#0088ff]">fmd_good</span>
              <span>{allLocatedPoints.length} Puntos Ubicados</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#064e3b] text-[#6ee7b7] font-bold text-[11px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              <span>{totalCompleted} Completadas</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#78350f] text-[#fcd34d] font-bold text-[11px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
              <span>{totalInProgress} En Curso</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#1e293b] text-[#93c5fd] font-bold text-[11px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              <span>{totalPending} Pendientes</span>
            </span>
            {floatingPoints.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-[#991b1b] text-white font-bold text-[11px] flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">warning</span>
                <span>{floatingPoints.length} Flotantes</span>
              </span>
            )}
          </div>

          {/* Quick Search & Auditor Filter */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#94a3b8]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar punto, tienda o municipio..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0b1326] text-xs text-white placeholder-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-[#0088ff] border border-[#222a3d]"
              />
            </div>

            <select
              value={filterAuditor}
              onChange={(e) => setFilterAuditor(e.target.value)}
              className="bg-[#0b1326] text-white text-xs px-2.5 py-1.5 rounded-xl border border-[#222a3d] focus:outline-none focus:ring-1 focus:ring-[#0088ff] cursor-pointer"
            >
              <option value="todos">Todos los Auditores</option>
              {auditors.map((aud) => (
                <option key={aud.id} value={aud.id}>
                  {aud.name} ({aud.zone})
                </option>
              ))}
              <option value="floating">Solo Puntos Flotantes</option>
            </select>

            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="bg-[#0b1326] text-white text-xs px-2.5 py-1.5 rounded-xl border border-[#222a3d] focus:outline-none focus:ring-1 focus:ring-[#0088ff] cursor-pointer"
            >
              <option value="todos">Todos los Canales</option>
              <option value="Supermercados">Supermercados</option>
              <option value="Tradicional">Canal Tradicional</option>
              <option value="Droguerías">Droguerías</option>
              <option value="Hard Discount">Hard Discount</option>
              <option value="Mayorista">Mayorista</option>
              <option value="Conveniencia">Conveniencia</option>
              <option value="CDA">CDA / Acopio</option>
            </select>

            <div className="flex items-center gap-1 bg-[#0b1326] p-1 rounded-xl border border-[#222a3d]">
              <button
                type="button"
                onClick={() => setMapStyle('satellite')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  mapStyle === 'satellite' ? 'bg-[#0088ff] text-white shadow-sm shadow-[#0088ff]/30' : 'text-[#cbd5e1] hover:text-white'
                }`}
              >
                Satelital
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('tactical')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  mapStyle === 'tactical' ? 'bg-[#0088ff] text-white shadow-sm shadow-[#0088ff]/30' : 'text-[#cbd5e1] hover:text-white'
                }`}
              >
                Táctico
              </button>
            </div>
          </div>
        </div>

        {/* MAIN BODY: INTERACTIVE MAP & SIDEBAR */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">

          {/* LEFT: EXPANDED INTERACTIVE GPS CANVAS */}
          <div className="flex-1 h-full min-h-[360px] relative overflow-hidden bg-[#060e20] flex items-center justify-center select-none">
            
            {/* Map Background Layer */}
            <div
              className="absolute inset-0 transition-transform duration-300 ease-out origin-center"
              style={{
                transform: `scale(${zoomLevel})`,
              }}
            >
              {mapStyle === 'satellite' ? (
                <>
                  <img
                    src={MAP_IMAGE}
                    alt="Mapa Satelital La Guajira"
                    className="w-full h-full object-cover opacity-80 filter brightness-95 contrast-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060e20] via-transparent to-[#060e20]/40 pointer-events-none" />
                </>
              ) : (
                /* Tactical Vector Dark Grid */
                <div className="w-full h-full bg-[#060e20] relative">
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #38bdf8 1px, transparent 1px),
                        linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
                      `,
                      backgroundSize: '40px 40px',
                    }}
                  />
                  {/* Subtle Geographic Silhouette of La Guajira */}
                  <svg className="w-full h-full opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon
                      points="12,78 30,55 58,40 76,20 88,14 94,22 84,42 70,62 55,75 35,88 18,92"
                      fill="#0284c7"
                    />
                  </svg>
                </div>
              )}

              {/* Geographic Coordinates Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none border border-[#222a3d]/40">
                <span className="absolute top-2 left-2 text-[10px] font-mono text-[#38bdf8]/60">
                  12°15'N · 72°30'W (Alta Guajira)
                </span>
                <span className="absolute bottom-2 left-2 text-[10px] font-mono text-[#38bdf8]/60">
                  10°30'N · 73°05'W (Baja Guajira)
                </span>
                <span className="absolute top-2 right-2 text-[10px] font-mono text-[#38bdf8]/60">
                  Troncal del Caribe (Ruta 90)
                </span>
              </div>

              {/* Highway Arteries Connections (Troncal del Caribe / Corredor del Carbón) */}
              {showRoutesLines && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  {/* Territorial Trunk Line: Riohacha -> Maicao -> Albania -> Fonseca -> San Juan -> Villanueva */}
                  <polyline
                    points="32,45 68,52 50,65 38,76 31,82 28,88"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    strokeOpacity="0.4"
                  />
                  {/* Northern Highway: Riohacha -> Manaure -> Uribia */}
                  <polyline
                    points="32,45 42,34 66,38"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                    strokeOpacity="0.45"
                  />
                </svg>
              )}

              {/* 15 MUNICIPALITY TERRITORIAL NODES */}
              {GUAJIRA_MUNICIPALITIES.map((mun) => {
                const pos = getCoordinatesPercent(mun.lat, mun.lng);
                return (
                  <div
                    key={mun.id}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 z-10 pointer-events-none select-none"
                  >
                    <span className="w-2 h-2 rounded-full bg-white/70 shadow-sm" />
                    <span className="text-[10px] font-bold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] whitespace-nowrap">
                      {mun.name}
                    </span>
                  </div>
                );
              })}

              {/* INTERACTIVE ASSIGNED AND LOCATED PINS */}
              {filteredPoints.map((pt, idx) => {
                const isSelected = selectedPointId === pt.id;
                const isCompleted = pt.status === 'completed';
                const isCurrent = pt.status === 'in_progress';
                const isFloating = pt.type === 'floating';

                return (
                  <div
                    key={pt.id}
                    style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                    onClick={() => setSelectedPointId(pt.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group transition-transform hover:scale-125"
                  >
                    {/* Pin Glow Effect */}
                    {isCurrent && (
                      <span className="absolute -inset-2 rounded-full bg-[#f59e0b] animate-ping opacity-60 pointer-events-none" />
                    )}

                    <div
                      className={`relative flex items-center justify-center rounded-xl p-1 shadow-xl transition-all border ${
                        isSelected
                          ? 'ring-4 ring-white scale-125 z-40'
                          : ''
                      } ${
                        isFloating
                          ? 'bg-[#b91c1c] text-white border-white'
                          : isCompleted
                          ? 'bg-[#065f46] text-white border-[#34d399]'
                          : isCurrent
                          ? 'bg-[#b45309] text-white border-[#fbbf24] animate-pulse'
                          : 'bg-[#1e293b] text-[#38bdf8] border-[#3b4760]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isFloating
                          ? 'priority_high'
                          : isCompleted
                          ? 'check'
                          : isCurrent
                          ? 'hourglass_top'
                          : 'location_on'}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1 hidden sm:inline">
                        {pt.code}
                      </span>
                    </div>

                    {/* Point Label Hover Card */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                      <div className="bg-[#0b1326]/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[#2d3a58] shadow-2xl text-center whitespace-nowrap min-w-[130px]">
                        <p className="text-[11px] font-bold text-white leading-tight">
                          {pt.name}
                        </p>
                        <p className="text-[10px] text-[#cbd5e1] mt-0.5">
                          {pt.municipality} · {pt.auditorName}
                        </p>
                        <span
                          className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            isCompleted
                              ? 'bg-[#064e3b] text-[#6ee7b7]'
                              : isCurrent
                              ? 'bg-[#78350f] text-[#fcd34d]'
                              : isFloating
                              ? 'bg-[#991b1b] text-white'
                              : 'bg-[#1e293b] text-[#93c5fd]'
                          }`}
                        >
                          {isCompleted ? 'Completada' : isCurrent ? 'En Curso' : isFloating ? 'Flotante' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* MAP FLOATING CONTROLS: ZOOM & TOGGLES */}
            <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 bg-[#131b2e]/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#222a3d] shadow-xl">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2, z + 0.25))}
                className="w-8 h-8 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Acercar mapa (+)"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.25))}
                className="w-8 h-8 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Alejar mapa (-)"
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="w-8 h-8 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#38bdf8] flex items-center justify-center transition-colors cursor-pointer text-[10px] font-mono font-bold"
                title="Restablecer escala 100%"
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setShowRoutesLines(!showRoutesLines)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  showRoutesLines ? 'bg-[#0088ff] text-white shadow-sm shadow-[#0088ff]/30' : 'bg-[#1e293b] text-[#cbd5e1]'
                }`}
                title="Mostrar/Ocultar Rutas Viales"
              >
                <span className="material-symbols-outlined text-[17px]">alt_route</span>
              </button>
            </div>

            {/* MAP BOTTOM TERRITORIAL BANNER: PURE SOLID WHITE TEXT */}
            <div
              data-map-overlay="true"
              className="map-overlay-banner absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md bg-[#060e20]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-[#222a3d] z-30"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3] animate-ping shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white tracking-wide map-overlay-text" style={{ color: '#ffffff' }}>
                    Red Departamental La Guajira · 15 Municipios
                  </p>
                  <p className="text-[11px] text-white/90 truncate map-overlay-text mt-0.5" style={{ color: '#ffffff' }}>
                    {filteredPoints.length} de {allLocatedPoints.length} puntos en pantalla · Haz clic en cualquier pin para ver detalles
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE POINT DETAIL & LOCATED POINTS LIST */}
          <div className="w-full lg:w-80 xl:w-96 bg-[#131b2e] border-t lg:border-t-0 lg:border-l border-[#222a3d] flex flex-col h-72 lg:h-full shrink-0">
            
            {/* Header of Point Inspector */}
            <div className="p-3.5 border-b border-[#222a3d] bg-[#171f33] flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#0088ff]">pin_drop</span>
                <span>Puntos Asignados y Ubicados</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#1e293b] text-[11px] text-white font-mono font-bold">
                {filteredPoints.length}
              </span>
            </div>

            {/* SELECTED POINT INSPECTOR CARD (IF CLICKED) */}
            {selectedPoint && (
              <div className="p-3.5 bg-[#171f33] border-b border-[#222a3d] flex flex-col gap-2.5 animate-in fade-in">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-[#0284c7] text-white font-bold text-[10px]">
                        {selectedPoint.code}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#1e293b] text-white font-bold text-[10px]">
                        {selectedPoint.format}
                      </span>
                      {selectedPoint.channel && (
                        <span className="px-2 py-0.5 rounded bg-[#334155] text-[#38bdf8] font-bold text-[10px] border border-[#38bdf8]/30">
                          {selectedPoint.channel}
                        </span>
                      )}
                      <span className="text-[10px] text-[#0088ff] font-bold">
                        {selectedPoint.municipality}
                      </span>
                      {selectedPoint.hasGps && (
                        <span className="px-1.5 py-0.5 rounded bg-[#064e3b] text-[#4edea3] font-bold text-[9px] flex items-center gap-0.5 border border-[#4edea3]/40">
                          <span className="material-symbols-outlined text-[12px]">gps_fixed</span>
                          <span>GPS Matriz</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                      {selectedPoint.name}
                    </h3>
                    <p className="text-xs text-[#cbd5e1] mt-0.5">
                      {selectedPoint.address}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPointId(null)}
                    className="p-1 text-[#cbd5e1] hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                {/* Coordinates, Channel and Auditor */}
                <div className="bg-[#0b1326] p-2.5 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#94a3b8]">Auditor Asignado:</span>
                    <span className="font-bold text-white">{selectedPoint.auditorName}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#94a3b8]">Canal Comercial:</span>
                    <span className="font-bold text-[#38bdf8]">{selectedPoint.channel || 'Tradicional'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#94a3b8]">Coordenadas GPS:</span>
                    <span className="font-mono text-[#38bdf8] font-semibold flex items-center gap-1">
                      {selectedPoint.hasGps && (
                        <span className="material-symbols-outlined text-[12px] text-[#4edea3]">verified</span>
                      )}
                      {selectedPoint.lat.toFixed(4)}°N, {Math.abs(selectedPoint.lng).toFixed(4)}°W
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#94a3b8]">Hora / SLA:</span>
                    <span className="font-mono text-[#fcd34d] font-semibold">{selectedPoint.time}</span>
                  </div>
                </div>

                {/* Status Switcher Action */}
                {selectedPoint.type === 'assigned' && onToggleStepStatus && (
                  <button
                    type="button"
                    onClick={() => onToggleStepStatus(selectedPoint.id)}
                    className="w-full py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#0088ff]/30 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">sync</span>
                    <span>
                      Cambiar Estado (
                      {selectedPoint.status === 'completed'
                        ? 'Completada'
                        : selectedPoint.status === 'in_progress'
                        ? 'En Curso'
                        : 'Pendiente'}
                      )
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* SCROLLABLE LIST OF LOCATED POINTS */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {filteredPoints.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#94a3b8]">
                  No hay puntos coincidentes con el filtro actual.
                </div>
              ) : (
                filteredPoints.map((pt) => {
                  const isSelected = selectedPointId === pt.id;
                  const isCompleted = pt.status === 'completed';
                  const isCurrent = pt.status === 'in_progress';
                  const isFloating = pt.type === 'floating';

                  return (
                    <div
                      key={pt.id}
                      onClick={() => setSelectedPointId(pt.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#1e293b] ring-1 ring-[#0088ff] shadow-md'
                          : 'bg-[#171f33] hover:bg-[#1e293b]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0b1326] text-[#38bdf8]">
                              {pt.code}
                            </span>
                            <span className="text-[10px] font-bold text-white">
                              {pt.municipality}
                            </span>
                            {pt.channel && (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-[#334155] text-[#93c5fd]">
                                {pt.channel}
                              </span>
                            )}
                            {pt.hasGps && (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-[#064e3b] text-[#4edea3] flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">gps_fixed</span>
                                <span>GPS</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-white truncate mt-1">
                            {pt.name}
                          </p>
                          <p className="text-[11px] text-[#cbd5e1] truncate mt-0.5">
                            {pt.address}
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            isCompleted
                              ? 'bg-[#064e3b] text-[#6ee7b7]'
                              : isCurrent
                              ? 'bg-[#78350f] text-[#fcd34d]'
                              : isFloating
                              ? 'bg-[#991b1b] text-white'
                              : 'bg-[#0b1326] text-[#93c5fd]'
                          }`}
                        >
                          {isCompleted ? 'Completada' : isCurrent ? 'En Curso' : isFloating ? 'Flotante' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer with Close Button */}
            <div className="p-3 bg-[#171f33] border-t border-[#222a3d] flex items-center justify-between">
              <span className="text-[11px] text-[#cbd5e1]">
                {GUAJIRA_MUNICIPALITIES.length} Municipios Integrados
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-white text-xs font-bold transition-colors cursor-pointer border border-[#3b4760]"
              >
                Cerrar Mapa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
