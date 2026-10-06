import React from 'react';
import { Calendar, DollarSign, Layers, CheckCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Reservas Hoy</span>
            <Calendar className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">8</div>
          <p className="text-[11px] text-zinc-500">4 salas activas</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Ingresos del Día</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">$3,450 MXN</div>
          <p className="text-[11px] text-emerald-400">+12% vs ayer</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Transferencias por Validar</span>
            <CheckCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">2</div>
          <p className="text-[11px] text-zinc-500">Comprobantes pendientes</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Ocupación General</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">75%</div>
          <p className="text-[11px] text-zinc-500">Bloques vespertinos llenos</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#181b24] border border-[#2a3142]">
        <h3 className="text-sm font-bold text-white mb-2">Próximos Ensayos Agendados</h3>
        <p className="text-xs text-zinc-400">
          Usa la pestaña <strong>Matriz de Ocupación</strong> para revisar y modificar horarios en tiempo real.
        </p>
      </div>
    </div>
  );
};

