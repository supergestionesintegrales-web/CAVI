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
  const [municipality, setMunicipality] = useState('Riohacha');
  const [zone, setZone] = useState<'Norte' | 'Centro' | 'Sur'>('Norte');
  const [priority, setPriority] = useState<'Urgente' | 'Alta' | 'Media' | 'Baja'>('Alta');
  const [sla, setSla] = useState('SLA Urgente (<24h)');
  const [details, setDetails] = useState('');
  const [daysWithoutVisit, setDaysWithoutVisit] = useState<number>(75);
  const [alertCategory, setAlertCategory] = useState<
    'sin_visita_2_3_meses' | 'critico_mas_3_meses' | 'inventario_discrepancia' | 'precio_no_conforme' | 'sla_vencido' | 'ninguna'
  >('sin_visita_2_3_meses');
  const [alertDescription, setAlertDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      code: code.trim() || `${format}-${Math.floor(10 + Math.random() * 90)}`,
      name: name.trim(),
      format,
      address: address.trim() || `${municipality}, La Guajira`,
      municipality,
      zone,
      priority,
      sla: sla || 'Prioridad Normal',
      details: details.trim() || undefined,
      daysWithoutVisit: Number(daysWithoutVisit) || 0,
      alertCategory,
      alertDescription: alertDescription.trim() || (alertCategory !== 'ninguna' ? `${daysWithoutVisit} días sin visita presencial en ${municipality}` : undefined),
      hasGps: true,
    });

    setName('');
    setCode('');
    setAddress('');
    setDetails('');
    setAlertDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#171f33] border border-[#2d3a58] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#131b2e] border-b border-[#222a3d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#dc2626]/20 text-[#f87171] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">add_alert</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-[#f8fafc]">
                Nuevo Punto con Alerta / Rezagado
              </h3>
              <p className="text-[11px] text-[#cbd5e1]">
                Registra un PDV con mora de visitas (2 a 3 meses) o alerta operativa para despacho
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
                placeholder="Ej. Supertienda Maicao Central"
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

          {/* Municipio & Zona */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
                Municipio (La Guajira)
              </label>
              <select
                value={municipality}
                onChange={(e) => {
                  const val = e.target.value;
                  setMunicipality(val);
                  if (['Riohacha', 'Manaure', 'Uribia', 'Dibulla'].includes(val)) setZone('Norte');
                  else if (['Maicao', 'Albania', 'Hatonuevo', 'Barrancas', 'Distracción'].includes(val)) setZone('Centro');
                  else setZone('Sur');
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs font-medium focus:outline-none focus:border-[#0088ff]"
              >
                <option value="Riohacha">Riohacha (Norte)</option>
                <option value="Maicao">Maicao (Centro)</option>
                <option value="Manaure">Manaure (Norte)</option>
                <option value="Uribia">Uribia (Norte)</option>
                <option value="San Juan del Cesar">San Juan del Cesar (Sur)</option>
                <option value="Fonseca">Fonseca (Sur)</option>
                <option value="Villanueva">Villanueva (Sur)</option>
                <option value="Albania">Albania (Centro)</option>
                <option value="Barrancas">Barrancas (Centro)</option>
                <option value="Dibulla">Dibulla (Norte)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
                Zona Operativa
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs font-medium focus:outline-none focus:border-[#0088ff]"
              >
                <option value="Norte">Zona Norte (Samuel Ramos)</option>
                <option value="Centro">Zona Centro (Kleyder Rodriguez)</option>
                <option value="Sur">Zona Sur (Jose Aponte)</option>
              </select>
            </div>
          </div>

          {/* Días sin visita & Categoría de Alerta */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#131b2e] border border-[#2d3a58]">
            <div>
              <label className="block text-xs font-bold text-[#fcd34d] mb-1">
                Días Sin Visita
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={daysWithoutVisit}
                onChange={(e) => setDaysWithoutVisit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3a58] text-white text-xs font-mono focus:outline-none focus:border-[#0088ff]"
              />
              <span className="text-[10px] text-[#94a3b8] mt-1 block">
                {daysWithoutVisit >= 90
                  ? '🔴 >3 meses (Crítico)'
                  : daysWithoutVisit >= 60
                  ? '🟠 2 a 3 meses (Alerta)'
                  : '🟡 < 2 meses'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#fca5a5] mb-1">
                Tipo de Alerta
              </label>
              <select
                value={alertCategory}
                onChange={(e) => setAlertCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3a58] text-white text-xs font-medium focus:outline-none focus:border-[#0088ff]"
              >
                <option value="sin_visita_2_3_meses">Sin visita 2-3 meses (60-90d)</option>
                <option value="critico_mas_3_meses">Sin visita &gt;3 meses (&gt;90d)</option>
                <option value="inventario_discrepancia">Discrepancia Inventario / Stock</option>
                <option value="precio_no_conforme">Desvío de Precios</option>
                <option value="sla_vencido">SLA Vencido</option>
                <option value="ninguna">Sin Alerta Específica</option>
              </select>
            </div>
          </div>

          {/* Descripción de Alerta */}
          <div>
            <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
              Descripción de la Alerta u Observaciones
            </label>
            <input
              type="text"
              placeholder="Ej. Inconsistencia en stock físico de 14 cajas vs reporte central"
              value={alertDescription}
              onChange={(e) => setAlertDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#0088ff]"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-bold text-[#e2e8f0] mb-1">
              Dirección Específica *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Calle 16 #11-24, Barrio Centro"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131b2e] border border-[#2d3a58] text-white text-xs placeholder-[#64748b] focus:outline-none focus:border-[#0088ff]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#cbd5e1] hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_task</span>
              <span>Guardar Punto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
