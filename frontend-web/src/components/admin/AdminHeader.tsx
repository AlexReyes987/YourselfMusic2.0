import React from 'react';
import { Bell, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminHeader: React.FC<{ title: string }> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-zinc-800 bg-[#121215]/90 backdrop-blur px-6 flex items-center justify-between shrink-0">
      <h1 className="text-lg font-bold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
          <Shield className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-semibold text-zinc-200">
            {user?.name || user?.nombre || 'Administrador'}
          </span>
        </div>
      </div>
    </header>
  );
};

