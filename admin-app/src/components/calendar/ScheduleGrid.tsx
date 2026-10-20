import React from 'react';
import { ReservacionCompleta } from '../../types/database';

interface ScheduleGridProps {
  date: string;
  reservaciones: ReservacionCompleta[];
  onSelectSlot?: (salaId: number, hour: number) => void;
  onSelectReservacion?: (reservacion: ReservacionCompleta) => void;
}

const ROOMS = [
  { id: 1, name: 'Sala 1 (Master Stage)' },
  { id: 2, name: 'Sala 2 (Rocker Studio)' },
  { id: 3, name: 'Sala 3 (Acoustic & Jazz)' },
  { id: 4, name: 'Sala 4 (Indie Rehearsal)' },
];

const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  date,
  reservaciones,
  onSelectSlot,
  onSelectReservacion,
}) => {
  const normalizarH = (h: string) => parseInt(h.split(':')[0], 10);

  return (
    <div className="border border-[#2a3142] rounded-2xl bg-[#181b24] overflow-hidden shadow-xl">
      <div className="p-4 border-b border-[#2a3142] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">
            Matriz Horaria de Ocupación — {date}
          </h3>
          <span className="text-[11px] text-zinc-400">
            Haz clic en un bloque libre para crear una reserva o en una reserva para gestionarla.
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
            <span className="text-zinc-400">Confirmada</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
            <span className="text-zinc-400">Pendiente</span>
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
                  const res = reservaciones.find((r) => {
                    if (r.sala_id !== room.id) return false;
                    if (r.estado_reservacion === 'cancelled') return false;
                    const startH = normalizarH(r.hora_inicio);
                    const endH = normalizarH(r.hora_fin);
                    return hour >= startH && hour < endH;
                  });

                  const clienteNombre =
                    res?.usuarios?.nombre || (res as any)?.cliente_nombre || 'Cliente';

                  return (
                    <td
                      key={room.id}
                      className="p-2 text-center"
                    >
                      {res ? (
                        <button
                          type="button"
                          onClick={() => onSelectReservacion && onSelectReservacion(res)}
                          className={`w-full p-2 rounded-lg font-medium text-[11px] truncate cursor-pointer transition-all ${
                            res.estado_reservacion === 'confirmed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                          }`}
                        >
                          <span className="font-bold">{clienteNombre}</span>
                          <span className="block text-[9px] opacity-80 font-mono">
                            {res.hora_inicio.slice(0, 5)} - {res.hora_fin.slice(0, 5)}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectSlot && onSelectSlot(room.id, hour)}
                          className="w-full p-2 rounded-lg bg-zinc-800/30 text-zinc-600 hover:text-orange-400 hover:bg-zinc-800/80 hover:border hover:border-orange-500/40 cursor-pointer transition-colors text-center"
                        >
                          + Libre
                        </button>
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
