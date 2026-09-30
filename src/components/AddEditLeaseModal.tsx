import React, { useState, useEffect } from 'react';
import { LeasePoint, LeasePropertyType, DayHours, WeeklySchedule } from '../types';

interface AddEditLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (point: LeasePoint) => void;
  editingPoint?: LeasePoint | null;
}

const GUAJIRA_MUNICIPALITIES = [
  'Riohacha',
  'Maicao',
  'Uribia',
  'Manaure',
  'Fonseca',
  'San Juan del Cesar',
  'Villanueva',
  'Albania',
  'Hatonuevo',
  'Barrancas',
  'Dibulla',
  'Distracción',
  'El Molino',
  'La Jagua del Pilar',
  'Urumita',
];

const PROPERTY_TYPES: LeasePropertyType[] = [
  'Local Comercial',
  'Isla Comercial',
  'Oficina Administrativa',
  'Centro de Distribución / Bodega',
  'Taquilla / Kiosko',
];

export const AddEditLeaseModal: React.FC<AddEditLeaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPoint,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'horarios' | 'contrato' | 'propietario'>('general');

  // General fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState<LeasePropertyType>('Local Comercial');
  const [operatingStatus, setOperatingStatus] = useState<LeasePoint['operatingStatus']>('open');
  const [municipality, setMunicipality] = useState('Riohacha');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [reference, setReference] = useState('');
  const [lat, setLat] = useState<number>(11.5442);
  const [lng, setLng] = useState<number>(-72.9069);

  // Schedules
  const [weekdayOpen, setWeekdayOpen] = useState('08:00');
  const [weekdayClose, setWeekdayClose] = useState('18:00');
  const [weekdayHasLunch, setWeekdayHasLunch] = useState(true);
  const [weekdayLunchStart, setWeekdayLunchStart] = useState('12:30');
  const [weekdayLunchEnd, setWeekdayLunchEnd] = useState('14:00');

  const [saturdayIsOpen, setSaturdayIsOpen] = useState(true);
  const [saturdayOpen, setSaturdayOpen] = useState('08:30');
  const [saturdayClose, setSaturdayClose] = useState('13:00');

  const [sundayIsOpen, setSundayIsOpen] = useState(false);
  const [sundayOpen, setSundayOpen] = useState('09:00');
  const [sundayClose, setSundayClose] = useState('13:00');

  const [holidayNote, setHolidayNote] = useState('Cerrado en días festivos');

  // Contract fields
  const [contractNumber, setContractNumber] = useState('');
  const [monthlyRent, setMonthlyRent] = useState<number>(3500000);
  const [adminFee, setAdminFee] = useState<number>(0);
  const [areaSqMeters, setAreaSqMeters] = useState<number>(80);
  const [contractStartDate, setContractStartDate] = useState('2024-01-01');
  const [contractEndDate, setContractEndDate] = useState('2026-12-31');

  // Landlord fields
  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [landlordEmail, setLandlordEmail] = useState('');
  const [landlordDoc, setLandlordDoc] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  // Meters
  const [electricMeter, setElectricMeter] = useState('');
  const [waterMeter, setWaterMeter] = useState('');

  useEffect(() => {
    if (editingPoint) {
      setCode(editingPoint.code);
      setName(editingPoint.name);
      setPropertyType(editingPoint.propertyType);
      setOperatingStatus(editingPoint.operatingStatus);
      setMunicipality(editingPoint.municipality);
      setAddress(editingPoint.address);
      setNeighborhood(editingPoint.neighborhood);
      setReference(editingPoint.reference || '');
      setLat(editingPoint.lat);
      setLng(editingPoint.lng);

      const mon = editingPoint.schedule.monday;
      setWeekdayOpen(mon.open);
      setWeekdayClose(mon.close);
      setWeekdayHasLunch(!!mon.hasLunchBreak);
      setWeekdayLunchStart(mon.lunchStart || '12:30');
      setWeekdayLunchEnd(mon.lunchEnd || '14:00');

      const sat = editingPoint.schedule.saturday;
      setSaturdayIsOpen(sat.isOpen);
      setSaturdayOpen(sat.open);
      setSaturdayClose(sat.close);

      const sun = editingPoint.schedule.sunday;
      setSundayIsOpen(sun.isOpen);
      setSundayOpen(sun.open);
      setSundayClose(sun.close);

      setHolidayNote(editingPoint.schedule.holidayNote || '');

      setContractNumber(editingPoint.contractNumber);
      setMonthlyRent(editingPoint.monthlyRent);
      setAdminFee(editingPoint.adminFee || 0);
      setAreaSqMeters(editingPoint.areaSqMeters);
      setContractStartDate(editingPoint.contractStartDate);
      setContractEndDate(editingPoint.contractEndDate);

      setLandlordName(editingPoint.landlord.name);
      setLandlordPhone(editingPoint.landlord.phone);
      setLandlordEmail(editingPoint.landlord.email || '');
      setLandlordDoc(editingPoint.landlord.documentId || '');
      setContactPerson(editingPoint.landlord.contactPerson || '');

      setElectricMeter(editingPoint.electricMeter || '');
      setWaterMeter(editingPoint.waterMeter || '');
    } else {
      const genId = Math.floor(100 + Math.random() * 900);
      setCode(`ARR-GUA-${genId}`);
      setName('');
      setPropertyType('Local Comercial');
      setOperatingStatus('open');
      setMunicipality('Riohacha');
      setAddress('');
      setNeighborhood('');
      setReference('');
      setLat(11.5442);
      setLng(-72.9069);

      setWeekdayOpen('08:00');
      setWeekdayClose('18:00');
      setWeekdayHasLunch(true);
      setWeekdayLunchStart('12:30');
      setWeekdayLunchEnd('14:00');

      setSaturdayIsOpen(true);
      setSaturdayOpen('08:30');
      setSaturdayClose('13:00');

      setSundayIsOpen(false);
      setSundayOpen('09:00');
      setSundayClose('13:00');

      setHolidayNote('Cerrado domingos y festivos');

      setContractNumber(`CTR-2024-${genId}`);
      setMonthlyRent(3200000);
      setAdminFee(0);
      setAreaSqMeters(75);
      setContractStartDate('2024-01-01');
      setContractEndDate('2026-12-31');

      setLandlordName('');
      setLandlordPhone('');
      setLandlordEmail('');
      setLandlordDoc('');
      setContactPerson('');

      setElectricMeter('');
      setWaterMeter('');
    }
    setActiveTab('general');
  }, [editingPoint, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const weekdayHours: DayHours = {
      open: weekdayOpen,
      close: weekdayClose,
      isOpen: true,
      hasLunchBreak: weekdayHasLunch,
      lunchStart: weekdayHasLunch ? weekdayLunchStart : undefined,
      lunchEnd: weekdayHasLunch ? weekdayLunchEnd : undefined,
    };

    const satHours: DayHours = {
      open: saturdayIsOpen ? saturdayOpen : '00:00',
      close: saturdayIsOpen ? saturdayClose : '00:00',
      isOpen: saturdayIsOpen,
      hasLunchBreak: false,
    };

    const sunHours: DayHours = {
      open: sundayIsOpen ? sundayOpen : '00:00',
      close: sundayIsOpen ? sundayClose : '00:00',
      isOpen: sundayIsOpen,
      hasLunchBreak: false,
    };

    const schedule: WeeklySchedule = {
      monday: { ...weekdayHours },
      tuesday: { ...weekdayHours },
      wednesday: { ...weekdayHours },
      thursday: { ...weekdayHours },
      friday: { ...weekdayHours },
      saturday: satHours,
      sunday: sunHours,
      holidayNote,
    };

    const newOrUpdatedPoint: LeasePoint = {
      id: editingPoint ? editingPoint.id : `arr-${Date.now()}`,
      code: code.trim() || `ARR-${Date.now().toString().slice(-4)}`,
      name: name.trim() || 'Punto de Arrendamiento',
      propertyType,
      operatingStatus,
      manualOverrideStatus: editingPoint?.manualOverrideStatus || null,
      statusNotes: editingPoint?.statusNotes || '',
      address: address.trim() || 'Dirección no especificada',
      neighborhood: neighborhood.trim() || 'Centro',
      municipality,
      department: 'La Guajira',
      reference: reference.trim(),
      lat: Number(lat) || 11.5442,
      lng: Number(lng) || -72.9069,
      schedule,
      contractNumber: contractNumber.trim() || `CTR-${Date.now().toString().slice(-4)}`,
      monthlyRent: Number(monthlyRent) || 0,
      adminFee: Number(adminFee) || 0,
      contractStartDate,
      contractEndDate,
      areaSqMeters: Number(areaSqMeters) || 0,
      landlord: {
        name: landlordName.trim() || 'Propietario / Inmobiliaria',
        phone: landlordPhone.trim() || 'Sin registrar',
        email: landlordEmail.trim() || undefined,
        documentId: landlordDoc.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
      },
      electricMeter: electricMeter.trim() || undefined,
      waterMeter: waterMeter.trim() || undefined,
      lastAuditDate: editingPoint?.lastAuditDate || new Date().toISOString().split('T')[0],
      lastAuditorName: editingPoint?.lastAuditorName || 'Administración',
      incidents: editingPoint ? editingPoint.incidents : [],
    };

    onSave(newOrUpdatedPoint);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0e172a] border border-[#222a3d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#131b2e]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0088ff]/20 text-[#0088ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">
                {editingPoint ? 'edit_note' : 'add_business'}
              </span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {editingPoint ? 'Editar Inmueble en Arrendamiento' : 'Registrar Nuevo Punto de Arrendamiento'}
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Gestión de horarios de apertura/cierre, ubicación geográfica y ficha contractual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-[#222a3d] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-2 border-b border-[#222a3d] bg-[#0b1326] overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-[#0088ff] text-white shadow-sm'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#171f33]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">storefront</span>
            General & Ubicación
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('horarios')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'horarios'
                ? 'bg-[#0088ff] text-white shadow-sm'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#171f33]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            Horarios de Apertura y Cierre
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contrato')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'contrato'
                ? 'bg-[#0088ff] text-white shadow-sm'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#171f33]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">contract</span>
            Canon & Contrato
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('propietario')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'propietario'
                ? 'bg-[#0088ff] text-white shadow-sm'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#171f33]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person</span>
            Propietario & Servicios
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                    Código Inmueble *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ej. ARR-RIO-001"
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                    Nombre Comercial / Sede *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Sede Principal Riohacha Centro"
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                    Tipo de Inmueble
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as LeasePropertyType)}
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                    Estado Operativo Base
                  </label>
                  <select
                    value={operatingStatus}
                    onChange={(e) => setOperatingStatus(e.target.value as LeasePoint['operatingStatus'])}
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                  >
                    <option value="open">Operativo Normal (Abre según horario)</option>
                    <option value="closed">Cerrado por Decisión Administrativa</option>
                    <option value="temporarily_closed">Cierre Temporal / Novedad</option>
                    <option value="maintenance">En Mantenimiento / Obras</option>
                    <option value="contract_ended">Contrato Terminado</option>
                  </select>
                </div>
              </div>

              {/* Ubicación */}
              <div className="p-3.5 bg-[#131b2e] rounded-xl border border-[#222a3d] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#38bdf8]">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  Ubicación Geográfica y Dirección
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Municipio *</label>
                    <select
                      value={municipality}
                      onChange={(e) => setMunicipality(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                    >
                      {GUAJIRA_MUNICIPALITIES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Barrio / Sector</label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Ej. Centro Histórico"
                      className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Dirección Física *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Calle 15 #8-42"
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Puntos de Referencia</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej. Frente a la Notaría o diagonal al Parque Principal"
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Latitud GPS</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Longitud GPS</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HORARIOS */}
          {activeTab === 'horarios' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#0088ff]/10 border border-[#0088ff]/30 rounded-xl text-xs text-[#dae2fd] flex items-start gap-2">
                <span className="material-symbols-outlined text-[#0088ff] text-[18px] shrink-0 mt-0.5">
                  info
                </span>
                <div>
                  <span className="font-bold">Reglas de Horario Automático:</span> El sistema calcula si el punto está
                  abierto o cerrado en tiempo real según estos horarios y la hora del dispositivo, considerando receso de
                  almuerzo y días de descanso.
                </div>
              </div>

              {/* Lunes a Viernes */}
              <div className="p-4 bg-[#131b2e] rounded-xl border border-[#222a3d] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#4edea3]">calendar_today</span>
                    Lunes a Viernes (Jornada Principal)
                  </span>
                  <span className="text-[11px] text-[#4edea3] font-bold px-2 py-0.5 rounded bg-[#10b981]/20">
                    Siempre Hábil
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Hora de Apertura</label>
                    <input
                      type="time"
                      value={weekdayOpen}
                      onChange={(e) => setWeekdayOpen(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Hora de Cierre</label>
                    <input
                      type="time"
                      value={weekdayClose}
                      onChange={(e) => setWeekdayClose(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#222a3d]">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={weekdayHasLunch}
                      onChange={(e) => setWeekdayHasLunch(e.target.checked)}
                      className="rounded text-[#0088ff] focus:ring-0 bg-[#171f33] border-[#2d3449]"
                    />
                    <span className="text-xs text-[#cbd5e1] font-semibold">
                      Cierra al mediodía por receso de almuerzo
                    </span>
                  </label>

                  {weekdayHasLunch && (
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      <div>
                        <label className="block text-[11px] text-[#94a3b8] mb-1">Inicio Cierre Almuerzo</label>
                        <input
                          type="time"
                          value={weekdayLunchStart}
                          onChange={(e) => setWeekdayLunchStart(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#94a3b8] mb-1">Reapertura Tarde</label>
                        <input
                          type="time"
                          value={weekdayLunchEnd}
                          onChange={(e) => setWeekdayLunchEnd(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sábados */}
              <div className="p-4 bg-[#131b2e] rounded-xl border border-[#222a3d] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#ffb95f]">wb_twilight</span>
                    Sábados
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={saturdayIsOpen}
                      onChange={(e) => setSaturdayIsOpen(e.target.checked)}
                      className="rounded text-[#0088ff] focus:ring-0"
                    />
                    <span className={saturdayIsOpen ? 'text-[#4edea3] font-bold' : 'text-[#94a3b8]'}>
                      {saturdayIsOpen ? 'Abre este día' : 'Cerrado'}
                    </span>
                  </label>
                </div>

                {saturdayIsOpen && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#94a3b8] mb-1">Hora de Apertura</label>
                      <input
                        type="time"
                        value={saturdayOpen}
                        onChange={(e) => setSaturdayOpen(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#94a3b8] mb-1">Hora de Cierre</label>
                      <input
                        type="time"
                        value={saturdayClose}
                        onChange={(e) => setSaturdayClose(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Domingos & Festivos */}
              <div className="p-4 bg-[#131b2e] rounded-xl border border-[#222a3d] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">event_busy</span>
                    Domingos
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={sundayIsOpen}
                      onChange={(e) => setSundayIsOpen(e.target.checked)}
                      className="rounded text-[#0088ff] focus:ring-0"
                    />
                    <span className={sundayIsOpen ? 'text-[#4edea3] font-bold' : 'text-[#94a3b8]'}>
                      {sundayIsOpen ? 'Abre domingos' : 'Cerrado domingos'}
                    </span>
                  </label>
                </div>

                {sundayIsOpen && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#94a3b8] mb-1">Hora Apertura Domingo</label>
                      <input
                        type="time"
                        value={sundayOpen}
                        onChange={(e) => setSundayOpen(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#94a3b8] mb-1">Hora Cierre Domingo</label>
                      <input
                        type="time"
                        value={sundayClose}
                        onChange={(e) => setSundayClose(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-[#222a3d]">
                  <label className="block text-xs text-[#94a3b8] mb-1">Política en Días Festivos</label>
                  <input
                    type="text"
                    value={holidayNote}
                    onChange={(e) => setHolidayNote(e.target.value)}
                    placeholder="Ej. Cerrado festivos / Jornada continua 10:00 a 16:00"
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTRATO */}
          {activeTab === 'contrato' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                    N° Contrato de Arrendamiento *
                  </label>
                  <input
                    type="text"
                    required
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    placeholder="Ej. CTR-2024-RIO-01"
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                    Área del Inmueble (m²)
                  </label>
                  <input
                    type="number"
                    value={areaSqMeters}
                    onChange={(e) => setAreaSqMeters(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                    Canon Mensual de Arriendo (COP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(parseFloat(e.target.value))}
                    placeholder="Ej. 3500000"
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                  />
                  <p className="text-[10px] text-[#94a3b8] mt-1">
                    Valor base pactado en el contrato de arrendamiento
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                    Cuota de Administración (COP)
                  </label>
                  <input
                    type="number"
                    value={adminFee}
                    onChange={(e) => setAdminFee(parseFloat(e.target.value))}
                    placeholder="0 si no aplica"
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                    Fecha de Inicio Contrato
                  </label>
                  <input
                    type="date"
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1">
                    Fecha de Vencimiento Contrato *
                  </label>
                  <input
                    type="date"
                    required
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROPIETARIO */}
          {activeTab === 'propietario' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#131b2e] rounded-xl border border-[#222a3d] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#38bdf8]">
                  <span className="material-symbols-outlined text-[16px]">account_box</span>
                  Datos del Arrendador / Inmobiliaria
                </div>

                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">
                    Nombre del Propietario / Razón Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={landlordName}
                    onChange={(e) => setLandlordName(e.target.value)}
                    placeholder="Ej. Inmobiliaria Guajira Real / Don Alfonso Romero"
                    className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Teléfono de Contacto *</label>
                    <input
                      type="text"
                      required
                      value={landlordPhone}
                      onChange={(e) => setLandlordPhone(e.target.value)}
                      placeholder="+57 301 ..."
                      className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={landlordEmail}
                      onChange={(e) => setLandlordEmail(e.target.value)}
                      placeholder="arriendos@ejemplo.com"
                      className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">NIT / Cédula Propietario</label>
                    <input
                      type="text"
                      value={landlordDoc}
                      onChange={(e) => setLandlordDoc(e.target.value)}
                      placeholder="NIT 900... o CC ..."
                      className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Persona de Contacto In Situ</label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Administrador local / celador"
                      className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs focus:border-[#0088ff] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#131b2e] rounded-xl border border-[#222a3d] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#ffb95f]">
                  <span className="material-symbols-outlined text-[16px]">electric_meter</span>
                  Matrículas y Medidores de Servicios Públicos
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Medidor Eléctrico (AIR-E)</label>
                    <input
                      type="text"
                      value={electricMeter}
                      onChange={(e) => setElectricMeter(e.target.value)}
                      placeholder="Ej. AIR-E #88492014"
                      className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Medidor / Conexión de Agua</label>
                    <input
                      type="text"
                      value={waterMeter}
                      onChange={(e) => setWaterMeter(e.target.value)}
                      placeholder="Ej. ASAA #192044 o Pozo"
                      className="w-full px-3 py-2 rounded-xl bg-[#171f33] border border-[#2d3449] text-white text-xs font-mono focus:border-[#0088ff] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-[#222a3d] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94a3b8] hover:text-white hover:bg-[#171f33] transition-colors"
            >
              Cancelar
            </button>
            <div className="flex items-center gap-2">
              {activeTab !== 'general' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'propietario') setActiveTab('contrato');
                    else if (activeTab === 'contrato') setActiveTab('horarios');
                    else if (activeTab === 'horarios') setActiveTab('general');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#cbd5e1] bg-[#171f33] hover:bg-[#222a3d] transition-colors"
                >
                  Anterior
                </button>
              )}
              {activeTab !== 'propietario' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'general') setActiveTab('horarios');
                    else if (activeTab === 'horarios') setActiveTab('contrato');
                    else if (activeTab === 'contrato') setActiveTab('propietario');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0088ff] hover:bg-[#0070d8] shadow-md shadow-[#0088ff]/30 transition-all flex items-center gap-1"
                >
                  Siguiente
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#10b981] hover:bg-[#059669] shadow-md shadow-[#10b981]/30 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {editingPoint ? 'Guardar Cambios' : 'Registrar Inmueble'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
