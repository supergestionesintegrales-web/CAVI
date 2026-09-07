import * as XLSX from 'xlsx';
import { MacroFile, MacroFolderDefinition, RouteStep } from '../types';

export const MACRO_FOLDERS_DEFINITIONS: MacroFolderDefinition[] = [
  {
    id: 'rutas',
    name: 'Rutas',
    label: 'Rutas Operativas',
    description: 'Archivos anuales y desglose mensual de itinerarios, paradas, matrices de geocodificación y hojas de ruta de auditores.',
    icon: 'alt_route',
    color: '#4edea3',
    allowedExtensions: ['xlsx', 'xls', 'xlsm', 'csv', 'pbix', 'pdf'],
  },
  {
    id: 'auditorias',
    name: 'Auditorias',
    label: 'Auditorías e Informes',
    description: 'Actas de inspección, informes de visita en Word, evidencias en PDF, listas de chequeo y consolidado de hallazgos.',
    icon: 'fact_check',
    color: '#38bdf8',
    allowedExtensions: ['docx', 'doc', 'pdf', 'xlsx'],
  },
  {
    id: 'indicadores',
    name: 'Indicadores_PowerBI',
    label: 'Indicadores & Power BI',
    description: 'Modelos semánticos .pbix, reportes analíticos de cumplimiento, métricas de mora y dashboards de efectividad CAVI.',
    icon: 'analytics',
    color: '#ffb95f',
    allowedExtensions: ['pbix', 'pbit', 'xlsx'],
  },
  {
    id: 'presentaciones',
    name: 'Presentaciones_Gerencia',
    label: 'Presentaciones Ejecutivas',
    description: 'Diapositivas PowerPoint .pptx de comités semanales, juntas operativas de gerencia y rendición de cuentas Q3/Q4.',
    icon: 'co_present',
    color: '#c084fc',
    allowedExtensions: ['pptx', 'ppt', 'pdf'],
  },
];

// Mock sheets data for pre-loaded excel files
const SAMPLE_ROUTES_SHEET_DATA = [
  ['Código', 'Punto de Venta / Sede', 'Formato', 'Auditor Asignado', 'Horario', 'Dirección', 'SLA (min)', 'Estado', 'Prioridad'],
  ['CM-108', 'Supermercado Éxito Riohacha Viva', 'CM', 'Samuel Ramos', '08:30 AM', 'Av. Primera # 12-40, Riohacha', '45', 'Completado', 'Alta'],
  ['PF-042', 'Supertienda Olímpica Riohacha', 'PF', 'Samuel Ramos', '10:15 AM', 'Calle 7 # 8-45, Centro Riohacha', '30', 'Completado', 'Media'],
  ['CDA-005', 'CDA del Sol Riohacha', 'CDA', 'Samuel Ramos', '11:45 AM', 'Km 3 Vía Santa Marta', '60', 'En Curso', 'Urgente'],
  ['CM-089', 'Tienda D1 Manaure Salinas', 'CM', 'Samuel Ramos', '02:00 PM', 'Av. Las Salinas # 4-12, Manaure', '45', 'Pendiente', 'Alta'],
  ['PF-019', 'Drogas La Rebaja Uribia', 'PF', 'Samuel Ramos', '03:45 PM', 'Plaza Colombia # 5-20, Uribia', '30', 'Pendiente', 'Media'],
  ['CDA-012', 'CDA Frontera Norte Maicao', 'CDA', 'Samuel Ramos', '05:00 PM', 'Troncal del Caribe Km 4, Maicao', '60', 'Pendiente', 'Alta'],
];

const SAMPLE_KLEYDER_SHEET_DATA = [
  ['Código', 'Punto de Venta / Sede', 'Formato', 'Auditor Asignado', 'Horario', 'Dirección', 'SLA (min)', 'Estado', 'Prioridad'],
  ['CM-051', 'Super Inter Maicao Central', 'CM', 'Kleyder Rodriguez', '08:00 AM', 'Calle 16 # 10-25, Maicao', '45', 'Completado', 'Alta'],
  ['PF-077', 'Farmatodo Maicao Comercio', 'PF', 'Kleyder Rodriguez', '09:45 AM', 'Calle 16 # 13-05, Maicao', '35', 'Completado', 'Media'],
  ['CDA-009', 'CDA Carbones Albania', 'CDA', 'Kleyder Rodriguez', '11:15 AM', 'Vía Principal Cerrejón # 4-12', '60', 'Completado', 'Urgente'],
  ['CM-073', 'Supertienda D1 Fonseca', 'CM', 'Kleyder Rodriguez', '01:30 PM', 'Calle 13 con Cra 18, Fonseca', '40', 'En Curso', 'Media'],
  ['PF-031', 'Droguería La Central San Juan', 'PF', 'Kleyder Rodriguez', '03:15 PM', 'Calle 7 # 5-18, San Juan del Cesar', '30', 'Pendiente', 'Alta'],
  ['CDA-018', 'CDA Guajira Sur Villanueva', 'CDA', 'Kleyder Rodriguez', '04:45 PM', 'Salida a Valledupar Km 1', '55', 'Pendiente', 'Alta'],
];

const SAMPLE_CRITICAL_POINTS_SHEET = [
  ['ID Punto', 'Nombre Establecimiento', 'Zona', 'Formato', 'Días en Mora', 'Última Auditoría', 'Acción Requerida', 'Riesgo'],
  ['CM-127', 'Megatienda San Juan del Cesar', 'Sur', 'CM', '14 días', '18/09/2024', 'Auditoría Integral Obligatoria', 'Crítico'],
  ['PF-088', 'Farmacia Santa Cruz Villanueva', 'Sur', 'PF', '11 días', '21/09/2024', 'Verificación Stock e Inventario', 'Alto'],
  ['CDA-031', 'CDA Guajira Hatonuevo', 'Sur', 'CDA', '9 días', '23/09/2024', 'Revisión Calibración Equipos', 'Medio'],
  ['CM-139', 'Éxito Riohacha Centro', 'Norte', 'CM', '8 días', '24/09/2024', 'Cierre de No Conformidades', 'Medio'],
];

// Initial repository files with hierarchical macro structure (vacío para información real del usuario)
export const INITIAL_MACRO_FILES: MacroFile[] = [];

// Archivos de demostración opcionales si el usuario desea explorar ejemplos
export const DEMO_MACRO_FILES: MacroFile[] = [
  // ===================== RUTAS 2024 =====================
  {
    id: 'file-rut-2024-10-1',
    name: 'Rutas_Semana42_LaGuajira_Departamental.xlsx',
    macroFolder: 'Rutas',
    year: '2024',
    month: '10-Octubre',
    path: 'Rutas/2024/10-Octubre/Rutas_Semana42_LaGuajira_Departamental.xlsx',
    type: 'excel',
    extension: 'xlsx',
    size: 148500,
    sizeFormatted: '145 KB',
    lastModified: '04/10/2024 07:15 AM',
    summary: 'Plan de rutas departamental consolidado de la Semana 42 para La Guajira. Contiene 18 paradas georreferenciadas, SLAs y distribución para Samuel Ramos, Kleyder Rodriguez y Jose Aponte.',
    sheets: [
      {
        name: 'Samuel_Ruta_Norte',
        rowCount: SAMPLE_ROUTES_SHEET_DATA.length - 1,
        columns: SAMPLE_ROUTES_SHEET_DATA[0] as string[],
        data: SAMPLE_ROUTES_SHEET_DATA.slice(1),
      },
      {
        name: 'Kleyder_Ruta_Centro',
        rowCount: SAMPLE_KLEYDER_SHEET_DATA.length - 1,
        columns: SAMPLE_KLEYDER_SHEET_DATA[0] as string[],
        data: SAMPLE_KLEYDER_SHEET_DATA.slice(1),
      },
      {
        name: 'Puntos_Mora_Prioritaria',
        rowCount: SAMPLE_CRITICAL_POINTS_SHEET.length - 1,
        columns: SAMPLE_CRITICAL_POINTS_SHEET[0] as string[],
        data: SAMPLE_CRITICAL_POINTS_SHEET.slice(1),
      },
    ],
    extractedMeta: {
      author: 'Coordinación Logística CAVI La Guajira',
      version: 'v2.4 Final',
      recordsCount: 18,
      tablesCount: 3,
      tags: ['La Guajira', 'Departamental', 'Semana 42', 'Rutas Diarias', 'Optimizado CAVI'],
      kpis: {
        'Total Paradas': 18,
        'Puntos CM': 8,
        'Puntos PF': 6,
        'Puntos CDA': 4,
        'Cumplimiento Estimado': '95.4%',
      },
      contentSnippet: 'Hoja de ruta operacional departamental con optimización por algoritmo Voronoi y ventanas de tránsito intermunicipal en Troncal del Caribe y Vía del Carbón.',
    },
  },
  {
    id: 'file-rut-2024-10-2',
    name: 'Puntos_Criticos_Mora_Octubre.xlsx',
    macroFolder: 'Rutas',
    year: '2024',
    month: '10-Octubre',
    path: 'Rutas/2024/10-Octubre/Puntos_Criticos_Mora_Octubre.xlsx',
    type: 'excel',
    extension: 'xlsx',
    size: 98200,
    sizeFormatted: '96 KB',
    lastModified: '02/10/2024 09:30 AM',
    summary: 'Listado de puntos de venta con más de 7 días sin auditoría en el Departamento de La Guajira, agrupados por zona y severidad.',
    sheets: [
      {
        name: 'Puntos_en_Mora',
        rowCount: SAMPLE_CRITICAL_POINTS_SHEET.length - 1,
        columns: SAMPLE_CRITICAL_POINTS_SHEET[0] as string[],
        data: SAMPLE_CRITICAL_POINTS_SHEET.slice(1),
      },
    ],
    extractedMeta: {
      author: 'Supervisión Departamental de Calidad',
      recordsCount: 4,
      tablesCount: 1,
      tags: ['Mora', 'Prioridad Alta', 'Alerta Q4', 'La Guajira'],
      kpis: {
        'Puntos en Mora': 4,
        'Días Promedio': '10.5 días',
        'Zona Más Afectada': 'Sur de La Guajira',
      },
    },
  },
  {
    id: 'file-rut-2024-09-1',
    name: 'Historico_Rutas_Septiembre_Consolidado.xlsx',
    macroFolder: 'Rutas',
    year: '2024',
    month: '09-Septiembre',
    path: 'Rutas/2024/09-Septiembre/Historico_Rutas_Septiembre_Consolidado.xlsx',
    type: 'excel',
    extension: 'xlsx',
    size: 320400,
    sizeFormatted: '313 KB',
    lastModified: '30/09/2024 06:00 PM',
    summary: 'Bitácora completa de rutas ejecutadas durante el mes de Septiembre 2024, con tiempos de traslado y efectividad real.',
    sheets: [
      {
        name: 'Consolidado_Mes',
        rowCount: 85,
        columns: ['Semana', 'Auditor', 'Visitas Programadas', 'Visitas Ejecutadas', 'Efectividad', 'Km Recorridos'],
        data: [
          ['Semana 36', 'Samuel Ramos', 42, 40, '95.2%', 142],
          ['Semana 37', 'Samuel Ramos', 45, 43, '95.5%', 158],
          ['Semana 38', 'Samuel Ramos', 40, 39, '97.5%', 135],
          ['Semana 39', 'Samuel Ramos', 44, 42, '95.4%', 149],
          ['Semana 36', 'Kleyder Rodriguez', 45, 42, '93.3%', 162],
          ['Semana 37', 'Kleyder Rodriguez', 46, 43, '93.5%', 170],
        ],
      },
    ],
    extractedMeta: {
      author: 'Jefatura de Operaciones',
      recordsCount: 171,
      tags: ['Cierre Mensual', 'Histórico', 'Septiembre 2024'],
      kpis: {
        'Total Visitas Mes': 171,
        'Efectividad Global': '95.1%',
        'Km Ahorrados con CAVI': '284 km',
      },
    },
  },
  {
    id: 'file-rut-2024-10-pdf',
    name: 'Mapa_Tactico_Departamental_Guajira.pdf',
    macroFolder: 'Rutas',
    year: '2024',
    month: '10-Octubre',
    path: 'Rutas/2024/10-Octubre/Mapa_Tactico_Departamental_Guajira.pdf',
    type: 'pdf',
    extension: 'pdf',
    size: 1850000,
    sizeFormatted: '1.8 MB',
    lastModified: '03/10/2024 11:00 AM',
    summary: 'Cartografía vectorial oficial con las troncales de movilidad departamental (Troncal del Caribe, Vía Riohacha-Maicao, Eje Minero y Corredor Sur), cuadrantes Norte, Centro y Sur.',
    extractedMeta: {
      author: 'Geointeligencia CAVI La Guajira',
      pageCount: 6,
      tags: ['Cartografía', 'GPS', 'Corredores Departamentales', 'La Guajira'],
      kpis: {
        'Corredores Mapeados': 15,
        'Puntos de Control': 54,
      },
      contentSnippet: 'Plano de movilidad departamental con zonificación táctica (Norte, Centro, Sur) y polígonos de cobertura asignados para el equipo de supervisores.',
    },
  },

  // ===================== AUDITORIAS 2024 =====================
  {
    id: 'file-aud-2024-10-1',
    name: 'Acta_Inspeccion_CM108_Riohacha.docx',
    macroFolder: 'Auditorias',
    year: '2024',
    month: '10-Octubre',
    path: 'Auditorias/2024/10-Octubre/Acta_Inspeccion_CM108_Riohacha.docx',
    type: 'word',
    extension: 'docx',
    size: 215000,
    sizeFormatted: '210 KB',
    lastModified: '04/10/2024 09:20 AM',
    summary: 'Acta formal de inspección técnica en Supermercado Éxito Riohacha Viva (CM-108). Auditor: Samuel Ramos. Resultado: Conforme con observaciones menores en frío.',
    extractedMeta: {
      author: 'Samuel Ramos Quintero',
      version: '1.0',
      pageCount: 4,
      tags: ['Acta', 'Inspección en Terreno', 'CM', 'Riohacha'],
      kpis: {
        'Puntaje Obtenido': '94 / 100',
        'Hallazgos Críticos': 0,
        'Observaciones Menores': 2,
        'Tiempo de Auditoría': '42 min',
      },
      contentSnippet: 'Se realiza visita presencial de verificación de inventarios, señalización de precios y estado de cuartos fríos. El establecimiento cuenta con los certificados de calibración al día.',
    },
  },
  {
    id: 'file-aud-2024-10-2',
    name: 'Informe_Auditoria_Integral_CDA005.pdf',
    macroFolder: 'Auditorias',
    year: '2024',
    month: '10-Octubre',
    path: 'Auditorias/2024/10-Octubre/Informe_Auditoria_Integral_CDA005.pdf',
    type: 'pdf',
    extension: 'pdf',
    size: 2450000,
    sizeFormatted: '2.4 MB',
    lastModified: '04/10/2024 12:40 PM',
    summary: 'Dictamen oficial de auditoría técnico-mecánica y trazabilidad de calibración en CDA del Sol Riohacha.',
    extractedMeta: {
      author: 'Ing. Jose Alarcón & CAVI',
      pageCount: 12,
      tags: ['CDA', 'Auditoría Técnica', 'Certificación', 'Norma ISO', 'Riohacha'],
      kpis: {
        'Calificación': 'Conforme (98%)',
        'Equipos Auditados': 8,
        'Vigencia': 'Hasta Octubre 2025',
      },
      contentSnippet: 'Evaluación exhaustiva de líneas de frenometría, gasometría y luxometría. Todos los patrones de medición coinciden con las directrices de la Superintendencia.',
    },
  },
  {
    id: 'file-aud-2024-09-1',
    name: 'Consolidado_Hallazgos_Septiembre.docx',
    macroFolder: 'Auditorias',
    year: '2024',
    month: '09-Septiembre',
    path: 'Auditorias/2024/09-Septiembre/Consolidado_Hallazgos_Septiembre.docx',
    type: 'word',
    extension: 'docx',
    size: 180000,
    sizeFormatted: '175 KB',
    lastModified: '29/09/2024 04:30 PM',
    summary: 'Resumen ejecutivo de no conformidades cerradas y planes de acción preventivos de la red departamental de droguerías y supermercados.',
    extractedMeta: {
      author: 'Comité Departamental de Aseguramiento de Calidad',
      pageCount: 8,
      tags: ['No Conformidades', 'Planes de Acción', 'Cierre Q3', 'La Guajira'],
      kpis: {
        'Hallazgos Cerrados': '92%',
        'Planes en Seguimiento': 5,
      },
    },
  },

  // ===================== INDICADORES POWER BI 2024 =====================
  {
    id: 'file-pbi-2024-10-1',
    name: 'Dashboard_Auditorias_LaGuajira_Departamental.pbix',
    macroFolder: 'Indicadores_PowerBI',
    year: '2024',
    month: '10-Octubre',
    path: 'Indicadores_PowerBI/2024/10-Octubre/Dashboard_Auditorias_LaGuajira_Departamental.pbix',
    type: 'powerbi',
    extension: 'pbix',
    size: 14200000,
    sizeFormatted: '14.2 MB',
    lastModified: '04/10/2024 06:45 AM',
    summary: 'Modelo analítico completo de Power BI con conexión DirectQuery a la telemetría departamental CAVI en La Guajira. Incluye mapas de calor, dispersión de tiempos intermunicipales y cumplimiento por auditor.',
    extractedMeta: {
      author: 'Equipo BI & Analítica Departamental',
      version: 'Power BI Desktop 2.128',
      tablesCount: 9,
      tags: ['DirectQuery', 'DAX Measures', 'Geoanalytics', 'KPIs en Vivo', 'La Guajira'],
      kpis: {
        'Cumplimiento Global': '95.4%',
        'Efectividad Visitas': '96.2%',
        'Tiempo Promedio Visita': '41 min',
        'Total Puntos Activos': 184,
      },
      contentSnippet: 'Tablas analíticas: Fact_Visitas_Guajira, Dim_Auditores, Dim_PuntosVenta_Departamentales, Dim_Calendario, Dim_Formatos (CM, PF, CDA), Medidas_DAX_Cumplimiento.',
    },
  },
  {
    id: 'file-pbi-2024-09-1',
    name: 'Modelo_Mora_Y_Capacidad_Operativa.pbix',
    macroFolder: 'Indicadores_PowerBI',
    year: '2024',
    month: '09-Septiembre',
    path: 'Indicadores_PowerBI/2024/09-Septiembre/Modelo_Mora_Y_Capacidad_Operativa.pbix',
    type: 'powerbi',
    extension: 'pbix',
    size: 11800000,
    sizeFormatted: '11.8 MB',
    lastModified: '30/09/2024 07:00 PM',
    summary: 'Tablero predictivo de saturación de itinerarios y curvas de supervivencia de puntos en mora.',
    extractedMeta: {
      author: 'Data Science CAVI',
      tablesCount: 7,
      tags: ['Machine Learning', 'Predicción Mora', 'Capacidad'],
      kpis: {
        'Riesgo de Mora Reducido': '-38%',
        'Horas Hombre Ahorradas': '124 hrs',
      },
    },
  },

  // ===================== PRESENTACIONES GERENCIA 2024 =====================
  {
    id: 'file-ppt-2024-10-1',
    name: 'Comite_Operaciones_Semana42.pptx',
    macroFolder: 'Presentaciones_Gerencia',
    year: '2024',
    month: '10-Octubre',
    path: 'Presentaciones_Gerencia/2024/10-Octubre/Comite_Operaciones_Semana42.pptx',
    type: 'powerpoint',
    extension: 'pptx',
    size: 4500000,
    sizeFormatted: '4.5 MB',
    lastModified: '04/10/2024 08:00 AM',
    summary: 'Presentación ejecutiva para el comité semanal de operaciones con Dirección General. Diapositivas de balance de cobertura, hitos del motor CAVI y plan de contingencia por lluvia.',
    extractedMeta: {
      author: 'Dirección de Operaciones',
      slidesCount: 16,
      tags: ['Comité Semanal', 'Dirección General', 'Plan W42'],
      kpis: {
        'Diapositivas': 16,
        'Puntos Clave': 'Balance 95.4%, Despacho Inteligente, Respaldo Offline',
      },
      contentSnippet: 'Slide 1: Portada y Agenda. Slide 2: Hitos CAVI Semana 42. Slide 3: Cobertura por Formatos (CM, PF, CDA). Slide 4: Desempeño por Auditor. Slide 5: Puntos Críticos y Mitigación.',
    },
  },
  {
    id: 'file-ppt-2024-09-1',
    name: 'Rendicion_Cuentas_Q3_Gerencia.pptx',
    macroFolder: 'Presentaciones_Gerencia',
    year: '2024',
    month: '09-Septiembre',
    path: 'Presentaciones_Gerencia/2024/09-Septiembre/Rendicion_Cuentas_Q3_Gerencia.pptx',
    type: 'powerpoint',
    extension: 'pptx',
    size: 8900000,
    sizeFormatted: '8.9 MB',
    lastModified: '30/09/2024 05:00 PM',
    summary: 'Balance trimestral Q3 presentado ante la junta directiva. Comparativa de costos logísticos antes vs. después de la implementación de CAVI.',
    extractedMeta: {
      author: 'Gerencia de Transformación Digital',
      slidesCount: 28,
      tags: ['Junta Directiva', 'Cierre Q3', 'ROI', 'Ahorro Operativo'],
      kpis: {
        'Ahorro en Desplazamientos': '22.4%',
        'Incremento en Cobertura': '+18%',
      },
    },
  },

  // ===================== HISTÓRICO 2023 =====================
  {
    id: 'file-rut-2023-12-1',
    name: 'Rutas_Cierre_Anual_2023.xlsx',
    macroFolder: 'Rutas',
    year: '2023',
    month: '12-Diciembre',
    path: 'Rutas/2023/12-Diciembre/Rutas_Cierre_Anual_2023.xlsx',
    type: 'excel',
    extension: 'xlsx',
    size: 512000,
    sizeFormatted: '500 KB',
    lastModified: '31/12/2023 11:30 PM',
    summary: 'Consolidado histórico de rutas anuales 2023 con desglose de 1,840 auditorías realizadas en el año.',
    sheets: [
      {
        name: 'Resumen_Anual',
        rowCount: 12,
        columns: ['Mes', 'Total Visitas', 'Cumplimiento', 'Auditores Activos'],
        data: [
          ['Enero', 140, '91.2%', 3],
          ['Febrero', 145, '92.5%', 3],
          ['Marzo', 152, '93.0%', 3],
          ['Abril', 148, '91.8%', 3],
          ['Mayo', 155, '94.2%', 3],
          ['Junio', 160, '94.8%', 3],
          ['Julio', 158, '93.9%', 3],
          ['Agosto', 164, '95.0%', 3],
          ['Septiembre', 162, '94.7%', 3],
          ['Octubre', 168, '95.2%', 3],
          ['Noviembre', 170, '95.5%', 3],
          ['Diciembre', 178, '96.1%', 3],
        ],
      },
    ],
    extractedMeta: {
      author: 'Archivo Histórico Operativo',
      recordsCount: 1840,
      tags: ['Histórico 2023', 'Cierre Anual'],
      kpis: {
        'Auditorías 2023': 1840,
        'Promedio Cumplimiento': '94.0%',
      },
    },
  },
  {
    id: 'file-aud-2023-12-1',
    name: 'Libro_Actas_Anual_2023.pdf',
    macroFolder: 'Auditorias',
    year: '2023',
    month: '12-Diciembre',
    path: 'Auditorias/2023/12-Diciembre/Libro_Actas_Anual_2023.pdf',
    type: 'pdf',
    extension: 'pdf',
    size: 6400000,
    sizeFormatted: '6.4 MB',
    lastModified: '31/12/2023 09:00 PM',
    summary: 'Compilado digital anual con firmas y radicados de las auditorías e inspecciones técnicas del periodo 2023.',
    extractedMeta: {
      author: 'Supervisión Jurídica y Técnica',
      pageCount: 142,
      tags: ['Libro Anual', 'Firmas Radicadas', '2023'],
    },
  },
];

/**
 * Helper to detect file type from extension
 */
export function detectFileType(extension: string): MacroFile['type'] {
  const ext = extension.toLowerCase().replace('.', '');
  if (['xlsx', 'xls', 'xlsm', 'csv'].includes(ext)) return 'excel';
  if (['pptx', 'ppt'].includes(ext)) return 'powerpoint';
  if (['pbix', 'pbit'].includes(ext)) return 'powerbi';
  if (['docx', 'doc', 'rtf', 'odt'].includes(ext)) return 'word';
  if (['pdf'].includes(ext)) return 'pdf';
  return 'other';
}

/**
 * Format bytes to readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export interface UploadProgressInfo {
  current: number;
  total: number;
  fileName: string;
  percent: number;
  stage: string;
}

/**
 * Process uploaded files from a directory picker, standalone file picker, or drag-and-drop
 * using relative paths or intelligent name/type inference for single files.
 */
export async function parseUploadedDirectoryFiles(
  files: File[],
  onProgress?: (info: UploadProgressInfo) => void,
  defaultMacroFolder?: string
): Promise<MacroFile[]> {
  const result: MacroFile[] = [];
  const total = files.length;

  for (let idx = 0; idx < total; idx++) {
    const file = files[idx];
    const fileIndex = idx + 1;
    const basePercent = Math.round((idx / total) * 100);

    const extMatch = file.name.match(/\.([0-9a-z]+)$/i);
    const extension = extMatch ? extMatch[1].toLowerCase() : 'other';
    const type = detectFileType(extension);

    // Initial stage callback
    if (onProgress) {
      onProgress({
        current: fileIndex,
        total,
        fileName: file.name,
        percent: Math.min(99, basePercent + Math.round((1 / total) * 20)),
        stage: `Leyendo binario y cabeceras de "${file.name}"...`,
      });
      await new Promise((r) => setTimeout(r, 60));
    }

    // Relative path typically: "Rutas/2024/10-Octubre/archivo.xlsx" or "CarpetaMadre/Rutas/2024/10-Octubre/..."
    const relPath = file.webkitRelativePath || file.name;
    const parts = relPath.split('/').filter(Boolean);

    let macroFolder = defaultMacroFolder && defaultMacroFolder !== 'all' ? defaultMacroFolder : 'Rutas';
    let year = '2024';
    let month = '10-Octubre';

    if (parts.length >= 4) {
      // e.g. [RootFolder, MacroFolder, Year, Month, fileName]
      macroFolder = parts[1];
      year = parts[2];
      month = parts[3];
    } else if (parts.length === 3) {
      // e.g. [MacroFolder, Year, Month, fileName] -> or [MacroFolder, Year, fileName]
      macroFolder = parts[0];
      year = parts[1];
      month = '10-Octubre';
    } else if (parts.length === 2) {
      macroFolder = parts[0];
      year = '2024';
      month = '10-Octubre';
    } else {
      // Standalone file upload (single or multiple files without folder tree)
      // Smartly classify based on file extension and filename keywords
      const lowerName = file.name.toLowerCase();

      // Check year in filename
      const yearMatch = file.name.match(/(202[0-9])/);
      if (yearMatch) year = yearMatch[1];

      // Check month in filename
      const monthsList = [
        { key: 'enero', val: '01-Enero' },
        { key: 'febrero', val: '02-Febrero' },
        { key: 'marzo', val: '03-Marzo' },
        { key: 'abril', val: '04-Abril' },
        { key: 'mayo', val: '05-Mayo' },
        { key: 'junio', val: '06-Junio' },
        { key: 'julio', val: '07-Julio' },
        { key: 'agosto', val: '08-Agosto' },
        { key: 'septiembre', val: '09-Septiembre' },
        { key: 'octubre', val: '10-Octubre' },
        { key: 'noviembre', val: '11-Noviembre' },
        { key: 'diciembre', val: '12-Diciembre' },
      ];
      const matchedMonth = monthsList.find((m) => lowerName.includes(m.key));
      if (matchedMonth) month = matchedMonth.val;

      // Classify macro folder
      if (defaultMacroFolder && defaultMacroFolder !== 'all') {
        macroFolder = defaultMacroFolder;
      } else if (lowerName.includes('audit') || lowerName.includes('acta') || lowerName.includes('inspecc') || lowerName.includes('hallazgo')) {
        macroFolder = 'Auditorias';
      } else if (lowerName.includes('indicador') || lowerName.includes('kpi') || lowerName.includes('powerbi') || type === 'powerbi') {
        macroFolder = 'Indicadores_PowerBI';
      } else if (lowerName.includes('present') || lowerName.includes('comite') || lowerName.includes('gerenc') || type === 'powerpoint') {
        macroFolder = 'Presentaciones_Gerencia';
      } else if (type === 'excel' || lowerName.includes('ruta') || lowerName.includes('parada') || lowerName.includes('itinerar')) {
        macroFolder = 'Rutas';
      } else if (type === 'word' || type === 'pdf') {
        macroFolder = 'Auditorias';
      }
    }

    // Format synthesized virtual path if it was a standalone file
    const effectivePath = parts.length === 1 ? `${macroFolder}/${year}/${month}/${file.name}` : relPath;

    const macroFile: MacroFile = {
      id: `uploaded-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      macroFolder,
      year,
      month,
      path: effectivePath,
      type,
      extension,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
      lastModified: new Date(file.lastModified).toLocaleString(),
      summary: parts.length === 1
        ? `Archivo individual indexado en ${macroFolder}/${year}/${month} según formato y metadatos.`
        : `Archivo cargado por el usuario desde la estructura de carpetas (${relPath}).`,
      rawFile: file,
      extractedMeta: {
        author: 'Usuario CAVI',
        tags: [macroFolder, year, month, extension.toUpperCase()],
      },
    };

    // Stage 2 callback
    if (onProgress) {
      onProgress({
        current: fileIndex,
        total,
        fileName: file.name,
        percent: Math.min(99, basePercent + Math.round((1 / total) * 55)),
        stage: type === 'excel'
          ? `Parseando celdas y hojas de cálculo con SheetJS...`
          : `Extrayendo metadatos y estructura documental...`,
      });
      await new Promise((r) => setTimeout(r, 70));
    }

    // If Excel, use SheetJS to parse real sheets and route data
    if (type === 'excel') {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetsData = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | boolean | null)[][];
          const columns = jsonData.length > 0 && Array.isArray(jsonData[0]) ? jsonData[0].map(String) : [];
          const rows = jsonData.slice(1);
          return {
            name: sheetName,
            rowCount: rows.length,
            columns,
            data: rows,
          };
        });

        macroFile.sheets = sheetsData;
        const totalRows = sheetsData.reduce((acc, s) => acc + s.rowCount, 0);
        macroFile.summary = `Archivo Excel con ${workbook.SheetNames.length} hoja(s) y ${totalRows} filas de datos leídas exitosamente.`;
        if (macroFile.extractedMeta) {
          macroFile.extractedMeta.recordsCount = totalRows;
          macroFile.extractedMeta.tablesCount = workbook.SheetNames.length;
          macroFile.extractedMeta.kpis = {
            'Hojas': workbook.SheetNames.length,
            'Filas Totales': totalRows,
            'Formato': extension.toUpperCase(),
          };
        }

        // Try extracting RouteSteps if columns look like route data
        const firstSheet = sheetsData[0];
        if (firstSheet && firstSheet.data.length > 0) {
          const parsedSteps: RouteStep[] = [];
          for (let i = 0; i < Math.min(firstSheet.data.length, 10); i++) {
            const row = firstSheet.data[i];
            if (row && row.length >= 2) {
              const code = String(row[0] || `PUNTO-${i + 1}`);
              const name = String(row[1] || `Establecimiento ${i + 1}`);
              const rawFormat = String(row[2] || 'CM').toUpperCase();
              const format = (['CM', 'PF', 'CDA'].includes(rawFormat) ? rawFormat : 'CM') as 'CM' | 'PF' | 'CDA';
              const time = String(row[4] || `0${8 + i}:00 AM`);
              const address = String(row[5] || 'Riohacha, La Guajira');
              parsedSteps.push({
                id: `parsed-step-${i}-${Date.now()}`,
                code,
                name,
                format,
                time,
                address,
                status: i === 0 ? 'completed' : i === 1 ? 'in_progress' : 'pending',
                sla: '45 min',
                notes: 'Importado de macro Excel',
              });
            }
          }
          if (parsedSteps.length > 0) {
            macroFile.parsedRouteSteps = parsedSteps;
          }
        }
      } catch (err) {
        console.error('Error parsing excel workbook:', err);
      }
    } else if (type === 'pdf') {
      macroFile.summary = `Documento PDF oficial listo para visualización e indexación. Tamaño: ${macroFile.sizeFormatted}.`;
      if (macroFile.extractedMeta) {
        macroFile.extractedMeta.pageCount = Math.max(1, Math.round(file.size / 75000));
      }
    } else if (type === 'powerpoint') {
      macroFile.summary = `Presentación de diapositivas PowerPoint de comités gerenciales. Formato: .${extension}.`;
      if (macroFile.extractedMeta) {
        macroFile.extractedMeta.slidesCount = Math.max(5, Math.round(file.size / 250000));
      }
    } else if (type === 'powerbi') {
      macroFile.summary = `Modelo analítico de Power BI con esquemas de datos y medidas operacionales.`;
      if (macroFile.extractedMeta) {
        macroFile.extractedMeta.tablesCount = 6;
      }
    } else if (type === 'word') {
      macroFile.summary = `Documento de texto Word con acta formal de auditoría o informe ejecutivo.`;
      if (macroFile.extractedMeta) {
        macroFile.extractedMeta.pageCount = Math.max(1, Math.round(file.size / 50000));
      }
    }

    result.push(macroFile);

    // Progress update per completed file
    if (onProgress) {
      const isLast = idx === total - 1;
      const targetPercent = isLast ? 100 : Math.round(((idx + 1) / total) * 100);
      onProgress({
        current: fileIndex,
        total,
        fileName: file.name,
        percent: targetPercent,
        stage: isLast
          ? `✓ Finalizado: ${total} archivo(s) procesados y sincronizados con éxito.`
          : `Indexado "${file.name}" en ${macroFile.macroFolder}. Preparando siguiente...`,
      });
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  return result;
}
