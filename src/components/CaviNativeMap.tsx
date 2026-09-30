import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CaviPoint } from '../types/caviMap';
import { CAVI_POINTS, MUNICIPALITIES_GUAJIRA } from '../data/caviPointsData';
import {
  calculateDistanceKm,
  calculateTotalRouteDistanceKm,
  formatDistance,
  estimateTravelTime,
  interpolateCoords,
} from '../utils/geoUtils';

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
  onPointSelect?: (point: CaviPoint) => void;
  onStopArrival?: (stop: RouteWaypoint) => void;
  className?: string;
  height?: string;
  showFullscreenButton?: boolean;
}

export const CaviNativeMap: React.FC<CaviNativeMapProps> = ({
  initialPoints = CAVI_POINTS,
  initialRouteStops = [],
  onPointSelect,
  onStopArrival,
  className = '',
  height = '620px',
  showFullscreenButton = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const guideVehicleMarkerRef = useRef<L.Marker | null>(null);

  // Map settings state
  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark' | 'streets'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterRegion, setFilterRegion] = useState<'Todas' | 'Norte' | 'Centro' | 'Sur' | 'Bancario'>('Todas');
  const [filterChannel, setFilterChannel] = useState<string>('todos');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<CaviPoint | null>(null);

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
    // Default sample route connecting 4 strategic hubs across La Guajira
    return [
      { id: 'h1', name: 'Riohacha Centro (CDA Sede la 10)', lat: 11.548376, lng: -72.909395, municipality: 'Riohacha', channel: 'CDA' },
      { id: 'h2', name: 'Manaure Principal', lat: 11.776552, lng: -72.446298, municipality: 'Manaure', channel: 'CDA' },
      { id: 'h3', name: 'Maicao Central', lat: 11.379111, lng: -72.242222, municipality: 'Maicao', channel: 'CDA' },
      { id: 'h4', name: 'Fonseca Principal', lat: 10.889, lng: -72.8499, municipality: 'Fonseca', channel: 'CDA' },
    ];
  });

  // Guided navigation simulation state
  const [isGuidedModeActive, setIsGuidedModeActive] = useState(false);
  const [isSimulationPlaying, setIsSimulationPlaying] = useState(false);
  const [currentLegIndex, setCurrentLegIndex] = useState(0); // 0 -> moving between waypoints[0] and waypoints[1]
  const [legProgress, setLegProgress] = useState(0); // 0.0 to 1.0
  const [simulationSpeed, setSimulationSpeed] = useState<number>(2); // 1x, 2x, 5x, 10x
  const [followCamera, setFollowCamera] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Sync when initialRouteStops changes externally
  useEffect(() => {
    if (initialRouteStops && initialRouteStops.length > 0) {
      const validStops = initialRouteStops
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
      if (validStops.length > 0) {
        setRouteWaypoints(validStops);
      }
    }
  }, [initialRouteStops]);

  // Total route metrics
  const totalDistanceKm = useMemo(() => {
    return calculateTotalRouteDistanceKm(routeWaypoints);
  }, [routeWaypoints]);

  const estimatedTime = useMemo(() => {
    return estimateTravelTime(totalDistanceKm);
  }, [totalDistanceKm]);

  // Filtered points
  const filteredPoints = useMemo(() => {
    return initialPoints.filter((p) => {
      if (filterRegion !== 'Todas' && p.subregion !== filterRegion) return false;
      if (filterChannel !== 'todos' && p.channel !== filterChannel) return false;
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
  }, [initialPoints, filterRegion, filterChannel, selectedMunicipality, searchQuery]);

  // Tile layer URL configuration
  const getTileConfig = useCallback((style: 'satellite' | 'dark' | 'streets') => {
    switch (style) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          maxZoom: 18,
        };
      case 'streets':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          attribution: '&copy; OpenStreetMap, &copy; CARTO',
          maxZoom: 19,
        };
      case 'dark':
      default:
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; OpenStreetMap, &copy; CARTO',
          maxZoom: 19,
        };
    }
  }, []);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center of La Guajira (near Maicao / Albania / Riohacha triangle)
      const map = L.map(mapContainerRef.current, {
        center: [11.38, -72.65],
        zoom: 9,
        zoomControl: false,
      });

      // Layer groups
      const markersLayer = L.layerGroup().addTo(map);
      const routePolyline = L.polyline([], {
        color: '#0088ff',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);
      const routeMarkersLayer = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
      routePolylineRef.current = routePolyline;
      routeMarkersLayerRef.current = routeMarkersLayer;

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    // Set or switch tile layer
    const config = getTileConfig(mapStyle);
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newTileLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;

    // Invalidate size on mount
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => {
      // do not destroy full map on every re-render, cleanup handled on unmount
    };
  }, [mapStyle, getTileConfig]);

  // Handle Fullscreen resize
  useEffect(() => {
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
  }, [isFullscreen]);

  // 2. Render CAVI Points Markers (Custom DIV Icons with Channel Colors)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // Map each point to a high-performance Leaflet DivIcon
    filteredPoints.forEach((pt) => {
      // Channel color code:
      // CDA = Sky Blue, PF = Amber/Orange, CM = Coral/Rose, Bancario = Emerald Green
      let bgColor = '#0284c7';
      let channelLabel = pt.channel || 'PDV';
      if (pt.channel === 'CDA') bgColor = '#0088ff';
      else if (pt.channel === 'PF') bgColor = '#f59e0b';
      else if (pt.channel === 'CM') bgColor = '#ef4444';
      else if (pt.channel === 'Bancario') bgColor = '#10b981';

      const divIcon = L.divIcon({
        className: 'cavi-point-marker-custom',
        html: `
          <div style="
            background: ${bgColor};
            color: #ffffff;
            font-size: 9px;
            font-weight: 700;
            padding: 3px 6px;
            border-radius: 9999px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            border: 1.5px solid #ffffff;
            display: flex;
            align-items: center;
            gap: 3px;
            white-space: nowrap;
            cursor: pointer;
            transition: transform 0.15s ease-out;
          ">
            <span style="width: 5px; height: 5px; border-radius: 50%; background: #ffffff;"></span>
            <span>${pt.name.slice(0, 16)}</span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: divIcon });

      marker.on('click', () => {
        setSelectedPoint(pt);
        if (onPointSelect) onPointSelect(pt);
      });

      marker.bindTooltip(
        `<strong>${pt.name}</strong><br/><span style="font-size: 10px; color: #cbd5e1;">${pt.municipality} · ${channelLabel} · PDV: ${pt.codePdv || 'N/A'}</span>`,
        { direction: 'top', offset: [0, -8], opacity: 0.95 }
      );

      markersLayer.addLayer(marker);
    });
  }, [filteredPoints, onPointSelect]);

  // 3. Render Route Polyline & Sequential Waypoint Badges (①, ②, ③...)
  useEffect(() => {
    if (!mapInstanceRef.current || !routePolylineRef.current || !routeMarkersLayerRef.current) return;
    const polyline = routePolylineRef.current;
    const routeMarkers = routeMarkersLayerRef.current;

    routeMarkers.clearLayers();

    if (routeWaypoints.length < 2) {
      polyline.setLatLngs([]);
    } else {
      const latLngs = routeWaypoints.map((w) => [w.lat, w.lng] as [number, number]);
      polyline.setLatLngs(latLngs);
    }

    // Numbered Waypoint Badges
    routeWaypoints.forEach((wp, index) => {
      const isVisited = wp.visited;
      const badgeIcon = L.divIcon({
        className: 'cavi-waypoint-badge-custom',
        html: `
          <div style="
            background: ${isVisited ? '#059669' : '#0088ff'};
            color: #ffffff;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 800;
            box-shadow: 0 0 0 3px rgba(255,255,255,0.9), 0 6px 16px rgba(0,0,0,0.6);
            border: 2px solid ${isVisited ? '#34d399' : '#38bdf8'};
            cursor: pointer;
          ">
            ${isVisited ? '✓' : index + 1}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([wp.lat, wp.lng], { icon: badgeIcon, zIndexOffset: 1000 });
      marker.bindTooltip(
        `<strong>Parada ${index + 1}: ${wp.name}</strong><br/>${wp.municipality || 'La Guajira'} ${isVisited ? '(Visitado)' : '(Pendiente)'}`,
        { direction: 'top', offset: [0, -14], opacity: 0.95 }
      );

      marker.on('click', () => {
        const found = CAVI_POINTS.find((p) => p.name === wp.name || p.id === wp.id);
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
  }, [routeWaypoints]);

  // 4. Guided Displacement Simulation Engine (Moving vehicle/auditor beacon along polyline)
  useEffect(() => {
    if (!isGuidedModeActive || !isSimulationPlaying || routeWaypoints.length < 2) {
      return;
    }

    const intervalMs = 60; // 60ms ticks for ultra-smooth movement
    const stepIncrement = (0.015 * simulationSpeed);

    const timer = setInterval(() => {
      setLegProgress((prev) => {
        const next = prev + stepIncrement;
        if (next >= 1.0) {
          // Reached destination waypoint of current leg
          const destIndex = currentLegIndex + 1;
          const arrivedStop = routeWaypoints[destIndex];

          if (arrivedStop) {
            // Mark stop as visited
            setRouteWaypoints((stops) =>
              stops.map((s, idx) => (idx === destIndex ? { ...s, visited: true, visitedAt: new Date().toLocaleTimeString() } : s))
            );
            if (onStopArrival) {
              onStopArrival(arrivedStop);
            }
          }

          if (currentLegIndex + 2 < routeWaypoints.length) {
            // Advance to next leg
            setCurrentLegIndex((c) => c + 1);
            return 0;
          } else {
            // Reached final destination of the route!
            setIsSimulationPlaying(false);
            return 1.0;
          }
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isGuidedModeActive, isSimulationPlaying, currentLegIndex, simulationSpeed, routeWaypoints, onStopArrival]);

  // Update vehicle beacon position on map
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

    if (!guideVehicleMarkerRef.current) {
      const vehicleIcon = L.divIcon({
        className: 'cavi-guide-beacon-icon',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: -4px; border-radius: 50%; background: #0088ff; opacity: 0.4; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #0088ff; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #ffffff;">
              <span class="material-symbols-outlined" style="font-size: 18px;">directions_car</span>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      guideVehicleMarkerRef.current = L.marker([currentCoords.lat, currentCoords.lng], {
        icon: vehicleIcon,
        zIndexOffset: 2000,
      }).addTo(mapInstanceRef.current);
    } else {
      guideVehicleMarkerRef.current.setLatLng([currentCoords.lat, currentCoords.lng]);
    }

    if (followCamera && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([currentCoords.lat, currentCoords.lng], { animate: true, duration: 0.2 });
    }
  }, [isGuidedModeActive, currentLegIndex, legProgress, routeWaypoints, followCamera]);

  // Route actions
  const handleAddPointToRoute = (pt: CaviPoint) => {
    if (routeWaypoints.some((w) => w.lat === pt.lat && w.lng === pt.lng)) {
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
  };

  const handleRemoveWaypoint = (index: number) => {
    setRouteWaypoints((prev) => prev.filter((_, idx) => idx !== index));
    if (currentLegIndex >= index && currentLegIndex > 0) {
      setCurrentLegIndex((c) => c - 1);
    }
  };

  const handleClearRoute = () => {
    setRouteWaypoints([]);
    setIsGuidedModeActive(false);
    setIsSimulationPlaying(false);
    setCurrentLegIndex(0);
    setLegProgress(0);
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
    } else {
      setIsSimulationPlaying(!isSimulationPlaying);
    }
  };

  const handleSkipNextStop = () => {
    if (currentLegIndex + 2 < routeWaypoints.length) {
      setCurrentLegIndex((c) => c + 1);
      setLegProgress(0);
    } else {
      setIsSimulationPlaying(false);
      setLegProgress(1.0);
    }
  };

  const currentDestinationStop = routeWaypoints[currentLegIndex + 1];
  const currentOriginStop = routeWaypoints[currentLegIndex];
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
                {filteredPoints.length} Puntos Oficiales
              </span>
            </div>
            <p className="text-[11px] text-[#94a3b8] truncate">
              {routeWaypoints.length} paradas en ruta · {formatDistance(totalDistanceKm)} · Est. {estimatedTime}
            </p>
          </div>
        </div>

        {/* MAP CONTROLS & GUIDED NAVIGATION TRIGGER */}
        <div className="flex items-center gap-2 flex-wrap">
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
                ? 'Pausar Desplazamiento'
                : isGuidedModeActive
                ? 'Reanudar Desplazamiento'
                : 'Iniciar Desplazamiento Guiado'}
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
            title="Panel de paradas y filtro de puntos"
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
            <option value="Todas">Toda La Guajira</option>
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
            <option value="todos">Todos los Canales</option>
            <option value="CDA">CDA (Centros de Acopio)</option>
            <option value="PF">PF (Puntos Fijos)</option>
            <option value="CM">CM (Canal Tradicional / Tiendas)</option>
            <option value="Bancario">Corresponsales Bancarios</option>
          </select>

          {/* Municipality selector */}
          <select
            value={selectedMunicipality}
            onChange={(e) => setSelectedMunicipality(e.target.value)}
            className="bg-[#131b2e] text-white text-xs px-2.5 py-1.5 rounded-xl border border-[#222a3d] focus:outline-none focus:ring-1 focus:ring-[#0088ff] cursor-pointer"
          >
            <option value="todos">15 Municipios</option>
            {MUNICIPALITIES_GUAJIRA.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Guajira Camera */}
        <button
          type="button"
          onClick={handleFitGuajiraBounds}
          className="text-[#38bdf8] hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">public</span>
          <span>Vista Departamental</span>
        </button>
      </div>

      {/* MAIN VIEWPORT: MAP CANVAS + ROUTE & GUIDED NAVIGATION OVERLAYS */}
      <div className="flex-1 min-h-0 relative flex overflow-hidden">
        {/* LEAFLET CONTAINER */}
        <div ref={mapContainerRef} className="w-full h-full relative z-0 bg-[#060e20]" />

        {/* FLOATING GUIDED DISPLACEMENT HUD (WHEN ACTIVE) */}
        {isGuidedModeActive && currentDestinationStop && (
          <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md bg-[#0b1326]/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#0088ff]/50 shadow-2xl z-30 animate-in fade-in flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <span>Desplazamiento Guiado en Curso</span>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#0088ff]/20 text-[#38bdf8] border border-[#0088ff]/40 text-[10px] font-mono font-bold">
                Tramo {currentLegIndex + 1} de {routeWaypoints.length - 1}
              </span>
            </div>

            {/* Next Stop Details */}
            <div className="bg-[#131b2e] p-2.5 rounded-xl border border-[#222a3d] space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#94a3b8]">Próximo Destino:</span>
                <span className="font-bold text-[#fcd34d] truncate ml-2">{currentDestinationStop.name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#94a3b8]">Municipio:</span>
                <span className="font-semibold text-white">{currentDestinationStop.municipality || 'La Guajira'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#94a3b8]">Distancia Restante al Punto:</span>
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
                title="Llegar / Saltar de inmediato al siguiente punto"
              >
                <span className="material-symbols-outlined text-[15px]">skip_next</span>
                <span className="hidden sm:inline">Saltar</span>
              </button>

              {/* Speed Switcher */}
              <button
                type="button"
                onClick={() => setSimulationSpeed((s) => (s === 1 ? 2 : s === 2 ? 5 : s === 5 ? 10 : 1))}
                className="py-1.5 px-2 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#fcd34d] font-mono text-xs font-bold transition-all cursor-pointer"
                title="Velocidad de desplazamiento"
              >
                {simulationSpeed}x
              </button>

              {/* Follow Camera */}
              <button
                type="button"
                onClick={() => setFollowCamera(!followCamera)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  followCamera ? 'bg-[#10b981] text-white' : 'bg-[#1e293b] text-[#94a3b8]'
                }`}
                title={followCamera ? 'Seguimiento de cámara activo' : 'Cámara libre'}
              >
                <span className="material-symbols-outlined text-[16px]">my_location</span>
              </button>

              {/* Exit Guided Mode */}
              <button
                type="button"
                onClick={() => {
                  setIsGuidedModeActive(false);
                  setIsSimulationPlaying(false);
                }}
                className="p-1.5 rounded-xl bg-[#1e293b] hover:bg-[#991b1b] text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                title="Cerrar navegación guiada"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* SELECTED POINT DETAIL CARD OVERLAY */}
        {selectedPoint && (
          <div className="absolute bottom-4 left-4 z-30 max-w-sm w-[calc(100%-32px)] bg-[#131b2e]/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#222a3d] shadow-2xl animate-in fade-in">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                      selectedPoint.channel === 'CDA'
                        ? 'bg-[#0088ff]'
                        : selectedPoint.channel === 'PF'
                        ? 'bg-[#f59e0b]'
                        : selectedPoint.channel === 'CM'
                        ? 'bg-[#ef4444]'
                        : 'bg-[#10b981]'
                    }`}
                  >
                    {selectedPoint.channel || 'PDV'}
                  </span>
                  {selectedPoint.codePdv && (
                    <span className="px-1.5 py-0.5 rounded bg-[#1e293b] text-[#cbd5e1] text-[10px] font-mono font-bold">
                      {selectedPoint.codePdv}
                    </span>
                  )}
                  <span className="text-[10px] text-[#38bdf8] font-bold">{selectedPoint.municipality}</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1 leading-snug truncate">{selectedPoint.name}</h3>
                {selectedPoint.address && <p className="text-xs text-[#cbd5e1] mt-0.5">{selectedPoint.address}</p>}
                {selectedPoint.costCenter && (
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">Centro Costo: {selectedPoint.costCenter}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="p-1 text-[#cbd5e1] hover:text-white"
              >
                <span className="material-symbols-outlined text-[17px]">close</span>
              </button>
            </div>

            {/* Quick Actions for Selected Point */}
            <div className="mt-3 pt-2.5 border-t border-[#222a3d] flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleAddPointToRoute(selectedPoint)}
                className="flex-1 py-1.5 px-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm shadow-[#0088ff]/30"
              >
                <span className="material-symbols-outlined text-[14px]">add_location_alt</span>
                <span>Añadir a Ruta</span>
              </button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.lat},${selectedPoint.lng}`}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-2.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#38bdf8] text-[11px] font-bold flex items-center justify-center gap-1 border border-[#3b4760] transition-colors"
                title="Navegar con Google Maps"
              >
                <span className="material-symbols-outlined text-[14px]">directions</span>
                <span>GPS</span>
              </a>
              <a
                href={`https://www.waze.com/ul?ll=${selectedPoint.lat},${selectedPoint.lng}&navigate=yes`}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-2.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#dae2fd] text-[11px] font-bold flex items-center justify-center gap-1 border border-[#3b4760] transition-colors"
                title="Navegar con Waze"
              >
                <span className="material-symbols-outlined text-[14px]">navigation</span>
                <span>Waze</span>
              </a>
            </div>
          </div>
        )}

        {/* SIDEBAR DRAWER: ROUTE STOPS & SEQUENCE BUILDER */}
        {isDrawerOpen && (
          <div className="w-72 sm:w-80 bg-[#131b2e]/95 backdrop-blur-md border-l border-[#222a3d] flex flex-col h-full z-20 shrink-0">
            {/* Drawer Header */}
            <div className="p-3 border-b border-[#222a3d] bg-[#171f33] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#0088ff]">route</span>
                  <span>Ruta Trazada</span>
                </span>
                <span className="text-[10px] text-[#94a3b8] block">
                  {routeWaypoints.length} paradas · {formatDistance(totalDistanceKm)}
                </span>
              </div>
              <div className="flex items-center gap-1">
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
                  className="p-1 text-[#cbd5e1] hover:text-white"
                >
                  <span className="material-symbols-outlined text-[17px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* List of stops in route */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {routeWaypoints.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#94a3b8] space-y-2">
                  <span className="material-symbols-outlined text-[32px] text-[#38bdf8]/40 block">route</span>
                  <p className="font-semibold text-white">No hay paradas en la ruta</p>
                  <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                    Haz clic en cualquier punto del mapa y pulsa <strong>"Añadir a Ruta"</strong> para trazar la secuencia de recorrido.
                  </p>
                </div>
              ) : (
                routeWaypoints.map((wp, idx) => {
                  const isCurrentLegTarget = isGuidedModeActive && currentLegIndex + 1 === idx;
                  const isVisited = wp.visited;

                  return (
                    <div
                      key={wp.id + '-' + idx}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isCurrentLegTarget
                          ? 'bg-[#0088ff]/15 border-[#0088ff] shadow-sm'
                          : isVisited
                          ? 'bg-[#064e3b]/30 border-[#059669]/50 opacity-80'
                          : 'bg-[#171f33] border-[#222a3d] hover:border-[#38bdf8]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isVisited
                                ? 'bg-[#059669] text-white'
                                : isCurrentLegTarget
                                ? 'bg-[#0088ff] text-white animate-pulse'
                                : 'bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/40'
                            }`}
                          >
                            {isVisited ? '✓' : idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{wp.name}</p>
                            <p className="text-[10px] text-[#cbd5e1] truncate">
                              {wp.municipality || 'La Guajira'} {wp.channel ? `· ${wp.channel}` : ''}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveWaypoint(idx)}
                          className="p-1 text-[#94a3b8] hover:text-rose-400 shrink-0"
                          title="Remover de la ruta"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>

                      {/* Leg distance indicator between stops */}
                      {idx < routeWaypoints.length - 1 && (
                        <div className="mt-1.5 pt-1 border-t border-[#222a3d]/50 flex items-center justify-between text-[10px] text-[#94a3b8] font-mono">
                          <span>Distancia al sig. punto:</span>
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
            <div className="p-3 bg-[#171f33] border-t border-[#222a3d] space-y-2">
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

              <button
                type="button"
                onClick={handleFitRouteBounds}
                disabled={routeWaypoints.length === 0}
                className="w-full py-1.5 px-3 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#cbd5e1] hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">center_focus_strong</span>
                <span>Centrar en Ruta</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
