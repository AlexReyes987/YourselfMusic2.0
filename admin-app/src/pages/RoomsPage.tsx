import React from 'react';

const ADMIN_ROOMS = [
  { id: 1, name: 'Sala 1 - Master Stage', rate: 250, status: 'Activa' },
  { id: 2, name: 'Sala 2 - Rocker Studio', rate: 200, status: 'Activa' },
  { id: 3, name: 'Sala 3 - Acoustic & Jazz', rate: 220, status: 'Activa' },
  { id: 4, name: 'Sala 4 - Indie Rehearsal', rate: 180, status: 'Activa' },
];

export const RoomsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Catálogo de 4 Salas Físicas</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Configuración de tarifa por hora, descripción de equipamiento y disponibilidad operativa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ADMIN_ROOMS.map((room) => (
          <div key={room.id} className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">{room.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                {room.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400">Tarifa actual: <span className="text-orange-400 font-bold">${room.rate} MXN/h</span></p>
            <button className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors">
              Editar Equipamiento / Tarifa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

