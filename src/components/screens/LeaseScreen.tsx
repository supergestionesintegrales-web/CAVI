import React, { useState, useMemo } from 'react';
import { LeasePoint, UserRole, LeaseOperatingStatus, LeaseIncident } from '../../types';
import type { LeaseDataAlert } from '../../utils/dataReconciliation';
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
  alerts?: LeaseDataAlert[];
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
  alerts = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'incidents' | 'depurado'>('all');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [expandedSchedules, setExpandedSchedules] = useState<Record<string, boolean>>({});

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
    const depuradoCount = pointsWithStatus.filter((p) => p.lifecycle.status === 'inactive').length;

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
      if (statusFilter === 'depurado' && lifecycle.status !== 'inactive') return false;
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

  const toggleScheduleExpand = (pointId: string) => {
    setExpandedSchedules((prev) => ({
      ...prev,
      [pointId]: !prev[pointId],
    }));
  };

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
          <button
            onClick={handleExportExcel}
            type="button"
            className="px-3.5 py-2 rounded-xl bg-[#131b2e] hover:bg-[#171f33] border border-[#222a3d] text-xs font-bold text-[#dae2fd] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Descargar informe completo en Excel (.xlsx)"
          >
            <span className="material-symbols-outlined text-[17px] text-[#4edea3]">table_view</span>
            Exportar Excel
          </button>

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

      {/* ALERTAS DE ARRENDAMIENTOS */}
      <section className="bg-[#131b2e] rounded-2xl border border-[#ffb95f]/30 overflow-hidden shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between border-b border-[#222a3d]">
          <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[#ffb95f]">notifications_active</span><div><h2 className="text-sm font-extrabold text-white">Alertas de Arrendamientos</h2><p className="text-[10px] text-[#94a3b8]">Cambios detectados al actualizar contratos y archivos.</p></div></div>
          <span className="px-2 py-1 rounded-full bg-[#ffb95f]/15 text-[#ffb95f] text-[10px] font-bold">{alerts.length} alerta{alerts.length === 1 ? '' : 's'}</span>
        </div>
        {alerts.length === 0 ? <div className="px-4 py-5 text-xs text-[#94a3b8] flex items-center gap-2"><span className="material-symbols-outlined text-[17px] text-[#4edea3]">check_circle</span>No hay alertas generadas por actualizaciones de arrendamientos.</div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 p-3">{alerts.slice(0,6).map((alert) => <button key={alert.id} type="button" onClick={() => { const target=leasePoints.find(p=>p.code.toLowerCase()===alert.code.toLowerCase()); if(target) handleOpenDetails(target); }} className="text-left p-3 rounded-xl bg-[#171f33] border border-[#2d3449] hover:border-[#0088ff]/50 hover:bg-[#1b2540] transition-all cursor-pointer"><div className="flex items-start gap-2"><span className={`material-symbols-outlined text-[18px] ${alert.severity==='urgent'?'text-[#ff6b6b]':alert.severity==='warning'?'text-[#ffb95f]':'text-[#38bdf8]'}`}>{alert.type==='canon_increased'?'payments':alert.type==='point_closed'?'domain_disabled':alert.type==='point_reopened'?'domain_add':alert.type==='not_visited'?'event_busy':alert.type==='contract_expiring'?'event':'add_business'}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-white truncate">{alert.title}</p><p className="text-[10px] text-[#cbd5e1] mt-0.5 line-clamp-2">{alert.message}</p><span className="text-[9px] text-[#64748b] mt-1 block">{alert.pointName} · {new Date(alert.createdAt).toLocaleDateString('es-CO')}</span></div></div></button>)}</div>}
      </section>

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
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
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
            <button type="button" onClick={() => setStatusFilter('depurado')} className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${statusFilter === 'depurado' ? 'bg-[#a855f7]/20 text-[#c084fc] font-bold border border-[#a855f7]/40' : 'text-[#94a3b8] hover:text-[#c084fc] hover:bg-[#171f33]'}`}><span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>Depurado ({metrics.depuradoCount})</button>
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
              Con Novedad ({metrics.incidentCount})
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

      {/* VIEW 2: CARDS GRID MODE */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPoints.map(({ point: pt, status, lifecycle, contract }) => {
                const isExpanded = !!expandedSchedules[pt.id];
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${pt.lat},${pt.lng}`;

                return (
                  <div
                    key={pt.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenDetails(pt)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenDetails(pt); }}
                    className={`bg-[#131b2e] rounded-2xl border transition-all shadow-md flex flex-col justify-between overflow-hidden cursor-pointer hover:-translate-y-0.5 ${lifecycle.lifecycleStatus === 'inactive' ? 'border-[#ef4444]/50 opacity-90' : 'border-[#222a3d] hover:border-[#38bdf8]/40'}`}
                  >
                    {/* Real-time Status Header Bar */}
                    <div
                      className={`px-4 py-2.5 flex items-center justify-between border-b ${
                        status.isOpenNow
                          ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#4edea3]'
                          : pt.operatingStatus === 'temporarily_closed' || pt.operatingStatus === 'maintenance'
                          ? 'bg-[#ffb95f]/10 border-[#ffb95f]/30 text-[#ffb95f]'
                          : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          {status.isOpenNow && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                          )}
                          <span
                            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                              status.isOpenNow
                                ? 'bg-[#10b981]'
                                : pt.operatingStatus === 'temporarily_closed' || pt.operatingStatus === 'maintenance'
                                ? 'bg-[#f59e0b]'
                                : 'bg-[#ef4444]'
                            }`}
                          ></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {status.statusBadgeText}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold opacity-90 truncate max-w-[160px]">
                        {lifecycle.lifecycleStatus === 'inactive' ? `INACTIVO · ${lifecycle.inactivityLabel}` : status.timeContext}
                      </span>
                    </div>

                    {/* Main Card Content */}
                    <div className="p-4 space-y-3.5 flex-1">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#171f33] text-[#38bdf8] border border-[#2d3449]">
                            {pt.code}
                          </span>
                          <span className="text-[10px] font-semibold text-[#94a3b8] px-2 py-0.5 rounded bg-[#0b1326]">
                            {pt.propertyType}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                          {pt.name}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${lifecycle.lifecycleStatus === 'active' ? 'bg-[#10b981]/10 text-[#4edea3] border-[#10b981]/30' : 'bg-[#ef4444]/10 text-[#ffb4ab] border-[#ef4444]/30'}`}>
                            {lifecycle.lifecycleStatus === 'active' ? '● ACTIVO' : '● INACTIVO'}
                          </span>
                          {lifecycle.lifecycleStatus === 'inactive' && <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#ef4444]/10 text-[#ffb4ab] border border-[#ef4444]/20">{lifecycle.inactivityLabel}</span>}
                          {pt.salesSummary?.daysWithoutSale !== undefined && pt.salesSummary.daysWithoutSale >= 60 && lifecycle.lifecycleStatus !== 'inactive' && <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${pt.salesSummary.daysWithoutSale >= 90 ? 'bg-[#ef4444]/10 text-[#ffb4ab] border-[#ef4444]/20' : 'bg-[#ffb95f]/10 text-[#ffb95f] border-[#ffb95f]/20'}`}>SIN VENTAS · {pt.salesSummary.daysWithoutSale} DÍAS</span>}
                        </div>
                      </div>

                      {/* HORARIOS DESTACADOS */}
                      <div className="p-3 bg-[#0b1326] rounded-xl border border-[#222a3d] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#94a3b8] flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[15px] text-[#ffb95f]">
                              schedule
                            </span>
                            Horario Hoy ({status.dayName}):
                          </span>
                          <span className="font-bold text-white font-mono">
                            {status.todayHours.isOpen
                              ? `${status.todayHours.open} - ${status.todayHours.close}`
                              : 'Cerrado'}
                          </span>
                        </div>

                        {status.todayHours.hasLunchBreak && status.todayHours.isOpen && (
                          <div className="text-[10px] text-[#94a3b8] flex items-center justify-between">
                            <span>Receso Almuerzo:</span>
                            <span className="text-[#ffb95f]">
                              {status.todayHours.lunchStart} - {status.todayHours.lunchEnd}
                            </span>
                          </div>
                        )}

                        {isExpanded && (
                          <div className="pt-2 border-t border-[#222a3d] space-y-1 text-[11px] text-[#cbd5e1] animate-in fade-in">
                            <div className="flex justify-between">
                              <span className="text-[#94a3b8]">Lunes a Viernes:</span>
                              <span className="font-mono text-white">
                                {pt.schedule.monday.open} - {pt.schedule.monday.close}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#94a3b8]">Sábado:</span>
                              <span className="font-mono text-white">
                                {pt.schedule.saturday.isOpen
                                  ? `${pt.schedule.saturday.open} - ${pt.schedule.saturday.close}`
                                  : 'Cerrado'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#94a3b8]">Domingo:</span>
                              <span className="font-mono text-white">
                                {pt.schedule.sunday.isOpen
                                  ? `${pt.schedule.sunday.open} - ${pt.schedule.sunday.close}`
                                  : 'Cerrado'}
                              </span>
                            </div>
                            {pt.schedule.holidayNote && (
                              <div className="text-[10px] text-[#94a3b8] italic pt-1 border-t border-[#222a3d]">
                                * {pt.schedule.holidayNote}
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleScheduleExpand(pt.id); }}
                          className="w-full text-center text-[10px] font-bold text-[#0088ff] hover:underline pt-0.5 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? 'Ocultar horarios de la semana' : 'Ver todos los horarios semanales'}
                          <span className="material-symbols-outlined text-[13px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      </div>

                      {/* UBICACIÓN */}
                      <div className="text-xs space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1 text-[#cbd5e1]">
                            <span className="material-symbols-outlined text-[16px] text-[#38bdf8] shrink-0 mt-0.5">
                              location_on
                            </span>
                            <div>
                              <span className="font-bold text-white">{pt.address}</span>
                              <p className="text-[11px] text-[#94a3b8]">
                                {pt.neighborhood} · <strong className="text-[#cbd5e1]">{pt.municipality}</strong>
                              </p>
                            </div>
                          </div>
                          <a
                            href={mapsUrl}
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#38bdf8] transition-colors shrink-0 cursor-pointer"
                            title="Abrir ubicación en CAVIMAPS / GPS"
                          >
                            <span className="material-symbols-outlined text-[16px]">navigation</span>
                          </a>
                        </div>
                        {pt.reference && (
                          <p className="text-[11px] text-[#94a3b8] pl-5 italic line-clamp-1">
                            Ref: {pt.reference}
                          </p>
                        )}
                      </div>

                      {/* CONTRATO & ARRENDADOR */}
                      <div className="pt-2 border-t border-[#222a3d] flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-[#94a3b8] block uppercase">Canon Mensual</span>
                          <span className="font-mono font-bold text-[#4edea3] text-sm">
                            {formatCOP(pt.monthlyRent)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#94a3b8] block uppercase">Vigencia</span>
                          <span
                            className={`text-[11px] font-bold ${
                              contract.status === 'valid'
                                ? 'text-[#4edea3]'
                                : contract.status === 'expiring_soon'
                                ? 'text-[#ffb95f]'
                                : 'text-[#ffb4ab]'
                            }`}
                          >
                            {contract.label}
                          </span>
                        </div>
                      </div>

                      {/* ARRENDADOR QUICK CONTACT */}
                      <div className="p-2 bg-[#171f33] rounded-xl border border-[#2d3449] flex items-center justify-between text-[11px]">
                        <div className="min-w-0 pr-2">
                          <span className="text-[#94a3b8] block text-[9px] uppercase">Arrendador</span>
                          <span className="font-bold text-white truncate block">{pt.landlord.name}</span>
                        </div>
                        {pt.landlord.phone && (
                          <a
                            onClick={(e) => e.stopPropagation()}
                            href={`tel:${pt.landlord.phone}`}
                            className="px-2 py-1 rounded-lg bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#4edea3] font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                            title={`Llamar a ${pt.landlord.phone}`}
                          >
                            <span className="material-symbols-outlined text-[13px]">call</span>
                            Llamar
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="px-4 py-2.5 bg-[#0b1326] border-t border-[#222a3d] flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleOpenIncident(pt); }}
                          className="p-1.5 rounded-lg text-[#ffb4ab] hover:bg-[#ffb4ab]/15 transition-colors cursor-pointer"
                          title="Registrar novedad de cierre o cambio de horario"
                        >
                          <span className="material-symbols-outlined text-[18px]">warning</span>
                        </button>
                        {userRole === 'administrador' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(pt); }}
                            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#171f33] transition-colors cursor-pointer"
                            title="Editar datos del punto"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        )}
                        {userRole === 'administrador' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDelete(pt); }}
                            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors cursor-pointer"
                            title="Eliminar punto de arrendamiento"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleOpenDetails(pt); }}
                        className="px-3 py-1.5 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        Ver Ficha
                      </button>
                    </div>
                  </div>
                );
              })}
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
