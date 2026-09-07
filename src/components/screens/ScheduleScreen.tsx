import React, { useState, useMemo } from 'react';
import { getScheduleForDay, AuditorDaySchedule, ScheduledPoint } from '../../data/scheduleData';

interface ScheduleScreenProps {
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ onShowToast }) => {
  // Real dynamic dates based on current system time
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  // Filters & State
  const [selectedAuditorFilter, setSelectedAuditorFilter] = useState<string>('all');
  const [pointSearch, setPointSearch] = useState<string>('');
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [weekSubView, setWeekSubView] = useState<'day' | 'matrix'>('day');
  const [selectedPointForModal, setSelectedPointForModal] = useState<ScheduledPoint | null>(null);
  const [isAiFixApplied, setIsAiFixApplied] = useState(false);
  const [isApplyingFix, setIsApplyingFix] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  // Lists start folded (plegadas) by default; click to unfold
  const [expandedAuditorIds, setExpandedAuditorIds] = useState<string[]>([]);

  const toggleAuditor = (id: string) => {
    setExpandedAuditorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExpandAll = () => {
    setExpandedAuditorIds(dailySchedule.map((a) => a.auditorId));
  };

  const handleCollapseAll = () => {
    setExpandedAuditorIds([]);
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
    setSelectedDay(1);
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  // Calendar calculations
  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0

  // Week navigation & calculations
  const currentWeekDays = useMemo(() => {
    const current = new Date(currentYear, currentMonth, selectedDay);
    const dayOfWeek = (current.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const monday = new Date(current);
    monday.setDate(current.getDate() - dayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentYear, currentMonth, selectedDay]);

  const handlePrevWeek = () => {
    const curr = new Date(currentYear, currentMonth, selectedDay);
    curr.setDate(curr.getDate() - 7);
    setCurrentYear(curr.getFullYear());
    setCurrentMonth(curr.getMonth());
    setSelectedDay(curr.getDate());
  };

  const handleNextWeek = () => {
    const curr = new Date(currentYear, currentMonth, selectedDay);
    curr.setDate(curr.getDate() + 7);
    setCurrentYear(curr.getFullYear());
    setCurrentMonth(curr.getMonth());
    setSelectedDay(curr.getDate());
  };

  // Week schedules array for all 7 days
  const weekSchedules = useMemo(() => {
    return currentWeekDays.map((d) => {
      const y = d.getFullYear();
      const m = d.getMonth();
      const dayNr = d.getDate();
      const isCurrM = y === today.getFullYear() && m === today.getMonth();
      const schedules = getScheduleForDay(y, m, dayNr, today.getDate(), isCurrM);
      const totalVisits = schedules.reduce((acc, a) => acc + a.totalVisits, 0);
      const completedVisits = schedules.reduce((acc, a) => acc + a.completedVisits, 0);
      const isSelected = y === currentYear && m === currentMonth && dayNr === selectedDay;
      const isToday = y === today.getFullYear() && m === today.getMonth() && dayNr === today.getDate();
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      return {
        date: d,
        year: y,
        month: m,
        day: dayNr,
        dayName: DAY_NAMES[d.getDay()],
        schedules,
        totalVisits,
        completedVisits,
        isSelected,
        isToday,
        isWeekend,
      };
    });
  }, [currentWeekDays, currentYear, currentMonth, selectedDay, today]);

  const totalWeekVisits = useMemo(() => {
    return weekSchedules.reduce((acc, w) => acc + w.totalVisits, 0);
  }, [weekSchedules]);

  const completedWeekVisits = useMemo(() => {
    return weekSchedules.reduce((acc, w) => acc + w.completedVisits, 0);
  }, [weekSchedules]);

  // Schedule for selected day
  const dailySchedule: AuditorDaySchedule[] = useMemo(() => {
    return getScheduleForDay(
      currentYear,
      currentMonth,
      selectedDay,
      today.getDate(),
      isCurrentMonth
    );
  }, [currentYear, currentMonth, selectedDay, today, isCurrentMonth]);

  // Overall day metrics
  const totalDayVisits = useMemo(() => {
    return dailySchedule.reduce((acc, a) => acc + a.totalVisits, 0);
  }, [dailySchedule]);

  const completedDayVisits = useMemo(() => {
    return dailySchedule.reduce((acc, a) => acc + a.completedVisits, 0);
  }, [dailySchedule]);

  const selectedDateObj = useMemo(() => {
    return new Date(currentYear, currentMonth, selectedDay);
  }, [currentYear, currentMonth, selectedDay]);

  const selectedDayName = DAY_NAMES[selectedDateObj.getDay()];
  const isWeekendDay = selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6;

  // Handler when clicking a day in the calendar (NO push notification)
  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
  };

  const handleApplyAiFix = () => {
    setIsApplyingFix(true);
    setTimeout(() => {
      setIsApplyingFix(false);
      setIsAiFixApplied(true);
      onShowToast(
        'Solución CAVI Implementada',
        'Re-visitas de Zona Sur redistribuidas automáticamente hacia San Juan del Cesar y Fonseca con ruta balanceada.'
      );
    }, 900);
  };

  const handleExportSchedule = () => {
    onShowToast(
      'Exportando Cronograma',
      `Generando archivo iCalendar (.ICS) para ${MONTH_NAMES[currentMonth]} ${currentYear}...`
    );

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CAVI//CAVI Route Engine//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:CAVI Cronograma ${MONTH_NAMES[currentMonth]} ${currentYear} - La Guajira
BEGIN:VEVENT
SUMMARY:Auditorías de Terreno ${selectedDayName} ${selectedDay} ${MONTH_NAMES[currentMonth]} (${totalDayVisits} visitas)
DESCRIPTION:Jornada oficial CAVI Departamental La Guajira - 3 Auditores en terreno (Samuel Ramos, Kleyder Rodriguez, Jose Aponte)
DTSTART:${currentYear}${String(currentMonth + 1).padStart(2, '0')}${String(selectedDay).padStart(2, '0')}T130000Z
DTEND:${currentYear}${String(currentMonth + 1).padStart(2, '0')}${String(selectedDay).padStart(2, '0')}T220000Z
LOCATION:Departamento de La Guajira, Colombia
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CAVI_Cronograma_${MONTH_NAMES[currentMonth]}_${currentYear}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered schedules according to auditor tab & point search
  const filteredSchedules = useMemo(() => {
    return dailySchedule
      .filter((aud) => {
        if (selectedAuditorFilter === 'all') return true;
        return aud.auditorId === selectedAuditorFilter;
      })
      .map((aud) => {
        if (!pointSearch.trim()) return aud;
        const q = pointSearch.toLowerCase();
        const filteredPoints = aud.points.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            p.municipality.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q)
        );
        return {
          ...aud,
          points: filteredPoints
        };
      });
  }, [dailySchedule, selectedAuditorFilter, pointSearch]);

  return (
    <div className="flex flex-col w-full space-y-4 md:space-y-5">
      {/* Month Navigation & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#131b2e] p-3.5 sm:px-4 rounded-2xl border border-[#222a3d] shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={handlePrevMonth}
            aria-label="Mes anterior"
            title="Mes anterior"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#171f33] text-[#dae2fd] hover:bg-[#222a3d] active:scale-95 transition-all border border-[#222a3d] shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base md:text-lg font-bold text-[#dae2fd] flex items-center gap-1.5">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              {isCurrentMonth && (
                <span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#4edea3] text-[10px] font-bold border border-[#4edea3]/30 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                  Mes Actual
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#bbcabf] flex items-center gap-1 truncate">
              <span className="material-symbols-outlined text-[13px] text-[#0088ff]">location_on</span>
              Red Activa: Departamento de La Guajira (15 Municipios)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap shrink-0 max-w-full">
          {/* View Mode Toggle: Mes vs Semana */}
          <div className="flex items-center gap-1 bg-[#0b1326] p-1 rounded-xl border border-[#222a3d]">
            <button
              type="button"
              onClick={() => {
                setCalendarView('month');
                onShowToast('Vista de Mes', 'Visualizando calendario mensual completo.');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                calendarView === 'month'
                  ? 'bg-[#0088ff] text-white shadow-sm shadow-[#0088ff]/30'
                  : 'text-[#bbcabf] hover:text-[#dae2fd]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>Mes</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCalendarView('week');
                setWeekSubView('matrix');
                onShowToast('Vista Alterna: Semana', 'Visualizando matriz operativa semanal completa (Lun - Vie).');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                calendarView === 'week'
                  ? 'bg-[#0088ff] text-white shadow-sm shadow-[#0088ff]/30'
                  : 'text-[#bbcabf] hover:text-[#dae2fd]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_view_week</span>
              <span>Semana (Vista Alterna)</span>
            </button>
          </div>

          {/* Quick jump to Today & Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={calendarView === 'month' ? handlePrevMonth : handlePrevWeek}
              aria-label={calendarView === 'month' ? 'Mes anterior' : 'Semana anterior'}
              title={calendarView === 'month' ? 'Mes anterior' : 'Semana anterior'}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#171f33] text-[#dae2fd] hover:bg-[#222a3d] active:scale-95 transition-all border border-[#222a3d] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <button
              onClick={handleJumpToToday}
              aria-label="Ir a fecha actual"
              title="Ir a hoy"
              className="px-3 py-1.5 rounded-xl bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] text-xs font-semibold flex items-center gap-1.5 transition-all border border-[#222a3d] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#0088ff]">today</span>
              <span>Hoy ({today.getDate()} {MONTH_NAMES[today.getMonth()].slice(0, 3)})</span>
            </button>

            <button
              onClick={calendarView === 'month' ? handleNextMonth : handleNextWeek}
              aria-label={calendarView === 'month' ? 'Mes siguiente' : 'Semana siguiente'}
              title={calendarView === 'month' ? 'Mes siguiente' : 'Semana siguiente'}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#171f33] text-[#dae2fd] hover:bg-[#222a3d] active:scale-95 transition-all border border-[#222a3d] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <button
            onClick={handleExportSchedule}
            className="px-3 py-1.5 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-[#ffffff] text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span className="hidden sm:inline">Exportar .ICS</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Calendar & Month KPIs */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          {/* AVANCE MENSUAL EN TIEMPO REAL */}
          <div className="relative overflow-hidden rounded-2xl bg-[#131b2e] p-4 shadow-sm border border-[#222a3d]">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] text-[#bbcabf] uppercase tracking-wider font-semibold">
                  Avance Mensual ({MONTH_NAMES[currentMonth]} {currentYear})
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-[#4edea3]">
                    {isCurrentMonth ? `${Math.min(daysInMonth * 10, 240)}` : '260'}
                  </span>
                  <span className="text-xs text-[#bbcabf]">
                    / {daysInMonth * 12} visitas meta
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#171f33] border border-[#ffb95f]/30">
                  <span className="material-symbols-outlined text-[14px] text-[#ffb95f]">
                    hourglass_bottom
                  </span>
                  <span className="text-[11px] text-[#ffb95f] font-semibold">
                    {Math.max(0, daysInMonth - (isCurrentMonth ? today.getDate() : 0))} días hábiles rest.
                  </span>
                </div>
                <span className="text-[10px] text-[#bbcabf] mt-1">3 Auditores activos en La Guajira</span>
              </div>
            </div>

            <div className="w-full bg-[#0b1326] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#222a3d]">
              <div
                className="bg-gradient-to-r from-[#0088ff] via-[#38bdf8] to-[#60a5fa] h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,136,255,0.4)]"
                style={{ width: `${isCurrentMonth ? Math.min(100, Math.round((today.getDate() / daysInMonth) * 100)) : 85}%` }}
              />
            </div>

            <div className="flex justify-between items-center mt-3 pt-2 text-[#bbcabf] border-t border-[#222a3d]/50 text-xs">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#0088ff]">
                  check_circle
                </span>
                <span className="text-[11px] text-[#dae2fd] font-semibold">
                  {isCurrentMonth ? `${Math.round((today.getDate() / daysInMonth) * 100)}% transcurrido` : 'Planificación completada'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span>Día seleccionado:</span>
                <span className="text-[#dae2fd] font-bold">{selectedDay} de {MONTH_NAMES[currentMonth]}</span>
              </div>
            </div>
          </div>

          {/* PLANIFICACIÓN (CALENDAR GRID OR WEEK CARDS) */}
          <div className="rounded-2xl bg-[#131b2e] p-4 shadow-sm space-y-3 border border-[#222a3d]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#0088ff]">
                  {calendarView === 'month' ? 'calendar_month' : 'calendar_view_week'}
                </span>
                <span className="font-bold text-sm text-[#dae2fd]">
                  {calendarView === 'month'
                    ? `Planificación: ${MONTH_NAMES[currentMonth]} ${currentYear}`
                    : `Semana: ${currentWeekDays[0].getDate()} ${MONTH_NAMES[currentWeekDays[0].getMonth()].slice(0, 3)} al ${currentWeekDays[6].getDate()} ${MONTH_NAMES[currentWeekDays[6].getMonth()].slice(0, 3)}`}
                </span>
              </div>
              <span className="text-[10px] text-[#bbcabf] bg-[#171f33] px-2 py-0.5 rounded-md border border-[#222a3d]">
                {calendarView === 'month' ? 'Toca un día para ver visitas' : '7 días de la semana activa'}
              </span>
            </div>

            {calendarView === 'month' ? (
              <>
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#bbcabf] pb-1 font-bold border-b border-[#222a3d]/60">
                  <span>L</span>
                  <span>M</span>
                  <span>M</span>
                  <span>J</span>
                  <span>V</span>
                  <span className="text-[#86948a]">S</span>
                  <span className="text-[#86948a]">D</span>
                </div>

                {/* Calendar days grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Padding empty slots before day 1 */}
                  {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="aspect-square flex flex-col items-center justify-center rounded-xl bg-[#0b1326]/30 opacity-20 text-xs text-[#bbcabf]"
                    />
                  ))}

                  {/* Real days of current month */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1;
                    const isSelected = selectedDay === day;
                    const dateCheck = new Date(currentYear, currentMonth, day);
                    const isWeekend = dateCheck.getDay() === 0 || dateCheck.getDay() === 6;
                    const isTodayDate =
                      today.getDate() === day &&
                      today.getMonth() === currentMonth &&
                      today.getFullYear() === currentYear;

                    const visitsCount = isWeekend ? 0 : 24 + ((day * 3) % 6);

                    if (isWeekend) {
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleSelectDay(day)}
                          title={`Día ${day} - Fin de semana`}
                          className={`aspect-square flex flex-col items-center justify-between p-1 rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#171f33] ring-2 ring-[#0088ff] text-[#dae2fd] font-bold'
                              : 'bg-[#0b1326]/50 text-[#86948a] hover:bg-[#171f33]'
                          }`}
                        >
                          <span className="text-xs">{day}</span>
                          <span className="text-[8px] text-[#86948a]">Guardia</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleSelectDay(day)}
                        title={`Día ${day} de ${MONTH_NAMES[currentMonth]}: ${visitsCount} visitas`}
                        className={`aspect-square flex flex-col items-center justify-between p-1 sm:p-1.5 rounded-xl transition-all text-left relative cursor-pointer ${
                          isSelected
                            ? 'bg-[#0088ff] text-[#ffffff] font-bold shadow-lg scale-105 ring-2 ring-[#0088ff]'
                            : isTodayDate
                            ? 'bg-[#171f33] border-2 border-[#10b981] text-[#dae2fd]'
                            : 'bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd]'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className={`text-xs ${isSelected ? 'text-[#ffffff] font-extrabold' : 'font-semibold'}`}>
                            {day}
                          </span>
                          {isTodayDate && !isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                          )}
                        </div>

                        <div className="w-full flex items-center justify-between mt-auto">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-[#ffffff]'
                                : day % 7 === 0
                                ? 'bg-[#ffb4ab]'
                                : day % 5 === 0
                                ? 'bg-[#ffb95f]'
                                : 'bg-[#0088ff]'
                            }`}
                          />
                          <span
                            className={`text-[9px] font-mono ${
                              isSelected
                                ? 'text-[#ffffff] font-bold'
                                : 'text-[#bbcabf]'
                            }`}
                          >
                            {visitsCount}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between pt-2 border-t border-[#222a3d]/50 text-[10px] text-[#bbcabf]">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#0088ff]" />
                    <span>Ruta Normal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#ffb95f]" />
                    <span>Atención/Re-visita</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#ffb4ab]" />
                    <span>Alerta CAVI</span>
                  </div>
                </div>
              </>
            ) : (
              /* WEEK DETAILED VIEW */
              <div className="space-y-2 pt-1 animate-in fade-in">
                {/* 7 Days of the Week Strips */}
                {weekSchedules.map((wDay) => {
                  const isDaySelected = wDay.isSelected;
                  const isToday = wDay.isToday;
                  const isWeekend = wDay.isWeekend;

                  return (
                    <button
                      key={`${wDay.year}-${wDay.month}-${wDay.day}`}
                      type="button"
                      onClick={() => {
                        setCurrentYear(wDay.year);
                        setCurrentMonth(wDay.month);
                        setSelectedDay(wDay.day);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all border flex items-center justify-between cursor-pointer ${
                        isDaySelected
                          ? 'bg-[#0088ff] text-white border-[#0088ff] shadow-md ring-2 ring-[#0088ff]'
                          : isToday
                          ? 'bg-[#171f33] text-[#dae2fd] border-[#10b981]'
                          : isWeekend
                          ? 'bg-[#0b1326]/60 text-[#86948a] border-[#222a3d]/40 hover:bg-[#171f33]'
                          : 'bg-[#171f33] text-[#dae2fd] border-[#222a3d] hover:bg-[#222a3d]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-bold shrink-0 ${
                            isDaySelected
                              ? 'bg-white text-[#0088ff]'
                              : isToday
                              ? 'bg-[#10b981] text-white'
                              : 'bg-[#0b1326] text-[#dae2fd]'
                          }`}
                        >
                          <span className="text-[9px] uppercase leading-none">{wDay.dayName.slice(0, 3)}</span>
                          <span className="text-sm leading-none mt-0.5">{wDay.day}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className={`text-xs font-bold leading-tight ${isDaySelected ? 'text-white' : 'text-[#dae2fd]'}`}>
                              {wDay.dayName} {wDay.day} de {MONTH_NAMES[wDay.month].slice(0, 3)}
                            </p>
                            {isToday && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#10b981]/30 text-[#4edea3]">
                                Hoy
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] ${isDaySelected ? 'text-white/90' : 'text-[#bbcabf]'}`}>
                            {isWeekend ? 'Guardia Pasiva (Sin ruta)' : `${wDay.totalVisits} visitas programadas`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isWeekend ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            isDaySelected ? 'bg-white/20 text-white' : 'bg-[#0b1326] text-[#86948a]'
                          }`}>
                            Fin de semana
                          </span>
                        ) : (
                          <div className="text-right">
                            <span className={`text-xs font-mono font-bold block ${isDaySelected ? 'text-white' : 'text-[#0088ff]'}`}>
                              {wDay.completedVisits}/{wDay.totalVisits}
                            </span>
                            <span className={`text-[10px] block ${isDaySelected ? 'text-white/80' : 'text-[#bbcabf]'}`}>
                              {Math.round((wDay.completedVisits / Math.max(1, wDay.totalVisits)) * 100)}% avance
                            </span>
                          </div>
                        )}
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </div>
                    </button>
                  );
                })}

                {/* Week Total KPIs Box */}
                <div className="mt-3 p-3 rounded-xl bg-[#0b1326] border border-[#222a3d] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#bbcabf]">Total Visitas Semana:</span>
                    <span className="font-mono font-bold text-[#dae2fd]">{totalWeekVisits} visitas</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#bbcabf]">Completadas al momento:</span>
                    <span className="font-mono font-bold text-[#0088ff]">{completedWeekVisits} realizadas</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#bbcabf]">Efectividad semanal:</span>
                    <span className="font-mono font-bold text-[#0088ff]">
                      {totalWeekVisits > 0 ? `${Math.round((completedWeekVisits / totalWeekVisits) * 100)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ALERTA OPERATIVA CAVI DE LA JORNADA */}
          {!alertDismissed && (
            <div
              data-push-banner="true"
              className="push-alert-banner rounded-2xl bg-[#171f33] p-4 relative overflow-hidden shadow-sm border border-[#ffb95f]/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="push-alert-icon w-8 h-8 rounded-xl bg-[#e29100]/20 text-[#ffb95f] flex items-center justify-center shrink-0 mt-0.5 border border-[#ffb95f]/40">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                </div>
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="push-alert-title text-xs text-[#ffb95f] font-bold flex items-center gap-1">
                      Alerta Táctica CAVI • {selectedDayName} {selectedDay} de {MONTH_NAMES[currentMonth]}
                    </span>
                    <button
                      onClick={() => setAlertDismissed(true)}
                      className="push-alert-close text-xs text-[#bbcabf] hover:text-[#dae2fd] transition-colors p-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                  <p className="push-alert-message text-xs text-[#dae2fd] leading-relaxed">
                    Puntos en Zona Sur (San Juan / Fonseca) presentan alta densidad de re-visitas.{' '}
                    <span className="push-alert-highlight text-[#c0c1ff]">
                      CAVI puede optimizar el orden secuencial de paradas para ahorrar 42 minutos de traslado.
                    </span>
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={handleApplyAiFix}
                      disabled={isApplyingFix || isAiFixApplied}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isAiFixApplied
                          ? 'bg-[#10b981]/20 text-[#4edea3] border border-[#4edea3]/40'
                          : 'bg-[#c0c1ff] text-[#1000a9] hover:opacity-90 font-bold'
                      }`}
                    >
                      {isApplyingFix ? (
                        <>
                          <span className="material-symbols-outlined text-[14px] animate-spin">
                            sync
                          </span>
                          <span>Reasignando...</span>
                        </>
                      ) : isAiFixApplied ? (
                        <>
                          <span className="material-symbols-outlined text-[14px]">done_all</span>
                          <span>Optimización Aplicada</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                          <span>Optimizar Ruta CAVI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETALLE DE LUGARES Y PUNTOS A VISITAR POR AUDITOR */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          {/* Subview Toggle for Week Mode: Día Activo vs Tablero Semanal Completo */}
          {calendarView === 'week' && (
            <div className="flex items-center justify-between gap-3 bg-[#131b2e] p-2 rounded-2xl border border-[#222a3d]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWeekSubView('day')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    weekSubView === 'day'
                      ? 'bg-[#0088ff] text-white shadow-sm shadow-[#0088ff]/30'
                      : 'text-[#bbcabf] hover:text-[#dae2fd]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">event</span>
                  <span>Jornada del Día ({selectedDayName} {selectedDay})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWeekSubView('matrix')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    weekSubView === 'matrix'
                      ? 'bg-[#0088ff] text-white shadow-sm shadow-[#0088ff]/30'
                      : 'text-[#bbcabf] hover:text-[#dae2fd]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">view_column</span>
                  <span>Matriz Semanal Completa (Lun - Vie)</span>
                </button>
              </div>
              <span className="text-[11px] text-[#bbcabf] hidden sm:inline">
                {weekSubView === 'matrix' ? 'Matriz consolidada de operación' : 'Detalle de paradas'}
              </span>
            </div>
          )}

          {calendarView === 'week' && weekSubView === 'matrix' ? (
            /* CONSOLIDATED WEEKLY MATRIX (LUNES A VIERNES) */
            <div className="space-y-4 animate-in fade-in">
              <div className="rounded-2xl bg-[#131b2e] p-4 sm:p-5 shadow-sm border border-[#222a3d]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222a3d]">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-[#dae2fd]">
                        Matriz Operativa Semanal Consolidada
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0088ff]/20 text-[#0088ff] border border-[#0088ff]/30">
                        {totalWeekVisits} Visitas Programadas en la Semana
                      </span>
                    </div>
                    <p className="text-xs text-[#bbcabf] mt-0.5">
                      Planificación estratégica de Lunes a Viernes para los 3 auditores en los corredores de La Guajira
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWeekSubView('day')}
                      className="px-3 py-1.5 rounded-xl bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] text-xs font-bold border border-[#222a3d] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#0088ff]">view_agenda</span>
                      <span>Ver Día a Detalle</span>
                    </button>
                  </div>
                </div>

                {/* Week Days Columns / Accordion Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-4">
                  {weekSchedules
                    .filter((w) => !w.isWeekend)
                    .map((wDay) => {
                      const isDaySelected = wDay.isSelected;
                      return (
                        <div
                          key={`matrix-${wDay.year}-${wDay.month}-${wDay.day}`}
                          className={`rounded-xl bg-[#0b1326] border p-3.5 flex flex-col justify-between transition-all ${
                            isDaySelected
                              ? 'border-[#0088ff] ring-1 ring-[#0088ff]/60 shadow-lg'
                              : 'border-[#222a3d] hover:border-[#38bdf8]/40'
                          }`}
                        >
                          <div>
                            {/* Day Header */}
                            <div className="flex items-center justify-between pb-2.5 border-b border-[#222a3d]">
                              <div className="flex items-center gap-2">
                                <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                                  isDaySelected ? 'bg-[#0088ff] text-white' : 'bg-[#171f33] text-[#dae2fd]'
                                }`}>
                                  {wDay.day}
                                </span>
                                <div>
                                  <p className="text-xs font-bold text-[#dae2fd] leading-tight">
                                    {wDay.dayName}
                                  </p>
                                  <p className="text-[10px] text-[#bbcabf]">
                                    {wDay.day} de {MONTH_NAMES[wDay.month].slice(0, 3)}
                                  </p>
                                </div>
                              </div>

                              <span className="text-[11px] font-mono font-bold text-[#0088ff] bg-[#171f33] px-2 py-0.5 rounded-md border border-[#222a3d]">
                                {wDay.totalVisits} visitas
                              </span>
                            </div>

                            {/* Auditor assignments preview */}
                            <div className="space-y-2.5 pt-3">
                              {wDay.schedules.map((aud) => (
                                <div key={aud.auditorId} className="bg-[#131b2e] p-2.5 rounded-lg border border-[#222a3d]/80">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: aud.routeColor }}
                                      />
                                      <span className="text-[11px] font-bold text-white">
                                        {aud.auditorName.split(' ')[0]}
                                      </span>
                                      <span className="text-[10px] text-[#bbcabf]">
                                        ({aud.zone})
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-[#bbcabf]">
                                      {aud.points.length} pts
                                    </span>
                                  </div>

                                  {/* First 2-3 stops */}
                                  <div className="space-y-1">
                                    {aud.points.slice(0, 3).map((pt) => (
                                      <div
                                        key={pt.id}
                                        onClick={() => setSelectedPointForModal(pt)}
                                        className="text-[10px] text-[#cbd5e1] hover:text-[#0088ff] flex items-center justify-between gap-1 py-0.5 cursor-pointer truncate"
                                      >
                                        <span className="truncate">
                                          • {pt.name} ({pt.municipality})
                                        </span>
                                        <span className="font-mono text-[9px] text-[#94a3b8] shrink-0">
                                          {pt.timeSlot.split(' - ')[0]}
                                        </span>
                                      </div>
                                    ))}
                                    {aud.points.length > 3 && (
                                      <p className="text-[9px] text-[#38bdf8] font-semibold pt-0.5">
                                        +{aud.points.length - 3} paradas adicionales...
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t border-[#222a3d] flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentYear(wDay.year);
                                setCurrentMonth(wDay.month);
                                setSelectedDay(wDay.day);
                                setWeekSubView('day');
                              }}
                              className="w-full py-1.5 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[11px] font-bold text-[#dae2fd] hover:text-white transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Ver Jornada Completa</span>
                              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            /* JORNADA BANNER WITH SELECTION SUMMARY */
            <>
            <div className="rounded-2xl bg-[#131b2e] p-4 sm:p-5 shadow-sm border border-[#222a3d]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222a3d]">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-[#dae2fd]">
                    Jornada: {selectedDayName} {selectedDay} de {MONTH_NAMES[currentMonth]} {currentYear}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isWeekendDay
                      ? 'bg-[#222a3d] text-[#bbcabf]'
                      : 'bg-[#0088ff]/20 text-[#0088ff] border border-[#0088ff]/30'
                  }`}>
                    {isWeekendDay ? 'Guardia Pasiva' : `${totalDayVisits} Visitas Programadas`}
                  </span>
                </div>
                <p className="text-xs text-[#bbcabf] mt-0.5">
                  Lugares y puntos de auditoría asignados por auditor en los municipios de La Guajira
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#bbcabf] font-mono">
                  {completedDayVisits}/{totalDayVisits} visitas hechas
                </span>
              </div>
            </div>

            {/* AUDITOR FILTER TABS */}
            <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedAuditorFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedAuditorFilter === 'all'
                    ? 'bg-[#0088ff] text-[#ffffff] shadow-sm shadow-[#0088ff]/30'
                    : 'bg-[#171f33] text-[#bbcabf] hover:text-[#dae2fd] border border-[#222a3d]'
                }`}
              >
                Todos ({dailySchedule.reduce((sum, a) => sum + a.points.length, 0)} puntos)
              </button>
              {dailySchedule.map((aud) => (
                <button
                  key={aud.auditorId}
                  type="button"
                  onClick={() => {
                    setSelectedAuditorFilter(aud.auditorId);
                    setExpandedAuditorIds((prev) =>
                      prev.includes(aud.auditorId) ? prev : [...prev, aud.auditorId]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedAuditorFilter === aud.auditorId
                      ? 'bg-[#0088ff] text-[#ffffff] shadow-sm shadow-[#0088ff]/30'
                      : 'bg-[#171f33] text-[#bbcabf] hover:text-[#dae2fd] border border-[#222a3d]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: aud.routeColor }}
                  />
                  <span>{aud.auditorName.split(' ')[0]} ({aud.zone})</span>
                </button>
              ))}
            </div>

            {/* SEARCH INPUT FOR PLACES & ADDRESSES */}
            <div className="relative pt-1">
              <span className="material-symbols-outlined absolute left-3 top-3.5 text-[18px] text-[#bbcabf]">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar punto por nombre, código (ej. CM-108), municipio (Riohacha, Maicao...)"
                value={pointSearch}
                onChange={(e) => setPointSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#171f33] border border-[#222a3d] text-xs text-[#dae2fd] placeholder:text-[#86948a] focus:outline-none focus:border-[#0088ff]"
              />
              {pointSearch && (
                <button
                  type="button"
                  onClick={() => setPointSearch('')}
                  className="absolute right-3 top-3 text-xs text-[#bbcabf] hover:text-[#dae2fd] cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* LIST OF AUDITORS AND EXPANDABLE ASSIGNED PLACES */}
          {filteredSchedules.length === 0 || isWeekendDay ? (
            <div className="p-8 rounded-2xl bg-[#131b2e] border border-[#222a3d] text-center space-y-2">
              <span className="material-symbols-outlined text-[36px] text-[#bbcabf]">
                event_busy
              </span>
              <h3 className="text-sm font-bold text-[#dae2fd]">
                {isWeekendDay ? 'Fin de Semana - Sin Visitas Regulares' : 'No se encontraron puntos con el filtro'}
              </h3>
              <p className="text-xs text-[#bbcabf] max-w-md mx-auto">
                {isWeekendDay
                  ? 'Los auditores de campo están en guardia o descanso programado. Selecciona un día hábil (Lunes a Viernes) para inspeccionar los recorridos.'
                  : 'Intenta modificar el término de búsqueda o selecciona la pestaña "Todos".'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Expand / Collapse all controls header */}
              <div className="flex items-center justify-between text-xs px-1 text-[#bbcabf]">
                <div className="flex items-center gap-1.5 font-medium text-[11px] sm:text-xs">
                  <span className="material-symbols-outlined text-[16px] text-[#0088ff]">touch_app</span>
                  <span>Presiona un auditor para desplegar o plegar sus lugares asignados</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="text-[11px] font-semibold text-[#0088ff] hover:underline cursor-pointer"
                  >
                    Desplegar todos
                  </button>
                  <span className="text-[#222a3d]">|</span>
                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    className="text-[11px] font-semibold text-[#bbcabf] hover:text-[#dae2fd] cursor-pointer"
                  >
                    Plegar todos
                  </button>
                </div>
              </div>

              {filteredSchedules.map((auditor) => {
                const isExpanded = expandedAuditorIds.includes(auditor.auditorId);

                return (
                  <div
                    key={auditor.auditorId}
                    className={`rounded-2xl bg-[#131b2e] border transition-all shadow-sm overflow-hidden ${
                      isExpanded ? 'border-[#0088ff]/40 shadow-md ring-1 ring-[#0088ff]/20' : 'border-[#222a3d] hover:border-[#38445e]'
                    }`}
                  >
                    {/* Interactive Auditor Header - Click to expand/collapse */}
                    <button
                      type="button"
                      onClick={() => toggleAuditor(auditor.auditorId)}
                      className="w-full text-left p-4 bg-[#171f33] hover:bg-[#1a243a] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={auditor.avatar}
                          alt={auditor.auditorName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-full object-cover ring-2 shrink-0"
                          style={{ ringColor: auditor.routeColor }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-[#dae2fd]">
                              {auditor.auditorName}
                            </h3>
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                              style={{
                                backgroundColor: `${auditor.routeColor}20`,
                                color: auditor.routeColor
                              }}
                            >
                              {auditor.zone}
                            </span>
                            <span className="text-xs text-[#bbcabf] font-mono">
                              {auditor.auditorCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#bbcabf] truncate mt-0.5">
                            Cobertura: <strong className="text-[#dae2fd]">{auditor.municipalitiesCovered.join(', ')}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#222a3d]">
                        <div className="text-left sm:text-right">
                          <span className="text-xs font-bold text-[#0088ff]">
                            {auditor.points.length} puntos asignados
                          </span>
                          <div className="w-24 bg-[#0b1326] h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${auditor.progressPercent}%`,
                                backgroundColor: auditor.routeColor
                              }}
                            />
                          </div>
                        </div>

                        {/* Interactive toggle badge */}
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isExpanded
                            ? 'bg-[#0088ff]/20 text-[#0088ff] border-[#0088ff]/40'
                            : 'bg-[#222a3d] text-[#dae2fd] border-[#222a3d] hover:bg-[#2d3752]'
                        }`}>
                          <span className="text-[11px] font-medium hidden sm:inline">
                            {isExpanded ? 'Plegar' : 'Ver asignación'}
                          </span>
                          <span className="material-symbols-outlined text-[18px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Unfolded List of Places to Visit for this Auditor */}
                    {isExpanded && (
                      <div className="p-3 sm:p-4 divide-y divide-[#222a3d]/60 space-y-2 border-t border-[#222a3d] bg-[#131b2e]">
                        {auditor.points.length === 0 ? (
                          <p className="text-xs text-[#bbcabf] text-center py-4">
                            Sin puntos que coincidan con la búsqueda para este auditor.
                          </p>
                        ) : (
                          auditor.points.map((point, index) => (
                            <div
                              key={point.id}
                              className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-[#171f33]/60 p-2 rounded-xl transition-all"
                            >
                              {/* Left: Index, Code, Format, Name & Municipality */}
                              <div className="flex items-start gap-3 min-w-0">
                                {/* Sequence number badge */}
                                <div className="w-6 h-6 rounded-lg bg-[#222a3d] text-[#dae2fd] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  #{index + 1}
                                </div>

                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                      point.format === 'CDA'
                                        ? 'bg-[#082F49] text-[#38bdf8] border border-[#38bdf8]/30'
                                        : point.format === 'PF'
                                        ? 'bg-[#3B0764] text-[#c084fc] border border-[#c084fc]/30'
                                        : 'bg-[#083344] text-[#22d3ee] border border-[#22d3ee]/30'
                                    }`}>
                                      {point.code} · {point.format}
                                    </span>

                                    <span className="text-xs font-bold text-[#dae2fd] truncate">
                                      {point.name}
                                    </span>

                                    {point.priority === 'Alta' && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30">
                                        Prioridad Alta
                                      </span>
                                    )}
                                    {point.priority === 'Re-visita' && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#ffb95f]/20 text-[#ffb95f] border border-[#ffb95f]/30">
                                        Re-visita CAVI
                                      </span>
                                    )}
                                  </div>

                                  {/* Physical Address & Municipality */}
                                  <div className="flex items-center gap-1.5 text-xs text-[#bbcabf] flex-wrap">
                                    <span className="material-symbols-outlined text-[14px] text-[#0088ff]">
                                      place
                                    </span>
                                    <span className="font-semibold text-[#dae2fd]">
                                      {point.municipality}
                                    </span>
                                    <span>—</span>
                                    <span className="truncate">{point.address}</span>
                                  </div>

                                  {/* Notes / contact preview */}
                                  {point.caviNotes && (
                                    <p className="text-[11px] text-[#bbcabf] italic line-clamp-1">
                                      Instrucción CAVI: {point.caviNotes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Right: Time Slot, Status Badge & Action Button */}
                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pl-9 sm:pl-0">
                                <div className="flex items-center gap-1 text-[11px] font-mono text-[#c0c1ff] bg-[#171f33] px-2 py-0.5 rounded-md border border-[#222a3d]">
                                  <span className="material-symbols-outlined text-[13px]">schedule</span>
                                  <span>{point.timeSlot}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    point.status === 'completed'
                                      ? 'bg-[#10b981]/20 text-[#4edea3] border border-[#4edea3]/30'
                                      : point.status === 'in_progress'
                                      ? 'bg-[#ffb95f]/20 text-[#ffb95f] border border-[#ffb95f]/30'
                                      : 'bg-[#222a3d] text-[#bbcabf]'
                                  }`}>
                                    {point.status === 'completed'
                                      ? '✓ Auditado'
                                      : point.status === 'in_progress'
                                      ? 'En Progreso'
                                      : 'Programado'}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedPointForModal(point)}
                                    className="px-2.5 py-1 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-xs text-[#dae2fd] font-semibold transition-all border border-[#222a3d] hover:border-[#0088ff]/40 cursor-pointer"
                                  >
                                    Ver Ficha
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* QUICK EXPORT & COPY ACTIONS */}
          <div className="p-4 rounded-2xl bg-[#131b2e] border border-[#222a3d] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#bbcabf]">
              <span className="material-symbols-outlined text-[18px] text-[#0088ff]">verified_user</span>
              <span>
                Planificación certificada para auditorías de terreno en La Guajira ({selectedDay} {MONTH_NAMES[currentMonth]} {currentYear})
              </span>
            </div>
            <button
              type="button"
              onClick={handleExportSchedule}
              className="px-4 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-[#ffffff] text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#0088ff]/30 active:scale-95 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              <span>Descargar Agenda del Día (.ICS)</span>
            </button>
          </div>
          </>
          )}
        </div>
      </div>

      {/* MODAL DETALLE DEL PUNTO DE AUDITORÍA */}
      {selectedPointForModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#222a3d]">
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                  selectedPointForModal.format === 'CDA'
                    ? 'bg-[#082F49] text-[#38bdf8] border border-[#38bdf8]/30'
                    : selectedPointForModal.format === 'PF'
                    ? 'bg-[#3B0764] text-[#c084fc] border border-[#c084fc]/30'
                    : 'bg-[#083344] text-[#22d3ee] border border-[#22d3ee]/30'
                }`}>
                  {selectedPointForModal.code} · {selectedPointForModal.format}
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#dae2fd]">
                    {selectedPointForModal.name}
                  </h3>
                  <p className="text-xs text-[#bbcabf]">
                    {selectedPointForModal.municipality}, La Guajira
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPointForModal(null)}
                className="w-8 h-8 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#bbcabf] hover:text-[#dae2fd] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#171f33] border border-[#222a3d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#bbcabf]">Dirección Física:</span>
                  <span className="text-[#dae2fd] font-semibold text-right">
                    {selectedPointForModal.address}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#bbcabf]">Ventana Horaria Programada:</span>
                  <span className="text-[#c0c1ff] font-mono font-bold">
                    {selectedPointForModal.timeSlot} ({selectedPointForModal.estimatedDuration})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#bbcabf]">Contacto en Establecimiento:</span>
                  <span className="text-[#dae2fd] font-semibold">
                    {selectedPointForModal.contactPerson || 'Administrador General'} {selectedPointForModal.phone ? `(${selectedPointForModal.phone})` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#bbcabf]">Estado de Auditoría:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    selectedPointForModal.status === 'completed'
                      ? 'bg-[#10b981]/20 text-[#4edea3]'
                      : selectedPointForModal.status === 'in_progress'
                      ? 'bg-[#ffb95f]/20 text-[#ffb95f]'
                      : 'bg-[#222a3d] text-[#bbcabf]'
                  }`}>
                    {selectedPointForModal.status === 'completed'
                      ? '✓ Completado'
                      : selectedPointForModal.status === 'in_progress'
                      ? 'En Curso'
                      : 'Pendiente de Visita'}
                  </span>
                </div>
              </div>

              {/* CAVI Directives */}
              {selectedPointForModal.caviNotes && (
                <div className="p-3 rounded-xl bg-[#222a3d]/40 border border-[#3131c0]/30 space-y-1">
                  <span className="text-[11px] font-bold text-[#c0c1ff] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    Directiva Táctica CAVI
                  </span>
                  <p className="text-xs text-[#dae2fd] leading-relaxed">
                    {selectedPointForModal.caviNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222a3d]">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText?.(
                    `${selectedPointForModal.name} - ${selectedPointForModal.address}, ${selectedPointForModal.municipality}, La Guajira`
                  );
                  onShowToast('Copiado', 'Dirección copiada al portapapeles', 'info');
                }}
                className="px-3 py-2 rounded-xl bg-[#171f33] hover:bg-[#222a3d] text-xs font-semibold text-[#dae2fd] flex items-center gap-1 border border-[#222a3d] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                Copiar Dirección
              </button>
              <button
                type="button"
                onClick={() => {
                  onShowToast('Punto Verificado', `Punto ${selectedPointForModal.code} inspeccionado`, 'success');
                  setSelectedPointForModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-xs font-bold text-[#ffffff] flex items-center gap-1 cursor-pointer shadow-md shadow-[#0088ff]/30"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
