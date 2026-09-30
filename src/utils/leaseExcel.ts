import * as XLSX from 'xlsx';
import { LeasePoint } from '../types';
import { evaluatePointOpenStatus, formatCOP, getContractDaysRemaining, getLeaseLifecycleStatus } from '../data/leasePointsData';

export function exportLeasePointsToExcel(points: LeasePoint[], fileName: string = 'Reporte_Arrendamientos_CAVI.xlsx') {
  const headers = [
    'Código Inmueble',
    'Nombre del Punto',
    'Tipo de Inmueble',
    'Estado Operativo',
    'Estado del Punto',
    'Motivo Inactividad',
    'Fecha Inactividad',
    'Situación en Tiempo Real',
    'Horario Lunes a Viernes',
    'Horario Sábado',
    'Horario Domingo',
    'Notas Festivos',
    'Municipio',
    'Dirección',
    'Barrio',
    'Referencia',
    'Latitud GPS',
    'Longitud GPS',
    'Canon Mensual (COP)',
    'Cuota Administración (COP)',
    'Área (m²)',
    'N° Contrato',
    'Fecha Inicio Contrato',
    'Fecha Vencimiento Contrato',
    'Estado Vigencia',
    'Propietario / Arrendador',
    'Teléfono Contacto',
    'Correo Electrónico',
    'NIT / Documento Propietario',
    'Medidor de Energía',
    'Medidor de Agua',
    'Última Auditoría Inmueble',
    'Auditor Responsable',
    'Novedades Registradas',
  ];

  const now = new Date();

  const rows = points.map((p) => {
    const status = evaluatePointOpenStatus(p, now);
    const contract = getContractDaysRemaining(p.contractEndDate);
    const lifecycle = getLeaseLifecycleStatus(p, now);

    const weekdayStr = p.schedule.monday.isOpen
      ? `${p.schedule.monday.open} - ${p.schedule.monday.close}${
          p.schedule.monday.hasLunchBreak
            ? ` (Almuerzo ${p.schedule.monday.lunchStart} - ${p.schedule.monday.lunchEnd})`
            : ''
        }`
      : 'Cerrado';

    const saturdayStr = p.schedule.saturday.isOpen
      ? `${p.schedule.saturday.open} - ${p.schedule.saturday.close}`
      : 'Cerrado';

    const sundayStr = p.schedule.sunday.isOpen
      ? `${p.schedule.sunday.open} - ${p.schedule.sunday.close}`
      : 'Cerrado';

    const activeIncidentsStr = p.incidents.length > 0
      ? p.incidents.map((i) => `[${i.date} ${i.time}] ${i.type}: ${i.description}`).join(' | ')
      : 'Sin novedades';

    return [
      p.code,
      p.name,
      p.propertyType,
      status.isOpenNow ? 'ABIERTO' : 'CERRADO',
      lifecycle.lifecycleStatus === 'active' ? 'ACTIVO' : 'INACTIVO',
      lifecycle.inactivityLabel || '',
      p.inactivityDate || '',
      `${status.statusBadgeText} - ${status.timeContext}`,
      weekdayStr,
      saturdayStr,
      sundayStr,
      p.schedule.holidayNote || 'N/A',
      p.municipality,
      p.address,
      p.neighborhood,
      p.reference || '',
      p.lat,
      p.lng,
      p.monthlyRent,
      p.adminFee || 0,
      p.areaSqMeters,
      p.contractNumber,
      p.contractStartDate,
      p.contractEndDate,
      contract.label,
      p.landlord.name,
      p.landlord.phone,
      p.landlord.email || '',
      p.landlord.documentId || '',
      p.electricMeter || '',
      p.waterMeter || '',
      p.lastAuditDate || 'Sin auditoría',
      p.lastAuditorName || 'Sin asignar',
      activeIncidentsStr,
    ];
  });

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 35 },
    { wch: 22 },
    { wch: 14 },
    { wch: 30 },
    { wch: 35 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
    { wch: 32 },
    { wch: 18 },
    { wch: 35 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 32 },
    { wch: 18 },
    { wch: 28 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 25 },
    { wch: 45 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Puntos_Arrendamiento');

  const totalPoints = points.length;
  const openCount = points.filter((p) => evaluatePointOpenStatus(p, now).isOpenNow).length;
  const closedCount = totalPoints - openCount;
  const totalRent = points.reduce((acc, p) => acc + p.monthlyRent, 0);

  const summaryHeaders = ['Indicador de Arrendamientos', 'Valor'];
  const summaryRows = [
    ['Fecha y Hora del Reporte', now.toLocaleString('es-CO')],
    ['Total Inmuebles en Arrendamiento', totalPoints],
    ['Puntos Abiertos en Tiempo Real', openCount],
    ['Puntos Cerrados en Tiempo Real', closedCount],
    ['Tasa de Apertura (%)', `${((openCount / (totalPoints || 1)) * 100).toFixed(1)}%`],
    ['Canon Mensual Total Consolidado', formatCOP(totalRent)],
    ['Promedio Canon por Inmueble', formatCOP(Math.round(totalRent / (totalPoints || 1)))],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Ejecutivo');

  XLSX.writeFile(wb, fileName);
}
