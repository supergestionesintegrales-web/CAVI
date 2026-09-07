import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { UserRole } from '../../types';

export type ConfigSectionId =
  | 'macros'
  | 'tema-vial'
  | 'reportes-operaciones'
  | 'reportes'
  | 'sensor-qr'
  | 'red-parametros'
  | 'todas';

export interface ConfigTopSliderProps {
  activeSection: ConfigSectionId;
  onSelectSection: (section: ConfigSectionId) => void;
  filesCount: number;
  currentTheme: 'dark' | 'light';
  userRole?: UserRole;
}

export const ConfigTopSlider: React.FC<ConfigTopSliderProps> = ({
  activeSection,
  onSelectSection,
  filesCount,
  currentTheme,
  userRole = 'administrador',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOperacionesActive =
    activeSection === 'reportes-operaciones' ||
    activeSection === 'reportes' ||
    activeSection === 'sensor-qr' ||
    activeSection === 'red-parametros';

  const isAuxiliar = userRole === 'auxiliar';

  const sections: {
    id: ConfigSectionId;
    title: string;
    shortTitle: string;
    icon: string;
    badgeText?: string;
    badgeColor?: string;
    description: string;
    isActiveMatch?: boolean;
  }[] = isAuxiliar
    ? [
        {
          id: 'tema-vial',
          title: 'Tema de Color & Apariencia',
          shortTitle: 'Cambio de Color',
          icon: 'palette',
          badgeText: currentTheme === 'dark' ? 'Nocturno' : 'Diurno',
          badgeColor: 'bg-[#3131c0]/25 text-[#c0c1ff] border-[#3131c0]/40',
          description: 'Tema oscuro táctico vs tema blanco de alto contraste',
          isActiveMatch: activeSection === 'tema-vial',
        },
        {
          id: 'sensor-qr',
          title: 'Sensor de Campo & Check-in QR',
          shortTitle: 'Sensor de Campo',
          icon: 'qr_code_scanner',
          badgeText: 'Activo',
          badgeColor: 'bg-[#003824] text-[#4edea3] border-[#4edea3]/40',
          description: 'Validación óptica y lectura en terreno',
          isActiveMatch: activeSection === 'sensor-qr' || activeSection === 'reportes-operaciones',
        },
        {
          id: 'red-parametros',
          title: 'Red Comercial La Guajira',
          shortTitle: 'Red Comercial',
          icon: 'storefront',
          badgeText: '15 Municipios',
          badgeColor: 'bg-[#171f33] text-[#dae2fd] border-[#222a3d]',
          description: 'Puntos y cobertura departamental de La Guajira',
          isActiveMatch: activeSection === 'red-parametros',
        },
        {
          id: 'todas',
          title: 'Ver Todo Habilitado',
          shortTitle: 'Ver Todo',
          icon: 'view_agenda',
          badgeText: 'Auxiliar',
          badgeColor: 'bg-[#222a3d] text-[#bbcabf] border-[#222a3d]',
          description: 'Color, Red Comercial y Sensor de Campo',
          isActiveMatch: activeSection === 'todas',
        },
      ]
    : [
        {
          id: 'macros',
          title: 'Alimentador de Macros & Archivos',
          shortTitle: 'Macros & Archivos',
          icon: 'folder_open',
          badgeText: `${filesCount} docs`,
          badgeColor: 'bg-[#0088ff]/15 text-[#0088ff] border-[#0088ff]/30',
          description: 'Subida de carpetas, archivos sueltos y visor',
          isActiveMatch: activeSection === 'macros',
        },
        {
          id: 'tema-vial',
          title: 'Tema Vial & Apariencia',
          shortTitle: 'Tema Vial',
          icon: 'palette',
          badgeText: currentTheme === 'dark' ? 'Nocturno' : 'Diurno',
          badgeColor: 'bg-[#3131c0]/25 text-[#c0c1ff] border-[#3131c0]/40',
          description: 'Modo nocturno táctico vs diurno de alto contraste',
          isActiveMatch: activeSection === 'tema-vial',
        },
        {
          id: 'reportes-operaciones',
          title: 'Reporte XLSX, Sensor QR & Red Guajira (Unificado)',
          shortTitle: 'Reporte XLSX & Sensor QR / Red',
          icon: 'fact_check',
          badgeText: '15 Mpios • QR • XLSX',
          badgeColor: 'bg-[#003824] text-[#4edea3] border-[#4edea3]/40',
          description: 'Consolidado oficial, telemetría sensor QR y red departamental',
          isActiveMatch: isOperacionesActive,
        },
        {
          id: 'todas',
          title: 'Ver Todo',
          shortTitle: 'Ver Todo',
          icon: 'view_agenda',
          badgeText: 'General',
          badgeColor: 'bg-[#222a3d] text-[#bbcabf] border-[#222a3d]',
          description: 'Visualizar todas las secciones continuas',
          isActiveMatch: activeSection === 'todas',
        },
      ];

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-[#131b2e] rounded-2xl border border-[#222a3d] p-2.5 sm:p-3 shadow-md">
      {/* Slider Header / Navigation Indicator */}
      <div className="flex items-center justify-between gap-2 px-1 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#0088ff]/15 flex items-center justify-center text-[#0088ff]">
            <span className="material-symbols-outlined text-[16px]">tune</span>
          </div>
          <span className="text-xs font-bold text-[#dae2fd] uppercase tracking-wider">
            Secciones de Configuración (Slider Superior)
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Desplazar a la izquierda"
            className="w-7 h-7 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#bbcabf] hover:text-[#dae2fd] flex items-center justify-center transition-colors border border-[#222a3d] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Desplazar a la derecha"
            className="w-7 h-7 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#bbcabf] hover:text-[#dae2fd] flex items-center justify-center transition-colors border border-[#222a3d] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Horizontal Sliding Pills Track */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-0.5 scroll-smooth snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {sections.map((section) => {
          const isActive = section.isActiveMatch ?? (activeSection === section.id);
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection(section.id)}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-left shrink-0 transition-all cursor-pointer snap-start ${
                isActive
                  ? 'bg-[#0088ff] text-white shadow-lg shadow-[#0088ff]/30 ring-1 ring-[#0088ff]'
                  : 'bg-[#171f33] text-[#dae2fd] hover:bg-[#222a3d] border border-[#222a3d]'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#131b2e] text-[#bbcabf]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {section.icon}
                </span>
              </div>

              <div className="flex flex-col min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold whitespace-nowrap ${isActive ? 'text-white' : 'text-[#dae2fd]'}`}>
                    {section.shortTitle}
                  </span>
                  {section.badgeText && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border whitespace-nowrap ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : section.badgeColor
                      }`}
                    >
                      {section.badgeText}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] hidden sm:inline whitespace-nowrap ${
                    isActive ? 'text-blue-100' : 'text-[#bbcabf]'
                  }`}
                >
                  {section.description}
                </span>
              </div>

              {isActive && (
                <motion.span
                  layoutId="active-slider-indicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#0088ff] shadow-[0_0_8px_#0088ff]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
