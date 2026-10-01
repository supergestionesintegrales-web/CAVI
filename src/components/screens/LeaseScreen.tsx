import React, { useState, useMemo } from 'react';
import { LeasePoint, UserRole, LeaseOperatingStatus, LeaseIncident } from '../../types';
import {
  evaluatePointOpenStatus,
  formatCOP,
  getContractDaysRemaining,
  getLeaseLifecycleStatus,
} from '../../data/leasePointsData';
import { exportLeasePointsToExcel } from '../../utils/leaseExcel';
import { AddEditLeaseModal } from '../AddEditLeaseModal';
import { LeaseIncidentModal } from '../LeaseIncidentModal';
import { LeaseDetailsModal } from '../LeaseDetailsModal';
import { LeaseTerritoryMap } from '../LeaseTerritoryMap';

interface LeaseScreenProps {
  leasePoints: LeasePoint[];
  onAddPoint: (point: LeasePoint) => void;
  onUpdatePoint: (point: LeasePoint) => void;
  onDeletePoint: (pointId: string) => void;
  onUpdatePointStatus: (
    pointId: string,
    status: LeaseOperatingStatus,
    override: 'force_open' | 'force_closed' | null,
    notes: string,
    newIncident?: LeaseIncident,
    inactivityReason?: LeasePoint['inactivityReason']
  ) => void;
  onResolveIncident?: (pointId: string, incidentId: string, notes: string) => void;
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  userRole?: UserRole;
}

export const LeaseScreen: React.FC<LeaseScreenProps> = ({
  leasePoints,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onUpdatePointStatus,
  onResolveIncident,
  onShowToast,
  userRole = 'administrador',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'incidents' | 'depurado'>('all');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<LeasePoint | null>(null);

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentPoint, setIncidentPoint] = useState<LeasePoint | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsPoint, setDetailsPoint] = useState<LeasePoint | null>(null);

  const now = new Date();
  const pointsWithStatus = useMemo(() => {
    return leasePoints.map((pt) => ({
      point: pt,
      status: evaluatePointOpenStatus(pt, now),
      contract: getContractDaysRemaining(pt.contractEndDate),
      lifecycle: getLeaseLifecycleStatus(pt, now),
    }));
  }, [leasePoints]);

  const metrics = useMemo(() => {
    const total = pointsWithStatus.length;
    const openPoints = pointsWithStatus.filter((p) => p.status.isOpenNow);
    const closedPoints = pointsWithStatus.filter((p) => !p.status.isOpenNow);
    const incidentPoints = pointsWithStatus.filter(
      (p) =>
        p.point.operatingStatus === 'temporarily_closed' ||
        p.point.operatingStatus === 'maintenance' ||
        p.point.incidents.some((i) => !i.resolved)
    );
    const totalRent = pointsWithStatus.reduce((acc, p) => acc + p.point.monthlyRent, 0);
    const depuradoCount = pointsWithStatus.filter((p) => p.lifecycle.lifecycleStatus === 'inactive').length;

    return {
      total,
      openCount: openPoints.length,
      closedCount: closedPoints.length,
      incidentCount: incidentPoints.length,
      totalRent,
      depuradoCount,
      openPct: total > 0 ? Math.round((openPoints.length / total) * 100) : 0,
    };
  }, [pointsWithStatus]);

  const municipalitiesList = useMemo(() => {
    const set = new Set(leasePoints.map((p) => p.municipality).filter(Boolean));
    return Array.from(set).sort();
  }, [leasePoints]);

  const filteredPoints = useMemo(() => {
    return pointsWithStatus.filter(({ point, status, lifecycle }) => {
      if (statusFilter === 'open' && !status.isOpenNow) return false;
      if (statusFilter === 'closed' && status.isOpenNow) return false;
      if (statusFilter === 'depurado' && lifecycle.lifecycleStatus !== 'inactive') return false;
      if (
        statusFilter === 'incidents' &&
        point.operatingStatus !== 'temporarily_closed' &&
        point.operatingStatus !== 'maintenance' &&
        !point.incidents.some((i) => !i.resolved)
      ) {
        return false;
      }

      if (selectedMunicipality !== 'all' && point.municipality !== selectedMunicipality) {
        return false;
      }

      if (selectedPropertyType !== 'all' && point.propertyType !== selectedPropertyType) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCode = point.code.toLowerCase().includes(query);
        const matchName = point.name.toLowerCase().includes(query);
        const matchAddr = point.address.toLowerCase().includes(query);
        const matchMuni = point.municipality.toLowerCase().includes(query);
        const matchLandlord = point.landlord.name.toLowerCase().includes(query);
        const matchNeigh = point.neighborhood.toLowerCase().includes(query);
        return matchCode || matchName || matchAddr || matchMuni || matchLandlord || matchNeigh;
      }

      return true;
    });
  }, [pointsWithStatus, statusFilter, selectedMunicipality, selectedPropertyType, searchTerm]);


  const handleExportExcel = () => {
    try {
      exportLeasePointsToExcel(leasePoints, `Arrendamientos_CAVI_Guajira_${new Date().toISOString().split('T')[0]}.xlsx`);
      onShowToast('Exportación Exitosa', 'El archivo Excel de arrendamientos fue descargado.', 'success');
    } catch {
      onShowToast('Error al exportar', 'No se pudo generar el archivo Excel.', 'error');
    }
  };

  const handleOpenAdd = () => {
    setEditingPoint(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (pt: LeasePoint) => {
    setEditingPoint(pt);
    setIsAddEditModalOpen(true);
  };

  const handleOpenIncident = (pt: LeasePoint) => {
    setIncidentPoint(pt);
    setIsIncidentModalOpen(true);
  };

  const handleOpenDetails = (pt: LeasePoint) => {
    setDetailsPoint(pt);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = (pt: LeasePoint) => {
    if (window.confirm(`¿Seguro que deseas eliminar el inmueble ${pt.code} (${pt.name})?`)) {
      onDeletePoint(pt.id);
      onShowToast('Inmueble Eliminado', `Se removió ${pt.code} del sistema de arrendamientos.`, 'info');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* SECTION HEADER & TITLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0088ff] text-[28px]">
              storefront
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Gestión de Puntos en Arrendamiento
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0088ff]/15 text-[#38bdf8] border border-[#0088ff]/30">
              CAVI Real Estate
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Supervisión táctica de apertura y cierre en tiempo real, horarios semanales, geolocalización y contratos de alquiler en La Guajira.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {userRole === 'administrador' && (
            <button
              onClick={handleOpenAdd}
              type="button"
              className="px-4 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-xs font-bold text-white shadow-md shadow-[#0088ff]/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              Nuevo Punto
            </button>
          )}
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Points */}
        <div className="p-3.5 bg-[#131b2e] rounded-2xl border border-[#222a3d] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Inmuebles</span>
            <span className="material-symbols-outlined text-[18px] text-[#38bdf8]">domain</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{metrics.total}</span>
            <span className="text-[11px] text-[#94a3b8]">puntos arrendados</span>
          </div>
        </div>

        {/* Open Now */}
        <div className="p-3.5 bg-[#131b2e] rounded-2xl border border-[#10b981]/30 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4edea3]">
              Abiertos Ahora
            </span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#4edea3] font-mono">
              {metrics.openCount}
            </span>
            <span className="text-[11px] text-[#4edea3] font-bold">
              ({metrics.openPct}% activos)
            </span>
          </div>
        </div>

        {/* Closed Now */}
        <div className="p-3.5 bg-[#131b2e] rounded-2xl border border-[#222a3d] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ffb4ab]">
              Cerrados Ahora
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">lock</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{metrics.closedCount}</span>
            <span className="text-[11px] text-[#94a3b8]">por horario / turno</span>
          </div>
        </div>

        {/* Incidents / Alerts */}
        <div className="p-3.5 bg-[#131b2e] rounded-2xl border border-[#ffb95f]/30 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ffb95f]">
              Con Novedad / Obras
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#ffb95f]">warning</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#ffb95f] font-mono">
              {metrics.incidentCount}
            </span>
            <span className="text-[11px] text-[#94a3b8]">reportes activos</span>
          </div>
        </div>

        {/* Depurado */}
        <div className="p-3.5 bg-[#131b2e] rounded-2xl border border-[#a855f7]/30 flex flex-col justify-between shadow-sm"><div className="flex items-center justify-between text-[#94a3b8]"><span className="text-[11px] font-semibold uppercase tracking-wider text-[#c084fc]">Depurados</span><span className="material-symbols-outlined text-[18px] text-[#c084fc]">inventory_2</span></div><div className="mt-2 flex items-baseline gap-2"><span className="text-2xl font-extrabold text-[#c084fc] font-mono">{metrics.depuradoCount}</span><span className="text-[11px] text-[#94a3b8]">contratos cerrados</span></div></div>

        {/* Total Rent */}
        <div className="col-span-2 lg:col-span-1 p-3.5 bg-[#131b2e] rounded-2xl border border-[#222a3d] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c0c1ff]">
              Canon Consolidado
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#c0c1ff]">payments</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold text-white font-mono truncate">
              {formatCOP(metrics.totalRent)}
            </span>
            <span className="text-[10px] text-[#94a3b8]">/mes</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="p-3.5 bg-[#131b2e] rounded-2xl border border-[#222a3d] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (ARR-RIO-001), nombre, dirección, barrio o arrendador..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-xs text-white placeholder-[#94a3b8] focus:border-[#0088ff] focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-[#171f33] p-1 rounded-xl border border-[#2d3449] shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#0088ff] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              Tarjetas & Horarios
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-[#0088ff] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">map</span>
              CAVIMAPS
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#222a3d]">
          <div className="flex flex-wrap items-center gap-1.5 py-1">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#222a3d] text-white font-bold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#171f33]'
              }`}
            >
              Todos ({pointsWithStatus.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('open')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                statusFilter === 'open'
                  ? 'bg-[#10b981]/25 text-[#4edea3] font-bold border border-[#10b981]/40'
                  : 'text-[#94a3b8] hover:text-[#4edea3] hover:bg-[#171f33]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              Abiertos ({metrics.openCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('closed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                statusFilter === 'closed'
                  ? 'bg-[#ef4444]/25 text-[#ffb4ab] font-bold border border-[#ef4444]/40'
                  : 'text-[#94a3b8] hover:text-[#ffb4ab] hover:bg-[#171f33]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
              Cerrados ({metrics.closedCount})
            </button>
            <button type="button" onClick={() => setStatusFilter('depurado')} className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${statusFilter === 'depurado' ? 'bg-[#a855f7]/20 text-[#c084fc] font-bold border border-[#a855f7]/40' : 'text-[#94a3b8] hover:text-[#c084fc] hover:bg-[#171f33]'}`}><span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>Depurados ({metrics.depuradoCount})</button>
            <button
              type="button"
              onClick={() => setStatusFilter('incidents')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                statusFilter === 'incidents'
                  ? 'bg-[#f59e0b]/25 text-[#ffb95f] font-bold border border-[#f59e0b]/40'
                  : 'text-[#94a3b8] hover:text-[#ffb95f] hover:bg-[#171f33]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
              Con Novedades ({metrics.incidentCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMunicipality}
              onChange={(e) => setSelectedMunicipality(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#171f33] border border-[#2d3449] text-xs text-white focus:outline-none"
            >
              <option value="all">Todos los Municipios</option>
              {municipalitiesList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedPropertyType}
              onChange={(e) => setSelectedPropertyType(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#171f33] border border-[#2d3449] text-xs text-white focus:outline-none"
            >
              <option value="all">Todos los Inmuebles</option>
              <option value="Local Comercial">Local Comercial</option>
              <option value="Isla Comercial">Isla Comercial</option>
              <option value="Oficina Administrativa">Oficina Administrativa</option>
              <option value="Centro de Distribución / Bodega">Bodega / Centro Distribución</option>
              <option value="Taquilla / Kiosko">Taquilla / Kiosko</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: MAP MODE */}
      {viewMode === 'map' && (
        <LeaseTerritoryMap
          points={filteredPoints.map((p) => p.point)}
          onSelectPoint={(pt) => {}}
          onOpenDetails={handleOpenDetails}
        />
      )}

      {/* VIEW 2: COMPACT POINT LIST */}
      {viewMode === 'cards' && (
        <>
          {filteredPoints.length === 0 ? (
            <div className="p-12 bg-[#131b2e] rounded-2xl border border-[#222a3d] text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#171f33] text-[#94a3b8] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">search_off</span>
              </div>
              <h3 className="text-base font-bold text-white">No se encontraron inmuebles</h3>
              <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
                No hay puntos de arrendamiento que coincidan con los filtros o el término de búsqueda ingresado.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSelectedMunicipality('all');
                  setSelectedPropertyType('all');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#0088ff] hover:bg-[#171f33] transition-colors cursor-pointer"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0088ff] text-[18px]">grid_view</span>
                    Puntos de Arrendamiento · Mosaico (4 Columnas)
                  </h2>
                  <p className="text-[11px] text-[#94a3b8]">Vista táctica en cuadrícula de 4 columnas con estado operativo, canon, contrato y geolocalización.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#171f33] border border-[#222a3d] text-[#38bdf8]">
                  {filteredPoints.length} de {pointsWithStatus.length} puntos
                </span>
              </div>

              {/* CUADRÍCULA MOSAICO DE 4 COLUMNAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3.5 items-stretch">
                {filteredPoints.map(({ point: pt, status, lifecycle, contract }) => {
                  const isInactive = lifecycle.lifecycleStatus === 'inactive';
                  const sales = pt.salesSummary;
                  const hasSalesAlert = sales?.daysWithoutSale !== undefined && sales.daysWithoutSale >= 60 && !isInactive;
                  const hasIncident = pt.operatingStatus === 'temporarily_closed' || pt.operatingStatus === 'maintenance' || pt.incidents.some((i) => !i.resolved);
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${pt.lat},${pt.lng}`;

                  return (
                    <div
                      key={pt.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenDetails(pt)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenDetails(pt); }}
                      className={`group flex flex-col justify-between bg-[#131b2e] rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-xl hover:border-[#0088ff]/60 hover:-translate-y-0.5 cursor-pointer overflow-hidden p-3.5 relative ${
                        isInactive
                          ? 'border-[#a855f7]/40 bg-gradient-to-b from-[#131b2e] to-[#181326]'
                          : hasIncident
                          ? 'border-[#ffb95f]/40 bg-gradient-to-b from-[#131b2e] to-[#201a14]'
                          : 'border-[#222a3d] hover:bg-[#162038]'
                      }`}
                    >
                      {/* Cabecera de la tarjeta: Código + Estado Operativo */}
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#222a3d]">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isInactive
                                ? 'bg-[#a855f7]/15 text-[#c084fc] border border-[#a855f7]/30'
                                : status.isOpenNow
                                ? 'bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30'
                                : hasIncident
                                ? 'bg-[#ffb95f]/15 text-[#ffb95f] border border-[#ffb95f]/30'
                                : 'bg-[#ef4444]/15 text-[#ffb4ab] border border-[#ef4444]/30'
                            }`}>
                              <span className="material-symbols-outlined text-[18px]">
                                {isInactive ? 'inventory_2' : status.isOpenNow ? 'storefront' : 'lock'}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0b1326] text-[#38bdf8] border border-[#2d3449]">
                              {pt.code}
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center">
                            {isInactive ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#a855f7]/15 text-[#c084fc] border border-[#a855f7]/30">
                                DEPURADO
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 border ${
                                status.isOpenNow
                                  ? 'bg-[#10b981]/15 text-[#4edea3] border-[#10b981]/30'
                                  : 'bg-[#ef4444]/15 text-[#ffb4ab] border-[#ef4444]/30'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.isOpenNow ? 'bg-[#10b981] animate-pulse' : 'bg-[#ef4444]'}`}></span>
                                {status.isOpenNow ? 'ABIERTO' : 'CERRADO'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Etiquetas contextuales */}
                        <div className="flex flex-wrap items-center gap-1 mt-2.5">
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-[#171f33] text-[#94a3b8] border border-[#222a3d]">
                            {pt.propertyType}
                          </span>
                          {hasIncident && !isInactive && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#ffb95f]/15 text-[#ffb95f] border border-[#ffb95f]/30 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[11px]">warning</span>
                              NOVEDAD
                            </span>
                          )}
                          {hasSalesAlert && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#ef4444]/15 text-[#ffb4ab] border border-[#ef4444]/30">
                              {sales!.daysWithoutSale}D SIN VENTAS
                            </span>
                          )}
                        </div>

                        {/* Nombre y Dirección */}
                        <div className="mt-2.5">
                          <h3 className="text-xs sm:text-[13px] font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-[#0088ff] dark:group-hover:text-[#38bdf8] transition-colors line-clamp-2">
                            {pt.name}
                          </h3>
                          <div className="mt-1 flex items-start gap-1 text-[10px] text-slate-600 dark:text-[#94a3b8] leading-tight">
                            <span className="material-symbols-outlined text-[13px] text-[#0088ff] dark:text-[#38bdf8] shrink-0 mt-0.5">location_on</span>
                            <span className="line-clamp-2">{pt.address} · <strong className="text-slate-900 dark:text-white font-semibold">{pt.municipality}</strong></span>
                          </div>
                          {pt.reference && (
                            <p className="text-[9px] text-slate-500 dark:text-[#64748b] italic mt-1 line-clamp-1">Ref: {pt.reference}</p>
                          )}
                        </div>

                        {/* Cuadrícula de Métricas Clave (Alto Contraste y Legibilidad) */}
                        <div className="mt-3 grid grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0e172a] border border-slate-200 dark:border-[#2d3a58] text-[10px] shadow-inner">
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-600 dark:text-[#94a3b8] font-bold">Canon Mensual</span>
                            <span className="text-[12px] font-extrabold font-mono text-emerald-600 dark:text-[#4edea3] truncate block mt-0.5">{formatCOP(pt.monthlyRent)}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-600 dark:text-[#94a3b8] font-bold">Vigencia</span>
                            <span className={`text-[11px] font-bold truncate block mt-0.5 ${
                              contract.status === 'valid' ? 'text-emerald-600 dark:text-[#4edea3]' : contract.status === 'expiring_soon' ? 'text-amber-600 dark:text-[#ffb95f]' : 'text-red-600 dark:text-[#ffb4ab]'
                            }`}>
                              {contract.label}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-600 dark:text-[#94a3b8] font-bold">Horario Hoy</span>
                            <span className="text-[11px] text-slate-800 dark:text-[#f8fafc] font-semibold truncate block mt-0.5">
                              {status.todayHours?.isOpen ? `${status.todayHours.open} - ${status.todayHours.close}` : 'Cerrado'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-600 dark:text-[#94a3b8] font-bold">Días Cuenta</span>
                            <span className="text-[11px] font-extrabold font-mono text-[#0088ff] dark:text-[#38bdf8] truncate block mt-0.5">
                              {pt.daysOfAccount !== undefined ? `${pt.daysOfAccount} días` : 'N/D'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pie de tarjeta: Arrendador, GPS y enlace Ficha */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#222a3d] flex items-center justify-between text-[10px]">
                        <div className="min-w-0 pr-1">
                          <span className="text-[9px] text-slate-500 dark:text-[#64748b] block truncate" title={pt.landlord.name}>
                            {pt.landlord.name ? `Prop: ${pt.landlord.name}` : `Contrato ${pt.contractNumber || 'N/D'}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Navegar en Google Maps"
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0088ff] dark:bg-[#171f33] dark:hover:bg-[#222a3d] dark:text-[#38bdf8] border border-slate-200 dark:border-[#222a3d] transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">near_me</span>
                          </a>
                          <span className="text-[10px] font-bold text-[#0088ff] group-hover:text-blue-700 dark:group-hover:text-[#38bdf8] flex items-center gap-0.5">
                            Ficha
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODALS */}
      <AddEditLeaseModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSave={(newPoint) => {
          if (editingPoint) {
            onUpdatePoint(newPoint);
            onShowToast('Punto Actualizado', `${newPoint.code} guardado exitosamente.`, 'success');
          } else {
            onAddPoint(newPoint);
            onShowToast('Punto Creado', `${newPoint.code} incorporado al inventario de arrendamientos.`, 'success');
          }
        }}
        editingPoint={editingPoint}
      />

      <LeaseIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        point={incidentPoint}
        onUpdatePointStatus={(id, status, override, notes, inc, inactivityReason) => {
          onUpdatePointStatus(id, status, override, notes, inc, inactivityReason);
          onShowToast('Estado Actualizado', 'Se registró la actualización operativa del punto.', 'info');
        }}
        onResolveIncident={onResolveIncident}
        currentUser={userRole === 'administrador' ? 'Administrador CAVI' : 'Auditor en Terreno'}
      />

      <LeaseDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        point={detailsPoint}
        userRole={userRole}
        onEdit={(pt) => {
          setIsDetailsModalOpen(false);
          handleOpenEdit(pt);
        }}
        onOpenIncident={(pt) => {
          setIsDetailsModalOpen(false);
          handleOpenIncident(pt);
        }}
      />
    </div>
  );
};
