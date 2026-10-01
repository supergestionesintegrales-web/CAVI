import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CaviPoint, getPointTypeMeta, POINT_TYPE_CONFIG, PointType } from '../types/caviMap';
import { CAVI_POINTS, MUNICIPALITIES_GUAJIRA } from '../data/caviPointsData';
import { enrichPdvWithAssignment } from '../data/zoneAssignments';
import {
  calculateDistanceKm,
  calculateTotalRouteDistanceKm,
  formatDistance,
  estimateTravelTime,
  interpolateCoords,
  calculateBearingDegrees,
  optimizeRouteWaypoints,
  playArrivalChime,
  speakAnnouncement,
} from '../utils/geoUtils';
import { ImportPointTxtModal } from './ImportPointTxtModal';

export interface RouteWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  codePdv?: string;
  municipality?: string;
  channel?: string;
  visited?: boolean;
  visitedAt?: string;
}

interface CaviNativeMapProps {
  initialPoints?: CaviPoint[];
  initialRouteStops?: { id?: string; name: string; lat: number; lng: number; code?: string; municipality?: string; status?: string }[];
  routeGroups?: Array<{ id: string; label: string; color: string; zone?: string; stops: { id?: string; name: string; lat: number; lng: number; code?: string; municipality?: string; status?: string; zone?: string }[] }>;
  showPointCatalog?: boolean;
  resetRouteOnEmpty?: boolean;
  onPointSelect?: (point: CaviPoint) => void;
  onStopArrival?: (stop: RouteWaypoint) => void;
  className?: string;
  height?: string;
  showFullscreenButton?: boolean;
  isExpandedLarge?: boolean;
  onToggleExpandLarge?: () => void;
}

export const CaviNativeMap: React.FC<CaviNativeMapProps> = ({
  initialPoints = CAVI_POINTS,
  initialRouteStops = [],
  routeGroups = [],
  showPointCatalog = true,
  resetRouteOnEmpty = false,
  onPointSelect,
  onStopArrival,
  className = '',
  height = '640px',
  showFullscreenButton = true,
  isExpandedLarge,
  onToggleExpandLarge,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeTraceLayerRef = useRef<L.LayerGroup | null>(null);
  const routeGroupsLayerRef = useRef<L.LayerGroup | null>(null);
  const routeMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const guideVehicleMarkerRef = useRef<L.Marker | null>(null);

  // Custom persistent points added by user via .txt / KML
  const [customPoints, setCustomPoints] = useState<CaviPoint[]>(() => {
    try {
      const saved = localStorage.getItem('cavi_user_custom_points');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // All points combined
  const allAvailablePoints = useMemo(() => {
    // Every PDV shown on the map receives its operational zone and designated auditor.
    return [...customPoints, ...initialPoints].map((point) => enrichPdvWithAssignment(point));
  }, [customPoints, initialPoints]);

  // Map settings state: default to 'streets' (claro/light)
  const [mapStyle, setMapStyle] = useState<'streets' | 'light' | 'satellite'>('streets');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterRegion, setFilterRegion] = useState<'Todas' | 'Norte' | 'Centro' | 'Sur' | 'Bancario'>('Todas');
  const [filterChannel, setFilterChannel] = useState<string>('todos');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<CaviPoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // Route & Navigation state
  const [routeWaypoints, setRouteWaypoints] = useState<RouteWaypoint[]>(() => {
    if (initialRouteStops.length > 0) {
      return initialRouteStops
        .filter((s) => s.lat && s.lng)
        .map((s, idx) => ({
          id: s.id || `stop-${idx}`,
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          codePdv: s.code,
          municipality: s.municipality,
          visited: s.status === 'completed',
        }));
    }
    // When the parent supplies grouped auditor routes, do not inject the demo route.
    if (routeGroups.length > 0) return [];
    // Default initial strategic route across La Guajira
    return [
      { id: 'h1', name: 'Riohacha Centro (CDA Sede la 10)', lat: 11.548376, lng: -72.909395, municipality: 'Riohacha', channel: 'CDA' },
      { id: 'h2', name: 'Manaure Principal (CDA)', lat: 11.776552, lng: -72.446298, municipality: 'Manaure', channel: 'CDA' },
      { id: 'h3', name: 'Maicao Central (CDA Cajeros)', lat: 11.379111, lng: -72.242222, municipality: 'Maicao', channel: 'CDA' },
      { id: 'h4', name: 'Albania Plaza (PF)', lat: 11.161003, lng: -72.591945, municipality: 'Albania', channel: 'PF' },
      { id: 'h5', name: 'Fonseca Principal (CDA)', lat: 10.889, lng: -72.8499, municipality: 'Fonseca', channel: 'CDA' },
    ];
  });

  // Guided navigation simulation state
  const [isGuidedModeActive, setIsGuidedModeActive] = useState(false);
  const [isSimulationPlaying, setIsSimulationPlaying] = useState(false);
  const [currentLegIndex, setCurrentLegIndex] = useState(0); // moving between waypoints[currentLegIndex] and waypoints[currentLegIndex + 1]
  const [legProgress, setLegProgress] = useState(0); // 0.0 to 1.0
  const [simulationSpeed, setSimulationSpeed] = useState<number>(2); // 1x, 2x, 5x, 10x
  const [followCamera, setFollowCamera] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showMapToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync when the parent changes the active route.
  useEffect(() => {
    // Route assignment changes must not inherit a previous simulation/navigation state.
    if (initialRouteStops.length > 0) {
      const validStops = initialRouteStops
        .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
        .map((s, idx) => ({
          id: s.id || `stop-${idx}`,
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          codePdv: s.code,
          municipality: s.municipality,
          visited: s.status === 'completed',
        }));
      setRouteWaypoints(validStops);
      setIsGuidedModeActive(false);
      setIsSimulationPlaying(false);
      setCurrentLegIndex(0);
      setLegProgress(0);
    } else if (routeGroups.length > 0 || resetRouteOnEmpty) {
      setRouteWaypoints([]);
      setIsGuidedModeActive(false);
      setIsSimulationPlaying(false);
      setCurrentLegIndex(0);
      setLegProgress(0);
    }
  }, [initialRouteStops, routeGroups, resetRouteOnEmpty]);

  // Persist custom points
  const handleSaveCustomPoints = (newPoints: CaviPoint[], mode: 'append' | 'replace') => {
    let updated: CaviPoint[] = [];
    if (mode === 'replace') {
      updated = newPoints;
    } else {
      // Append without duplicating by coordinate/ID
      const existingKeys = new Set(customPoints.map((p) => `${p.lat.toFixed(4)}_${p.lng.toFixed(4)}`));
      const filteredNew = newPoints.filter((p) => !existingKeys.has(`${p.lat.toFixed(4)}_${p.lng.toFixed(4)}`));
      updated = [...filteredNew, ...customPoints];
    }
    setCustomPoints(updated);
    try {
      localStorage.setItem('cavi_user_custom_points', JSON.stringify(updated));
    } catch {
      // ignore
    }
    showMapToast(`Se cargaron ${newPoints.length} puntos desde el archivo .txt`);
  };

  // Total route metrics
  const totalDistanceKm = useMemo(() => {
    return calculateTotalRouteDistanceKm(routeWaypoints);
  }, [routeWaypoints]);

  const estimatedTime = useMemo(() => {
    return estimateTravelTime(totalDistanceKm);
  }, [totalDistanceKm]);

  // Point counts grouped by point type (CDA, PF, CM, Bancario, ETC)
  const typeCounts = useMemo(() => {
    const counts: Record<PointType, number> = { CDA: 0, PF: 0, CM: 0, Bancario: 0, ETC: 0 };
    allAvailablePoints.forEach((p) => {
      const meta = getPointTypeMeta(p.channel, p.category);
      counts[meta.type] = (counts[meta.type] || 0) + 1;
    });
    return counts;
  }, [allAvailablePoints]);

  // Filtered points
  const filteredPoints = useMemo(() => {
    if (!showPointCatalog) return [];
    return allAvailablePoints.filter((p) => {
      if (filterRegion !== 'Todas' && p.subregion !== filterRegion) return false;
      if (filterChannel !== 'todos') {
        const meta = getPointTypeMeta(p.channel, p.category);
        if (meta.type !== filterChannel && p.channel !== filterChannel) return false;
      }
      if (selectedMunicipality !== 'todos' && p.municipality.toLowerCase() !== selectedMunicipality.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesMun = p.municipality.toLowerCase().includes(q);
        const matchesCode = p.codePdv ? p.codePdv.toLowerCase().includes(q) : false;
        const matchesChannel = p.channel ? p.channel.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesMun && !matchesCode && !matchesChannel) return false;
      }
      return true;
    });
  }, [allAvailablePoints, filterRegion, filterChannel, selectedMunicipality, searchQuery, showPointCatalog]);

  // CARTO Basemaps API Key integration (removes watermark)
  const cartoApiKey = (import.meta as any).env?.VITE_CARTO_API_KEY || 'cb1_456j_1_b12ca51a8d315e590b3384b4';

  // Tile layer URL configuration (Clear / light map tiles by default)
  const getTileConfig = useCallback((style: 'streets' | 'light' | 'satellite' | 'dark') => {
    const keyParam = cartoApiKey ? `?key=${cartoApiKey}` : '';
    switch (style) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          maxZoom: 18,
          subdomains: 'abc',
        };
      case 'light':
        return {
          url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png${keyParam}`,
          attribution: '&copy; OpenStreetMap, &copy; CARTO',
          maxZoom: 19,
          subdomains: 'abcd',
        };
      case 'dark':
        return {
          url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${keyParam}`,
          attribution: '&copy; OpenStreetMap, &copy; CARTO',
          maxZoom: 19,
          subdomains: 'abcd',
        };
      case 'streets':
      default:
        return {
          url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${keyParam}`,
          attribution: '&copy; OpenStreetMap, &copy; CARTO',
          maxZoom: 19,
          subdomains: 'abcd',
        };
    }
  }, [cartoApiKey]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [11.38, -72.65],
        zoom: 9,
        zoomControl: false,
      });

      const markersLayer = L.layerGroup().addTo(map);
      const routePolyline = L.polyline([], {
        color: '#0088ff',
        weight: 5,
        opacity: 0.9,
        dashArray: '10, 8',
        interactive: false,
      }).addTo(map);
      const routeTraceLayer = L.layerGroup().addTo(map);
      const routeMarkersLayer = L.layerGroup().addTo(map);
      const routeGroupsLayer = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
      routePolylineRef.current = routePolyline;
      routeTraceLayerRef.current = routeTraceLayer;
      routeMarkersLayerRef.current = routeMarkersLayer;
      routeGroupsLayerRef.current = routeGroupsLayer;

      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    const config = getTileConfig(mapStyle);
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newTileLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: config.subdomains || 'abcd',
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;

    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
  }, [mapStyle, getTileConfig]);

  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [isFullscreen, height, isExpandedLarge]);

  // 2. Render Point Markers with distinct icons and colors per point type (CDA, PF, CM, Bancario, ETC)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    const pointRenderer = L.canvas({ padding: 0.25 });
    const escapeHtml = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    filteredPoints.forEach((pt) => {
      const meta = getPointTypeMeta(pt.channel, pt.category);
      const isCustom = pt.id.startsWith('imported-') || pt.id.startsWith('manual-') || pt.id.startsWith('txt-');
      const name = escapeHtml(pt.name || 'Punto sin nombre');
      const municipality = escapeHtml(pt.municipality || 'La Guajira');
      const code = pt.codePdv ? escapeHtml(pt.codePdv) : '';
      const zone = escapeHtml(pt.zone || 'Norte');
      const auditor = escapeHtml(pt.auditorName || 'Auditor no definido');
      const typeLabel = escapeHtml(meta.fullLabel || meta.label);

      // Canvas markers keep all PDVs visible without creating hundreds of DOM nodes.
      const marker = L.circleMarker([pt.lat, pt.lng], {
        renderer: pointRenderer,
        radius: 8,
        color: isCustom ? '#facc15' : '#ffffff',
        weight: 1.5,
        fillColor: meta.color,
        fillOpacity: 0.95,
        bubblingMouseEvents: false,
      });

      marker.bindTooltip(
        `<strong>${name}</strong><br/>${typeLabel} · ${municipality}${code ? ` · Cod: <strong>${code}</strong>` : ''}`,
        {
          direction: 'top',
          offset: [0, -7],
          opacity: 0.97,
          sticky: true,
        }
      );

      marker.bindPopup(
        `
          <div style="min-width: 220px; font-family: Inter, system-ui, sans-serif;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
              <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${meta.color};box-shadow:0 0 0 2px rgba(255,255,255,.85);"></span>
              <strong style="font-size:14px;color:#0f172a;">${name}</strong>
            </div>
            <div style="font-size:12px;color:#475569;line-height:1.55;">
              <div><strong>Tipo:</strong> ${typeLabel}</div>
              <div><strong>Municipio:</strong> ${municipality}</div>
              <div><strong>Zona:</strong> ${zone}</div>
              <div><strong>Auditor asignado:</strong> ${auditor}</div>
              ${code ? `<div><strong>Código PDV:</strong> ${code}</div>` : ''}
              ${isCustom ? '<div style="color:#b45309;"><strong>Origen:</strong> Punto cargado</div>' : ''}
            </div>
          </div>
        `,
        { closeButton: true, maxWidth: 320 }
      );

      marker.on('click', () => {
        setSelectedPoint(pt);
        if (onPointSelect) onPointSelect(pt);
      });

      marker.on('mouseover', () => marker.setStyle({ radius: 10, weight: 2.5 }));
      marker.on('mouseout', () => marker.setStyle({ radius: 8, weight: 1.5 }));

      markersLayer.addLayer(marker);
    });
  }, [filteredPoints, onPointSelect]);

  // 3. Render Route Polyline & Waypoint Badges
  useEffect(() => {
    if (!mapInstanceRef.current || !routePolylineRef.current || !routeTraceLayerRef.current || !routeMarkersLayerRef.current || !routeGroupsLayerRef.current) return;
    const polyline = routePolylineRef.current;
    const traceLayer = routeTraceLayerRef.current;
    const routeMarkers = routeMarkersLayerRef.current;
    const routeGroupsLayer = routeGroupsLayerRef.current;

    routeMarkers.clearLayers();
    traceLayer.clearLayers();
    routeGroupsLayer.clearLayers();

    // Route trace: completed legs stay closed in green, the active leg is amber,
    // and pending legs remain blue/dashed.
    const drawRouteTrace = (
      stops: Array<{ lat: number; lng: number; visited?: boolean; status?: string }>,
      baseColor: string,
      weight: number,
      targetLayer: L.LayerGroup
    ) => {
      const validStops = stops.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));
      for (let i = 0; i < validStops.length - 1; i += 1) {
        const from = validStops[i];
        const to = validStops[i + 1];
        const completed = Boolean(to.visited || to.status === 'completed');
        const isActive = isGuidedModeActive && currentLegIndex === i && !completed;
        L.polyline(
          [[from.lat, from.lng], [to.lat, to.lng]] as [number, number][],
          {
            color: completed ? '#10b981' : isActive ? '#f59e0b' : baseColor,
            weight: completed ? weight + 1 : weight,
            opacity: completed ? 0.95 : 0.82,
            dashArray: completed ? undefined : isActive ? '8 5' : '10 8',
            smoothFactor: 1.5,
            interactive: false,
          }
        ).addTo(targetLayer);
      }
    };

    const stopRenderer = L.canvas();

    routeGroups.forEach((group) => {
      drawRouteTrace(group.stops, group.color, 4, routeGroupsLayer);

      // A colored stop marker makes each auditor's assigned route identifiable.
      group.stops.forEach((stop, index) => {
        if (!Number.isFinite(stop.lat) || !Number.isFinite(stop.lng)) return;
        L.circleMarker([stop.lat, stop.lng], {
          radius: 6,
          color: '#ffffff',
          weight: 1.5,
          fillColor: group.color,
          fillOpacity: 0.95,
          renderer: stopRenderer,
        })
          .bindTooltip(`${group.label}<br/>Parada ${index + 1}: ${stop.name}${stop.zone && group.zone && stop.zone !== group.zone ? `<br/><strong>Excepción de zona:</strong> ${stop.zone}` : ''}`, { direction: 'top' })
          .addTo(routeGroupsLayer);
      });
    });

    if (routeWaypoints.length < 2) {
      polyline.setLatLngs([]);
    } else {
      // Keep the full route visible as a subtle base line.
      const latLngs = routeWaypoints.map((w) => [w.lat, w.lng] as [number, number]);
      polyline.setLatLngs(latLngs);
      drawRouteTrace(routeWaypoints, '#0088ff', 5, traceLayer);
    }

    routeWaypoints.forEach((wp, index) => {
      const isVisited = wp.visited;
      const isNextTarget = isGuidedModeActive && currentLegIndex + 1 === index;

      const badgeIcon = L.divIcon({
        className: 'cavi-waypoint-badge-custom',
        html: `
          <div style="
            background: ${isVisited ? '#059669' : isNextTarget ? '#f59e0b' : '#0088ff'};
            color: #ffffff;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 800;
            box-shadow: 0 0 0 3px rgba(255,255,255,0.9), 0 6px 16px rgba(0,0,0,0.6);
            border: 2px solid ${isVisited ? '#34d399' : isNextTarget ? '#fde047' : '#38bdf8'};
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${isVisited ? '✓' : index + 1}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([wp.lat, wp.lng], { icon: badgeIcon, zIndexOffset: 1000 });
      marker.bindTooltip(
        `<strong>Parada ${index + 1}: ${wp.name}</strong><br/>${wp.municipality || 'La Guajira'} ${isVisited ? '✓ Visitado' : isNextTarget ? '📍 Próximo' : ''}`,
        { direction: 'top', offset: [0, -14], opacity: 0.95 }
      );

      marker.on('click', () => {
        const found = allAvailablePoints.find((p) => p.name === wp.name || p.id === wp.id);
        if (found) {
          setSelectedPoint(found);
        } else {
          setSelectedPoint({
            id: wp.id,
            name: wp.name,
            category: 'Ruta Activa',
            subregion: 'Centro',
            municipality: wp.municipality || 'La Guajira',
            lat: wp.lat,
            lng: wp.lng,
            codePdv: wp.codePdv,
            channel: wp.channel || 'PDV',
          });
        }
      });

      routeMarkers.addLayer(marker);
    });
  }, [routeWaypoints, isGuidedModeActive, currentLegIndex, allAvailablePoints]);

  // 4. Guided Displacement Simulation Engine
  useEffect(() => {
    if (!isGuidedModeActive || !isSimulationPlaying || routeWaypoints.length < 2) {
      return;
    }

    const intervalMs = 60;
    const stepIncrement = 0.015 * simulationSpeed;

    const timer = setInterval(() => {
      setLegProgress((prev) => {
        const next = prev + stepIncrement;
        if (next >= 1.0) {
          const destIndex = currentLegIndex + 1;
          const arrivedStop = routeWaypoints[destIndex];

          if (arrivedStop) {
            setRouteWaypoints((stops) =>
              stops.map((s, idx) =>
                idx === destIndex ? { ...s, visited: true, visitedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : s
              )
            );

            if (soundEnabled) {
              playArrivalChime();
              speakAnnouncement(`Has llegado a ${arrivedStop.name}. Parada ${destIndex + 1} completada.`);
            }

            if (onStopArrival) {
              onStopArrival(arrivedStop);
            }
          }

          if (currentLegIndex + 2 < routeWaypoints.length) {
            setCurrentLegIndex((c) => c + 1);
            return 0;
          } else {
            setIsSimulationPlaying(false);
            showMapToast('¡Desplazamiento guiado completado! Has recorrido todas las paradas de la ruta.');
            return 1.0;
          }
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isGuidedModeActive, isSimulationPlaying, currentLegIndex, simulationSpeed, routeWaypoints, soundEnabled, onStopArrival]);

  // Update vehicle beacon position and rotation
  useEffect(() => {
    if (!mapInstanceRef.current || !isGuidedModeActive || routeWaypoints.length < 2) {
      if (guideVehicleMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(guideVehicleMarkerRef.current);
        guideVehicleMarkerRef.current = null;
      }
      return;
    }

    const fromPt = routeWaypoints[currentLegIndex];
    const toPt = routeWaypoints[currentLegIndex + 1];
    if (!fromPt || !toPt) return;

    const currentCoords = interpolateCoords(fromPt, toPt, legProgress);
    const bearing = calculateBearingDegrees(fromPt.lat, fromPt.lng, toPt.lat, toPt.lng);

    if (!guideVehicleMarkerRef.current) {
      const vehicleIcon = L.divIcon({
        className: 'cavi-guide-beacon-icon',
        html: `
          <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: -5px; border-radius: 50%; background: #0088ff; opacity: 0.45; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #0088ff; border: 3px solid #ffffff; box-shadow: 0 4px 16px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #ffffff; transform: rotate(${bearing}deg); transition: transform 0.2s;">
              <span class="material-symbols-outlined" style="font-size: 19px;">navigation</span>
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      guideVehicleMarkerRef.current = L.marker([currentCoords.lat, currentCoords.lng], {
        icon: vehicleIcon,
        zIndexOffset: 2000,
      }).addTo(mapInstanceRef.current);
    } else {
      guideVehicleMarkerRef.current.setLatLng([currentCoords.lat, currentCoords.lng]);
    }

    if (followCamera && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([currentCoords.lat, currentCoords.lng], { animate: true, duration: 0.15 });
    }
  }, [isGuidedModeActive, currentLegIndex, legProgress, routeWaypoints, followCamera]);

  // Route actions
  const handleAddPointToRoute = (pt: CaviPoint) => {
    if (routeWaypoints.some((w) => w.lat === pt.lat && w.lng === pt.lng)) {
      showMapToast(`"${pt.name}" ya está incluida en la ruta.`);
      return;
    }
    setRouteWaypoints((prev) => [
      ...prev,
      {
        id: pt.id,
        name: pt.name,
        lat: pt.lat,
        lng: pt.lng,
        codePdv: pt.codePdv,
        municipality: pt.municipality,
        channel: pt.channel,
        visited: false,
      },
    ]);
    showMapToast(`Parada ${routeWaypoints.length + 1} añadida: ${pt.name}`);
  };

  const handleRemoveWaypoint = (index: number) => {
    setRouteWaypoints((prev) => prev.filter((_, idx) => idx !== index));
    if (currentLegIndex >= index && currentLegIndex > 0) {
      setCurrentLegIndex((c) => c - 1);
    }
  };

  const handleMoveWaypoint = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === routeWaypoints.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    setRouteWaypoints((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleOptimizeRoute = () => {
    if (routeWaypoints.length <= 2) {
      showMapToast('Se requieren al menos 3 paradas para optimizar la secuencia.');
      return;
    }
    const optimized = optimizeRouteWaypoints(routeWaypoints);
    const oldKm = totalDistanceKm;
    const newKm = calculateTotalRouteDistanceKm(optimized);
    setRouteWaypoints(optimized);
    setCurrentLegIndex(0);
    setLegProgress(0);
    showMapToast(`Ruta optimizada: de ${formatDistance(oldKm)} a ${formatDistance(newKm)} (Ahorro territorial).`);
  };

  const handleSetCurrentGpsAsStart = () => {
    if (!navigator.geolocation) {
      showMapToast('La geolocalización GPS no está disponible en este dispositivo.');
      return;
    }
    showMapToast('Detectando ubicación GPS actual...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const myLat = pos.coords.latitude;
        const myLng = pos.coords.longitude;
        const startWp: RouteWaypoint = {
          id: `gps-start-${Date.now()}`,
          name: 'Mi Ubicación Actual (Punto de Salida)',
          lat: myLat,
          lng: myLng,
          municipality: 'Posición GPS',
          channel: 'GPS',
          visited: true,
        };
        setRouteWaypoints((prev) => [startWp, ...prev.filter((p) => !p.id.startsWith('gps-start'))]);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([myLat, myLng], 12);
        }
        showMapToast('Punto de inicio fijado en tu ubicación GPS.');
      },
      (err) => {
        showMapToast(`No se pudo obtener el GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleClearRoute = () => {
    setRouteWaypoints([]);
    setIsGuidedModeActive(false);
    setIsSimulationPlaying(false);
    setCurrentLegIndex(0);
    setLegProgress(0);
    showMapToast('Hoja de ruta limpiada.');
  };

  const handleFitRouteBounds = () => {
    if (!mapInstanceRef.current || routeWaypoints.length === 0) return;
    const bounds = L.latLngBounds(routeWaypoints.map((w) => [w.lat, w.lng]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
  };

  const handleFitGuajiraBounds = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([11.38, -72.65], 9);
  };

  const handleFitPointBounds = () => {
    if (!mapInstanceRef.current || filteredPoints.length === 0) return;
    const bounds = L.latLngBounds(filteredPoints.map((p) => [p.lat, p.lng] as [number, number]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: filteredPoints.length === 1 ? 16 : 12 });
  };

  // Re-centra el mapa cuando cambia el ámbito territorial o el tipo de PDV.
  useEffect(() => {
    if (!mapInstanceRef.current || filteredPoints.length === 0) return;
    const bounds = L.latLngBounds(filteredPoints.map((p) => [p.lat, p.lng] as [number, number]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: filteredPoints.length === 1 ? 16 : 12 });
  }, [filterRegion, filterChannel, selectedMunicipality]);

  const handleToggleSimulation = () => {
    if (!isGuidedModeActive) {
      setIsGuidedModeActive(true);
      setIsSimulationPlaying(true);
      setCurrentLegIndex(0);
      setLegProgress(0);
      if (soundEnabled) {
        speakAnnouncement(`Iniciando desplazamiento guiado hacia ${routeWaypoints[1]?.name || 'el primer punto'}`);
      }
    } else {
      setIsSimulationPlaying(!isSimulationPlaying);
    }
  };

  const handleSkipNextStop = () => {
    if (currentLegIndex + 2 < routeWaypoints.length) {
      const skippedStop = routeWaypoints[currentLegIndex + 1];
      if (skippedStop) {
        setRouteWaypoints((stops) =>
          stops.map((s, idx) => (idx === currentLegIndex + 1 ? { ...s, visited: true, visitedAt: new Date().toLocaleTimeString() } : s))
        );
      }
      setCurrentLegIndex((c) => c + 1);
      setLegProgress(0);
    } else {
      setIsSimulationPlaying(false);
      setLegProgress(1.0);
    }
  };

  const currentDestinationStop = routeWaypoints[currentLegIndex + 1];
  const currentOriginStop = routeWaypoints[currentLegIndex];

  // CAVIMAPS remains the default navigator. These actions only hand off
  // the current destination to an external navigation app when requested.
  const openExternalNavigation = (provider: 'google' | 'waze') => {
    if (!currentDestinationStop) return;

    const { lat, lng } = currentDestinationStop;
    const url =
      provider === 'google'
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
        : `https://www.waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`;

    window.open(url, '_blank', 'noopener,noreferrer');
    showMapToast(
      provider === 'google'
        ? 'Abriendo el destino en Google Maps…'
        : 'Abriendo el destino en Waze…'
    );
  };
  const legDistanceRemainingKm = useMemo(() => {
    if (!currentOriginStop || !currentDestinationStop) return 0;
    const fullLeg = calculateDistanceKm(
      currentOriginStop.lat,
      currentOriginStop.lng,
      currentDestinationStop.lat,
      currentDestinationStop.lng
    );
    return Math.max(0, fullLeg * (1 - legProgress));
  }, [currentOriginStop, currentDestinationStop, legProgress]);

  return (
    <div
      className={`relative w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg transition-all duration-300 flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen min-h-screen' : ''
      } ${className}`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* TOAST POPUP */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#131b2e]/95 backdrop-blur-md px-4 py-2 rounded-xl border border-[#0088ff] text-white text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#38bdf8] text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP COMMAND BAR */}
      <div className="p-3 bg-white/95 backdrop-blur-md border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#0088ff] text-white flex items-center justify-center shadow-md shadow-[#0088ff]/30 shrink-0">
            <span className="material-symbols-outlined text-[19px]">map</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide truncate">
                CAVIMAPS · Mapa Territorial de PDV
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/30">
                {allAvailablePoints.length} PDV en mapa
              </span>
              {customPoints.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f59e0b]/20 text-[#fcd34d] border border-[#f59e0b]/30">
                  +{customPoints.length} .txt
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {filteredPoints.length} PDV visibles · {routeWaypoints.length} paradas · {formatDistance(totalDistanceKm)} · Est. {estimatedTime}
            </p>
          </div>
        </div>

        {/* MAP CONTROLS: SOLO DESPLAZAMIENTO + CONFIGURACIÓN */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleSimulation}
            disabled={routeWaypoints.length < 2}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              isGuidedModeActive && isSimulationPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : isGuidedModeActive
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-[#0088ff] hover:bg-[#0070d8] text-white'
            } ${routeWaypoints.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Iniciar desplazamiento y navegación guiada"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isGuidedModeActive && isSimulationPlaying ? 'pause_circle' : 'navigation'}
            </span>
            <span className="hidden sm:inline">
              {isGuidedModeActive && isSimulationPlaying
                ? 'Pausar'
                : isGuidedModeActive
                ? 'Reanudar'
                : 'Desplazamiento'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen((open) => !open)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
              isSettingsOpen
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title="Configuración del mapa"
            aria-label="Configuración del mapa"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
        </div>      </div>

      {/* MAIN VIEWPORT: MAP CANVAS + ROUTE & GUIDED NAVIGATION OVERLAYS */}
      <div className="flex-1 min-h-0 relative flex overflow-hidden">
        {/* MAP SETTINGS DRAWER */}
        {isSettingsOpen && (
          <div className="absolute top-2 right-2 z-40 w-[min(92vw,330px)] max-h-[calc(100%-16px)] overflow-y-auto bg-white/98 backdrop-blur-md border border-slate-200 rounded-xl shadow-2xl p-2.5">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">Configuración del mapa</h3>
                <p className="text-[9px] text-slate-500">Herramientas y visualización CAVIMAPS</p>
              </div>
              <button type="button" onClick={() => setIsSettingsOpen(false)} className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="space-y-2">
              {/* Búsqueda y filtros */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="text-[10px] font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-blue-600">filter_alt</span>
                  Buscar y filtrar PDV
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="PDV, código, centro de costo..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="grid grid-cols-1 gap-1.5 mt-1.5">
                  <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value as any)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-700 cursor-pointer">
                    <option value="Todas">Toda La Guajira ({allAvailablePoints.length})</option>
                    <option value="Norte">Regional Norte</option>
                    <option value="Centro">Regional Centro</option>
                    <option value="Sur">Regional Sur</option>
                    <option value="Bancario">Corresponsalías Bancarias</option>
                  </select>
                  <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-700 cursor-pointer">
                    <option value="todos">Todos los canales ({filteredPoints.length})</option>
                    <option value="CDA">CDA · Acopio ({typeCounts.CDA})</option>
                    <option value="PF">PF · Punto Fijo ({typeCounts.PF})</option>
                    <option value="CM">CM · Tradicional/Tienda ({typeCounts.CM})</option>
                    <option value="Bancario">Bancario · Corresponsal ({typeCounts.Bancario})</option>
                    {typeCounts.ETC > 0 && <option value="ETC">ETC · Otros ({typeCounts.ETC})</option>}
                  </select>
                  <select value={selectedMunicipality} onChange={(e) => setSelectedMunicipality(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-700 cursor-pointer">
                    <option value="todos">Todos los municipios</option>
                    {MUNICIPALITIES_GUAJIRA.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Capas */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="text-[10px] font-extrabold text-slate-700 mb-1.5">Vista del mapa</div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    {key:'streets' as const,label:'Vial',icon:'map'},
                    {key:'light' as const,label:'Positron',icon:'layers'},
                    {key:'satellite' as const,label:'Satélite',icon:'satellite'},
                  ].map((style) => (
                    <button key={style.key} type="button" onClick={() => setMapStyle(style.key)} className={`px-1.5 py-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-0.5 cursor-pointer ${mapStyle === style.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                      <span className="material-symbols-outlined text-[14px]">{style.icon}</span>{style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Herramientas */}
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={handleSetCurrentGpsAsStart} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">my_location</span> Mi GPS
                </button>
                <button type="button" onClick={handleFitGuajiraBounds} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">public</span> La Guajira
                </button>
                <button type="button" onClick={handleFitPointBounds} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">location_on</span> Todos los PDV
                </button>
                <button type="button" onClick={handleFitRouteBounds} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">route</span> Enfocar ruta
                </button>
                <button type="button" onClick={() => setIsDrawerOpen((open) => !open)} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">alt_route</span> Ruta ({routeWaypoints.length})
                </button>
                <button type="button" onClick={() => setShowLegend((v) => !v)} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">category</span> Leyenda
                </button>
                <button type="button" onClick={() => setIsImportModalOpen(true)} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">upload_file</span> Cargar .txt
                </button>
                <button type="button" onClick={() => setIsFullscreen((v) => !v)} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                  {isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LEAFLET CONTAINER */}
        <div ref={mapContainerRef} className="w-full h-full relative z-0 bg-[#060e20]" />

        {/* FLOATING GUIDED DISPLACEMENT HUD (WHEN ACTIVE) */}
        {isGuidedModeActive && currentDestinationStop && (
          <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md bg-[#0b1326]/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#0088ff]/60 shadow-2xl z-30 animate-in fade-in flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <span>Desplazamiento Guiado</span>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#0088ff]/20 text-[#38bdf8] border border-[#0088ff]/40 text-[10px] font-mono font-bold">
                Tramo {currentLegIndex + 1} de {routeWaypoints.length - 1}
              </span>
            </div>

            {/* Next Stop Details */}
            <div className="bg-[#131b2e] p-2.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Próximo Destino:</span>
                <span className="font-bold text-[#fcd34d] truncate ml-2 text-right">{currentDestinationStop.name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Municipio:</span>
                <span className="font-semibold text-white">{currentDestinationStop.municipality || 'La Guajira'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Distancia Restante:</span>
                <span className="font-mono font-bold text-[#38bdf8]">{formatDistance(legDistanceRemainingKm)}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#060e20] h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-gradient-to-r from-[#0088ff] to-[#10b981] h-full transition-all duration-150"
                  style={{ width: `${Math.round(legProgress * 100)}%` }}
                />
              </div>
            </div>

            {/* Guided Navigation Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsSimulationPlaying(!isSimulationPlaying)}
                className="flex-1 py-1.5 px-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isSimulationPlaying ? 'pause' : 'play_arrow'}
                </span>
                <span>{isSimulationPlaying ? 'Pausar' : 'Avanzar'}</span>
              </button>

              <button
                type="button"
                onClick={handleSkipNextStop}
                className="py-1.5 px-2.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Llegar / Registrar este punto y saltar al siguiente"
              >
                <span className="material-symbols-outlined text-[15px]">skip_next</span>
                <span className="hidden sm:inline">Llegada</span>
              </button>

              {/* Speed Switcher */}
              <button
                type="button"
                onClick={() => setSimulationSpeed((s) => (s === 1 ? 2 : s === 2 ? 5 : s === 5 ? 10 : 1))}
                className="py-1.5 px-2 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#fcd34d] font-mono text-xs font-bold transition-all cursor-pointer"
                title="Velocidad de simulación"
              >
                {simulationSpeed}x
              </button>

              {/* Voice Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  soundEnabled ? 'bg-[#1e293b] text-[#38bdf8]' : 'bg-[#1e293b] text-slate-500'
                }`}
                title={soundEnabled ? 'Alertas de voz y sonido activas' : 'Sonido silenciado'}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {soundEnabled ? 'volume_up' : 'volume_off'}
                </span>
              </button>

              {/* Follow Camera */}
              <button
                type="button"
                onClick={() => setFollowCamera(!followCamera)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  followCamera ? 'bg-[#10b981] text-white' : 'bg-[#1e293b] text-slate-500'
                }`}
                title={followCamera ? 'Seguimiento de cámara activo' : 'Cámara libre'}
              >
                <span className="material-symbols-outlined text-[16px]">my_location</span>
              </button>

              {/* External navigation handoff: CAVIMAPS stays the default */}
              <div className="flex items-center gap-1 rounded-xl bg-[#0b1326] border border-slate-200 p-1">
                <span className="px-1.5 text-[9px] font-bold uppercase tracking-wide text-[#64748b] hidden md:inline">Ir con</span>
                <button
                  type="button"
                  onClick={() => openExternalNavigation('google')}
                  className="px-2 py-1 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  title="Abrir este destino en Google Maps"
                >
                  <span className="material-symbols-outlined text-[14px]">map</span>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => openExternalNavigation('waze')}
                  className="px-2 py-1 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  title="Abrir este destino en Waze"
                >
                  <span className="material-symbols-outlined text-[14px]">navigation</span>
                  <span>Waze</span>
                </button>
              </div>

              {/* Exit Guided Mode */}
              <button
                type="button"
                onClick={() => {
                  setIsGuidedModeActive(false);
                  setIsSimulationPlaying(false);
                }}
                className="p-1.5 rounded-xl bg-[#1e293b] hover:bg-[#991b1b] text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Cerrar navegación guiada"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* SELECTED POINT DETAIL CARD OVERLAY */}
        {selectedPoint && (() => {
          const ptMeta = getPointTypeMeta(selectedPoint.channel, selectedPoint.category);
          return (
            <div className="absolute bottom-4 left-4 z-30 max-w-sm w-[calc(100%-32px)] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-2xl animate-in fade-in">
              <div className="flex items-start justify-between gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg mt-0.5"
                  style={{ backgroundColor: ptMeta.color }}
                >
                  <span className="material-symbols-outlined text-[20px]">{ptMeta.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-extrabold text-white"
                      style={{ backgroundColor: ptMeta.bgColor, border: `1px solid ${ptMeta.borderColor}` }}
                    >
                      {ptMeta.label} · {ptMeta.fullLabel}
                    </span>
                    {selectedPoint.codePdv && (
                      <span className="px-1.5 py-0.5 rounded bg-[#1e293b] text-slate-600 text-[10px] font-mono font-bold">
                        PDV: {selectedPoint.codePdv}
                      </span>
                    )}
                    <span className="text-[10px] text-[#38bdf8] font-bold">{selectedPoint.municipality}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug truncate">{selectedPoint.name}</h3>
                  {selectedPoint.address && <p className="text-xs text-slate-600 mt-0.5">{selectedPoint.address}</p>}
                  {selectedPoint.costCenter && (
                    <p className="text-[11px] text-slate-500 mt-0.5">Centro Costo: {selectedPoint.costCenter}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPoint(null)}
                  className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">close</span>
                </button>
              </div>

              {/* Quick Actions for Selected Point */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddPointToRoute(selectedPoint)}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm shadow-[#0088ff]/30"
                >
                  <span className="material-symbols-outlined text-[14px]">add_location_alt</span>
                  <span>Añadir a Ruta</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([selectedPoint.lat, selectedPoint.lng], 16, { animate: true, duration: 1 });
                      showMapToast(`Enfocado en ${selectedPoint.name} (CAVIMAPS)`);
                    }
                  }}
                  className="py-1.5 px-2.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#38bdf8] text-[11px] font-bold flex items-center justify-center gap-1 border border-[#3b4760] transition-colors cursor-pointer"
                  title="Centrar y enfocar en nuestro mapa CAVIMAPS"
                >
                  <span className="material-symbols-outlined text-[14px]">center_focus_strong</span>
                  <span>Enfocar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const coords = `${selectedPoint.lat.toFixed(6)}, ${selectedPoint.lng.toFixed(6)}`;
                    navigator.clipboard?.writeText(coords);
                    showMapToast(`Coordenadas GPS copiadas: ${coords}`);
                  }}
                  className="py-1.5 px-2.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#dae2fd] text-[11px] font-bold flex items-center justify-center gap-1 border border-[#3b4760] transition-colors cursor-pointer"
                  title="Copiar coordenadas geográficas"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>GPS</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* FLOATING POINT TYPES MAP LEGEND */}
        {showLegend && (
          <div className="cavi-map-legend absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 shadow-xl text-xs max-w-[210px] hidden md:block select-none animate-in fade-in">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#38bdf8]">category</span>
                <span>Convenciones PDV</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLegend(false)}
                className="text-slate-500 hover:text-white p-0.5 cursor-pointer"
                title="Minimizar leyenda"
              >
                <span className="material-symbols-outlined text-[15px]">minimize</span>
              </button>
            </div>

            <div className="space-y-1">
              {Object.values(POINT_TYPE_CONFIG).map((cfg) => {
                const count = typeCounts[cfg.type] || 0;
                const isActive = filterChannel === cfg.type;

                return (
                  <button
                    key={cfg.type}
                    type="button"
                    onClick={() => setFilterChannel(filterChannel === cfg.type ? 'todos' : cfg.type)}
                    className={`w-full flex items-center justify-between gap-1.5 p-1 px-1.5 rounded-lg transition-all text-left cursor-pointer ${
                      isActive ? 'bg-[#1e293b] ring-1 ring-white/60 shadow-xs' : 'hover:bg-slate-100'
                    }`}
                    title={`Filtrar por ${cfg.fullLabel}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: cfg.color }}
                      >
                        <span className="material-symbols-outlined text-[13px] leading-none">{cfg.icon}</span>
                      </span>
                      <span className="text-[11px] font-bold text-white truncate">
                        {cfg.label}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0"
                      style={{ backgroundColor: `${cfg.color}20`, color: cfg.borderColor }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {filterChannel !== 'todos' && (
              <button
                type="button"
                onClick={() => setFilterChannel('todos')}
                className="w-full mt-2 pt-1 border-t border-slate-200 text-center text-[10px] font-bold text-[#38bdf8] hover:underline cursor-pointer block"
              >
                Restablecer todos los canales
              </button>
            )}
          </div>
        )}

        {/* BUTTON TO RE-OPEN LEGEND IF MINIMIZED */}
        {!showLegend && (
          <button
            type="button"
            onClick={() => setShowLegend(true)}
            className="cavi-map-legend-toggle absolute top-3 right-3 z-20 bg-[#0b1326]/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 shadow-lg cursor-pointer hidden md:flex"
            title="Mostrar leyenda de convenciones"
          >
            <span className="material-symbols-outlined text-[15px] text-[#38bdf8]">category</span>
            <span>Leyenda PDV</span>
          </button>
        )}

        {/* SIDEBAR DRAWER: ROUTE STOPS & SEQUENCE BUILDER */}
        {isDrawerOpen && (
          <div className="w-72 sm:w-84 bg-white/95 backdrop-blur-md border-l border-slate-200 flex flex-col h-full z-20 shrink-0">
            {/* Drawer Header */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#0088ff]">route</span>
                  <span>Ruta Trazada</span>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {routeWaypoints.length} paradas · {formatDistance(totalDistanceKm)} · {estimatedTime}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {routeWaypoints.length > 2 && (
                  <button
                    type="button"
                    onClick={handleOptimizeRoute}
                    className="p-1 rounded-lg text-[#fcd34d] hover:bg-[#fcd34d]/10 text-xs font-bold cursor-pointer"
                    title="Optimizar secuencia de ruta (TSP - Menor recorrido)"
                  >
                    <span className="material-symbols-outlined text-[17px]">auto_fix_high</span>
                  </button>
                )}
                {routeWaypoints.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearRoute}
                    className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs font-bold cursor-pointer"
                    title="Limpiar toda la ruta"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* List of stops in route */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {routeWaypoints.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                  <span className="material-symbols-outlined text-[32px] text-[#38bdf8]/40 block">route</span>
                  <p className="font-semibold text-white">No hay paradas en la ruta</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Haz clic en cualquier punto del mapa y pulsa <strong>"Añadir a Ruta"</strong> para trazar el recorrido.
                  </p>
                </div>
              ) : (
                routeWaypoints.map((wp, idx) => {
                  const isCurrentLegTarget = isGuidedModeActive && currentLegIndex + 1 === idx;
                  const isVisited = wp.visited;
                  const wpMeta = getPointTypeMeta(wp.channel);

                  return (
                    <div
                      key={wp.id + '-' + idx}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isCurrentLegTarget
                          ? 'bg-[#0088ff]/15 border-[#0088ff] shadow-sm'
                          : isVisited
                          ? 'bg-[#064e3b]/30 border-[#059669]/50 opacity-80'
                          : 'bg-[#171f33] border-slate-200 hover:border-[#38bdf8]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Point Type Icon Badge */}
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: wpMeta.color }}
                            title={`${wpMeta.label} - ${wpMeta.fullLabel}`}
                          >
                            <span className="material-symbols-outlined text-[14px]">{wpMeta.icon}</span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded text-white" style={{ backgroundColor: wpMeta.bgColor }}>
                                {wpMeta.label} #{idx + 1}
                              </span>
                              <p className="text-xs font-bold text-white truncate">{wp.name}</p>
                            </div>
                            <p className="text-[10px] text-slate-600 truncate mt-0.5">
                              {wp.municipality || 'La Guajira'} {wp.codePdv ? `· Cod: ${wp.codePdv}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Order & Remove Actions */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveWaypoint(idx, 'up')}
                            className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Mover arriba"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            disabled={idx === routeWaypoints.length - 1}
                            onClick={() => handleMoveWaypoint(idx, 'down')}
                            className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Mover abajo"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWaypoint(idx)}
                            className="p-0.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Remover de la ruta"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      </div>

                      {/* Leg distance indicator between stops */}
                      {idx < routeWaypoints.length - 1 && (
                        <div className="mt-1.5 pt-1 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Hacia parada {idx + 2}:</span>
                          <span className="font-bold text-[#38bdf8]">
                            {formatDistance(
                              calculateDistanceKm(
                                wp.lat,
                                wp.lng,
                                routeWaypoints[idx + 1].lat,
                                routeWaypoints[idx + 1].lng
                              )
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions of Drawer */}
            <div className="p-3 bg-[#171f33] border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={handleToggleSimulation}
                disabled={routeWaypoints.length < 2}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  isGuidedModeActive && isSimulationPlaying
                    ? 'bg-[#f59e0b] hover:bg-[#d97706] text-slate-900'
                    : 'bg-[#0088ff] hover:bg-[#0070d8] text-white shadow-[#0088ff]/30'
                } ${routeWaypoints.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isGuidedModeActive && isSimulationPlaying ? 'pause' : 'play_circle'}
                </span>
                <span>
                  {isGuidedModeActive && isSimulationPlaying
                    ? 'Pausar Simulación'
                    : isGuidedModeActive
                    ? 'Continuar Desplazamiento'
                    : 'Iniciar Desplazamiento'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleOptimizeRoute}
                  disabled={routeWaypoints.length < 3}
                  className="py-1.5 px-2 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#fcd34d] disabled:opacity-40 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Reorganizar paradas para recorrer la menor distancia en km"
                >
                  <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                  <span>Optimizar</span>
                </button>

                <button
                  type="button"
                  onClick={handleFitRouteBounds}
                  disabled={routeWaypoints.length === 0}
                  className="py-1.5 px-2 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-slate-600 hover:text-slate-900 disabled:opacity-40 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">center_focus_strong</span>
                  <span>Enfocar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* IMPORT .TXT / KML MODAL */}
      <ImportPointTxtModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onPointsImported={handleSaveCustomPoints}
        onShowToast={(t, m) => showMapToast(`${t}: ${m}`)}
        existingPointsCount={allAvailablePoints.length}
      />
    </div>
  );
};
