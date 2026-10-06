import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Volume2 } from 'lucide-react';
import { Reservation } from '../types';
import { reservationService } from '../services/reservationService';

export const MyReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReservations() {
      try {
        const data = await reservationService.getMyReservations();
        setReservations(data);
      } catch {
        // Fallback demo si el backend aún no tiene token activo
        setReservations([
          {
            id: 'YM-DEMO-01',
            user_id: 'usr-1',
            room_id: 1,
            room_name: 'Sala 1 - Master Stage',
            date: new Date().toISOString().split('T')[0],
            start_time: '16:00:00',
            end_time: '18:00:00',
            total_price: 500,
            status: 'confirmed',
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadReservations();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mis Reservaciones</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Historial y estado de tus salas de ensayo reservadas en YourSelf Music.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-zinc-500">Cargando tus reservaciones...</div>
      ) : reservations.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-2">
          <p className="text-sm text-zinc-400">Aún no tienes reservaciones activas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => (
            <div
              key={res.id}
              className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-white text-sm">
                    {res.room_name || `Sala ${res.room_id}`}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      res.status === 'confirmed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : res.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {res.status === 'confirmed' ? 'Confirmada' : res.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {res.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {res.start_time.slice(0, 5)} - {res.end_time.slice(0, 5)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-zinc-500 block">Total</span>
                <span className="text-lg font-bold text-orange-400">${res.total_price} MXN</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

