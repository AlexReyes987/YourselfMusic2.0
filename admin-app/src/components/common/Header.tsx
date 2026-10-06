import React from 'react';
import { Bell, Shield } from 'lucide-react';

export const Header: React.FC<{ title: string }> = ({ title }) => {
  return (
    <header className="h-16 border-b border-[#2a3142] bg-[#181b24]/50 backdrop-blur px-6 flex items-center justify-between">
      <h1 className="text-lg font-bold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
          <Shield className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-semibold text-zinc-200">Admin</span>
        </div>
      </div>
    </header>
  );
};

