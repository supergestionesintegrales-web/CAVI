import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckInSuccess: (pointCode: string, pointName: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onCheckInSuccess,
}) => {
  const [scanMode, setScanMode] = useState<'qr' | 'nfc'>('qr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedPoint, setDetectedPoint] = useState<{ code: string; name: string } | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = (code: string, name: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setDetectedPoint({ code, name });
    }, 800);
  };

  const handleConfirmCheckIn = () => {
    if (detectedPoint) {
      onCheckInSuccess(detectedPoint.code, detectedPoint.name);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="w-full max-w-sm sm:max-w-md bg-[#131b2e] border border-[#2d3449] rounded-2xl p-5 shadow-2xl flex flex-col text-[#dae2fd] overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#222a3d]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4edea3]">qr_code_scanner</span>
              <h3 className="font-bold text-base text-[#dae2fd]">Check-in Punto de Control</h3>
            </div>
            <button
              onClick={onClose}
              className="text-[#bbcabf] hover:text-white p-1 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#060e20] rounded-xl my-4 text-xs font-semibold">
            <button
              onClick={() => setScanMode('qr')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                scanMode === 'qr'
                  ? 'bg-[#10b981] text-[#003824] shadow'
                  : 'text-[#bbcabf] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">qr_code</span>
              Escanear QR
            </button>
            <button
              onClick={() => setScanMode('nfc')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                scanMode === 'nfc'
                  ? 'bg-[#10b981] text-[#003824] shadow'
                  : 'text-[#bbcabf] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">contactless</span>
              Lector NFC
            </button>
          </div>

          {/* Scanner Viewport */}
          <div className="relative aspect-square w-full rounded-xl bg-[#060e20] border-2 border-dashed border-[#4edea3]/40 overflow-hidden flex flex-col items-center justify-center p-4">
            {scanMode === 'qr' ? (
              <>
                <div className="absolute inset-x-8 top-10 bottom-10 border border-[#4edea3]/70 rounded-lg pointer-events-none">
                  {/* Scanner line animation */}
                  <motion.div
                    animate={{ y: [0, 160, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#4edea3] to-transparent shadow-[0_0_8px_#4edea3]"
                  />
                </div>
                <span className="material-symbols-outlined text-[48px] text-[#2d3449]">
                  crop_free
                </span>
                <p className="text-xs text-[#bbcabf] text-center mt-3 z-10">
                  Alinea el código QR de la placa de auditoría física dentro del marco
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                  className="w-20 h-20 rounded-full bg-[#3131c0]/20 flex items-center justify-center text-[#c0c1ff] mb-3"
                >
                  <span className="material-symbols-outlined text-[40px]">contactless</span>
                </motion.div>
                <p className="text-xs text-[#bbcabf]">
                  Acerca el dispositivo al chip NFC en la puerta o mostrador
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-[#060e20]/90 flex flex-col items-center justify-center gap-2 z-20">
                <span className="material-symbols-outlined text-[#4edea3] text-[28px] animate-spin">
                  sync
                </span>
                <span className="text-xs font-semibold text-[#4edea3]">Validando geocerca...</span>
              </div>
            )}
          </div>

          {/* Quick Simulation Options */}
          {!detectedPoint ? (
            <div className="mt-3 space-y-1.5">
              <span className="text-[11px] font-semibold text-[#dae2fd] uppercase tracking-wider block">
                Simular lectura de campo (La Guajira):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleSimulateScan('CM-108', 'Riohacha Centro')}
                  className="p-2 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-left text-xs border border-[#2d3449]/60 transition-colors"
                >
                  <span className="font-bold text-[#4edea3] block">CM-108</span>
                  <span className="text-[10px] text-[#dae2fd] truncate block">Riohacha Centro</span>
                </button>
                <button
                  onClick={() => handleSimulateScan('PF-042', 'Maicao Frontera')}
                  className="p-2 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-left text-xs border border-[#2d3449]/60 transition-colors"
                >
                  <span className="font-bold text-[#c0c1ff] block">PF-042</span>
                  <span className="text-[10px] text-[#dae2fd] truncate block">Maicao Frontera</span>
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-[#171f33] rounded-xl border border-[#4edea3]/40 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4edea3] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Punto Verificado
                </span>
                <span className="text-[10px] text-[#bbcabf]">GPS: ±2 metros</span>
              </div>
              <div>
                <p className="font-bold text-sm text-[#dae2fd]">{detectedPoint.code} - {detectedPoint.name}</p>
                <p className="text-[11px] text-[#bbcabf]">Coordenadas registradas y sincronizadas con CAVI</p>
              </div>
              <button
                onClick={handleConfirmCheckIn}
                className="w-full py-2.5 rounded-lg bg-[#10b981] text-[#003824] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all mt-1"
              >
                <span className="material-symbols-outlined text-[16px]">task_alt</span>
                Registrar Check-In
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
