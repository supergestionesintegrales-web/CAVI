import React, { useState } from 'react';
import { Auditor, FormatType, RouteStep } from '../types';

export interface ActiveRoutePointOption {
  id: string;
  code: string;
  name: string;
  format: FormatType;
  channel?: string;
  address: string;
  municipality?: string;
  lat?: number;
  lng?: number;
  zone?: 'Norte' | 'Centro' | 'Sur';
}

interface AddRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (step: Omit<RouteStep, 'id'>) => void;
  auditors: Auditor[];
  defaultAuditorId?: string;
  availablePoints?: ActiveRoutePointOption[];
}

export const AddRouteModal: React.FC<AddRouteModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  auditors,
  defaultAuditorId,
  availablePoints = [],
}) => {
  const [auditorId, setAuditorId] = useState<string>(defaultAuditorId || auditors[0]?.id || 'aud-1');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [format, setFormat] = useState<FormatType>('CM');
  const [address, setAddress] = useState('');
  const [time, setTime] = useState('08:30');
  const [sla, setSla] = useState('SLA: 48h');
  const [notes, setNotes] = useState('');
  const [pointSearch, setPointSearch] = useState('');
  const [selectedPointId, setSelectedPointId] = useState('');
  const [showPointResults, setShowPointResults] = useState(false);

  if (!isOpen) return null;

  const filteredPointOptions = availablePoints
    .filter((point) => {
      const q = pointSearch.trim().toLowerCase();
      if (!q) return true;
      return [
        point.name,
        point.code,
        point.municipality,
        point.address,
        point.channel,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
    })
    .slice(0, 12);

  const handleSelectPoint = (point: ActiveRoutePointOption) => {
    setSelectedPointId(point.id);
    setPointSearch(point.name);
    setName(point.name);
    setCode(point.code);
    setFormat(point.format);
    setAddress(point.address);
    setShowPointResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (availablePoints.length > 0 && !selectedPointId)) return;

    const selectedAuditor = auditors.find((a) => a.id === auditorId) || auditors[0];

    onAdd({
      code: code.trim() || `${format}-${Math.floor(10 + Math.random() * 90)}`,
      name: name.trim(),
      format,
      address: address.trim() || 'La Guajira',
      time: time || '09:00',
      sla: sla || 'SLA 48h',
      notes: notes.trim() || undefined,
      status: 'pending',
      auditorId: selectedAuditor.id,
      auditorName: selectedAuditor.name,
      channel: availablePoints.find((p) => p.id === selectedPointId)?.channel,
      municipality: availablePoints.find((p) => p.id === selectedPointId)?.municipality,
      lat: availablePoints.find((p) => p.id === selectedPointId)?.lat,
      lng: availablePoints.find((p) => p.id === selectedPointId)?.lng,
      hasGps: availablePoints.find((p) => p.id === selectedPointId)?.lat !== undefined && availablePoints.find((p) => p.id === selectedPointId)?.lng !== undefined,
      zone: availablePoints.find((p) => p.id === selectedPointId)?.zone,
    });

    // Reset form
    setName('');
    setCode('');
    setAddress('');
    setNotes('');
    setPointSearch('');
    setSelectedPointId('');
    setShowPointResults(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#171f33] border border-[#2d3a58] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#131b2e] border-b border-[#222a3d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0088ff]/20 text-[#0088ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-[#f8fafc]">
                Agregar Parada Real a la Ruta
              </h3>
              <p className="text-[11px] text-[#cbd5e1]">
                Ingresa los datos reales del punto de auditoría
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#222a3d] hover:bg-[#2d3a58] text-[#cbd5e1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* Auditor Asignado */}
          <div>
            <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
              Auditor Asignado *
            </label>
            <select
              value={auditorId}
              onChange={(e) => setAuditorId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs font-medium focus:outline-none focus:border-[#0088ff]"
            >
              {auditors.map((aud) => (
                <option key={aud.id} value={aud.id}>
                  {aud.name} ({aud.code}) - Zona {aud.zone}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre Establecimiento & Código */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
                Nombre de Sede / Punto *
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-[17px]">
                  search
                </span>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Buscar sede, punto, código o municipio..."
                  value={pointSearch}
                  onFocus={() => setShowPointResults(true)}
                  onChange={(e) => {
                    setPointSearch(e.target.value);
                    setSelectedPointId('');
                    setName('');
                    setCode('');
                    setShowPointResults(true);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#131b2e] border border-[#0088ff]/70 text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#38bdf8]"
                />
              </div>

              {showPointResults && availablePoints.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1 rounded-xl bg-[#101a2e] border border-[#2d3a58] shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                  {filteredPointOptions.length > 0 ? (
                    filteredPointOptions.map((point) => (
                      <button
                        key={point.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectPoint(point)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#1b2944] border-b border-[#222a3d] last:border-b-0 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-[#38bdf8] bg-[#0088ff]/10 border border-[#0088ff]/20 rounded px-1.5 py-0.5">
                            {point.code}
                          </span>
                          <span className="text-xs font-bold text-white truncate">{point.name}</span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#94a3b8] truncate">
                          {point.municipality || 'Sin municipio'} · {point.channel || point.format} · {point.address || 'Sin dirección'}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-[11px] text-[#94a3b8] text-center">
                      No hay coincidencias en la data activa.
                    </div>
                  )}
                </div>
              )}

              {availablePoints.length > 0 && !selectedPointId && pointSearch && (
                <p className="mt-1 text-[9px] text-[#ffb95f]">
                  Selecciona un punto de la lista para continuar.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
                Código Punto
              </label>
              <input
                type="text"
                readOnly={availablePoints.length > 0}
                placeholder="Se carga al seleccionar"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs font-mono placeholder-[#64748b] focus:outline-none focus:border-[#0088ff] read-only:opacity-80"
              />
            </div>
          </div>

          {/* Formato & Horario */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
                Formato de Red *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['CM', 'PF', 'CDA'] as FormatType[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      format === fmt
                        ? fmt === 'CM'
                          ? 'bg-[#0284c7] text-white'
                          : fmt === 'PF'
                          ? 'bg-[#7c3aed] text-white'
                          : 'bg-[#0088ff] text-white'
                        : 'bg-[#131b2e] text-[#cbd5e1] border border-[#2d3a58] hover:border-[#475569]'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
                Horario Estimado
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs font-mono focus:outline-none focus:border-[#0088ff]"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
              Dirección y Municipio *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Calle 15 #8-45, Mercado Nuevo, Riohacha"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#0088ff]"
            />
          </div>

          {/* SLA & Observaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
                SLA / Ventana
              </label>
              <input
                type="text"
                placeholder="Ej. SLA: 24h restantes"
                value={sla}
                onChange={(e) => setSla(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#0088ff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
                Notas de Campo (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Revisión de pesaje o inventario"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#0088ff]"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-[#cbd5e1] text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Guardar Parada Real</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
