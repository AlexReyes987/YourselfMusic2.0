import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  CheckCircle,
  Settings,
  Music2,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendar', label: 'Matriz de Ocupación', icon: Calendar },
  { to: '/reservations', label: 'Reservaciones', icon: Layers },
  { to: '/rooms', label: 'Gestión de Salas (4)', icon: Music2 },
  { to: '/transfers', label: 'Validar Transferencias', icon: CheckCircle },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 border-r border-[#2a3142] bg-[#181b24] flex flex-col h-screen">
      <div className="p-5 border-b border-[#2a3142] flex items-center gap-3">
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

      <nav className="p-3 space-y-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
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

      <div className="p-4 border-t border-[#2a3142] text-[11px] text-zinc-500 text-center">
        v1.0.0 (Desktop Electron)
      </div>
    </aside>
  );
};

