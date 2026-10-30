import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Volume2, ShieldCheck, Plus, LogIn, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reservacion } from '../types';
import { reservationService } from '../services/reservationService';
import { useAuth } from '../context/AuthContext';

export const MyReservationsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [reservations, setReservations] = useState<Reservacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReservations() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const data = await reservationService.getMyReservations();
        setReservations(data || []);
      } catch (err) {
        console.warn('No se pudieron obtener las reservaciones del servidor:', err);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    }
    loadReservations();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
          <User className="w-6 h-6 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-white">Inicia sesión para consultar tus reservaciones</h2>
        <p className="text-xs text-zinc-400">
          Para ver tus ensayos agendados y comprobantes, debes acceder con tu cuenta de cliente en YourSelf Music.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            state={{ from: '/my-reservations' }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold text-xs transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Mis Reservaciones</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Historial de salas reservadas en YourSelf Music para{' '}
            <strong className="text-zinc-200">{user?.name || user?.nombre || user?.email}</strong>.
          </p>
        </div>

        <Link
          to="/booking"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Reserva</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500">
          Consultando tus reservaciones en Supabase...
        </div>
      ) : reservations.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
          <ShieldCheck className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-white">Aún no tienes reservaciones registradas.</p>
          <p className="text-xs text-zinc-400">
            Explora las 4 salas y aparta tus bloques de ensayo en tiempo real.
          </p>
          <div className="pt-2">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 rounded-lg text-white text-xs font-bold hover:bg-orange-600 transition-colors"
            >
              Reservar ahora
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => {
            const id = res.reservacion_id || (res as any).id;
            const salaNombre = res.nombre_sala || `Sala ${res.sala_id}`;
            const fecha = res.fecha_reservacion || (res as any).date;
            const hInicio = (res.hora_inicio || (res as any).start_time || '').slice(0, 5);
            const hFin = (res.hora_fin || (res as any).end_time || '').slice(0, 5);
            const total = res.monto_total ?? (res as any).total_price ?? 0;
            const status = res.estado_reservacion || (res as any).status || 'pending';

            return (
              <div
                key={id}
                className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Volume2 className="w-4 h-4 text-orange-400" />
                    <span className="font-bold text-white text-sm sm:text-base">
                      {salaNombre}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        status === 'confirmed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {status === 'confirmed'
                        ? 'Confirmada'
                        : status === 'pending'
                        ? 'Por Validar (SPEI)'
                        : 'Cancelada'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {fecha}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {hInicio} - {hFin}
                    </span>
                    <span className="text-zinc-600">|</span>
                    <span className="font-mono text-zinc-500 text-[11px]">ID: {id}</span>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                  <span className="text-[11px] text-zinc-500">Monto total</span>
                  <span className="text-lg font-black text-orange-400">${total} MXN</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
