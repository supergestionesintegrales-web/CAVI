import React, { useState, useMemo } from 'react';
import { FloatingPoint, Auditor, RouteStep, FormatType } from '../types';
import { resolvePdvZone, getAssignedAuditorForZone } from '../data/zoneAssignments';

interface AlertPointsAssignmentPoolProps {
  floatingPoints: FloatingPoint[];
  steps?: RouteStep[];
  auditors: Auditor[];
  onAssignPoint: (id: string, auditorId: string, day: string) => void;
  onAutoAssignAll: () => void;
  onDeletePoint?: (id: string) => void;
  onOpenAddModal: () => void;
  onReloadSampleAlertPoints?: () => void;
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
  userRole?: string;
  onReassignStepDay?: (stepId: string, day: RouteStep['day'], auditorId?: string) => void;
}

export interface PrioritizedAlertItem {
  id: string;
  code: string;
  name: string;
  format: FormatType;
  channel?: string;
  address: string;
  municipality: string;
  zone: 'Norte' | 'Centro' | 'Sur';
  assignedAuditor: Auditor;
  alertType: 'sin_visita' | 'revisita' | 'cerrado';
  alertBadge: string;
  alertSeverity: 'critical' | 'warning' | 'purple';
  description: string;
  daysWithoutVisit?: number;
  lastVisitDate?: string;
  isStep: boolean;
  stepStatus?: RouteStep['status'];
}

export const AlertPointsAssignmentPool: React.FC<AlertPointsAssignmentPoolProps> = ({
  floatingPoints,
  steps = [],
  auditors = [],
  onAssignPoint,
  onAutoAssignAll,
  onDeletePoint,
  onOpenAddModal,
  onReloadSampleAlertPoints,
  onShowToast,
  userRole = 'administrador',
  onReassignStepDay,
}) => {
  const isAdmin = userRole === 'administrador';

  // Selection state for auditor and day
  const [selectedAuditorMap, setSelectedAuditorMap] = useState<Record<string, string>>({});
  const [selectedDayMap, setSelectedDayMap] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'sin_visita' | 'revisita' | 'cerrado' | 'norte' | 'centro' | 'sur'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Build Unified List of Prioritized Alert Points
  const prioritizedItems = useMemo<PrioritizedAlertItem[]>(() => {
    const list: PrioritizedAlertItem[] = [];

    // A. Re-visit needed or closed steps from active routes
    steps.forEach((s) => {
      const zone = resolvePdvZone({
        zone: s.zone,
        municipality: s.municipality,
        address: s.address,
        name: s.name,
      });
      const assignedAud = getAssignedAuditorForZone(zone, auditors) || auditors?.[0];

      if (s.status === 'revisit_needed' || s.auditStatus === 'revisita_pendiente') {
        list.push({
          id: `step-revisita-${s.id}`,
          code: s.code,
          name: s.name,
          format: s.format,
          channel: s.channel,
          address: s.address,
          municipality: s.municipality || (zone === 'Norte' ? 'Riohacha' : zone === 'Centro' ? 'Maicao' : 'San Juan del Cesar'),
          zone,
          assignedAuditor: assignedAud,
          alertType: 'revisita',
          alertBadge: 'Re-visita Reprogramada',
          alertSeverity: 'purple',
          description: s.notes || s.auditReason || 'Reprogramado para re-visita obligatoria en terreno por novedad o arqueo.',
          daysWithoutVisit: s.daysWithoutVisit || 45,
          lastVisitDate: s.auditDate || 'Visita previa con novedad',
          isStep: true,
          stepStatus: s.status,
        });
      } else if (
        (s.auditReason && s.auditReason.toLowerCase().includes('cerrado')) ||
        (s.notes && s.notes.toLowerCase().includes('cerrado')) ||
        (s.status === 'not_audited' && (s.auditReason?.toLowerCase().includes('cerrado') || s.notes?.toLowerCase().includes('cerrado')))
      ) {
        list.push({
          id: `step-cerrado-${s.id}`,
          code: s.code,
          name: s.name,
          format: s.format,
          channel: s.channel,
          address: s.address,
          municipality: s.municipality || (zone === 'Norte' ? 'Riohacha' : zone === 'Centro' ? 'Maicao' : 'San Juan del Cesar'),
          zone,
          assignedAuditor: assignedAud,
          alertType: 'cerrado',
          alertBadge: 'Local Cerrado a Verificar',
          alertSeverity: 'critical',
          description: s.auditReason || s.notes || 'Encontrado cerrado en auditoría previa. Requiere inspección en horario verificado.',
          daysWithoutVisit: s.daysWithoutVisit || 50,
          lastVisitDate: s.auditDate || 'Cerrado en última pasada',
          isStep: true,
          stepStatus: s.status,
        });
      }
    });

    // B. Floating and Pending Alert Points (tiempo sin visitar y alertas operativas)
    floatingPoints.forEach((fp) => {
      const zone = resolvePdvZone({
        zone: fp.zone,
        municipality: fp.municipality,
        address: fp.address,
        name: fp.name,
      });
      const assignedAud = getAssignedAuditorForZone(zone, auditors) || auditors?.[0];
      const days = fp.daysWithoutVisit || 65;

      const isCerrado =
        fp.alertCategory === 'cerrado' ||
        (fp.alertDescription && fp.alertDescription.toLowerCase().includes('cerrad')) ||
        (fp.name && fp.name.toLowerCase().includes('(cerrado)')) ||
        (fp.details && fp.details.toLowerCase().includes('cerrad'));

      const isRevisita =
        fp.alertCategory === 'revisita' ||
        (fp.priority as string) === 'Re-visita Inventario' ||
        (fp.name && fp.name.toLowerCase().includes('(re-visita)')) ||
        (fp.alertDescription && fp.alertDescription.toLowerCase().includes('revisita'));

      let alertType: PrioritizedAlertItem['alertType'] = 'sin_visita';
      let alertBadge = `${days} días sin visita`;
      let alertSeverity: PrioritizedAlertItem['alertSeverity'] = days >= 90 ? 'critical' : 'warning';

      if (isCerrado) {
        alertType = 'cerrado';
        alertBadge = 'Local Cerrado';
        alertSeverity = 'critical';
      } else if (isRevisita) {
        alertType = 'revisita';
        alertBadge = 'Re-visita Pendiente';
        alertSeverity = 'purple';
      } else if (days >= 90) {
        alertBadge = `Crítico: ${days}d sin visita`;
      } else {
        alertBadge = `En Mora: ${days}d sin visita`;
      }

      list.push({
        id: fp.id,
        code: fp.code,
        name: fp.name,
        format: fp.format,
        channel: fp.channel,
        address: fp.address,
        municipality: fp.municipality || (zone === 'Norte' ? 'Riohacha' : zone === 'Centro' ? 'Maicao' : 'San Juan del Cesar'),
        zone,
        assignedAuditor: assignedAud,
        alertType,
        alertBadge,
        alertSeverity,
        description: fp.alertDescription || fp.details || `${days} días sin visita registrada en el sistema.`,
        daysWithoutVisit: days,
        lastVisitDate: fp.lastVisitDate,
        isStep: false,
      });
    });

    // Sort by urgency: Critical closed & revisits first, then highest days without visit
    return list.sort((a, b) => {
      if (a.alertType === 'revisita' && b.alertType !== 'revisita') return -1;
      if (b.alertType === 'revisita' && a.alertType !== 'revisita') return 1;
      return (b.daysWithoutVisit || 0) - (a.daysWithoutVisit || 0);
    });
  }, [floatingPoints, steps, auditors]);

  // Counts for tabs
  const countSinVisita = useMemo(() => prioritizedItems.filter((i) => i.alertType === 'sin_visita').length, [prioritizedItems]);
  const countRevisita = useMemo(() => prioritizedItems.filter((i) => i.alertType === 'revisita').length, [prioritizedItems]);
  const countCerrado = useMemo(() => prioritizedItems.filter((i) => i.alertType === 'cerrado').length, [prioritizedItems]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return prioritizedItems.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.address.toLowerCase().includes(q) ||
          item.municipality.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (activeTab === 'sin_visita') return item.alertType === 'sin_visita';
      if (activeTab === 'revisita') return item.alertType === 'revisita';
      if (activeTab === 'cerrado') return item.alertType === 'cerrado';
      if (activeTab === 'norte') return item.zone === 'Norte';
      if (activeTab === 'centro') return item.zone === 'Centro';
      if (activeTab === 'sur') return item.zone === 'Sur';
      return true;
    });
  }, [prioritizedItems, activeTab, searchQuery]);

  // Handle single item assignment (strictly respects zone)
  const handleAssignItem = (item: PrioritizedAlertItem) => {
    const targetAuditorId = selectedAuditorMap[item.id] || item.assignedAuditor.id;
    const targetDay = selectedDayMap[item.id] || 'lunes';
    const targetAuditor = auditors.find((a) => a.id === targetAuditorId) || item.assignedAuditor;

    if (item.isStep) {
      if (onReassignStepDay) {
        const stepId = item.id.replace('step-revisita-', '').replace('step-cerrado-', '');
        onReassignStepDay(stepId, targetDay as RouteStep['day'], targetAuditor.id);
      }
      onShowToast(
        'Punto Re-Priorizado en Ruta',
        `${item.code} (${item.name}) programado para ${targetDay.toUpperCase()} con ${targetAuditor.name}.`,
        'success'
      );
    } else {
      onAssignPoint(item.id, targetAuditor.id, targetDay);
    }
  };

  // "Aplica a todo": Distribute all alert points strictly to their zone's auditor
  const handleApplyAllByZone = () => {
    if (prioritizedItems.length === 0) {
      onShowToast('Sin Alertas', 'No hay puntos pendientes por priorizar en este momento.', 'info');
      return;
    }
    // Call the global auto-assign that enforces strict zone assignment
    onAutoAssignAll();
    onShowToast(
      'Asignación Completa por Zona',
      `Todos los puntos fueron distribuidos estrictamente a la carga de los auditores: Samuel (Norte), Kleyder (Centro) y Jose (Sur).`,
      'success'
    );
  };

  return (
    <section className="w-full space-y-4 pt-6 border-t-2 border-slate-300 dark:border-[#222a3d]/80">
      {/* SECTION HEADER & HERO CARD */}
      <div className="bg-white dark:bg-[#131b2e] border-2 border-slate-300 dark:border-[#233554] rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-500/30 shrink-0">
              <span className="material-symbols-outlined text-[28px]">notification_important</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-headline font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                  Alertas de Puntos Priorizados para Visita
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 text-xs font-extrabold border border-red-300 dark:border-red-500/30 font-mono">
                  {prioritizedItems.length} Alertas Activas
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed font-medium">
                Puntos de venta priorizados por <strong className="text-slate-900 dark:text-white">tiempo prolongado sin visita</strong>, locales <strong className="text-slate-900 dark:text-white">reprogramados para re-visita obligatoria</strong> o reportados como <strong className="text-slate-900 dark:text-white">cerrados</strong>.
              </p>
            </div>
          </div>

          {/* GLOBAL ACTIONS (APLICA A TODO STRICT BY ZONE) */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={handleApplyAllByZone}
                disabled={prioritizedItems.length === 0}
                className="px-4 py-2.5 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
                title="Aplica la asignación a todo según la zona correspondiente del auditor"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Asignar Todo por Zona (Aplica a Todo)</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddModal}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-[#2d3a58] text-slate-900 dark:text-[#fcd34d] text-xs font-bold border border-slate-300 dark:border-[#f59e0b]/40 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">add_alert</span>
                <span>+ Agregar Alerta</span>
              </button>

              {onReloadSampleAlertPoints && floatingPoints.length === 0 && (
                <button
                  type="button"
                  onClick={onReloadSampleAlertPoints}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#131b2e] dark:hover:bg-[#1e293b] text-[#0088ff] dark:text-[#38bdf8] text-xs font-bold border border-slate-300 dark:border-[#38bdf8]/40 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Recargar datos de prueba de La Guajira"
                >
                  <span className="material-symbols-outlined text-[17px]">replay</span>
                  <span>Recargar Alertas</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3 SUMMARY KPI TILES (SIN VISITA, RE-VISITA, CERRADOS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/60">
          {/* Tile 1: Tiempo sin Visitar */}
          <div className="bg-amber-50/80 dark:bg-[#0f172a]/80 border-2 border-amber-300 dark:border-amber-500/30 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">schedule</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300 block">
                Tiempo Sin Visitar (&gt;60d)
              </span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono leading-none mt-0.5 block">
                {countSinVisita} PDVs
              </span>
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mt-0.5">
                En mora de supervisión
              </span>
            </div>
          </div>

          {/* Tile 2: Reprogramados Re-visita */}
          <div className="bg-purple-50/80 dark:bg-[#0f172a]/80 border-2 border-purple-300 dark:border-purple-500/30 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">replay</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-300 block">
                Reprogramados Re-visita
              </span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono leading-none mt-0.5 block">
                {countRevisita} PDVs
              </span>
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mt-0.5">
                Pendientes de auditoría
              </span>
            </div>
          </div>

          {/* Tile 3: Locales Cerrados */}
          <div className="bg-red-50/80 dark:bg-[#0f172a]/80 border-2 border-red-300 dark:border-red-500/30 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">lock</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-900 dark:text-red-300 block">
                PDV Cerrados a Verificar
              </span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono leading-none mt-0.5 block">
                {countCerrado} PDVs
              </span>
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mt-0.5">
                Verificación de apertura/horario
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & SEARCH */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#131b2e] p-3 rounded-2xl border-2 border-slate-300 dark:border-[#222a3d] shadow-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {[
            { key: 'all', label: `Todos (${prioritizedItems.length})` },
            { key: 'sin_visita', label: `Sin Visita (${countSinVisita})` },
            { key: 'revisita', label: `Re-visitas (${countRevisita})` },
            { key: 'cerrado', label: `Cerrados (${countCerrado})` },
            { key: 'norte', label: 'Norte' },
            { key: 'centro', label: 'Centro' },
            { key: 'sur', label: 'Sur' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[#0088ff] text-white shadow-md shadow-[#0088ff]/30'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-[#2d3a58] text-slate-800 dark:text-[#cbd5e1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar PDV, código o municipio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#171f33] border-2 border-slate-300 dark:border-[#2d3a58] text-slate-900 dark:text-white text-xs font-bold placeholder:text-slate-500 dark:placeholder-[#94a3b8] focus:outline-none focus:border-[#0088ff]"
          />
        </div>
      </div>

      {/* ITEMS LIST GRID */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-[#171f33] border-2 border-slate-300 dark:border-[#222a3d] rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">check_circle</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white">
              {prioritizedItems.length === 0 ? '¡No hay alertas prioritarias pendientes!' : 'Ningún punto coincide con el filtro seleccionado'}
            </h3>
            <p className="text-xs text-slate-700 dark:text-[#cbd5e1] max-w-md mx-auto mt-1 font-medium">
              {prioritizedItems.length === 0
                ? 'Todos los puntos con moras de visita, reprogramados o reportados como cerrados están asignados y despachados en la carga de los auditores.'
                : 'Prueba cambiando el filtro de búsqueda o seleccionando "Todos".'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => {
            const selectedAudId = selectedAuditorMap[item.id] || item.assignedAuditor.id;
            const selectedAuditor = auditors.find((a) => a.id === selectedAudId) || item.assignedAuditor;
            const selectedDay = selectedDayMap[item.id] || 'lunes';

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-[#171f33] rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3 border-2 transition-all hover:shadow-md ${
                  item.alertType === 'cerrado'
                    ? 'border-red-400 dark:border-red-500/80 border-l-8 border-l-red-600'
                    : item.alertType === 'revisita'
                    ? 'border-purple-400 dark:border-purple-500/80 border-l-8 border-l-purple-600'
                    : 'border-amber-400 dark:border-amber-500/80 border-l-8 border-l-amber-500'
                }`}
              >
                {/* Header: Code, Name, Priority Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-lg shrink-0 ${
                          item.format === 'CM'
                            ? 'bg-[#0284c7] text-white'
                            : item.format === 'PF'
                            ? 'bg-[#7c3aed] text-white'
                            : 'bg-[#0088ff] text-white'
                        }`}
                      >
                        {item.code}
                      </span>
                      <h3 className="font-headline font-extrabold text-sm sm:text-base text-slate-900 dark:text-white break-words" title={item.name}>
                        {item.name}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 shadow-xs whitespace-nowrap ${
                        item.alertSeverity === 'critical'
                          ? 'bg-red-600 text-white'
                          : item.alertSeverity === 'purple'
                          ? 'bg-purple-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {item.alertBadge}
                    </span>
                  </div>

                  {/* Location & Zone */}
                  <div className="flex items-center gap-2 text-xs text-slate-800 dark:text-[#cbd5e1] mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[15px] text-[#0088ff] shrink-0">location_on</span>
                      <span className="break-words text-slate-900 dark:text-slate-100">{item.address}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#131b2e] text-slate-900 dark:text-[#93c5fd] font-extrabold text-[10px] border border-slate-300 dark:border-[#2d3a58]">
                      {item.municipality} · {item.zone}
                    </span>
                  </div>

                  {/* Description Box with High-Contrast Text */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-100 dark:bg-[#0b1326] border border-slate-300 dark:border-[#2d3a58] text-xs">
                    <p className="text-slate-900 dark:text-slate-100 font-bold leading-snug">
                      {item.description}
                    </p>
                    {item.lastVisitDate && (
                      <span className="text-[10px] text-slate-700 dark:text-slate-400 font-semibold block mt-1">
                        Historial: {item.lastVisitDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Assignment Controls */}
                <div className="pt-2.5 border-t border-slate-200 dark:border-[#222a3d] space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Auditor Selector */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-900 dark:text-slate-200 mb-1">
                        Auditor:
                      </label>
                      <select
                        value={selectedAudId}
                        onChange={(e) =>
                          setSelectedAuditorMap((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 rounded-lg bg-white dark:bg-[#131b2e] border-2 border-slate-300 dark:border-[#2d3a58] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#0088ff]"
                      >
                        {auditors.map((aud) => {
                          const isZoneOfficial = aud.zone === item.zone;
                          return (
                            <option key={aud.id} value={aud.id}>
                              {aud.name}{isZoneOfficial ? ' (Oficial Zona)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Day Selector */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-900 dark:text-slate-200 mb-1">
                        Día de Ruta:
                      </label>
                      <select
                        value={selectedDay}
                        onChange={(e) =>
                          setSelectedDayMap((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 rounded-lg bg-white dark:bg-[#131b2e] border-2 border-slate-300 dark:border-[#2d3a58] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#0088ff]"
                      >
                        <option value="lunes">Lunes (Prioridad Alta)</option>
                        <option value="martes">Martes</option>
                        <option value="miércoles">Miércoles</option>
                        <option value="jueves">Jueves</option>
                        <option value="viernes">Viernes</option>
                        <option value="sábado">Sábado (Medio Día Laboral)</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-400">
                      Asigna a {selectedAuditor?.name ? selectedAuditor.name.split(' ')[0] : 'Auditor'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!item.isStep && onDeletePoint && (
                        <button
                          type="button"
                          onClick={() => onDeletePoint(item.id)}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-[#1e293b] dark:text-[#cbd5e1] dark:hover:text-[#f87171] border border-slate-300 dark:border-transparent transition-colors cursor-pointer"
                          title="Descartar"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAssignItem(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">send</span>
                        <span>Asignar a Ruta</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
