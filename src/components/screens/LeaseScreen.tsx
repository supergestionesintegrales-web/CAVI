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

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<LeasePoint | null>(null);

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentPoint, setIncidentPoint] = useState<LeasePoint | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsPoint, setDetailsPoint] = useState<LeasePoint | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<LeaseDataAlert | null>(null);
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<'all' | 'urgent' | 'warning' | 'info'>('all');
  const [alertTypeFilter, setAlertTypeFilter] = useState<'all' | LeaseDataAlert['type']>('all');
  const [alertSearch, setAlertSearch] = useState('');

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


  const alertTypeLabels: Record<LeaseDataAlert['type'], string> = {
    canon_increased: 'Incremento de canon',
    point_closed: 'Punto cerrado / depurado',
    point_reopened: 'Punto reactivado',
    not_visited: 'Punto no visitado',
    contract_expiring: 'Contrato por vencer',
    new_point: 'Nuevo punto',
    sales_inactivity: 'Sin ventas prolongadas',
  };

  const alertTypeIcons: Record<LeaseDataAlert['type'], string> = {
    canon_increased: 'payments',
    point_closed: 'domain_disabled',
    point_reopened: 'domain_add',
    not_visited: 'event_busy',
    contract_expiring: 'event',
    new_point: 'add_business',
    sales_inactivity: 'trending_down',
  };

  const filteredAlerts = useMemo(() => {
    const query = alertSearch.trim().toLowerCase();
    return alerts.filter((alert) => {
      if (alertSeverityFilter !== 'all' && alert.severity !== alertSeverityFilter) return false;
      if (alertTypeFilter !== 'all' && alert.type !== alertTypeFilter) return false;
      if (!query) return true;
      return [alert.code, alert.pointName, alert.title, alert.message, alertTypeLabels[alert.type]]
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [alerts, alertSeverityFilter, alertTypeFilter, alertSearch]);

  const alertMetrics = useMemo(() => ({
    total: alerts.length,
    urgent: alerts.filter(a => a.severity === 'urgent').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  }), [alerts]);

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

      {/* SECCIÓN EXCLUSIVA DE ALERTAS */}
      <section className="bg-[#0d1528] rounded-2xl border border-[#ffb95f]/30 overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-[#222a3d]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#ffb95f]/10 border border-[#ffb95f]/25 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ffb95f]">notifications_active</span>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white">Centro de Alertas</h2>
                <p className="text-[10px] text-[#94a3b8]">
                  Todas las novedades detectadas en contratos, ventas, visitas y estado de los puntos.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-1 rounded-full bg-[#ff6b6b]/10 text-[#ff8b8b] border border-[#ff6b6b]/20">Urgentes {alertMetrics.urgent}</span>
              <span className="px-2 py-1 rounded-full bg-[#ffb95f]/10 text-[#ffb95f] border border-[#ffb95f]/20">Advertencias {alertMetrics.warning}</span>
              <span className="px-2 py-1 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">Informativas {alertMetrics.info}</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-[17px]">search</span>
              <input
                type="text"
                value={alertSearch}
                onChange={(e) => setAlertSearch(e.target.value)}
                placeholder="Buscar alerta por punto, código, tipo o detalle..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3449] text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#ffb95f]"
              />
            </div>
            <select
              value={alertSeverityFilter}
              onChange={(e) => setAlertSeverityFilter(e.target.value as typeof alertSeverityFilter)}
              className="px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3449] text-xs text-white focus:outline-none"
            >
              <option value="all">Todas las severidades</option>
              <option value="urgent">🔴 Urgentes</option>
              <option value="warning">🟠 Advertencias</option>
              <option value="info">🔵 Informativas</option>
            </select>
            <select
              value={alertTypeFilter}
              onChange={(e) => setAlertTypeFilter(e.target.value as typeof alertTypeFilter)}
              className="px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3449] text-xs text-white focus:outline-none"
            >
              <option value="all">Todos los tipos</option>
              {(Object.keys(alertTypeLabels) as LeaseDataAlert['type'][]).map((type) => (
                <option key={type} value={type}>{alertTypeLabels[type]}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <span className="material-symbols-outlined text-[34px] text-[#4edea3]">notifications_off</span>
            <p className="text-xs font-bold text-white mt-2">No hay alertas con estos filtros</p>
            <p className="text-[10px] text-[#64748b] mt-1">
              Las alertas se generan automáticamente al actualizar la información de CAVI.
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2.5 max-h-[620px] overflow-y-auto">
            {filteredAlerts.map((alert) => {
              const target = leasePoints.find(p => p.code.toLowerCase() === alert.code.toLowerCase());
              const severityClass =
                alert.severity === 'urgent'
                  ? 'border-[#ef4444]/40 bg-[#ef4444]/[0.04]'
                  : alert.severity === 'warning'
                  ? 'border-[#f59e0b]/35 bg-[#f59e0b]/[0.035]'
                  : 'border-[#38bdf8]/25 bg-[#38bdf8]/[0.025]';
              const iconClass =
                alert.severity === 'urgent'
                  ? 'text-[#ff6b6b] bg-[#ef4444]/10'
                  : alert.severity === 'warning'
                  ? 'text-[#ffb95f] bg-[#f59e0b]/10'
                  : 'text-[#38bdf8] bg-[#38bdf8]/10';

              return (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => setSelectedAlert(alert)}
                  className={`w-full text-left p-3 rounded-xl border ${severityClass} hover:border-[#0088ff]/60 hover:bg-[#171f33] transition-all cursor-pointer`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
                      <span className="material-symbols-outlined text-[19px]">{alertTypeIcons[alert.type]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-extrabold text-white">{alert.title}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase bg-[#222a3d] text-[#cbd5e1]">
                          {alertTypeLabels[alert.type]}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                          alert.severity === 'urgent' ? 'bg-[#ef4444]/15 text-[#ff8b8b]' :
                          alert.severity === 'warning' ? 'bg-[#f59e0b]/15 text-[#ffb95f]' :
                          'bg-[#38bdf8]/15 text-[#38bdf8]'
                        }`}>
                          {alert.severity === 'urgent' ? 'Urgente' : alert.severity === 'warning' ? 'Advertencia' : 'Informativa'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#cbd5e1] mt-1 leading-relaxed">{alert.message}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-[#64748b]">
                        <span className="font-mono text-[#38bdf8]">{alert.code}</span>
                        <span>{alert.pointName}</span>
                        <span>{new Date(alert.createdAt).toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[19px] text-[#64748b] shrink-0">chevron_right</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedAlert && (
          <div className="border-t border-[#2d3449] bg-[#111a2d] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0088ff]/10 border border-[#0088ff]/25 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#38bdf8]">{alertTypeIcons[selectedAlert.type]}</span>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-[#64748b]">Detalle de alerta</p>
                  <h3 className="text-sm font-extrabold text-white">{selectedAlert.title}</h3>
                  <p className="text-[10px] text-[#94a3b8]">{alertTypeLabels[selectedAlert.type]}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedAlert(null)} className="w-7 h-7 rounded-lg bg-[#222a3d] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              <div className="p-2.5 rounded-xl bg-[#131b2e] border border-[#222a3d]">
                <span className="block text-[8px] uppercase text-[#64748b]">Código</span>
                <span className="text-[11px] font-mono font-bold text-[#38bdf8]">{selectedAlert.code}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#131b2e] border border-[#222a3d]">
                <span className="block text-[8px] uppercase text-[#64748b]">Punto</span>
                <span className="text-[11px] font-bold text-white truncate block">{selectedAlert.pointName}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#131b2e] border border-[#222a3d]">
                <span className="block text-[8px] uppercase text-[#64748b]">Severidad</span>
                <span className="text-[11px] font-bold text-[#ffb95f]">{selectedAlert.severity === 'urgent' ? 'URGENTE' : selectedAlert.severity === 'warning' ? 'ADVERTENCIA' : 'INFORMATIVA'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#131b2e] border border-[#222a3d]">
                <span className="block text-[8px] uppercase text-[#64748b]">Generada</span>
                <span className="text-[10px] font-semibold text-white">{new Date(selectedAlert.createdAt).toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="mt-2 p-3 rounded-xl bg-[#0b1326] border border-[#222a3d]">
              <span className="text-[9px] uppercase font-bold tracking-wider text-[#64748b]">Qué detectó CAVI</span>
              <p className="text-xs text-[#e2e8f0] mt-1 leading-relaxed">{selectedAlert.message}</p>
            </div>

            {target && (
              <div className="mt-2 p-3 rounded-xl bg-[#131b2e] border border-[#222a3d]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#64748b]">Punto relacionado</span>
                    <p className="text-xs font-extrabold text-white mt-0.5">{target.name}</p>
                    <p className="text-[10px] text-[#94a3b8]">{target.address} · {target.municipality}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAlert(null);
                      handleOpenDetails(target);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#0088ff] hover:bg-[#0070d8] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    Ver ficha completa
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-sm font-extrabold text-white">Puntos de arrendamiento</h2>
                  <p className="text-[10px] text-[#64748b]">Lista compacta · presiona cualquier punto para abrir la ficha completa.</p>
                </div>
                <span className="text-[10px] font-bold text-[#94a3b8]">
                  {filteredPoints.length} de {pointsWithStatus.length} puntos
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                {filteredPoints.map(({ point: pt, status, lifecycle, contract }) => {
                  const sales = pt.salesSummary;
                  const hasSalesAlert = sales?.daysWithoutSale !== undefined && sales.daysWithoutSale >= 60 && lifecycle.status !== 'inactive';
                  const hasIncident = pt.operatingStatus === 'temporarily_closed' || pt.operatingStatus === 'maintenance' || pt.incidents.some((i) => !i.resolved);
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${pt.lat},${pt.lng}`;

                  return (
                    <div
                      key={pt.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenDetails(pt)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenDetails(pt); }}
                      className={`group w-full text-left bg-[#131b2e] rounded-xl border transition-all shadow-sm hover:border-[#0088ff]/50 hover:bg-[#151f35] cursor-pointer overflow-hidden ${
                        lifecycle.status === 'inactive'
                          ? 'border-[#a855f7]/40'
                          : hasIncident
                          ? 'border-[#ffb95f]/30'
                          : 'border-[#222a3d]'
                      }`}
                    >
                      <div className="px-3.5 py-2.5 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          lifecycle.status === 'inactive'
                            ? 'bg-[#a855f7]/15 text-[#c084fc]'
                            : status.isOpenNow
                            ? 'bg-[#10b981]/15 text-[#4edea3]'
                            : hasIncident
                            ? 'bg-[#ffb95f]/15 text-[#ffb95f]'
                            : 'bg-[#ef4444]/15 text-[#ffb4ab]'
                        }`}>
                          <span className="material-symbols-outlined text-[19px]">
                            {lifecycle.status === 'inactive' ? 'inventory_2' : status.isOpenNow ? 'storefront' : 'storefront'}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0b1326] text-[#38bdf8] border border-[#2d3449]">
                              {pt.code}
                            </span>
                            <span className="text-[10px] font-semibold text-[#94a3b8]">{pt.propertyType}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                              lifecycle.status === 'inactive'
                                ? 'bg-[#a855f7]/10 text-[#c084fc] border-[#a855f7]/30'
                                : 'bg-[#10b981]/10 text-[#4edea3] border-[#10b981]/30'
                            }`}>
                              {lifecycle.status === 'inactive' ? 'DEPURADO' : 'ACTIVO'}
                            </span>
                            {hasIncident && lifecycle.status !== 'inactive' && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#ffb95f]/10 text-[#ffb95f] border border-[#ffb95f]/25">
                                NOVEDAD
                              </span>
                            )}
                            {hasSalesAlert && (
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                sales!.daysWithoutSale! >= 90
                                  ? 'bg-[#ef4444]/10 text-[#ffb4ab] border-[#ef4444]/25'
                                  : 'bg-[#ffb95f]/10 text-[#ffb95f] border-[#ffb95f]/25'
                              }`}>
                                SIN VENTAS · {sales!.daysWithoutSale} DÍAS
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <h3 className="text-xs sm:text-[13px] font-extrabold text-white truncate">{pt.name}</h3>
                            <span className="text-[10px] text-[#64748b] shrink-0">· {status.statusBadgeText}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#94a3b8] truncate">
                            <span className="material-symbols-outlined text-[13px] text-[#38bdf8]">location_on</span>
                            <span className="truncate">{pt.address} · {pt.neighborhood} · {pt.municipality}</span>
                          </div>
                        </div>

                        <div className="hidden sm:grid grid-cols-3 gap-3 shrink-0 text-right min-w-[250px]">
                          <div>
                            <span className="block text-[8px] uppercase text-[#64748b]">Canon</span>
                            <span className="text-[11px] font-bold font-mono text-[#4edea3]">{formatCOP(pt.monthlyRent)}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase text-[#64748b]">Vigencia</span>
                            <span className={`text-[10px] font-bold ${
                              contract.status === 'valid' ? 'text-[#4edea3]' : contract.status === 'expiring_soon' ? 'text-[#ffb95f]' : 'text-[#ffb4ab]'
                            }`}>{contract.label}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase text-[#64748b]">Última venta</span>
                            <span className="text-[10px] font-semibold text-white">{sales?.lastSaleDate || 'Sin registro'}</span>
                          </div>
                        </div>

                        <span className="material-symbols-outlined text-[20px] text-[#64748b] group-hover:text-[#38bdf8] shrink-0">chevron_right</span>
                      </div>

                      <div className="px-3.5 py-2 bg-[#0b1326] border-t border-[#222a3d] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-[9px] text-[#64748b]">
                          <span>{pt.landlord.name}</span>
                          <span>·</span>
                          <span>Contrato {pt.contractNumber || 'N/D'}</span>
                          {pt.reference && <><span>·</span><span className="truncate max-w-[260px]">{pt.reference}</span></>}
                        </div>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[9px] font-bold text-[#38bdf8] hover:text-white flex items-center gap-1 shrink-0"
                        >
                          <span className="material-symbols-outlined text-[13px]">navigation</span>
                          GPS
                        </a>
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
