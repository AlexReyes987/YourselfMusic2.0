import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  CheckCircle,
  Settings,
  Music2,
  LogOut,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/calendar', label: 'Matriz de Ocupación', icon: Calendar },
  { to: '/admin/reservations', label: 'Reservaciones', icon: Layers },
  { to: '/admin/rooms', label: 'Gestión de Salas (4)', icon: Music2 },
  { to: '/admin/transfers', label: 'Validar Transferencias', icon: CheckCircle },
  { to: '/admin/settings', label: 'Configuración', icon: Settings },
];

export const AdminSidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 border-r border-[#2a3142] bg-[#181b24] flex flex-col h-full shrink-0">
      {/* Encabezado del Sidebar */}
      <div className="p-5 border-b border-[#2a3142] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-lg">
            YM
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">YourSelf Music</h2>
            <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
              Panel Administrador
            </span>
          </div>
        </div>
      </div>

      {/* Botón para volver al sitio web público */}
      <div className="px-3 pt-3">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Sitio Público</span>
        </button>
      </div>

      {/* Navegación */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer del sidebar con info de admin y logout */}
      <div className="p-4 border-t border-[#2a3142] space-y-3 bg-[#13161e]">
        {user && (
          <div className="flex items-center gap-2 px-2 py-1">
            <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-zinc-200 truncate">
                {user.name || user.nombre || 'Administrador'}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

