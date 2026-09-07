import { useState, useEffect, useMemo } from 'react';
import { TabType, RouteStep, FloatingPoint, Auditor, MacroFile, UserRole } from './types';
import {
  AUDITORS_DATA,
  INITIAL_SAMUEL_STEPS,
  INITIAL_FLOATING_POINTS,
  INITIAL_ALERT_POINTS,
} from './data/mockData';
import { INITIAL_MACRO_FILES } from './data/macroFoldersData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast, ToastData } from './components/Toast';
import { ScannerModal } from './components/ScannerModal';
import { CriticalPointsModal } from './components/CriticalPointsModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ProfileModal } from './components/ProfileModal';

import { DashboardScreen } from './components/screens/DashboardScreen';
import { RoutesScreen } from './components/screens/RoutesScreen';
import { ScheduleScreen } from './components/screens/ScheduleScreen';
import { MacroFoldersScreen } from './components/screens/MacroFoldersScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard-cavi');
  const [userRole, setUserRole] = useState<UserRole>('administrador');
  const [activeAuditorId, setActiveAuditorId] = useState<string>('aud-1');
  const [auditors, setAuditors] = useState<Auditor[]>(AUDITORS_DATA);

  // Local storage persistence for real data
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>(() => {
    try {
      const saved = localStorage.getItem('cavi_real_route_steps');
      return saved ? JSON.parse(saved) : INITIAL_SAMUEL_STEPS;
    } catch {
      return INITIAL_SAMUEL_STEPS;
    }
  });

  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>(() => {
    try {
      const saved = localStorage.getItem('cavi_real_floating_points');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_ALERT_POINTS;
    } catch {
      return INITIAL_ALERT_POINTS;
    }
  });

  const [macroFiles, setMacroFiles] = useState<MacroFile[]>(() => {
    try {
      const saved = localStorage.getItem('cavi_real_macro_files');
      return saved ? JSON.parse(saved) : INITIAL_MACRO_FILES;
    } catch {
      return INITIAL_MACRO_FILES;
    }
  });

  const [activeRouteSourceFile, setActiveRouteSourceFile] = useState<string>('Rutas_LaGuajira_Departamental.xlsx');

  // Persist changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cavi_real_route_steps', JSON.stringify(routeSteps));
    } catch {
      // ignore
    }
  }, [routeSteps]);

  useEffect(() => {
    try {
      localStorage.setItem('cavi_real_floating_points', JSON.stringify(floatingPoints));
    } catch {
      // ignore
    }
  }, [floatingPoints]);

  useEffect(() => {
    try {
      localStorage.setItem('cavi_real_macro_files', JSON.stringify(macroFiles));
    } catch {
      // ignore
    }
  }, [macroFiles]);

  // Dynamically compute real stats for each auditor
  const liveAuditors = useMemo(() => {
    return auditors.map((aud) => {
      const audSteps = routeSteps.filter(
        (s) => s.auditorId === aud.id || (!s.auditorId && aud.id === 'aud-1')
      );
      const visitsDone = audSteps.filter((s) => s.status === 'completed').length;
      const visitsTarget = audSteps.length;
      const cmCount = audSteps.filter((s) => s.format === 'CM').length;
      const pfCount = audSteps.filter((s) => s.format === 'PF').length;
      const cdaCount = audSteps.filter((s) => s.format === 'CDA').length;
      const effectiveness = visitsTarget > 0 ? Math.round((visitsDone / visitsTarget) * 100) : 100;
      return {
        ...aud,
        visitsDone,
        visitsTarget,
        pointsPerDay: visitsTarget,
        auditedTotal: visitsDone,
        targetBreakdown: { cm: cmCount, pf: pfCount, cda: cdaCount },
        effectiveness,
        status: visitsTarget > 0 && visitsDone === visitsTarget ? ('completed' as const) : ('progress' as const),
      };
    });
  }, [auditors, routeSteps]);

  const handleAddRouteStep = (stepData: Omit<RouteStep, 'id'>) => {
    const newStep: RouteStep = {
      ...stepData,
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setRouteSteps((prev) => [...prev, newStep]);
    showToast('Parada Agregada', `${newStep.code} (${newStep.name}) asignada con éxito.`, 'success');
  };

  const handleDeleteRouteStep = (id: string) => {
    setRouteSteps((prev) => prev.filter((s) => s.id !== id));
    showToast('Parada Eliminada', 'Se removió la parada de la hoja de ruta.', 'info');
  };

  const handleToggleStepStatus = (id: string) => {
    setRouteSteps((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextStatus =
            s.status === 'pending'
              ? ('in_progress' as const)
              : s.status === 'in_progress'
              ? ('completed' as const)
              : ('pending' as const);
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const handleImportRouteSteps = (imported: RouteStep[]) => {
    setRouteSteps((prev) => [...prev, ...imported]);
    showToast('Rutas Importadas', `${imported.length} paradas reales cargadas a la red.`, 'success');
  };

  const handleClearRouteSteps = () => {
    setRouteSteps([]);
    setFloatingPoints([]);
    showToast('Rutas Limpiadas', 'Se eliminaron las paradas para ingresar información nueva.', 'info');
  };

  const handleAddFloatingPoint = (fpData: Omit<FloatingPoint, 'id'>) => {
    const newFp: FloatingPoint = {
      ...fpData,
      id: `fp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setFloatingPoints((prev) => [...prev, newFp]);
    showToast('Punto Creado', `${newFp.code} (${newFp.name}) listo en la bandeja de flotantes.`, 'success');
  };

  const handleDeleteFloatingPoint = (id: string) => {
    setFloatingPoints((prev) => prev.filter((fp) => fp.id !== id));
  };

  const handleSelectRole = (role: UserRole) => {
    setUserRole(role);
    if (role === 'auxiliar' && (activeTab === 'dashboard-cavi' || (activeTab as string) === 'resultados-kpis')) {
      setActiveTab('asignacion-rutas');
    }
    showToast(
      role === 'administrador' ? 'Rol Administrador Activado' : 'Rol Auxiliar (Auditor) Activado',
      role === 'administrador'
        ? 'Control total del sistema: CAVI, despacho, macros y reportes.'
        : 'Acceso operativo a Rutas, Agenda y Configuración (Color, Red Comercial y Sensor).',
      'info'
    );
  };

  // Visual Theme state ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('cavi_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('theme-light', 'light');
        document.documentElement.classList.remove('dark');
        document.body.classList.add('theme-light', 'light');
        document.body.classList.remove('dark');
      } else {
        document.documentElement.classList.remove('theme-light', 'light');
        document.documentElement.classList.add('dark');
        document.body.classList.remove('theme-light', 'light');
        document.body.classList.add('dark');
      }
      localStorage.setItem('cavi_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(
      nextTheme === 'light' ? '☀️ Modo Claro Activado' : '🌙 Modo Oscuro Activado',
      nextTheme === 'light'
        ? 'Interfaz diurna optimizada: fondos blancos/claros y tipografía de alto contraste.'
        : 'Modo nocturno táctico reactivado para trabajo en campo.',
      'info'
    );
  };

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCriticalPointsOpen, setIsCriticalPointsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  // Toasts
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'alert' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Assign single floating/alert point to an auditor (with optional target day)
  const handleAssignFloatingPoint = (id: string, auditorName: string, day?: string) => {
    const targetPoint = floatingPoints.find((p) => p.id === id);
    if (!targetPoint) return;

    setFloatingPoints((prev) => prev.filter((p) => p.id !== id));

    const matchedAuditor =
      auditors.find(
        (a) =>
          a.name.toLowerCase() === auditorName.toLowerCase() ||
          a.name.toLowerCase().includes(auditorName.split(' ')[0].toLowerCase())
      ) || auditors[0];

    const validDays: RouteStep['day'][] = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
    const lowerDay = day ? day.toLowerCase() : '';
    const targetDay: RouteStep['day'] = validDays.find((d) => d === lowerDay) || 'martes';

    // Create real route step in the schedule with alert metadata
    const newStep: RouteStep = {
      id: `step-assigned-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: '10:30 AM',
      code: targetPoint.code,
      format: targetPoint.format,
      name: targetPoint.name,
      address: targetPoint.address,
      municipality: targetPoint.municipality || (targetPoint.address.includes('Maicao') ? 'Maicao' : 'Riohacha'),
      zone: targetPoint.zone || matchedAuditor.zone,
      day: targetDay,
      auditorId: matchedAuditor.id,
      auditorName: matchedAuditor.name,
      status: 'pending',
      notes: targetPoint.alertDescription || (targetPoint.daysWithoutVisit ? `${targetPoint.daysWithoutVisit}d sin visita asignado` : 'Asignado de alertas'),
      daysWithoutVisit: targetPoint.daysWithoutVisit,
      alertCategory: targetPoint.alertCategory,
      alertDescription: targetPoint.alertDescription,
      hasGps: targetPoint.hasGps ?? true,
      lat: targetPoint.lat || (matchedAuditor.zone === 'Norte' ? 11.544 : matchedAuditor.zone === 'Centro' ? 11.380 : 10.771),
      lng: targetPoint.lng || (matchedAuditor.zone === 'Norte' ? -72.907 : matchedAuditor.zone === 'Centro' ? -72.240 : -72.999),
    };

    setRouteSteps((prev) => [newStep, ...prev]);

    // Update auditor target count
    setAuditors((prev) =>
      prev.map((aud) => {
        if (aud.id === matchedAuditor.id) {
          return {
            ...aud,
            visitsTarget: aud.visitsTarget + 1,
            auditedTotal: aud.auditedTotal + 1,
          };
        }
        return aud;
      })
    );

    showToast(
      'Punto Crítico Asignado',
      `${targetPoint.code} (${targetPoint.name}) asignado a ${matchedAuditor.name} para ${targetDay.toUpperCase()}.`,
      'success'
    );
  };

  // Auto assign all with CAVI AI prioritizing zone and days
  const handleAutoAssignAll = () => {
    if (floatingPoints.length === 0) {
      showToast('Sin puntos pendientes', 'No hay puntos con alertas para distribuir.');
      return;
    }

    const pointsToDistribute = [...floatingPoints];
    const daysCycle: RouteStep['day'][] = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];

    const newCreatedSteps: RouteStep[] = pointsToDistribute.map((fp, idx) => {
      let targetAuditor = auditors.find((a) => a.zone === fp.zone);
      if (!targetAuditor) {
        targetAuditor = auditors[idx % auditors.length];
      }
      const dayAssigned: RouteStep['day'] = daysCycle[idx % daysCycle.length];

      return {
        id: `step-auto-${Date.now()}-${idx}`,
        time: `${9 + (idx % 6)}:30 AM`,
        code: fp.code,
        format: fp.format,
        name: fp.name,
        address: fp.address,
        municipality: fp.municipality || 'La Guajira',
        zone: fp.zone || targetAuditor.zone,
        day: dayAssigned,
        auditorId: targetAuditor.id,
        auditorName: targetAuditor.name,
        status: 'pending',
        notes: fp.alertDescription || `${fp.daysWithoutVisit || 75}d sin visita - Despacho CAVI`,
        daysWithoutVisit: fp.daysWithoutVisit,
        alertCategory: fp.alertCategory,
        alertDescription: fp.alertDescription,
        hasGps: true,
        lat: targetAuditor.zone === 'Norte' ? 11.544 : targetAuditor.zone === 'Centro' ? 11.380 : 10.771,
        lng: targetAuditor.zone === 'Norte' ? -72.907 : targetAuditor.zone === 'Centro' ? -72.240 : -72.999,
      };
    });

    setRouteSteps((prev) => [...newCreatedSteps, ...prev]);
    setFloatingPoints([]);

    // Increase targets on auditors
    setAuditors((prev) =>
      prev.map((aud) => {
        const assignedToThis = newCreatedSteps.filter((s) => s.auditorId === aud.id).length;
        return {
          ...aud,
          visitsTarget: aud.visitsTarget + assignedToThis,
          auditedTotal: aud.auditedTotal + assignedToThis,
        };
      })
    );

    showToast(
      'Distribución CAVI Exitosa',
      `Se asignaron automáticamente ${pointsToDistribute.length} puntos críticos según zona operativa (Norte/Centro/Sur) y cronograma.`,
      'success'
    );
  };

  // Reload sample alert points for testing
  const handleReloadSampleAlertPoints = () => {
    setFloatingPoints(INITIAL_ALERT_POINTS);
    localStorage.setItem('cavi_real_floating_points', JSON.stringify(INITIAL_ALERT_POINTS));
    showToast(
      'Puntos Críticos Recargados',
      'Se han restablecido los 6 puntos críticos de prueba con mora de 2 a 3 meses y alertas operativas.',
      'info'
    );
  };

  // Handle QR / NFC check in
  const handleCheckInSuccess = (pointCode: string, pointName: string) => {
    // Add step or update current
    const newStep: RouteStep = {
      id: 'step-checkin-' + Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      code: pointCode,
      format: (pointCode.startsWith('CM') ? 'CM' : pointCode.startsWith('PF') ? 'PF' : 'CDA'),
      name: pointName,
      address: 'Geolocalizado en terreno',
      status: 'completed',
      notes: 'Check-in verificado por sensor NFC/QR con firma digital'
    };

    setRouteSteps((prev) => [newStep, ...prev]);

    setAuditors((prev) =>
      prev.map((aud) =>
        aud.zone === 'Norte'
          ? {
              ...aud,
              visitsDone: aud.visitsDone + 1,
              statusText: `Check-in ${pointCode} verificado`,
            }
          : aud
      )
    );

    showToast(
      'Check-in Confirmado',
      `${pointCode} - ${pointName} auditado y transmitido en tiempo real a CAVI Server.`
    );
  };

  // Macro files handling
  const handleAddMacroFiles = (newFiles: MacroFile[]) => {
    setMacroFiles((prev) => [...newFiles, ...prev]);
  };

  const handleInjectRoutesFromMacro = (file: MacroFile) => {
    setActiveRouteSourceFile(file.name);
    if (file.parsedRouteSteps && file.parsedRouteSteps.length > 0) {
      setRouteSteps(file.parsedRouteSteps);
      showToast(
        'Rutas Actualizadas en Vivo',
        `Se cargaron ${file.parsedRouteSteps.length} paradas operativas desde "${file.name}".`,
        'success'
      );
    } else if (file.sheets && file.sheets.length > 0) {
      const firstSheet = file.sheets[0];
      const newSteps: RouteStep[] = firstSheet.data.slice(0, 8).map((row, idx) => ({
        id: `injected-step-${idx}-${Date.now()}`,
        code: String(row[0] || `PT-${idx + 1}`),
        name: String(row[1] || `Establecimiento ${idx + 1}`),
        format: (['CM', 'PF', 'CDA'].includes(String(row[2])) ? String(row[2]) : 'CM') as 'CM' | 'PF' | 'CDA',
        time: String(row[4] || `0${8 + idx}:00 AM`),
        address: String(row[5] || 'Bogotá D.C.'),
        status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'pending',
        sla: '45 min',
        notes: `Importado de macro ${file.name} - Hoja ${firstSheet.name}`,
      }));
      setRouteSteps(newSteps);
      showToast(
        'Rutas Sincronizadas con Éxito',
        `Se inyectaron las paradas de la hoja "${firstSheet.name}" a la ruta activa de campo.`,
        'success'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col selection:bg-[#0088ff]/30 selection:text-[#dae2fd]">
      {/* Global Floating Toast */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} theme={theme} />

      {/* Global Fixed Header (Responsive Mobile + Desktop Navigation) */}
      <Header
        activeTab={activeTab}
        notificationCount={unreadCount}
        onSelectTab={setActiveTab}
        onOpenNotifications={() => {
          setIsNotificationsOpen(true);
          setUnreadCount(0);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        userRole={userRole}
        onSelectRole={handleSelectRole}
        activeAuditorId={activeAuditorId}
        onSelectAuditor={setActiveAuditorId}
        auditors={liveAuditors}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Screen Content with Padding for Header and Mobile Bottom Nav */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-18 md:pt-22 pb-24 md:pb-12 transition-all">
        {userRole === 'administrador' &&
          (activeTab === 'dashboard-cavi' || (activeTab as string) === 'resultados-kpis') && (
            <DashboardScreen
              auditors={liveAuditors}
              macroFilesCount={macroFiles.length}
              onGoToMacros={() => setActiveTab('archivos-macros')}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenCriticalPoints={() => setIsCriticalPointsOpen(true)}
              onShowToast={showToast}
              initialViewMode={activeTab === 'resultados-kpis' ? 'kpis' : 'consolidado'}
            />
          )}

        {(activeTab === 'asignacion-rutas' || activeTab === 'cronograma') && (
          <RoutesScreen
            auditors={liveAuditors}
            steps={routeSteps}
            floatingPoints={floatingPoints}
            activeRouteSourceFile={activeRouteSourceFile}
            onGoToMacros={() => setActiveTab('archivos-macros')}
            onAssignFloatingPoint={handleAssignFloatingPoint}
            onAutoAssignAll={handleAutoAssignAll}
            onReloadSampleAlertPoints={handleReloadSampleAlertPoints}
            onShowToast={showToast}
            userRole={userRole}
            activeAuditorId={activeAuditorId}
            onAddRouteStep={handleAddRouteStep}
            onDeleteRouteStep={handleDeleteRouteStep}
            onToggleStepStatus={handleToggleStepStatus}
            onImportRouteSteps={handleImportRouteSteps}
            onClearRouteSteps={handleClearRouteSteps}
            onAddFloatingPoint={handleAddFloatingPoint}
            onDeleteFloatingPoint={handleDeleteFloatingPoint}
          />
        )}

        {activeTab === 'archivos-macros' && (
          <MacroFoldersScreen
            files={macroFiles}
            onAddFiles={handleAddMacroFiles}
            onInjectRoutes={handleInjectRoutesFromMacro}
            activeRouteSourceFile={activeRouteSourceFile}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenScanner={() => setIsScannerOpen(true)}
            onManualCheckIn={handleCheckInSuccess}
            onShowToast={showToast}
            userRole={userRole}
            routeSteps={routeSteps}
            auditors={liveAuditors}
          />
        )}
      </main>

      {/* Global Fixed Bottom Navigation Bar (Hidden on md+ desktop screens) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userRole={userRole}
      />

      {/* Interactive Modals */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCheckInSuccess={handleCheckInSuccess}
      />

      <CriticalPointsModal
        isOpen={isCriticalPointsOpen}
        onClose={() => setIsCriticalPointsOpen(false)}
        onAssignPoint={(code) => {
          handleAssignFloatingPoint(code, 'Samuel Ramos Quintero');
        }}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkAllRead={() => {
          setUnreadCount(0);
          showToast('Alertas leídas', 'Todas las notificaciones fueron archivadas.');
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onShowToast={showToast}
        userRole={userRole}
        onSelectRole={handleSelectRole}
        activeAuditorId={activeAuditorId}
        onSelectAuditor={setActiveAuditorId}
        auditors={liveAuditors}
      />
    </div>
  );
}
