import React from 'react';
import { LeasePoint, WeeklySchedule } from '../types';
import {
  evaluatePointOpenStatus,
  formatCOP,
  getContractDaysRemaining,
} from '../data/leasePointsData';

interface LeaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  point: LeasePoint | null;
  onEdit: (point: LeasePoint) => void;
  onOpenIncident: (point: LeasePoint) => void;
}

export const LeaseDetailsModal: React.FC<LeaseDetailsModalProps> = ({
  isOpen,
  onClose,
  point,
  onEdit,
  onOpenIncident,
}) => {
  if (!isOpen || !point) return null;

  const status = evaluatePointOpenStatus(point);
  const contract = getContractDaysRemaining(point.contractEndDate);

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
      <div className="relative w-full max-w-2xl bg-[#0e172a] border border-[#222a3d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#131b2e]">
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
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#171f33] text-[#38bdf8] border border-[#2d3449]">
                  {point.code}
                </span>
                <span className="text-xs text-[#94a3b8] font-semibold">{point.propertyType}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">{point.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-[#222a3d] transition-colors cursor-pointer"
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
              <div className="text-xs text-white/90">{status.statusDescription}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-white/80">{status.timeContext}</div>
            <div className="text-[10px] text-white/60">Horario oficial CAVI</div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Ubicación Geográfica */}
          <div className="p-4 bg-[#131b2e] rounded-xl border border-[#222a3d] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <span className="material-symbols-outlined text-[18px] text-[#38bdf8]">pin_drop</span>
                Ubicación Geográfica y Navegación
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  href="https://www.google.com/maps/d/viewer?mid=1NKLGdlcLM282BzWjh7CnaPJtdn6x42w"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#4edea3] font-bold text-[11px] flex items-center gap-1 transition-colors border border-[#10b981]/30 cursor-pointer"
                  title="Abrir mapa oficial departamental en CAVIMAPS"
                >
                  <span className="material-symbols-outlined text-[14px]">public</span>
                  CAVIMAPS Oficial
                </a>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#0088ff]/15 hover:bg-[#0088ff]/25 text-[#38bdf8] font-bold text-[11px] flex items-center gap-1 transition-colors border border-[#0088ff]/30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">map</span>
                  Punto GPS
                </a>
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#3131c0]/20 hover:bg-[#3131c0]/30 text-[#c0c1ff] font-bold text-[11px] flex items-center gap-1 transition-colors border border-[#3131c0]/40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">navigation</span>
                  Waze
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#cbd5e1]">
              <div>
                <span className="text-[#94a3b8] block text-[11px]">Dirección Completa:</span>
                <span className="font-bold text-white">{point.address}</span>
              </div>
              <div>
                <span className="text-[#94a3b8] block text-[11px]">Municipio y Departamento:</span>
                <span className="font-bold text-white">
                  {point.municipality}, {point.department} ({point.neighborhood})
                </span>
              </div>
            </div>

            {point.reference && (
              <div className="p-2.5 bg-[#171f33] rounded-lg border border-[#2d3449] text-[11px] text-[#94a3b8]">
                <strong className="text-[#cbd5e1]">Referencia / Hito:</strong> {point.reference}
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-[#94a3b8] pt-1">
              <span>Coordenadas GPS:</span>
              <span className="font-mono text-[#38bdf8]">
                Lat: {point.lat.toFixed(5)}, Lng: {point.lng.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Horarios Semanales */}
          <div className="p-4 bg-[#131b2e] rounded-xl border border-[#222a3d] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <span className="material-symbols-outlined text-[18px] text-[#ffb95f]">schedule</span>
                Horarios Semanales de Apertura y Cierre
              </span>
              <span className="text-[11px] text-[#94a3b8]">
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
                        ? 'bg-[#171f33] border-[#2d3449] text-white'
                        : 'bg-[#0b1326]/60 border-[#222a3d] text-[#64748b]'
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
                      <div className="text-xs text-[#94a3b8] italic">Cerrado</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ficha Contractual y Financiera */}
          <div className="p-4 bg-[#131b2e] rounded-xl border border-[#222a3d] space-y-3">
            <span className="font-bold text-white flex items-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-[18px] text-[#4edea3]">description</span>
              Ficha del Contrato de Arrendamiento
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-2.5 bg-[#171f33] rounded-lg border border-[#2d3449]">
                <span className="text-[10px] text-[#94a3b8] block uppercase">Canon Mensual</span>
                <span className="text-sm font-bold text-[#4edea3] font-mono">
                  {formatCOP(point.monthlyRent)}
                </span>
              </div>
              <div className="p-2.5 bg-[#171f33] rounded-lg border border-[#2d3449]">
                <span className="text-[10px] text-[#94a3b8] block uppercase">Administración</span>
                <span className="text-sm font-bold text-white font-mono">
                  {point.adminFee ? formatCOP(point.adminFee) : 'Incluida / $0'}
                </span>
              </div>
              <div className="p-2.5 bg-[#171f33] rounded-lg border border-[#2d3449]">
                <span className="text-[10px] text-[#94a3b8] block uppercase">Área Inmueble</span>
                <span className="text-sm font-bold text-white font-mono">{point.areaSqMeters} m²</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#cbd5e1] pt-1">
              <div>
                <span className="text-[#94a3b8] text-[11px] block">N° Contrato:</span>
                <span className="font-mono font-bold text-white">{point.contractNumber}</span>
              </div>
              <div>
                <span className="text-[#94a3b8] text-[11px] block">Vigencia:</span>
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

          {/* Propietario / Inmobiliaria */}
          <div className="p-4 bg-[#131b2e] rounded-xl border border-[#222a3d] space-y-2">
            <span className="font-bold text-white flex items-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-[18px] text-[#c0c1ff]">contact_phone</span>
              Datos de Contacto del Arrendador
            </span>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div>
                <div className="font-bold text-white text-xs">{point.landlord.name}</div>
                {point.landlord.documentId && (
                  <div className="text-[10px] text-[#94a3b8]">{point.landlord.documentId}</div>
                )}
                {point.landlord.contactPerson && (
                  <div className="text-[11px] text-[#cbd5e1]">
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
                    className="px-3 py-1.5 rounded-lg bg-[#0088ff]/20 hover:bg-[#0088ff]/30 text-[#0088ff] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    Escribir
                  </a>
                )}
              </div>
            </div>

            {(point.electricMeter || point.waterMeter) && (
              <div className="pt-2 border-t border-[#222a3d] grid grid-cols-2 gap-2 text-[11px]">
                {point.electricMeter && (
                  <div>
                    <span className="text-[#94a3b8]">Medidor Luz: </span>
                    <span className="font-mono text-white">{point.electricMeter}</span>
                  </div>
                )}
                {point.waterMeter && (
                  <div>
                    <span className="text-[#94a3b8]">Medidor Agua: </span>
                    <span className="font-mono text-white">{point.waterMeter}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#222a3d] bg-[#131b2e] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenIncident(point)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#ffb4ab] bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 border border-[#ffb4ab]/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">warning</span>
            Novedad de Cierre / Horario
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(point)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar Inmueble
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0088ff] hover:bg-[#0070d8] shadow-md shadow-[#0088ff]/30 transition-all cursor-pointer"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
