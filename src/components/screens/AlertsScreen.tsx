import React, { useMemo, useState } from 'react';
import { LeasePoint } from '../../types';
import { LeaseDataAlert, exportReconciliationReportToExcel } from '../../utils/dataReconciliation';
import { formatCOP } from '../../data/leasePointsData';

interface AlertsScreenProps {
  alerts: LeaseDataAlert[];
  leasePoints: LeasePoint[];
  onRunCrossReconciliation?: () => void;
  onGoToLeases?: (code?: string) => void;
  onAssignToRoute?: (code: string, pointName: string) => void;
}

export const ALERT_TYPE_LABELS: Record<LeaseDataAlert['type'], string> = {
  active_lease_no_sales: 'Arriendo activo sin ventas',
  active_lease_closed_point: 'Canon en punto cerrado',
  no_sales_unvisited: 'Sin venta y sin auditor',
  sales_in_inactive_point: 'Ventas en punto inactivo',
  network_status_discrepancy: 'Discrepancia Red Activa vs Inactiva',
  audit_closed_network_active: 'Cerrado en terreno / Activo en red',
  active_unmapped: 'Sin coordenadas TXT / GPS',
  canon_increased: 'Incremento de canon',
  point_closed: 'Punto cerrado / depurado',
  point_reopened: 'Punto reactivado',
  not_visited: 'Punto no visitado (>60 días)',
  contract_expiring: 'Contrato por vencer',
  new_point: 'Nuevo punto incorporado',
  sales_inactivity: 'Sin ventas prolongadas',
};

export const ALERT_TYPE_ICONS: Record<LeaseDataAlert['type'], string> = {
  active_lease_no_sales: 'money_off',
  active_lease_closed_point: 'report_problem',
  no_sales_unvisited: 'person_off',
  sales_in_inactive_point: 'receipt_long',
  network_status_discrepancy: 'compare_arrows',
  audit_closed_network_active: 'storefront',
  active_unmapped: 'wrong_location',
  canon_increased: 'payments',
  point_closed: 'domain_disabled',
  point_reopened: 'domain_add',
  not_visited: 'event_busy',
  contract_expiring: 'event',
  new_point: 'add_business',
  sales_inactivity: 'trending_down',
};

export const AlertsScreen: React.FC<AlertsScreenProps> = ({
  alerts,
  leasePoints,
  onRunCrossReconciliation,
  onGoToLeases,
  onAssignToRoute,
}) => {
  const [severity, setSeverity] = useState<'all' | 'urgent' | 'warning' | 'info'>('all');
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string>('all');
  const [type, setType] = useState<'all' | LeaseDataAlert['type']>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Filter alerts by search, severity, specific type, and category group
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alerts.filter((a) => {
      if (severity !== 'all' && a.severity !== severity) return false;
      if (type !== 'all' && a.type !== type) return false;

      if (selectedCategoryGroup !== 'all') {
        if (selectedCategoryGroup === 'rent_no_sales' && a.type !== 'active_lease_no_sales') return false;
        if (selectedCategoryGroup === 'rent_closed' && a.type !== 'active_lease_closed_point') return false;
        if (selectedCategoryGroup === 'unvisited' && a.type !== 'no_sales_unvisited' && a.type !== 'not_visited') return false;
        if (selectedCategoryGroup === 'network' && a.type !== 'network_status_discrepancy' && a.type !== 'audit_closed_network_active' && a.type !== 'sales_in_inactive_point') return false;
        if (selectedCategoryGroup === 'contracts' && a.type !== 'contract_expiring' && a.type !== 'canon_increased') return false;
      }

      if (!q) return true;
      const haystack = [
        a.code,
        a.pointName,
        a.title,
        a.message,
        a.municipality,
        ALERT_TYPE_LABELS[a.type],
        a.recommendedAction,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [alerts, severity, type, selectedCategoryGroup, search]);

  // Aggregate executive metrics
  const metrics = useMemo(() => {
    const total = alerts.length;
    const urgent = alerts.filter((a) => a.severity === 'urgent').length;
    const warning = alerts.filter((a) => a.severity === 'warning').length;
    const info = alerts.filter((a) => a.severity === 'info').length;
    const totalFinancialRisk = alerts.reduce((acc, a) => acc + (a.financialRiskAmount || 0), 0);
    const rentNoSalesCount = alerts.filter((a) => a.type === 'active_lease_no_sales').length;
    const rentClosedCount = alerts.filter((a) => a.type === 'active_lease_closed_point').length;
    const unvisitedCount = alerts.filter((a) => a.type === 'no_sales_unvisited' || a.type === 'not_visited').length;

    return {
      total,
      urgent,
      warning,
      info,
      totalFinancialRisk,
      rentNoSalesCount,
      rentClosedCount,
      unvisitedCount,
    };
  }, [alerts]);

  const handleExport = () => {
    exportReconciliationReportToExcel(filtered.length > 0 ? filtered : alerts, leasePoints);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 text-slate-900 dark:text-[#dae2fd]">
      {/* ========================================================================= */}
      {/*  EXECUTIVE HEADER & TACTICAL ACTIONS                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#222a3d] shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0088ff] to-[#0055b3] text-white flex items-center justify-center shadow-md shadow-[#0088ff]/20 shrink-0">
            <span className="material-symbols-outlined text-2xl">compare_arrows</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black font-headline text-slate-900 dark:text-white tracking-tight">
                Centro de Alertas & Cruce de Datos
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0088ff]/10 text-[#0088ff] border border-[#0088ff]/25">
                Inteligencia CAVI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5">
              Cruce automatizado entre Arrendamientos, Ventas, Red Activa/Inactiva, Reportes TXT y Visitas de Auditoría.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onRunCrossReconciliation && (
            <button
              type="button"
              onClick={onRunCrossReconciliation}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#1f293d] dark:hover:bg-[#27354d] text-slate-800 dark:text-[#dae2fd] border border-slate-200 dark:border-[#2d3b55] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Volver a analizar todos los archivos cargados"
            >
              <span className="material-symbols-outlined text-[17px] text-[#0088ff]">sync</span>
              Re-ejecutar Cruce
            </button>
          )}

          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#10b981] hover:bg-[#059669] text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-[#10b981]/20"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            Exportar Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/*  KPI CARDS & FINANCIAL RISK METRICS                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#222a3d] shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-[#94a3b8] block">
            Total Alertas
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black font-headline text-slate-900 dark:text-white">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-400">criterios</span>
          </div>
        </div>

        {/* Urgentes */}
        <div className="p-3.5 rounded-2xl bg-red-50/60 dark:bg-[#ef4444]/10 border border-red-200 dark:border-[#ef4444]/30 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 dark:text-red-400 block">
            Acción Inmediata
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black font-headline text-red-600 dark:text-red-400">
              {metrics.urgent}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-300">
              URGENTE
            </span>
          </div>
        </div>

        {/* Advertencias */}
        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-[#f59e0b]/10 border border-amber-200 dark:border-[#f59e0b]/30 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 block">
            Advertencias
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black font-headline text-amber-700 dark:text-amber-400">
              {metrics.warning}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
              PREVENTIVAS
            </span>
          </div>
        </div>

        {/* Cánones en Riesgo / Fuga Financiera */}
        <div className="col-span-2 lg:col-span-2 p-3.5 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/5 dark:from-red-950/30 dark:to-amber-950/20 border border-red-300 dark:border-red-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-700 dark:text-red-300 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">savings</span>
              Fuga Financiera / Cánones Comprometidos
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
              Impacto Mensual
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-red-600 dark:text-red-400">
              {formatCOP(metrics.totalFinancialRisk)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">/ mes en riesgo</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {metrics.rentClosedCount} punto(s) cerrado(s) pagando canon · {metrics.rentNoSalesCount} arriendo(s) activo(s) sin ventas.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/*  QUICK CATEGORY TABS (Cruces Principales)                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-[#0d1528] border border-slate-200 dark:border-[#222a3d]">
        <button
          type="button"
          onClick={() => {
            setSelectedCategoryGroup('all');
            setType('all');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCategoryGroup === 'all' && type === 'all'
              ? 'bg-white dark:bg-[#0088ff] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Todas ({alerts.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategoryGroup('rent_closed');
            setType('active_lease_closed_point');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedCategoryGroup === 'rent_closed'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">report_problem</span>
          Canon en Punto Cerrado ({metrics.rentClosedCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategoryGroup('rent_no_sales');
            setType('active_lease_no_sales');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedCategoryGroup === 'rent_no_sales'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">money_off</span>
          Arriendo Sin Ventas ({metrics.rentNoSalesCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategoryGroup('unvisited');
            setType('all');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedCategoryGroup === 'unvisited'
              ? 'bg-[#0088ff] text-white shadow-xs'
              : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">person_off</span>
          Sin Venta y Sin Auditor ({metrics.unvisitedCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategoryGroup('network');
            setType('all');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedCategoryGroup === 'network'
              ? 'bg-[#0088ff] text-white shadow-xs'
              : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">compare_arrows</span>
          Discrepancias de Red
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategoryGroup('contracts');
            setType('all');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedCategoryGroup === 'contracts'
              ? 'bg-[#0088ff] text-white shadow-xs'
              : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">event</span>
          Vencimiento de Contratos
        </button>
      </div>

      {/* ========================================================================= */}
      {/*  SEARCH & DETAILED FILTERS CONTAINER                                      */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border bg-white dark:bg-[#0d1528] border-slate-200 dark:border-[#222a3d] overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 dark:border-[#222a3d] grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2.5">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código PDV, nombre, municipio, canon, anomalía..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-[#0088ff] bg-white dark:bg-[#131b2e] border-slate-300 dark:border-[#2d3449] text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as typeof severity)}
            className="px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-[#0088ff] cursor-pointer bg-white dark:bg-[#131b2e] border-slate-300 dark:border-[#2d3449] text-slate-900 dark:text-white"
          >
            <option value="all">Todas las severidades</option>
            <option value="urgent">🔴 Urgentes (Acción inmediata)</option>
            <option value="warning">🟡 Advertencias</option>
            <option value="info">🔵 Informativas</option>
          </select>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as typeof type);
              setSelectedCategoryGroup('all');
            }}
            className="px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-[#0088ff] cursor-pointer bg-white dark:bg-[#131b2e] border-slate-300 dark:border-[#2d3449] text-slate-900 dark:text-white"
          >
            <option value="all">Todos los tipos de cruce ({alerts.length})</option>
            {(Object.keys(ALERT_TYPE_LABELS) as LeaseDataAlert['type'][]).map((k) => (
              <option key={k} value={k}>
                {ALERT_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        {/* ========================================================================= */}
        {/*  ALERTS LIST                                                              */}
        {/* ========================================================================= */}
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-[#10b981] flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-3xl">task_alt</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              No se detectaron novedades para los filtros seleccionados
            </p>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1 max-w-md mx-auto">
              Cuando subas nuevos archivos de ventas, arrendamientos, red activa/inactiva o reportes TXT, CAVI los cruzará automáticamente aquí.
            </p>
          </div>
        ) : (
          <div className="p-3.5 space-y-3">
            {filtered.map((a) => {
              const isExpanded = expandedId === a.id;
              const relatedPoint = leasePoints.find(
                (p) => p.code.toLowerCase() === a.code.toLowerCase()
              );
              const red = a.severity === 'urgent';
              const orange = a.severity === 'warning';
              const mapsUrl =
                relatedPoint && relatedPoint.lat && relatedPoint.lng
                  ? `https://www.google.com/maps/search/?api=1&query=${relatedPoint.lat},${relatedPoint.lng}`
                  : null;

              return (
                <div
                  key={a.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                    isExpanded
                      ? red
                        ? 'border-red-500/60 bg-red-500/[0.04] ring-1 ring-red-500/30'
                        : orange
                        ? 'border-amber-500/60 bg-amber-500/[0.04] ring-1 ring-amber-500/30'
                        : 'border-[#0088ff]/60 bg-[#0088ff]/[0.04] ring-1 ring-[#0088ff]/30'
                      : red
                      ? 'border-red-300/80 dark:border-red-500/30 bg-red-50/20 dark:bg-red-500/[0.02] hover:border-red-400'
                      : orange
                      ? 'border-amber-300/80 dark:border-amber-500/30 bg-amber-50/20 dark:bg-amber-500/[0.02] hover:border-amber-400'
                      : 'border-slate-200 dark:border-[#222a3d] bg-white dark:bg-[#131b2e] hover:border-[#0088ff]/50'
                  }`}
                >
                  {/* Clickable Card Header */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleExpand(a.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') toggleExpand(a.id);
                    }}
                    className="w-full text-left p-3.5 sm:p-4 flex items-start sm:items-center gap-3.5 cursor-pointer select-none transition-colors"
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                        red
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                          : orange
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-[#0088ff]/15 text-[#0088ff] border border-[#0088ff]/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {ALERT_TYPE_ICONS[a.type] || 'warning'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                          {a.title}
                        </span>

                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-[#222a3d] text-slate-700 dark:text-[#cbd5e1]">
                          {ALERT_TYPE_LABELS[a.type] || a.type}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            red
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25'
                              : orange
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25'
                              : 'bg-[#0088ff]/15 text-[#0088ff] border border-[#0088ff]/25'
                          }`}
                        >
                          {red ? 'URGENTE' : orange ? 'ADVERTENCIA' : 'INFORMATIVA'}
                        </span>

                        {a.financialRiskAmount && a.financialRiskAmount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-red-600 text-white">
                            {formatCOP(a.financialRiskAmount)} / mes en riesgo
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs mt-1 leading-snug ${
                          isExpanded ? 'font-semibold' : 'truncate'
                        } text-slate-600 dark:text-[#cbd5e1]`}
                      >
                        {a.message}
                      </p>

                      <div className="mt-1.5 text-[10px] flex flex-wrap gap-x-2.5 gap-y-1 items-center text-slate-400 dark:text-[#94a3b8]">
                        <span className="font-mono font-bold text-[#0088ff] px-1.5 py-0.5 rounded bg-[#0088ff]/10">
                          {a.code}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {a.pointName}
                        </span>
                        {a.municipality && (
                          <>
                            <span>·</span>
                            <span className="font-medium text-slate-500 dark:text-slate-400">
                              {a.municipality}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span>{new Date(a.createdAt).toLocaleDateString('es-CO')}</span>
                      </div>
                    </div>

                    {/* Chevron toggle button */}
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5">
                      <span
                        className={`material-symbols-outlined transition-transform duration-200 text-[20px] ${
                          isExpanded ? 'rotate-90 text-[#0088ff]' : 'text-slate-400'
                        }`}
                      >
                        chevron_right
                      </span>
                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/*  DESPLEGABLE / EXPANDED TECHNICAL AUDIT SHEET                            */}
                  {/* ========================================================================= */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-200 dark:border-[#222a3d] bg-slate-50/70 dark:bg-[#0b1326]/60 space-y-3.5 animate-in fade-in duration-200">
                      {/* Diagnóstico de Inteligencia CAVI */}
                      <div className="p-3.5 rounded-xl border bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#222a3d]">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold text-[#0088ff]">
                          <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                          <span>Diagnóstico y Cruce de Inteligencia CAVI</span>
                        </div>
                        <p className="text-xs sm:text-[13px] mt-1.5 leading-relaxed font-medium text-slate-900 dark:text-[#f1f5f9]">
                          {a.message}
                        </p>
                      </div>

                      {/* Acción Táctica Recomendada */}
                      {a.recommendedAction && (
                        <div className="p-3 rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px] shrink-0 mt-0.5">
                            verified
                          </span>
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-800 dark:text-emerald-300 block">
                              Acción Recomendada
                            </span>
                            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 mt-0.5">
                              {a.recommendedAction}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Matriz de Cruce de Datos Reconciliados */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl border bg-white dark:bg-[#171f33] border-slate-200 dark:border-[#222a3d]">
                          <span className="text-[8px] uppercase tracking-wider block font-semibold text-slate-400">
                            Canon Mensual
                          </span>
                          <b className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {a.monthlyRent ? formatCOP(a.monthlyRent) : relatedPoint?.monthlyRent ? formatCOP(relatedPoint.monthlyRent) : 'Sin canon'}
                          </b>
                        </div>

                        <div className="p-2.5 rounded-xl border bg-white dark:bg-[#171f33] border-slate-200 dark:border-[#222a3d]">
                          <span className="text-[8px] uppercase tracking-wider block font-semibold text-slate-400">
                            Días Sin Ventas
                          </span>
                          <b
                            className={`text-xs font-bold ${
                              (a.daysWithoutSale ?? relatedPoint?.salesSummary?.daysWithoutSale ?? 0) >= 30
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {a.daysWithoutSale ?? relatedPoint?.salesSummary?.daysWithoutSale ?? 'N/D'} días
                          </b>
                        </div>

                        <div className="p-2.5 rounded-xl border bg-white dark:bg-[#171f33] border-slate-200 dark:border-[#222a3d]">
                          <span className="text-[8px] uppercase tracking-wider block font-semibold text-slate-400">
                            Última Auditoría
                          </span>
                          <b className="text-[11px] block font-mono text-slate-800 dark:text-slate-200">
                            {a.lastAuditDate || relatedPoint?.lastAuditDate || 'Sin visita'}
                          </b>
                        </div>

                        <div className="p-2.5 rounded-xl border bg-white dark:bg-[#171f33] border-slate-200 dark:border-[#222a3d]">
                          <span className="text-[8px] uppercase tracking-wider block font-semibold text-slate-400">
                            Estado en Red
                          </span>
                          <b
                            className={`text-xs font-bold ${
                              a.networkStatus === 'inactiva' || relatedPoint?.lifecycleStatus === 'inactive'
                                ? 'text-red-600'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {a.networkStatus === 'inactiva' || relatedPoint?.lifecycleStatus === 'inactive'
                              ? '🔴 Red Inactiva'
                              : '🟢 Red Activa'}
                          </b>
                        </div>
                      </div>

                      {/* Ficha de Arrendamiento Relacionado */}
                      {relatedPoint && (
                        <div className="p-3.5 rounded-xl border bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#222a3d] space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-slate-500 dark:text-[#94a3b8]">
                              <span className="material-symbols-outlined text-[16px] text-[#0088ff]">
                                storefront
                              </span>
                              Datos del Inmueble y Contrato
                            </span>

                            {mapsUrl && (
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-[#0088ff] hover:bg-[#0070d8] text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                              >
                                <span className="material-symbols-outlined text-[13px]">near_me</span>
                                Navegar GPS
                              </a>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                            <div>
                              <span className="text-[9px] uppercase block text-slate-400">Ubicación</span>
                              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                                {relatedPoint.address || 'Sin dirección registrada'}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {relatedPoint.neighborhood} · {relatedPoint.municipality}
                              </p>
                            </div>

                            <div>
                              <span className="text-[9px] uppercase block text-slate-400">
                                Canon & Contrato
                              </span>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {formatCOP(relatedPoint.monthlyRent)} / mes
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Contrato #{relatedPoint.contractNumber || 'N/D'} · Vigente hasta{' '}
                                {relatedPoint.contractEndDate || 'Sin fecha fin'}
                              </p>
                            </div>

                            <div>
                              <span className="text-[9px] uppercase block text-slate-400">
                                Arrendador / Contacto
                              </span>
                              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                                {relatedPoint.landlord?.name || 'Sin registro'}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {relatedPoint.landlord?.phone || 'Tel: N/D'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Direct Operational Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-[#222a3d]">
                        <div className="flex flex-wrap gap-2">
                          {onAssignToRoute && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignToRoute(a.code, a.pointName);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0088ff] hover:bg-[#0070d8] text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[15px]">alt_route</span>
                              Programar Auditoría Prioritaria
                            </button>
                          )}

                          {onGoToLeases && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onGoToLeases(a.code);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#1e273a] dark:hover:bg-[#28354f] text-slate-800 dark:text-[#dae2fd] border border-slate-200 dark:border-[#2d3a54] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">real_estate_agent</span>
                              Ver en Arrendamientos
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(a.id);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-[#94a3b8] dark:hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">expand_less</span>
                          Contraer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
