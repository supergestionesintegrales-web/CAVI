import React, { useMemo, useState } from 'react';
import { LeasePoint } from '../../types';
import { LeaseDataAlert } from '../../utils/dataReconciliation';

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
  const [selected, setSelected] = useState<LeaseDataAlert | null>(null);

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

  const selectedPoint = selected
    ? leasePoints.find(p => p.code.toLowerCase() === selected.code.toLowerCase())
    : null;

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#ffb95f]/10 border border-[#ffb95f]/25 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#ffb95f]">notifications_active</span>
          </div>
          <div>
            <h1 className={`text-xl font-extrabold ${mainText}`}>Centro de Alertas</h1>
            <p className={`text-xs ${muted}`}>Módulo independiente de control y seguimiento de todas las alertas CAVI.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
          <span className={`px-2.5 py-1.5 rounded-full border ${light ? 'bg-[#f1f5f9] text-[#334155] border-[#d9e2ef]' : 'bg-[#222a3d] text-white border-[#2d3449]'}`}>Total {metrics.total}</span>
          <span className="px-2.5 py-1.5 rounded-full bg-[#ef4444]/10 text-[#dc2626] border border-[#ef4444]/25">Urgentes {metrics.urgent}</span>
          <span className="px-2.5 py-1.5 rounded-full bg-[#f59e0b]/10 text-[#b45309] border border-[#f59e0b]/25">Advertencias {metrics.warning}</span>
          <span className="px-2.5 py-1.5 rounded-full bg-[#38bdf8]/10 text-[#0284c7] border border-[#38bdf8]/25">Informativas {metrics.info}</span>
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${surface}`}>
        <div className={`p-4 border-b grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 ${light ? 'border-[#d9e2ef]' : 'border-[#222a3d]'}`}>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-[18px]">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por punto, código o detalle..." className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#0088ff] ${input}`} />
          </div>
          <select value={severity} onChange={e => setSeverity(e.target.value as typeof severity)} className={`px-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#0088ff] ${input}`}>
            <option value="all">Todas las severidades</option><option value="urgent">🔴 Urgentes</option><option value="warning">🟠 Advertencias</option><option value="info">🔵 Informativas</option>
          </select>
          <select value={type} onChange={e => setType(e.target.value as typeof type)} className={`px-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#0088ff] ${input}`}>
            <option value="all">Todos los tipos</option>
            {(Object.keys(TYPE_LABELS) as LeaseDataAlert['type'][]).map(k => <option key={k} value={k}>{TYPE_LABELS[k]}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="p-14 text-center">
            <span className="material-symbols-outlined text-5xl text-[#10b981]">notifications_off</span>
            <p className={`text-sm font-bold mt-3 ${mainText}`}>No hay alertas para los filtros seleccionados</p>
            <p className={`text-xs mt-1 ${muted}`}>Las alertas aparecerán aquí cuando CAVI detecte cambios en la información cargada.</p>
          </div>
        ) : (
          <div className="p-3 space-y-2 max-h-[calc(100vh-270px)] overflow-y-auto">
            {filtered.map(a => {
              const red = a.severity === 'urgent';
              const orange = a.severity === 'warning';
              return (
                <button key={a.id} type="button" onClick={() => setSelected(a)} className={`w-full text-left p-3.5 rounded-xl border transition-all hover:border-[#0088ff]/60 ${light ? 'hover:bg-[#f5f9ff]' : 'hover:bg-[#151f35]'} cursor-pointer ${red ? 'border-[#ef4444]/35 bg-[#ef4444]/[0.03]' : orange ? 'border-[#f59e0b]/30 bg-[#f59e0b]/[0.025]' : 'border-[#38bdf8]/25 bg-[#38bdf8]/[0.02]'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${red ? 'bg-[#ef4444]/10 text-[#dc2626]' : orange ? 'bg-[#f59e0b]/10 text-[#d97706]' : 'bg-[#38bdf8]/10 text-[#0284c7]'}`}>
                      <span className="material-symbols-outlined">{TYPE_ICONS[a.type]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className={`text-xs font-extrabold ${mainText}`}>{a.title}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${light ? 'bg-[#eef2f7] text-[#475569]' : 'bg-[#222a3d] text-[#cbd5e1]'}`}>{TYPE_LABELS[a.type]}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${red ? 'bg-[#ef4444]/15 text-[#dc2626]' : orange ? 'bg-[#f59e0b]/15 text-[#b45309]' : 'bg-[#38bdf8]/15 text-[#0284c7]'}`}>{red ? 'URGENTE' : orange ? 'ADVERTENCIA' : 'INFORMATIVA'}</span>
                      </div>
                      <p className={`text-[10px] mt-1 truncate ${light ? 'text-[#475569]' : 'text-[#cbd5e1]'}`}>{a.message}</p>
                      <div className={`mt-1 text-[9px] flex flex-wrap gap-x-3 ${muted}`}>
                        <span className="font-mono text-[#0088ff]">{a.code}</span><span>{a.pointName}</span><span>{new Date(a.createdAt).toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined ${muted}`}>chevron_right</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className={`rounded-2xl border border-[#0088ff]/30 overflow-hidden shadow-sm ${light ? 'bg-white' : 'bg-[#0d1528]'}`}>
          <div className={`p-4 border-b flex items-start justify-between gap-3 ${light ? 'border-[#d9e2ef]' : 'border-[#222a3d]'}`}>
            <div>
              <span className={`text-[9px] uppercase tracking-wider font-bold ${muted}`}>Detalle de alerta</span>
              <h2 className={`text-base font-extrabold mt-0.5 ${mainText}`}>{selected.title}</h2>
              <p className={`text-[10px] ${muted}`}>{TYPE_LABELS[selected.type]}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${light ? 'bg-[#eef2f7] text-[#475569] hover:bg-[#e2e8f0]' : 'bg-[#222a3d] text-[#94a3b8] hover:text-white'}`}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className={`p-3 rounded-xl border ${panel}`}><span className={`text-[8px] uppercase block ${muted}`}>Código</span><b className="text-xs text-[#0088ff] font-mono">{selected.code}</b></div>
            <div className={`p-3 rounded-xl border ${panel}`}><span className={`text-[8px] uppercase block ${muted}`}>Punto</span><b className={`text-xs block truncate ${mainText}`}>{selected.pointName}</b></div>
            <div className={`p-3 rounded-xl border ${panel}`}><span className={`text-[8px] uppercase block ${muted}`}>Severidad</span><b className="text-xs text-[#d97706]">{selected.severity === 'urgent' ? 'URGENTE' : selected.severity === 'warning' ? 'ADVERTENCIA' : 'INFORMATIVA'}</b></div>
            <div className={`p-3 rounded-xl border ${panel}`}><span className={`text-[8px] uppercase block ${muted}`}>Generada</span><b className={`text-[10px] ${mainText}`}>{new Date(selected.createdAt).toLocaleString('es-CO')}</b></div>
          </div>

          <div className="px-4 pb-4">
            <div className={`p-3 rounded-xl border ${panel}`}>
              <span className={`text-[9px] uppercase tracking-wider font-bold ${muted}`}>Qué detectó CAVI</span>
              <p className={`text-xs mt-1 leading-relaxed ${light ? 'text-[#334155]' : 'text-[#e2e8f0]'}`}>{selected.message}</p>
            </div>
            {selectedPoint && (
              <div className={`mt-2 p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${panel}`}>
                <div>
                  <span className={`text-[9px] uppercase font-bold ${muted}`}>Punto relacionado</span>
                  <p className={`text-xs font-extrabold mt-0.5 ${mainText}`}>{selectedPoint.name}</p>
                  <p className={`text-[10px] ${muted}`}>{selectedPoint.address} · {selectedPoint.municipality}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
