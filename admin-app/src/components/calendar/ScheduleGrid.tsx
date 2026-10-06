import React from 'react';

interface ReservationSlot {
  id: string;
  room_id: number;
  startHour: number;
  endHour: number;
  clientName: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface ScheduleGridProps {
  date: string;
  reservations: ReservationSlot[];
  onSelectSlot?: (roomId: number, hour: number) => void;
}

const ROOMS = [
  { id: 1, name: 'Sala 1 (Master)' },
  { id: 2, name: 'Sala 2 (Rocker)' },
  { id: 3, name: 'Sala 3 (Acoustic)' },
  { id: 4, name: 'Sala 4 (Indie)' },
];

const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  date,
  reservations,
  onSelectSlot,
}) => {
  return (
    <div className="border border-[#2a3142] rounded-2xl bg-[#181b24] overflow-hidden shadow-xl">
      <div className="p-4 border-b border-[#2a3142] flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">
          Matriz de Ocupación — {date}
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
            <span className="text-zinc-400">Confirmada</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
            <span className="text-zinc-400">Pendiente / Pago</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-zinc-700 inline-block"></span>
            <span className="text-zinc-400">Disponible</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#1f2430] border-b border-[#2a3142]">
              <th className="p-3 text-left font-semibold text-zinc-400 w-24">Hora</th>
              {ROOMS.map((room) => (
                <th key={room.id} className="p-3 text-center font-semibold text-zinc-200">
                  {room.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour} className="border-b border-[#2a3142]/60 hover:bg-zinc-800/20">
                <td className="p-3 font-mono text-zinc-400 font-medium">
                  {hour}:00
                </td>

                {ROOMS.map((room) => {
                  const res = reservations.find(
                    (r) => r.room_id === room.id && hour >= r.startHour && hour < r.endHour
                  );

                  return (
                    <td
                      key={room.id}
                      onClick={() => onSelectSlot && onSelectSlot(room.id, hour)}
                      className="p-2 text-center"
                    >
                      {res ? (
                        <div
                          className={`p-1.5 rounded-lg font-medium text-[11px] truncate ${
                            res.status === 'confirmed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {res.clientName}
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-lg bg-zinc-800/30 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/60 cursor-pointer transition-colors">
                          Libre
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

