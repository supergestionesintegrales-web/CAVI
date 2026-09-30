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

  // Map settings state
  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark' | 'streets'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterRegion, setFilterRegion] = useState<'Todas' | 'Norte' | 'Centro' | 'Sur' | 'Bancario'>('Todas');
  const [filterChannel, setFilterChannel] = useState<string>('todos');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<CaviPoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
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

  // Tile layer URL configuration
  const getTileConfig = useCallback((style: 'satellite' | 'dark' | 'streets') => {
    switch (style) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          maxZoom: 18,
          subdomains: 'abc',
        };
      case 'streets':
        return {
          url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoApiKey}`,
          attribution: '&copy; OpenStreetMap, &copy; CARTO',
          maxZoom: 19,
          subdomains: 'abcd',
        };
      case 'dark':
      default:
        return {
          url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?key=${cartoApiKey}`,
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
        radius: 7,
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

      marker.on('mouseover', () => marker.setStyle({ radius: 9, weight: 2 }));
      marker.on('mouseout', () => marker.setStyle({ radius: 7, weight: 1.5 }));

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
      className={`relative w-full bg-[#060e20] rounded-2xl border border-[#222a3d] overflow-hidden shadow-2xl transition-all duration-300 flex flex-col ${
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
      <div className="p-3 bg-[#131b2e]/95 backdrop-blur-md border-b border-[#222a3d] flex flex-wrap items-center justify-between gap-2.5 z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#0088ff] text-white flex items-center justify-center shadow-md shadow-[#0088ff]/30 shrink-0">
            <span className="material-symbols-outlined text-[19px]">map</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                CAVIMAPS · Motor Territorial Nativo
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/30">
                {allAvailablePoints.length} Puntos Activos
              </span>
              {customPoints.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f59e0b]/20 text-[#fcd34d] border border-[#f59e0b]/30">
                  +{customPoints.length} .txt
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94a3b8] truncate">
              {routeWaypoints.length} paradas marcadas · {formatDistance(totalDistanceKm)} · Est. {estimatedTime}
            </p>
          </div>
        </div>

        {/* MAP CONTROLS, TXT IMPORT & GUIDED DISPLACEMENT TRIGGER */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* UPLOAD .TXT / KML BUTTON (PRIMARY NEW FEATURE) */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#38bdf8] border border-[#0088ff]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Cargar nuevo archivo .txt o KML con puntos de atención"
          >
            <span className="material-symbols-outlined text-[17px] text-[#38bdf8]">upload_file</span>
            <span>Cargar .txt</span>
          </button>

          {/* Guided Mode Trigger Button */}
          <button
            type="button"
            onClick={handleToggleSimulation}
            disabled={routeWaypoints.length < 2}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
              isGuidedModeActive && isSimulationPlaying
                ? 'bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 shadow-[#f59e0b]/30'
                : isGuidedModeActive
                ? 'bg-[#10b981] hover:bg-[#059669] text-white shadow-[#10b981]/30'
                : 'bg-[#0088ff] hover:bg-[#0070d8] text-white shadow-[#0088ff]/30'
            } ${routeWaypoints.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Iniciar desplazamiento y navegación guiada paso a paso"
          >
            <span className="material-symbols-outlined text-[17px]">
              {isGuidedModeActive && isSimulationPlaying ? 'pause_circle' : 'navigation'}
            </span>
            <span>
              {isGuidedModeActive && isSimulationPlaying
                ? 'Pausar Guía'
                : isGuidedModeActive
                ? 'Reanudar Guía'
                : 'Desplazamiento Guiado'}
            </span>
          </button>

          {/* Layer Style Switcher */}
          <div className="flex items-center gap-1 bg-[#0b1326] p-1 rounded-xl border border-[#222a3d]">
            <button
              type="button"
              onClick={() => setMapStyle('dark')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mapStyle === 'dark' ? 'bg-[#0088ff] text-white shadow-xs' : 'text-[#cbd5e1] hover:text-white'
              }`}
            >
              Táctico
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mapStyle === 'satellite' ? 'bg-[#0088ff] text-white shadow-xs' : 'text-[#cbd5e1] hover:text-white'
              }`}
            >
              Satelital
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('streets')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mapStyle === 'streets' ? 'bg-[#0088ff] text-white shadow-xs' : 'text-[#cbd5e1] hover:text-white'
              }`}
            >
              Calles
            </button>
          </div>

          {/* Toggle Sidebar Drawer */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              isDrawerOpen
                ? 'bg-[#171f33] border-[#38bdf8]/50 text-[#38bdf8]'
                : 'bg-[#131b2e] border-[#222a3d] text-[#cbd5e1] hover:text-white'
            }`}
            title="Panel de paradas y diseño de ruta"
          >
            <span className="material-symbols-outlined text-[16px]">alt_route</span>
            <span className="hidden sm:inline">Ruta ({routeWaypoints.length})</span>
          </button>

          {/* Fit Route Bounds */}
          <button
            type="button"
            onClick={handleFitRouteBounds}
            className="p-1.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#cbd5e1] hover:text-white border border-[#3b4760] transition-colors cursor-pointer"
            title="Centrar mapa en la ruta"
          >
            <span className="material-symbols-outlined text-[16px]">filter_center_focus</span>
          </button>

          {/* Expand in Large Mode Button */}
          {onToggleExpandLarge && (
            <button
              type="button"
              onClick={onToggleExpandLarge}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isExpandedLarge
                  ? 'bg-[#0088ff] text-white border-[#38bdf8] shadow-md shadow-[#0088ff]/40'
                  : 'bg-[#1e293b] hover:bg-[#2d3a58] text-[#cbd5e1] hover:text-white border-[#3b4760]'
              }`}
              title={isExpandedLarge ? 'Reducir a vista dividida' : 'Ampliar mapa en grande'}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isExpandedLarge ? 'close_fullscreen' : 'open_in_full'}
              </span>
              <span className="hidden sm:inline">
                {isExpandedLarge ? 'Reducir' : 'Ampliar en Grande'}
              </span>
            </button>
          )}

          {/* Fullscreen Button */}
          {showFullscreenButton && (
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#cbd5e1] hover:text-white border border-[#3b4760] transition-colors cursor-pointer"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH SUBBAR */}
      <div className="px-3 py-2 bg-[#0b1326] border-b border-[#222a3d] flex flex-wrap items-center justify-between gap-2 z-10 shrink-0 text-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {/* Quick Search */}
          <div className="relative min-w-[160px] max-w-xs flex-1">
            <span className="material-symbols-outlined text-[15px] text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar PDV, centro de costo o código..."
              className="w-full bg-[#131b2e] text-white text-xs pl-8 pr-2.5 py-1.5 rounded-xl border border-[#222a3d] focus:outline-none focus:ring-1 focus:ring-[#0088ff]"
            />
          </div>

          {/* Region selector */}
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value as any)}
            className="bg-[#131b2e] text-white text-xs px-2.5 py-1.5 rounded-xl border border-[#222a3d] focus:outline-none focus:ring-1 focus:ring-[#0088ff] cursor-pointer"
          >
            <option value="Todas">Toda La Guajira ({allAvailablePoints.length})</option>
            <option value="Norte">Regional Norte (Maicao/Uribia/Albania)</option>
            <option value="Centro">Regional Centro (Riohacha/Dibulla/Manaure)</option>
            <option value="Sur">Regional Sur (Villanueva/Fonseca/San Juan/Barrancas)</option>
            <option value="Bancario">Corresponsalías Bancarias</option>
          </select>

          {/* Channel selector */}
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="bg-[#131b2e] text-white text-xs px-2.5 py-1.5 rounded-xl border border-[#222a3d] focus:outline-none focus:ring-1 focus:ring-[#0088ff] cursor-pointer"
          >
            <option value="todos">Todos los Canales ({filteredPoints.length})</option>
            <option value="CDA">🔵 CDA · Acopio ({typeCounts.CDA})</option>
            <option value="PF">🟠 PF · Punto Fijo ({typeCounts.PF})</option>
            <option value="CM">🔴 CM · Tradicional/Tienda ({typeCounts.CM})</option>
            <option value="Bancario">🟢 Bancario · Corresponsal ({typeCounts.Bancario})</option>
            {typeCounts.ETC > 0 && <option value="ETC">🟣 ETC · Otros ({typeCounts.ETC})</option>}
          </select>

          {/* Municipality selector */}
          <select
            value={selectedMunicipality}