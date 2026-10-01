import React, { useState, useRef } from 'react';
import { CaviPoint, getPointTypeMeta, POINT_TYPE_CONFIG } from '../types/caviMap';
import { parsePointsFromText, generateTxtTemplate, sanitizeCoordinates, deduceMunicipality, deduceSubregion } from '../utils/kmlTxtParser';

interface ImportPointTxtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPointsImported: (points: CaviPoint[], mode: 'append' | 'replace') => void;
  onShowToast?: (title: string, message: string, type: 'info' | 'success' | 'alert') => void;
  existingPointsCount?: number;
}

export const ImportPointTxtModal: React.FC<ImportPointTxtModalProps> = ({
  isOpen,
  onClose,
  onPointsImported,
  onShowToast,
  existingPointsCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'manual'>('upload');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [previewPoints, setPreviewPoints] = useState<CaviPoint[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual point form state
  const [manualForm, setManualForm] = useState({
    name: '',
    codePdv: '',
    lat: '',
    lng: '',
    channel: 'CM',
    municipality: 'Riohacha',
    address: '',
    category: 'Puntos Agregados Manualmente',
  });

  if (!isOpen) return null;

  const handleProcessText = (text: string, sourceName = 'archivo.txt') => {
    const result = parsePointsFromText(text, sourceName);
    setPreviewPoints(result.points);
    setParseErrors(result.errors);

    if (result.points.length === 0) {
      if (onShowToast) {
        onShowToast(
          'Sin puntos detectados',
          'No se encontraron coordenadas válidas (Latitud/Longitud) en el contenido.',
          'alert'
        );
      }
    } else if (onShowToast) {
      onShowToast(
        'Puntos Analizados',
        `Se detectaron ${result.points.length} puntos listos para cargar al mapa.`,
        'info'
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      handleProcessText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      handleProcessText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const template = generateTxtTemplate();
    const blob = new Blob([template], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_puntos_guadit.txt';
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast('Plantilla Descargada', 'Guarda el archivo, agrega tus puntos y vuelve a subirlo.', 'success');
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const rawLat = parseFloat(manualForm.lat);
    const rawLng = parseFloat(manualForm.lng);

    if (isNaN(rawLat) || isNaN(rawLng)) {
      if (onShowToast) onShowToast('Error', 'Ingresa valores numéricos válidos para latitud y longitud.', 'alert');
      return;
    }

    if (!manualForm.name.trim()) {
      if (onShowToast) onShowToast('Error', 'El nombre del punto es obligatorio.', 'alert');
      return;
    }

    const sanitized = sanitizeCoordinates(rawLat, rawLng);
    const mun = manualForm.municipality || deduceMunicipality(manualForm.name);
    const subregion = deduceSubregion(mun, manualForm.category);

    const newPoint: CaviPoint = {
      id: `manual-pt-${Date.now()}`,
      name: manualForm.name.trim(),
      codePdv: manualForm.codePdv.trim() || `PDV-${Date.now().toString().slice(-4)}`,
      lat: sanitized.lat,
      lng: sanitized.lng,
      channel: manualForm.channel,
      municipality: mun,
      address: manualForm.address.trim(),
      category: manualForm.category,
      subregion,
    };

    onPointsImported([newPoint], 'append');
    if (onShowToast) {
      onShowToast('Punto Creado', `Se añadió "${newPoint.name}" al mapa táctico.`, 'success');
    }
    onClose();
  };

  const handleConfirmImport = () => {
    if (previewPoints.length === 0) {
      if (onShowToast) onShowToast('Atención', 'No hay puntos para importar.', 'alert');
      return;
    }

    onPointsImported(previewPoints, importMode);
    if (onShowToast) {
      onShowToast(
        'Carga Exitosa',
        `Se ${importMode === 'append' ? 'añadieron' : 'cargaron'} ${previewPoints.length} puntos nuevos al mapa territorial.`,
        'success'
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/55 backdrop-blur-md flex items-start justify-center px-3 sm:px-5 pt-[82px] pb-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-98px)]">
        {/* MODAL HEADER */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0088ff] text-white flex items-center justify-center shadow-lg shadow-[#0088ff]/30">
              <span className="material-symbols-outlined text-[22px]">upload_file</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-wide">
                  Cargar Puntos Territoriales (.txt / KML)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0088ff]/20 text-[#38bdf8] border border-[#0088ff]/40">
                  CAVIMAPS Nativo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Añade nuevos puntos de venta cargando un archivo <strong>.txt</strong> o <strong>.kml</strong> sin depender de iframes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* TABS SELECTOR */}
        <div className="px-4 pt-3 bg-white border-b border-slate-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-t border-x ${
              activeTab === 'upload'
                ? 'bg-slate-50 border-slate-200 text-[#38bdf8]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">file_upload</span>
            <span>Subir Archivo .txt / .kml</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-t border-x ${
              activeTab === 'paste'
                ? 'bg-slate-50 border-slate-200 text-[#38bdf8]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">content_paste</span>
            <span>Pegar Texto o KML</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-t border-x ${
              activeTab === 'manual'
                ? 'bg-slate-50 border-slate-200 text-[#38bdf8]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">add_location</span>
            <span>Añadir Punto Único</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: UPLOAD FILE (.txt / .kml) */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#0088ff] bg-[#0088ff]/10 scale-[1.01]'
                    : 'border-slate-200 hover:border-[#0088ff]/50 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.kml,.xml,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-[#0088ff]/20 text-[#38bdf8] border border-[#0088ff]/30 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-[30px]">cloud_upload</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  Arrastra tu archivo <span className="text-[#38bdf8]">.txt</span> o <span className="text-[#38bdf8]">.kml</span> aquí
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Admite texto estructurado con nombre, latitud, longitud y canal, o exportaciones KML de Google Earth / Maps.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-300">
                    Seleccionar desde tu dispositivo
                  </span>
                </div>
              </div>

              {/* Template Download Utility */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#fcd34d] text-[18px]">description</span>
                  <span className="text-slate-700">¿Necesitas un formato de ejemplo?</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#38bdf8] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  <span>Descargar Plantilla .txt</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE RAW TEXT / KML */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Pega el texto con coordenadas o código KML:
              </label>
              <textarea
                value={fileContent}
                onChange={(e) => {
                  setFileContent(e.target.value);
                  handleProcessText(e.target.value, 'texto-pegado.txt');
                }}
                placeholder={`Pega aquí el contenido de tu archivo .txt o KML:\n\nNOMBRE: Punto Nuevo\nLATITUD: 11.5435\nLONGITUD: -72.9089\nCANAL: CM\nMUNICIPIO: Riohacha\n\no formato CSV: Nombre, 11.5435, -72.9089, CM, Riohacha`}
                rows={8}
                className="w-full bg-slate-50 text-slate-900 font-mono text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0088ff] resize-none leading-relaxed"
              />
            </div>
          )}

          {/* TAB 3: MANUAL FORM FOR A SINGLE POINT */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualAdd} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre del Punto *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    placeholder="Ej. Tienda Los Guajiros"
                    className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0088ff]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Código PDV</label>
                  <input
                    type="text"
                    value={manualForm.codePdv}
                    onChange={(e) => setManualForm({ ...manualForm, codePdv: e.target.value })}
                    placeholder="Ej. 47820"
                    className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0088ff]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Latitud (Norte) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={manualForm.lat}
                    onChange={(e) => setManualForm({ ...manualForm, lat: e.target.value })}
                    placeholder="Ej. 11.373769"
                    className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0088ff]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Longitud (Oeste) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={manualForm.lng}
                    onChange={(e) => setManualForm({ ...manualForm, lng: e.target.value })}
                    placeholder="Ej. -72.233731"
                    className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0088ff]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Canal de Distribución</label>
                  <select
                    value={manualForm.channel}
                    onChange={(e) => setManualForm({ ...manualForm, channel: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0088ff]"
                  >
                    <option value="CDA"> CDA (Centro de Acopio / Principal)</option>
                    <option value="PF"> PF (Punto Fijo)</option>
                    <option value="CM"> CM (Canal Tradicional / Tienda)</option>
                    <option value="Bancario"> Bancario (Corresponsalía Bancaria)</option>
                    <option value="ETC"> ETC (Otro Punto de Venta)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Municipio</label>
                  <select
                    value={manualForm.municipality}
                    onChange={(e) => setManualForm({ ...manualForm, municipality: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0088ff]"
                  >
                    <option value="Riohacha">Riohacha</option>
                    <option value="Maicao">Maicao</option>
                    <option value="Uribia">Uribia</option>
                    <option value="Manaure">Manaure</option>
                    <option value="Albania">Albania</option>
                    <option value="Dibulla">Dibulla</option>
                    <option value="Barrancas">Barrancas</option>
                    <option value="Hatonuevo">Hatonuevo</option>
                    <option value="Fonseca">Fonseca</option>
                    <option value="San Juan del Cesar">San Juan del Cesar</option>
                    <option value="Distracción">Distracción</option>
                    <option value="El Molino">El Molino</option>
                    <option value="Villanueva">Villanueva</option>
                    <option value="Urumita">Urumita</option>
                    <option value="La Jagua del Pilar">La Jagua del Pilar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Dirección / Referencia</label>
                <input
                  type="text"
                  value={manualForm.address}
                  onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                  placeholder="Ej. Calle 12 con Carrera 8 Esquina"
                  className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0088ff]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0088ff]/30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Guardar y Agregar al Mapa</span>
                </button>
              </div>
            </form>
          )}

          {/* PREVIEW OF PARSED POINTS */}
          {activeTab !== 'manual' && previewPoints.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#10b981]">checklist</span>
                  <span>Puntos Detectados ({previewPoints.length})</span>
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Modo:</span>
                  <label className="inline-flex items-center gap-1 text-[11px] text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-[#0088ff]"
                    />
                    <span>Sumar a existentes ({existingPointsCount})</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-[11px] text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-[#0088ff]"
                    />
                    <span>Reemplazar lista</span>
                  </label>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-200">
                {previewPoints.slice(0, 50).map((pt, idx) => {
                  const meta = getPointTypeMeta(pt.channel, pt.category);
                  return (
                    <div key={pt.id || idx} className="p-2 sm:px-3 text-xs flex items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-[10px] text-slate-500 font-bold shrink-0">{idx + 1}.</span>
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-900 shrink-0 shadow-sm"
                          style={{ backgroundColor: meta.color }}
                          title={`${meta.label} - ${meta.fullLabel}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[9px] font-extrabold px-1.5 py-0.2 rounded text-slate-900"
                              style={{ backgroundColor: meta.bgColor }}
                            >
                              {meta.label}
                            </span>
                            <p className="font-semibold text-slate-900 truncate">{pt.name}</p>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {pt.municipality} · Canal: <strong className="text-slate-700">{meta.fullLabel}</strong>
                            {pt.codePdv ? ` · Cod: ${pt.codePdv}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono text-[10px] text-slate-700">
                        {pt.lat.toFixed(4)}, {pt.lng.toFixed(4)}
                      </div>
                    </div>
                  );
                })}
                {previewPoints.length > 50 && (
                  <div className="p-2 text-center text-[11px] text-slate-500 italic bg-slate-50">
                    + {previewPoints.length - 50} puntos adicionales listos para importar...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PARSE ERRORS IF ANY */}
          {parseErrors.length > 0 && (
            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-[11px] text-rose-300">
              <span className="font-bold block mb-1">Avisos del procesador:</span>
              <ul className="list-disc pl-4 space-y-0.5 max-h-24 overflow-y-auto">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        {activeTab !== 'manual' && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <div className="text-xs text-slate-500">
              {previewPoints.length > 0 ? (
                <span>
                  Total a incorporar: <strong className="text-slate-900">{previewPoints.length} puntos</strong>
                </span>
              ) : (
                <span>Carga un archivo o pega el texto arriba para continuar</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={previewPoints.length === 0}
                onClick={handleConfirmImport}
                className={`px-4 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0088ff]/30 transition-all cursor-pointer ${
                  previewPoints.length === 0 ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
                <span>Incorporar al Mapa ({previewPoints.length})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
