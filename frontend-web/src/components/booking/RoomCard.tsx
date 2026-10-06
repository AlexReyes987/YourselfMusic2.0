import React from 'react';
import { Room } from '../../types';
import { Volume2, CheckCircle2 } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  selected: boolean;
  onSelect: (roomId: number) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, selected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(room.id)}
      className={`cursor-pointer rounded-xl p-5 border transition-all duration-200 ${
        selected
          ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{room.name}</h3>
          <p className="text-xs text-orange-400 font-medium mt-0.5">
            ${room.hourly_rate} MXN / hora
          </p>
        </div>
        {selected ? (
          <CheckCircle2 className="w-5 h-5 text-orange-500" />
        ) : (
          <Volume2 className="w-5 h-5 text-zinc-500" />
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
        {room.equipment_description}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            room.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {room.status === 'active' ? 'Disponible' : 'Mantenimiento'}
        </span>
      </div>
    </div>
  );
};

