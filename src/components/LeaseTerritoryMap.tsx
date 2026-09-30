import React, { useState } from 'react';
import { LeasePoint } from '../types';
import { evaluatePointOpenStatus } from '../data/leasePointsData';
import { CaviNativeMap } from './CaviNativeMap';

interface LeaseTerritoryMapProps {
  points: LeasePoint[];
  onSelectPoint: (point: LeasePoint) => void;
  onOpenDetails: (point: LeasePoint) => void;
}

export const LeaseTerritoryMap: React.FC<LeaseTerritoryMapProps> = ({
  points,
  onSelectPoint,
  onOpenDetails,
}) => {
  const [mapMode, setMapMode] = useState<'mymaps' | 'radar'>('mymaps');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPointList, setShowPointList] = useState(true);

  // Normalize coordinates for radar view:
  const minLat = 10.4;
  const maxLat = 12.2;
  const minLng = -73.6;
  const maxLng = -71.2;

  const getCoordinatesPct = (lat: number, lng: number) => {
    const yPct = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    const xPct = ((lng - minLng) / (maxLng - minLng)) * 100;
    const clampedX = Math.max(5, Math.min(95, xPct));
    const clampedY = Math.max(5, Math.min(95, yPct));
    return { x: clampedX, y: clampedY };
  };

  const selectedPoint = points.find((p) => p.id === selectedPointId);
  const selectedStatus = selectedPoint ? evaluatePointOpenStatus(selectedPoint) : null;

  return (
    <div
      className={`relative w-full bg-[#060e20] rounded-2xl border border-[#222a3d] overflow-hidden shadow-2xl transition-all duration-300 flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen min-h-screen' : 'min-h-[560px] h-[640px]'
      }`}
    >
      {/* Map Header Toolbar */}
      <div className="p-3 sm:p-4 bg-[#131b2e]/95 backdrop-blur-md border-b border-[#222a3d] flex flex-wrap items-center justify-between gap-2.5 z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0088ff]/20 text-[#0088ff] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">map</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                Georreferenciación de Puntos en Arrendamiento
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/30">
                CAVIMAPS Integrado
              </span>
            </div>
            <p className="text-[11px] text-[#94a3b8]">
              Visualización satelital y territorial oficial de puntos y rutas en La Guajira con CAVIMAPS
            </p>
          </div>
        </div>

        {/* Controls: Mode Switcher, Fullscreen, External Link */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#0b1326] p-1 rounded-xl border border-[#222a3d]">
            <button
              type="button"
              onClick={() => setMapMode('mymaps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mapMode === 'mymaps'
                  ? 'bg-[#0088ff] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Ver mapa oficial en CAVIMAPS"
            >
              <span className="material-symbols-outlined text-[15px]">public</span>
              CAVIMAPS
            </button>
            <button
              type="button"
              onClick={() => setMapMode('radar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mapMode === 'radar'
                  ? 'bg-[#0088ff] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              title="Ver radar táctico con semáforos de abiertos/cerrados en tiempo real"
            >
              <span className="material-symbols-outlined text-[15px]">radar</span>
              Radar de Horarios
            </button>
          </div>

          {/* Toggle Point Drawer */}
          <button
            type="button"
            onClick={() => setShowPointList(!showPointList)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              showPointList
                ? 'bg-[#171f33] border-[#38bdf8]/50 text-[#38bdf8]'
                : 'bg-[#131b2e] border-[#222a3d] text-[#94a3b8] hover:text-white'
            }`}
            title={showPointList ? 'Ocultar panel lateral de puntos' : 'Mostrar panel lateral de puntos'}
          >
            <span className="material-symbols-outlined text-[16px]">view_sidebar</span>
            <span className="hidden sm:inline">Puntos ({points.length})</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-[#131b2e] hover:bg-[#171f33] text-[#dae2fd] hover:text-white border border-[#222a3d] transition-colors cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Container: Map Frame + Sidebar */}
      <div className="relative flex-1 w-full h-full flex overflow-hidden">
        {/* MAP VIEW */}
        <div className="relative flex-1 w-full h-full bg-[#060e20] flex items-center justify-center overflow-hidden">
          {mapMode === 'mymaps' ? (
            <div className="relative w-full h-full">
              <CaviNativeMap
                height="100%"
                showFullscreenButton={false}
              />
            </div>
          ) : (
            /* TACTICAL RADAR CANVAS */
            <div className="relative w-full h-full min-h-[380px] bg-gradient-to-b from-[#0b172d] to-[#060e20] p-4 flex items-center justify-center overflow-hidden">
              <svg
                className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="oceanGlow" cx="70%" cy="30%" r="60%">
                    <stop offset="0%" stopColor="#0088ff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#060e20" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#oceanGlow)" />
                <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#1e293b" strokeDasharray="4 4" />
              </svg>

              <div className="absolute top-6 right-8 text-[11px] font-bold text-[#38bdf8]/40 uppercase tracking-widest pointer-events-none select-none">
                Mar Caribe / Alta Guajira
              </div>
              <div className="absolute top-1/2 left-8 text-[11px] font-bold text-[#94a3b8]/30 uppercase tracking-widest pointer-events-none select-none">
                Troncal del Caribe · Media Guajira
              </div>
              <div className="absolute bottom-6 left-12 text-[11px] font-bold text-[#94a3b8]/30 uppercase tracking-widest pointer-events-none select-none">
                Serranía del Perijá · Sur de La Guajira
              </div>

              {/* Pins */}
              <div className="relative w-full h-full min-h-[360px]">
                {points.map((pt) => {
                  const { x, y } = getCoordinatesPct(pt.lat, pt.lng);
                  const evalStatus = evaluatePointOpenStatus(pt);
                  const isSelected = selectedPointId === pt.id;

                  let pinBg = 'bg-[#10b981]';
                  let pinRing = 'ring-[#10b981]/50';
                  let pinIcon = 'storefront';

                  if (pt.operatingStatus === 'temporarily_closed' || pt.operatingStatus === 'maintenance') {
                    pinBg = 'bg-[#f59e0b]';
                    pinRing = 'ring-[#f59e0b]/50';
                    pinIcon = 'warning';
                  } else if (!evalStatus.isOpenNow) {
                    pinBg = 'bg-[#ef4444]';
                    pinRing = 'ring-[#ef4444]/50';
                    pinIcon = 'lock';
                  }

                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => {
                        setSelectedPointId(pt.id);
                        onSelectPoint(pt);
                      }}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-transform z-20 cursor-pointer ${
                        isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                      }`}
                      title={`${pt.code} - ${pt.name} (${evalStatus.statusBadgeText})`}
                    >
                      {evalStatus.isOpenNow && (
                        <span className="absolute -inset-1.5 rounded-full bg-[#10b981] opacity-75 animate-ping" />
                      )}

                      <div
                        className={`relative w-8 h-8 rounded-full ${pinBg} text-white flex items-center justify-center shadow-lg ring-2 ${pinRing} transition-all`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{pinIcon}</span>
                      </div>

                      <div className="absolute top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#060e20]/90 border border-[#222a3d] text-[10px] font-bold text-white whitespace-nowrap shadow-md pointer-events-none">
                        {pt.municipality}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Point Popover Detail Card on Map */}
              {selectedPoint && selectedStatus && (
                <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 bg-[#131b2e]/95 backdrop-blur-md border border-[#38bdf8]/50 rounded-2xl p-4 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0b1326] text-[#38bdf8] border border-[#222a3d]">
                          {selectedPoint.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            selectedStatus.isOpenNow
                              ? 'bg-[#10b981]/20 text-[#4edea3]'
                              : 'bg-[#ef4444]/20 text-[#ffb4ab]'
                          }`}
                        >
                          {selectedStatus.statusBadgeText}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-snug">{selectedPoint.name}</h4>
                      <p className="text-[11px] text-[#94a3b8] mt-0.5">
                        {selectedPoint.address} ({selectedPoint.municipality})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPointId(null)}
                      className="text-[#94a3b8] hover:text-white p-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-[#222a3d] text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-[#cbd5e1]">
                      <span className="text-[#94a3b8]">Horario Hoy:</span>
                      <span className="font-semibold text-white">
                        {selectedStatus.todayHours.isOpen
                          ? `${selectedStatus.todayHours.open} - ${selectedStatus.todayHours.close}`
                          : 'Cerrado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#cbd5e1]">
                      <span className="text-[#94a3b8]">Situación:</span>
                      <span className="font-medium text-[#38bdf8]">{selectedStatus.timeContext}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#222a3d] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDetails(selectedPoint)}
                      className="w-full py-1.5 px-3 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">visibility</span>
                      Ver Ficha Completa
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SIDEBAR DRAWER WITH LEASE POINTS QUICK LIST */}
        {showPointList && (
          <aside className="w-72 sm:w-80 bg-[#0e172a]/95 backdrop-blur-md border-l border-[#222a3d] flex flex-col shrink-0 z-20 shadow-2xl transition-all">
            <div className="p-3 border-b border-[#222a3d] flex items-center justify-between bg-[#131b2e]">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">pin_drop</span>
                  Puntos Registrados
                </h4>
                <p className="text-[10px] text-[#94a3b8]">
                  {points.filter((p) => evaluatePointOpenStatus(p).isOpenNow).length} abiertos de {points.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPointList(false)}
                className="text-[#94a3b8] hover:text-white p-1 cursor-pointer"
                title="Cerrar panel lateral"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {points.map((pt) => {
                const status = evaluatePointOpenStatus(pt);
                const isSelected = selectedPointId === pt.id;

                return (
                  <div
                    key={pt.id}
                    onClick={() => {
                      setSelectedPointId(pt.id);
                      onSelectPoint(pt);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-[#171f33] border-[#0088ff] shadow-md'
                        : 'bg-[#131b2e] border-[#222a3d] hover:border-[#38bdf8]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono font-bold text-[10px] text-[#38bdf8] px-1.5 py-0.5 rounded bg-[#0b1326]">
                        {pt.code}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          status.isOpenNow
                            ? 'bg-[#10b981]/20 text-[#4edea3]'
                            : 'bg-[#ef4444]/20 text-[#ffb4ab]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            status.isOpenNow ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                          }`}
                        />
                        {status.isOpenNow ? 'Abierto' : 'Cerrado'}
                      </span>
                    </div>

                    <div className="font-bold text-white text-[11px] truncate">{pt.name}</div>
                    <div className="text-[10px] text-[#94a3b8] truncate mt-0.5">
                      {pt.address} · <strong className="text-[#cbd5e1]">{pt.municipality}</strong>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-[#222a3d] flex items-center justify-between text-[10px]">
                      <span className="text-[#94a3b8]">Horario Hoy:</span>
                      <span className="font-mono text-white font-semibold">
                        {status.todayHours.isOpen
                          ? `${status.todayHours.open} - ${status.todayHours.close}`
                          : 'Cerrado'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-1">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${pt.lat},${pt.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 rounded bg-[#0b1326] text-[#38bdf8] hover:text-white text-[10px] font-semibold flex items-center gap-1 border border-[#222a3d]"
                      >
                        <span className="material-symbols-outlined text-[12px]">navigation</span>
                        Navegar
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(pt);
                        }}
                        className="px-2 py-1 rounded bg-[#0088ff] text-white hover:bg-[#0070d8] text-[10px] font-bold transition-colors"
                      >
                        Ficha
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
