import React, { useState } from 'react';
import { FormatType, FloatingPoint } from '../types';

interface AddFloatingPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (fp: Omit<FloatingPoint, 'id'>) => void;
}

export const AddFloatingPointModal: React.FC<AddFloatingPointModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [format, setFormat] = useState<FormatType>('CM');
  const [address, setAddress] = useState('');
  const [priority, setPriority] = useState<'Urgente' | 'Alta' | 'Media' | 'Baja'>('Alta');
  const [sla, setSla] = useState('SLA Urgente (<24h)');
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      code: code.trim() || `${format}-${Math.floor(10 + Math.random() * 90)}`,
      name: name.trim(),
      format,
      address: address.trim() || 'La Guajira',
      priority,
      sla: sla || 'Prioridad Normal',
      details: details.trim() || undefined,
    });

    setName('');
    setCode('');
    setAddress('');
    setDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#171f33] border border-[#2d3a58] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#131b2e] border-b border-[#222a3d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ffb95f]/20 text-[#ffb95f] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">push_pin</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-[#f8fafc]">
                Nuevo Punto Flotante Real
              </h3>
              <p className="text-[11px] text-[#cbd5e1]">
                Punto sin asignar que requiere balanceo o despacho
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
          {/* Nombre & Código */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
                Nombre del Punto *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Droguería Central Maicao"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#0088ff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
                Código
              </label>
              <input
                type="text"
                placeholder="Ej. CM-102"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs font-mono placeholder-[#64748b] focus:outline-none focus:border-[#0088ff]"
              />
            </div>
          </div>

          {/* Formato & Prioridad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
                Formato *
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
                          : 'bg-[#059669] text-white'
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
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs font-medium focus:outline-none focus:border-[#0088ff]"
              >
                <option value="Urgente">Urgente (&lt;24h)</option>
                <option value="Alta">Alta (24h - 48h)</option>
                <option value="Media">Media (72h)</option>
                <option value="Baja">Baja</option>
              </select>
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
              placeholder="Ej. Calle 16 #11-24, Maicao"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#0088ff]"
            />
          </div>

          {/* SLA & Motivo */}
          <div>
            <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
              Motivo o Detalle de Despacho
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Mora acumulada de inspección o solicitud de re-auditoría"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#0088ff]"
            />
          </div>

          {/* Actions */}
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
              className="px-5 py-2 rounded-xl bg-[#ffb95f] hover:bg-[#ffc887] text-[#523200] text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Guardar Punto Flotante</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
