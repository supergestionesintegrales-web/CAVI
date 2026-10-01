/**
 * Utility functions for date range filtering and calendar mapping of Route Steps.
 */
import { RouteStep } from '../types';

export function formatDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const SPANISH_DAYS = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export function formatDateSpanish(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  const dayName = SPANISH_DAYS[date.getDay()];
  const monthName = SPANISH_MONTHS[m - 1];
  return `${dayName}, ${d} de ${monthName}`;
}

/**
 * Returns the effective date (YYYY-MM-DD) for a given RouteStep.
 * 1. If step has scheduledDate in YYYY-MM-DD, uses it.
 * 2. If step has auditDate in YYYY-MM-DD, uses it.
 * 3. If step has a day of week (lunes..viernes), maps to that day in the reference week.
 * 4. Otherwise, falls back to the reference date.
 */
export function getStepEffectiveDate(step: RouteStep, referenceDate: Date = new Date()): string {
  if (step.scheduledDate && /^\d{4}-\d{2}-\d{2}$/.test(step.scheduledDate)) {
    return step.scheduledDate;
  }
  if (step.auditDate && /^\d{4}-\d{2}-\d{2}/.test(step.auditDate)) {
    return step.auditDate.slice(0, 10);
  }

  // Map day of week (lunes a sábado) to the current week's dates
  if (step.day) {
    const dayMap: Record<string, number> = {
      lunes: 1,
      martes: 2,
      miércoles: 3,
      miercoles: 3,
      jueves: 4,
      viernes: 5,
      sábado: 6,
      sabado: 6,
    };
    const targetDay = dayMap[step.day.toLowerCase()];
    if (targetDay !== undefined) {
      const now = new Date(referenceDate);
      const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + (targetDay - 1));
      return formatDateToISO(targetDate);
    }
  }

  return formatDateToISO(referenceDate);
}

/**
 * Checks if a route step falls within a given start and end date range (inclusive).
 */
export function isStepInDateRange(
  step: RouteStep,
  startDate?: string,
  endDate?: string,
  referenceDate: Date = new Date()
): boolean {
  if (!startDate && !endDate) return true;
  const stepDate = getStepEffectiveDate(step, referenceDate);
  if (startDate && stepDate < startDate) return false;
  if (endDate && stepDate > endDate) return false;
  return true;
}

/**
 * Returns date range presets
 */
export function getDatePresets(referenceDate: Date = new Date()) {
  const now = new Date(referenceDate);
  const todayStr = formatDateToISO(now);

  // This Week (Monday to Saturday half-day)
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);

  // Next 7 days
  const next7 = new Date(now);
  next7.setDate(now.getDate() + 7);

  // This Month (1st to last day)
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    today: {
      start: todayStr,
      end: todayStr,
      label: 'Hoy',
    },
    thisWeek: {
      start: formatDateToISO(monday),
      end: formatDateToISO(saturday),
      label: 'Esta Semana (Lun - Sáb medio día)',
    },
    next7Days: {
      start: todayStr,
      end: formatDateToISO(next7),
      label: 'Próximos 7 Días',
    },
    thisMonth: {
      start: formatDateToISO(firstDayOfMonth),
      end: formatDateToISO(lastDayOfMonth),
      label: `Este Mes (${SPANISH_MONTHS[now.getMonth()]})`,
    },
  };
}
