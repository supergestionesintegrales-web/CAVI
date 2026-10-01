import React from 'react';
import { LeasePoint, WeeklySchedule } from '../types';
import {
  evaluatePointOpenStatus,
  formatCOP,
  getContractDaysRemaining,
  getLeaseLifecycleStatus,
} from '../data/leasePointsData';

interface LeaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  point: LeasePoint | null;
  onEdit: (point: LeasePoint) => void;
  onOpenIncident: (point: LeasePoint) => void;
  userRole?: string;
}

export const LeaseDetailsModal: React.FC<LeaseDetailsModalProps> = ({
  isOpen,
  onClose,
  point,
  onEdit,
  onOpenIncident,
  userRole = 'administrador',
}) => {
  const isAdmin = userRole === 'administrador';
  if (!isOpen || !point) return null;

  const status = evaluatePointOpenStatus(point);
  const contract = getContractDaysRemaining(point.contractEndDate);
  const lifecycle = getLeaseLifecycleStatus(point);
  const sales = point.salesSummary;

  const daysList: { key: keyof WeeklySchedule; label: string }[] = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
  const wazeUrl = `https://waze.com/ul?ll=${point.lat},${point.lng}&navigate=yes`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                status.isOpenNow
                  ? 'bg-[#10b981]/20 text-[#4edea3] ring-1 ring-[#10b981]/40'
                  : 'bg-[#ffb4ab]/20 text-[#ffb4ab] ring-1 ring-[#ffb4ab]/40'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {status.isOpenNow ? 'storefront' : 'lock'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white text-blue-700 border border-slate-200">
                  {point.code}
                </span>
                <span className="text-xs text-slate-500 font-semibold">{point.propertyType}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{point.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Real-time Status Alert Banner */}
        <div
          className={`px-5 py-3 flex items-center justify-between border-b ${
            status.isOpenNow
              ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#4edea3]'
              : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              {status.isOpenNow && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  status.isOpenNow ? 'bg-[#10b981]' : 'bg-[#ffb4ab]'
                }`}
              ></span>
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">{status.statusBadgeText}</div>
              <div className="text-xs text-slate-900/90">{status.statusDescription}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-900/80">{status.timeContext}</div>
            <div className="text-[10px] text-slate-900/60">Horario oficial CAVI</div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Ubicación Geográfica */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <span className="material-symbols-outlined text-[18px] text-blue-700">pin_drop</span>
                Ubicación Geográfica y Navegación
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#0088ff]/15 hover:bg-[#0088ff]/25 text-blue-700 font-bold text-[11px] flex items-center gap-1 transition-colors border border-[#0088ff]/30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">map</span>
                  Punto GPS
                </a>
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#3131c0]/20 hover:bg-[#3131c0]/30 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-colors border border-[#3131c0]/40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">navigation</span>
                  Waze
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[11px]">Dirección Completa:</span>
                <span className="font-bold text-slate-900">{point.address}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Municipio y Departamento:</span>
                <span className="font-bold text-slate-900">
                  {point.municipality}, {point.department} ({point.neighborhood})
                </span>
              </div>
            </div>

            {point.reference && (
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-500">
                <strong className="text-slate-700">Referencia / Hito:</strong> {point.reference}
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Coordenadas GPS:</span>
              <span className="font-mono text-blue-700">
                Lat: {point.lat.toFixed(5)}, Lng: {point.lng.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Horarios Semanales */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <span className="material-symbols-outlined text-[18px] text-[#ffb95f]">schedule</span>
                Horarios Semanales de Apertura y Cierre
              </span>
              <span className="text-[11px] text-slate-500">
                {point.schedule.holidayNote || 'Cerrado festivos'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {daysList.map(({ key, label }) => {
                const dayHours = point.schedule[key];
                return (
                  <div
                    key={key}
                    className={`p-2.5 rounded-xl border text-center ${
                      dayHours.isOpen
                        ? 'bg-white border-slate-200 text-slate-900'
                        : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-[11px] mb-1">{label}</div>
                    {dayHours.isOpen ? (
                      <>
                        <div className="font-mono text-xs font-bold text-[#4edea3]">
                          {dayHours.open} - {dayHours.close}
                        </div>
                        {dayHours.hasLunchBreak && (
                          <div className="text-[9px] text-[#ffb95f] mt-0.5">
                            Alm: {dayHours.lunchStart}-{dayHours.lunchEnd}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-slate-500 italic">Cerrado</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ficha Contractual y Financiera */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-[18px] text-[#4edea3]">description</span>
              Ficha del Contrato de Arrendamiento
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase">Canon Mensual</span>
                <span className="text-sm font-bold text-[#4edea3] font-mono">
                  {formatCOP(point.monthlyRent)}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase">Administración</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {point.adminFee ? formatCOP(point.adminFee) : 'Incluida / $0'}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase">Área Inmueble</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{point.areaSqMeters} m²</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase">Días de Cuenta</span>
                <span className="text-sm font-bold text-indigo-700 font-mono">{point.daysOfAccount !== undefined ? point.daysOfAccount : 'N/D'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
              <div>
                <span className="text-slate-500 text-[11px] block">N° Contrato:</span>
                <span className="font-mono font-bold text-slate-900">{point.contractNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Vigencia:</span>
                <span
                  className={`font-semibold ${
                    contract.status === 'valid'
                      ? 'text-[#4edea3]'
                      : contract.status === 'expiring_soon'
                      ? 'text-[#ffb95f]'
                      : 'text-[#ffb4ab]'
                  }`}
                >
                  {point.contractStartDate} hasta {point.contractEndDate} ({contract.label})
                </span>
              </div>
            </div>
          </div>

          {/* Actividad Comercial / Giros */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <span className="material-symbols-outlined text-[18px] text-blue-700">monitoring</span>
                Actividad Comercial / Giros
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                sales?.status === 'with_sales'
                  ? 'bg-[#10b981]/10 text-[#4edea3] border-[#10b981]/30'
                  : sales?.status === 'no_sales'
                  ? 'bg-[#ffb95f]/10 text-[#ffb95f] border-[#ffb95f]/30'
                  : 'bg-[#64748b]/10 text-slate-500 border-[#64748b]/20'
              }`}>
                {sales?.status === 'with_sales' ? 'CON VENTAS' : sales?.status === 'no_sales' ? 'SIN VENTAS' : 'SIN DATOS'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block uppercase">Última venta</span>
                <span className="text-xs font-bold text-slate-900">{sales?.lastSaleDate || 'Sin registro'}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block uppercase">Días sin venta</span>
                <span className={`text-xs font-bold ${sales?.daysWithoutSale !== undefined && sales.daysWithoutSale >= 90 ? 'text-[#ffb4ab]' : sales?.daysWithoutSale !== undefined && sales.daysWithoutSale >= 60 ? 'text-[#ffb95f]' : 'text-[#4edea3]'}`}>
                  {sales?.daysWithoutSale !== undefined ? sales.daysWithoutSale : 'N/D'}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block uppercase">Giros / transacciones</span>
                <span className="text-xs font-bold text-slate-900">{sales?.totalTransactions ?? 'N/D'}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block uppercase">Total vendido</span>
                <span className="text-xs font-bold text-[#4edea3] font-mono">{sales?.totalSalesAmount !== undefined ? formatCOP(sales.totalSalesAmount) : 'N/D'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div className="text-slate-500">
                Periodo analizado: <strong className="text-slate-700">{sales?.coverageStartDate || 'N/D'} → {sales?.coverageEndDate || 'N/D'}</strong>
              </div>
              <div className="text-slate-500 sm:text-right">
                Fuente: <strong className="text-slate-700">{sales?.salesSourceFile || 'No identificada'}</strong>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500">
              <strong className="text-slate-700">Lectura CAVI:</strong> la falta de ventas genera una alerta comercial; no convierte por sí sola el punto en depurado contractual.
            </div>
          </div>

          {/* Estado Contractual */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-[18px] text-[#c084fc]">inventory_2</span>
              Estado de Depuración Contractual
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                lifecycle.lifecycleStatus === 'inactive'
                  ? 'bg-[#a855f7]/10 text-[#c084fc] border-[#a855f7]/30'
                  : 'bg-[#10b981]/10 text-[#4edea3] border-[#10b981]/30'
              }`}>
                {lifecycle.lifecycleStatus === 'inactive' ? 'DEPURADO / INACTIVO' : 'ACTIVO'}
              </span>
              {lifecycle.inactivityLabel && (
                <span className="text-[10px] text-[#ffb4ab]">Motivo: {lifecycle.inactivityLabel}</span>
              )}
              {point.inactivityDate && (
                <span className="text-[10px] text-slate-500">Fecha: {point.inactivityDate}</span>
              )}
            </div>
          </div>

          {/* Propietario / Inmobiliaria */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-[18px] text-indigo-700">contact_phone</span>
              Datos de Contacto del Arrendador
            </span>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div>
                <div className="font-bold text-slate-900 text-xs">{point.landlord.name}</div>
                {point.landlord.documentId && (
                  <div className="text-[10px] text-slate-500">{point.landlord.documentId}</div>
                )}
                {point.landlord.contactPerson && (
                  <div className="text-[11px] text-slate-700">
                    Contacto: {point.landlord.contactPerson}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {point.landlord.phone && (
                  <a
                    href={`tel:${point.landlord.phone}`}
                    className="px-3 py-1.5 rounded-lg bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#4edea3] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    Llamar
                  </a>
                )}
                {point.landlord.email && (
                  <a
                    href={`mailto:${point.landlord.email}`}
                    className="px-3 py-1.5 rounded-lg bg-[#0088ff]/20 hover:bg-[#0088ff]/30 text-blue-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    Escribir
                  </a>
                )}
              </div>
            </div>

            {(point.electricMeter || point.waterMeter) && (
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                {point.electricMeter && (
                  <div>
                    <span className="text-slate-500">Medidor Luz: </span>
                    <span className="font-mono text-slate-900">{point.electricMeter}</span>
                  </div>
                )}
                {point.waterMeter && (
                  <div>
                    <span className="text-slate-500">Medidor Agua: </span>
                    <span className="font-mono text-slate-900">{point.waterMeter}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          {isAdmin ? (
            <button
              type="button"
              onClick={() => onOpenIncident(point)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#ffb4ab] bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 border border-[#ffb4ab]/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">warning</span>
              Novedad de Cierre / Horario
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-blue-700">visibility</span>
              Modo Solo Vista (Edición solo Admin)
            </span>
          )}

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onEdit(point)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Editar Inmueble
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-[#0088ff] hover:bg-[#0070d8] shadow-md shadow-[#0088ff]/30 transition-all cursor-pointer"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
