import React from 'react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const navItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'dashboard-cavi', label: 'Dash & KPIs', icon: 'auto_awesome_mosaic' },
    { id: 'asignacion-rutas', label: 'Rutas', icon: 'alt_route' },
    { id: 'cronograma', label: 'Agenda', icon: 'calendar_today' },
    { id: 'archivos-macros', label: 'Config', icon: 'settings' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe bg-[#060e20]/95 backdrop-blur-xl border-t border-[#171f33]/80 shadow-[0_-2px_12px_rgba(0,0,0,0.45)] md:hidden">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[68px] h-12 transition-all relative ${
                isActive ? 'text-[#4edea3] font-bold scale-105' : 'text-[#bbcabf] hover:text-[#dae2fd]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {item.icon}
              </span>
              <span className="text-[11px] mt-0.5 tracking-tight truncate">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-[#4edea3] shadow-[0_0_8px_#4edea3]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
