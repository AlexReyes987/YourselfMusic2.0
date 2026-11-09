import React from 'react';
import { Sala } from '../../types';

interface RoomCardProps {
  sala: Sala;
  selected: boolean;
  onSelect: (salaId: number) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ sala, selected, onSelect }) => {
  const isAvailable = sala.estado === 'active' || sala.estado === 'disponible';

  return (
    <div
      onClick={() => isAvailable && onSelect(sala.sala_id)}
      className={`relative rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
        !isAvailable
          ? 'border-zinc-800 bg-zinc-900/30 opacity-60 cursor-not-allowed'
          : selected
          ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500 cursor-pointer'
          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900/80 cursor-pointer'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-orange-400 border border-zinc-700">
                Sala {sala.sala_id}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {sala.nombre_sala}
              </h3>
            </div>
            <p className="text-xs text-orange-400 font-bold mt-1">
              ${sala.precio_por_hora} MXN <span className="text-zinc-500 font-normal">/ persona por hora</span>
            </p>
          </div>

          {selected && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-500 text-white">
              Seleccionada
            </span>
          )}
        </div>

        <p className="mt-3 text-xs text-zinc-400 leading-relaxed line-clamp-3">
          {sala.descripcion}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
        <span className="text-zinc-400">
          Capacidad: <strong className="text-zinc-200">{sala.capacidad} músicos</strong>
        </span>

        <span
          className={`text-[11px] font-medium ${
            isAvailable ? 'text-zinc-400' : 'text-rose-400'
          }`}
        >
          {isAvailable ? 'Disponible' : 'En mantenimiento'}
        </span>
      </div>
    </div>
  );
};
