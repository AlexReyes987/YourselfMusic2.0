import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useAuth } from '../../context/AuthContext';

import { AdminDashboardPage } from './AdminDashboardPage';
import { AdminCalendarPage } from './AdminCalendarPage';
import { AdminReservationsPage } from './AdminReservationsPage';
import { AdminRoomsPage } from './AdminRoomsPage';
import { AdminTransfersPage } from './AdminTransfersPage';
import { AdminSettingsPage } from './AdminSettingsPage';

const TITLES: Record<string, string> = {
  '/admin': 'Resumen General',
  '/admin/calendar': 'Matriz de Ocupación',
  '/admin/reservations': 'Control de Reservaciones',
  '/admin/rooms': 'Catálogo de Salas de Ensayo',
  '/admin/transfers': 'Validación de Transferencias SPEI',
  '/admin/settings': 'Configuración del Estudio',
};

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname, message: 'Debes iniciar sesión como administrador.' }}
        replace
      />
    );
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const title = TITLES[location.pathname] || 'Panel Administrativo';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0c0e] text-zinc-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AdminHeader title={title} />
        <main className="flex-1 overflow-y-auto bg-[#0c0c0e]">
          <Routes>
            <Route index element={<AdminDashboardPage />} />
            <Route path="calendar" element={<AdminCalendarPage />} />
            <Route path="reservations" element={<AdminReservationsPage />} />
            <Route path="rooms" element={<AdminRoomsPage />} />
            <Route path="transfers" element={<AdminTransfersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

