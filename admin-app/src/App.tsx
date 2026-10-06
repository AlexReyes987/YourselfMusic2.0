import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarViewPage } from './pages/CalendarViewPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { RoomsPage } from './pages/RoomsPage';
import { TransfersPage } from './pages/TransfersPage';
import { SettingsPage } from './pages/SettingsPage';

const TITLES: Record<string, string> = {
  '/': 'Resumen General',
  '/calendar': 'Matriz de Ocupación',
  '/reservations': 'Control de Reservaciones',
  '/rooms': 'Catálogo de Salas de Ensayo',
  '/transfers': 'Validación de Transferencias SPEI',
  '/settings': 'Configuración del Estudio',
};

export const App: React.FC = () => {
  const location = useLocation();
  const title = TITLES[location.pathname] || 'Panel Administrativo';

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1117]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarViewPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
