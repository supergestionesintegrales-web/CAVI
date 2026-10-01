import React, { useMemo, useState } from 'react';
import { LeasePoint } from '../../types';
import { LeaseDataAlert } from '../../utils/dataReconciliation';
import { formatCOP } from '../../data/leasePointsData';

interface AlertsScreenProps {
  alerts: LeaseDataAlert[];
  leasePoints: LeasePoint[];
  theme?: 'dark' | 'light';
}

const TYPE_LABELS: Record<LeaseDataAlert['type'], string> = {
  canon_increased: 'Incremento de canon',
  point_closed: 'Punto cerrado / depurado',
  point_reopened: 'Punto reactivado',
  not_visited: 'Punto no visitado',
  contract_expiring: 'Contrato por vencer',
  new_point: 'Nuevo punto',
  sales_inactivity: 'Sin ventas prolongadas',
};

const TYPE_ICONS: Record<LeaseDataAlert['type'], string> = {
  canon_increased: 'payments',
  point_closed: 'domain_disabled',
  point_reopened: 'domain_add',
  not_visited: 'event_busy',
  contract_expiring: 'event',
  new_point: 'add_business',
  sales_inactivity: 'trending_down',
};

export const AlertsScreen: React.FC<AlertsScreenProps> = ({ alerts, leasePoints, theme = 'dark' }) => {
  const light = theme === 'light';
  const [severity, setSeverity] = useState<'all' | 'urgent' | 'warning' | 'info'>('all');
  const [type, setType] = useState<'all' | LeaseDataAlert['type']>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alerts.filter((a) =>
      (severity === 'all' || a.severity === severity) &&
      (type === 'all' || a.type === type) &&
      (!q || [a.code, a.pointName, a.title, a.message, TYPE_LABELS[a.type]]
        .some(v => String(v).toLowerCase().includes(q)))
    );
  }, [alerts, severity, type, search]);

  const metrics = useMemo(() => ({
    total: alerts.length,
    urgent: alerts.filter(a => a.severity === 'urgent').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  }), [alerts]);

  const page = light ? 'text-[#0f172a]' : 'text-[#dae2fd]';
  const surface = light ? 'bg-white border-[#d9e2ef]' : 'bg-[#0d1528] border-[#222a3d]';
  const panel = light ? 'bg-[#f7f9fc] border-[#d9e2ef]' : 'bg-[#131b2e] border-[#222a3d]';
  const input = light
    ? 'bg-white border-[#cbd5e1] text-[#0f172a] placeholder-[#94a3b8]'
    : 'bg-[#131b2e] border-[#2d3449] text-white placeholder-[#64748b]';
  const mainText = light ? 'text-[#0f172a]' : 'text-white';
  const muted = light ? 'text-[#64748b]' : 'text-[#94a3b8]';

  return (
    <div className={`space-y-4 animate-in fade-in duration-300 ${page}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#ffb95f]/10 border border-[#ffb95f]/25 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#ffb95f]">notifications_active</span>
          </div>
          <div>
            <h1 className={`text-xl font-extrabold ${mainText}`}>Centro de Alertas</h1>
            <p className={`text-xs ${muted}`}>Módulo táctico de control: presiona cualquier alerta para desplegar su ficha técnica y datos relacionados.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
          <span className={`px-2.5 py-1.5 rounded-full border ${light ? 'bg-[#f1f5f9] text-[#334155] border-[#d9e2ef]' : 'bg-[#222a3d] text-white border-[#2d3449]'}`}>Total {metrics.total}</span>
          <span className="px-2.5 py-1.5 rounded-full bg-[#ef4444]/10 text-[#dc2626] border border-[#ef4444]/25">Urgentes {metrics.urgent}</span>
          <span className="px-2.5 py-1.5 rounded-full bg-[#f59e0b]/10 text-[#b45309] border border-[#f59e0b]/25">Advertencias {metrics.warning}</span>
          <span className="px-2.5 py-1.5 rounded-full bg-[#38bdf8]/10 text-[#0284c7] border border-[#38bdf8]/25">Informativas {metrics.info}</span>
        </div>
      </div>

      {/* Filter and List Container */}
      <div className={`rounded-2xl border overflow-hidden ${surface}`}>
        <div className={`p-4 border-b grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 ${light ? 'border-[#d9e2ef]' : 'border-[#222a3d]'}`}>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-[18px]">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por punto, código o detalle..."
              className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#0088ff] ${input}`}
            />
          </div>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as typeof severity)}
            className={`px-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#0088ff] cursor-pointer ${input}`}
          >
            <option value="all">Todas las severidades</option>
            <option value="urgent">🔴 Urgentes</option>
            <option value="warning">🟠 Advertencias</option>
            <option value="info">🔵 Informativas</option>
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className={`px-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#0088ff] cursor-pointer ${input}`}
          >
            <option value="all">Todos los tipos</option>
            {(Object.keys(TYPE_LABELS) as LeaseDataAlert['type'][]).map((k) => (
              <option key={k} value={k}>
                {TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="p-14 text-center">
            <span className="material-symbols-outlined text-5xl text-[#10b981]">notifications_off</span>
            <p className={`text-sm font-bold mt-3 ${mainText}`}>No hay alertas para los filtros seleccionados</p>
            <p className={`text-xs mt-1 ${muted}`}>Las alertas aparecerán aquí cuando CAVI detecte cambios o novedades en los datos operativos.</p>
          </div>
        ) : (
          <div className="p-3 space-y-2.5">
            {filtered.map((a) => {
              const isExpanded = expandedId === a.id;
              const relatedPoint = leasePoints.find(
                (p) => p.code.toLowerCase() === a.code.toLowerCase()
              );
              const red = a.severity === 'urgent';
              const orange = a.severity === 'warning';
              const mapsUrl = relatedPoint
                ? `https://www.google.com/maps/search/?api=1&query=${relatedPoint.lat},${relatedPoint.lng}`
                : null;

              return (
                <div
                  key={a.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                    isExpanded
                      ? red
                        ? 'border-[#ef4444]/60 bg-[#ef4444]/[0.04] shadow-md ring-1 ring-[#ef4444]/30'
                        : orange
                        ? 'border-[#f59e0b]/60 bg-[#f59e0b]/[0.04] shadow-md ring-1 ring-[#f59e0b]/30'
                        : 'border-[#0088ff]/60 bg-[#0088ff]/[0.04] shadow-md ring-1 ring-[#0088ff]/30'
                      : red
                      ? 'border-[#ef4444]/35 bg-[#ef4444]/[0.02] hover:border-[#ef4444]/60'
                      : orange
                      ? 'border-[#f59e0b]/30 bg-[#f59e0b]/[0.02] hover:border-[#f59e0b]/60'
                      : 'border-[#38bdf8]/25 bg-[#38bdf8]/[0.015] hover:border-[#0088ff]/50'
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
                    className={`w-full text-left p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer select-none transition-colors ${
                      light ? 'hover:bg-slate-50/80' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        red
                          ? 'bg-[#ef4444]/15 text-[#dc2626] border border-[#ef4444]/30'
                          : orange
                          ? 'bg-[#f59e0b]/15 text-[#d97706] border border-[#f59e0b]/30'
                          : 'bg-[#38bdf8]/15 text-[#0284c7] border border-[#38bdf8]/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {TYPE_ICONS[a.type]}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className={`text-xs sm:text-sm font-extrabold ${mainText}`}>
                          {a.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            light ? 'bg-[#eef2f7] text-[#475569]' : 'bg-[#222a3d] text-[#cbd5e1]'
                          }`}
                        >
                          {TYPE_LABELS[a.type]}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            red
                              ? 'bg-[#ef4444]/15 text-[#dc2626] border border-[#ef4444]/25'
                              : orange
                              ? 'bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/25'
                              : 'bg-[#38bdf8]/15 text-[#0284c7] border border-[#38bdf8]/25'
                          }`}
                        >
                          {red ? 'URGENTE' : orange ? 'ADVERTENCIA' : 'INFORMATIVA'}
                        </span>
                      </div>

                      <p
                        className={`text-xs mt-1 leading-snug ${
                          isExpanded ? 'font-semibold' : 'truncate'
                        } ${light ? 'text-[#334155]' : 'text-[#cbd5e1]'}`}
                      >
                        {a.message}
                      </p>

                      <div className={`mt-1.5 text-[10px] flex flex-wrap gap-x-3 gap-y-1 items-center ${muted}`}>
                        <span className="font-mono font-bold text-[#0088ff] px-1.5 py-0.5 rounded bg-[#0088ff]/10">
                          {a.code}
                        </span>
                        <span className="font-medium text-slate-300">{a.pointName}</span>
                        <span>·</span>
                        <span>{new Date(a.createdAt).toLocaleString('es-CO')}</span>
                      </div>
                    </div>

                    {/* Chevron indicator rotates when expanded */}
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-black/10 dark:bg-white/5">
                      <span
                        className={`material-symbols-outlined transition-transform duration-200 text-[20px] ${
                          isExpanded ? 'rotate-90 text-[#0088ff]' : muted
                        }`}
                      >
                        chevron_right
                      </span>
                    </div>
                  </div>

                  {/* Collapsible/Desplegable Information Body */}
                  {isExpanded && (
                    <div
                      className={`p-4 border-t space-y-3.5 animate-in fade-in duration-200 ${
                        light ? 'border-[#d9e2ef] bg-[#f8fafc]' : 'border-[#222a3d] bg-[#0b1326]/60'
                      }`}
                    >
                      {/* Qué detectó CAVI */}
                      <div className={`p-3.5 rounded-xl border ${panel}`}>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold text-[#38bdf8]">
                          <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                          <span>Diagnóstico e Inteligencia CAVI</span>
                        </div>
                        <p
                          className={`text-xs sm:text-[13px] mt-1.5 leading-relaxed font-medium ${
                            light ? 'text-[#0f172a]' : 'text-[#f1f5f9]'
                          }`}
                        >
                          {a.message}
                        </p>
                      </div>

                      {/* Technical Data Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className={`p-2.5 rounded-xl border ${panel}`}>
                          <span className={`text-[8px] uppercase tracking-wider block font-semibold ${muted}`}>
                            Código PDV
                          </span>
                          <b className="text-xs text-[#0088ff] font-mono">{a.code}</b>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${panel}`}>
                          <span className={`text-[8px] uppercase tracking-wider block font-semibold ${muted}`}>
                            Inmueble / Sede
                          </span>
                          <b className={`text-xs block truncate ${mainText}`}>{a.pointName}</b>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${panel}`}>
                          <span className={`text-[8px] uppercase tracking-wider block font-semibold ${muted}`}>
                            Nivel de Severidad
                          </span>
                          <b
                            className={`text-xs font-bold ${
                              red ? 'text-[#ef4444]' : orange ? 'text-[#d97706]' : 'text-[#0284c7]'
                            }`}
                          >
                            {a.severity === 'urgent'
                              ? '🔴 Urgente'
                              : a.severity === 'warning'
                              ? '🟠 Advertencia'
                              : '🔵 Informativa'}
                          </b>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${panel}`}>
                          <span className={`text-[8px] uppercase tracking-wider block font-semibold ${muted}`}>
                            Fecha de Registro
                          </span>
                          <b className={`text-[10px] block font-mono ${mainText}`}>
                            {new Date(a.createdAt).toLocaleString('es-CO')}
                          </b>
                        </div>
                      </div>

                      {/* Punto de Arrendamiento Relacionado (si existe) */}
                      {relatedPoint && (
                        <div className={`p-3.5 rounded-xl border ${panel} space-y-2.5`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 ${muted}`}>
                              <span className="material-symbols-outlined text-[16px] text-[#0088ff]">storefront</span>
                              Datos Operativos del Inmueble Relacionado
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
                              <span className={`text-[9px] uppercase block ${muted}`}>Ubicación</span>
                              <p className={`font-semibold mt-0.5 ${mainText}`}>{relatedPoint.address}</p>
                              <p className={`text-[10px] ${muted}`}>{relatedPoint.neighborhood} · {relatedPoint.municipality}</p>
                            </div>
                            <div>
                              <span className={`text-[9px] uppercase block ${muted}`}>Canon & Contrato</span>
                              <p className="font-bold text-[#10b981] mt-0.5">{formatCOP(relatedPoint.monthlyRent)} / mes</p>
                              <p className={`text-[10px] ${muted}`}>Contrato #{relatedPoint.contractNumber || 'N/D'} · Vigente hasta {relatedPoint.contractEndDate}</p>
                            </div>
                            <div>
                              <span className={`text-[9px] uppercase block ${muted}`}>Propietario / Contacto</span>
                              <p className={`font-semibold mt-0.5 ${mainText}`}>{relatedPoint.landlord.name || 'Sin registro'}</p>
                              <p className={`text-[10px] ${muted}`}>{relatedPoint.landlord.phone || 'Tel: N/D'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer actions inside the dropdown */}
                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[10px] italic ${muted}`}>
                          Presiona la tarjeta para contraer
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(a.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                            light
                              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                              : 'bg-[#171f33] hover:bg-[#222a3d] border-[#2d3449] text-[#cbd5e1]'
                          }`}
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
